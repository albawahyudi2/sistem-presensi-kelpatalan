const TZ = "Asia/Jakarta";

export const fmtTime = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(".", ":");

export const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);

export const fmtDateKey = (key: string) =>
  fmtDate(new Date(`${key}T12:00:00+07:00`));

export const STATUS_LABEL: Record<string, string> = {
  ON_TIME: "Tepat waktu",
  LATE: "Terlambat",
  PENDING_APPROVAL: "Menunggu verifikasi",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};
