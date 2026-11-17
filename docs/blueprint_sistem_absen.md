# Blueprint Sistem Presensi Geospasial Multi-Lokasi Kelurahan Patalan

## 1. Ringkasan Eksekutif

Sistem Presensi Digital ini dirancang untuk mencatat dan memvalidasi kehadiran aparatur Kelurahan Patalan secara _real-time_. Menggunakan pendekatan **Multi-Zone Dynamic Geofencing** berbasis algoritma matematis **Haversine**, verifikasi visual **Live Selfie Foto Formal pada Clock In**, kemudahan kepulangan **Clock Out Cukup GPS Tanpa Foto**, serta audit kedinasan **Cryptographic Watermarking**, sistem ini secara fleksibel dan bermartabat memfasilitasi staf kantor kelurahan maupun pamong wilayah (Dukuh & Ketua RT) di padukuhan masing-masing, lengkap dengan modul **Dinas Luar**, **Audit Jejak Perangkat yang Manusiawi (Soft Device Tracking)**, **Penyimpanan Cloudinary (25GB Free)**, dan **Resiliensi Offline-First**.

## 2. Aktor Pengguna (User Roles)

Sistem membatasi hak akses secara ketat ke dalam 2 Role mutlak:

1. **`PEGAWAI` (Pamong Kantor, Dukuh, & Ketua RT):** Mengakses sistem melalui web responsif / Mobile PWA di smartphone untuk Clock In (dengan foto formal), Clock Out (cukup GPS tanpa foto), Pengajuan Presensi Dinas Luar, Ganti Password Pertama Kali, dan pengecekan riwayat presensi mandiri.
2. **`ADMIN` (Pengelola Sistem / Staf Khusus):** Mengakses sistem melalui Web Desktop untuk pendaftaran akun pegawai baru (CRUD), master lokasi penugasan, master kalender libur desa, verifikasi pengajuan dinas luar & audit foto visual, pemantauan peta sebaran (_Live Presence Map_), serta pencetakan rekapitulasi presensi bulanan berformat kedinasan (.xlsx).

## 3. Fitur Utama & Logika Bisnis

### A. Aplikasi Pegawai (Mobile PWA - Apple Cupertino & Bento Grid)

- **Manajemen Akun & Ganti Password Wajib:** Akun dibuatkan oleh Admin dengan password default berupa NIP. Pada login pertama kali, pegawai diwajibkan mengganti password baru sebelum dapat melakukan presensi.
- **Fleksibilitas Perangkat (Soft Device Tracking):** Tidak memblokir pegawai yang meminjam HP rekan/pasangan saat darurat, namun mencatat jejak perangkat untuk transparansi audit Admin.
- **Multi-Zone Geofencing (Haversine):** Validasi radius jarak server-side terhadap target lokasi penugasan pegawai (Kantor Kelurahan radius 50m, Padukuhan radius 100m - 150m).
- **Aturan Jam Kerja & Toleransi 15 Menit:**
  - Senin – Kamis: 07.30 – 15.30 WIB.
  - Jumat: 07.30 – 14.30 WIB.
  - Toleransi Telat: Absen masuk $\le$ 07.45 WIB tercatat tepat waktu (`ON_TIME`). Absen masuk $>$ 07.45 WIB tercatat terlambat (`LATE`).
  - Aturan jam kerja berlaku seragam untuk staf kantor, Dukuh, dan RT.
- **Efisiensi Clock In vs Clock Out:**
  - **Clock In:** Wajib GPS Haversine + Foto Formal Berbusana Dinas (dengan stempel watermark permanen).
  - **Clock Out:** Cukup 1-klik GPS Haversine **TANPA FOTO**, mempermudah alur kepulangan dan menghemat 50% kuota internet & storage.
- **Kategori Dinas Luar:** Pegawai yang bertugas di luar radius dapat melakukan presensi dengan melampirkan foto kegiatan dan catatan tugas (berstatus menunggu verifikasi admin).
- **Resiliensi Infrastruktur (Offline-First):** Jika sinyal internet terputus di pelosok padukuhan, data tersimpan aman di IndexedDB lokal dan disinkronkan otomatis via Background Sync saat online.
- **Adaptive Compression & RAM Guard:** Kompresi WebP otomatis (~150KB normal, ~50KB di sinyal lambat) dengan pembatasan resolusi kamera 720p agar tidak crash pada HP Android ber-RAM kecil.

### B. Dashboard Administrator (Web Desktop)

- **Statistik Bento Grid:** Ringkasan metrik kehadiran harian (Total Hadir, Terlambat, Dinas Luar, Izin, Alpha).
- **Live Presence Map (Leaflet.js):** Peta interaktif menampilkan geofence kantor kelurahan, titik dusun, dan pin lokasi kehadiran pegawai hari ini secara real-time.
- **Audit Visual Foto & Label Perangkat:** Antarmuka Bento Grid memajang foto formal pegawai berseragam Clock In dengan optimasi auto-face crop Cloudinary (`c_thumb,g_face`). Memberikan badge informatif jika sebuah HP digunakan oleh multi-akun pada hari yang sama.
- **Manajemen Data Lokasi (CRUD):** Tambah dan atur titik koordinat serta radius kantor kelurahan dan seluruh padukuhan/RT di Patalan.
- **Manajemen Hari Libur (CRUD):** Pengaturan tanggal merah nasional dan cuti lokal desa agar sistem tidak salah menghitung status alpha.
- **Verifikasi Dinas Luar:** Tinjau dan setujui/tolak pengajuan presensi tugas luar lapangan.
- **Manajemen Pegawai (CRUD):** Tambah, edit, nonaktifkan akun pegawai, serta penetapan lokasi penugasan.
- **Rekapitulasi & Export Excel Kedinasan:** Unduh laporan absensi bulanan (.xlsx) berformat resmi: `[No | NIP | Nama | Jabatan/Dusun | Total Hadir | Total Terlambat (menit) | Dinas Luar | Izin/Sakit | Alpha | % Kehadiran]`.

## 4. Arsitektur Teknologi & Ketersediaan

- **Frontend & Fullstack Framework:** Next.js 14+ (App Router) + TypeScript Strict Mode.
- **Database Relasional:** Neon (Serverless PostgreSQL) + Prisma ORM (PgBouncer Connection Pooling).
- **Otentikasi:** Auth.js (NextAuth v5) dengan Credentials Provider & JWT Session.
- **Object Storage / Media Cloud:** Cloudinary (25GB Free, tanpa kartu kredit).
- **Peta Interaktif:** Leaflet.js & React-Leaflet (OpenStreetMap).
- **Styling & Komponen:** Tailwind CSS + Shadcn UI (Bento Grid, Glassmorphism, Apple HIG).
- **Hosting & Warmup:** Vercel (Edge Network) + Endpoint Keep-Alive `/api/health` via cron ping berkala.

## 5. Metodologi Pengembangan & Pengujian Skripsi

- **Metodologi:** Agile SDLC (Scrum Framework 4 Sprint).
- **Pengujian Ilmiah (Three-Tier Testing):**
  1. _Black Box Testing_ (Boundary Value Analysis).
  2. _Geospatial Accuracy Testing_ (Confusion Matrix Haversine di 20 titik nyata).
  3. _Usability Testing_ (System Usability Scale / SUS dengan 15 responden pamong & RT).
