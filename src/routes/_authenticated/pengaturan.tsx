import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, BookOpenCheck, ChevronRight, ExternalLink, Globe2, HelpCircle, Info, Languages, LogOut, Moon, RefreshCw, Shield, Smartphone, Star, Sun, Target, Trash2, UserRound, Users, LockKeyhole, MessageSquareText, CircleHelp, CheckCircle2, X } from "lucide-react";
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
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-2 rounded-xl p-2 text-left transition hover:bg-muted/50 active:bg-muted">
    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-3.5" /></span>
    <span className="min-w-0 flex-1"><span className="block text-[12px] font-medium leading-4">{title}</span>{description && <span className="mt-0.5 block text-[9px] leading-3.5 text-muted-foreground">{description}</span>}</span>
    {children ?? <ChevronRight className="size-3 shrink-0 text-muted-foreground" />}
  </button>;
}

type Section = { heading: string; text: string };
const content: Record<string, { title: string; sections: Section[] }> = {
  guide: { title: "Instruksi & Panduan", sections: [
    { heading: "Mulai belajar", text: "Pilih level JLPT yang sedang kamu pelajari. Mulai dari Kanji, Kotoba, dan Bunpō, kemudian lanjutkan ke Dokkai dan Listening." },
    { heading: "Latihan", text: "Kerjakan Quiz setelah mempelajari materi. Gunakan pembahasan untuk mengetahui kesalahan dan ulangi materi yang belum dikuasai." },
    { heading: "Persiapan JLPT", text: "Gunakan Simulasi JLPT untuk mengukur kemampuan. Pantau Progress secara berkala agar tahu bagian yang perlu ditingkatkan." },
    { heading: "Target harian", text: "Belajar sedikit tetapi konsisten. Target dapat digunakan untuk menjaga kebiasaan belajar setiap hari." },
  ]},
  reminder: { title: "Pengingat Belajar", sections: [{ heading: "Tujuan", text: "Pengingat membantu menjaga konsistensi belajar tanpa harus mengingat jadwal sendiri." }, { heading: "Rekomendasi", text: "Sisihkan 20–30 menit per sesi. Contoh: 10 menit Kanji/Kotoba, 10 menit Bunpō, dan 10 menit Dokkai atau Listening." }, { heading: "Notifikasi", text: "Aktifkan Dapatkan Notifikasi agar pengingat dan informasi penting dapat dikirim ke perangkat saat fitur notifikasi tersedia." }] },
  security: { title: "Keamanan Akun", sections: [{ heading: "Lindungi akun", text: "Gunakan kata sandi yang kuat dan jangan membagikan kredensial akun kepada orang lain." }, { heading: "Sesi login", text: "Jika menggunakan perangkat bersama, selalu keluar setelah selesai. Sesi yang tidak dikenal sebaiknya segera ditutup." }, { heading: "Masalah akses", text: "Jika menemukan aktivitas yang tidak dikenal atau tidak dapat mengakses akun, hubungi layanan pelanggan ENO NIHONGO." }] },
  devices: { title: "Kelola Perangkat", sections: [{ heading: "Perangkat aktif", text: "Daftar perangkat akan ditampilkan setelah manajemen sesi multi-perangkat tersedia." }, { heading: "Keamanan", text: "Jangan gunakan akun pada perangkat umum tanpa logout. Jika perangkat hilang, segera ubah kredensial akun." }] },
  faq: { title: "FAQ", sections: [{ heading: "ENO NIHONGO untuk siapa?", text: "ENO NIHONGO ditujukan untuk pembelajar bahasa Jepang yang mempersiapkan JLPT N5 sampai N1." }, { heading: "Mulai dari mana?", text: "Mulai dari level yang sesuai kemampuanmu, lalu ikuti Kanji, Kotoba, Bunpō, Dokkai, Listening, dan latihan secara bertahap." }, { heading: "Bagaimana melihat perkembangan?", text: "Gunakan menu Profil untuk memantau hasil belajar dan mengetahui materi yang masih perlu diulang." }, { heading: "Apakah ada simulasi JLPT?", text: "Ya. Simulasi digunakan untuk latihan dengan format ujian dan membantu mengukur kesiapan sebelum mengikuti JLPT." }] },
  privacy: { title: "Ketentuan & Kebijakan Privasi", sections: [{ heading: "Penggunaan aplikasi", text: "Gunakan ENO NIHONGO untuk tujuan belajar dan jangan menyalahgunakan sistem, akun pengguna lain, atau konten yang tersedia." }, { heading: "Data pengguna", text: "Data akun dan progres digunakan untuk menyediakan pengalaman belajar dan menyimpan perkembangan." }, { heading: "Privasi", text: "Kami berupaya menjaga keamanan data pengguna. Jangan memasukkan informasi sensitif yang tidak diperlukan." }] },
  references: { title: "Referensi Materi", sections: [{ heading: "Sumber pembelajaran", text: "Materi ENO NIHONGO disusun untuk mendukung pembelajaran bahasa Jepang dan persiapan JLPT." }, { heading: "JLPT", text: "Struktur latihan dan level mengikuti konsep umum JLPT N5–N1. Untuk informasi resmi ujian, jadikan sumber resmi penyelenggara sebagai acuan utama." }, { heading: "Pengembangan materi", text: "Referensi, contoh kalimat, kosakata, kanji, tata bahasa, dan bacaan akan terus diperluas dan diperbarui." }] },
  about: { title: "Tentang ENO NIHONGO", sections: [{ heading: "Apa itu ENO NIHONGO?", text: "ENO NIHONGO adalah platform belajar bahasa Jepang yang menggabungkan materi, latihan, dan pemantauan progress dalam satu tempat." }, { heading: "Fitur", text: "Kanji, Kotoba, Bunpō, Dokkai, Listening, Quiz, Simulasi JLPT, Progress, dan fitur pendukung pembelajaran." }, { heading: "Target", text: "Membantu pembelajar belajar lebih terarah, konsisten, dan siap menghadapi JLPT N5–N1." }] },
  rating: { title: "Beri Rating", sections: [{ heading: "Dukunganmu berarti", text: "Jika ENO NIHONGO membantu proses belajarmu, berikan rating dan sampaikan apa yang kamu sukai." }, { heading: "Saran", text: "Kamu juga dapat mengirim masukan tentang fitur, tampilan, materi, atau bug." }] },
};

