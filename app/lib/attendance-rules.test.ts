import { describe, expect, it } from "vitest";
import {
  evaluateAttendance,
  summarizeToday,
  type RuleInput,
} from "./attendance-rules";
import type { GeoLocation } from "./geo";

const OFFICE: GeoLocation = {
  id: "kantor",
  name: "Kantor Kelurahan Patalan",
  latitude: -7.9285979,
  longitude: 110.349427,
  radius: 50,
};
const near = {
  latitude: OFFICE.latitude + 20 / 111_195,
  longitude: OFFICE.longitude,
};
const far = {
  latitude: OFFICE.latitude + 500 / 111_195,
  longitude: OFFICE.longitude,
};

const wib = (iso: string) => new Date(`${iso}+07:00`);
const MON_0740 = wib("2026-11-16T07:40:00");

const base = (over: Partial<RuleInput> = {}): RuleInput => ({
  type: "IN",
  category: "HADIR",
  now: MON_0740,
  capturedAt: MON_0740,
  isOfflineSync: false,
  point: near,
  accuracy: 10,
  locations: [OFFICE],
  photoUrl: "https://res.cloudinary.com/x/image/upload/v1/presensi/u1/a.webp",
  notes: null,
  holidays: [],
  today: { hasIn: false, hasOut: false },
  ...over,
});

const code = (r: ReturnType<typeof evaluateAttendance>) =>
  r.ok ? "OK" : r.code;

describe("Clock In HADIR", () => {
  it("diterima di dalam radius, tepat waktu", () => {
    const r = evaluateAttendance(base());
    expect(r).toMatchObject({
      ok: true,
      status: "ON_TIME",
      locationId: "kantor",
    });
  });

  it("terlambat setelah 07.45", () => {
    const t = wib("2026-11-16T07:46:00");
    const r = evaluateAttendance(base({ now: t, capturedAt: t }));
    expect(r).toMatchObject({ ok: true, status: "LATE", lateMinutes: 16 });
  });

  it("wajib foto", () => {
    expect(code(evaluateAttendance(base({ photoUrl: null })))).toBe(
      "PHOTO_REQUIRED",
    );
  });

  it("ditolak di luar radius", () => {
    expect(code(evaluateAttendance(base({ point: far })))).toBe(
      "OUTSIDE_RADIUS",
    );
  });

  it("ditolak bila sudah Clock In", () => {
    const r = evaluateAttendance(
      base({ today: { hasIn: true, hasOut: false, inCategory: "HADIR" } }),
    );
    expect(code(r)).toBe("DUPLICATE_IN");
  });

  it("ditolak pada akhir pekan dan hari libur", () => {
    const sat = wib("2026-11-14T07:40:00");
    expect(code(evaluateAttendance(base({ now: sat, capturedAt: sat })))).toBe(
      "NON_WORKDAY",
    );
    const r = evaluateAttendance(
      base({ holidays: [{ date: "2026-11-16", isRecurring: false }] }),
    );
    expect(code(r)).toBe("NON_WORKDAY");
  });

  it("akurasi GPS buruk ditolak", () => {
    expect(code(evaluateAttendance(base({ accuracy: 400 })))).toBe(
      "POOR_ACCURACY",
    );
  });
});

describe("Dinas Luar", () => {
  const dl = (over: Partial<RuleInput> = {}) =>
    base({
      category: "DINAS_LUAR",
      point: far,
      notes: "Rapat di kecamatan",
      ...over,
    });

  it("boleh di luar radius, status PENDING_APPROVAL", () => {
    expect(evaluateAttendance(dl())).toMatchObject({
      ok: true,
      status: "PENDING_APPROVAL",
      category: "DINAS_LUAR",
      locationId: null,
    });
  });

  it("wajib catatan dan foto", () => {
    expect(code(evaluateAttendance(dl({ notes: "  " })))).toBe(
      "NOTES_REQUIRED",
    );
    expect(code(evaluateAttendance(dl({ photoUrl: null })))).toBe(
      "PHOTO_REQUIRED",
    );
  });
});

describe("Clock Out", () => {
  const out = (over: Partial<RuleInput> = {}) =>
    base({
      type: "OUT",
      photoUrl: null,
      now: wib("2026-11-16T15:35:00"),
      capturedAt: wib("2026-11-16T15:35:00"),
      today: {
        hasIn: true,
        hasOut: false,
        inCategory: "HADIR",
        inStatus: "ON_TIME",
      },
      ...over,
    });

  it("cukup GPS tanpa foto", () => {
    expect(evaluateAttendance(out())).toMatchObject({
      ok: true,
      locationId: "kantor",
    });
  });

  it("ditolak tanpa Clock In", () => {
    expect(
      code(evaluateAttendance(out({ today: { hasIn: false, hasOut: false } }))),
    ).toBe("NO_CLOCK_IN");
  });

  it("ditolak bila sudah Clock Out", () => {
    const today = { hasIn: true, hasOut: true, inCategory: "HADIR" as const };
    expect(code(evaluateAttendance(out({ today })))).toBe("DUPLICATE_OUT");
  });

  it("HADIR di luar radius ditolak", () => {
    expect(code(evaluateAttendance(out({ point: far })))).toBe(
      "OUTSIDE_RADIUS",
    );
  });

  it("Dinas Luar tidak terikat radius dan mewarisi status Clock In", () => {
    const today = {
      hasIn: true,
      hasOut: false,
      inCategory: "DINAS_LUAR" as const,
      inStatus: "PENDING_APPROVAL" as const,
    };
    expect(evaluateAttendance(out({ point: far, today }))).toMatchObject({
      ok: true,
      category: "DINAS_LUAR",
      status: "PENDING_APPROVAL",
    });
  });
});

