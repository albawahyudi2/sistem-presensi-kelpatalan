"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { back, requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

const PATH = "/admin/libur";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function createHoliday(formData: FormData) {
  await requireAdmin();
  const r = schema.safeParse(Object.fromEntries(formData));
  if (!r.success) back(PATH, "error", "Nama dan tanggal wajib diisi.");
  const date = new Date(`${r.data.date}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) back(PATH, "error", "Tanggal tidak valid.");

  await db.holiday.create({
    data: {
      name: r.data.name,
      date,
      isRecurring: formData.get("isRecurring") === "on",
    },
  });
  revalidatePath(PATH);
  back(PATH, "ok", "Hari libur ditambahkan.");
}

export async function deleteHoliday(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await db.holiday.delete({ where: { id } }).catch(() => null);
  revalidatePath(PATH);
  back(PATH, "ok", "Hari libur dihapus.");
}
