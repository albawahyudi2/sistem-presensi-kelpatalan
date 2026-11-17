import { configureCloudinary, parsePhotoUrl } from "@/lib/cloudinary";
import { db } from "@/lib/db";

export const ORPHAN_GRACE_DAYS = 7;

type Asset = {
  publicId: string;
  type: "upload" | "authenticated";
  createdAt: Date;
};

async function listAssets(type: Asset["type"]): Promise<Asset[]> {
  const c = configureCloudinary();
  const out: Asset[] = [];
  let cursor: string | undefined;
  do {
    const res = await c.api.resources({
      type,
      prefix: "presensi/",
      max_results: 500,
      next_cursor: cursor,
    });
    for (const r of res.resources as {
      public_id: string;
      created_at: string;
    }[]) {
      out.push({
        publicId: r.public_id,
        type,
        createdAt: new Date(r.created_at),
      });
    }
    cursor = res.next_cursor;
  } while (cursor);
  return out;
}

export async function findOrphanPhotos(graceDays: number, now = new Date()) {
  const rows = await db.attendance.findMany({
    where: { photoUrl: { not: null } },
    select: { photoUrl: true },
  });
  const referenced = new Set(
    rows.map((r) => (r.photoUrl ? parsePhotoUrl(r.photoUrl)?.publicId : null)),
  );
  const cutoff = now.getTime() - graceDays * 24 * 60 * 60 * 1000;

  const assets = [
    ...(await listAssets("authenticated")),
    ...(await listAssets("upload")),
  ];
  return assets.filter(
    (a) => !referenced.has(a.publicId) && a.createdAt.getTime() <= cutoff,
  );
}

export async function deleteOrphanPhotos(orphans: Asset[], limit = 500) {
  const c = configureCloudinary();
  let deleted = 0;
  for (const type of ["authenticated", "upload"] as const) {
    const ids = orphans
      .filter((o) => o.type === type)
      .map((o) => o.publicId)
      .slice(0, Math.max(0, limit - deleted));
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      await c.api.delete_resources(batch, { type, invalidate: true });
      deleted += batch.length;
    }
  }
  return deleted;
}
