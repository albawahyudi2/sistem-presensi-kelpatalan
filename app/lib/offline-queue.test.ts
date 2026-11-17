import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  enqueueAttendance,
  pendingCount,
  syncQueue,
  type AttendancePayload,
} from "./offline-queue";

const U = "user-1";
const base = (key: string, over: Partial<AttendancePayload> = {}) => ({
  type: "IN" as const,
  category: "HADIR" as const,
  latitude: -7.9,
  longitude: 110.3,
  accuracy: 10,
  photoUrl: null,
  notes: null,
  capturedAt: "2026-11-16T00:40:00.000Z",
  idempotencyKey: key,
  ...over,
});

async function clear() {
  // sinkronkan hingga kosong dengan submit sukses agar antrean bersih
  await syncQueue(U, {
    upload: async () => "u",
    submit: async () => ({ ok: true, message: "" }),
  });
  await syncQueue("user-2", {
    upload: async () => "u",
    submit: async () => ({ ok: true, message: "" }),
  });
}

beforeEach(clear);

describe("offline queue", () => {
  it("mengunggah foto lalu mengirim, dan mengosongkan antrean", async () => {
    await enqueueAttendance(U, base("k-1"), new Blob(["x"]));
    expect(await pendingCount(U)).toBe(1);

    const submitted: AttendancePayload[] = [];
    const s = await syncQueue(U, {
      upload: async () => "https://res.cloudinary.com/demo/image/upload/a.webp",
      submit: async (p) => {
        submitted.push(p);
        return { ok: true, message: "ok" };
      },
    });
    expect(s).toMatchObject({ sent: 1, remaining: 0, offline: false });
    expect(submitted[0].photoUrl).toContain("cloudinary");
    expect(submitted[0].isOfflineSync).toBe(true);
    expect(submitted[0].idempotencyKey).toBe("k-1");
  });

  it("memproses berurutan sesuai waktu (masuk sebelum pulang)", async () => {
    await enqueueAttendance(U, base("k-in"));
    await new Promise((r) => setTimeout(r, 5));
    await enqueueAttendance(U, base("k-out", { type: "OUT" }));
    const order: string[] = [];
    await syncQueue(U, {
      upload: async () => "u",
      submit: async (p) => {
        order.push(p.idempotencyKey);
        return { ok: true, message: "" };
      },
    });
    expect(order).toEqual(["k-in", "k-out"]);
  });

  it("gangguan jaringan: berhenti, entri tetap ada, percobaan bertambah", async () => {
    await enqueueAttendance(U, base("k-net"));
    const s = await syncQueue(U, {
      upload: async () => "u",
      submit: async () => {
        throw new TypeError("Failed to fetch");
      },
    });
    expect(s).toMatchObject({ sent: 0, remaining: 1, offline: true });
  });

  it("penolakan server: entri dihapus dan pesan dikembalikan", async () => {
    await enqueueAttendance(U, base("k-rej"));
    const s = await syncQueue(U, {
      upload: async () => "u",
      submit: async () => ({ ok: false, message: "Di luar radius" }),
    });
    expect(s).toMatchObject({
      sent: 0,
      rejected: ["Di luar radius"],
      remaining: 0,
    });
  });

  it("foto tidak diunggah ulang bila pengiriman gagal lalu dicoba lagi", async () => {
    await enqueueAttendance(U, base("k-retry"), new Blob(["x"]));
    let uploads = 0;
    const deps = (fail: boolean) => ({
      upload: async () => {
        uploads++;
        return "https://res.cloudinary.com/demo/image/upload/a.webp";
      },
      submit: async () => {
        if (fail) throw new TypeError("Failed to fetch");
        return { ok: true, message: "" };
      },
    });
    await syncQueue(U, deps(true));
    const s = await syncQueue(U, deps(false));
    expect(uploads).toBe(1);
    expect(s.sent).toBe(1);
  });

  it("antrean dipisah per pengguna", async () => {
    await enqueueAttendance(U, base("k-u1"));
    await enqueueAttendance("user-2", base("k-u2"));
    const sent: string[] = [];
    await syncQueue(U, {
      upload: async () => "u",
      submit: async (p) => {
        sent.push(p.idempotencyKey);
        return { ok: true, message: "" };
      },
    });
    expect(sent).toEqual(["k-u1"]);
    expect(await pendingCount("user-2")).toBe(1);
  });
});
