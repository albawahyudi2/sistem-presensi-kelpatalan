# Panduan Deploy dan Serah Terima

Proyek Next.js berada di folder `app/`. Semua perintah npm dijalankan dari folder itu.

## 1. Akun yang dibutuhkan

| Layanan                         | Fungsi                         | Catatan                                              |
| ------------------------------- | ------------------------------ | ---------------------------------------------------- |
| GitHub                          | Repositori kode                | Repo berisi `docs/`, `diagram/`, `openspec/`, `app/` |
| Vercel (Hobby)                  | Hosting aplikasi + cron harian | Root Directory proyek = `app`                        |
| Neon                            | Database PostgreSQL            | Cadangan otomatis terbatas di paket gratis           |
| Cloudinary                      | Penyimpanan foto presensi      | Kuota berbasis kredit bulanan                        |
| cron-job.org (atau UptimeRobot) | Pinger `/api/health`           | Notifikasi email bila gagal                          |

Buat akun dengan email yang dapat diserahkan ke kelurahan, atau transfer kepemilikan saat serah terima.

## 2. Environment variable (Vercel > Settings > Environment Variables)

| Nama                                                                   | Isi                                                                  |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`                                                         | Neon connection string **pooled** (host berakhiran `-pooler`)        |
| `DIRECT_URL`                                                           | Neon connection string **direct** (tanpa `-pooler`), dipakai migrasi |
| `AUTH_SECRET`                                                          | String acak panjang (`openssl rand -base64 32`)                      |
| `AUTH_TRUST_HOST`                                                      | `true`                                                               |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Dari dashboard Cloudinary                                            |
| `CRON_SECRET`                                                          | String acak; Vercel mengirimnya ke cron retensi                      |
| `ADMIN_USERNAME`, `ADMIN_INITIAL_PASSWORD`                             | Hanya dipakai saat seed admin pertama                                |

Daftar lengkap ada di `app/.env.example`. Jangan pernah meng-commit `.env.local`.

## 3. Deploy pertama

1. Dorong repositori ke GitHub.
2. Vercel > Add New Project > pilih repo > **Root Directory: `app`** > isi env variable > Deploy.
3. Migrasi database produksi (dari laptop, dengan `DIRECT_URL` produksi di `.env.local`): `npm run db:deploy`
4. Seed admin pertama dengan data dummy dimatikan: set `SEED_DUMMY=false` dan `NODE_ENV=production`, lalu `npm run db:seed`. Admin wajib mengganti password saat login pertama.
5. Login `/admin/login`, lalu isi: Lokasi (kantor dan padukuhan), Hari Libur, dan Pegawai.
6. Buka aplikasi dari HP lewat HTTPS dan uji Clock In/Out (kamera dan GPS hanya aktif di HTTPS).

## 4. Pinger kesehatan (menjaga server dan database tetap hangat)

Cron Vercel Hobby hanya bisa sekali sehari, jadi gunakan pinger eksternal:

- cron-job.org > buat job: URL `https://<domain>/api/health`, interval 5 menit, hanya Senin-Jumat pukul 06.30-16.00 WIB.
- Aktifkan notifikasi email saat job gagal. Respons sehat: `{"status":"ok"}` (HTTP 200); bila database bermasalah 503.

## 5. Foto, retensi, dan foto yatim

Foto presensi bertipe `authenticated` di Cloudinary (tidak bisa dibuka tanpa tanda tangan) dan hanya tampil bagi admin lewat aplikasi. Bila ada foto lama bertipe publik dari masa pengembangan, jalankan sekali: `npm run photos:migrate`. Untuk memeriksa foto yang tidak terpakai (presensi ditolak setelah foto terunggah): `npm run photos:orphans -- --grace-days=0`, tambahkan `--delete` untuk menghapusnya. Cron harian juga menghapus foto yatim berumur lebih dari 7 hari.

### Retensi foto

`vercel.json` menjadwalkan `/api/cron/retention` setiap hari pukul 03.00 WIB. Endpoint menghapus foto presensi yang berumur lebih dari 1 tahun dari Cloudinary (kecuali Dinas Luar yang masih menunggu verifikasi) dan mengosongkan `photoUrl`; data presensi lainnya tetap. Wajib mengatur `CRON_SECRET`. Cron yang sama juga menghapus riwayat percobaan login berumur lebih dari 30 hari dan foto yatim.

## 6. Operasional rutin

- **Tambah admin:** `npm run admin:add -- --username=budi --name="Budi" --password=MINIMAL8KARAKTER` (dengan `DIRECT_URL` produksi). Admin baru wajib ganti password saat login.
- **Lupa password admin:** buat admin baru dengan perintah di atas, lalu nonaktifkan yang lama lewat database (`UPDATE "Admin" SET "isActive" = false WHERE username = '...'`).
- **Lupa password pegawai:** menu Admin > Pegawai > Reset password (kembali ke NIP, wajib diganti).
- **Pegawai pindah/keluar:** Nonaktifkan (riwayat tetap tersimpan).
- **Redeploy:** push ke branch utama; Vercel membangun otomatis. Migrasi skema baru: jalankan `npm run db:deploy` sebelum atau segera setelah deploy.

## 7. Pemantauan kuota

| Sumber daya | Cek                                | Batas kerja                                    |
| ----------- | ---------------------------------- | ---------------------------------------------- |
| Cloudinary  | Dashboard > Usage (kredit bulanan) | Perkiraan 50 pegawai: sekitar 165 MB per bulan |
| Neon        | Console > Storage                  | Paket gratis 0,5 GB                            |
| Vercel      | Usage                              | Paket Hobby                                    |

Tentukan satu penanggung jawab setelah masa magang dan catat namanya di sini: ______________________

## 8. Risiko dan rencana pindah

- **Vercel Hobby** diperuntukkan penggunaan non-komersial/personal. Bila ditegur atau dibatasi, pindah ke Cloudflare Pages/Workers atau Netlify (butuh penyesuaian konfigurasi; kode aplikasi Next.js tetap).
- Kuota Cloudinary hampir habis: kurangi retensi (mis. 6 bulan) atau pindahkan foto ke Cloudflare R2 (fitur potong wajah otomatis hilang).
- Ganti segera kunci yang pernah dibagikan di luar sistem: password Neon dan API secret Cloudinary (regenerate), lalu perbarui env Vercel.

## 9. Data pribadi (UU PDP)

Aplikasi menyimpan foto wajah, lokasi, dan data pegawai. Sebelum dipakai: siapkan surat persetujuan/pemberitahuan dari Lurah dan pegawai tentang tujuan dan masa simpan data (foto dihapus otomatis setelah 1 tahun).

## 10. Checklist UAT lapangan

- [ ] Login pertama dan ganti password (pegawai dan admin)
- [ ] Clock In dengan selfie di Kantor, di padukuhan, di Android, iPhone, dan laptop Windows
- [ ] Clock In di luar radius ditolak dengan pesan jelas
- [ ] Clock Out 1-klik tanpa foto
- [ ] Dinas Luar, lalu diverifikasi admin
- [ ] Mode offline: Clock In tanpa sinyal, lalu terkirim otomatis saat online
- [ ] Pasang ke layar utama (Add to Home Screen) di Android dan iPhone
- [ ] Export Excel sesuai format kedinasan dan angkanya cocok
- [ ] Pinger aktif dan notifikasi email diterima saat diuji
