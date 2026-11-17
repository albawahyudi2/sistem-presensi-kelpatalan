const EARTH_RADIUS_M = 6_371_008.8;

export type Point = { latitude: number; longitude: number };
export type GeoLocation = Point & { id: string; name: string; radius: number };

export const MAX_GPS_ACCURACY_M = 100;

export function isValidCoordinate(p: Point): boolean {
  return (
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude) &&
    p.latitude >= -90 &&
    p.latitude <= 90 &&
    p.longitude >= -180 &&
    p.longitude <= 180
  );
}

const rad = (deg: number) => (deg * Math.PI) / 180;

export function haversineMeters(a: Point, b: Point): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type GeofenceResult =
  | { ok: true; location: GeoLocation; distanceMeters: number }
  | {
      ok: false;
      reason:
        | "NO_LOCATIONS"
        | "INVALID_COORDINATE"
        | "POOR_ACCURACY"
        | "OUTSIDE_RADIUS";
      nearest?: { location: GeoLocation; distanceMeters: number };
    };

export function checkGeofence(
  point: Point,
  accuracy: number | null | undefined,
  assigned: GeoLocation[],
): GeofenceResult {
  if (!isValidCoordinate(point))
    return { ok: false, reason: "INVALID_COORDINATE" };
  if (assigned.length === 0) return { ok: false, reason: "NO_LOCATIONS" };
  if (accuracy != null && accuracy > MAX_GPS_ACCURACY_M) {
    return { ok: false, reason: "POOR_ACCURACY" };
  }

  const measured = assigned
    .map((location) => ({
      location,
      distanceMeters: haversineMeters(point, location),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  const inside = measured.find((m) => m.distanceMeters <= m.location.radius);
  if (inside) return { ok: true, ...inside };
  return { ok: false, reason: "OUTSIDE_RADIUS", nearest: measured[0] };
}
