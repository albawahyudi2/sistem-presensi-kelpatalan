import { PageTitle, btn, field } from "@/components/admin-ui";
import { dayRange } from "@/lib/attendance-service";
import { EmptyState } from "@/components/admin-ui";
import { db } from "@/lib/db";
import { fmtTime, STATUS_LABEL } from "@/lib/format";
import { wibDateKey } from "@/lib/work-time";

export default async function FotoPage({
  searchParams,
}: {
  searchParams: Promise<{ tanggal?: string }>;
}) {
  const { tanggal } = await searchParams;
  const key =
    tanggal && /^\d{4}-\d{2}-\d{2}$/.test(tanggal)
      ? tanggal
      : wibDateKey(new Date());
  const { start, end } = dayRange(new Date(`${key}T12:00:00+07:00`));

  const day = await db.attendance.findMany({
    where: { capturedAt: { gte: start, lt: end }, status: { not: "REJECTED" } },
    orderBy: { capturedAt: "asc" },
    include: { user: true, location: true },
  });

  const usersByDevice = new Map<string, Set<string>>();
  for (const a of day) {
    (
      usersByDevice.get(a.deviceSignature) ??
      usersByDevice.set(a.deviceSignature, new Set()).get(a.deviceSignature)!
    ).add(a.userId);
  }
  const shared = (sig: string) => (usersByDevice.get(sig)?.size ?? 0) > 1;
  const photos = day.filter((a) => a.type === "IN" && a.photoUrl);

  return (
    <>
      <PageTitle
        title="Audit Foto"
        subtitle="Foto presensi masuk dengan potongan wajah otomatis. Klik foto untuk versi penuh."
      />
      <form className="mb-6 flex items-center gap-2">
        <input
          type="date"
          name="tanggal"
          defaultValue={key}
          className={`${field} max-w-48`}
        />
        <button className={btn}>Tampilkan</button>
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {photos.map((a) => (
          <figure key={a.id} className="space-y-2 rounded-xl border p-2">
            <a
              href={`/api/admin/foto/${a.id}?v=full`}
              target="_blank"
              rel="noreferrer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/admin/foto/${a.id}?v=thumb`}
                alt={`Foto ${a.user.name}`}
                width={240}
                height={240}
                loading="lazy"
                className="aspect-square w-full rounded-lg object-cover"
              />
            </a>
            <figcaption className="space-y-1 text-xs">
              <p className="text-sm font-medium">{a.user.name}</p>
              <p className="text-muted-foreground">
                {fmtTime(a.capturedAt)} WIB · {STATUS_LABEL[a.status]}
                {a.status === "LATE" ? ` ${a.lateMinutes} mnt` : ""}
              </p>
              <p className="text-muted-foreground">
                {a.location?.name ?? "Dinas Luar"}
                {a.distanceMeters != null
                  ? ` · ${Math.round(a.distanceMeters)} m`
                  : ""}
              </p>
              <div className="flex flex-wrap gap-1">
                {shared(a.deviceSignature) && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">
                    Perangkat dipakai bersama
                  </span>
                )}
                {a.isOfflineSync && (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-900">
                    Offline
                  </span>
                )}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
      {photos.length === 0 && (
        <EmptyState
          title="Belum ada foto pada tanggal ini"
          hint="Foto muncul setelah pegawai melakukan Absen Masuk. Pilih tanggal lain di atas, atau lihat ringkasan hari ini di Dashboard."
          href="/admin/dashboard"
          hrefLabel="Ke Dashboard"
        />
      )}
    </>
  );
}
