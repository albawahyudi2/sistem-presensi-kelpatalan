"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { back, requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

const PATH = "/admin/lokasi";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(50).max(150),
});

export async function createLocation(formData: FormData) {
  await requireAdmin();
  const r = schema.safeParse(Object.fromEntries(formData));
  if (!r.success) {
    back(PATH, "error", "Data tidak valid. Radius harus 50-150 meter.");
  }
  await db.location.create({ data: r.data });
  revalidatePath(PATH);
  back(PATH, "ok", "Lokasi ditambahkan.");
}

export async function updateLocation(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const r = schema.safeParse(Object.fromEntries(formData));
  if (!id || !r.success) {
    back(PATH, "error", "Data tidak valid. Radius harus 50-150 meter.");
  }
  await db.location.update({ where: { id }, data: r.data });
  revalidatePath(PATH);
  back(PATH, "ok", "Lokasi diperbarui.");
}

export async function deleteLocation(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const [users, records] = await Promise.all([
    db.userLocation.count({ where: { locationId: id } }),
    db.attendance.count({ where: { locationId: id } }),
  ]);
  if (users > 0) {
    back(
      PATH,
      "error",
      `Lokasi masih ditugaskan ke ${users} pegawai (termasuk yang nonaktif). Ubah penugasan mereka dulu.`,
    );
  }
  if (records > 0) {
    back(
      PATH,
      "error",
      "Lokasi sudah tercatat pada data presensi dan tidak dapat dihapus.",
    );
  }
  await db.location.delete({ where: { id } });
  revalidatePath(PATH);
  back(PATH, "ok", "Lokasi dihapus.");
}
