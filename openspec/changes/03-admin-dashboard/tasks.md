# Tasks: 03-admin-dashboard

## 1. Master data
- [~] 1.1 CRUD Pegawai (`/admin/pegawai`): tambah (password awal NIP), ubah, multi-lokasi, nonaktifkan, reset password. Halaman terverifikasi; aksi form belum diklik di browser
- [~] 1.2 CRUD Lokasi (`/admin/lokasi`): validasi radius 50-150, tolak hapus bila terpakai. Tanpa picker peta (koordinat diinput manual)
- [~] 1.3 CRUD Hari Libur (`/admin/libur`): tanggal tertentu dan berulang
- [~] 1.4 Izin/Sakit (`/admin/izin`): catat per pegawai per tanggal, unik, dapat dihapus

## 2. Dashboard
- [x] 2.1 Dashboard metrik harian (Hadir, Terlambat, Dinas Luar, Izin/Sakit, Alpha) memakai `computeRecap`; terverifikasi e2e

## 3. Verifikasi & audit
- [~] 3.1 Verifikasi Dinas Luar (`/admin/verifikasi`): approve/reject dengan alasan wajib saat tolak, jejak `decidedBy/decidedAt`. Halaman terverifikasi; aksi approve/reject belum diklik di browser
- [x] 3.2 Audit foto (`/admin/foto`) dengan `c_thumb,g_face`; terverifikasi e2e
- [x] 3.3 Badge perangkat dipakai bersama dan penanda offline; terverifikasi e2e

## 4. Live map
- [~] 4.1 Live map (`/admin/peta`) React-Leaflet dengan dynamic import `ssr: false`, lingkaran geofence dan pin; halaman 200, tampilan peta belum dilihat di browser

## 5. Laporan
- [~] 5.1 Filter rentang tanggal dan lokasi (tanpa filter status: rekap per pegawai tidak memakainya)
- [x] 5.2 Export .xlsx 10 kolom kedinasan; terverifikasi e2e (kolom, nilai, 403/401)
- [x] 5.3 Lembar "Catatan" (tidak Clock Out)
- [x] 5.4 Tidak ada endpoint edit/hapus presensi; satu-satunya perubahan adalah keputusan Dinas Luar
- [~] 5.5 Test: 13 unit test rekap (Alpha, persentase 90.91, libur, Dinas Luar, Izin/Sakit, tidak Clock Out) + 23 pemeriksaan e2e lolos. Belum: Playwright
