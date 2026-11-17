# Project Context: Sistem Presensi Geospasial Kelurahan Patalan

## Purpose
Presensi digital berbasis web (Mobile PWA untuk pegawai, Web Desktop untuk admin) bagi aparatur Kelurahan Patalan. Kehadiran divalidasi secara matematis (Haversine multi-zone geofence), visual (selfie formal saat Clock In), dengan Clock Out cukup GPS tanpa foto.

Sumber awal: `docs/PRD_Sistem_Absensi.md` (v3.5), `docs/blueprint_sistem_absen.md`, `docs/Roadmap_Implementasi_Kelurahan_Patalan.md`, dan `diagram/`. Bila ada konflik, urutan prioritas: **spec OpenSpec ini > PRD v3.5 > blueprint/roadmap**.

## Tech Stack
- Next.js versi stabil terbaru saat setup (App Router), TypeScript strict
- Neon Serverless PostgreSQL + Prisma ORM (`DATABASE_URL` pooled, `DIRECT_URL` untuk migrasi)
- Auth: Auth.js v5 atau Better Auth (cek status/stabilitas saat setup change 01, lalu catat pilihan di Decision Log). Credentials + sesi JWT agar Edge Middleware tidak menyentuh DB
- Zod (validasi form dan server action), ExcelJS (export .xlsx), date-fns-tz atau Luxon (aturan jam WIB)
- Serwist (PWA/Service Worker), Dexie (IndexedDB); Background Sync tidak ada di iOS Safari, sehingga sinkronisasi juga dipicu saat aplikasi dibuka
- Pengujian: Vitest (Haversine, status, Alpha) + Playwright (alur utama)
- Cloudinary (signed direct upload dari browser)
- Tailwind CSS + Shadcn UI (Bento Grid, Glassmorphism, Apple HIG)
- Leaflet.js / React-Leaflet (dynamic import `ssr: false`)
- Vercel (hosting + cron warmup `/api/health`)
- PWA: Manifest + Service Worker, IndexedDB + Background Sync

## Roles
- `PEGAWAI` (tabel `User`): pamong kantor, Dukuh, Ketua RT. Login dengan NIP. Presensi via smartphone atau desktop.
- `ADMIN` (tabel `Admin`, **terpisah dari pegawai**): pengelola kelurahan. Login dengan username di `/admin/login`. Tidak punya lokasi penugasan dan tidak melakukan presensi. Manajemen data, verifikasi, laporan via desktop.
- Tidak ada registrasi publik. Akun pegawai dibuat Admin. Akun admin dibuat lewat seed/skrip (UI kelola admin di luar v1).
- Perangkat didukung: Android (Chrome), iOS (Safari 16.4+ / PWA), Windows (Chrome/Edge). Antarmuka berbahasa Indonesia.
- Skala: ±50 pegawai.

## Domain Conventions
- Zona waktu bisnis: WIB (Asia/Jakarta). Simpan UTC, tampilkan WIB.
- Jam kerja: Senin-Kamis 07.30-15.30, Jumat 07.30-14.30.
- Toleransi 15 menit: masuk <= 07.45:00 `ON_TIME`, setelahnya `LATE`. **Menit telat dihitung dari 07.30.**
- Radius geofence 50-150 m per lokasi (Kantor 50 m, padukuhan 100-150 m).
- Validasi Haversine wajib server-side; klien hanya menampilkan indikator.
- Presensi bersifat **immutable**: tidak ada edit/hapus oleh siapa pun di v1.

