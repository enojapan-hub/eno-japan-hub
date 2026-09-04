# ENONIHONGO

Platform belajar bahasa Jepang dan persiapan JLPT N5-N1.

## Stack

- TanStack Start + React
- Vite + Nitro
- Vercel
- Supabase
- Tailwind CSS

## Fitur

- Kanji, Kotoba, Bunpo, Dokkai, Listening
- Quiz dan simulasi JLPT N5-N1
- Target harian, progress, streak, dan rewards
- Adaptive Study Planner
- Akun pengguna dan autentikasi
- Subscription Premium dan Lifetime
- Referral & Rewards
- Admin panel dan role-based access
- AI translation pipeline untuk materi

## Development

```sh
npm install
npm run dev
```

## Production

Build production menggunakan Vite + TanStack Start + Nitro dan dideploy ke Vercel.

## Backup checkpoint

Checkpoint project sebelum melanjutkan import/audit materi database.

- Adaptive Study Planner backend + frontend aktif
- Irodori A1 source layer sampai Lesson 18
- Irodori A2 source layer sampai Lesson 18
- Bahasa Indonesia menjadi bahasa konten aktif
- Worker source-linking Supabase aktif
- Production Vercel sudah terhubung ke branch `main`

<!-- Deployment smoke-test marker -->
<!-- Vercel production rebuild: 2026-09-03 -->
<!-- Vercel deployment retry: 2026-09-03 -->
<!-- Profile RLS fix: 2026-09-03 -->
<!-- Profile save verification: 2026-09-03 -->
<!-- Indonesian-only content deployment: 2026-09-04 -->
<!-- Backup checkpoint: 2026-09-04 20:03 JST -->
