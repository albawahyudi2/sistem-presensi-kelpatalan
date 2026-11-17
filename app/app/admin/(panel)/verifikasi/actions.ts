"use server";

import { revalidatePath } from "next/cache";
import { back, requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

const PATH = "/admin/verifikasi";

export async function decideDinasLuar(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (decision !== "approve" && decision !== "reject") {
    back(PATH, "error", "Keputusan tidak valid.");
  }
  if (decision === "reject" && !note) {
    back(PATH, "error", "Alasan penolakan wajib diisi.");
  }

  const result = await db.attendance.updateMany({
    where: {
      id,
      type: "IN",
      category: "DINAS_LUAR",
      status: "PENDING_APPROVAL",
    },
    data: {
      status: decision === "approve" ? "APPROVED" : "REJECTED",
      decidedById: admin.id,
      decidedAt: new Date(),
      decisionNote: note || null,
    },
  });
  if (result.count === 0) {
    back(PATH, "error", "Pengajuan tidak ditemukan atau sudah diputuskan.");
  }
  revalidatePath(PATH);
  back(
    PATH,
    "ok",
    decision === "approve" ? "Dinas Luar disetujui." : "Dinas Luar ditolak.",
  );
}
