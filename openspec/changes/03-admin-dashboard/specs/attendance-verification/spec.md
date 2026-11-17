# attendance-verification Specification (delta)

## ADDED Requirements

### Requirement: Verifikasi Dinas Luar
ADMIN SHALL meninjau presensi `PENDING_APPROVAL` (foto kegiatan, catatan, lokasi) dan menyetujui (`APPROVED`) atau menolak (`REJECTED`, alasan wajib). Keputusan SHALL mencatat admin dan waktu. Dinas Luar `APPROVED` dihitung hadir; `REJECTED` dan `PENDING_APPROVAL` tidak.

#### Scenario: Setujui
- **WHEN** admin menyetujui pengajuan
- **THEN** status `APPROVED` dan dihitung sebagai Dinas Luar pada rekap

#### Scenario: Tolak tanpa alasan
- **WHEN** admin menolak tanpa mengisi alasan
- **THEN** ditolak oleh sistem

#### Scenario: Pegawai mencoba memverifikasi
- **WHEN** PEGAWAI memanggil API verifikasi
- **THEN** 403

### Requirement: Audit Visual Foto
ADMIN SHALL melihat foto Clock In dengan thumbnail auto-face crop Cloudinary (`c_thumb,g_face`) dan dapat membuka versi penuh.

#### Scenario: Galeri audit
- **WHEN** admin membuka audit foto tanggal tertentu
- **THEN** thumbnail wajah tampil beserta nama, jam, status, dan jarak

### Requirement: Foto Tidak Dapat Diakses Publik
Foto presensi SHALL disimpan di Cloudinary dengan tipe `authenticated` (tanda tangan wajib) dan SHALL disajikan hanya lewat `GET /api/admin/foto/{id}?v=thumb|full` yang memeriksa sesi ADMIN aktif, mengambil gambar dari Cloudinary di sisi server. URL Cloudinary SHALL NOT muncul pada HTML halaman. Server SHALL menolak foto presensi yang bukan bertipe `authenticated` atau bukan milik folder pegawai yang bersangkutan.

#### Scenario: Admin melihat foto
- **WHEN** admin membuka Audit Foto
- **THEN** gambar dimuat dari endpoint aplikasi dan HTML tidak memuat URL res.cloudinary.com

#### Scenario: Tanpa sesi atau sebagai pegawai
- **WHEN** endpoint foto dipanggil tanpa sesi atau oleh PEGAWAI
- **THEN** 401 atau 403

#### Scenario: Tautan langsung tanpa tanda tangan
- **WHEN** seseorang membuka URL Cloudinary foto tanpa segmen tanda tangan
- **THEN** ditolak (bukan 200)

#### Scenario: Klien mencoba mengunggah sebagai publik
- **WHEN** klien mengirim `type=upload` dengan tanda tangan yang dikeluarkan server
- **THEN** Cloudinary menolak karena tanda tangan tidak cocok

### Requirement: Label Transparansi Perangkat
Sistem SHALL menampilkan badge informatif bila satu `deviceSignature` dipakai oleh lebih dari satu akun pada hari yang sama, tanpa memblokir presensi.

#### Scenario: Satu HP dua akun
- **WHEN** dua pegawai Clock In dari perangkat yang sama pada hari yang sama
- **THEN** kedua entri berbadge "perangkat dipakai bersama"

### Requirement: Live Presence Map
ADMIN SHALL melihat peta (Leaflet) dengan lingkaran geofence setiap lokasi dan pin kehadiran riil hari ini. Komponen peta SHALL dimuat dengan dynamic import `ssr: false`.

#### Scenario: Peta hari ini
- **WHEN** admin membuka Live Map
- **THEN** geofence kantor/padukuhan dan pin presensi hari ini tampil, pin dapat diklik menampilkan nama dan jam
