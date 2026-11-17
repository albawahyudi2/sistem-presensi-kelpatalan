# admin-management Specification (delta)

## ADDED Requirements

### Requirement: Manajemen Pegawai
ADMIN SHALL dapat menambah, mengubah, menonaktifkan, dan mereset password pegawai serta menetapkan satu atau lebih lokasi penugasan (minimal satu). Penonaktifan SHALL mempertahankan riwayat presensi. Reset password SHALL mengembalikan password ke NIP dengan `mustChangePassword = true`.

#### Scenario: Tambah pegawai
- **WHEN** admin menyimpan pegawai baru dengan NIP, nama, jabatan, lokasi
- **THEN** akun aktif terbuat dengan password default NIP

#### Scenario: Nonaktifkan
- **WHEN** admin menonaktifkan pegawai
- **THEN** pegawai tidak dapat login dan riwayat tetap ada

#### Scenario: Reset password
- **WHEN** admin mereset password pegawai
- **THEN** password kembali ke NIP dan pegawai wajib menggantinya saat login berikutnya

### Requirement: Konfirmasi Aksi Destruktif
Aksi hapus (lokasi, hari libur, catatan izin/sakit), nonaktifkan pegawai, dan reset password SHALL meminta konfirmasi lewat dialog sebelum dijalankan.

#### Scenario: Hapus hari libur
- **WHEN** admin menekan Hapus pada hari libur
- **THEN** dialog konfirmasi tampil; data baru terhapus setelah admin memilih "Ya, hapus"

### Requirement: Manajemen Lokasi
ADMIN SHALL mengelola lokasi (nama, latitude, longitude, radius 50-150 m). Lokasi yang masih ditugaskan ke pegawai aktif SHALL tidak dapat dihapus.

#### Scenario: Radius di luar rentang
- **WHEN** admin mengisi radius 200 m
- **THEN** ditolak dengan pesan rentang 50-150 m

#### Scenario: Hapus lokasi terpakai
- **WHEN** admin menghapus lokasi yang masih dipakai pegawai
- **THEN** ditolak

### Requirement: Manajemen Hari Libur
ADMIN SHALL mengelola hari libur (nama, tanggal, berulang). Sistem SHALL tidak menghitung Alpha dan menolak presensi pada tanggal libur.

#### Scenario: Tambah libur lokal
- **WHEN** admin menambahkan "Merti Desa" pada tanggal tertentu
- **THEN** tanggal itu non-kerja bagi seluruh pegawai

### Requirement: Pencatatan Izin/Sakit
ADMIN SHALL dapat mencatat Izin atau Sakit per pegawai per tanggal beserta keterangan. Hari ber-Izin/Sakit SHALL tidak dihitung Alpha.

#### Scenario: Pegawai sudah presensi
- **WHEN** admin mencatat izin/sakit pada tanggal ketika pegawai sudah presensi masuk (HADIR, atau Dinas Luar yang disetujui/menunggu)
- **THEN** ditolak dengan pesan bahwa pegawai sudah presensi pada tanggal itu

#### Scenario: Catatan lama yang bentrok
- **WHEN** sebuah catatan izin/sakit ternyata bertanggal sama dengan presensi pegawai
- **THEN** daftar menandainya "Bentrok" agar admin dapat meninjau

#### Scenario: Catat sakit
- **WHEN** admin mencatat Sakit untuk pegawai pada suatu hari kerja
- **THEN** hari itu terhitung Izin/Sakit pada rekap
