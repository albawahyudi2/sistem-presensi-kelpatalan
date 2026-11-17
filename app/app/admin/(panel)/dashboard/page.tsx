import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/admin-ui";
import { loadRecap } from "@/lib/report-service";
import { sumRecap } from "@/lib/report";
import { fmtDate } from "@/lib/format";
import { isWorkday, wibDateKey } from "@/lib/work-time";
import { db } from "@/lib/db";

export default async function AdminDashboardPage() {
  const now = new Date();
  const today = wibDateKey(now);
  const [recap, holidays, activeUsers] = await Promise.all([
    loadRecap({ from: today, to: today, now }),
    db.holiday.findMany(),
    db.user.count({ where: { isActive: true } }),
  ]);
  const t = sumRecap(recap.rows);
  const workday = isWorkday(now, holidays);

  const cards = [
    { label: "Hadir", value: t.hadir },
    { label: "Terlambat", value: t.terlambat },
    { label: "Dinas Luar", value: t.dinasLuar },
    { label: "Izin / Sakit", value: t.izinSakit },
    { label: "Alpha", value: t.alpha },
  ];

  return (
    <>
      <PageTitle
        title="Dashboard"
        subtitle={`${fmtDate(now)}${workday ? "" : " · hari non-kerja"}`}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs font-medium">
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs">Pegawai aktif</p>
            <p className="text-2xl font-semibold tabular-nums">{activeUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs">
              Dinas Luar menunggu verifikasi hari ini
            </p>
            <p className="text-2xl font-semibold tabular-nums">{t.pending}</p>
          </CardContent>
        </Card>
      </div>
      <p className="text-muted-foreground mt-4 text-xs">
        Alpha untuk hari ini baru dihitung setelah jam kerja berakhir
        (Senin-Kamis 15.30, Jumat 14.30).
      </p>
    </>
  );
}
