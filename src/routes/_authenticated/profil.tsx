import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Camera, ChevronDown, Flame, Gift, Globe2, LogOut, Settings, Share2, Trophy } from "lucide-react";
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
type Account = { user: { email?: string | null; created_at?: string; user_metadata?: Record<string, unknown> | null }; profile: { display_name?: string | null; target_level?: string | null; ui_language?: string | null; avatar_url?: string | null } | null; settings: { daily_kanji_target?: number | null; daily_vocab_target?: number | null; daily_grammar_target?: number | null; furigana_enabled?: boolean | null; daily_reminder?: boolean | null } | null };

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({ meta: [{ title: "Profil — enonihongo" }, { name: "description", content: "Profil dan kemajuan belajar enonihongo." }] }),
  component: ProfilePage,
});

async function readAccount(): Promise<Account> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Sesi masuk tidak ditemukan. Silakan masuk kembali.");
  const id = auth.user.id;
  const [{ data: profile, error: profileError }, { data: settings, error: settingsError }] = await Promise.all([
    supabase.from("profiles").select("display_name,target_level,ui_language,avatar_url").eq("id", id).maybeSingle(),
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

  const profileValues = {
    display_name: values.display_name.trim(),
    target_level: values.target_level,
    ui_language: values.ui_language,
  };

  const { data: existingProfile, error: profileUpdateError } = await supabase
    .from("profiles")
    .update(profileValues)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (profileUpdateError) {
    throw new Error(`Profil gagal disimpan: ${profileUpdateError.message}`);
  }

  if (!existingProfile) {
    const { error: profileInsertError } = await supabase.from("profiles").insert({
      id,
      ...profileValues,
    });
    if (profileInsertError) throw new Error(`Profil gagal dibuat: ${profileInsertError.message}`);
  }

  const settingsValues = {
    daily_kanji_target: values.daily_kanji_target,
    daily_vocab_target: values.daily_vocab_target,
    daily_grammar_target: values.daily_grammar_target,
    furigana_enabled: values.furigana_enabled,
    daily_reminder: values.daily_reminder,
  };

  const { data: existingSettings, error: settingsUpdateError } = await supabase
    .from("user_settings")
    .update(settingsValues)
    .eq("user_id", id)
    .select("user_id")
    .maybeSingle();

  if (settingsUpdateError) {
    throw new Error(`Pengaturan gagal disimpan: ${settingsUpdateError.message}`);
  }

  if (!existingSettings) {
    const { error: settingsInsertError } = await supabase.from("user_settings").insert({
      user_id: id,
      ...settingsValues,
    });
    if (settingsInsertError) throw new Error(`Pengaturan gagal dibuat: ${settingsInsertError.message}`);
  }
}

function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["my-account-direct"], queryFn: readAccount, staleTime: 0 });
  const { data: progress } = useQuery({ queryKey: ["my-progress"], queryFn: fetchMyProgress, staleTime: 30_000 });
  const [form, setForm] = useState<FormState | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    if (!data) return;
    const metadata = data.user.user_metadata ?? {};
    const name = data.profile?.display_name ?? String(metadata["full_name"] ?? metadata["name"] ?? "");
    const rawLevel = data.profile?.target_level ?? String(metadata["target_level"] ?? metadata["jlpt_level"] ?? "");
    const targetLevel = (LEVELS as readonly string[]).includes(rawLevel) ? rawLevel as Level : "N5";
    const language = data.profile?.ui_language === "en" || data.profile?.ui_language === "ja" ? data.profile.ui_language : "id";
    setForm({
      display_name: name,
      target_level: targetLevel,
      ui_language: language,
      daily_kanji_target: data.settings?.daily_kanji_target ?? 5,
      daily_vocab_target: data.settings?.daily_vocab_target ?? 10,
      daily_grammar_target: data.settings?.daily_grammar_target ?? 5,
      furigana_enabled: data.settings?.furigana_enabled ?? true,
      daily_reminder: data.settings?.daily_reminder ?? false,
    });
  }, [data]);

  const mutation = useMutation({
    mutationFn: saveAccount,
    onSuccess: async () => {
      setEditingProfile(false);
      await qc.invalidateQueries({ queryKey: ["my-account-direct"] });
      await refetch();
      toast.success("Profil berhasil disimpan.");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Profil gagal disimpan."),
  });

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) { toast.error(`Gagal keluar: ${signOutError.message}`); return; }
    await qc.clear();
    await navigate({ to: "/login" });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!form || mutation.isPending) return;
    if (form.display_name.trim().length < 2) { toast.error("Nama minimal 2 karakter."); return; }
    mutation.mutate({ ...form, display_name: form.display_name.trim() });
  }

  if (isLoading || !form) return <AppShell title="Profil"><div className="mx-auto w-full max-w-md space-y-4"><Skeleton className="h-[560px] w-full rounded-[30px]" /><Skeleton className="h-52 w-full rounded-3xl" /></div></AppShell>;
  if (isError) return <AppShell title="Profil"><Card><CardHeader><CardTitle>Profil tidak dapat dimuat</CardTitle><CardDescription>{(error as Error).message}</CardDescription></CardHeader><CardContent><Button variant="outline" onClick={() => void refetch()}>Coba lagi</Button></CardContent></Card></AppShell>;

  const metadata = data.user.user_metadata ?? {};
  const avatar = String(data.profile?.avatar_url ?? metadata["avatar_url"] ?? metadata["picture"] ?? "");
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
    <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-5" noValidate>
      <section className="relative min-h-[570px] w-full overflow-hidden rounded-[30px] border border-border/70 bg-[#123b34] shadow-xl sm:min-h-[620px]">
        <div className="absolute inset-x-0 top-0 h-[56%] overflow-hidden bg-gradient-to-br from-[#0f4c42] via-[#176b5c] to-[#2f5b91]">
          {avatar && <img src={avatar} alt="Foto profil" className="absolute inset-0 size-full object-cover opacity-75 mix-blend-screen" />}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#123b34]/75" />
        </div>
        <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-4 text-white">
          <Button type="button" variant="ghost" size="icon" className="size-9 rounded-full bg-black/10 text-white hover:bg-white/10" onClick={() => void navigate({ to: "/" })} aria-label="Kembali"><ChevronDown className="size-5 rotate-90" /></Button>
          <span className="text-sm font-semibold tracking-wide">Profile</span>
          <Button type="button" variant="ghost" size="icon" className="size-9 rounded-full bg-black/10 text-white hover:bg-white/10" onClick={() => void navigate({ to: "/pengaturan" })} aria-label="Pengaturan"><Settings className="size-4" /></Button>
        </header>
        <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-[30px] bg-background px-5 pb-5 pt-14 text-foreground shadow-[0_-14px_35px_rgba(0,0,0,0.14)] sm:px-7 sm:pt-16">
          <div className="absolute -top-10 left-5 size-22 overflow-hidden rounded-full border-4 border-background bg-muted shadow-lg sm:left-7 sm:size-24">
            {avatar ? <img src={avatar} alt="Foto profil" className="size-full object-cover" /> : <div className="grid size-full place-items-center bg-primary/10 text-3xl font-bold text-primary">{name.slice(0, 1).toUpperCase()}</div>}
          </div>
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-2xl font-bold tracking-tight">{name}</h2><p className="mt-1 text-xs text-muted-foreground">Pelajar Bahasa Jepang · Target JLPT {form.target_level}</p></div><span className="shrink-0 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">JLPT {form.target_level}</span></div>
          <div className="mt-5 grid grid-cols-3 divide-x rounded-2xl border bg-muted/20 py-3"><div className="text-center"><p className="text-[10px] text-muted-foreground">XP</p><p className="mt-1 text-sm font-bold">{points.toLocaleString("id-ID")}</p></div><div className="text-center"><p className="text-[10px] text-muted-foreground">Materi</p><p className="mt-1 text-sm font-bold">{totalLearned.toLocaleString("id-ID")}</p></div><div className="text-center"><p className="text-[10px] text-muted-foreground">Streak</p><p className="mt-1 text-sm font-bold">{streak} hari</p></div></div>
          <Button type="button" className="mt-4 h-10 w-full rounded-xl font-semibold" onClick={() => setEditingProfile(value => !value)}><Camera className="mr-2 size-4" />{editingProfile ? "Tutup edit" : "Edit profil"}</Button>
          <div className="mt-3 flex items-center justify-center gap-2"><Button type="button" variant="outline" size="icon" className="size-9 rounded-full" onClick={() => void shareProfile()} aria-label="Bagikan profil"><Share2 className="size-4" /></Button><Button type="button" variant="outline" size="icon" className="size-9 rounded-full" onClick={() => void navigate({ to: "/pengaturan" })} aria-label="Pengaturan"><Settings className="size-4" /></Button><Button type="button" variant="outline" size="icon" className="size-9 rounded-full" onClick={() => void signOut()} aria-label="Keluar"><LogOut className="size-4" /></Button></div>
        </div>
      </section>
      {editingProfile && <Card className="rounded-3xl border-primary/20 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Edit profil</CardTitle><CardDescription>Nama dan level JLPT disimpan ke akun kamu.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="profil-nama">Nama</Label><Input id="profil-nama" value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} /></div><div className="space-y-2"><Label htmlFor="target_level">Target JLPT</Label><Select value={form.target_level} onValueChange={v => setForm({ ...form, target_level: v as Level })}><SelectTrigger id="target_level"><SelectValue placeholder="Pilih level" /></SelectTrigger><SelectContent>{LEVELS.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="ui_language">Bahasa aplikasi</Label><Select value={form.ui_language} onValueChange={v => setForm({ ...form, ui_language: v as Language })}><SelectTrigger id="ui_language"><Globe2 className="mr-2 size-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="id">Bahasa Indonesia</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="ja">日本語</SelectItem></SelectContent></Select></div><div className="flex gap-2"><Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => { if (data) { const raw = data.profile?.target_level ?? String((data.user.user_metadata ?? {})["target_level"] ?? ""); setForm({ ...form, target_level: (LEVELS as readonly string[]).includes(raw) ? raw as Level : "N5" }); } setEditingProfile(false); }}>Batal</Button><Button type="submit" className="flex-1 rounded-xl" disabled={mutation.isPending}>{mutation.isPending ? "Menyimpan…" : "Simpan"}</Button></div></CardContent></Card>}
      <Card className="rounded-3xl border-border/70 shadow-sm"><CardHeader className="pb-3"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Kemajuan belajar</CardTitle><CardDescription>Ringkasan materi yang sudah kamu pelajari.</CardDescription></div><CalendarDays className="size-5 text-muted-foreground" /></div></CardHeader><CardContent><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">{[["Kanji", learnedKanji], ["Kotoba", learnedVocab], ["Bunpō", learnedGrammar], ["Dokkai", learnedDokkai], ["Choukai", learnedChoukai]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border bg-muted/20 p-3 text-center"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 text-base font-bold">{Number(value).toLocaleString("id-ID")}</p></div>)}</div><div className="mt-3 grid grid-cols-2 gap-2.5"><div className="flex items-center gap-3 rounded-2xl border p-3"><span className="grid size-9 place-items-center rounded-xl bg-orange-50 text-orange-500"><Flame className="size-4" /></span><div><p className="text-[10px] text-muted-foreground">Streak</p><p className="text-sm font-bold">{streak} hari</p></div></div><div className="flex items-center gap-3 rounded-2xl border p-3"><span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600"><Trophy className="size-4" /></span><div><p className="text-[10px] text-muted-foreground">Hari belajar</p><p className="text-sm font-bold">{daysLearning} hari</p></div></div></div></CardContent></Card>
      <Card className="rounded-3xl border-border/70 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Hadiah</CardTitle><CardDescription>Poin belajar dapat digunakan untuk manfaat premium.</CardDescription></CardHeader><CardContent><div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600"><Gift className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Premium enonihongo</p><p className="text-[11px] text-muted-foreground">Sistem penukaran poin akan tersedia setelah fitur hadiah diaktifkan.</p></div><span className="shrink-0 rounded-full bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground">Segera</span></div></CardContent></Card>
      <Card className="rounded-3xl border-border/70 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Target & tampilan belajar</CardTitle><CardDescription>Pengaturan belajar tersimpan di akun kamu.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><NumberField label="Kanji / hari" value={form.daily_kanji_target} max={100} onChange={v => setForm({ ...form, daily_kanji_target: v })} /><NumberField label="Kotoba / hari" value={form.daily_vocab_target} max={200} onChange={v => setForm({ ...form, daily_vocab_target: v })} /><NumberField label="Bunpō / hari" value={form.daily_grammar_target} max={100} onChange={v => setForm({ ...form, daily_grammar_target: v })} /></div><div className="flex items-center justify-between rounded-2xl border p-3"><div><p className="text-sm font-medium">Tampilkan furigana</p><p className="text-xs text-muted-foreground">Gunakan furigana saat belajar.</p></div><Switch checked={form.furigana_enabled} onCheckedChange={v => setForm({ ...form, furigana_enabled: v })} /></div><div className="flex items-center justify-between rounded-2xl border p-3"><div><p className="text-sm font-medium">Pengingat harian</p><p className="text-xs text-muted-foreground">Aktifkan pengingat belajar.</p></div><Switch checked={form.daily_reminder} onCheckedChange={v => setForm({ ...form, daily_reminder: v })} /></div><Button type="submit" variant="outline" className="w-full rounded-xl" disabled={mutation.isPending}>{mutation.isPending ? "Menyimpan…" : "Simpan target"}</Button></CardContent></Card>
    </form>
  </AppShell>;
}

function NumberField({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (value: number) => void }) {
  return <div className="space-y-2"><Label>{label}</Label><Input type="number" min={1} max={max} value={value} onChange={e => onChange(Math.min(max, Math.max(1, Number(e.target.value) || 1)))} /></div>;
}
