import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

config({ path: ".env.local" });
config();

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((a) => a.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const username = arg("username");
  const name = arg("name");
  const password = arg("password");
  if (!username || !name || !password || password.length < 8) {
    throw new Error(
      'Pemakaian: npm run admin:add -- --username=budi --name="Budi Santoso" --password=MINIMAL8KARAKTER',
    );
  }

  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    if (await db.admin.findUnique({ where: { username } })) {
      throw new Error(`Username "${username}" sudah dipakai.`);
    }
    await db.admin.create({
      data: {
        username,
        name,
        passwordHash: await bcrypt.hash(password, 10),
        mustChangePassword: true,
      },
    });
    console.log(
      `Admin "${username}" dibuat. Wajib ganti password saat login pertama.`,
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
