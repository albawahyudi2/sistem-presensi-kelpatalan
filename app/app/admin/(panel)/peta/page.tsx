import { PageTitle } from "@/components/admin-ui";
import { PresenceMapLoader } from "@/components/presence-map-loader";
import { dayRange } from "@/lib/attendance-service";
import { db } from "@/lib/db";
import { fmtTime, STATUS_LABEL } from "@/lib/format";

export default async function PetaPage() {
  const { start, end } = dayRange(new Date());
  const [locations, records] = await Promise.all([
    db.location.findMany(),
    db.attendance.findMany({
      where: {
        type: "IN",
        status: { not: "REJECTED" },
        capturedAt: { gte: start, lt: end },
      },
      include: { user: true },
    }),
  ]);

  return (
    <>
      <PageTitle
        title="Live Presence Map"
        subtitle={
          records.length === 0
            ? "Belum ada pegawai yang presensi masuk hari ini. Lingkaran biru adalah geofence lokasi; pin muncul setelah ada Absen Masuk."
            : `${records.length} pegawai sudah presensi masuk hari ini. Hijau tepat waktu/dinas luar, merah terlambat. Lingkaran biru adalah geofence lokasi. Peta otomatis memperbesar ke semua penanda.`
        }
      />
      <PresenceMapLoader
        locations={locations.map((l) => ({
          id: l.id,
          name: l.name,
          latitude: l.latitude,
          longitude: l.longitude,
          radius: l.radius,
        }))}
        pins={records.map((r) => ({
          id: r.id,
          name: r.user.name,
          latitude: r.latitude,
          longitude: r.longitude,
          time: fmtTime(r.capturedAt),
          label: STATUS_LABEL[r.status],
          late: r.status === "LATE",
        }))}
      />
    </>
  );
}
