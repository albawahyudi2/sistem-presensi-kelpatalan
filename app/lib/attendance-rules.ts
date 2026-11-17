import { checkGeofence, haversineMeters, isValidCoordinate } from "./geo";
import type { GeoLocation, Point } from "./geo";
import { computeClockInStatus, isWorkday } from "./work-time";
import type { Holiday } from "./work-time";

export type AttType = "IN" | "OUT";
export type AttCategory = "HADIR" | "DINAS_LUAR";
export type AttStatus =
  "ON_TIME" | "LATE" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export const MAX_OFFLINE_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

export const MIN_CLOCK_OUT_GAP_MINUTES = 15;

export type TodayRecord = {
  capturedAt?: Date;
  type: AttType;
  category: AttCategory;
  status: AttStatus;
};

export type TodaySummary = {
  hasIn: boolean;
  hasOut: boolean;
  inCategory?: AttCategory;
  inStatus?: AttStatus;
  inAt?: Date;
};

export function summarizeToday(records: TodayRecord[]): TodaySummary {
  const valid = records.filter((r) => r.status !== "REJECTED");
  const inRec = valid.find((r) => r.type === "IN");
  return {
    hasIn: Boolean(inRec),
    hasOut: valid.some((r) => r.type === "OUT"),
    inCategory: inRec?.category,
    inStatus: inRec?.status,
    inAt: inRec?.capturedAt,
  };
}

export type RuleInput = {
  type: AttType;
  category: AttCategory;
  now: Date;
  capturedAt: Date;
  isOfflineSync: boolean;
  point: Point;
  accuracy: number | null;
  locations: GeoLocation[];
  photoUrl?: string | null;
  notes?: string | null;
  holidays: Holiday[];
  today: TodaySummary;
};

export type RuleCode =
  | "NON_WORKDAY"
  | "DUPLICATE_IN"
  | "DUPLICATE_OUT"
  | "NO_CLOCK_IN"
  | "PHOTO_REQUIRED"
  | "NOTES_REQUIRED"
  | "OUTSIDE_RADIUS"
  | "POOR_ACCURACY"
  | "INVALID_COORDINATE"
  | "NO_LOCATIONS"
  | "STALE_CAPTURE"
  | "FUTURE_CAPTURE"
  | "TOO_SOON";

export type RuleResult =
  | {
      ok: true;
      category: AttCategory;
      status: AttStatus;
      lateMinutes: number;
      locationId: string | null;
      distanceMeters: number | null;
    }
  | { ok: false; code: RuleCode; message: string };

const fail = (code: RuleCode, message: string): RuleResult => ({
  ok: false,
  code,
  message,
});

export function effectiveTime(
  input: Pick<RuleInput, "now" | "capturedAt" | "isOfflineSync">,
): Date {
  return input.isOfflineSync ? input.capturedAt : input.now;
}

export function evaluateAttendance(input: RuleInput): RuleResult {
  const { type, now, capturedAt, isOfflineSync, point } = input;

  if (isOfflineSync) {
    if (now.getTime() - capturedAt.getTime() > MAX_OFFLINE_AGE_MS) {
      return fail(
        "STALE_CAPTURE",
        "Data offline berumur lebih dari 24 jam dan ditolak.",
      );
    }
    if (capturedAt.getTime() - now.getTime() > MAX_FUTURE_SKEW_MS) {
      return fail("FUTURE_CAPTURE", "Waktu perangkat tidak valid.");
    }
  }

  const when = effectiveTime(input);
  if (!isWorkday(when, input.holidays)) {
    return fail(
      "NON_WORKDAY",
      "Hari ini bukan hari kerja (akhir pekan atau hari libur).",
    );
  }
  if (!isValidCoordinate(point)) {
    return fail("INVALID_COORDINATE", "Koordinat lokasi tidak valid.");
  }

  if (type === "IN") return evaluateClockIn(input, when);
  return evaluateClockOut(input, when);
}

