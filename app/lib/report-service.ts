import { db } from "@/lib/db";
import { computeRecap } from "@/lib/report";

export async function loadRecap(args: {
  from: string;
  to: string;
  locationId?: string;
  now?: Date;
}) {
  const { from, to, locationId } = args;
  const now = args.now ?? new Date();
  const start = new Date(`${from}T00:00:00+07:00`);
  const end = new Date(new Date(`${to}T00:00:00+07:00`).getTime() + 86_400_000);

  const [users, attendances, leaves, holidays] = await Promise.all([
    db.user.findMany({
      where: locationId ? { locations: { some: { locationId } } } : {},
      orderBy: { name: "asc" },
    }),
    db.attendance.findMany({
      where: { capturedAt: { gte: start, lt: end } },
    }),
    db.leave.findMany({
      where: {
        date: {
          gte: new Date(`${from}T00:00:00Z`),
          lte: new Date(`${to}T00:00:00Z`),
        },
      },
    }),
    db.holiday.findMany(),
  ]);

  const recap = computeRecap({
    users,
    attendances,
    leaves: leaves.map((l) => ({
      userId: l.userId,
      date: l.date.toISOString().slice(0, 10),
      kind: l.kind,
    })),
    holidays,
    from,
    to,
    now,
  });

  const active = new Map(users.map((u) => [u.id, u.isActive]));
  const rows = recap.rows.filter(
    (r) =>
      active.get(r.userId) ||
      r.hadir + r.dinasLuar + r.izinSakit + r.pendingDinasLuar > 0,
  );
  return { ...recap, rows };
}
