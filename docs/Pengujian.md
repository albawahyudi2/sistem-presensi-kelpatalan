# Pengujian Sistem Presensi Kelurahan Patalan

Tiga tingkat pengujian sesuai rencana skripsi. Semua perintah dijalankan dari folder `app/`.

## 1. Black Box Testing (Boundary Value Analysis)

Dijalankan otomatis: `npm test` (Vitest). Kasus batas di bawah sudah diotomatisasi; kolom "Berkas uji" menunjuk ke tesnya. Isi kolom "Hasil" dari keluaran `npm test` saat pengambilan data skripsi.

| No  | Fitur                    | Nilai batas (input)                                 | Hasil yang diharapkan           | Berkas uji                                              |
| --- | ------------------------ | --------------------------------------------------- | ------------------------------- | ------------------------------------------------------- |
| 1   | Status Clock In          | 07.30:00                                            | Tepat waktu                     | `lib/work-time.test.ts`                                 |
| 2   |                          | 07.45:00                                            | Tepat waktu (batas inklusif)    | `lib/work-time.test.ts`                                 |
| 3   |                          | 07.45:01                                            | Terlambat                       | `lib/work-time.test.ts`                                 |
| 4   |                          | 07.46:00                                            | Terlambat 16 menit (dari 07.30) | `lib/work-time.test.ts`                                 |
| 5   | Radius 50 m              | jarak = radius                                      | Diterima (inklusif)             | `lib/geo.test.ts`                                       |
| 6   |                          | jarak = radius + 0,01 m                             | Ditolak                         | `lib/geo.test.ts`                                       |
| 7   |                          | 52 m dari kantor                                    | Ditolak, pesan jarak dan radius | `lib/geo.test.ts`, `lib/attendance-rules.test.ts`       |
| 8   | Akurasi GPS              | 100 m                                               | Diterima                        | `lib/attendance-rules.test.ts`                          |
| 9   |                          | 100,5 m                                             | Ditolak                         | `lib/attendance-rules.test.ts`                          |
| 10  | Umur data offline        | tepat 24 jam                                        | Diterima                        | `lib/attendance-rules.test.ts`                          |
| 11  |                          | 24 jam + 1 detik                                    | Ditolak (REJECTED)              | `lib/attendance-rules.test.ts`                          |
| 12  | Waktu perangkat          | 5 menit lebih maju                                  | Diterima (toleransi)            | `lib/attendance-rules.test.ts`                          |
| 13  | Hari kerja               | Sabtu, Minggu, tanggal libur                        | Presensi ditolak                | `lib/attendance-rules.test.ts`, `lib/work-time.test.ts` |
| 14  | Jam pulang               | Jumat 14.30 / Senin-Kamis 15.30                     | Hari dianggap selesai           | `lib/report.test.ts`                                    |
| 15  | Password baru            | 9 karakter                                          | Ditolak                         | `lib/password.test.ts`                                  |
| 16  |                          | 10 karakter                                         | Diterima                        | `lib/password.test.ts`                                  |
| 17  |                          | sama dengan NIP                                     | Ditolak                         | `lib/password.test.ts`                                  |
| 18  | Rate limit login         | 4 gagal                                             | Belum terkunci                  | `lib/rate-limit.test.ts`                                |
| 19  |                          | 5 gagal dalam 15 menit                              | Terkunci                        | `lib/rate-limit.test.ts`                                |
| 20  |                          | gagal ke-5 di luar 15 menit                         | Tidak dihitung                  | `lib/rate-limit.test.ts`                                |
| 28  | Rate limit per IP        | 29 gagal / 30 gagal dari satu IP                    | Belum terkunci / terkunci       | `lib/rate-limit.test.ts`                                |
| 29  | Format NIP               | 17, 18, 19 digit angka                              | Ditolak / diterima / ditolak    | `lib/employee-id.test.ts`                               |
| 21  | Presensi ganda           | Clock In/Out kedua                                  | Ditolak                         | `lib/attendance-rules.test.ts`                          |
| 22  | Clock Out tanpa Clock In | -                                                   | Ditolak                         | `lib/attendance-rules.test.ts`                          |
| 27  | Jeda pulang              | 14 menit 59 detik / 15 menit 00 detik setelah masuk | Ditolak / diterima              | `lib/attendance-rules.test.ts`                          |
| 23  | Idempotensi              | kunci sama dikirim dua kali                         | Satu record                     | Verifikasi layanan ke database                          |
| 24  | Foto                     | foto milik pegawai lain / host bukan Cloudinary     | Ditolak                         | `lib/attendance-rules.test.ts`                          |
| 25  | Dinas Luar               | tanpa catatan / tanpa foto                          | Ditolak                         | `lib/attendance-rules.test.ts`                          |
| 26  | Rekap                    | 18 hadir + 2 dinas luar dari 22 hari kerja          | 90,91%                          | `lib/report.test.ts`                                    |

