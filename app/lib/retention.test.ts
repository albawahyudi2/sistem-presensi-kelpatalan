import { describe, expect, it } from "vitest";
import { loginAttemptCutoff, retentionCutoff } from "./retention";

describe("retentionCutoff", () => {
  it("foto: tepat 365 hari sebelum sekarang", () => {
    const now = new Date("2027-11-16T00:00:00Z");
    expect(retentionCutoff(now).toISOString()).toBe("2026-11-16T00:00:00.000Z");
  });
  it("riwayat login: 30 hari", () => {
    const now = new Date("2026-12-16T00:00:00Z");
    expect(loginAttemptCutoff(now).toISOString()).toBe(
      "2026-11-16T00:00:00.000Z",
    );
  });
});
