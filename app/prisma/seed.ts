import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

config({ path: ".env.local" });
config();

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const OFFICE = {
  name: "Kantor Kelurahan Patalan",
  latitude: -7.9285979,
  longitude: 110.349427,
  radius: 50,
};

const DUMMY_EMPLOYEES = [
  {
    nip: "199001012015011001",
    name: "Pegawai Contoh Satu",
    position: "Staf Kelurahan",
  },
  {
    nip: "199002022015012002",
    name: "Pegawai Contoh Dua",
    position: "Staf Kelurahan",
  },
  {
    nip: "199003032015011003",
    name: "Pegawai Contoh Tiga",
    position: "Pamong Kelurahan",
  },
];

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error("ADMIN_INITIAL_PASSWORD wajib diisi (minimal 8 karakter).");
  }

  const office =
    (await db.location.findFirst({ where: { name: OFFICE.name } })) ??
    (await db.location.create({ data: OFFICE }));

  await db.admin.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      name: "Administrator Kelurahan",
      passwordHash: await bcrypt.hash(adminPassword, 10),
      mustChangePassword: true,
    },
  });

  const seedDummy =
    process.env.NODE_ENV !== "production" && process.env.SEED_DUMMY !== "false";
  if (seedDummy) {
    for (const e of DUMMY_EMPLOYEES) {
      const user = await db.user.upsert({
        where: { nip: e.nip },
        update: {},
        create: { ...e, passwordHash: await bcrypt.hash(e.nip, 10) },
      });
      await db.userLocation.upsert({
        where: {
          userId_locationId: { userId: user.id, locationId: office.id },
        },
        update: {},
        create: { userId: user.id, locationId: office.id },
      });
    }
  }

  console.log(
    `Seed selesai: lokasi "${office.name}", admin "${adminUsername}"${
      seedDummy ? `, ${DUMMY_EMPLOYEES.length} pegawai dummy` : ""
    }.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
