import {
  Banner,
  PageTitle,
  btn,
  btnDanger,
  field,
  td,
  th,
  type Flash,
} from "@/components/admin-ui";
import { ConfirmButton } from "@/components/confirm";
import { EmptyState } from "@/components/admin-ui";
import { db } from "@/lib/db";
import { fmtDateKey } from "@/lib/format";
import { createHoliday, deleteHoliday } from "./actions";

export default async function LiburPage({
  searchParams,
}: {
  searchParams: Flash;
}) {
  const { ok, error } = await searchParams;
  const holidays = await db.holiday.findMany({ orderBy: { date: "desc" } });

  return (
    <>
      <PageTitle
        title="Hari Libur"
        subtitle="Tanggal merah nasional dan agenda lokal (mis. Merti Desa). Pada hari ini presensi ditutup dan Alpha tidak dihitung."
      />
      <Banner ok={ok} error={error} />

      <form
        action={createHoliday}
        className="mb-8 space-y-3 rounded-xl border p-4"
      >
        <p className="text-sm font-medium">Tambah hari libur</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            name="name"
            placeholder="Nama (mis. Idul Fitri)"
            required
            className={field}
          />
          <input name="date" type="date" required className={field} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isRecurring" /> Berulang setiap tahun
          (mis. 17 Agustus)
        </label>
        <button className={btn}>Simpan</button>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className={th}>Tanggal</th>
              <th className={th}>Nama</th>
              <th className={th}>Berulang</th>
              <th className={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((h) => (
              <tr key={h.id} className="border-t">
                <td className={td}>
                  {fmtDateKey(h.date.toISOString().slice(0, 10))}
                </td>
                <td className={td}>{h.name}</td>
                <td className={td}>{h.isRecurring ? "Ya" : "Tidak"}</td>
                <td className={td}>
                  <form action={deleteHoliday}>
                    <input type="hidden" name="id" value={h.id} />
                    <ConfirmButton
                      className={btnDanger}
                      title="Hapus hari libur?"
                      message={`"${h.name}" akan dihapus. Pada tanggal itu presensi dibuka kembali dan pegawai yang tidak hadir dihitung Alpha.`}
                      confirmLabel="Ya, hapus"
                    >
                      Hapus
                    </ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
            {holidays.length === 0 && (
              <tr>
                <td className={td} colSpan={4}>
                  <EmptyState
                    title="Belum ada hari libur"
                    hint="Tambahkan tanggal merah nasional dan agenda lokal (mis. Merti Desa) lewat formulir di atas agar presensi ditutup dan Alpha tidak dihitung pada hari itu."
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
