import Link from "next/link";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { fmtDateKey, fmtTime, STATUS_LABEL } from "@/lib/format";
import { wibDateKey } from "@/lib/work-time";

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const next =
    m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return {
    start: new Date(`${month}-01T00:00:00+07:00`),
    end: new Date(`${next}-01T00:00:00+07:00`),
    next,
    prev: m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`,
  };
}

export default async function RiwayatPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>;
}) {
  const session = await auth();
  const { bulan } = await searchParams;
  const current = wibDateKey(new Date()).slice(0, 7);
  const month =
    bulan && /^\d{4}-(0[1-9]|1[0-2])$/.test(bulan) ? bulan : current;
  const { start, end, next, prev } = monthRange(month);

  const records = await db.attendance.findMany({
    where: { userId: session!.user.id, capturedAt: { gte: start, lt: end } },
    orderBy: { capturedAt: "asc" },
  });

  const byDay = new Map<string, typeof records>();
  for (const r of records) {
    const k = wibDateKey(r.capturedAt);
    (byDay.get(k) ?? byDay.set(k, []).get(k)!).push(r);
  }
  const days = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Riwayat Kehadiran</h1>
        <Link href="/" className="text-sm underline">
          Beranda
        </Link>
      </header>
      <nav className="flex items-center justify-between text-sm">
        <Link href={`/riwayat?bulan=${prev}`} className="underline">
          &larr; {prev}
        </Link>
        <strong>{month}</strong>
        {next <= current ? (
          <Link href={`/riwayat?bulan=${next}`} className="underline">
            {next} &rarr;
          </Link>
        ) : (
          <span />
        )}
      </nav>

      {days.map(([key, recs]) => {
        const inRec = recs.find((r) => r.type === "IN");
        const outRec = recs.find(
          (r) => r.type === "OUT" && r.status !== "REJECTED",
        );
        const rejected = recs.filter((r) => r.status === "REJECTED");
        return (
          <Card key={key}>
            <CardContent className="space-y-2 pt-6 text-sm">
              <p className="font-medium">{fmtDateKey(key)}</p>
              <div className="flex flex-wrap gap-2">
                {inRec && (
                  <Badge
                    variant={
                      inRec.status === "LATE" ? "destructive" : "secondary"
                    }
                  >
                    Masuk {fmtTime(inRec.capturedAt)} ·{" "}
                    {STATUS_LABEL[inRec.status]}
                    {inRec.status === "LATE" ? ` ${inRec.lateMinutes} mnt` : ""}
                  </Badge>
                )}
                {outRec && (
                  <Badge variant="outline">
                    Pulang {fmtTime(outRec.capturedAt)}
                  </Badge>
                )}
                {inRec && !outRec && key < wibDateKey(new Date()) && (
                  <Badge variant="outline">Tidak Clock Out</Badge>
                )}
              </div>
              {rejected.map((r) => (
                <p key={r.id} className="text-destructive text-xs">
                  Ditolak ({fmtTime(r.capturedAt)}):{" "}
                  {r.decisionNote ?? "tidak valid"}
                </p>
              ))}
            </CardContent>
          </Card>
        );
      })}
      {days.length === 0 && (
        <div className="space-y-2 rounded-xl border border-dashed p-6 text-center">
          <p className="font-medium">Belum ada presensi pada bulan ini</p>
          <p className="text-muted-foreground text-sm">
            Riwayat muncul setelah Anda melakukan Absen Masuk.
          </p>
          <Link href="/" className="inline-block text-sm underline">
            Ke Beranda untuk Absen
          </Link>
        </div>
      )}
    </main>
  );
}
