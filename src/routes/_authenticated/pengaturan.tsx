import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell, BookOpen, BookOpenCheck, ChevronRight, ExternalLink, Globe2, HelpCircle,
  Info, Languages, LogOut, Moon, RefreshCw, Shield, Smartphone, Star, Sun,
  Target, Trash2, UserRound, Users, LockKeyhole, MessageSquareText, CircleHelp,
  CheckCircle2, X,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/pengaturan")({
  head: () => ({ meta: [{ title: "Pengaturan — ENO NIHONGO" }, { name: "description", content: "Atur pengalaman belajar dan akun ENO NIHONGO." }] }),
  component: SettingsPage,
});

type RowProps = { icon: typeof Bell; title: string; description?: string; children?: React.ReactNode; onClick?: () => void };
function SettingsRow({ icon: Icon, title, description, children, onClick }: RowProps) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-muted/50 active:bg-muted">
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-[18px]" /></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{title}</span>{description && <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">{description}</span>}</span>
    {children ?? <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
  </button>;
}

const content: Record<string, { title: string; sections: { heading: string; text: string }[] }> = {
  guide: { title: "Instruksi & Panduan", sections: [
    { heading: "Mulai belajar", text: "Pilih level JLPT yang sedang kamu pelajari. Mulai dari Kanji, Kotoba, dan Bunpō, kemudian lanjutkan ke Dokkai dan Listening." },
    { heading: "Latihan", text: "Kerjakan Quiz setelah mempelajari materi. Gunakan pembahasan untuk mengetahui kesalahan dan ulangi materi yang belum dikuasai." },
    { heading: "Persiapan JLPT", text: "Gunakan Simulasi JLPT untuk mengukur kemampuan. Pantau Progress secara berkala agar tahu bagian yang perlu ditingkatkan." },
    { heading: "Target harian", text: "Belajar sedikit tetapi konsisten. Target dapat digunakan untuk menjaga kebiasaan belajar setiap hari." },
  ]},
  reminder: { title: "Pengingat Belajar", sections: [
    { heading: "Tujuan", text: "Pengingat membantu menjaga konsistensi belajar tanpa harus mengingat jadwal sendiri." },
    { heading: "Rekomendasi", text: "Sisihkan 20–30 menit per sesi. Contoh: 10 menit Kanji/Kotoba, 10 menit Bunpō, dan 10 menit Dokkai atau Listening." },
    { heading: "Notifikasi", text: "Aktifkan Dapatkan Notifikasi agar pengingat dan informasi penting dapat dikirim ke perangkat saat fitur notifikasi tersedia." },
  ]},
  security: { title: "Keamanan Akun", sections: [
    { heading: "Lindungi akun", text: "Gunakan kata sandi yang kuat dan jangan membagikan kredensial akun kepada orang lain." },
    { heading: "Sesi login", text: "Jika menggunakan perangkat bersama, selalu keluar setelah selesai. Sesi yang tidak dikenal sebaiknya segera ditutup." },
    { heading: "Masalah akses", text: "Jika kamu menemukan aktivitas yang tidak dikenal atau tidak dapat mengakses akun, hubungi layanan pelanggan ENO NIHONGO." },
  ]},
  devices: { title: "Kelola Perangkat", sections: [
    { heading: "Perangkat aktif", text: "Halaman ini menjelaskan pengelolaan sesi login. Daftar perangkat akan ditampilkan setelah manajemen sesi multi-perangkat tersedia." },
    { heading: "Keamanan", text: "Jangan gunakan akun pada perangkat umum tanpa logout. Jika perangkat hilang, segera ubah kredensial akun dan hubungi layanan pelanggan." },
  ]},
  faq: { title: "FAQ", sections: [
    { heading: "ENO NIHONGO untuk siapa?", text: "ENO NIHONGO ditujukan untuk pembelajar bahasa Jepang yang mempersiapkan JLPT N5 sampai N1." },
    { heading: "Mulai dari mana?", text: "Mulai dari level yang sesuai kemampuanmu, lalu ikuti Kanji, Kotoba, Bunpō, Dokkai, Listening, dan latihan secara bertahap." },
    { heading: "Bagaimana melihat perkembangan?", text: "Gunakan menu Progress untuk memantau hasil belajar dan mengetahui materi yang masih perlu diulang." },
    { heading: "Apakah ada simulasi JLPT?", text: "Ya. Simulasi digunakan untuk latihan dengan format ujian dan membantu mengukur kesiapan sebelum mengikuti JLPT." },
  ]},
  privacy: { title: "Ketentuan & Kebijakan Privasi", sections: [
    { heading: "Penggunaan aplikasi", text: "Gunakan ENO NIHONGO untuk tujuan belajar dan jangan menyalahgunakan sistem, akun pengguna lain, atau konten yang tersedia." },
    { heading: "Data pengguna", text: "Data akun dan progres digunakan untuk menyediakan pengalaman belajar, menyimpan perkembangan, dan meningkatkan layanan." },
    { heading: "Privasi", text: "Kami berupaya menjaga keamanan data pengguna. Jangan memasukkan informasi sensitif yang tidak diperlukan untuk penggunaan aplikasi." },
  ]},
  references: { title: "Referensi Materi", sections: [
    { heading: "Sumber pembelajaran", text: "Materi ENO NIHONGO disusun untuk mendukung pembelajaran bahasa Jepang dan persiapan JLPT." },
    { heading: "JLPT", text: "Struktur latihan dan level mengikuti konsep umum JLPT N5–N1. Untuk informasi resmi ujian, selalu jadikan sumber resmi penyelenggara sebagai acuan utama." },
    { heading: "Pengembangan materi", text: "Referensi, contoh kalimat, kosakata, kanji, tata bahasa, dan bacaan akan terus diperluas dan diperbarui." },
  ]},
  about: { title: "Tentang ENO NIHONGO", sections: [
    { heading: "Apa itu ENO NIHONGO?", text: "ENO NIHONGO adalah platform belajar bahasa Jepang yang menggabungkan materi, latihan, dan pemantauan progress dalam satu tempat." },
    { heading: "Fitur", text: "Kanji, Kotoba, Bunpō, Dokkai, Listening, Quiz, Simulasi JLPT, Progress, dan fitur pendukung pembelajaran." },
    { heading: "Target", text: "Membantu pembelajar belajar lebih terarah, konsisten, dan siap menghadapi JLPT N5–N1." },
  ]},
  rating: { title: "Beri Rating", sections: [
    { heading: "Dukunganmu berarti", text: "Jika ENO NIHONGO membantu proses belajarmu, berikan rating dan sampaikan apa yang kamu sukai." },
    { heading: "Saran", text: "Kamu juga dapat mengirim masukan tentang fitur, tampilan, materi, atau bug melalui menu Masukan & Laporan Masalah." },
  ]},
};

