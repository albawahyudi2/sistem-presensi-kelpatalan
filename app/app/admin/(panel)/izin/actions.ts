"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { back, requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { STATUS_LABEL } from "@/lib/format";

const PATH = "/admin/izin";

const schema = z.object({
  userId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: z.enum(["IZIN", "SAKIT"]),
  notes: z.string().trim().max(300).optional(),
});

export async function createLeave(formData: FormData) {
  const admin = await requireAdmin();
  const r = schema.safeParse(Object.fromEntries(formData));
  if (!r.success)
    back(PATH, "error", "Pegawai, tanggal, dan jenis wajib diisi.");

  const date = new Date(`${r.data.date}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) back(PATH, "error", "Tanggal tidak valid.");
  if (
    await db.leave.findUnique({
      where: { userId_date: { userId: r.data.userId, date } },
    })
  ) {
    back(
      PATH,
      "error",
      "Pegawai ini sudah memiliki catatan izin/sakit pada tanggal tersebut.",
    );
  }

  const dayStart = new Date(`${r.data.date}T00:00:00+07:00`);
  const conflict = await db.attendance.findFirst({
    where: {
      userId: r.data.userId,
      type: "IN",
      status: { in: ["ON_TIME", "LATE", "APPROVED", "PENDING_APPROVAL"] },
      capturedAt: {
        gte: dayStart,
        lt: new Date(dayStart.getTime() + 86_400_000),
      },
    },
  });
  if (conflict) {
    back(
      PATH,
      "error",
      `Pegawai sudah presensi masuk pada tanggal itu (${STATUS_LABEL[conflict.status]}). Izin/sakit tidak dapat dicatat pada hari yang sudah ada presensinya.`,
    );
  }

  await db.leave.create({
    data: {
      userId: r.data.userId,
      date,
      kind: r.data.kind,
      notes: r.data.notes || null,
      createdById: admin.id,
    },
  });
  revalidatePath(PATH);
  back(PATH, "ok", "Izin/sakit dicatat.");
}

export async function deleteLeave(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await db.leave.delete({ where: { id } }).catch(() => null);
  revalidatePath(PATH);
  back(PATH, "ok", "Catatan dihapus.");
}
