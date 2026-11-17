"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { back, backWith, requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { validateEmployeeId } from "@/lib/employee-id";

const PATH = "/admin/pegawai";

const base = {
  name: z.string().trim().min(2).max(100),
  position: z.string().trim().min(2).max(100),
};
const createSchema = z.object({
  nip: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{4,30}$/, "NIP 4-30 karakter huruf/angka"),
  ...base,
});
const updateSchema = z.object(base);

function locationIds(fd: FormData): string[] {
  return [...new Set(fd.getAll("locationIds").map(String))];
}

export async function createEmployee(formData: FormData) {
  await requireAdmin();
  const nip = String(formData.get("nip") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const locs = locationIds(formData);
  const keep = { nip, name, position, loc: locs };

  const idCheck = validateEmployeeId(nip);
  if (!idCheck.ok) backWith(PATH, "error", idCheck.message, keep);

  const r = createSchema.safeParse({ nip, name, position });
  if (!r.success) {
    backWith(
      PATH,
      "error",
      "Nama dan jabatan wajib diisi (minimal 2 karakter).",
      keep,
    );
  }
  if (locs.length === 0) {
    backWith(PATH, "error", "Pilih minimal satu lokasi penugasan.", keep);
  }
  if (await db.user.findUnique({ where: { nip: r.data.nip } })) {
    backWith(PATH, "error", "NIP sudah terdaftar.", keep);
  }

  await db.user.create({
    data: {
      ...r.data,
      passwordHash: await bcrypt.hash(r.data.nip, 10),
      mustChangePassword: true,
      locations: { create: locs.map((locationId) => ({ locationId })) },
    },
  });
  revalidatePath(PATH);
  back(PATH, "ok", "Pegawai ditambahkan. Password awal sama dengan NIP.");
}

export async function updateEmployee(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const r = updateSchema.safeParse(Object.fromEntries(formData));
  const locs = locationIds(formData);
  if (!id || !r.success) back(PATH, "error", "Nama dan jabatan wajib diisi.");
  if (locs.length === 0)
    back(PATH, "error", "Pilih minimal satu lokasi penugasan.");

  await db.$transaction([
    db.user.update({ where: { id }, data: r.data }),
    db.userLocation.deleteMany({ where: { userId: id } }),
    db.userLocation.createMany({
      data: locs.map((locationId) => ({ userId: id, locationId })),
    }),
  ]);
  revalidatePath(PATH);
  back(PATH, "ok", "Data pegawai diperbarui.");
}

export async function toggleEmployeeActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const user = await db.user.findUnique({ where: { id } });
  if (!user) back(PATH, "error", "Pegawai tidak ditemukan.");
  await db.user.update({ where: { id }, data: { isActive: !user.isActive } });
  revalidatePath(PATH);
  back(
    PATH,
    "ok",
    user.isActive ? "Pegawai dinonaktifkan." : "Pegawai diaktifkan kembali.",
  );
}

export async function resetEmployeePassword(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const user = await db.user.findUnique({ where: { id } });
  if (!user) back(PATH, "error", "Pegawai tidak ditemukan.");
  await db.user.update({
    where: { id },
    data: {
      passwordHash: await bcrypt.hash(user.nip, 10),
      mustChangePassword: true,
    },
  });
  back(
    PATH,
    "ok",
    `Password ${user.name} dikembalikan ke NIP dan wajib diganti saat login.`,
  );
}