function SettingsPage() {
  const qc = useQueryClient();
  const [notifications, setNotifications] = useState(() => localStorage.getItem("enonihongo-notifications") !== "off");
  const [dark, setDark] = useState(() => localStorage.getItem("enonihongo-theme") === "dark");
  const [language, setLanguage] = useState(() => localStorage.getItem("enonihongo-language") || "Indonesia");
  const [open, setOpen] = useState<string | null>(null);
  const toggleNotifications = (value: boolean) => { setNotifications(value); localStorage.setItem("enonihongo-notifications", value ? "on" : "off"); toast.success(value ? "Notifikasi diaktifkan." : "Notifikasi dimatikan."); };
  const toggleDark = (value: boolean) => { setDark(value); document.documentElement.classList.toggle("dark", value); localStorage.setItem("enonihongo-theme", value ? "dark" : "light"); toast.success(value ? "Mode gelap aktif." : "Mode terang aktif."); };
  const refresh = async () => { await qc.invalidateQueries(); toast.success("Data berhasil disegarkan."); };
  const follow = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const chooseLanguage = () => { const langs = ["Indonesia", "English", "日本語", "Tiếng Việt", "ภาษาไทย"]; const next = langs[(langs.indexOf(language) + 1) % langs.length]; setLanguage(next); localStorage.setItem("enonihongo-language", next); toast.success(`Bahasa dipilih: ${next}`); };
  const logout = () => { localStorage.removeItem("enonihongo-theme"); window.location.href = "/auth"; };

  return <AppShell title="Pengaturan" backTo="/profil" description="Atur pengalaman belajar, akun, dan aplikasi.">
    <div className="space-y-4">
      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Belajar</CardTitle></CardHeader><CardContent className="space-y-1">
        <SettingsRow icon={BookOpenCheck} title="Instruksi & Panduan" description="Panduan lengkap menggunakan ENO NIHONGO." onClick={() => setOpen("guide")} />
        <SettingsRow icon={Target} title="Target Belajar" description="Atur target harian Kanji, Kotoba, dan waktu belajar." onClick={() => window.location.href = "/profil"} />
        <SettingsRow icon={Bell} title="Pengingat Belajar" description="Tips dan aturan pengingat belajar harian." onClick={() => setOpen("reminder")} />
        <SettingsRow icon={Bell} title="Dapatkan Notifikasi" description="Terima pemberitahuan penting dari ENO NIHONGO."><Switch checked={notifications} onCheckedChange={toggleNotifications} /></SettingsRow>
        <SettingsRow icon={dark ? Sun : Moon} title="Mode Tampilan" description="Gunakan mode terang atau gelap."><Switch checked={dark} onCheckedChange={toggleDark} /></SettingsRow>
        <SettingsRow icon={Languages} title="Bahasa" description={`Bahasa aplikasi: ${language}. Ketuk untuk mengganti.`} onClick={chooseLanguage} />
        <SettingsRow icon={RefreshCw} title="Segarkan Data" description="Muat ulang data belajar terbaru." onClick={() => void refresh()} />
      </CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Akun & Keamanan</CardTitle></CardHeader><CardContent className="space-y-1">
        <SettingsRow icon={UserRound} title="Profil" description="Kelola informasi profil dan target belajar." onClick={() => window.location.href = "/profil"} />
        <SettingsRow icon={LockKeyhole} title="Keamanan Akun" description="Panduan menjaga keamanan akun dan sesi login." onClick={() => setOpen("security")} />
        <SettingsRow icon={Smartphone} title="Kelola Perangkat" description="Informasi pengelolaan perangkat dan sesi." onClick={() => setOpen("devices")} />
        <SettingsRow icon={LogOut} title="Keluar" description="Keluar dari akun di perangkat ini." onClick={logout} />
        <SettingsRow icon={Trash2} title="Hapus Akun" description="Hapus akun dan data secara permanen." onClick={() => toast.warning("Untuk menghapus akun secara permanen, hubungi layanan pelanggan agar proses keamanan dapat dilakukan.")} />
      </CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Bantuan & Informasi</CardTitle></CardHeader><CardContent className="space-y-1">
        <SettingsRow icon={CircleHelp} title="Cara Belajar ENO NIHONGO" description="Alur belajar dari dasar sampai persiapan JLPT." onClick={() => setOpen("guide")} />
        <SettingsRow icon={HelpCircle} title="FAQ" description="Jawaban untuk pertanyaan yang sering ditanyakan." onClick={() => setOpen("faq")} />
        <SettingsRow icon={MessageSquareText} title="Masukan & Laporan Masalah" description="Kirim saran, bug, atau laporan pengalaman pengguna." onClick={() => window.location.href = "mailto:support@enonihongo.com?subject=Masukan%20atau%20Laporan%20ENO%20NIHONOGO"} />
        <SettingsRow icon={Shield} title="Ketentuan & Kebijakan Privasi" description="Baca aturan penggunaan dan informasi privasi." onClick={() => setOpen("privacy")} />
        <SettingsRow icon={Globe2} title="Referensi Materi" description="Sumber dan informasi referensi pembelajaran." onClick={() => setOpen("references")} />
      </CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Tentang ENO NIHONGO</CardTitle></CardHeader><CardContent className="space-y-1">
        <SettingsRow icon={Info} title="Tentang Aplikasi" description="Profil dan tujuan ENO NIHONGO." onClick={() => setOpen("about")} />
        <SettingsRow icon={Star} title="Beri Rating" description="Bantu kami meningkatkan ENO NIHONGO." onClick={() => setOpen("rating")} />
        <SettingsRow icon={Users} title="Layanan Pelanggan" description="Hubungi kami jika membutuhkan bantuan." onClick={() => window.location.href = "mailto:support@enonihongo.com"} />
        <SettingsRow icon={ExternalLink} title="Ikuti Akun Kami" description="Instagram @enottf • TikTok @enottff" onClick={() => follow("https://www.instagram.com/enottf/")} />
        <div className="ml-12 flex flex-wrap gap-2 pb-2"><button type="button" onClick={() => follow("https://www.instagram.com/enottf/")} className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted">Instagram · @enottf</button><button type="button" onClick={() => follow("https://www.tiktok.com/@enottff")} className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted">TikTok · @enottff</button></div>
      </CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Status Aplikasi</CardTitle></CardHeader><CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Versi aplikasi</p><p className="text-[11px] text-muted-foreground">ENO NIHONGO</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">V1.0.0</span></div>
        <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3"><CheckCircle2 className="size-4 text-primary" /><div><p className="text-xs font-medium">Aplikasi siap digunakan</p><p className="text-[11px] text-muted-foreground">Data dan fitur akan mengikuti pembaruan sistem.</p></div></div>
      </CardContent></Card>

      <div className="pb-4 text-center text-[11px] text-muted-foreground">ENO NIHONGO • Belajar bahasa Jepang dengan terarah.</div>
    </div>
    {open && content[open] && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-background p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{content[open].title}</h2><button type="button" aria-label="Tutup" onClick={() => setOpen(null)} className="rounded-full p-2 hover:bg-muted"><X className="size-5" /></button></div>
        <div className="space-y-4">{content[open].sections.map((section) => <section key={section.heading} className="rounded-xl bg-muted/40 p-4"><h3 className="mb-1 text-sm font-semibold">{section.heading}</h3><p className="text-sm leading-6 text-muted-foreground">{section.text}</p></section>)}</div>
        <button type="button" onClick={() => setOpen(null)} className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Mengerti</button>
      </div>
    </div>}
  </AppShell>;
}
