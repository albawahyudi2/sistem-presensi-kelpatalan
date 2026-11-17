import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PEGAWAI") {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Penyimpanan foto belum dikonfigurasi." },
      { status: 503 },
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `presensi/${session.user.id}`;
  const type = "authenticated";
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}&type=${type}${apiSecret}`)
    .digest("hex");

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    folder,
    type,
    signature,
  });
}
