# Change: 03-admin-dashboard (Sprint 3)

## Why
Admin kelurahan perlu mengelola master data, memverifikasi Dinas Luar, mengaudit foto, memantau sebaran kehadiran, dan mencetak laporan kedinasan.

## What Changes
- Dashboard metrik harian (Hadir, Terlambat, Dinas Luar, Izin, Alpha)
- CRUD Pegawai, Lokasi, Hari Libur
- Verifikasi Dinas Luar (approve/reject)
- Audit foto (auto-face crop) dan badge multi-akun per perangkat
- Live Presence Map (Leaflet)
- Rekap dan export Excel kedinasan
- Pencatatan Izin/Sakit manual oleh admin (asumsi, lihat Open Questions di project.md)

## Impact
- Capabilities baru: `admin-management`, `attendance-verification`, `reporting`
- Bergantung pada change 01 dan 02
- Menambah entitas `Leave` (usulan) untuk Izin/Sakit
