import {
  Banner,
  PageTitle,
  btn,
  btnDanger,
  field,
  type Flash,
} from "@/components/admin-ui";
import { EmptyState } from "@/components/admin-ui";
import { db } from "@/lib/db";
import { fmtDate, fmtTime, STATUS_LABEL } from "@/lib/format";
import { decideDinasLuar } from "./actions";

export default async function VerifikasiPage({
  searchParams,
}: {
  searchParams: Flash;
}) {
  const { ok, error } = await searchParams;
  const [pending, recent] = await Promise.all([
    db.attendance.findMany({
      where: { type: "IN", category: "DINAS_LUAR", status: "PENDING_APPROVAL" },
      orderBy: { capturedAt: "asc" },
      include: { user: true },
    }),
    db.attendance.findMany({
      where: {
        type: "IN",
        category: "DINAS_LUAR",
        status: { in: ["APPROVED", "REJECTED"] },
      },
      orderBy: { decidedAt: "desc" },
      take: 15,
      include: { user: true, decidedBy: true },
    }),
  ]);

  return (
    <>
      <PageTitle
        title="Verifikasi Dinas Luar"
        subtitle="Tinjau foto kegiatan dan catatan, lalu setujui atau tolak. Hanya yang disetujui dihitung hadir."
      />
      <Banner ok={ok} error={error} />

      <div className="grid gap-4 lg:grid-cols-2">
        {pending.map((a) => (
          <article key={a.id} className="space-y-3 rounded-xl border p-4">
            <div className="flex gap-3">
              {a.photoUrl && (
                <a
                  href={`/api/admin/foto/${a.id}?v=full`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/admin/foto/${a.id}?v=thumb`}
                    alt="Foto kegiatan"
                    width={96}
                    height={96}
                    className="size-24 rounded-lg object-cover"
                  />
                </a>
              )}
              <div className="min-w-0 space-y-1 text-sm">
                <p className="font-semibold">{a.user.name}</p>
                <p className="text-muted-foreground text-xs">
                  {a.user.nip} · {fmtDate(a.capturedAt)} {fmtTime(a.capturedAt)}{" "}
                  WIB
                </p>
                <p className="break-words">{a.notes}</p>
                <a
                  className="text-xs underline"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                >
                  Lihat lokasi{a.isOfflineSync ? " (dikirim offline)" : ""}
                </a>
              </div>
            </div>
            <form action={decideDinasLuar} className="space-y-2">
              <input type="hidden" name="id" value={a.id} />
              <input
                name="note"
                placeholder="Catatan / alasan (wajib bila menolak)"
                className={field}
              />
              <div className="flex gap-2">
                <button name="decision" value="approve" className={btn}>
                  Setujui
                </button>
                <button name="decision" value="reject" className={btnDanger}>
                  Tolak
                </button>
              </div>
            </form>
          </article>
        ))}
        {pending.length === 0 && (
          <div className="lg:col-span-2">
            <EmptyState
              title="Tidak ada pengajuan yang menunggu"
              hint="Pengajuan Dinas Luar dari pegawai akan muncul di sini untuk disetujui atau ditolak. Hanya yang disetujui dihitung hadir."
            />
          </div>
        )}
      </div>

      <h2 className="mt-10 mb-3 text-lg font-semibold">Keputusan terakhir</h2>
      <ul className="divide-y rounded-xl border text-sm">
        {recent.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
          >
            <span>
              {a.user.name} · {fmtDate(a.capturedAt)}
            </span>
            <span className="text-muted-foreground text-xs">
              {STATUS_LABEL[a.status]} oleh {a.decidedBy?.name ?? "-"}
              {a.decisionNote ? ` · ${a.decisionNote}` : ""}
            </span>
          </li>
        ))}
        {recent.length === 0 && (
          <li className="px-4 py-3">Belum ada keputusan.</li>
        )}
      </ul>
    </>
  );
}
