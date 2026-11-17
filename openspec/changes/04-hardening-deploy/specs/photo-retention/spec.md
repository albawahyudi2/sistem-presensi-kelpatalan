# photo-retention Specification (delta)

## ADDED Requirements

### Requirement: Retensi Foto 1 Tahun
Sistem SHALL menghapus aset foto di Cloudinary yang berumur lebih dari 1 tahun melalui job terjadwal, mengosongkan `photoUrl` pada record terkait, dan mempertahankan data presensi lainnya (waktu, koordinat, status).

#### Scenario: Foto kedaluwarsa
- **WHEN** job retensi berjalan dan foto berumur 13 bulan
- **THEN** aset dihapus dari Cloudinary, `photoUrl` menjadi null, record presensi tetap ada

#### Scenario: Foto Dinas Luar pending
- **WHEN** foto berumur lebih dari 1 tahun tetapi status presensi masih `PENDING_APPROVAL`
- **THEN** foto tidak dihapus sampai keputusan dibuat

#### Scenario: Foto yatim
- **WHEN** foto ada di Cloudinary tetapi tidak dirujuk record presensi mana pun (mis. presensi ditolak setelah foto terunggah) dan umurnya lebih dari 7 hari
- **THEN** cron menghapusnya; foto yang lebih muda tidak disentuh agar antrean offline tidak kehilangan foto

#### Scenario: Kegagalan hapus
- **WHEN** penghapusan Cloudinary gagal
- **THEN** record tidak diubah dan job mencoba lagi pada jadwal berikutnya
