import { config } from "dotenv";

config({ path: ".env.local" });
config();

// Pemakaian: npm run photos:orphans [-- --grace-days=7] [-- --delete]
async function main() {
  const arg = (n: string) =>
    process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
  const grace = Number(arg("grace-days") ?? 7);
  const doDelete = process.argv.includes("--delete");

  const { findOrphanPhotos, deleteOrphanPhotos } =
    await import("../lib/photo-orphans");
  const { db } = await import("../lib/db");
  try {
    const orphans = await findOrphanPhotos(grace);
    console.log(
      `Foto yatim (tidak ada di database, umur > ${grace} hari): ${orphans.length}`,
    );
    for (const o of orphans) {
      console.log(
        `- [${o.type}] ${o.publicId}  (${o.createdAt.toISOString()})`,
      );
    }
    if (orphans.length === 0) return;
    if (!doDelete) {
      console.log("\nMode lihat saja. Tambahkan --delete untuk menghapus.");
      return;
    }
    console.log(`Dihapus: ${await deleteOrphanPhotos(orphans)}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
