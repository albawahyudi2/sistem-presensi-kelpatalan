# pwa-installability Specification (delta)

## ADDED Requirements

### Requirement: Installable PWA
Aplikasi SHALL menyediakan Web App Manifest dan Service Worker sehingga dapat dipasang ke layar utama (Add to Home Screen) dan membuka antarmuka dasar saat offline.

#### Scenario: Pasang ke layar utama
- **WHEN** pegawai membuka aplikasi lewat HTTPS di Chrome Android
- **THEN** opsi pasang tersedia dan aplikasi terbuka standalone dengan ikon kelurahan

#### Scenario: Buka saat offline
- **WHEN** aplikasi dibuka tanpa koneksi
- **THEN** shell aplikasi dan antrean presensi lokal tetap tampil

### Requirement: HTTPS Wajib
Seluruh akses kamera dan GPS SHALL melalui HTTPS (produksi Vercel; pengembangan via tunnel HTTPS).

#### Scenario: Akses non-HTTPS
- **WHEN** halaman presensi dibuka tanpa HTTPS
- **THEN** fitur kamera/GPS tidak diaktifkan dan pengguna diberi pesan
