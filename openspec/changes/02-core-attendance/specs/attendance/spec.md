# attendance Specification (delta)

## ADDED Requirements

### Requirement: Aturan Jam Kerja dan Toleransi
Sistem SHALL menggunakan jam kerja Senin-Kamis 07.30-15.30 WIB dan Jumat 07.30-14.30 WIB, seragam untuk semua pegawai. Clock In dengan waktu <= 07.45:00 WIB SHALL berstatus `ON_TIME`; setelahnya `LATE` dengan menit keterlambatan dihitung dari 07.30.

#### Scenario: Tepat waktu
- **WHEN** Clock In pada 07.45:00 WIB
- **THEN** status `ON_TIME`

#### Scenario: Terlambat
- **WHEN** Clock In pada 07.46 WIB
- **THEN** status `LATE` dengan 16 menit keterlambatan

#### Scenario: Hari libur atau akhir pekan
- **WHEN** pegawai mencoba Clock In pada Sabtu, Minggu, atau tanggal `Holiday`
- **THEN** ditolak dengan pesan hari non-kerja

### Requirement: Clock In dengan Selfie Formal
Clock In kategori `HADIR` SHALL mewajibkan: lokasi dalam radius, foto selfie formal dengan watermark permanen (WIB, Lat/Long, NIP, hash), dan foto SHALL dikompres ke WebP (~150KB normal, ~50KB sinyal lambat) lalu diunggah langsung ke Cloudinary dengan signed preset. `photoUrl` SHALL tersimpan.

#### Scenario: Clock In sukses
- **WHEN** pegawai dalam radius mengirim selfie valid
- **THEN** Attendance `type=IN, category=HADIR` tersimpan dengan `photoUrl`, `distanceMeters`, `deviceSignature`, dan status ON_TIME/LATE

#### Scenario: Tanpa foto
- **WHEN** Clock In HADIR dikirim tanpa `photoUrl`
- **THEN** ditolak

#### Scenario: Clock In ganda
- **WHEN** pegawai sudah Clock In pada hari yang sama
- **THEN** ditolak dan pesan menampilkan waktu Clock In sebelumnya

### Requirement: Clock Out Tanpa Foto
Clock Out SHALL cukup berbasis GPS (1 klik) tanpa foto, SHALL mewajibkan Clock In pada hari yang sama, dan SHALL berada dalam radius untuk kategori `HADIR`. `photoUrl` SHALL bernilai null.

#### Scenario: Clock Out sukses
- **WHEN** pegawai yang sudah Clock In menekan tombol pulang di dalam radius
- **THEN** Attendance `type=OUT` tersimpan tanpa foto

#### Scenario: Tanpa Clock In
- **WHEN** pegawai Clock Out tanpa Clock In hari itu
- **THEN** ditolak

#### Scenario: Di luar radius
- **WHEN** Clock Out HADIR di luar radius
- **THEN** ditolak

### Requirement: Presensi Dinas Luar
Kategori `DINAS_LUAR` SHALL boleh di luar radius, SHALL mewajibkan foto kegiatan dan catatan tugas, dan SHALL berstatus `PENDING_APPROVAL` sampai diputuskan admin. Clock Out `DINAS_LUAR` SHALL tidak terikat radius.

#### Scenario: Dinas Luar valid
- **WHEN** pegawai mengirim foto kegiatan dan catatan di luar radius
- **THEN** tersimpan `PENDING_APPROVAL`

#### Scenario: Tanpa catatan
- **WHEN** catatan kosong
- **THEN** ditolak

### Requirement: Jeda Minimal Masuk-Pulang
Presensi pulang SHALL ditolak bila belum 15 menit sejak presensi masuk pada hari yang sama, untuk kategori HADIR maupun Dinas Luar. Pada Clock Out kategori HADIR, validasi radius tetap berlaku; hanya Dinas Luar yang tidak terikat radius. Aplikasi SHALL meminta konfirmasi sebelum mengirim presensi pulang.

#### Scenario: Pulang terlalu cepat
- **WHEN** pegawai menekan pulang 8 detik setelah masuk
- **THEN** ditolak dengan pesan menunggu beberapa menit lagi

#### Scenario: Tepat 15 menit
- **WHEN** pegawai pulang tepat 15 menit setelah masuk
- **THEN** diterima (batas inklusif)

#### Scenario: HADIR di luar radius
- **WHEN** pegawai kategori HADIR menekan pulang di luar radius lokasinya
- **THEN** ditolak, tidak tergantung jeda waktu

### Requirement: Lupa Clock Out
Bila pegawai tidak melakukan Clock Out, sistem SHALL membiarkan data Clock Out kosong (tidak mengisi jam pulang otomatis), tetap menghitung hari tersebut sebagai hadir, dan menandainya "tidak Clock Out" pada dashboard dan laporan.

#### Scenario: Tidak Clock Out
- **WHEN** hari kerja berakhir dengan Clock In tetapi tanpa Clock Out
- **THEN** hari dihitung hadir, tidak ada record OUT, dan ditandai "tidak Clock Out"

### Requirement: Presensi Tidak Dapat Diubah
Record presensi SHALL immutable: tidak ada endpoint edit atau hapus bagi PEGAWAI maupun ADMIN. Satu-satunya perubahan yang diizinkan adalah keputusan verifikasi Dinas Luar (status, `decidedBy`, `decidedAt`, `decisionNote`).

#### Scenario: Admin mencoba mengubah jam presensi
- **WHEN** ADMIN memanggil API untuk mengubah atau menghapus record presensi
- **THEN** ditolak (tidak tersedia / 405)

### Requirement: Riwayat Pribadi
Pegawai SHALL dapat melihat riwayat kehadiran bulanan miliknya sendiri dan SHALL NOT dapat melihat data pegawai lain.

#### Scenario: Lihat riwayat
- **WHEN** pegawai membuka riwayat bulan berjalan
- **THEN** tampil daftar presensi miliknya dengan status dan jam

#### Scenario: Akses data pegawai lain
- **WHEN** pegawai meminta data dengan `userId` pegawai lain
- **THEN** ditolak