describe("jeda minimal masuk-pulang (15 menit)", () => {
  const inAt = wib("2026-11-16T07:40:00");
  const out = (now: Date, over: Partial<RuleInput> = {}) =>
    base({
      type: "OUT",
      photoUrl: null,
      now,
      capturedAt: now,
      today: { hasIn: true, hasOut: false, inCategory: "HADIR", inAt },
      ...over,
    });

  it("pulang 8 detik setelah masuk ditolak", () => {
    const r = evaluateAttendance(out(new Date(inAt.getTime() + 8_000)));
    expect(code(r)).toBe("TOO_SOON");
  });

  it("14 menit 59 detik ditolak, tepat 15 menit diterima", () => {
    expect(
      code(evaluateAttendance(out(new Date(inAt.getTime() + 899_000)))),
    ).toBe("TOO_SOON");
    expect(
      code(evaluateAttendance(out(new Date(inAt.getTime() + 900_000)))),
    ).toBe("OK");
  });

  it("berlaku juga untuk Dinas Luar", () => {
    const r = evaluateAttendance(
      out(new Date(inAt.getTime() + 8_000), {
        point: far,
        today: { hasIn: true, hasOut: false, inCategory: "DINAS_LUAR", inAt },
      }),
    );
    expect(code(r)).toBe("TOO_SOON");
  });

  it("HADIR di luar radius tetap ditolak (bukan lolos karena jeda)", () => {
    const r = evaluateAttendance(
      out(new Date(inAt.getTime() + 3_600_000), { point: far }),
    );
    expect(code(r)).toBe("OUTSIDE_RADIUS");
  });
});

describe("data offline", () => {
  const off = (capturedAt: Date, over: Partial<RuleInput> = {}) =>
    base({
      isOfflineSync: true,
      capturedAt,
      now: wib("2026-11-16T10:00:00"),
      ...over,
    });

  it("status dihitung dari capturedAt, bukan jam server", () => {
    const r = evaluateAttendance(off(wib("2026-11-16T07:40:00")));
    expect(r).toMatchObject({ ok: true, status: "ON_TIME" });
  });

  it("lebih dari 24 jam ditolak", () => {
    expect(code(evaluateAttendance(off(wib("2026-11-15T09:00:00"))))).toBe(
      "STALE_CAPTURE",
    );
  });

  it("jam perangkat di masa depan ditolak", () => {
    expect(code(evaluateAttendance(off(wib("2026-11-16T11:00:00"))))).toBe(
      "FUTURE_CAPTURE",
    );
  });

  it("di luar radius tetap divalidasi", () => {
    expect(
      code(evaluateAttendance(off(wib("2026-11-16T07:40:00"), { point: far }))),
    ).toBe("OUTSIDE_RADIUS");
  });
});

describe("batas nilai (BVA) akurasi GPS dan umur data offline", () => {
  it("akurasi tepat 100 m diterima, 100.5 m ditolak", () => {
    expect(code(evaluateAttendance(base({ accuracy: 100 })))).toBe("OK");
    expect(code(evaluateAttendance(base({ accuracy: 100.5 })))).toBe(
      "POOR_ACCURACY",
    );
  });

  it("data offline berumur tepat 24 jam diterima, 24 jam + 1 detik ditolak", () => {
    const now = wib("2026-11-17T10:00:00");
    const exactly = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const older = new Date(exactly.getTime() - 1000);
    const mk = (capturedAt: Date) =>
      base({ isOfflineSync: true, now, capturedAt });
    expect(code(evaluateAttendance(mk(exactly)))).toBe("OK");
    expect(code(evaluateAttendance(mk(older)))).toBe("STALE_CAPTURE");
  });
});

describe("summarizeToday", () => {
  it("mengabaikan record REJECTED sehingga bisa mencoba lagi", () => {
    const s = summarizeToday([
      { type: "IN", category: "HADIR", status: "REJECTED" },
    ]);
    expect(s.hasIn).toBe(false);
  });

  it("mendeteksi masuk dan pulang", () => {
    const s = summarizeToday([
      { type: "IN", category: "HADIR", status: "LATE" },
      { type: "OUT", category: "HADIR", status: "ON_TIME" },
    ]);
    expect(s).toMatchObject({
      hasIn: true,
      hasOut: true,
      inCategory: "HADIR",
      inStatus: "LATE",
    });
  });
});
