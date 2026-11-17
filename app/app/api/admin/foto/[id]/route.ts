import { NextResponse, type NextRequest } from "next/server";
import { getActiveAdmin } from "@/lib/admin-guard";
import { deliveryUrl, parsePhotoUrl } from "@/lib/cloudinary";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getActiveAdmin();
  if (!admin) return NextResponse.json({ error: "Dilarang" }, { status: 403 });

  const { id } = await ctx.params;
  const variant =
    req.nextUrl.searchParams.get("v") === "full" ? "full" : "thumb";

  const row = await db.attendance.findUnique({
    where: { id },
    select: { photoUrl: true, category: true },
  });
  const ref = row?.photoUrl ? parsePhotoUrl(row.photoUrl) : null;
  if (!row || !ref) {
    return NextResponse.json(
      { error: "Foto tidak ditemukan" },
      { status: 404 },
    );
  }

  const upstream = await fetch(
    deliveryUrl(ref, variant, row.category === "HADIR"),
  );
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Foto tidak tersedia" }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "image/webp",
      "cache-control": "private, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}
