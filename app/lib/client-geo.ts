export type GpsFix = { latitude: number; longitude: number; accuracy: number };

export function getGpsFix(): Promise<GpsFix> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Perangkat tidak mendukung GPS."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy,
        }),
      (e) => {
        if (e.code === e.PERMISSION_DENIED) {
          reject(
            new Error(
              "Izin lokasi ditolak. Aktifkan izin lokasi untuk aplikasi ini di pengaturan peramban.",
            ),
          );
        } else if (e.code === e.TIMEOUT) {
          reject(
            new Error("GPS terlalu lama merespons. Coba lagi di area terbuka."),
          );
        } else {
          reject(new Error("Lokasi tidak tersedia. Pastikan GPS aktif."));
        }
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    );
  });
}
