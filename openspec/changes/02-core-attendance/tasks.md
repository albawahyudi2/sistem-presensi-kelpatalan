# Tasks: 02-core-attendance

## 1. Geofencing & aturan waktu
- [x] 1.1 `lib/geo.ts` `haversineMeters` + unit test
- [x] 1.2 `lib/work-time.ts` `computeClockInStatus` (WIB, batas 07.45:00/07.45:01, menit telat dari 07.30 dibulatkan ke bawah), hari kerja/libur/akhir pekan, jam pulang Sen-Kam/Jum + unit test
- [x] 1.3 `checkGeofence` multi-lokasi (lokasi terdekat yang cocok, batas inklusif, akurasi GPS maks 100 m) + unit test

## 2. Dashboard pegawai
- [x] 2.1 Dashboard pegawai (jam WIB real-time, jam masuk/pulang, status, lokasi penugasan); render terverifikasi dengan sesi pegawai
- [~] 2.2 Riwayat bulanan `/riwayat` (navigasi bulan, penanda tidak Clock Out dan ditolak); typecheck dan build lolos, belum di-render dengan sesi pegawai

## 3. Clock In
- [~] 3.1 `components/clock-in-flow.tsx`: GPS, kamera (bingkai oval, 720p), belum diuji di perangkat nyata
- [~] 3.2 Watermark canvas (WIB, Lat/Long, NIP, hash SHA-256) + WebP adaptif (0.8 normal, 0.5 dan 640px di jaringan lambat); fallback JPEG bila peramban (iOS Safari) tidak mendukung WebP. Belum diuji di perangkat nyata
- [~] 3.3 `POST /api/upload/sign` (tanda tangan SHA-1, folder `presensi/{userId}`) selesai; menunggu `CLOUDINARY_CLOUD_NAME`
- [x] 3.4 `submitAttendance` (server action) + `lib/attendance-service.ts` + `lib/attendance-rules.ts`: validasi sesi, radius, duplikat, foto tepercaya, idempotensi. Terverifikasi 14 skenario ke Neon

## 4. Clock Out
- [x] 4.1 Clock Out 1-klik GPS tanpa foto (tombol Absen Pulang + aturan server)

## 5. Dinas Luar
- [~] 5.1 Alur Dinas Luar (foto kegiatan, catatan wajib, PENDING_APPROVAL) selesai di server dan UI; belum diuji di perangkat nyata

## 6. Offline-first
- [x] 6.1 `lib/offline-queue.ts` (Dexie/IndexedDB): payload, foto blob, `capturedAt`, antrean per pengguna; 6 unit test
- [~] 6.2 Sinkronisasi dipicu saat aplikasi dibuka, event `online`, tab kembali aktif, dan tiap 60 detik (berlaku sama di Android, iOS, Windows). Background Sync di service worker TIDAK dipakai (server action tidak dapat dipanggil dari SW dan iOS tidak mendukungnya)
- [x] 6.3 Idempotency key per entri: antrean memakai kunci yang sama dan server menolak ganda (terverifikasi ke database)
- [~] 6.4 Banner "menunggu sinkronisasi" + tombol Kirim sekarang (`components/offline-sync.tsx`); belum diuji di perangkat nyata

## 7. Test
- [ ] 7.1 Unit (Haversine, status), integrasi (clockIn/Out), uji perangkat nyata via HTTPS tunnel
