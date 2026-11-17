import Link from "next/link";
import { auth } from "@/auth";
import { logoutPegawai } from "@/app/actions";
import { AttendancePanel } from "@/components/attendance-panel";
import { OfflineSync } from "@/components/offline-sync";
import { LiveClock } from "@/components/live-clock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getTodayState } from "@/lib/attendance-service";
import { isWorkday } from "@/lib/work-time";

const TZ = "Asia/Jakarta";
const fmtTime = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(".", ":");

export default async function HomePage() {
  const session = await auth();
  const userId = session!.user.id;
  const now = new Date();
  const [user, state] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    getTodayState(userId, now),
  ]);

  const inRec = state.records.find(
    (r) => r.type === "IN" && r.status !== "REJECTED",
  );
  const outRec = state.records.find(
    (r) => r.type === "OUT" && r.status !== "REJECTED",
  );
  const statusLabel = !inRec
    ? "Belum presensi"
    : inRec.status === "PENDING_APPROVAL"
      ? "Dinas Luar (menunggu verifikasi)"
      : inRec.status === "APPROVED"
        ? "Dinas Luar (disetujui)"
        : inRec.status === "LATE"
          ? `Terlambat ${inRec.lateMinutes} menit`
          : "Tepat waktu";

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-muted-foreground text-sm">Selamat bekerja,</p>
          <h1 className="text-xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground text-xs">{user.position}</p>
        </div>
        <form action={logoutPegawai}>
          <Button type="submit" variant="ghost" size="sm">
            Keluar
          </Button>
        </form>
      </header>

      <OfflineSync userId={userId} />

      <Card>
        <CardContent className="pt-6">
          <LiveClock />
        </CardContent>
      </Card>
      <Link href="/riwayat" className="block text-center text-sm underline">
        Lihat riwayat kehadiran bulan ini
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Masuk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {inRec ? fmtTime(inRec.capturedAt) : "--:--"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Pulang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {outRec ? fmtTime(outRec.capturedAt) : "--:--"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 pt-6">
          <Badge
            variant={inRec?.status === "LATE" ? "destructive" : "secondary"}
          >
            {statusLabel}
          </Badge>
          {state.locations.map((l) => (
            <Badge key={l.id} variant="outline">
              {l.name} · {l.radius} m
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <AttendancePanel
            userId={userId}
            nip={user.nip}
            hasIn={state.summary.hasIn}
            hasOut={state.summary.hasOut}
            isWorkday={isWorkday(now, state.holidays)}
            hasLocations={state.locations.length > 0}
          />
        </CardContent>
      </Card>
    </main>
  );
}
