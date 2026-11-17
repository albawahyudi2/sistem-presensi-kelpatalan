# reporting Specification (delta)

## ADDED Requirements

### Requirement: Metrik Dashboard Harian
Dashboard admin SHALL menampilkan Total Hadir, Terlambat, Dinas Luar, Izin, dan Alpha untuk hari terpilih (default hari ini). Alpha SHALL dihitung hanya pada hari kerja (bukan akhir pekan/Holiday) untuk pegawai aktif tanpa Clock In, tanpa Izin/Sakit, dan tanpa Dinas Luar `APPROVED`; hari berjalan baru dihitung Alpha setelah jam kerja berakhir.

#### Scenario: Hari libur
- **WHEN** hari terpilih adalah tanggal `Holiday`
- **THEN** Alpha = 0 dan dashboard menandai hari non-kerja

#### Scenario: Belum Clock In sebelum jam kerja berakhir
- **WHEN** pukul 10.00 pegawai belum Clock In
- **THEN** belum dihitung Alpha

### Requirement: Filter Rekap
Admin SHALL dapat memfilter rekap berdasarkan rentang tanggal, status, dan lokasi/padukuhan.

#### Scenario: Filter padukuhan
- **WHEN** admin memilih padukuhan Bobok dan bulan tertentu
- **THEN** rekap hanya memuat pegawai berlokasi Bobok

### Requirement: Export Excel Kedinasan
Sistem SHALL mengekspor rekap ke .xlsx dengan kolom berurutan: `No | NIP | Nama | Jabatan/Dusun | Total Hadir | Total Terlambat (menit) | Dinas Luar | Izin/Sakit | Alpha | % Kehadiran`. Persentase kehadiran = (Hadir + Dinas Luar) / hari kerja efektif x 100, dibulatkan 2 desimal. Hanya Dinas Luar `APPROVED` yang dihitung.

#### Scenario: Export bulanan
- **WHEN** admin mengekspor bulan Maret
- **THEN** file .xlsx berisi satu baris per pegawai dengan 10 kolom di atas

#### Scenario: Lembar catatan
- **WHEN** ada pegawai dengan hari hadir tanpa Clock Out
- **THEN** file memiliki lembar kedua "Catatan" berisi daftar NIP, nama, dan tanggal "tidak Clock Out"; lembar utama tetap 10 kolom

#### Scenario: Lupa Clock Out tetap hadir
- **WHEN** pegawai Clock In tetapi tidak Clock Out
- **THEN** hari itu tetap terhitung Total Hadir

#### Scenario: Persentase
- **WHEN** pegawai hadir 18 hari dan Dinas Luar 2 hari dari 22 hari kerja efektif
- **THEN** % Kehadiran = 90.91

#### Scenario: Akses non-admin
- **WHEN** PEGAWAI memanggil endpoint export
- **THEN** 403
