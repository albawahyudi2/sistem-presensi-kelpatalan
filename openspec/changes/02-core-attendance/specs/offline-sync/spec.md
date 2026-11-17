# offline-sync Specification (delta)

## ADDED Requirements

### Requirement: Antrean Presensi Offline
Saat tidak ada koneksi, sistem SHALL menyimpan presensi (koordinat, foto blob, `capturedAt` perangkat, idempotency key) di IndexedDB dan menampilkan status "menunggu sinkronisasi".

#### Scenario: Offline saat Clock In
- **WHEN** pegawai Clock In tanpa sinyal
- **THEN** data masuk antrean lokal dan UI menandainya belum tersinkron

### Requirement: Sinkronisasi Otomatis
Sistem SHALL mengirim antrean via Background Sync saat koneksi kembali (dengan fallback saat aplikasi dibuka), menandai `isOfflineSync = true`, dan SHALL idempoten sehingga satu entri tidak tersimpan ganda.

#### Scenario: Sinyal kembali
- **WHEN** koneksi pulih
- **THEN** entri terkirim, divalidasi ulang di server, dan dihapus dari antrean

#### Scenario: Pengiriman ulang
- **WHEN** entri yang sama terkirim dua kali
- **THEN** hanya satu Attendance tersimpan

### Requirement: Dukungan Lintas Perangkat
Sinkronisasi SHALL berfungsi di Android (Chrome), iOS (Safari/PWA), dan Windows (Chrome/Edge). Pada peramban tanpa Background Sync (termasuk iOS Safari), sistem SHALL memicu sinkronisasi saat aplikasi dibuka, saat event `online`, dan saat tab kembali aktif (`visibilitychange`).

#### Scenario: iPhone tanpa Background Sync
- **WHEN** pegawai iOS membuka kembali PWA setelah sinyal pulih
- **THEN** antrean terkirim otomatis tanpa tindakan manual

#### Scenario: Aplikasi tidak dibuka
- **WHEN** aplikasi tidak dibuka di perangkat tanpa Background Sync
- **THEN** antrean menunggu dan UI menampilkan peringatan pada pembukaan berikutnya agar pegawai tidak lupa sinkron

### Requirement: Validasi Server atas Data Offline
Server SHALL tetap memvalidasi radius dan aturan hari kerja atas data offline. Status ON_TIME/LATE SHALL dihitung dari `capturedAt` bila selisihnya terhadap waktu server tidak melebihi 24 jam; bila lebih, entri SHALL ditolak ke status `REJECTED` dengan catatan alasan.

#### Scenario: Data offline wajar
- **WHEN** entri berumur 2 jam tiba dan di dalam radius
- **THEN** tersimpan dengan status dihitung dari `capturedAt`

#### Scenario: Data terlalu lama
- **WHEN** entri berumur lebih dari 24 jam
- **THEN** `REJECTED` dengan alasan

#### Scenario: Penanda audit
- **WHEN** entri offline tersimpan
- **THEN** `isOfflineSync = true`, `capturedAt` (jam perangkat) dan `timestamp` (jam server) keduanya tersimpan, dan admin melihat penanda "offline" pada entri tersebut

#### Scenario: Di luar radius
- **WHEN** koordinat entri offline di luar radius
- **THEN** `REJECTED` dan pegawai diberi tahu
