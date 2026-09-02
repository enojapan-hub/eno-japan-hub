import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Check, Globe2, Gift, Loader2, Share2, Target, Trophy } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/profil")({ head: () => ({ meta: [{ title: "Profil — enonihongo" }, { name: "description", content: "Kelola profil, target belajar, dan bahasa aplikasi." }] }), component: ProfilePage });

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
    setForm({ display_name: name, target_level: (LEVELS as readonly string[]).includes(data.profile?.target_level ?? "") ? (data.profile?.target_level as Level) : "N5", ui_language: language, daily_kanji_target: data.settings?.daily_kanji_target ?? 5, daily_vocab_target: data.settings?.daily_vocab_target ?? 10, daily_grammar_target: data.settings?.daily_grammar_target ?? 5, furigana_enabled: data.settings?.furigana_enabled ?? true, daily_reminder: data.settings?.daily_reminder ?? false });
  }, [data]);

  const mutation = useMutation({ mutationFn: saveAccount, onSuccess: () => { toast.success("Pengaturan berhasil disimpan."); void qc.invalidateQueries({ queryKey: ["my-account-direct"] }); }, onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Pengaturan gagal disimpan.") });
  function submit(e: React.FormEvent) { e.preventDefault(); if (!form) return; if (form.display_name.trim().length < 2) { setFormError("Nama minimal 2 karakter."); return; } setFormError(null); mutation.mutate({ ...form, display_name: form.display_name.trim() }); }

  if (isLoading || !form) return <AppShell title="Profil"><div className="space-y-4"><Skeleton className="h-48 w-full rounded-2xl" /><Skeleton className="h-64 w-full rounded-2xl" /></div></AppShell>;
  if (isError) return <AppShell title="Profil"><Card><CardHeader><CardTitle>Profil tidak dapat dimuat</CardTitle><CardDescription>{(error as Error).message}</CardDescription></CardHeader><CardContent><Button variant="outline" onClick={() => void refetch()}>Coba lagi</Button></CardContent></Card></AppShell>;

  const metadata = data.user.user_metadata ?? {};
  const avatar = String(metadata["avatar_url"] ?? metadata["picture"] ?? "");
  const name = form.display_name || "Pengguna enonihongo";
  const points = progress?.stats?.total_xp ?? 0;
  const createdAt = data.user.created_at ? new Date(data.user.created_at) : null;
  const daysLearning = createdAt ? Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 86400000) + 1) : 1;
  const stats = progress?.stats as Record<string, unknown> | undefined;
  const learnedKanji = Number(stats?.learned_kanji ?? stats?.kanji ?? 0);
  const learnedVocab = Number(stats?.learned_vocab ?? stats?.vocabulary ?? 0);
  const learnedGrammar = Number(stats?.learned_grammar ?? stats?.grammar ?? 0);
  const graphMax = Math.max(learnedKanji, learnedVocab, learnedGrammar, 1);
  const shareProfile = async () => {
    const text = `${name} sedang belajar bahasa Jepang di enonihongo • Level ${form.target_level} • ${points.toLocaleString("id-ID")} poin`;
    try { if (navigator.share) await navigator.share({ title: "Profil enonihongo", text, url: window.location.origin }); else { await navigator.clipboard.writeText(`${text} — ${window.location.origin}`); toast.success("Profil berhasil disalin."); } } catch { /* dibatalkan pengguna */ }
  };

  return <AppShell title="Profil" description="Kelola akun dan target belajar kamu.">
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0"><div className="grid size-[76px] place-items-center overflow-hidden rounded-full border-4 border-background bg-primary/10 text-2xl font-bold text-primary shadow-sm">{avatar ? <img src={avatar} alt="Avatar pengguna" className="size-full object-cover" /> : name.slice(0, 1).toUpperCase()}</div><span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground"><Camera className="size-3.5" /></span></div>
            <div className="min-w-0 flex-1"><p className="truncate text-base font-semibold">{name}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{data.user.email ?? "Akun Google"}</p><div className="mt-2.5 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"><Target className="size-3.5" /> {form.target_level}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700"><Trophy className="size-3.5" /> {points.toLocaleString("id-ID")} poin</span><span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">{daysLearning} hari belajar</span></div></div>
            <Button type="button" variant="outline" size="icon" className="size-9 shrink-0 rounded-full" onClick={() => void shareProfile()} aria-label="Bagikan profil"><Share2 className="size-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Ringkasan belajar</CardTitle><CardDescription>Perkembangan materi yang sudah kamu pelajari.</CardDescription></CardHeader><CardContent><div className="grid grid-cols-3 gap-3 text-center"><div><p className="text-[11px] text-muted-foreground">Kanji</p><p className="mt-1 text-lg font-bold">{learnedKanji}</p></div><div><p className="text-[11px] text-muted-foreground">Kotoba</p><p className="mt-1 text-lg font-bold">{learnedVocab}</p></div><div><p className="text-[11px] text-muted-foreground">Bunpō</p><p className="mt-1 text-lg font-bold">{learnedGrammar}</p></div></div><div className="mt-5 flex h-28 items-end gap-5 border-b border-border/60 px-3">{[["Kanji", learnedKanji], ["Kotoba", learnedVocab], ["Bunpō", learnedGrammar]].map(([label, value]) => <div key={String(label)} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"><div className="w-full max-w-10 rounded-t-lg bg-primary/80" style={{ height: `${Math.max(8, (Number(value) / graphMax) * 78)}px` }} /><span className="text-[10px] text-muted-foreground">{label}</span></div>)}</div></CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Tukar poin</CardTitle><CardDescription>Gunakan poin belajarmu untuk mendapatkan manfaat premium.</CardDescription></CardHeader><CardContent><div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600"><Gift className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Premium enonihongo</p><p className="text-[11px] text-muted-foreground">Penukaran poin akan tersedia setelah sistem hadiah premium diaktifkan.</p></div><span className="shrink-0 rounded-full bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground">Segera</span></div></CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Informasi profil</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="display_name">Nama</Label><Input id="display_name" value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} /></div><div className="space-y-2"><Label htmlFor="target_level">Level</Label><Select value={form.target_level} onValueChange={v => setForm({ ...form, target_level: v as Level })}><SelectTrigger id="target_level"><SelectValue /></SelectTrigger><SelectContent>{LEVELS.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="ui_language">Bahasa aplikasi</Label><Select value={form.ui_language} onValueChange={v => setForm({ ...form, ui_language: v as Language })}><SelectTrigger id="ui_language"><Globe2 className="mr-2 size-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="id">Bahasa Indonesia</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="ja">日本語</SelectItem></SelectContent></Select></div></CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Target harian</CardTitle><CardDescription>Atur jumlah materi yang ingin kamu selesaikan setiap hari.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><NumberField id="daily_kanji_target" label="Kanji" value={form.daily_kanji_target} max={100} onChange={v => setForm({ ...form, daily_kanji_target: v })} /><NumberField id="daily_vocab_target" label="Kotoba" value={form.daily_vocab_target} max={200} onChange={v => setForm({ ...form, daily_vocab_target: v })} /><NumberField id="daily_grammar_target" label="Bunpō" value={form.daily_grammar_target} max={100} onChange={v => setForm({ ...form, daily_grammar_target: v })} /></div><ToggleRow id="furigana_enabled" label="Tampilkan furigana" description="Tampilkan cara baca kanji." checked={form.furigana_enabled} onChange={v => setForm({ ...form, furigana_enabled: v })} /><ToggleRow id="daily_reminder" label="Pengingat belajar" description="Aktifkan pengingat belajar harian." checked={form.daily_reminder} onChange={v => setForm({ ...form, daily_reminder: v })} /></CardContent></Card>

      {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
      <Button type="submit" className="w-full rounded-xl" disabled={mutation.isPending}>{mutation.isPending && <Loader2 aria-hidden className="size-4 animate-spin" />}<Check className="size-4" />Simpan perubahan</Button>
    </form>
  </AppShell>;
}

function NumberField({ id, label, value, max, onChange }: { id: string; label: string; value: number; max: number; onChange: (v: number) => void }) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type="number" min={0} max={max} value={value} onChange={e => onChange(Math.min(max, Math.max(0, Number(e.target.value) || 0)))} /></div>; }
function ToggleRow({ id, label, description, checked, onChange }: { id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) { return <div className="flex items-start justify-between gap-4 rounded-xl border p-3.5"><div><Label htmlFor={id}>{label}</Label><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><Switch id={id} checked={checked} onCheckedChange={onChange} /></div>; }