### Pengujian hak akses (RBAC)

Dijalankan manual atau dengan skrip pada server berjalan. Hasil yang diharapkan:

| Skenario                                         | Hasil                                                         |
| ------------------------------------------------ | ------------------------------------------------------------- |
| Tanpa sesi membuka halaman terproteksi           | Diarahkan ke `/login` (atau `/admin/login`); API menjawab 401 |
| Pegawai membuka `/admin/*`                       | Diarahkan ke `/`; API admin menjawab 403                      |
| Admin membuka halaman pegawai                    | Diarahkan ke `/admin/dashboard`                               |
| Pegawai login di jalur admin, atau sebaliknya    | Ditolak                                                       |
| `mustChangePassword = true` membuka halaman lain | Diarahkan ke halaman ganti password                           |
| Pegawai mengunduh `/api/admin/laporan`           | 403                                                           |

Catatan: pemeriksaan end-to-end ini dijalankan saat pengembangan (13 pemeriksaan login/RBAC, 14 skenario layanan presensi ke database, 23 pemeriksaan panel admin dan ekspor Excel; seluruhnya lolos).

## 2. Geospatial Accuracy Testing (20 titik nyata)

Tujuan: mengukur seberapa tepat keputusan "dalam radius / luar radius" sistem dibandingkan kenyataan di lapangan.

Langkah:

1. Tentukan 20 titik di sekitar lokasi uji (mis. Kantor, radius 50 m): sekitar 10 titik yang memang **dalam** radius (dekat pintu, tepi halaman) dan 10 titik **luar** (mis. 60-150 m). Ukur jarak sebenarnya dengan meteran atau peta.
2. Berdiri di tiap titik, catat koordinat dan akurasi GPS yang dilaporkan HP.
3. Isi `eval/geo-points.csv` (hapus baris `contoh-*`). Kolom `ekspektasi` = `DALAM` atau `LUAR` sesuai kenyataan.
4. Jalankan: `npm run eval:geo`

Keluaran: tabel per titik, **Confusion Matrix** (TP, FP, TN, FN; positif = DALAM radius), serta **Accuracy, Precision, Recall, F1**. Sertakan variasi perangkat (Android, iOS) dan kondisi (terbuka, di bawah atap) untuk analisis. Titik dengan `akurasi_gps_m` di atas 100 otomatis diprediksi LUAR (ditolak); bila banyak titik DALAM yang ditolak karena akurasi, pertimbangkan menyesuaikan ambang `MAX_GPS_ACCURACY_M` di `lib/geo.ts`.

## 3. Usability Testing (System Usability Scale)

1. Minta 15 responden (pamong, Dukuh, RT) mencoba tugas: login pertama dan ganti password, Clock In dengan selfie, Clock Out, melihat riwayat.
2. Bagikan kuesioner SUS (10 butir, skala 1-5):
   1. Saya rasa saya akan sering menggunakan sistem ini.
   2. Saya menemukan sistem ini terlalu rumit tanpa perlu.
   3. Saya rasa sistem ini mudah digunakan.
   4. Saya rasa saya akan membutuhkan bantuan orang teknis untuk menggunakan sistem ini.
   5. Saya menemukan berbagai fungsi pada sistem ini terintegrasi dengan baik.
   6. Saya rasa ada terlalu banyak ketidakkonsistenan pada sistem ini.
   7. Saya membayangkan kebanyakan orang akan belajar menggunakan sistem ini dengan sangat cepat.
   8. Saya menemukan sistem ini sangat rumit untuk digunakan.
   9. Saya merasa sangat percaya diri menggunakan sistem ini.
   10. Saya perlu belajar banyak hal sebelum bisa menggunakan sistem ini.
3. Isi `eval/sus-responses.csv` (hapus baris `contoh-*`), jalankan: `npm run eval:sus`

Keluaran: skor SUS tiap responden, rata-rata, simpangan baku, apakah di atas rata-rata industri (68), dan kategori penerimaan (di bawah 50 tidak dapat diterima, 50-70 marginal, di atas 70 dapat diterima).
