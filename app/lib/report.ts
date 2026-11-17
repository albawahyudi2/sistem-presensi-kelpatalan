import {
  isWorkday,
  toWib,
  wibDateKey,
  workEndMinutes,
  type Holiday,
} from "./work-time";
import type { AttCategory, AttStatus, AttType } from "./attendance-rules";

export type RecapAttendance = {
  userId: string;
  type: AttType;
  category: AttCategory;
  status: AttStatus;
  lateMinutes: number;
  capturedAt: Date;
};
export type RecapLeave = {
  userId: string;
  date: string;
  kind: "IZIN" | "SAKIT";
};
export type RecapUser = {
  id: string;
  nip: string;
  name: string;
  position: string;
  createdAt: Date;
};

export type RecapRow = {
  userId: string;
  nip: string;
  name: string;
  position: string;
  hadir: number;
  lateDays: number;
  lateMinutes: number;
  dinasLuar: number;
  pendingDinasLuar: number;
  izinSakit: number;
  alpha: number;
  workdays: number;
  percentage: number;
  noClockOut: string[];
};

export type Recap = { rows: RecapRow[]; days: string[] };

export function dateKeysBetween(from: string, to: string): string[] {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const start = Date.UTC(fy, fm - 1, fd);
  const end = Date.UTC(ty, tm - 1, td);
  const keys: string[] = [];
  for (let t = start; t <= end; t += 86_400_000) {
    keys.push(new Date(t).toISOString().slice(0, 10));
  }
  return keys;
}

const noonOf = (key: string) => new Date(`${key}T12:00:00+07:00`);

export function isDayCompleted(key: string, now: Date): boolean {
  const today = wibDateKey(now);
  if (key < today) return true;
  if (key > today) return false;
  const w = toWib(now);
  return w.getHours() * 60 + w.getMinutes() >= workEndMinutes(noonOf(key));
}

export function computeRecap(args: {
  users: RecapUser[];
  attendances: RecapAttendance[];
  leaves: RecapLeave[];
  holidays: Holiday[];
  from: string;
  to: string;
  now: Date;
}): Recap {
  const { users, attendances, leaves, holidays, from, to, now } = args;
  const days = dateKeysBetween(from, to);

  const attBy = new Map<string, RecapAttendance[]>();
  for (const a of attendances) {
    if (a.status === "REJECTED") continue;
    const k = `${a.userId}|${wibDateKey(a.capturedAt)}`;
    (attBy.get(k) ?? attBy.set(k, []).get(k)!).push(a);
  }
  const leaveBy = new Map(leaves.map((l) => [`${l.userId}|${l.date}`, l]));

  const rows: RecapRow[] = [];
  for (const u of users) {
    const row: RecapRow = {
      userId: u.id,
      nip: u.nip,
      name: u.name,
      position: u.position,
      hadir: 0,
      lateDays: 0,
      lateMinutes: 0,
      dinasLuar: 0,
      pendingDinasLuar: 0,
      izinSakit: 0,
      alpha: 0,
      workdays: 0,
      percentage: 0,
      noClockOut: [],
    };
    const startKey = wibDateKey(u.createdAt);

    for (const key of days) {
      if (key < startKey || !isWorkday(noonOf(key), holidays)) continue;
      const completed = isDayCompleted(key, now);
      const recs = attBy.get(`${u.id}|${key}`) ?? [];
      const inRec = recs.find((r) => r.type === "IN");
      const hasOut = recs.some((r) => r.type === "OUT");
      if (completed) row.workdays++;

      if (inRec?.category === "HADIR") {
        row.hadir++;
        if (inRec.status === "LATE") {
          row.lateDays++;
          row.lateMinutes += inRec.lateMinutes;
        }
        if (completed && !hasOut) row.noClockOut.push(key);
      } else if (
        inRec?.category === "DINAS_LUAR" &&
        inRec.status === "APPROVED"
      ) {
        row.dinasLuar++;
      } else if (leaveBy.has(`${u.id}|${key}`)) {
        row.izinSakit++;
      } else {
        if (inRec?.category === "DINAS_LUAR") row.pendingDinasLuar++;
        if (completed) row.alpha++;
      }
    }

    row.percentage =
      row.workdays === 0
        ? 0
        : Math.round(((row.hadir + row.dinasLuar) / row.workdays) * 10000) /
          100;
    rows.push(row);
  }
  return { rows, days };
}

export function sumRecap(rows: RecapRow[]) {
  return rows.reduce(
    (t, r) => ({
      hadir: t.hadir + r.hadir,
      terlambat: t.terlambat + r.lateDays,
      dinasLuar: t.dinasLuar + r.dinasLuar,
      izinSakit: t.izinSakit + r.izinSakit,
      alpha: t.alpha + r.alpha,
      pending: t.pending + r.pendingDinasLuar,
    }),
    {
      hadir: 0,
      terlambat: 0,
      dinasLuar: 0,
      izinSakit: 0,
      alpha: 0,
      pending: 0,
    },
  );
}
