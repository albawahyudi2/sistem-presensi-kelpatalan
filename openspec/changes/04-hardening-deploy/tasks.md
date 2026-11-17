# Tasks: 04-hardening-deploy

## 1. Pengujian
- [x] 1.1 Black Box + BVA: 26 kasus batas dipetakan ke tes otomatis di `docs/Pengujian.md` (90 unit test lolos) + pemeriksaan RBAC dan e2e
- [~] 1.2 Alat siap: `npm run eval:geo` (confusion matrix, accuracy, precision, recall, F1) dari `eval/geo-points.csv`. Menunggu data 20 titik nyata dari lapangan
- [~] 1.3 Alat siap: `npm run eval:sus` dari `eval/sus-responses.csv` + kuesioner di `docs/Pengujian.md`. Menunggu 15 responden

## 2. PWA
- [x] 2.1 Manifest (`app/manifest.ts`), service worker (`public/sw.js`: cache aset statis, halaman `/` dan `/riwayat` network-first, `offline.html`, cache halaman dibuang saat membuka halaman login), registrasi hanya di produksi; terverifikasi lewat server produksi lokal
- [ ] 2.2 Uji Add to Home Screen Android/iOS dan pemakaian di Windows (Chrome/Edge) di perangkat nyata
- [x] 2.3 Ikon 192/512, maskable 512, dan apple-touch 180 dibuat dari logo yang diberikan. Catatan: logo adalah logo Kabupaten Bantul (200x200, diperbesar sehingga agak lembut); ganti dengan logo resmi Kelurahan Patalan beresolusi tinggi bila ada
- [ ] 2.4 Uji kamera dan GPS di iOS Safari (PWA standalone), Android Chrome, dan Chrome Windows

## 3. Deploy
- [~] 3.1 Daftar env Vercel di `docs/Panduan_Deploy_Serah_Terima.md` dan `.env.example` (termasuk `CRON_SECRET`); belum di-deploy
- [~] 3.2 Langkah migrasi dan seed produksi didokumentasikan (`npm run db:deploy`, `SEED_DUMMY=false`); belum dijalankan ke database produksi
- [~] 3.3 Konfigurasi pinger didokumentasikan; menunggu akun cron-job.org dan domain deploy
- [x] 3.4 `GET /api/cron/retention` (+ `vercel.json` harian 03.00 WIB) terverifikasi: hapus foto > 365 hari, lewati Dinas Luar pending, lindungi dengan `CRON_SECRET` (401 tanpa/salah secret)
- [ ] 3.5 Konfirmasi ambang akurasi GPS 100 m dari hasil uji 20 titik; sesuaikan `MAX_GPS_ACCURACY_M` bila perlu

## 4. Serah terima
- [ ] 4.1 UAT lapangan dan perbaikan temuan
- [ ] 4.2 Perbarui `diagram/` (ERD, DFD level 1, use case) sesuai sistem final
- [ ] 4.3 Arsipkan change 01-04 ke `openspec/specs/`

## 5. Akun, kepemilikan, dan serah terima
- [ ] 5.1 Buat akun GitHub, Vercel, Neon, Cloudinary, dan pinger dengan email yang dapat diserahkan ke kelurahan (atau transfer kepemilikan saat serah terima)
- [x] 5.2 `docs/Panduan_Deploy_Serah_Terima.md` (akun, env, deploy, operasional, reset password admin)
- [x] 5.3 Panduan pantau kuota dan baris penanggung jawab (diisi saat serah terima)
- [x] 5.4 Rencana pindah bila Vercel Hobby ditegur (Cloudflare/Netlify) di panduan
- [ ] 5.5 Surat persetujuan/pemberitahuan pengambilan foto dan lokasi (UU PDP) dari lurah dan pegawai
