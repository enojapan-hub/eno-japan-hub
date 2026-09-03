import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Camera, Check, Flame, Gift, Globe2, Loader2, Share2, Trophy } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/profil")({ head: () => ({ meta: [{ title: "Profil — enonihongo" }, { name: "description", content: "Profil dan kemajuan belajar enonihongo." }] }), component: ProfilePage });

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
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["my-account-direct"], queryFn: readAccount, staleTime: 30_000 });
  const { data: progress } = useQuery({ queryKey: ["my-progress"], queryFn: fetchMyProgress, staleTime: 30_000 });
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const name = data.profile?.display_name ?? String(data.user.user_metadata?.["full_name"] ?? data.user.user_metadata?.["name"] ?? "");
    const language = data.profile?.ui_language === "en" || data.profile?.ui_language === "ja" ? data.profile.ui_language : "id";
    setForm({ display_name: name, target_level: (LEVELS as readonly string[]).includes(data.profile?.target_level ?? "") ? data.profile?.target_level as Level : "N5", ui_language: language, daily_kanji_target: data.settings?.daily_kanji_target ?? 5, daily_vocab_target: data.settings?.daily_vocab_target ?? 10, daily_grammar_target: data.settings?.daily_grammar_target ?? 5, furigana_enabled: data.settings?.furigana_enabled ?? true, daily_reminder: data.settings?.daily_reminder ?? false });
  }, [data]);

  const mutation = useMutation({ mutationFn: saveAccount, onSuccess: () => { toast.success("Pengaturan berhasil disimpan."); void qc.invalidateQueries({ queryKey: ["my-account-direct"] }); }, onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Pengaturan gagal disimpan.") });
  function submit(e: React.FormEvent) { e.preventDefault(); if (!form) return; if (form.display_name.trim().length < 2) { setFormError("Nama minimal 2 karakter."); return; } setFormError(null); mutation.mutate({ ...form, display_name: form.display_name.trim() }); }

  if (isLoading || !form) return <AppShell title="Profil"><div className="space-y-4"><Skeleton className="h-44 w-full rounded-3xl" /><Skeleton className="h-52 w-full rounded-3xl" /></div></AppShell>;
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
  const shareProfile = async () => { const text = `${name} sedang belajar bahasa Jepang di enonihongo • ${form.target_level} • ${points.toLocaleString("id-ID")} XP`; try { if (navigator.share) await navigator.share({ title: "Profil enonihongo", text, url: window.location.origin }); else { await navigator.clipboard.writeText(`${text} — ${window.location.origin}`); toast.success("Profil berhasil disalin."); } } catch { /* dibatalkan pengguna */ } };

  return <AppShell title="Profil" description="Profil, kemajuan, dan pengaturan belajar kamu.">
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Card className="overflow-hidden rounded-3xl border-border/70 bg-[#222222] text-white shadow-lg">
        <CardContent className="p-3 sm:p-4"><div className="overflow-hidden rounded-[22px] bg-black/20"><div className="flex items-center gap-4 p-4 sm:p-5"><div className="relative shrink-0"><div className="grid size-[78px] place-items-center overflow-hidden rounded-[22px] border border-white/10 bg-white/10 text-2xl font-bold text-white">{avatar ? <img src={avatar} alt="Avatar pengguna" className="size-full object-cover" /> : name.slice(0, 1).toUpperCase()}</div><span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border-2 border-[#222222] bg-emerald-500 text-white"><Camera className="size-3.5" /></span></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-lg font-bold">{name}</p><span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">{form.target_level}</span></div><p className="mt-1 truncate text-xs text-white/55">{data.user.email ?? "Akun enonihongo"}</p><p className="mt-2 text-[11px] leading-5 text-white/65">Terus belajar, satu langkah demi satu langkah.</p></div><Button type="button" variant="ghost" size="icon" className="size-9 shrink-0 rounded-full text-white/75 hover:bg-white/10 hover:text-white" onClick={() => void shareProfile()} aria-label="Bagikan profil"><Share2 className="size-4" /></Button></div><div className="grid grid-cols-3 border-t border-white/10"><div className="p-3 text-center"><p className="text-[10px] text-white/45">XP</p><p className="mt-1 text-sm font-bold">{points.toLocaleString("id-ID")}</p></div><div className="border-x border-white/10 p-3 text-center"><p className="text-[10px] text-white/45">Materi</p><p className="mt-1 text-sm font-bold">{totalLearned}</p></div><div className="p-3 text-center"><p className="text-[10px] text-white/45">Hari belajar</p><p className="mt-1 text-sm font-bold">{daysLearning}</p></div></div></div></CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70 shadow-sm"><CardHeader className="pb-3"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Kemajuan</CardTitle><CardDescription>Perkembangan belajar kamu.</CardDescription></div><CalendarDays className="size-5 text-muted-foreground" /></div></CardHeader><CardContent><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{[["Kanji", learnedKanji], ["Kotoba", learnedVocab], ["Bunpō", learnedGrammar], ["Dokkai", learnedDokkai], ["Choukai", learnedChoukai]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border bg-muted/20 p-3 text-center"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 text-lg font-bold">{Number(value).toLocaleString("id-ID")}</p></div>)}</div><div className="mt-4 grid grid-cols-2 gap-3"><div className="flex items-center gap-3 rounded-2xl border p-3"><span className="grid size-9 place-items-center rounded-xl bg-orange-50 text-orange-500"><Flame className="size-4" /></span><div><p className="text-[10px] text-muted-foreground">Streak</p><p className="text-sm font-bold">{streak} hari</p></div></div><div className="flex items-center gap-3 rounded-2xl border p-3"><span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600"><Trophy className="size-4" /></span><div><p className="text-[10px] text-muted-foreground">XP</p><p className="text-sm font-bold">{points.toLocaleString("id-ID")}</p></div></div></div></CardContent></Card>

      <Card className="rounded-3xl border-border/70 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Hadiah</CardTitle><CardDescription>Poin belajar dapat digunakan untuk manfaat premium.</CardDescription></CardHeader><CardContent><div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600"><Gift className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Premium enonihongo</p><p className="text-[11px] text-muted-foreground">Sistem penukaran poin akan tersedia setelah fitur hadiah diaktifkan.</p></div><span className="shrink-0 rounded-full bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground">Segera</span></div></CardContent></Card>

      <Card className="rounded-3xl border-border/70 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Informasi profil</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="display_name">Nama</Label><Input id="display_name" value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} /></div><div className="space-y-2"><Label htmlFor="target_level">Target JLPT</Label><Select value={form.target_level} onValueChange={v => setForm({ ...form, target_level: v as Level })}><SelectTrigger id="target_level"><SelectValue /></SelectTrigger><SelectContent>{LEVELS.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="ui_language">Bahasa aplikasi</Label><Select value={form.ui_language} onValueChange={v => setForm({ ...form, ui_language: v as Language })}><SelectTrigger id="ui_language"><Globe2 className="mr-2 size-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="id">Bahasa Indonesia</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="ja">日本語</SelectItem></SelectContent></Select></div></CardContent></Card>

      <Card className="rounded-3xl border-border/70 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Target harian</CardTitle><CardDescription>Atur target belajar yang realistis untuk setiap hari.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><NumberField id="daily_kanji_target" label="Kanji" value={form.daily_kanji_target} max={100} onChange={v => setForm({ ...form, daily_kanji_target: v })} /><NumberField id="daily_vocab_target" label="Kotoba" value={form.daily_vocab_target} max={200} onChange={v => setForm({ ...form, daily_vocab_target: v })} /><NumberField id="daily_grammar_target" label="Bunpō" value={form.daily_grammar_target} max={100} onChange={v => setForm({ ...form, daily_grammar_target: v })} /></div><ToggleRow id="furigana_enabled" label="Tampilkan furigana" description="Tampilkan cara baca kanji pada materi." checked={form.furigana_enabled} onChange={v => setForm({ ...form, furigana_enabled: v })} /><ToggleRow id="daily_reminder" label="Pengingat belajar" description="Aktifkan pengingat belajar harian." checked={form.daily_reminder} onChange={v => setForm({ ...form, daily_reminder: v })} /></CardContent></Card>

      {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
      <Button type="submit" className="h-11 w-full rounded-2xl" disabled={mutation.isPending}>{mutation.isPending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Check className="size-4" />}Simpan perubahan</Button>
    </form>
  </AppShell>;
}

function NumberField({ id, label, value, max, onChange }: { id: string; label: string; value: number; max: number; onChange: (v: number) => void }) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type="number" min={0} max={max} value={value} onChange={e => onChange(Math.min(max, Math.max(0, Number(e.target.value) || 0)))} /></div>; }
function ToggleRow({ id, label, description, checked, onChange }: { id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) { return <div className="flex items-start justify-between gap-4 rounded-2xl border p-3.5"><div><Label htmlFor={id}>{label}</Label><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><Switch id={id} checked={checked} onCheckedChange={onChange} /></div>; }