function CompactInfoModal({ data, onClose }: { data: { title: string; sections: Section[] }; onClose: () => void }) {
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/25 p-3 sm:items-center" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label={data.title} onClick={(e) => e.stopPropagation()} className="flex max-h-[72vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-xl">
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary"><CircleHelp className="size-3.5" /></div>
        <h2 className="min-w-0 flex-1 text-[13px] font-semibold leading-4">{data.title}</h2>
        <button type="button" aria-label="Tutup" onClick={onClose} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2.5">
        <div className="space-y-2.5">
          {data.sections.map((section) => <section key={section.heading} className="rounded-xl border bg-card/60 p-2.5">
            <h3 className="text-[11px] font-semibold leading-4">{section.heading}</h3>
            <p className="mt-1 text-[10px] leading-[1.45] text-muted-foreground">{section.text}</p>
          </section>)}
        </div>
      </div>
      <div className="shrink-0 border-t bg-background/95 px-3 py-2.5">
        <button type="button" onClick={onClose} className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[10px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"><CheckCircle2 className="size-3.5" />Mengerti</button>
      </div>
    </div>
  </div>;
}

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
  const openInfo = (key: string) => setOpen(key);
  const info = open ? content[open] : null;

  return <AppShell title="Pengaturan" backTo="/profil" description="Atur pengalaman belajar, akun, dan aplikasi.">
    <div className="mx-auto w-full max-w-md space-y-2.5">
      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="px-3.5 pb-1.5 pt-3"><CardTitle className="text-xs">Belajar</CardTitle></CardHeader><CardContent className="space-y-0 p-2">
        <SettingsRow icon={BookOpenCheck} title="Instruksi & Panduan" description="Panduan menggunakan ENO NIHONGO." onClick={() => openInfo("guide")} />
        <SettingsRow icon={Target} title="Target Belajar" description="Atur target harian dan waktu belajar." onClick={() => window.location.href = "/profil"} />
        <SettingsRow icon={Bell} title="Pengingat Belajar" description="Tips dan aturan pengingat belajar." onClick={() => openInfo("reminder")} />
        <SettingsRow icon={Bell} title="Dapatkan Notifikasi" description="Terima pemberitahuan penting." ><Switch className="scale-90" checked={notifications} onCheckedChange={toggleNotifications} /></SettingsRow>
        <SettingsRow icon={dark ? Sun : Moon} title="Mode Tampilan" description="Terang atau gelap."><Switch className="scale-90" checked={dark} onCheckedChange={toggleDark} /></SettingsRow>
        <SettingsRow icon={Languages} title="Bahasa" description={`Bahasa aplikasi: ${language}.`} onClick={chooseLanguage} />
        <SettingsRow icon={RefreshCw} title="Segarkan Data" description="Muat ulang data terbaru." onClick={() => void refresh()} />
      </CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="px-3.5 pb-1.5 pt-3"><CardTitle className="text-xs">Akun & Keamanan</CardTitle></CardHeader><CardContent className="space-y-0 p-2">
        <SettingsRow icon={UserRound} title="Profil" description="Kelola informasi profil dan target." onClick={() => window.location.href = "/profil"} />
        <SettingsRow icon={LockKeyhole} title="Keamanan Akun" description="Panduan keamanan akun dan sesi." onClick={() => openInfo("security")} />
        <SettingsRow icon={Smartphone} title="Kelola Perangkat" description="Informasi perangkat dan sesi." onClick={() => openInfo("devices")} />
        <SettingsRow icon={LogOut} title="Keluar" description="Keluar dari akun di perangkat ini." onClick={logout} />
        <SettingsRow icon={Trash2} title="Hapus Akun" description="Hapus akun dan data secara permanen." onClick={() => toast.warning("Untuk menghapus akun secara permanen, hubungi layanan pelanggan.")} />
      </CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="px-3.5 pb-1.5 pt-3"><CardTitle className="text-xs">Bantuan & Informasi</CardTitle></CardHeader><CardContent className="space-y-0 p-2">
        <SettingsRow icon={CircleHelp} title="Cara Belajar ENO NIHONGO" description="Alur belajar dari dasar sampai JLPT." onClick={() => openInfo("guide")} />
        <SettingsRow icon={HelpCircle} title="FAQ" description="Pertanyaan yang sering ditanyakan." onClick={() => openInfo("faq")} />
        <SettingsRow icon={MessageSquareText} title="Masukan & Laporan Masalah" description="Kirim saran atau laporan bug." onClick={() => window.location.href = "mailto:support@enonihongo.com?subject=Masukan%20atau%20Laporan%20ENO%20NIHONOGO"} />
        <SettingsRow icon={Shield} title="Ketentuan & Kebijakan Privasi" description="Aturan penggunaan dan privasi." onClick={() => openInfo("privacy")} />
        <SettingsRow icon={Globe2} title="Referensi Materi" description="Sumber referensi pembelajaran." onClick={() => openInfo("references")} />
      </CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="px-3.5 pb-1.5 pt-3"><CardTitle className="text-xs">Tentang ENO NIHONGO</CardTitle></CardHeader><CardContent className="space-y-0 p-2">
        <SettingsRow icon={Info} title="Tentang Aplikasi" description="Profil dan tujuan ENO NIHONGO." onClick={() => openInfo("about")} />
        <SettingsRow icon={Star} title="Beri Rating" description="Bantu kami meningkatkan ENO NIHONGO." onClick={() => openInfo("rating")} />
        <SettingsRow icon={Users} title="Layanan Pelanggan" description="Hubungi kami jika membutuhkan bantuan." onClick={() => window.location.href = "mailto:support@enonihongo.com"} />
        <SettingsRow icon={ExternalLink} title="Ikuti Akun Kami" description="Instagram @enottf • TikTok @enottff" onClick={() => follow("https://www.instagram.com/enottf/")} />
        <div className="ml-9 flex flex-wrap gap-1 pb-1"><button type="button" onClick={() => follow("https://www.instagram.com/enottf/")} className="rounded-md border px-2 py-1 text-[9px] font-medium hover:bg-muted">Instagram · @enottf</button><button type="button" onClick={() => follow("https://www.tiktok.com/@enottff")} className="rounded-md border px-2 py-1 text-[9px] font-medium hover:bg-muted">TikTok · @enottff</button></div>
      </CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="px-3.5 pb-1.5 pt-3"><CardTitle className="text-xs">Status Aplikasi</CardTitle></CardHeader><CardContent className="space-y-1.5 p-3">
        <div className="flex items-center justify-between text-[10px]"><span className="text-muted-foreground">Versi aplikasi</span><span className="font-medium">ENO NIHONGO V1</span></div>
        <div className="flex items-center justify-between text-[10px]"><span className="text-muted-foreground">Status layanan</span><span className="inline-flex items-center gap-1 font-medium text-emerald-600"><span className="size-1.5 rounded-full bg-emerald-500" />Aktif</span></div>
      </CardContent></Card>
    </div>
    {info && <CompactInfoModal data={info} onClose={() => setOpen(null)} />}
  </AppShell>;
}
