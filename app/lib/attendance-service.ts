import { db } from "@/lib/db";
import {
  effectiveTime,
  evaluateAttendance,
  summarizeToday,
  type AttCategory,
  type AttStatus,
  type AttType,
  type RuleCode,
} from "@/lib/attendance-rules";
import { isTrustedPhotoUrl } from "@/lib/cloudinary";
import { wibDateKey } from "@/lib/work-time";

export type AttendanceInput = {
  type: AttType;
  category: AttCategory;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  photoUrl: string | null;
  notes: string | null;
  capturedAt: Date;
  isOfflineSync: boolean;
  idempotencyKey: string;
  deviceSignature: string;
};

export type AttendanceResult =
  | {
      ok: true;
      duplicate: boolean;
      status: AttStatus;
      lateMinutes: number;
      type: AttType;
      recordedAt: Date;
      rejected?: boolean;
    }
  | {
      ok: false;
      code: RuleCode | "USER_INACTIVE" | "PHOTO_UNTRUSTED";
      message: string;
    };

const REJECTABLE_OFFLINE: RuleCode[] = [
  "OUTSIDE_RADIUS",
  "POOR_ACCURACY",
  "STALE_CAPTURE",
  "FUTURE_CAPTURE",
  "NON_WORKDAY",
];

export function dayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(`${wibDateKey(date)}T00:00:00+07:00`);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

export async function getAssignedLocations(userId: string) {
  const rows = await db.userLocation.findMany({
    where: { userId },
    include: { location: true },
  });
  return rows.map((r) => r.location);
}

export async function getTodayRecords(userId: string, date: Date) {
  const { start, end } = dayRange(date);
  return db.attendance.findMany({
    where: { userId, capturedAt: { gte: start, lt: end } },
    orderBy: { capturedAt: "asc" },
  });
}

export async function getTodayState(userId: string, now = new Date()) {
  const [locations, records, holidays] = await Promise.all([
    getAssignedLocations(userId),
    getTodayRecords(userId, now),
    db.holiday.findMany(),
  ]);
  return {
    locations,
    records,
    holidays,
    summary: summarizeToday(records),
  };
}

export async function recordAttendance(
  userId: string,
  input: AttendanceInput,
  now = new Date(),
): Promise<AttendanceResult> {
  const existing = await db.attendance.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    return {
      ok: true,
      duplicate: true,
      status: existing.status,
      lateMinutes: existing.lateMinutes,
      type: existing.type,
      recordedAt: existing.capturedAt,
    };
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    return { ok: false, code: "USER_INACTIVE", message: "Akun tidak aktif." };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  if (input.photoUrl && !isTrustedPhotoUrl(input.photoUrl, userId, cloudName)) {
    return {
      ok: false,
      code: "PHOTO_UNTRUSTED",
      message: "Foto tidak valid. Ulangi pengambilan foto.",
    };
  }

  const when = effectiveTime({
    now,
    capturedAt: input.capturedAt,
    isOfflineSync: input.isOfflineSync,
  });
  const [locations, records, holidays] = await Promise.all([
    getAssignedLocations(userId),
    getTodayRecords(userId, when),
    db.holiday.findMany(),
  ]);

  const result = evaluateAttendance({
    type: input.type,
    category: input.category,
    now,
    capturedAt: input.capturedAt,
    isOfflineSync: input.isOfflineSync,
    point: { latitude: input.latitude, longitude: input.longitude },
    accuracy: input.accuracy,
    locations,
    photoUrl: input.photoUrl,
    notes: input.notes,
    holidays,
    today: summarizeToday(records),
  });

  const base = {
    userId,
    type: input.type,
    latitude: input.latitude,
    longitude: input.longitude,
    gpsAccuracy: input.accuracy,
    photoUrl: input.photoUrl,
    deviceSignature: input.deviceSignature,
    notes: input.notes?.trim() || null,
    isOfflineSync: input.isOfflineSync,
    capturedAt: when,
    idempotencyKey: input.idempotencyKey,
  };

  try {
    if (!result.ok) {
      if (input.isOfflineSync && REJECTABLE_OFFLINE.includes(result.code)) {
        await db.attendance.create({
          data: {
            ...base,
            category: input.category,
            status: "REJECTED",
            decisionNote: result.message,
          },
        });
        return {
          ok: true,
          duplicate: false,
          status: "REJECTED",
          lateMinutes: 0,
          type: input.type,
          recordedAt: when,
          rejected: true,
        };
      }
      return { ok: false, code: result.code, message: result.message };
    }

    await db.attendance.create({
      data: {
        ...base,
        category: result.category,
        status: result.status,
        lateMinutes: result.lateMinutes,
        locationId: result.locationId,
        distanceMeters: result.distanceMeters,
      },
    });
    return {
      ok: true,
      duplicate: false,
      status: result.status,
      lateMinutes: result.lateMinutes,
      type: input.type,
      recordedAt: when,
    };
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return {
        ok: true,
        duplicate: true,
        status: "ON_TIME",
        lateMinutes: 0,
        type: input.type,
        recordedAt: when,
      };
    }
    throw e;
  }
}
