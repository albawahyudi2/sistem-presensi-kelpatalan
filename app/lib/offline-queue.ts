import Dexie, { type EntityTable } from "dexie";

export type AttendancePayload = {
  type: "IN" | "OUT";
  category: "HADIR" | "DINAS_LUAR";
  latitude: number;
  longitude: number;
  accuracy: number | null;
  photoUrl: string | null;
  notes: string | null;
  capturedAt: string;
  isOfflineSync: boolean;
  idempotencyKey: string;
};

export type QueuedAttendance = {
  id: string;
  userId: string;
  payload: AttendancePayload;
  blob?: Blob;
  createdAt: number;
  attempts: number;
  lastError?: string;
};

class QueueDb extends Dexie {
  queue!: EntityTable<QueuedAttendance, "id">;
  constructor() {
    super("presensi-queue");
    this.version(1).stores({ queue: "id, userId, createdAt" });
  }
}

let db: QueueDb | null = null;
const getDb = () => (db ??= new QueueDb());

export function isNetworkError(e: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    return true;
  return e instanceof TypeError;
}

export async function enqueueAttendance(
  userId: string,
  payload: Omit<AttendancePayload, "isOfflineSync">,
  blob?: Blob | null,
): Promise<void> {
  await getDb().queue.put({
    id: payload.idempotencyKey,
    userId,
    payload: { ...payload, isOfflineSync: true },
    blob: blob ?? undefined,
    createdAt: Date.now(),
    attempts: 0,
  });
}

export async function pendingCount(userId: string): Promise<number> {
  return getDb().queue.where("userId").equals(userId).count();
}

export type SyncDeps = {
  upload: (blob: Blob) => Promise<string>;
  submit: (
    payload: AttendancePayload,
  ) => Promise<{ ok: boolean; message: string }>;
};

export type SyncSummary = {
  sent: number;
  rejected: string[];
  remaining: number;
  offline: boolean;
};

let syncing = false;

export async function syncQueue(
  userId: string,
  deps: SyncDeps,
): Promise<SyncSummary> {
  const summary: SyncSummary = {
    sent: 0,
    rejected: [],
    remaining: 0,
    offline: false,
  };
  if (syncing) {
    summary.remaining = await pendingCount(userId);
    return summary;
  }
  syncing = true;
  try {
    const items = await getDb()
      .queue.where("userId")
      .equals(userId)
      .sortBy("createdAt");

    for (const item of items) {
      try {
        let photoUrl = item.payload.photoUrl;
        if (!photoUrl && item.blob) {
          photoUrl = await deps.upload(item.blob);
          await getDb().queue.update(item.id, {
            payload: { ...item.payload, photoUrl },
            blob: undefined,
          });
        }
        const result = await deps.submit({ ...item.payload, photoUrl });
        await getDb().queue.delete(item.id);
        if (result.ok) summary.sent++;
        else summary.rejected.push(result.message);
      } catch (e) {
        await getDb().queue.update(item.id, {
          attempts: item.attempts + 1,
          lastError: e instanceof Error ? e.message : "error",
        });
        if (isNetworkError(e)) {
          summary.offline = true;
          break;
        }
      }
    }
  } finally {
    syncing = false;
  }
  summary.remaining = await pendingCount(userId);
  return summary;
}
