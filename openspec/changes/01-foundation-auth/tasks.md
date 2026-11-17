# Tasks: 01-foundation-auth

Legenda: [x] selesai dan terverifikasi (build/tes/smoke test); [~] kode selesai, menunggu verifikasi dengan database Neon; [ ] belum.

## 1. Repository & UI
- [x] 1.1 Init Next.js 16 (App Router, TypeScript strict, Tailwind v4), repo git
- [x] 1.2 Shadcn UI (base-nova) + Lucide terpasang; komponen button, input, label, card, badge tersedia
- [~] 1.2b Pustaka terpasang: zod, date-fns, @date-fns/tz, vitest. Playwright menyusul saat uji alur utama (Serwist, Dexie, ExcelJS di change 02-03)
- [x] 1.2c Keputusan auth: Auth.js v5 beta.32 (lihat Decision Log `project.md`)
- [x] 1.3 `.env.example`, ESLint, dan Prettier (`npm run format`)

## 2. Database
- [x] 2.1 `prisma/schema.prisma` (Prisma 7) sesuai Data Model, ditambah `LoginAttempt`; `prisma validate` dan `generate` lolos
- [x] 2.2 `prisma migrate dev --name init` ke Neon berhasil (migrasi `20261115202608_init`)
- [x] 2.3 Seed dijalankan: Kantor Kelurahan Patalan, admin dari env, 3 pegawai dummy. Tambah admin: `npm run admin:add -- --username=... --name="..." --password=...`

## 3. Auth
- [x] 3.0 Dua jalur login: pegawai (NIP) dan admin (username, `/admin/login`) lewat dua provider Credentials
- [x] 3.1 Credentials + bcrypt + sesi JWT (7 hari)
- [x] 3.2 Claim JWT `id`, `role`, `mustChangePassword` (tipe terverifikasi `tsc`)
- [x] 3.3 `proxy.ts` (Next 16 mengganti middleware): proteksi rute dan RBAC terverifikasi smoke test (redirect, 401 untuk API)
- [~] 3.4 Halaman login dan ganti password dibangun; login terverifikasi e2e. Aksi ganti password (server action) belum diuji e2e, uji manual di browser
- [x] 3.5 Rate limit 5 gagal/15 menit berbasis tabel `LoginAttempt` (logika murni `evaluateLock` lolos tes)
- [x] 3.6 `deviceSignature` dicatat di `LoginAttempt` pada tiap percobaan login

## 4. Health
- [x] 4.1 `GET /api/health` (`SELECT 1`) terverifikasi 200 dengan Neon dan 503 tanpa database
- [~] 4.2 Unit test (8) lolos; uji e2e login 13/13 lolos (login pegawai/admin, redirect ganti password, RBAC, API admin 403, jalur silang ditolak, rate limit). Belum ada: ganti password e2e dan Playwright

## Catatan teknis
- Struktur repo: `docs/`, `diagram/`, `openspec/` di root; **proyek Next.js berada di `app/`** (jalankan semua perintah npm dari folder `app/`). Di dalamnya tanpa folder `src`: router di `app/app/`, lalu `components/`, `lib/`, `types/`, `auth.ts`, `auth.config.ts`, `proxy.ts` sejajar dengannya; alias `@/*` menunjuk ke akar proyek (`app/`). Jangan meletakkan file rute langsung di akar proyek.
- Klien Prisma dihasilkan ke `generated/prisma` (di-gitignore, dibuat ulang oleh `postinstall`).
- `cacheComponents` dan `partialPrefetching` bawaan scaffold dimatikan (aplikasi seluruhnya dinamis dan terotentikasi).
- Sesi JWT tetap berlaku sampai habis meski akun dinonaktifkan; server action presensi (change 02) wajib mengecek `isActive`.
