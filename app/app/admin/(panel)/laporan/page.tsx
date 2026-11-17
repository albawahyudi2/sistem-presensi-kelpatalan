import {
  Banner,
  PageTitle,
  btn,
  btnGhost,
  field,
  td,
  th,
} from "@/components/admin-ui";
import { EmptyState } from "@/components/admin-ui";
import { db } from "@/lib/db";
import { fmtDateKey } from "@/lib/format";
import { parseRange } from "@/lib/report-params";
import { loadRecap } from "@/lib/report-service";

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; lokasi?: string }>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp.from, sp.to);
  const locationId = sp.lokasi || undefined;

  const [locations, recap] = await Promise.all([
    db.location.findMany({ orderBy: { name: "asc" } }),
    loadRecap({ from: range.from, to: range.to, locationId }),
  ]);

  const qs = new URLSearchParams({ from: range.from, to: range.to });
  if (locationId) qs.set("lokasi", locationId);

  return (
    <>
      <PageTitle
        title="Laporan Presensi"
        subtitle={`Rekap ${fmtDateKey(range.from)} s.d. ${fmtDateKey(range.to)}. Hari kerja efektif tidak termasuk akhir pekan, hari libur, dan hari yang belum selesai.`}
      />
      <Banner error={range.error} />

      <form className="mb-6 flex flex-wrap items-end gap-2">
        <label className="space-y-1 text-xs">
          Dari
          <input
            type="date"
            name="from"
            defaultValue={range.from}
            className={field}
          />
        </label>
        <label className="space-y-1 text-xs">
          Sampai
          <input
            type="date"
            name="to"
            defaultValue={range.to}
            className={field}
          />
        </label>
        <label className="space-y-1 text-xs">
          Lokasi / padukuhan
          <select
            name="lokasi"
            defaultValue={locationId ?? ""}
            className={field}
          >
            <option value="">Semua</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <button className={btn}>Tampilkan</button>
        <a href={`/api/admin/laporan?${qs}`} className={btnGhost}>
          Unduh Excel (.xlsx)
        </a>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {[
                "No",
                "NIP",
                "Nama",
                "Jabatan/Dusun",
                "Hadir",
                "Terlambat (menit)",
                "Dinas Luar",
                "Izin/Sakit",
                "Alpha",
                "% Kehadiran",
              ].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recap.rows.map((r, i) => (
              <tr key={r.userId} className="border-t">
                <td className={td}>{i + 1}</td>
                <td className={td}>{r.nip}</td>
                <td className={td}>
                  {r.name}
                  {r.pendingDinasLuar > 0 && (
                    <span className="text-muted-foreground block text-xs">
                      {r.pendingDinasLuar} Dinas Luar belum diverifikasi
                    </span>
                  )}
                </td>
                <td className={td}>{r.position}</td>
                <td className={td}>{r.hadir}</td>
                <td className={td}>{r.lateMinutes}</td>
                <td className={td}>{r.dinasLuar}</td>
                <td className={td}>{r.izinSakit}</td>
                <td className={td}>{r.alpha}</td>
                <td className={td}>{r.percentage.toFixed(2)}%</td>
              </tr>
            ))}
            {recap.rows.length === 0 && (
              <tr>
                <td className={td} colSpan={10}>
                  <EmptyState
                    title="Tidak ada data pada rentang ini"
                    hint="Perluas rentang tanggal atau pilih Semua lokasi. Pastikan pegawai sudah ditambahkan."
                    href="/admin/pegawai"
                    hrefLabel="Kelola Pegawai"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
