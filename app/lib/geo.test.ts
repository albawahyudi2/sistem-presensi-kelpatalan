import { describe, expect, it } from "vitest";
import {
  checkGeofence,
  haversineMeters,
  isValidCoordinate,
  type GeoLocation,
} from "./geo";

const OFFICE: GeoLocation = {
  id: "kantor",
  name: "Kantor Kelurahan Patalan",
  latitude: -7.9285979,
  longitude: 110.349427,
  radius: 50,
};
const BOBOK: GeoLocation = {
  id: "bobok",
  name: "Padukuhan Bobok",
  latitude: -7.935,
  longitude: 110.355,
  radius: 100,
};

// 1 derajat lintang ≈ 111.195 km → offset utara dalam meter
const northOf = (p: GeoLocation, meters: number) => ({
  latitude: p.latitude + meters / 111_195,
  longitude: p.longitude,
});

describe("haversineMeters", () => {
  it("jarak titik yang sama = 0", () => {
    expect(haversineMeters(OFFICE, OFFICE)).toBe(0);
  });

  it("1 derajat lintang ≈ 111.195 m", () => {
    const d = haversineMeters(
      { latitude: 0, longitude: 0 },
      { latitude: 1, longitude: 0 },
    );
    expect(d).toBeGreaterThan(111_100);
    expect(d).toBeLessThan(111_300);
  });

  it("jarak Yogyakarta - Jakarta ≈ 430-440 km", () => {
    const d = haversineMeters(
      { latitude: -7.7956, longitude: 110.3695 },
      { latitude: -6.2088, longitude: 106.8456 },
    );
    expect(d / 1000).toBeGreaterThan(425);
    expect(d / 1000).toBeLessThan(445);
  });

  it("simetris", () => {
    expect(haversineMeters(OFFICE, BOBOK)).toBeCloseTo(
      haversineMeters(BOBOK, OFFICE),
      6,
    );
  });
});

describe("isValidCoordinate", () => {
  it("menolak NaN dan di luar rentang", () => {
    expect(isValidCoordinate({ latitude: NaN, longitude: 0 })).toBe(false);
    expect(isValidCoordinate({ latitude: 91, longitude: 0 })).toBe(false);
    expect(isValidCoordinate({ latitude: 0, longitude: 181 })).toBe(false);
    expect(isValidCoordinate(OFFICE)).toBe(true);
  });
});

describe("checkGeofence", () => {
  it("diterima di dalam radius (30 m dari kantor radius 50 m)", () => {
    const r = checkGeofence(northOf(OFFICE, 30), 10, [OFFICE]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.location.id).toBe("kantor");
      expect(r.distanceMeters).toBeGreaterThan(29);
      expect(r.distanceMeters).toBeLessThan(31);
    }
  });

  it("batas inklusif: tepat di radius diterima", () => {
    const point = northOf(OFFICE, 50);
    const edge: GeoLocation = {
      ...OFFICE,
      radius: haversineMeters(OFFICE, point),
    };
    expect(checkGeofence(point, 10, [edge]).ok).toBe(true);
    expect(
      checkGeofence(point, 10, [{ ...edge, radius: edge.radius - 0.01 }]).ok,
    ).toBe(false);
  });

  it("ditolak 51 m untuk radius 50 m dan melaporkan lokasi terdekat", () => {
    const r = checkGeofence(northOf(OFFICE, 52), 10, [OFFICE]);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("OUTSIDE_RADIUS");
      expect(r.nearest?.location.id).toBe("kantor");
    }
  });

  it("dua lokasi penugasan: memilih yang cocok", () => {
    const r = checkGeofence(northOf(BOBOK, 20), 10, [OFFICE, BOBOK]);
    expect(r.ok && r.location.id).toBe("bobok");
  });

  it("lokasi di luar penugasan tidak diperhitungkan", () => {
    const r = checkGeofence(northOf(BOBOK, 20), 10, [OFFICE]);
    expect(r.ok).toBe(false);
  });

  it("menolak akurasi GPS buruk (> 100 m)", () => {
    const r = checkGeofence(northOf(OFFICE, 5), 500, [OFFICE]);
    expect(r).toMatchObject({ ok: false, reason: "POOR_ACCURACY" });
  });

  it("akurasi tidak tersedia tetap divalidasi radius", () => {
    expect(checkGeofence(northOf(OFFICE, 5), null, [OFFICE]).ok).toBe(true);
  });

  it("menolak koordinat tidak valid dan pegawai tanpa lokasi", () => {
    expect(
      checkGeofence({ latitude: NaN, longitude: 1 }, 5, [OFFICE]),
    ).toMatchObject({
      reason: "INVALID_COORDINATE",
    });
    expect(checkGeofence(OFFICE, 5, [])).toMatchObject({
      reason: "NO_LOCATIONS",
    });
  });
});