## Data Model (target)
- `Location(id, name, latitude, longitude, radius, createdAt)`
- `Admin(id, username UK, name, passwordHash, mustChangePassword, isActive, createdAt)`
- `User(id, nip UK, name, position, passwordHash, mustChangePassword, isActive, createdAt, updatedAt)` (pegawai saja)
- `UserLocation(userId FK, locationId FK)` PK gabungan; pegawai punya 1 atau lebih lokasi penugasan
- `Attendance(id, userId FK, type IN|OUT, category HADIR|DINAS_LUAR, latitude, longitude, gpsAccuracy?, locationId FK? (lokasi penugasan yang cocok), distanceMeters, photoUrl?, deviceSignature, notes?, status ON_TIME|LATE|PENDING_APPROVAL|APPROVED|REJECTED, lateMinutes, isOfflineSync, capturedAt, timestamp, idempotencyKey UK, decidedBy FK->Admin?, decidedAt?, decisionNote?, createdAt)`
- `Leave(id, userId FK, date, kind IZIN|SAKIT, notes, createdBy FK->Admin, createdAt)` unik per (userId, date)
- `Holiday(id, name, date, isRecurring, createdAt)`

## Testing Strategy (kebutuhan skripsi)
1. Black Box (Boundary Value Analysis, validasi RBAC)
2. Geospatial Accuracy: 20 titik nyata di Patalan, Confusion Matrix (accuracy, precision, recall)
3. Usability: SUS, 15 responden

## Workflow (Spec-Driven Development dengan OpenSpec)
1. Tulis/ubah perilaku sebagai proposal di `openspec/changes/<change-id>/` (proposal.md, tasks.md, specs/<capability>/spec.md berisi delta `ADDED/MODIFIED/REMOVED Requirements`).
2. Review dan setujui proposal sebelum menulis kode.
3. Implementasi mengikuti `tasks.md`, centang tiap tugas.
4. Setelah selesai dan deploy, arsipkan change sehingga delta digabung ke `openspec/specs/`.

Urutan change: `01-foundation-auth` -> `02-core-attendance` -> `03-admin-dashboard` -> `04-hardening-deploy`.

## Decision Log (diputuskan 2026-11-16)
| # | Topik | Keputusan | Alasan |
|---|-------|-----------|--------|
| 1 | Izin/Sakit | Admin input manual per tanggal (`Leave`) | Sederhana, cocok jumlah pegawai kecil dan pamong sepuh; menjaga lingkup 4 sprint |
| 2 | Menit telat | Dihitung dari 07.30 | Sesuai makna terlambat dari jam masuk; toleransi hanya untuk status |
| 3 | Alpha | Hari kerja tanpa Clock In, tanpa Izin/Sakit, tanpa Dinas Luar APPROVED. Lupa Clock Out tetap dihitung hadir, ditandai "tidak Clock Out" | Adil; Dinas Luar ditolak tidak boleh dihitung hadir |
| 4 | Data offline | Pakai `capturedAt` perangkat, maks. selisih 24 jam; lokasi tetap divalidasi server; ditandai `isOfflineSync` | Adil bagi pegawai di dusun tanpa sinyal; risiko manipulasi jam dimitigasi |
| 5 | Clock Out Dinas Luar | Tidak terikat radius | Pegawai memang berada di luar kantor |
| 6 | Lupa Clock Out | Dibiarkan kosong, ditandai di laporan | Tidak mengarang data (audit) |
| 7 | Koreksi presensi admin | Tidak ada di v1 | Menjaga integritas data; di luar lingkup skripsi |
| 8 | Keamanan & retensi | Rate limit login 5 gagal/15 menit; foto dihapus otomatis setelah 1 tahun | Password awal = NIP mudah ditebak; menjaga kuota Cloudinary 25 GB |

| 9 | Akun admin | Tabel `Admin` terpisah dari `User`; login username di `/admin/login`; awalnya 1 akun via seed | Pemisahan hak dan tanggung jawab; pegawai tidak bisa "naik" jadi admin; mudah menambah admin nanti |
| 10 | Lokasi pegawai | Banyak-ke-banyak (`UserLocation`); presensi valid bila dalam radius salah satu lokasi penugasan | Ada pegawai bertugas di lebih dari satu lokasi |
| 11 | Perangkat | Android, iOS, Windows didukung; sinkronisasi offline punya fallback tanpa Background Sync | Pegawai memakai perangkat beragam |
| 12 | Data awal | Kantor Kelurahan Patalan: lat -7.9285979, long 110.349427, radius 50 m; pegawai dummy hanya di non-produksi | Padukuhan dan libur diinput admin lewat aplikasi |

