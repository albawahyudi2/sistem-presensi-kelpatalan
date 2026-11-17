# Prompt untuk Google Stitch: UI/UX Presensi Kelurahan Patalan

Cara pakai: buat dua proyek di Stitch. Proyek 1 mode **App** (pegawai, HP). Proyek 2 mode **Web** (admin, desktop). Tempel **Blok Gaya** di awal setiap prompt, lalu tambahkan prompt layar satu per satu (jangan sekaligus). Setelah satu layar bagus, minta layar berikutnya "dengan gaya yang sama".

## Blok Gaya (tempel di awal semua prompt)

```
Design system for "Presensi Kelurahan Patalan", an attendance app for village-office staff in Indonesia.
All UI text must be in Bahasa Indonesia (everyday words, no jargon).
Users: older village officials (50-65) AND young staff. Prioritise legibility and calm, friendly tone.

Style:
- Primary color deep green #1F7A4D (white text on it, contrast 5.3:1). Accent yellow #F5B700 (dark text #14231A). Danger red #C62828. Info blue #1D5FBF.
- Page background #F6F7F4, cards white #FFFFFF with 1px border #DCE2DB, text #14231A, secondary text #55645A.
- Soft tints for status: success #EAF6EF, warning #FFF3CC, danger #FDECEC, info #E8F0FC.
- Font: Geist (or Inter). Body 18px, secondary 16px, never below 14px. Headings bold 26-32px. Big clock numerals 56px bold.
- Buttons: 60px tall on mobile (48px on desktop), radius 16px, label 20px semibold. One primary button per screen.
- Corner radius 16-24px on cards. Generous spacing (16-24px). Light theme only.
- Every status uses icon + text + color together (never color alone). Icons: Lucide-style outline, 24px, 2px stroke.
- Form fields: label always above the field (never placeholder-only), 60px tall on mobile, 2px border, clear error message that says how to fix it.
- Destructive or irreversible actions always ask for confirmation in a dialog.
```

## Proyek 1: App (pegawai, HP 390x844; buat juga versi Android 412x915 untuk Beranda)

1. **Masuk**
   `Login screen. Green shield emblem, title "Presensi Kelurahan Patalan", subtitle "Masuk dengan NIP dan password Anda". Field "NIP" (hint "18 angka, tanpa spasi"), field "Password" with a "Lihat" toggle (hint "Password awal Anda sama dengan NIP"), big primary button "Masuk". Footer: "Lupa password? Hubungi admin Kelurahan Patalan."`
2. **Masuk, password salah**
   `Same login screen with a red banner "NIP atau password salah. Periksa lagi huruf besar dan kecil, lalu coba kembali." NIP stays filled, password field in error state. Footnote "Salah 5 kali, akun dikunci sementara 15 menit."`
3. **Ganti password wajib**
   `Screen "Buat password baru" with blue info banner "Password awal Anda adalah NIP, sehingga mudah ditebak orang lain." Two password fields, a checklist card "Syarat password" (Minimal 10 karakter, Tidak memuat NIP Anda, Bukan angka berurutan atau kata umum) with green checks, primary button "Simpan Password".`
4. **Beranda, belum presensi**
   `Home. Greeting "Selamat pagi, Bapak Slamet". Huge live clock "07:41:32" and date "Senin, 16 November 2026 · WIB". Location chip "Kantor Kelurahan Patalan · radius 50 m". Status card "Belum presensi hari ini". Three large action buttons stacked: green "Absen Masuk - Foto selfie dan lokasi" (enabled), grey disabled "Absen Pulang - Aktif setelah Anda absen masuk", outlined "Dinas Luar - Tugas di luar kantor". Bottom tabs: Beranda, Riwayat, Akun.`
5. **Beranda, sudah masuk**
   `Same home. Cards "Masuk 07:38" with green badge "Tepat waktu" and "Pulang --:--". Yellow enabled button "Absen Pulang - Cukup satu ketukan, tanpa foto". Absen Masuk disabled.`
6. **Beranda, presensi lengkap**
   `Same home, friendly message "Terima kasih, presensi hari ini lengkap". Masuk 07:38 Tepat waktu, Pulang 15:36. All action buttons disabled.`
7. **Konfirmasi Absen Pulang**
   `Bottom-sheet dialog over the dimmed home: title "Absen pulang sekarang?", text "Presensi pulang dicatat dengan lokasi Anda saat ini dan tidak dapat diubah atau diulang.", buttons "Ya, absen pulang" (primary) and "Batal".`
8. **Beranda, tanpa sinyal**
   `Home with amber banner "Tidak ada sinyal. Presensi tersimpan di HP dan akan terkirim otomatis." and a card "2 presensi menunggu dikirim" with button "Kirim sekarang".`
9. **Absen Masuk, mencari lokasi**
   `Full-screen step "Langkah 1 dari 3: Mencari lokasi". Pulsing green location icon, text "Mencari lokasi Anda... Pastikan GPS aktif", cancel button "Batal".`
10. **Absen Masuk, kamera**
    `Camera screen (dark), oval face guide, text "Posisikan wajah di dalam bingkai. Kenakan pakaian dinas." Green chip "Lokasi sesuai · 12 m dari kantor". Large round shutter button labelled "Ambil Foto".`
