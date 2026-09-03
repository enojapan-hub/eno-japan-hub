import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Camera, Check, Flame, Gift, Globe2, LogOut, Settings, Share2, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchMyProgress } from "@/lib/learn-queries";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
type Level = (typeof LEVELS)[number];
type Language = "id" | "en" | "ja";
type FormState = { display_name: string; target_level: Level; ui_language: Language; daily_kanji_target: number; daily_vocab_target: number; daily_grammar_target: number; furigana_enabled: boolean; daily_reminder: boolean };
type Account = { user: { email?: string | null; created_at?: string; user_metadata?: Record<string, unknown> | null }; profile: { display_name?: string | null; target_level?: string | null; ui_language?: string | null } | null; settings: { daily_kanji_target?: number | null; daily_vocab_target?: number | null; daily_grammar_target?: number | null; furigana_enabled?: boolean | null; daily_reminder?: boolean | null } | null };

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({ meta: [{ title: "Profil — enonihongo" }, { name: "description", content: "Profil dan kemajuan belajar enonihongo." }] }),
  component: ProfilePage,
});

async function readAccount(): Promise<Account> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Sesi masuk tidak ditemukan. Silakan masuk kembali.");
  const id = auth.user.id;
  const [{ data: profile, error: profileError }, { data: settings, error: settingsError }] = await Promise.all([
    supabase.from("profiles").select("display_name,target_level,ui_language").eq("id", id).maybeSingle(),
    supabase.from("user_settings").select("daily_kanji_target,daily_vocab_target,daily_grammar_target,furigana_enabled,daily_reminder").eq("user_id", id).maybeSingle(),
  ]);
  if (profileError) throw new Error(`Profil gagal dimuat: ${profileError.message}`);
  if (settingsError) throw new Error(`Pengaturan gagal dimuat: ${settingsError.message}`);
  return { user: auth.user, profile, settings };
}

async function saveAccount(values: FormState): Promise<void> {
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) throw new Error("Sesi masuk tidak ditemukan.");
  const id = auth.user.id;
  const { error: profileError } = await supabase.from("profiles").update({ display_name: values.display_name.trim(), target_level: values.target_level, ui_language: values.ui_language }).eq("id", id);
  if (profileError) throw new Error(`Profil gagal disimpan: ${profileError.message}`);
  const { error: settingsError } = await supabase.from("user_settings").update({ daily_kanji_target: values.daily_kanji_target, daily_vocab_target: values.daily_vocab_target, daily_grammar_target: values.daily_grammar_target, furigana_enabled: values.furigana_enabled, daily_reminder: values.daily_reminder }).eq("user_id", id);
  if (settingsError) throw new Error(`Pengaturan gagal disimpan: ${settingsError.message}`);
}

