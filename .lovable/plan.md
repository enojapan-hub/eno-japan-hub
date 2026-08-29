# ENO JAPAN — Hasil Audit V1 dan Rencana Implementasi Bertahap

## Hasil audit (kondisi nyata saat ini)

Audit dilakukan terhadap rute, komponen, database, auth, dan integrasi.

| Area | Status | Bukti |
| --- | --- | --- |
| Routes | Hanya `src/routes/__root.tsx` + `src/routes/index.tsx` (masih placeholder template) | isi folder `src/routes` |
| Komponen | Hanya komponen UI dasar bawaan template (`src/components/ui/*`), belum ada komponen produk | isi `src/components` |
| Database | Kosong — tidak ada tabel, fungsi, atau trigger; `src/integrations/supabase/types.ts` tidak punya tabel | types.ts + info proyek backend |
| Migrations | Folder `supabase/migrations` tidak ada; skema yang disusun sesi lalu belum pernah dijalankan | isi `supabase/` |
| Auth | Backend aktif, klien Supabase & middleware bearer terpasang di `src/start.ts`, tetapi belum ada halaman auth maupun route terproteksi | start.ts, integrations |
| Seed/demo data | Belum ada | database kosong |
| Progress, quiz, JLPT, subscription/entitlement, referral/rewards, admin, i18n | Belum ada sama sekali | tidak ada file terkait |

Kesimpulan: tidak ada fitur yang "sudah berfungsi" maupun "mockup" — proyek masih template kosong dengan backend yang sudah tersambung. Artinya tidak ada risiko rewrite: semua pekerjaan bersifat penambahan baru. Yang perlu dijaga hanyalah file yang dikelola otomatis (klien Supabase, middleware, route tree).

## Prinsip yang dipegang

- Free benar-benar berguna di N5–N1: seluruh kurikulum, kanji, kotoba, bunpo, quiz, review, progress, XP, streak, dan sebagian simulasi JLPT terbuka untuk Free.
- Premium = personalisasi, AI, analitik mendalam, simulasi penuh, konvenien — bukan mengunci materi.
- Entitlement diputuskan di backend (tabel + fungsi security definer), tidak pernah hanya di frontend.
- Perubahan bertahap dan reversibel; konten dipisah dari komponen UI.

## Urutan pekerjaan (paling aman → lanjut)

### Fase 0 — Fondasi (wajib lebih dulu)
1. Design system dark premium: token warna/tipografi di `src/styles.css`, font Noto Sans + Noto Sans JP via `<link>` di `__root.tsx`, skala teks kanji besar.
2. Shell aplikasi: header, bottom nav mobile-first, layout terproteksi.

### Fase 1 — Database inti (1 migrasi)
- `profiles`, `user_roles` + enum `app_role` + fungsi `has_role`, `user_settings` (target harian 5 kanji / 10 kotoba / 5 bunpo, bahasa UI).
- Trigger `handle_new_user` untuk membuat profil + settings otomatis.
- RLS + GRANT untuk setiap tabel.

### Fase 2 — Auth
- Halaman `/auth` (email+password, Google), reset password, halaman callback publik.
- Layout `_authenticated`, sign-out bersih, header sadar sesi.

### Fase 3 — Konten kurikulum
- Tabel `levels`, `kanji`, `vocabulary`, `grammar`, `reading_passages`, `listening_items`, `lessons`, `lesson_items`, dengan versi konten + kolom lokalisasi.
- Seed demo original untuk N5–N1 (jumlah kecil per level, ditandai jelas sebagai contoh, bukan konten JLPT lengkap).
- Halaman belajar: daftar level, detail kanji/kotoba/bunpo, tampilan kanji besar.

### Fase 4 — Quiz, review, spaced repetition
- Tabel `questions`, `quizzes`, `quiz_attempts`, `attempt_answers`, `reviews` (SRS), `mistakes`.
- Flow quiz jalan penuh: mulai → jawab → skor → masuk antrean review; SRS interval sederhana (SM-2 ringkas).

### Fase 5 — Progress, XP, streak, target harian
- Tabel `user_progress`, `xp_events`, `streaks`, `daily_goals`; perhitungan di server (fungsi DB/serverFn), bukan di frontend.
- Halaman Progress dengan statistik nyata (tanpa metrik palsu).

### Fase 6 — Simulasi JLPT
- Tabel `exams`, `exam_sections`, `exam_attempts` untuk N5–N1; timer, bagian moji-goi/bunpo-dokkai/choukai, skoring.
- Free: sebagian simulasi tersedia di semua level. Premium: paket simulasi penuh.

### Fase 7 — Monetisasi & entitlement
- `plans`, `subscriptions`, `entitlements`, `payments`; fungsi `has_entitlement(user, key)` security definer.
- Gate premium selalu dicek server-side; UI hanya menampilkan status.

### Fase 8 — Referral & rewards
- `referrals`, `reward_points`, `rewards`, `reward_redemptions`; kode referral unik, anti self-referral, poin diberikan lewat trigger/serverFn.
- Halaman Rewards: poin, progress reward, aksi share/invite.

### Fase 9 — Admin
- Panel admin di bawah gate `has_role('admin')`: kelola konten, soal, pengguna, langganan; audit log.

### Fase 10 — i18n
- Arsitektur terjemahan (ID/EN/JP) dengan kamus terpisah dari komponen; kolom lokalisasi konten sudah disiapkan sejak Fase 3.

Setiap fase selesai dengan: loading/empty/error state, validasi form, aksesibilitas, dan pengecekan mobile.

## Catatan teknis, risiko, dan dependensi

- **Migrasi**: satu migrasi per fase, tidak destruktif. Setiap `CREATE TABLE` publik disertai GRANT + RLS + policy. Konten publik memakai policy SELECT `anon` yang sempit; data pengguna selalu `auth.uid()`.
- **Peran**: role disimpan di tabel `user_roles` terpisah (bukan di profiles) dengan fungsi `has_role` security definer — mencegah privilege escalation.
- **Auth gate**: rute terproteksi berada di `src/routes/_authenticated/`; halaman publik (landing, auth) tetap SSR dan tidak boleh memanggil server function terproteksi di loader.
- **Server logic**: memakai `createServerFn` TanStack (bukan edge function). Logika XP/streak/skor dijalankan server agar tidak bisa dimanipulasi.
- **Risiko urutan**: Fase 4–6 bergantung pada Fase 3 (konten) dan Fase 1 (identitas). Entitlement (Fase 7) harus ada sebelum gate premium apa pun dipasang di UI, agar tidak muncul kunci frontend-only.
- **Kesiapan V2 (AI tutor, adaptif)**: skema attempt/answer/review menyimpan detail per soal + timestamp sehingga jalur pembelajaran adaptif dan koreksi AI dapat dibangun tanpa mengubah tabel inti; entitlement berbasis key agar fitur AI cukup ditambah sebagai key baru.
- **Konten**: seluruh materi ditulis original; buku eksternal hanya sebagai acuan cakupan, tidak disalin. Demo data ditandai sebagai contoh.

## Cakupan langkah pertama setelah persetujuan

Fase 0 + Fase 1 + Fase 2: design system, shell, migrasi identitas, dan auth yang berfungsi penuh — termasuk mengganti halaman placeholder `/` dengan landing ENO JAPAN.
