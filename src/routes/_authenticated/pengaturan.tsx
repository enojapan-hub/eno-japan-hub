import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell, BookOpen, BookOpenCheck, ChevronRight, ExternalLink, Globe2, HelpCircle,
  Info, Languages, LogOut, Moon, RefreshCw, Shield, Smartphone, Star, Sun,
  Target, Trash2, UserRound, Users, LockKeyhole, MessageSquareText, CircleHelp,
  FileText, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/pengaturan")({
  head: () => ({ meta: [{ title: "Pengaturan — enonihongo" }, { name: "description", content: "Atur pengalaman belajar dan akun enonihongo." }] }),
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

function SettingsPage() {
  const qc = useQueryClient();
  const [notifications, setNotifications] = useState(() => localStorage.getItem("enonihongo-notifications") !== "off");
  const [dark, setDark] = useState(() => localStorage.getItem("enonihongo-theme") === "dark");
  const [language, setLanguage] = useState(() => localStorage.getItem("enonihongo-language") || "Indonesia");
  const toggleNotifications = (value: boolean) => { setNotifications(value); localStorage.setItem("enonihongo-notifications", value ? "on" : "off"); toast.success(value ? "Notifikasi diaktifkan." : "Notifikasi dimatikan."); };
  const toggleDark = (value: boolean) => { setDark(value); document.documentElement.classList.toggle("dark", value); localStorage.setItem("enonihongo-theme", value ? "dark" : "light"); toast.success(value ? "Mode gelap aktif." : "Mode terang aktif."); };
  const refresh = async () => { await qc.invalidateQueries(); toast.success("Data berhasil disegarkan."); };
  const follow = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const chooseLanguage = () => {
    const langs = ["Indonesia", "English", "日本語", "Tiếng Việt", "ภาษาไทย"];
    const next = langs[(langs.indexOf(language) + 1) % langs.length];
    setLanguage(next); localStorage.setItem("enonihongo-language", next); toast.success(`Bahasa dipilih: ${next}`);
  };
  const guide = () => toast.info("Panduan ENO NIHONGO: mulai dari Target Harian, pelajari Kanji/Kotoba/Bunpō, lanjutkan Dokkai & Listening, lalu ukur kemampuan lewat Quiz dan Simulasi JLPT.");
  const logout = () => { localStorage.removeItem("enonihongo-theme"); window.location.href = "/auth"; };
  const deleteAccount = () => toast.warning("Penghapusan akun memerlukan konfirmasi dan proses keamanan dari server.");

  return <AppShell title="Pengaturan" backTo="/profil" description="Atur pengalaman belajar, akun, dan aplikasi.">
    <div className="space-y-4">
      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Belajar</CardTitle></CardHeader><CardContent className="space-y-1">
        <SettingsRow icon={BookOpenCheck} title="Instruksi & Panduan" description="Cara menggunakan seluruh fitur ENO NIHONGO." onClick={guide} />
        <SettingsRow icon={Target} title="Target Belajar" description="Atur target harian Kanji, Kotoba, dan waktu belajar." onClick={() => window.location.href = "/profil"} />
        <SettingsRow icon={Bell} title="Pengingat Belajar" description="Atur kebiasaan dan pengingat belajar harian." onClick={() => toast.info("Pengingat belajar akan mengikuti target harian dari Profil.")} />
        <SettingsRow icon={Bell} title="Dapatkan Notifikasi" description="Terima pemberitahuan penting dari ENO NIHONGO."><Switch checked={notifications} onCheckedChange={toggleNotifications} /></SettingsRow>
        <SettingsRow icon={dark ? Sun : Moon} title="Mode Tampilan" description="Gunakan mode terang atau gelap."><Switch checked={dark} onCheckedChange={toggleDark} /></SettingsRow>
        <SettingsRow icon={Languages} title="Bahasa" description={`Bahasa aplikasi: ${language}. Ketuk untuk mengganti.`} onClick={chooseLanguage} />
        <SettingsRow icon={RefreshCw} title="Segarkan Data" description="Muat ulang data belajar terbaru." onClick={() => void refresh()} />
      </CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Akun & Keamanan</CardTitle></CardHeader><CardContent className="space-y-1">
        <SettingsRow icon={UserRound} title="Profil" description="Kelola informasi profil dan target belajar." onClick={() => window.location.href = "/profil"} />
        <SettingsRow icon={LockKeyhole} title="Keamanan Akun" description="Pengaturan keamanan dan sesi akun." onClick={() => toast.info("Keamanan akun dikelola melalui autentikasi ENO NIHONGO.")} />
        <SettingsRow icon={Smartphone} title="Kelola Perangkat" description="Periksa perangkat yang digunakan untuk akun ini." onClick={() => toast.info("Daftar perangkat akan tersedia setelah manajemen sesi diaktifkan.")} />
        <SettingsRow icon={LogOut} title="Keluar" description="Keluar dari akun di perangkat ini." onClick={logout} />
        <SettingsRow icon={Trash2} title="Hapus Akun" description="Hapus akun dan data secara permanen." onClick={deleteAccount} />
      </CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Bantuan & Informasi</CardTitle></CardHeader><CardContent className="space-y-1">
        <SettingsRow icon={CircleHelp} title="Cara Belajar ENO NIHONGO" description="Alur belajar dari dasar sampai persiapan JLPT." onClick={guide} />
        <SettingsRow icon={HelpCircle} title="FAQ" description="Jawaban untuk pertanyaan yang sering ditanyakan." onClick={() => toast.info("FAQ: pilih level JLPT, ikuti materi, kerjakan latihan, cek progress, dan gunakan simulasi untuk mengukur kesiapan.")} />
        <SettingsRow icon={MessageSquareText} title="Masukan & Laporan Masalah" description="Kirim saran, bug, atau laporan pengalaman pengguna." onClick={() => window.location.href = "mailto:support@enonihongo.com?subject=Masukan%20atau%20Laporan%20ENO%20NIHONGO"} />
        <SettingsRow icon={Shield} title="Ketentuan & Kebijakan Privasi" description="Baca ketentuan penggunaan dan kebijakan privasi." onClick={() => toast.info("Dokumen ketentuan dan privasi akan dibuka dari halaman resmi ENO NIHONGO.")} />
        <SettingsRow icon={Globe2} title="Referensi Materi" description="Informasi sumber dan referensi pembelajaran." onClick={() => toast.info("Referensi materi akan mencantumkan sumber yang digunakan untuk materi JLPT.")} />
      </CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Tentang ENO NIHONGO</CardTitle></CardHeader><CardContent className="space-y-1">
        <SettingsRow icon={Info} title="Tentang Aplikasi" description="ENO NIHONGO — platform belajar bahasa Jepang untuk JLPT N5–N1." onClick={() => toast.info("ENO NIHONGO membantu belajar Kanji, Kotoba, Bunpō, Dokkai, Listening, Quiz, dan Simulasi JLPT.")} />
        <SettingsRow icon={Star} title="Beri Rating" description="Bantu kami meningkatkan ENO NIHONGO." onClick={() => toast.success("Terima kasih atas dukunganmu untuk ENO NIHONGO.")} />
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
  </AppShell>;
}
