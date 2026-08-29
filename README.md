# Eno Japan Hub

Buat aplikasi web profesional bernama ENO JAPAN, platform belajar bahasa Jepang dan persiapan JLPT N5-N1. Gunakan dark theme yang modern, premium, clean, mobile-first, dan sangat mudah dibaca. Typography utama Noto Sans JP untuk bahasa Jepang dan Noto Sans untuk Latin/Indonesia; prioritaskan readability, kontras tinggi, spacing lega, kanji tampil besar saat dipelajari, hindari font dekoratif.

Bangun fondasi full-stack yang siap dikembangkan menjadi produk nyata. Fitur utama: landing page profesional; register/login/logout; akun pengguna individual; reset password; profil; dashboard; progress belajar tersimpan per user; target harian 5 kanji + 10 kotoba + 5 bunpo yang dapat dikonfigurasi; streak; Kotoba, Kanji, Bunpo, Reading, Listening; quiz; review kesalahan; spaced repetition; simulasi JLPT N5-N1; statistik progress.

Tambahkan monetisasi: Free, Premium Monthly, Premium Yearly, dan Lifetime Access. Siapkan model entitlement/akses premium di backend, status subscription, riwayat pembayaran, upgrade/cancel/restore, dan struktur payment integration yang aman. Jangan hanya mengunci UI di frontend.

Tambahkan Referral & Rewards: setiap user punya kode/link referral unik; referral satu level; status Pending > Registered > Verified > Active > Qualified > Reward Granted; poin untuk aktivitas belajar dan referral; reward dapat ditukar Premium 7 hari/30 hari/90 hari/Lifetime. Tambahkan social sharing missions. Jangan memberi reward besar hanya karena tombol share ditekan; siapkan mekanisme validasi dan anti-abuse untuk multi-account, device sama, disposable email, bot, refund abuse, dan aktivitas tidak normal.

Tambahkan admin panel: kelola user, materi, kanji, kotoba, bunpo, quiz, simulasi, subscription, referral, rewards, dan statistik. Sediakan role-based access.

Struktur kurikulum mengacu sebagai referensi pada TRY! 日本語能力試験, 日本語総まとめ, 新完全マスター, serta materi/format resmi JLPT. Jangan menyalin isi buku atau soal berhak cipta; buat konten ENO JAPAN original dan gunakan referensi hanya untuk struktur pedagogis dan cakupan. Untuk simulasi, desain format agar realistis terhadap JLPT.

Buat UI dengan navigasi jelas: Beranda, Belajar, Quiz, Simulasi JLPT, Progress, Streak, Rewards, Premium, Profil, Pengaturan. Dashboard harus menonjolkan target hari ini, progress level, streak, dan tombol Lanjutkan Belajar. Halaman Premium harus membandingkan Free/Premium/Lifetime dengan CTA jelas. Halaman Rewards harus menampilkan poin, referral, progress menuju reward, dan share/invite actions.

Gunakan arsitektur komponen yang rapi, responsive, accessible, loading/error/empty states, form validation, dan security best practices. Siapkan seed/demo data untuk N5-N1 secukupnya agar seluruh flow dapat dipreview tanpa mengklaim sebagai konten lengkap. Jangan berhenti pada mockup: implementasikan aplikasi yang berfungsi dan struktur backend yang dapat dikembangkan.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/eab2225e-d5a2-44d3-a059-3cb2e9f29f4e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
