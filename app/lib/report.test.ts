import { describe, expect, it } from "vitest";
import {
  computeRecap,
  dateKeysBetween,
  isDayCompleted,
  type RecapAttendance,
  type RecapUser,
} from "./report";

const wib = (iso: string) => new Date(`${iso}+07:00`);
const USER: RecapUser = {
  id: "u1",
  nip: "1",
  name: "A",
  position: "Staf",
  createdAt: wib("2026-01-01T00:00:00"),
};

const att = (over: Partial<RecapAttendance>): RecapAttendance => ({
  userId: "u1",
  type: "IN",
  category: "HADIR",
  status: "ON_TIME",
  lateMinutes: 0,
  capturedAt: wib("2026-11-16T07:30:00"),
  ...over,
});

// 16-20 Nov 2026 = Senin-Jumat; sekarang = Sabtu 21 Nov (semua hari selesai)
const NOW = wib("2026-11-21T10:00:00");
const run = (over: Partial<Parameters<typeof computeRecap>[0]> = {}) =>
  computeRecap({
    users: [USER],
    attendances: [],
    leaves: [],
    holidays: [],
    from: "2026-11-16",
    to: "2026-11-20",
    now: NOW,
    ...over,
  }).rows[0];

describe("dateKeysBetween", () => {
  it("inklusif dan melewati pergantian bulan", () => {
    expect(dateKeysBetween("2026-11-29", "2026-12-02")).toEqual([
      "2026-11-29",
      "2026-11-30",
      "2026-12-01",
      "2026-12-02",
    ]);
  });
});

describe("isDayCompleted", () => {
  it("hari kemarin selesai, besok belum", () => {
    const now = wib("2026-11-18T09:00:00");
    expect(isDayCompleted("2026-11-17", now)).toBe(true);
    expect(isDayCompleted("2026-11-19", now)).toBe(false);
  });
  it("hari ini selesai setelah jam pulang (Rabu 15.30, Jumat 14.30)", () => {
    expect(isDayCompleted("2026-11-18", wib("2026-11-18T15:29:00"))).toBe(
      false,
    );
    expect(isDayCompleted("2026-11-18", wib("2026-11-18T15:30:00"))).toBe(true);
    expect(isDayCompleted("2026-11-20", wib("2026-11-20T14:30:00"))).toBe(true);
  });
});

describe("computeRecap", () => {
  it("tanpa data: 5 hari kerja menjadi Alpha", () => {
    const r = run();
    expect(r).toMatchObject({ workdays: 5, alpha: 5, hadir: 0, percentage: 0 });
  });

  it("hadir tepat waktu dan terlambat dengan akumulasi menit", () => {
    const r = run({
      attendances: [
        att({ capturedAt: wib("2026-11-16T07:30:00") }),
        att({
          status: "LATE",
          lateMinutes: 20,
          capturedAt: wib("2026-11-17T07:50:00"),
        }),
        att({
          status: "LATE",
          lateMinutes: 40,
          capturedAt: wib("2026-11-18T08:10:00"),
        }),
      ],
    });
    expect(r).toMatchObject({
      hadir: 3,
      lateDays: 2,
      lateMinutes: 60,
      alpha: 2,
    });
  });

  it("persentase 90.91 untuk 18 hadir + 2 dinas luar dari 22 hari kerja", () => {
    const users = [USER];
    const attendances: RecapAttendance[] = [];
    const days = dateKeysBetween("2026-10-01", "2026-10-31").filter((k) => {
      const d = new Date(`${k}T12:00:00+07:00`).getDay();
      return d !== 0 && d !== 6;
    });
    expect(days).toHaveLength(22);
    const effective = days;
    effective
      .slice(0, 18)
      .forEach((k) =>
        attendances.push(att({ capturedAt: wib(`${k}T07:30:00`) })),
      );
    effective.slice(18, 20).forEach((k) =>
      attendances.push(
        att({
          category: "DINAS_LUAR",
          status: "APPROVED",
          capturedAt: wib(`${k}T07:30:00`),
        }),
      ),
    );
    const r = computeRecap({
      users,
      attendances,
      leaves: [],
      holidays: [],
      from: "2026-10-01",
      to: "2026-10-31",
      now: wib("2026-11-05T10:00:00"),
    }).rows[0];
    expect(r.workdays).toBe(22);
    expect(r.hadir).toBe(18);
    expect(r.dinasLuar).toBe(2);
    expect(r.percentage).toBe(90.91);
  });

  it("Dinas Luar PENDING tidak dihitung hadir dan menjadi Alpha sampai disetujui", () => {
    const r = run({
      attendances: [
        att({ category: "DINAS_LUAR", status: "PENDING_APPROVAL" }),
      ],
    });
    expect(r).toMatchObject({ dinasLuar: 0, pendingDinasLuar: 1, alpha: 5 });
  });

  it("Dinas Luar APPROVED dihitung, REJECTED diabaikan", () => {
    const r = run({
      attendances: [
        att({ category: "DINAS_LUAR", status: "APPROVED" }),
        att({
          category: "DINAS_LUAR",
          status: "REJECTED",
          capturedAt: wib("2026-11-17T07:30:00"),
        }),
      ],
    });
    expect(r).toMatchObject({ dinasLuar: 1, alpha: 4 });
  });

  it("Izin/Sakit mengurangi Alpha", () => {
    const r = run({
      leaves: [{ userId: "u1", date: "2026-11-17", kind: "SAKIT" }],
    });
    expect(r).toMatchObject({ izinSakit: 1, alpha: 4 });
  });

  it("hari libur dan akhir pekan tidak dihitung", () => {
    const r = run({
      from: "2026-11-14",
      to: "2026-11-22",
      holidays: [{ date: "2026-11-18", isRecurring: false }],
    });
    expect(r.workdays).toBe(4);
    expect(r.alpha).toBe(4);
  });

  it("hari berjalan belum jam pulang tidak menjadi Alpha", () => {
    const r = run({
      from: "2026-11-18",
      to: "2026-11-18",
      now: wib("2026-11-18T10:00:00"),
    });
    expect(r).toMatchObject({ workdays: 0, alpha: 0 });
  });

  it("hadir tanpa Clock Out tetap hadir dan dicatat 'tidak Clock Out'", () => {
    const r = run({
      attendances: [
        att({ capturedAt: wib("2026-11-16T07:30:00") }),
        att({ type: "OUT", capturedAt: wib("2026-11-16T15:35:00") }),
        att({ capturedAt: wib("2026-11-17T07:30:00") }),
      ],
    });
    expect(r.hadir).toBe(2);
    expect(r.noClockOut).toEqual(["2026-11-17"]);
  });

  it("hari sebelum akun dibuat tidak dihitung Alpha", () => {
    const late: RecapUser = { ...USER, createdAt: wib("2026-11-18T09:00:00") };
    const r = run({ users: [late] });
    expect(r.workdays).toBe(3);
    expect(r.alpha).toBe(3);
  });
});
