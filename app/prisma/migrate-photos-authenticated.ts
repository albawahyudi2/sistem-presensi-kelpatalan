import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { configureCloudinary, parsePhotoUrl } from "../lib/cloudinary";

config({ path: ".env.local" });
config();

// Memindahkan foto lama bertipe "upload" (publik) menjadi "authenticated".
async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const cloudinary = configureCloudinary();
  let moved = 0;
  let failed = 0;
  try {
    const rows = await db.attendance.findMany({
      where: { photoUrl: { contains: "/image/upload/" } },
      select: { id: true, photoUrl: true },
    });
    for (const row of rows) {
      const ref = row.photoUrl ? parsePhotoUrl(row.photoUrl) : null;
      if (!ref || ref.type !== "upload") continue;
      try {
        const res = await cloudinary.uploader.rename(
          ref.publicId,
          ref.publicId,
          {
            type: "upload",
            to_type: "authenticated",
            overwrite: true,
            invalidate: true,
          },
        );
        await db.attendance.update({
          where: { id: row.id },
          data: { photoUrl: res.secure_url },
        });
        moved++;
      } catch (e) {
        failed++;
        console.error(
          `Gagal memindahkan ${ref.publicId}:`,
          (e as Error).message,
        );
      }
    }
    console.log(
      `Selesai: ${moved} foto dipindah ke authenticated, ${failed} gagal.`,
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