| 13 | Library auth | Auth.js v5 `5.0.0-beta.32` dengan dua provider Credentials (pegawai, admin) | Peer dependency mendukung Next 16; Better Auth stabil tetapi memakai satu tabel user sehingga kurang cocok dengan tabel User dan Admin terpisah |
| 14 | Prisma | 7.10.1 (`prisma-client` generator, `@prisma/adapter-pg`, URL di `prisma.config.ts`) | Tag `latest` paket `prisma` menunjuk ke 8.0 RC; 7.10.1 adalah rilis stabil yang cocok dengan `@prisma/client` |
| 15 | Next.js 16 | `proxy.ts` menggantikan middleware; `cacheComponents` dimatikan | Aplikasi seluruhnya dinamis dan terotentikasi |
| 16 | PWA dan offline | Service worker tulisan tangan (tanpa Serwist) + antrean Dexie; sinkronisasi dipicu dari halaman, bukan Background Sync | Next 16 memakai Turbopack sehingga plugin Serwist berbasis webpack tidak cocok; server action tidak bisa dipanggil dari service worker; iOS tidak mendukung Background Sync |
| 17 | Retensi foto | Cron Vercel harian `/api/cron/retention` (Bearer `CRON_SECRET`) | Cron Hobby hanya sekali sehari, cukup untuk retensi |
| 18 | Jeda masuk-pulang | Minimal 15 menit (HADIR dan Dinas Luar); Absen Pulang meminta konfirmasi | Mencegah ketukan tidak sengaja dan data pulang yang tidak masuk akal; presensi immutable sehingga tidak ada koreksi |
| 19 | Izin bentrok | Izin/sakit ditolak bila pegawai sudah presensi pada tanggal itu; catatan lama yang bentrok ditandai | Menghindari data ganda yang diam-diam dikalahkan oleh rekap |
| 20 | Akses foto | Cloudinary tipe `authenticated` + endpoint admin `/api/admin/foto/{id}`; foto lama dipindah (`npm run photos:migrate`); foto yatim dibersihkan (`npm run photos:orphans`, juga di cron) | Audit menemukan foto wajah+koordinat dapat dibuka tanpa login |
| 21 | Rate limit login | 5 gagal/15 mnt per akun + 30 gagal/15 mnt per IP (X-Forwarded-For); captcha ditunda | Password awal = NIP sehingga penyerang dapat mencoba banyak NIP; batas IP longgar karena kantor memakai satu IP bersama |
| 22 | Kebijakan password | Min. 10 karakter; tolak NIP, berulang/berurutan, kata umum | Hasil audit: `12345678` sebelumnya diterima |
| 23 | Absen Pulang tanpa foto | Tetap tanpa foto (keputusan PRD); pengaman: geofence HADIR, jeda 15 menit, konfirmasi | Menghemat kuota pamong; foto saat pulang dapat menjadi opsi nanti |
| 24 | Format ID pegawai | Angka saja harus tepat 18 digit; ID non-PNS 4-30 huruf/angka memuat huruf | Mencegah salah ketik NIP, tetap mengakomodasi pegawai non-PNS |

## Masih perlu verifikasi lapangan
1. Aturan tertulis jam kerja: pengecualian (mis. Ramadan) atau jam berbeda untuk Dukuh/RT? Bila ada, tambahkan sebagai MODIFIED requirement pada `attendance`.
2. Ambang akurasi GPS 100 m diuji pada 20 titik nyata (Sprint 4); sesuaikan bila GPS HP pamong sering meleset.
3. `docs/Roadmap` merujuk `project-rules.md` yang tidak ada di repo; spec ini menggantikannya.