function geofence(
  input: RuleInput,
):
  | RuleResult
  | { ok: true; g: ReturnType<typeof checkGeofence> & { ok: true } } {
  const g = checkGeofence(input.point, input.accuracy, input.locations);
  if (g.ok) return { ok: true, g };
  switch (g.reason) {
    case "POOR_ACCURACY":
      return fail(
        "POOR_ACCURACY",
        "Akurasi GPS terlalu rendah. Coba di area terbuka atau gunakan HP.",
      );
    case "NO_LOCATIONS":
      return fail(
        "NO_LOCATIONS",
        "Anda belum memiliki lokasi penugasan. Hubungi admin.",
      );
    case "INVALID_COORDINATE":
      return fail("INVALID_COORDINATE", "Koordinat lokasi tidak valid.");
    default: {
      const n = g.nearest;
      const detail = n
        ? ` Jarak Anda ${Math.round(n.distanceMeters)} m dari ${n.location.name} (maksimal ${n.location.radius} m).`
        : "";
      return fail(
        "OUTSIDE_RADIUS",
        `Anda berada di luar radius lokasi penugasan.${detail}`,
      );
    }
  }
}

function evaluateClockIn(input: RuleInput, when: Date): RuleResult {
  if (input.today.hasIn) {
    return fail(
      "DUPLICATE_IN",
      "Anda sudah melakukan presensi masuk hari ini.",
    );
  }
  if (!input.photoUrl) {
    return fail(
      "PHOTO_REQUIRED",
      input.category === "HADIR"
        ? "Foto selfie wajib untuk presensi masuk."
        : "Foto kegiatan wajib untuk Dinas Luar.",
    );
  }

  if (input.category === "DINAS_LUAR") {
    if (!input.notes?.trim()) {
      return fail(
        "NOTES_REQUIRED",
        "Catatan tugas wajib diisi untuk Dinas Luar.",
      );
    }
    const nearest = [...input.locations]
      .map((l) => ({ l, d: haversineMeters(input.point, l) }))
      .sort((a, b) => a.d - b.d)[0];
    return {
      ok: true,
      category: "DINAS_LUAR",
      status: "PENDING_APPROVAL",
      lateMinutes: 0,
      locationId: null,
      distanceMeters: nearest?.d ?? null,
    };
  }

  const g = geofence(input);
  if (!("g" in g)) return g;
  const { status, lateMinutes } = computeClockInStatus(when);
  return {
    ok: true,
    category: "HADIR",
    status,
    lateMinutes,
    locationId: g.g.location.id,
    distanceMeters: g.g.distanceMeters,
  };
}

function evaluateClockOut(input: RuleInput, when: Date): RuleResult {
  const { today } = input;
  if (!today.hasIn || !today.inCategory) {
    return fail("NO_CLOCK_IN", "Anda belum melakukan presensi masuk hari ini.");
  }
  if (today.hasOut) {
    return fail(
      "DUPLICATE_OUT",
      "Anda sudah melakukan presensi pulang hari ini.",
    );
  }
  if (today.inAt) {
    const gapMs = MIN_CLOCK_OUT_GAP_MINUTES * 60_000;
    const elapsed = when.getTime() - today.inAt.getTime();
    if (elapsed < gapMs) {
      const wait = Math.ceil((gapMs - elapsed) / 60_000);
      return fail(
        "TOO_SOON",
        `Presensi pulang baru bisa dilakukan ${MIN_CLOCK_OUT_GAP_MINUTES} menit setelah presensi masuk. Coba lagi sekitar ${wait} menit lagi.`,
      );
    }
  }

  if (today.inCategory === "DINAS_LUAR") {
    return {
      ok: true,
      category: "DINAS_LUAR",
      status: today.inStatus ?? "PENDING_APPROVAL",
      lateMinutes: 0,
      locationId: null,
      distanceMeters: null,
    };
  }

  const g = geofence(input);
  if (!("g" in g)) return g;
  return {
    ok: true,
    category: "HADIR",
    status: "ON_TIME",
    lateMinutes: 0,
    locationId: g.g.location.id,
    distanceMeters: g.g.distanceMeters,
  };
}
