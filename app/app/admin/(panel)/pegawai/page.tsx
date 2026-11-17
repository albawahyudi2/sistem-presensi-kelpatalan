import {
  Banner,
  PageTitle,
  btn,
  btnDanger,
  btnGhost,
  field,
  td,
  th,
} from "@/components/admin-ui";
import { ConfirmButton } from "@/components/confirm";
import { EmptyState } from "@/components/admin-ui";
import { db } from "@/lib/db";
import {
  createEmployee,
  resetEmployeePassword,
  toggleEmployeeActive,
  updateEmployee,
} from "./actions";

type Loc = { id: string; name: string };

function LocationChecks({
  locations,
  selected,
}: {
  locations: Loc[];
  selected?: Set<string>;
}) {
  return (
    <fieldset className="flex flex-wrap gap-3">
      <legend className="text-muted-foreground mb-1 text-xs">
        Lokasi penugasan (minimal satu)
      </legend>
      {locations.map((l) => (
        <label key={l.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="locationIds"
            value={l.id}
            defaultChecked={selected?.has(l.id)}
          />
          {l.name}
        </label>
      ))}
    </fieldset>
  );
}

type Prefill = {
  ok?: string;
  error?: string;
  nip?: string;
  name?: string;
  position?: string;
  loc?: string | string[];
};

export default async function PegawaiPage({
  searchParams,
}: {
  searchParams: Promise<Prefill>;
}) {
  const sp = await searchParams;
  const { ok, error } = sp;
  const prefillLoc = new Set(
    sp.loc === undefined ? [] : Array.isArray(sp.loc) ? sp.loc : [sp.loc],
  );
  const [users, locations] = await Promise.all([
    db.user.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: { locations: { include: { location: true } } },
    }),
    db.location.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageTitle
        title="Pegawai"
        subtitle="Akun dibuat admin. Password awal sama dengan NIP dan wajib diganti saat login pertama."
      />
      <Banner ok={ok} error={error} />

      {locations.length === 0 ? (
        <p className="mb-8 rounded-xl border p-4 text-sm">
          Tambahkan lokasi penugasan terlebih dahulu di menu Lokasi.
        </p>
      ) : (
        <form
          action={createEmployee}
          className="mb-8 space-y-3 rounded-xl border p-4"
        >
          <p className="text-sm font-medium">Tambah pegawai</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              name="nip"
              placeholder="NIP (18 digit) atau ID non-PNS"
              defaultValue={sp.nip}
              required
              className={field}
            />
            <input
              name="name"
              placeholder="Nama lengkap"
              defaultValue={sp.name}
              required
              className={field}
            />
            <input
              name="position"
              placeholder="Jabatan / Dusun"
              defaultValue={sp.position}
              required
              className={field}
            />
          </div>
          <LocationChecks locations={locations} selected={prefillLoc} />
          <button className={btn}>Simpan</button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className={th}>NIP</th>
              <th className={th}>Nama</th>
              <th className={th}>Jabatan</th>
              <th className={th}>Lokasi</th>
              <th className={th}>Status</th>
              <th className={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className={`border-t ${u.isActive ? "" : "opacity-60"}`}
              >
                <td className={td}>{u.nip}</td>
                <td className={td}>{u.name}</td>
                <td className={td}>{u.position}</td>
                <td className={td}>
                  {u.locations.map((l) => l.location.name).join(", ")}
                </td>
                <td className={td}>
                  {u.isActive ? "Aktif" : "Nonaktif"}
                  {u.mustChangePassword && (
                    <span className="text-muted-foreground block text-xs">
                      belum ganti password
                    </span>
                  )}
                </td>
                <td className={td}>
                  <div className="flex flex-wrap gap-2">
                    <details>
                      <summary className={`${btnGhost} cursor-pointer`}>
                        Ubah
                      </summary>
                      <form
                        action={updateEmployee}
                        className="mt-2 w-72 space-y-2"
                      >
                        <input type="hidden" name="id" value={u.id} />
                        <input
                          name="name"
                          defaultValue={u.name}
                          required
                          className={field}
                        />
                        <input
                          name="position"
                          defaultValue={u.position}
                          required
                          className={field}
                        />
                        <LocationChecks
                          locations={locations}
                          selected={
                            new Set(u.locations.map((l) => l.locationId))
                          }
                        />
                        <button className={btn}>Simpan</button>
                      </form>
                    </details>
                    <form action={resetEmployeePassword}>
                      <input type="hidden" name="id" value={u.id} />
                      <ConfirmButton
                        className={btnGhost}
                        destructive={false}
                        title="Reset password?"
                        message={`Password ${u.name} dikembalikan ke NIP dan wajib diganti saat login berikutnya.`}
                        confirmLabel="Ya, reset"
                      >
                        Reset password
                      </ConfirmButton>
                    </form>
                    <form action={toggleEmployeeActive}>
                      <input type="hidden" name="id" value={u.id} />
                      {u.isActive ? (
                        <ConfirmButton
                          className={btnDanger}
                          title="Nonaktifkan pegawai?"
                          message={`${u.name} tidak dapat login dan presensi lagi. Riwayat tetap tersimpan dan akun dapat diaktifkan kembali.`}
                          confirmLabel="Ya, nonaktifkan"
                        >
                          Nonaktifkan
                        </ConfirmButton>
                      ) : (
                        <button className={btnGhost}>Aktifkan</button>
                      )}
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <EmptyState
          title="Belum ada pegawai"
          hint="Tambahkan pegawai lewat formulir di atas. Password awal sama dengan NIP dan wajib diganti saat login pertama."
          href="/admin/lokasi"
          hrefLabel="Cek lokasi penugasan"
        />
      )}
    </>
  );
}
