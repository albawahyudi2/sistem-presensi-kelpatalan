import { wibDateKey } from "@/lib/work-time";

const KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;

export function parseRange(
  from?: string,
  to?: string,
  now = new Date(),
): { from: string; to: string; error?: string } {
  const today = wibDateKey(now);
  const defFrom = `${today.slice(0, 7)}-01`;
  const f = from && KEY.test(from) ? from : defFrom;
  const t = to && KEY.test(to) ? to : today;
  if (f > t)
    return {
      from: defFrom,
      to: today,
      error: "Tanggal awal tidak boleh setelah tanggal akhir.",
    };
  const days =
    (Date.parse(`${t}T00:00:00Z`) - Date.parse(`${f}T00:00:00Z`)) / 86_400_000;
  if (days > MAX_RANGE_DAYS) {
    return { from: defFrom, to: today, error: "Rentang maksimal 1 tahun." };
  }
  return { from: f, to: t };
}
