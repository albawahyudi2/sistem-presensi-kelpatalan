"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/auth";
import { deviceSignatureFrom } from "@/lib/device";
import { recordAttendance } from "@/lib/attendance-service";

const payloadSchema = z.object({
  type: z.enum(["IN", "OUT"]),
  category: z.enum(["HADIR", "DINAS_LUAR"]),
  latitude: z.number().finite(),
  longitude: z.number().finite(),
  accuracy: z.number().finite().nonnegative().nullable(),
  photoUrl: z.string().url().max(500).nullable(),
  notes: z.string().max(500).nullable(),
  capturedAt: z.string().refine((s) => !Number.isNaN(Date.parse(s))),
  isOfflineSync: z.boolean(),
  idempotencyKey: z.string().min(8).max(64),
});

export type SubmitResult = { ok: boolean; message: string };

export async function submitAttendance(
  payload: unknown,
): Promise<SubmitResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "PEGAWAI") {
    return { ok: false, message: "Sesi berakhir. Silakan login kembali." };
  }

  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success)
    return { ok: false, message: "Data presensi tidak valid." };
  const p = parsed.data;

  const result = await recordAttendance(session.user.id, {
    ...p,
    capturedAt: new Date(p.capturedAt),
    deviceSignature: deviceSignatureFrom(await headers()),
  });

  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/");

  if (result.rejected) {
    return {
      ok: false,
      message:
        "Presensi offline ditolak oleh server (lokasi/waktu tidak valid).",
    };
  }
  if (result.duplicate)
    return { ok: true, message: "Presensi sudah tercatat." };
  if (p.type === "OUT")
    return {
      ok: true,
      message: "Presensi pulang tercatat. Hati-hati di jalan.",
    };
  if (result.status === "PENDING_APPROVAL") {
    return {
      ok: true,
      message: "Dinas Luar tercatat, menunggu verifikasi admin.",
    };
  }
  return {
    ok: true,
    message:
      result.status === "LATE"
        ? `Presensi masuk tercatat. Terlambat ${result.lateMinutes} menit.`
        : "Presensi masuk tercatat tepat waktu.",
  };
}
