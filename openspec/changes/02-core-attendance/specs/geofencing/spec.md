# geofencing Specification (delta)

## ADDED Requirements

### Requirement: Validasi Radius Haversine Server-Side
Sistem SHALL menghitung jarak (meter) antara koordinat pegawai dan lokasi penugasannya dengan rumus Haversine di server, dan SHALL menolak presensi `HADIR` bila jarak melebihi `radius` lokasi. Nilai jarak SHALL disimpan sebagai `distanceMeters`. Klien SHALL NOT dipercaya untuk keputusan validasi.

#### Scenario: Dalam radius
- **WHEN** pegawai Kantor (radius 50 m) berada 30 m dari titik kantor
- **THEN** presensi diterima dan `distanceMeters` ≈ 30

#### Scenario: Tepat di batas
- **WHEN** jarak tepat sama dengan radius
- **THEN** presensi diterima (batas inklusif)

#### Scenario: Di luar radius
- **WHEN** jarak 51 m untuk radius 50 m
- **THEN** presensi `HADIR` ditolak dengan pesan jarak dan radius yang diizinkan

#### Scenario: Koordinat tidak valid
- **WHEN** latitude/longitude kosong, NaN, atau di luar rentang
- **THEN** ditolak

### Requirement: Multi-Zone Penugasan
Setiap pegawai SHALL memiliki satu atau lebih lokasi penugasan (Kantor dan/atau padukuhan), masing-masing dengan radius 50-150 m. Presensi `HADIR` SHALL diterima bila pegawai berada dalam radius salah satu lokasinya. Sistem SHALL menyimpan `locationId` lokasi yang cocok (yang terdekat bila lebih dari satu cocok) dan `distanceMeters` terhadap lokasi tersebut. Lokasi di luar penugasan pegawai SHALL tidak diperhitungkan.

#### Scenario: Dukuh di padukuhan
- **WHEN** Dukuh Bobok (radius 100 m) presensi di titik padukuhan Bobok
- **THEN** diterima dengan `locationId` Bobok, sedangkan presensi di lokasi yang bukan penugasannya ditolak

#### Scenario: Dua lokasi penugasan
- **WHEN** pegawai ditugaskan di Kantor dan padukuhan Bobok lalu presensi di Kantor
- **THEN** diterima dengan `locationId` Kantor

#### Scenario: Di luar semua lokasi
- **WHEN** pegawai berada di luar radius seluruh lokasi penugasannya
- **THEN** ditolak dengan pesan jarak ke lokasi terdekat dan radius yang diizinkan

### Requirement: Dukungan Perangkat Desktop
Pada perangkat tanpa GPS (mis. laptop Windows), akurasi lokasi sering rendah. Sistem SHALL tetap menerapkan ambang akurasi dan menampilkan petunjuk memakai HP bila ditolak, tanpa melonggarkan validasi.

#### Scenario: Laptop dengan akurasi rendah
- **WHEN** peramban Windows melaporkan akurasi 300 m
- **THEN** ditolak dengan petunjuk memakai smartphone atau area dengan GPS yang lebih baik

### Requirement: Akurasi GPS
Sistem SHALL menyimpan akurasi GPS dari perangkat bila tersedia, dan SHALL menolak koordinat dengan akurasi lebih buruk dari 100 m dengan saran mencoba lagi di area terbuka.

#### Scenario: Akurasi buruk
- **WHEN** perangkat melaporkan akurasi 500 m
- **THEN** presensi ditolak dengan petunjuk memperbaiki sinyal GPS
