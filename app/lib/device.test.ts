import { describe, expect, it } from "vitest";
import { clientIp } from "./device";

const h = (init: Record<string, string>) => new Headers(init);

describe("clientIp", () => {
  it("mengambil alamat pertama dari x-forwarded-for", () => {
    expect(clientIp(h({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }))).toBe(
      "203.0.113.9",
    );
  });
  it("jatuh ke x-real-ip", () => {
    expect(clientIp(h({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
  });
  it("tanpa header menghasilkan null (batas IP tidak diterapkan)", () => {
    expect(clientIp(h({}))).toBeNull();
  });
  it("menolak nilai terlalu panjang", () => {
    expect(clientIp(h({ "x-forwarded-for": "x".repeat(60) }))).toBeNull();
  });
});
