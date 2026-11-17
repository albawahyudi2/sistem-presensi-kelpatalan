# Change: 02-core-attendance (Sprint 2)

## Why
Inti produk: pegawai harus dapat Clock In (GPS + selfie formal) dan Clock Out (GPS saja), dengan validasi geofence server-side, kategori Dinas Luar, dan tetap berfungsi saat sinyal buruk.

## What Changes
- Dashboard pegawai (jam real-time, status hari ini, lokasi penugasan, riwayat bulanan)
- Haversine engine server-side + aturan jam kerja/toleransi
- Clock In dengan selfie (oval frame, watermark, WebP adaptif, signed upload Cloudinary)
- Clock Out 1-klik tanpa foto
- Dinas Luar (foto kegiatan + catatan, `PENDING_APPROVAL`)
- Offline-first: antrean IndexedDB + Background Sync

## Impact
- Capabilities baru: `attendance`, `geofencing`, `offline-sync`
- Bergantung pada change 01
- Risiko: izin kamera/GPS di HTTPS, RAM kecil Android, selisih jam perangkat pada data offline
