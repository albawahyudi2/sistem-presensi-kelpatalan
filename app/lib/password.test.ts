import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, validateNewPassword } from "./password";

describe("validateNewPassword", () => {
  const nip = "198001012005011001";
  const ok = (p: string) => validateNewPassword(p, nip).ok;

  it("batas panjang: 9 karakter ditolak, 10 diterima", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(10);
    expect(ok("Kopi7Manis")).toBe(true);
    expect(ok("Kopi7Mani")).toBe(false);
  });

  it("menolak password sama dengan NIP atau mengandung NIP", () => {
    expect(ok(nip)).toBe(false);
    expect(ok("x" + nip + "y")).toBe(false);
  });

  it("menolak pola sederhana: berulang dan berurutan", () => {
    expect(ok("1111111111")).toBe(false);
    expect(ok("abababababab")).toBe(false);
    expect(ok("1234567890")).toBe(false);
    expect(ok("0987654321")).toBe(false);
    expect(ok("abcdefghijk")).toBe(false);
  });

  it("menolak kata umum dan nama instansi", () => {
    expect(ok("password123")).toBe(false);
    expect(ok("Qwerty12345")).toBe(false);
    expect(ok("PatalanJaya9")).toBe(false);
    expect(ok("Admin12345!")).toBe(false);
  });

  it("menerima password yang wajar", () => {
    expect(ok("Kopi7Manis!2")).toBe(true);
    expect(ok("sapi-gemuk-sawah")).toBe(true);
  });

  it("admin (password awal tidak diketahui) tetap divalidasi", () => {
    expect(validateNewPassword("12345678", "").ok).toBe(false);
    expect(validateNewPassword("Kopi7Manis!2", "").ok).toBe(true);
  });
});
