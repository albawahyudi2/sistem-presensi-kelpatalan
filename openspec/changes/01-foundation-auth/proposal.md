# Change: 01-foundation-auth (Sprint 1)

## Why
Sistem belum memiliki fondasi. Diperlukan skema data, otentikasi dengan onboarding password wajib, RBAC, dan endpoint health check agar Sprint berikutnya dapat dibangun di atasnya.

## What Changes
- Inisialisasi Next.js (App Router, TS strict, Tailwind, Shadcn UI)
- Skema Prisma `Location`, `User`, `Attendance`, `Holiday` dan migrasi ke Neon
- Seed: lokasi Kantor Kelurahan Patalan + akun ADMIN
- Auth.js v5 Credentials + JWT, paksa ganti password pertama kali, RBAC via middleware
- `GET /api/health` untuk keep-alive Vercel + Neon

## Impact
- Capabilities baru: `authentication`, `health-check`
- Kode baru: seluruh scaffolding aplikasi
- Hasil: admin dapat login dan akun pegawai dapat dibuat (CRUD penuh ada di change 03)
