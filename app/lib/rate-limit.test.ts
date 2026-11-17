import { describe, expect, it } from "vitest";
import { evaluateLock } from "./rate-limit";

const now = new Date("2026-11-16T01:00:00Z");
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);

describe("evaluateLock", () => {
  it("tidak terkunci bila gagal kurang dari 5", () => {
    const r = evaluateLock([1, 2, 3, 4].map(minutesAgo), now);
    expect(r.locked).toBe(false);
  });

  it("terkunci pada 5 kegagalan dalam 15 menit", () => {
    const r = evaluateLock([1, 2, 3, 4, 5].map(minutesAgo), now);
    expect(r.locked).toBe(true);
  });

  it("kegagalan di luar jendela 15 menit tidak dihitung", () => {
    const r = evaluateLock([1, 2, 3, 4, 16].map(minutesAgo), now);
    expect(r.locked).toBe(false);
  });

  it("retryAfter mengikuti kegagalan ke-5 terbaru dalam jendela", () => {
    const r = evaluateLock([14, 10, 5, 3, 1].map(minutesAgo), now);
    expect(r).toEqual({ locked: true, retryAfterSeconds: 60 });
  });

  it("daftar kosong tidak terkunci", () => {
    expect(evaluateLock([], now).locked).toBe(false);
  });
});

describe("evaluateLock dengan batas per IP", () => {
  const now2 = new Date("2026-11-16T01:00:00Z");
  const ago = (m: number) => new Date(now2.getTime() - m * 60_000);

  it("29 kegagalan belum terkunci, 30 terkunci (batas 30)", () => {
    const f = (n: number) =>
      Array.from({ length: n }, (_, i) => ago(1 + (i % 10)));
    expect(evaluateLock(f(29), now2, 30).locked).toBe(false);
    expect(evaluateLock(f(30), now2, 30).locked).toBe(true);
  });
});
