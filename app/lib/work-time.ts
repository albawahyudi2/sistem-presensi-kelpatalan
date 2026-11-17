import { TZDate } from "@date-fns/tz";

export const TIME_ZONE = "Asia/Jakarta";
export const GRACE_MINUTES = 15;
const START_MINUTES = 7 * 60 + 30;

export function toWib(date: Date): TZDate {
  return new TZDate(date, TIME_ZONE);
}

export function wibDateKey(date: Date): string {
  const d = toWib(date);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function isWeekend(date: Date): boolean {
  const day = toWib(date).getDay();
  return day === 0 || day === 6;
}

export type Holiday = { date: Date | string; isRecurring: boolean };

function holidayParts(h: Holiday): {
  year: number;
  month: number;
  day: number;
} {
  const raw = typeof h.date === "string" ? h.date : h.date.toISOString();
  const [y, m, d] = raw.slice(0, 10).split("-").map(Number);
  return { year: y, month: m, day: d };
}

export function isHoliday(date: Date, holidays: Holiday[]): boolean {
  const d = toWib(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return holidays.some((h) => {
    const p = holidayParts(h);
    if (p.month !== month || p.day !== day) return false;
    return h.isRecurring || p.year === year;
  });
}

export function isWorkday(date: Date, holidays: Holiday[]): boolean {
  return !isWeekend(date) && !isHoliday(date, holidays);
}

export function workEndMinutes(date: Date): number {
  return toWib(date).getDay() === 5 ? 14 * 60 + 30 : 15 * 60 + 30;
}

export type ClockInStatus = { status: "ON_TIME" | "LATE"; lateMinutes: number };

export function computeClockInStatus(capturedAt: Date): ClockInStatus {
  const d = toWib(capturedAt);
  const secondsSinceMidnight =
    d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  const graceEnd = (START_MINUTES + GRACE_MINUTES) * 60;
  if (secondsSinceMidnight <= graceEnd)
    return { status: "ON_TIME", lateMinutes: 0 };
  return {
    status: "LATE",
    lateMinutes: Math.floor((secondsSinceMidnight - START_MINUTES * 60) / 60),
  };
}
