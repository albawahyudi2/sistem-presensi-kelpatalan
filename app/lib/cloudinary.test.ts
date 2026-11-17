import { beforeAll, describe, expect, it } from "vitest";
import { deliveryUrl, isTrustedPhotoUrl, parsePhotoUrl } from "./cloudinary";

beforeAll(() => {
  process.env.CLOUDINARY_CLOUD_NAME = "demo";
  process.env.CLOUDINARY_API_KEY = "123456";
  process.env.CLOUDINARY_API_SECRET = "secret-uji";
});

const AUTH =
  "https://res.cloudinary.com/demo/image/authenticated/s--AbCd1234--/v1700000000/presensi/u1/foto.webp";

describe("parsePhotoUrl", () => {
  it("authenticated bertanda tangan: abaikan segmen s--, ambil versi dan public_id", () => {
    expect(parsePhotoUrl(AUTH)).toEqual({
      type: "authenticated",
      publicId: "presensi/u1/foto",
      version: "1700000000",
      format: "webp",
    });
  });
  it("upload publik lama tetap terbaca", () => {
    expect(
      parsePhotoUrl(
        "https://res.cloudinary.com/demo/image/upload/v12/presensi/u1/a.jpg",
      ),
    ).toMatchObject({
      type: "upload",
      publicId: "presensi/u1/a",
      version: "12",
      format: "jpg",
    });
  });
  it("tanpa versi", () => {
    expect(
      parsePhotoUrl(
        "https://res.cloudinary.com/demo/image/authenticated/presensi/u1/a.webp",
      ),
    ).toMatchObject({ publicId: "presensi/u1/a", version: undefined });
  });
  it("menolak host lain, video, dan URL rusak", () => {
    expect(
      parsePhotoUrl("https://evil.com/demo/image/upload/v1/a.jpg"),
    ).toBeNull();
    expect(
      parsePhotoUrl("https://res.cloudinary.com/demo/video/upload/a.mp4"),
    ).toBeNull();
    expect(parsePhotoUrl("bukan-url")).toBeNull();
  });
});

describe("isTrustedPhotoUrl", () => {
  it("menerima foto authenticated milik pegawai itu", () => {
    expect(isTrustedPhotoUrl(AUTH, "u1", "demo")).toBe(true);
  });
  it("menolak tipe upload (publik), pegawai lain, cloud lain, cloud kosong", () => {
    const pub =
      "https://res.cloudinary.com/demo/image/upload/v1/presensi/u1/a.webp";
    expect(isTrustedPhotoUrl(pub, "u1", "demo")).toBe(false);
    expect(isTrustedPhotoUrl(AUTH, "u2", "demo")).toBe(false);
    expect(isTrustedPhotoUrl(AUTH, "u1", "lain")).toBe(false);
    expect(isTrustedPhotoUrl(AUTH, "u1", "")).toBe(false);
    expect(isTrustedPhotoUrl("https://evil.com/x", "u1", "demo")).toBe(false);
  });
  it("menolak awalan folder yang mirip (u1 vs u10)", () => {
    const u10 =
      "https://res.cloudinary.com/demo/image/authenticated/v1/presensi/u10/a.webp";
    expect(isTrustedPhotoUrl(u10, "u1", "demo")).toBe(false);
  });
});

describe("deliveryUrl", () => {
  const ref = parsePhotoUrl(AUTH)!;
  it("thumbnail wajah bertanda tangan (s--) dengan crop thumb + gravity face", () => {
    const url = deliveryUrl(ref, "thumb", true);
    expect(url).toContain("/image/authenticated/");
    expect(url).toMatch(/s--[A-Za-z0-9_-]{8}--/);
    expect(url).toContain("c_thumb,g_face,h_240,w_240");
  });
  it("Dinas Luar memakai fill + auto gravity", () => {
    expect(deliveryUrl(ref, "thumb", false)).toContain(
      "c_fill,g_auto,h_240,w_240",
    );
  });
  it("versi penuh dibatasi lebar 1280", () => {
    expect(deliveryUrl(ref, "full", true)).toContain("c_limit,w_1280");
  });
  it("tipe upload lama tidak bertanda tangan", () => {
    const legacy = parsePhotoUrl(
      "https://res.cloudinary.com/demo/image/upload/v1/presensi/u1/a.webp",
    )!;
    expect(deliveryUrl(legacy, "thumb", true)).not.toMatch(/s--/);
  });
});
