import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, BookOpen, ChevronRight, ExternalLink, LogOut, Moon, RefreshCw, Shield, Smartphone, Star, Sun, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/pengaturan")({
  head: () => ({ meta: [{ title: "Pengaturan — enonihongo" }, { name: "description", content: "Atur pengalaman belajar dan akun enonihongo." }] }),
  component: SettingsPage,
});

function SettingsRow({ icon: Icon, title, description, children, onClick }: { icon: typeof Bell; title: string; description?: string; children?: React.ReactNode; onClick?: () => void }) {
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
  const toggleNotifications = (value: boolean) => { setNotifications(value); localStorage.setItem("enonihongo-notifications", value ? "on" : "off"); toast.success(value ? "Notifikasi diaktifkan." : "Notifikasi dimatikan."); };
  const toggleDark = (value: boolean) => { setDark(value); document.documentElement.classList.toggle("dark", value); localStorage.setItem("enonihongo-theme", value ? "dark" : "light"); };
  const refresh = async () => { await qc.invalidateQueries(); toast.success("Data berhasil disegarkan."); };
  const follow = () => { window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer"); };

  return <AppShell title="Pengaturan" backTo="/profil" description="Atur pengalaman belajar, akun, dan aplikasi.">
    <div className="space-y-4">
      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Belajar</CardTitle></CardHeader><CardContent className="space-y-1">
        <SettingsRow icon={BookOpen} title="Instruksi" description="Panduan menggunakan enonihongo." onClick={() => toast.info("Panduan belajar enonihongo akan tersedia di sini.")} />
        <SettingsRow icon={Bell} title="Studi pengingat" description="Atur pengingat belajar harian." onClick={() => toast.info("Pengingat belajar dapat diatur dari Profil → Target harian.")} />
        <SettingsRow icon={Bell} title="Dapatkan notifikasi" description="Terima pemberitahuan dari enonihongo."><Switch checked={notifications} onCheckedChange={toggleNotifications} /></SettingsRow>
        <SettingsRow icon={dark ? Sun : Moon} title="Mode gelap" description="Sesuaikan tampilan dengan suasana layar."><Switch checked={dark} onCheckedChange={toggleDark} /></SettingsRow>
        <SettingsRow icon={RefreshCw} title="Segarkan data" description="Muat ulang data belajar terbaru." onClick={() => void refresh()} />
        <SettingsRow icon={Smartphone} title="Kelola perangkat" description="Periksa perangkat yang digunakan untuk akun ini." onClick={() => toast.info("Pengelolaan perangkat akan tersedia di sini.")} />
      </CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Tentang enonihongo</CardTitle></CardHeader><CardContent className="space-y-1">
        <SettingsRow icon={Star} title="Nilai kami" description="Beri penilaian dan bantu kami berkembang." onClick={() => toast.info("Terima kasih sudah menggunakan enonihongo.")} />
        <SettingsRow icon={Users} title="Masukan" description="Kirim saran atau laporkan masalah." onClick={() => window.location.href = "mailto:support@enonihongo.com?subject=Masukan%20enonihongo"} />
        <SettingsRow icon={Shield} title="Ketentuan penggunaan dan kebijakan privasi" description="Baca ketentuan dan kebijakan privasi." onClick={() => toast.info("Dokumen kebijakan akan tersedia di halaman resmi enonihongo.")} />
        <SettingsRow icon={UserRound} title="Hubungi layanan pelanggan" description="Kami siap membantu." onClick={() => window.location.href = "mailto:support@enonihongo.com"} />
        <SettingsRow icon={ExternalLink} title="Ikuti akun kami" description="Ikuti enonihongo untuk kabar terbaru." onClick={follow} />
      </CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm font-medium">Versi aplikasi</p><p className="text-[11px] text-muted-foreground">enonihongo</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">V1.0.0</span></CardContent></Card>
    </div>
  </AppShell>;
}
