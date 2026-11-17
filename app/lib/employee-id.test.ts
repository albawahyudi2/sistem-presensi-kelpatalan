import { describe, expect, it } from "vitest";
import { validateEmployeeId } from "./employee-id";

describe("validateEmployeeId", () => {
  it("NIP 18 digit diterima", () => {
    expect(validateEmployeeId("198001012005011001").ok).toBe(true);
  });
  it("angka saja dengan panjang selain 18 ditolak (salah ketik)", () => {
    expect(validateEmployeeId("19800101200501100").ok).toBe(false);
    expect(validateEmployeeId("1980010120050110011").ok).toBe(false);
    expect(validateEmployeeId("12345").ok).toBe(false);
  });
  it("ID non-PNS huruf/angka 4-30 diterima", () => {
    expect(validateEmployeeId("RT0012").ok).toBe(true);
    expect(validateEmployeeId("UJI0001").ok).toBe(true);
  });
  it("karakter terlarang atau terlalu pendek ditolak", () => {
    expect(validateEmployeeId("RT-12").ok).toBe(false);
    expect(validateEmployeeId("AB1").ok).toBe(false);
    expect(validateEmployeeId("").ok).toBe(false);
  });
});
