# authentication Specification (delta)

## ADDED Requirements

### Requirement: Akun Dibuat oleh Admin
Sistem SHALL tidak menyediakan registrasi publik. Hanya ADMIN yang dapat membuat akun pegawai dengan NIP, nama, jabatan, dan satu atau lebih lokasi penugasan. Password awal SHALL berupa NIP pegawai (disimpan sebagai hash) dan `mustChangePassword` SHALL bernilai `true`.

#### Scenario: Admin membuat akun
- **WHEN** admin membuat pegawai dengan NIP "198001012005011001"
- **THEN** akun tersimpan dengan `passwordHash` dari NIP tersebut dan `mustChangePassword = true`

#### Scenario: NIP duplikat
- **WHEN** admin membuat pegawai dengan NIP yang sudah ada
- **THEN** sistem menolak dengan pesan NIP sudah terdaftar

### Requirement: Akun Admin Terpisah
Admin SHALL disimpan di tabel `Admin` yang terpisah dari pegawai (`User`), login dengan username pada `/admin/login`, tidak memiliki lokasi penugasan, dan tidak dapat melakukan presensi. Pegawai SHALL NOT dapat dijadikan admin lewat perubahan role. Akun admin pertama dibuat lewat seed dengan password awal dari variabel lingkungan dan `mustChangePassword = true`; penambahan admin lain dilakukan lewat skrip, bukan UI (v1).

#### Scenario: Login admin
- **WHEN** admin memasukkan username dan password benar di `/admin/login`
- **THEN** sesi dengan role ADMIN dibuat dan diarahkan ke dashboard admin

#### Scenario: Pegawai login di halaman admin
- **WHEN** seorang pegawai memasukkan NIP dan passwordnya di `/admin/login`
- **THEN** ditolak karena akun tidak ditemukan di tabel Admin

#### Scenario: Admin login di halaman pegawai
- **WHEN** username admin dipakai di form login pegawai
- **THEN** ditolak

#### Scenario: Ganti password admin pertama
- **WHEN** admin login pertama kali dengan password awal
- **THEN** wajib mengganti password sebelum mengakses dashboard

### Requirement: Login dengan NIP dan Password
Sistem SHALL mengotentikasi pengguna dengan NIP dan password menggunakan Credentials Provider dan sesi JWT. Akun dengan `isActive = false` SHALL ditolak.

#### Scenario: Login berhasil
- **WHEN** pegawai aktif memasukkan NIP dan password benar
- **THEN** sesi JWT dibuat berisi `id`, `role`, `mustChangePassword`

#### Scenario: Kredensial salah
- **WHEN** NIP atau password salah
- **THEN** login ditolak dengan pesan generik yang tidak mengungkap mana yang salah

#### Scenario: Akun nonaktif
- **WHEN** akun `isActive = false` mencoba login
- **THEN** login ditolak

#### Scenario: Pembatasan percobaan
- **WHEN** terjadi 5 kali gagal login berturut-turut untuk satu NIP dalam 15 menit
- **THEN** percobaan berikutnya ditolak sementara selama 15 menit

#### Scenario: Pembatasan per alamat IP
- **WHEN** satu alamat IP menghasilkan 30 kegagalan login dalam 15 menit lintas akun berbeda
- **THEN** semua percobaan login dari IP itu ditolak sementara, termasuk dengan kredensial benar, sedangkan IP lain tidak terpengaruh

#### Scenario: Riwayat login dibersihkan
- **WHEN** cron retensi berjalan
- **THEN** riwayat percobaan login berumur lebih dari 30 hari dihapus

### Requirement: Ganti Password Wajib
Pengguna dengan `mustChangePassword = true` SHALL diarahkan ke halaman ganti password dan SHALL NOT dapat mengakses fitur lain sampai password diganti. Password baru SHALL minimal 10 karakter, tidak sama dengan atau mengandung NIP/password awal, bukan karakter berulang atau berurutan (mis. `1111111111`, `1234567890`), dan tidak memuat kata umum atau nama instansi (mis. `password`, `qwerty`, `patalan`).

#### Scenario: Login pertama kali
- **WHEN** pegawai baru login dengan password default
- **THEN** diarahkan ke halaman ganti password wajib

#### Scenario: Akses rute lain sebelum ganti
- **WHEN** pegawai dengan `mustChangePassword = true` membuka halaman presensi
- **THEN** diarahkan kembali ke halaman ganti password

#### Scenario: Ganti berhasil
- **WHEN** pegawai mengirim password baru valid
- **THEN** `mustChangePassword` menjadi `false`, JWT diperbarui, dan pegawai masuk ke dashboard

#### Scenario: Password baru sama dengan NIP
- **WHEN** pegawai memasukkan NIP sebagai password baru
- **THEN** ditolak

#### Scenario: Password lemah
- **WHEN** pegawai memasukkan `12345678`, `1234567890`, atau `Patalan2026`
- **THEN** ditolak dengan alasan yang jelas

### Requirement: Role-Based Access Control
Sistem SHALL membatasi rute `/admin/*` dan API admin hanya untuk `ADMIN`, serta rute presensi hanya untuk `PEGAWAI`. Pemeriksaan SHALL dilakukan di Edge Middleware berbasis JWT tanpa koneksi database, dan diulang di sisi server untuk API sensitif.

#### Scenario: Pegawai mengakses admin
- **WHEN** PEGAWAI membuka `/admin/dashboard`
- **THEN** respons 403 atau redirect ke dashboard pegawai

#### Scenario: Tanpa sesi
- **WHEN** pengguna tanpa sesi membuka rute terproteksi
- **THEN** diarahkan ke halaman login

### Requirement: Soft Device Tracking
Sistem SHALL mencatat `deviceSignature` pada login dan presensi untuk audit admin, dan SHALL NOT memblokir login dari perangkat berbeda.

#### Scenario: Login dari HP lain
- **WHEN** pegawai login dari perangkat yang berbeda dari sebelumnya
- **THEN** login berhasil dan signature perangkat tercatat