11. **Absen Masuk, periksa foto**
    `Photo preview with a watermark strip at the bottom (date/time WIB, coordinates, NIP, short hash). Buttons "Kirim Presensi" (primary) and "Ulangi Foto" (outlined). Small text "Ukuran foto 142 KB".`
12. **Presensi berhasil**
    `Success screen: big green check, "Presensi masuk tercatat", "Senin, 07:38 · Tepat waktu", button "Selesai".`
13. **Gagal, di luar radius**
    `Error screen: red alert icon, "Anda di luar area kantor", text "Jarak Anda 134 m dari Kantor Kelurahan Patalan (maksimal 50 m). Dekati kantor lalu coba lagi.", buttons "Coba lagi" and outlined "Saya sedang Dinas Luar".`
14. **Dinas Luar**
    `Form "Presensi Dinas Luar": photo area "Foto kegiatan", textarea "Catatan tugas (wajib)", yellow note "Perlu persetujuan admin sebelum dihitung hadir", button "Kirim Dinas Luar".`
15. **Riwayat bulanan**
    `Month navigator "< November 2026 >", three summary chips (Hadir 9, Terlambat 2, Dinas Luar 1), then day cards: date, Masuk/Pulang time, status badge ("Tepat waktu", "Terlambat 16 menit", "Dinas Luar - menunggu verifikasi", "Dinas Luar - disetujui", "Tidak absen pulang").`
16. **Akun**
    `Profile card: initials avatar, "Pegawai Contoh Satu", "Staf Kelurahan", rows for Lokasi tugas, NIP, Jam kerja (Senin-Kamis 07.30-15.30, Jumat 07.30-14.30). Buttons "Ganti Password" and "Keluar".`

## Proyek 2: Web (admin, desktop 1440x900, sidebar kiri 260px)

Sidebar: lambang + "Presensi / Kelurahan Patalan"; menu Dashboard, Verifikasi Dinas Luar (badge merah "2"), Audit Foto, Live Map, Laporan; pemisah "DATA MASTER": Pegawai, Lokasi, Hari Libur, Izin / Sakit; bawah: "Administrator" dan tombol "Keluar". Menu aktif berlatar hijau muda.

1. **Masuk admin**: panel kiri hijau (lambang, "Presensi Kelurahan Patalan", "Panel Admin") dan kartu form kanan (Username, Password, "Masuk").
2. **Dashboard**: tanggal "Senin, 16 November 2026"; 5 kartu metrik (Hadir 38, Terlambat 4, Dinas Luar 2, Izin dan Sakit 3, Alpha 3, dengan ikon + warna lembut); kartu "Perlu perhatian: 2 Dinas Luar menunggu verifikasi" + tombol "Tinjau"; tabel "Presensi terbaru" (foto kecil, nama, jam, status, lokasi).
3. **Verifikasi Dinas Luar**: kartu 2 kolom: foto kegiatan, nama, NIP, waktu, catatan tugas, link "Lihat lokasi", kolom catatan, tombol "Setujui" (hijau) dan "Tolak" (merah, alasan wajib); daftar "Keputusan terakhir".
4. **Audit Foto**: pemilih tanggal; grid 5 kolom kartu foto wajah (nama, jam, status, jarak dari kantor); lencana "Perangkat dipakai bersama" dan "Offline".
5. **Live Map**: peta penuh dengan lingkaran geofence biru, pin hijau (tepat waktu) dan merah (terlambat), pin Dinas Luar di luar lingkaran, legenda, peta otomatis memperbesar ke semua pin.
6. **Laporan**: filter Dari, Sampai, Lokasi, tombol "Tampilkan" dan "Unduh Excel (.xlsx)"; tabel 10 kolom: No, NIP, Nama, Jabatan/Dusun, Total Hadir, Total Terlambat (menit), Dinas Luar, Izin/Sakit, Alpha, % Kehadiran.
7. **Pegawai**: form tambah (NIP, Nama, Jabatan, kotak centang Lokasi) dan tabel dengan aksi "Ubah", "Reset password", "Nonaktifkan"; baris nonaktif redup.
8. **Lokasi**: form (Nama, Latitude, Longitude, Radius 50-150 m) dan tabel dengan jumlah pegawai aktif.
9. **Hari Libur**: form + keadaan kosong ramah: "Belum ada hari libur. Tambahkan tanggal merah nasional dan agenda lokal (mis. Merti Desa) lewat formulir di atas."
10. **Izin / Sakit**: form + tabel; satu baris diberi lencana kuning "Bentrok: pegawai sudah presensi pada tanggal ini".
11. **Dialog konfirmasi**: "Hapus hari libur?" - "Pada tanggal itu presensi dibuka kembali dan pegawai yang tidak hadir dihitung Alpha." Tombol "Batal" dan "Ya, hapus" (merah).
12. **Admin di HP (390x844)**: Dashboard dengan tombol hamburger; versi menu terbuka.

## Setelah jadi

- Periksa tiap layar: teks isi minimal 16 px, tombol utama 60 px, ada ikon + teks pada status, label di atas kolom, pesan galat yang menjelaskan solusi.
- Ekspor: gunakan "Copy to Figma" (bila tersedia) atau ekspor HTML/kode, lalu kirim hasilnya ke saya agar diterapkan ke aplikasi Next.js.
