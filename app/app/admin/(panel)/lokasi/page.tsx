import {
  Banner,
  PageTitle,
  btn,
  btnDanger,
  btnGhost,
  field,
  td,
  th,
  type Flash,
} from "@/components/admin-ui";
import { ConfirmButton } from "@/components/confirm";
import { EmptyState } from "@/components/admin-ui";
import { db } from "@/lib/db";
import { createLocation, deleteLocation, updateLocation } from "./actions";

function LocationFields({
  l,
}: {
  l?: { name: string; latitude: number; longitude: number; radius: number };
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <input
        name="name"
        placeholder="Nama (mis. Padukuhan Bobok)"
        defaultValue={l?.name}
        required
        className={field}
      />
      <input
        name="latitude"
        type="number"
        step="any"
        placeholder="Latitude"
        defaultValue={l?.latitude}
        required
        className={field}
      />
      <input
        name="longitude"
        type="number"
        step="any"
        placeholder="Longitude"
        defaultValue={l?.longitude}
        required
        className={field}
      />
      <input
        name="radius"
        type="number"
        min={50}
        max={150}
        placeholder="Radius (50-150 m)"
        defaultValue={l?.radius ?? 100}
        required
        className={field}
      />
    </div>
  );
}

export default async function LokasiPage({
  searchParams,
}: {
  searchParams: Flash;
}) {
  const { ok, error } = await searchParams;
  const locations = await db.location.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: { where: { user: { isActive: true } } } } },
    },
  });

  return (
    <>
      <PageTitle
        title="Lokasi Penugasan"
        subtitle="Kantor kelurahan dan padukuhan beserta radius presensi (50-150 meter)."
      />
      <Banner ok={ok} error={error} />

      <form
        action={createLocation}
        className="mb-8 space-y-3 rounded-xl border p-4"
      >
        <p className="text-sm font-medium">Tambah lokasi</p>
        <LocationFields />
        <p className="text-muted-foreground text-xs">
          Tip: buka Google Maps, tekan lama pada titik lokasi, lalu salin angka
          koordinatnya.
        </p>
        <button className={btn}>Simpan</button>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className={th}>Nama</th>
              <th className={th}>Koordinat</th>
              <th className={th}>Radius</th>
              <th className={th}>Pegawai aktif</th>
              <th className={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((l) => (
              <tr key={l.id} className="border-t">
                <td className={td}>{l.name}</td>
                <td className={td}>
                  <a
                    className="underline"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.google.com/maps?q=${l.latitude},${l.longitude}`}
                  >
                    {l.latitude.toFixed(6)}, {l.longitude.toFixed(6)}
                  </a>
                </td>
                <td className={td}>{l.radius} m</td>
                <td className={td}>{l._count.users}</td>
                <td className={td}>
                  <details>
                    <summary className={`${btnGhost} cursor-pointer`}>
                      Ubah
                    </summary>
                    <form action={updateLocation} className="mt-2 space-y-2">
                      <input type="hidden" name="id" value={l.id} />
                      <LocationFields l={l} />
                      <button className={btn}>Simpan perubahan</button>
                    </form>
                  </details>
                  <form action={deleteLocation} className="mt-2">
                    <input type="hidden" name="id" value={l.id} />
                    <ConfirmButton
                      className={btnDanger}
                      title="Hapus lokasi?"
                      message={`Lokasi "${l.name}" akan dihapus permanen. Lokasi yang masih ditugaskan ke pegawai atau sudah tercatat pada presensi tidak dapat dihapus.`}
                      confirmLabel="Ya, hapus"
                    >
                      Hapus
                    </ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
            {locations.length === 0 && (
              <tr>
                <td className={td} colSpan={5}>
                  <EmptyState
                    title="Belum ada lokasi"
                    hint="Tambahkan Kantor Kelurahan dan padukuhan lewat formulir di atas. Setiap pegawai membutuhkan minimal satu lokasi penugasan."
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
