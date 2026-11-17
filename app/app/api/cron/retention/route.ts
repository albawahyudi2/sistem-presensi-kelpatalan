import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { configureCloudinary, parsePhotoUrl } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import {
  deleteOrphanPhotos,
  findOrphanPhotos,
  ORPHAN_GRACE_DAYS,
} from "@/lib/photo-orphans";
import { loginAttemptCutoff, retentionCutoff } from "@/lib/retention";

export const dynamic = "force-dynamic";

const BATCH = 200;

const digest = (s: string) => createHash("sha256").update(s).digest();

async function destroyPhoto(url: string): Promise<boolean> {
  const ref = parsePhotoUrl(url);
  if (!ref) return false;
  try {
    const result = await configureCloudinary().uploader.destroy(ref.publicId, {
      type: ref.type,
      invalidate: true,
    });
    return result.result === "ok" || result.result === "not found";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET belum diatur" },
      { status: 503 },
    );
  }
  const provided = req.headers.get("authorization") ?? "";
  if (!timingSafeEqual(digest(provided), digest(`Bearer ${secret}`))) {
    return NextResponse.json({ error: "Dilarang" }, { status: 401 });
  }

  const now = new Date();
  const rows = await db.attendance.findMany({
    where: {
      photoUrl: { not: null },
      createdAt: { lt: retentionCutoff(now) },
      status: { not: "PENDING_APPROVAL" },
    },
    select: { id: true, photoUrl: true },
    orderBy: { createdAt: "asc" },
    take: BATCH,
  });

  let deleted = 0;
  let failed = 0;
  for (const row of rows) {
    if (row.photoUrl && (await destroyPhoto(row.photoUrl))) {
      await db.attendance.update({
        where: { id: row.id },
        data: { photoUrl: null },
      });
      deleted++;
    } else {
      failed++;
    }
  }

  const attempts = await db.loginAttempt.deleteMany({
    where: { createdAt: { lt: loginAttemptCutoff(now) } },
  });

  let orphansDeleted = 0;
  try {
    orphansDeleted = await deleteOrphanPhotos(
      await findOrphanPhotos(ORPHAN_GRACE_DAYS, now),
    );
  } catch {
    // pembersihan foto yatim dicoba lagi pada jadwal berikutnya
  }

  return NextResponse.json({
    checked: rows.length,
    deleted,
    failed,
    orphansDeleted,
    loginAttemptsDeleted: attempts.count,
  });
}
