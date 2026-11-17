import { describe, expect, it } from "vitest";
import {
  computeClockInStatus,
  isHoliday,
  isWeekend,
  isWorkday,
  wibDateKey,
  workEndMinutes,
} from "./work-time";

// 16 Nov 2026 = Senin. WIB = UTC+7.
const wib = (iso: string) => new Date(`${iso}+07:00`);

describe("computeClockInStatus (batas toleransi 07.45:00 WIB)", () => {
  it("07.30 tepat waktu", () => {
    expect(computeClockInStatus(wib("2026-11-16T07:30:00"))).toEqual({
      status: "ON_TIME",
      lateMinutes: 0,
    });
  });

  it("sebelum jam masuk tepat waktu", () => {
    expect(computeClockInStatus(wib("2026-11-16T06:50:00")).status).toBe(
      "ON_TIME",
    );
  });

  it("07.45:00 masih tepat waktu (batas inklusif)", () => {
    expect(computeClockInStatus(wib("2026-11-16T07:45:00")).status).toBe(
      "ON_TIME",
    );
  });

  it("07.45:01 terlambat", () => {
    const r = computeClockInStatus(wib("2026-11-16T07:45:01"));
    expect(r.status).toBe("LATE");
    expect(r.lateMinutes).toBe(15);
  });

  it("07.46 terlambat 16 menit (dihitung dari 07.30)", () => {
    expect(computeClockInStatus(wib("2026-11-16T07:46:00"))).toEqual({
      status: "LATE",
      lateMinutes: 16,
    });
  });

  it("08.30 terlambat 60 menit", () => {
    expect(computeClockInStatus(wib("2026-11-16T08:30:00")).lateMinutes).toBe(
      60,
    );
  });

  it("memakai WIB walau input UTC (00:46 UTC = 07:46 WIB)", () => {
    expect(computeClockInStatus(new Date("2026-11-16T00:46:00Z")).status).toBe(
      "LATE",
    );
  });
});

describe("hari kerja", () => {
  it("Sabtu dan Minggu bukan hari kerja", () => {
    expect(isWeekend(wib("2026-11-14T10:00:00"))).toBe(true);
    expect(isWeekend(wib("2026-11-15T10:00:00"))).toBe(true);
    expect(isWeekend(wib("2026-11-16T10:00:00"))).toBe(false);
  });

  it("tanggal ditentukan dalam WIB (23.30 WIB Minggu masih Minggu)", () => {
    expect(wibDateKey(new Date("2026-11-15T16:30:00Z"))).toBe("2026-11-15");
    expect(wibDateKey(new Date("2026-11-15T17:30:00Z"))).toBe("2026-11-16");
  });

  it("hari libur tanggal tertentu", () => {
    const holidays = [{ date: "2026-12-25", isRecurring: false }];
    expect(isHoliday(wib("2026-12-25T08:00:00"), holidays)).toBe(true);
    expect(isHoliday(wib("2027-12-25T08:00:00"), holidays)).toBe(false);
  });

  it("hari libur berulang berlaku tiap tahun", () => {
    const holidays = [
      { date: new Date("2026-08-17T00:00:00Z"), isRecurring: true },
    ];
    expect(isHoliday(wib("2030-08-17T08:00:00"), holidays)).toBe(true);
  });

  it("isWorkday menggabungkan akhir pekan dan libur", () => {
    const holidays = [{ date: "2026-11-17", isRecurring: false }];
    expect(isWorkday(wib("2026-11-16T08:00:00"), holidays)).toBe(true);
    expect(isWorkday(wib("2026-11-17T08:00:00"), holidays)).toBe(false);
    expect(isWorkday(wib("2026-11-14T08:00:00"), holidays)).toBe(false);
  });
});

describe("jam pulang", () => {
  it("Senin-Kamis 15.30, Jumat 14.30", () => {
    expect(workEndMinutes(wib("2026-11-16T08:00:00"))).toBe(15 * 60 + 30);
    expect(workEndMinutes(wib("2026-11-20T08:00:00"))).toBe(14 * 60 + 30);
  });
});
