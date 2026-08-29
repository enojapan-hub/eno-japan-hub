# ENO JAPAN — Arsitektur (V1 Foundation)

## Stack
- TanStack Start (React 19, Vite) — routing file-based di `src/routes`, logika server via `createServerFn`.
- Lovable Cloud (Postgres + Auth) — semua akses data lewat RLS.
- Tailwind v4 + shadcn/ui, tema gelap tunggal, mobile-first.

## Domain model

### Identitas
`profiles` (nama, bahasa UI, target level) · `user_settings` (target harian kanji/kotoba/bunpo, furigana, pengingat) · `user_roles` + enum `app_role` + `has_role()` security definer. Role TIDAK disimpan di profiles.

### Konten (dibaca publik jika `is_published`)
- `levels` — N5–N1 dengan rentang CEFR (`cefr_min`/`cefr_max`).
- `kanji`, `vocabulary`, `grammar_points` — masing-masing punya `level`, arti ID/EN, `examples` (jsonb), `source`, `is_published`, `sort_order`.
- `lessons` + `lesson_items` (polimorfik: `item_type` ∈ kanji/vocabulary/grammar, `item_id`).
- `questions` (choices jsonb + `correct_index` + penjelasan, opsional tertaut ke item) dan `quizzes` + `quiz_questions`.

Penulisan/perubahan konten hanya untuk admin/moderator via `is_content_editor()`.

### Progres pengguna (semua `auth.uid()`-scoped)
- `user_item_progress` — sudah menyimpan field SRS (`ease_factor`, `interval_days`, `repetitions`, `lapses`, `due_at`, `mastery`) sehingga algoritma SM-2 bisa ditambahkan tanpa migrasi struktural.
- `learning_sessions`, `quiz_attempts`, `quiz_answers` — granular per soal + timestamp, cukup untuk analitik mistake dan adaptif AI di V2.
- `user_stats` (total XP, streak berjalan/terpanjang, `estimated_cefr`) dan `user_daily_activity` (agregat harian per skill) — dasar XP, streak, dan grafik progress.

## Keputusan penting
1. **Sumber konten eksplisit** — enum `content_source` (`eno_original` / `reference_derived`). Seed saat ini seluruhnya `eno_original` dan berupa contoh kecil untuk validasi alur; **bukan materi resmi JLPT**. Buku referensi hanya dipakai sebagai acuan struktur/cakupan.
2. **Perhitungan skor, XP, dan streak dijalankan di server** (server function / fungsi DB), bukan di klien.
3. **Enum untuk level, skill, dan tipe item** menjaga konsistensi lintas tabel dan mempermudah query per level.
4. **Item polimorfik ringan** (`item_type` + `item_id`) dipilih daripada banyak tabel join agar tipe materi baru (reading, listening) cukup menambah nilai enum.
5. **`SECURITY DEFINER` yang dapat dipanggil pengguna login** (`has_role`, `is_content_editor`) memang disengaja: keduanya hanya membaca role milik pemanggil dan dibutuhkan oleh policy RLS; keduanya tidak menerima input sensitif dan tidak menulis data.

## Kompatibilitas roadmap
- **V1.1** (SRS, streak, achievement): kolom SRS dan agregat harian sudah tersedia.
- **V2** (AI tutor, adaptif): riwayat jawaban per soal + sesi sudah tersimpan; fitur AI menjadi konsumen data, bukan pengubah skema inti.
- **V3** (subscription, kelas): tabel entitlement/subscription akan ditambahkan terpisah dan direferensikan lewat `user_id`; tidak ada kolom monetisasi yang mencemari tabel konten atau progres.

## Aturan pengembangan
- Satu migrasi per tahap, non-destruktif; setiap tabel publik wajib GRANT + RLS + policy.
- Rute terproteksi berada di `src/routes/_authenticated/`; halaman publik tidak memanggil server function berautentikasi di loader.
- Tidak menambahkan navigasi untuk fitur yang belum terhubung ke data nyata.