function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["my-account-direct"], queryFn: readAccount, staleTime: 30_000 });
  const { data: progress } = useQuery({ queryKey: ["my-progress"], queryFn: fetchMyProgress, staleTime: 30_000 });
  const [form, setForm] = useState<FormState | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    if (!data) return;
    const name = data.profile?.display_name ?? String(data.user.user_metadata?.["full_name"] ?? data.user.user_metadata?.["name"] ?? "");
    const language = data.profile?.ui_language === "en" || data.profile?.ui_language === "ja" ? data.profile.ui_language : "id";
    setForm({ display_name: name, target_level: (LEVELS as readonly string[]).includes(data.profile?.target_level ?? "") ? data.profile?.target_level as Level : "N5", ui_language: language, daily_kanji_target: data.settings?.daily_kanji_target ?? 5, daily_vocab_target: data.settings?.daily_vocab_target ?? 10, daily_grammar_target: data.settings?.daily_grammar_target ?? 5, furigana_enabled: data.settings?.furigana_enabled ?? true, daily_reminder: data.settings?.daily_reminder ?? false });
  }, [data]);

  const mutation = useMutation({
    mutationFn: saveAccount,
    onSuccess: () => { toast.success("Pengaturan berhasil disimpan."); setEditingProfile(false); void qc.invalidateQueries({ queryKey: ["my-account-direct"] }); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Pengaturan gagal disimpan."),
  });

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) { toast.error(`Gagal keluar: ${signOutError.message}`); return; }
    await navigate({ to: "/login" });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (form.display_name.trim().length < 2) { toast.error("Nama minimal 2 karakter."); return; }
    mutation.mutate({ ...form, display_name: form.display_name.trim() });
  }

  if (isLoading || !form) return <AppShell title="Profil"><div className="space-y-4"><Skeleton className="h-[390px] w-full rounded-[36px]" /><Skeleton className="h-52 w-full rounded-3xl" /></div></AppShell>;
  if (isError) return <AppShell title="Profil"><Card><CardHeader><CardTitle>Profil tidak dapat dimuat</CardTitle><CardDescription>{(error as Error).message}</CardDescription></CardHeader><CardContent><Button variant="outline" onClick={() => void refetch()}>Coba lagi</Button></CardContent></Card></AppShell>;

  const metadata = data.user.user_metadata ?? {};
  const avatar = String(metadata["avatar_url"] ?? metadata["picture"] ?? "");
  const name = form.display_name || "Pengguna enonihongo";
  const stats = progress?.stats as Record<string, unknown> | undefined;
  const points = Number(stats?.total_xp ?? 0);
  const learnedKanji = Number(stats?.learned_kanji ?? stats?.kanji ?? 0);
  const learnedVocab = Number(stats?.learned_vocab ?? stats?.vocabulary ?? 0);
  const learnedGrammar = Number(stats?.learned_grammar ?? stats?.grammar ?? 0);
  const learnedDokkai = Number(stats?.learned_reading ?? stats?.reading ?? 0);
  const learnedChoukai = Number(stats?.learned_listening ?? stats?.listening ?? 0);
  const streak = Number(stats?.streak_days ?? stats?.streak ?? 0);
  const totalLearned = learnedKanji + learnedVocab + learnedGrammar + learnedDokkai + learnedChoukai;
  const createdAt = data.user.created_at ? new Date(data.user.created_at) : null;
  const daysLearning = createdAt ? Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 86400000) + 1) : 1;

  const shareProfile = async () => {
    const text = `${name} sedang belajar bahasa Jepang di enonihongo • ${form.target_level} • ${points.toLocaleString("id-ID")} XP`;
    try {
      if (navigator.share) await navigator.share({ title: "Profil enonihongo", text, url: window.location.origin });
      else { await navigator.clipboard.writeText(`${text} — ${window.location.origin}`); toast.success("Profil berhasil disalin."); }
    } catch { /* pengguna membatalkan share */ }
  };

  return <AppShell title="Profil" description="Profil dan kemajuan belajar kamu.">
    <form onSubmit={submit} className="space-y-5" noValidate>
      <section className="relative flex min-h-[400px] w-full flex-col justify-end overflow-hidden rounded-[36px] bg-gradient-to-tr from-[#2f6b5d] via-[#3f7069] to-[#526985] p-3 shadow-2xl">
        <div className="relative rounded-[28px] bg-gradient-to-br from-[#1d5147] via-[#286157] to-[#38556f] p-5 pt-14 text-white shadow-lg">
          <div className="absolute -top-11 left-5 size-[88px] overflow-hidden rounded-full border-[3px] border-white/90 bg-white/15 shadow-lg">
            {avatar ? <img src={avatar} alt="Foto profil" className="size-full object-cover" /> : <div className="grid size-full place-items-center bg-white/10 text-3xl font-bold">{name.slice(0, 1).toUpperCase()}</div>}
          </div>
          <div className="absolute right-4 top-4 flex gap-1.5">
            <Button type="button" variant="ghost" size="icon" className="size-9 rounded-full text-white/75 hover:bg-white/10 hover:text-white" onClick={() => void shareProfile()} aria-label="Bagikan profil"><Share2 className="size-4" /></Button>
            <Button type="button" variant="ghost" size="icon" className="size-9 rounded-full text-white/75 hover:bg-white/10 hover:text-white" onClick={() => void navigate({ to: "/pengaturan" })} aria-label="Pengaturan"><Settings className="size-4" /></Button>
          </div>
          <div>
            <h2 className="pr-20 text-xl font-bold tracking-tight sm:text-2xl">{name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-200/20 px-3 py-1 text-xs font-semibold text-emerald-100">JLPT {form.target_level}</span>
              <span className="rounded-full bg-amber-200/20 px-3 py-1 text-xs font-semibold text-amber-100">{points.toLocaleString("id-ID")} XP</span>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/70">Terus belajar, satu langkah demi satu langkah.</p>
          <div className="mt-5 flex items-center gap-3">
            <Button type="button" className="flex-1 rounded-full bg-white/95 py-3 font-medium text-[#24564d] hover:bg-white" onClick={() => setEditingProfile((value) => !value)}><Camera className="mr-2 size-4" /> {editingProfile ? "Tutup edit" : "Edit profil"}</Button>
            <Button type="button" variant="outline" className="size-12 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => void signOut()} aria-label="Keluar"><LogOut className="size-4" /></Button>
          </div>
          <div className="mt-5 grid grid-cols-3 border-t border-white/15 pt-4">
            <div className="text-center"><p className="text-[10px] text-white/50">XP</p><p className="mt-1 text-sm font-bold">{points.toLocaleString("id-ID")}</p></div>
            <div className="border-x border-white/15 text-center"><p className="text-[10px] text-white/50">Materi</p><p className="mt-1 text-sm font-bold">{totalLearned}</p></div>
            <div className="text-center"><p className="text-[10px] text-white/50">Hari belajar</p><p className="mt-1 text-sm font-bold">{daysLearning}</p></div>
          </div>
        </div>
      </section>

      <Card className="rounded-3xl border-border/70 shadow-sm">
        <CardHeader className="pb-3"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Kemajuan</CardTitle><CardDescription>Perkembangan belajar kamu.</CardDescription></div><CalendarDays className="size-5 text-muted-foreground" /></div></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[["Kanji", learnedKanji], ["Kotoba", learnedVocab], ["Bunpō", learnedGrammar], ["Dokkai", learnedDokkai], ["Choukai", learnedChoukai]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border bg-muted/20 p-3 text-center"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 text-lg font-bold">{Number(value).toLocaleString("id-ID")}</p></div>)}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-2xl border p-3"><span className="grid size-9 place-items-center rounded-xl bg-orange-50 text-orange-500"><Flame className="size-4" /></span><div><p className="text-[10px] text-muted-foreground">Streak</p><p className="text-sm font-bold">{streak} hari</p></div></div>
            <div className="flex items-center gap-3 rounded-2xl border p-3"><span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600"><Trophy className="size-4" /></span><div><p className="text-[10px] text-muted-foreground">XP</p><p className="text-sm font-bold">{points.toLocaleString("id-ID")}</p></div></div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Hadiah</CardTitle><CardDescription>Poin belajar dapat digunakan untuk manfaat premium.</CardDescription></CardHeader><CardContent><div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600"><Gift className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Premium enonihongo</p><p className="text-[11px] text-muted-foreground">Sistem penukaran poin akan tersedia setelah fitur hadiah diaktifkan.</p></div><span className="shrink-0 rounded-full bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground">Segera</span></div></CardContent></Card>

      {editingProfile && <Card className="rounded-3xl border-primary/20 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Edit profil</CardTitle><CardDescription>Nama dan level JLPT hanya dapat diubah dari mode edit profil.</CardDescription></CardHeader>
        <CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="profil-nama">Nama</Label><Input id="profil-nama" value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} /></div><div className="space-y-2"><Label htmlFor="target_level">Target JLPT</Label><Select value={form.target_level} onValueChange={v => setForm({ ...form, target_level: v as Level })}><SelectTrigger id="target_level"><SelectValue /></SelectTrigger><SelectContent>{LEVELS.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="ui_language">Bahasa aplikasi</Label><Select value={form.ui_language} onValueChange={v => setForm({ ...form, ui_language: v as Language })}><SelectTrigger id="ui_language"><Globe2 className="mr-2 size-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="id">Bahasa Indonesia</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="ja">日本語</SelectItem></SelectContent></Select></div><Button type="submit" className="w-full rounded-xl" disabled={mutation.isPending}>{mutation.isPending ? "Menyimpan…" : "Simpan perubahan"}</Button></CardContent>
      </Card>}

      <Card className="rounded-3xl border-border/70 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Target & tampilan belajar</CardTitle><CardDescription>Pengaturan belajar tersimpan di akun kamu.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><NumberField label="Kanji / hari" value={form.daily_kanji_target} max={100} onChange={v => setForm({ ...form, daily_kanji_target: v })} /><NumberField label="Kotoba / hari" value={form.daily_vocab_target} max={200} onChange={v => setForm({ ...form, daily_vocab_target: v })} /><NumberField label="Bunpō / hari" value={form.daily_grammar_target} max={100} onChange={v => setForm({ ...form, daily_grammar_target: v })} /></div><div className="flex items-center justify-between rounded-2xl border p-3"><div><p className="text-sm font-medium">Tampilkan furigana</p><p className="text-xs text-muted-foreground">Gunakan furigana saat belajar.</p></div><Switch checked={form.furigana_enabled} onCheckedChange={v => setForm({ ...form, furigana_enabled: v })} /></div><div className="flex items-center justify-between rounded-2xl border p-3"><div><p className="text-sm font-medium">Pengingat harian</p><p className="text-xs text-muted-foreground">Aktifkan pengingat belajar.</p></div><Switch checked={form.daily_reminder} onCheckedChange={v => setForm({ ...form, daily_reminder: v })} /></div></CardContent></Card>
    </form>
  </AppShell>;
}

function NumberField({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (value: number) => void }) {
  return <div className="space-y-2"><Label>{label}</Label><Input type="number" min={1} max={max} value={value} onChange={e => onChange(Math.min(max, Math.max(1, Number(e.target.value) || 1)))} /></div>;
}
