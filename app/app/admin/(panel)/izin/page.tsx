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
import { wibDateKey } from "@/lib/work-time";
import { createLeave, deleteLeave } from "./actions";

export default async function IzinPage({
  searchParams,
}: {
  searchParams: Flash;
}) {
  const { ok, error } = await searchParams;
  const [users, leaves] = await Promise.all([
    db.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.leave.findMany({
      orderBy: { date: "desc" },
      take: 100,
      include: { user: true, createdBy: true },
    }),
  ]);

  const conflicts = new Set<string>();
  if (leaves.length > 0) {
    const minKey = leaves[leaves.length - 1].date.toISOString().slice(0, 10);
    const maxKey = leaves[0].date.toISOString().slice(0, 10);
    const atts = await db.attendance.findMany({
      where: {
        type: "IN",
        status: { in: ["ON_TIME", "LATE", "APPROVED", "PENDING_APPROVAL"] },
        userId: { in: leaves.map((l) => l.userId) },
        capturedAt: {
          gte: new Date(`${minKey}T00:00:00+07:00`),
          lt: new Date(
            new Date(`${maxKey}T00:00:00+07:00`).getTime() + 86_400_000,
          ),
        },
      },
      select: { userId: true, capturedAt: true },
    });
    for (const a of atts)
      conflicts.add(`${a.userId}|${wibDateKey(a.capturedAt)}`);
  }

  return (
    <>
      <PageTitle
        title="Izin / Sakit"
        subtitle="Catat ketidakhadiran bersurat. Hari ini tidak dihitung Alpha pada rekap."
      />
      <Banner ok={ok} error={error} />

      <form
        action={createLeave}
        className="mb-8 space-y-3 rounded-xl border p-4"
      >
        <p className="text-sm font-medium">Catat izin / sakit</p>
        <div className="grid gap-2 sm:grid-cols-4">
          <select name="userId" required className={field} defaultValue="">
            <option value="" disabled>
              Pilih pegawai
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.nip})
              </option>
            ))}
          </select>
          <input
            name="date"
            type="date"
            defaultValue={wibDateKey(new Date())}
            required
            className={field}
          />
          <select name="kind" className={field} defaultValue="SAKIT">
            <option value="SAKIT">Sakit</option>
            <option value="IZIN">Izin</option>
          </select>
          <input
            name="notes"
            placeholder="Keterangan (opsional)"
            maxLength={300}
            className={field}
          />
        </div>
        <button className={btn}>Simpan</button>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className={th}>Tanggal</th>
              <th className={th}>Pegawai</th>
              <th className={th}>Jenis</th>
              <th className={th}>Keterangan</th>
              <th className={th}>Dicatat oleh</th>
              <th className={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l.id} className="border-t">
                <td className={td}>
                  {fmtDateKey(l.date.toISOString().slice(0, 10))}
                </td>
                <td className={td}>{l.user.name}</td>
                <td className={td}>{l.kind === "SAKIT" ? "Sakit" : "Izin"}</td>
                <td className={td}>
                  {l.notes ?? "-"}
                  {conflicts.has(
                    `${l.userId}|${l.date.toISOString().slice(0, 10)}`,
                  ) && (
                    <span className="mt-1 block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                      Bentrok: pegawai sudah presensi pada tanggal ini
                    </span>
                  )}
                </td>
                <td className={td}>{l.createdBy.name}</td>
                <td className={td}>
                  <form action={deleteLeave}>
                    <input type="hidden" name="id" value={l.id} />
                    <ConfirmButton
                      className={btnDanger}
                      title="Hapus catatan izin/sakit?"
                      message={`Catatan ${l.kind === "SAKIT" ? "sakit" : "izin"} ${l.user.name} akan dihapus. Hari itu kembali dihitung Alpha bila tidak ada presensi.`}
                      confirmLabel="Ya, hapus"
                    >
                      Hapus
                    </ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
            {leaves.length === 0 && (
              <tr>
                <td className={td} colSpan={6}>
                  <EmptyState
                    title="Belum ada catatan izin atau sakit"
                    hint="Catat pegawai yang sakit atau izin lewat formulir di atas agar hari itu tidak dihitung Alpha."
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
