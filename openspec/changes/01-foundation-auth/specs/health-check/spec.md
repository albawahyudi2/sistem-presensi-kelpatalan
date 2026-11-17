# health-check Specification (delta)

## ADDED Requirements

### Requirement: Endpoint Health Check
Sistem SHALL menyediakan `GET /api/health` tanpa otentikasi yang menjalankan query ringan ke database dan mengembalikan status, agar cron ping berkala menjaga Vercel serverless dan Neon tetap hangat. Respons SHALL NOT membocorkan detail internal.

#### Scenario: Sistem sehat
- **WHEN** endpoint dipanggil dan database merespons
- **THEN** HTTP 200 dengan body `{ "status": "ok" }`

#### Scenario: Database tidak tersedia
- **WHEN** query database gagal
- **THEN** HTTP 503 dengan body `{ "status": "degraded" }`

### Requirement: Warmup oleh Pinger Eksternal
Karena cron Vercel paket Hobby hanya dapat berjalan sekali sehari, sistem SHALL dipanggil `/api/health` oleh layanan pinger eksternal gratis (cron-job.org atau UptimeRobot) tiap 5 menit pada jam kerja (06.30-16.00 WIB, Senin-Jumat) agar serverless dan database tidak dingin saat presensi.

#### Scenario: Pinger aktif
- **WHEN** jadwal pinger tiba pada jam kerja
- **THEN** `/api/health` dipanggil dan database tidak dalam kondisi suspend saat jam presensi

#### Scenario: Pinger gagal
- **WHEN** `/api/health` mengembalikan 503 atau tidak merespons
- **THEN** pinger mengirim notifikasi email ke pemilik sistem
