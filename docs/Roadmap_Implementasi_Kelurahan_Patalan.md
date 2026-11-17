# Roadmap Pengembangan (Agile SDLC - Scrum Framework)

**Proyek:** Sistem Presensi Geospasial Multi-Lokasi & Selfie Kelurahan Patalan  
**Metodologi:** Agile SDLC (4 Sprints @ 1 Minggu)  
**Tech Stack:** Next.js (App Router, TS Strict), Neon (Serverless Postgres), Prisma ORM, Cloudinary, Auth.js v5, Tailwind CSS + Shadcn UI, Leaflet.js, Vercel.

---

## 🏃‍♂️ Rencana Kerja Sprint (4 Minggu)

### 🚀 Sprint 1: Arsitektur Data, Database Neon, & Fondasi Keamanan (Minggu 1)

**Fokus:** Menyiapkan repository, koneksi database cloud, pemodelan relasi, otentikasi, dan endpoint pemanasan.

1. **Repository Setup:** Inisialisasi Next.js (App Router, TypeScript Strict, Tailwind CSS).
2. **UI Library:** Install dan konfigurasi Shadcn UI + Phosphor / Lucide Icons.
3. **Database Modeling (Prisma ORM & Neon):**
   - Pembuatan skema `Location`, `User` (dengan field `mustChangePassword`), `Attendance` (dengan `photoUrl` nullable untuk checkout tanpa foto), dan `Holiday`.
   - Eksekusi migrasi database cloud (`prisma migrate dev`).
   - Seeding data awal: Titik Kantor Kelurahan Patalan dan akun Administrator.
4. **Authentication & Password Onboarding:** Setup Auth.js (NextAuth v5) dengan proteksi ganti password wajib pada login pertama kali.
5. **Warmup & Health Check Endpoint:** Implementasi `/api/health` untuk mitigasi Cold Start Vercel dan auto-suspend Neon DB.

### 📱 Sprint 2: Core Presensi Mobile, Efisiensi Clock-Out, & Resiliensi Offline (Minggu 2)

**Fokus:** Antarmuka presensi pegawai, validasi matematis geospasial, dan alur kerja harian.

1. **Dashboard Bento Grid Pegawai:** Tampilan jam real-time, status kehadiran, toleransi 15 menit, dan indikator lokasi penugasan.
2. **Alur Presensi Efisien:**
   - _Clock In:_ Wajib GPS Haversine + Foto Formal Berbusana Dinas (WebP ~150KB / ~50KB) dengan stempel watermark permanen.
   - _Clock Out:_ Cukup 1-klik GPS Haversine **TANPA FOTO** (efisiensi kuota & kepulangan instan).
3. **Integrasi Cloudinary Upload:** Pengunggahan foto selfie Clock In ke Cloudinary (25GB Free, tanpa kartu kredit) via signed API route.
4. **Server-Side Haversine Engine:** Validasi radius jarak terhadap target lokasi penugasan (staf kantor vs Dukuh/RT).
5. **Kategori Dinas Luar:** Alur presensi tugas luar dengan lampiran foto kegiatan.
6. **Offline-First Resilience:** Penyimpanan antrean presensi di IndexedDB dan sinkronisasi otomatis via Background Sync saat sinyal kembali normal.

### 💻 Sprint 3: Dashboard Web Admin, Live Map, & Export Kedinasan (Minggu 3)

**Fokus:** Manajemen kontrol, verifikasi, visualisasi geospasial, dan pelaporan untuk pengelola kelurahan.

1. **Dashboard Bento Grid Admin:** Ringkasan metrik statistik kehadiran harian (Hadir, Terlambat, Dinas Luar, Alpha).
2. **Master Data Management (CRUD):** Modul kelola data Pegawai (pembuatan akun default NIP), Master Lokasi Padukuhan, dan Master Kalender Libur (`Holiday`).
3. **Modul Audit Visual Foto (Auto-Face Crop Cloudinary):** Antarmuka verifikasi foto formal Clock In dan badge peringatan multi-akun pada satu HP.
4. **Modul Verifikasi Dinas Luar:** Antarmuka tinjauan dan persetujuan/penolakan presensi tugas lapangan pegawai.
5. **Live Presence Map (Leaflet.js):** Peta interaktif menampilkan geofence kantor/padukuhan serta pin koordinat riil pegawai hari ini.
6. **Export Excel (.xlsx) Kedinasan:** Ekspor rekapitulasi kehadiran resmi berformat standar: `[No | NIP | Nama | Jabatan/Dusun | Total Hadir | Total Terlambat (menit) | Dinas Luar | Izin/Sakit | Alpha | % Kehadiran]`.

### 🛡️ Sprint 4: Three-Tier Testing, PWA Polish, & Deployment (Minggu 4)

**Fokus:** Pengujian ilmiah skripsi, audit keamanan, dan penyerahan sistem ke Kelurahan Patalan.

1. **Three-Tier Testing (Kebutuhan Bab 4 & 5 Skripsi):**
   - _Black Box Testing:_ Pengujian fungsional seluruh modul input dan validasi RBAC.
   - _Geospatial Accuracy Testing:_ Pengujian akurasi rumus Haversine di 20 titik nyata di Patalan (menghasilkan Confusion Matrix: Accuracy, Precision, Recall).
   - _Usability Testing:_ Kuesioner System Usability Scale (SUS) kepada 15 calon pengguna (Pamong, Dukuh, RT).
2. **PWA Hardening:** Konfigurasi Manifest & Service Worker untuk kemampuan _Add to Home Screen_.
3. **Production Deployment & Warmup Cron:** Deployment ke Vercel Edge Network, konfigurasi Environment Variables (Neon, Cloudinary API, NextAuth Secret), dan setup cron warmup `/api/health`.
4. **UAT & Serah Terima:** Uji coba lapangan dan penyerahan aplikasi ke Kelurahan Patalan.

---

## 🚀 Prompt Hand-off untuk Percakapan Baru

> "Halo Dewan Engineer! Kita resmi mengeksekusi **Sprint 1 (Agile SDLC)** untuk proyek **Sistem Presensi Geospasial Multi-Lokasi Kelurahan Patalan**.
>
> Seluruh panduan arsitektur (Next.js, Neon Postgres, Prisma ORM, Cloudinary 25GB, Leaflet), konsep UI (Bento Grid, Glassmorphism, Apple HIG), fitur ramah pengguna (Clock In Foto Formal, Clock Out Cukup GPS Tanpa Foto, Toleransi 15 Menit, Onboarding Password NIP, Soft Device Tracking), modul Dinas Luar & Holiday, strategi Warmup `/api/health`, serta resiliensi Offline-First sudah terkunci di `project-rules.md`.
>
> Mohon pandu saya untuk langkah pertama Sprint 1:
>
> 1. Perintah inisialisasi Next.js (App Router, TypeScript Strict, Tailwind CSS) langsung di folder proyek ini.
> 2. Instalasi Prisma ORM dan pembuatan file `schema.prisma` lengkap (Model `Location`, `User`, `Attendance`, `Holiday`).
> 3. Tuntun saya menyambungkan string koneksi Neon PostgreSQL dan mengeksekusi migrasi database pertama."
