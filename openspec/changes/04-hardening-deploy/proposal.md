# Change: 04-hardening-deploy (Sprint 4)

## Why
Sistem harus teruji secara ilmiah (kebutuhan skripsi), dapat dipasang sebagai PWA, dan di-deploy ke produksi lalu diserahkan ke Kelurahan Patalan.

## What Changes
- Three-tier testing: Black Box (BVA, RBAC), Geospatial Accuracy (20 titik, Confusion Matrix), SUS (15 responden)
- PWA: manifest, service worker, Add to Home Screen
- Deploy Vercel, environment variables, cron `/api/health`
- UAT lapangan dan serah terima
- Retensi foto 1 tahun (capability `photo-retention`)
- Pembaruan diagram (ERD, DFD level 1, use case) agar sesuai sistem final

## Impact
- Capability baru: `pwa-installability`
- Tidak ada perubahan perilaku fungsional; fokus kualitas dan rilis
