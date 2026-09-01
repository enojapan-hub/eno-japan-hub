import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
type Level = (typeof LEVELS)[number];
type FormState = { display_name: string; target_level: Level; ui_language: "id"; daily_kanji_target: number; daily_vocab_target: number; daily_grammar_target: number; furigana_enabled: boolean; daily_reminder: boolean };
type Account = { user: { email?: string | null; user_metadata?: Record<string, unknown> | null }; profile: { display_name?: string | null; target_level?: Level | null } | null; settings: { daily_kanji_target?: number | null; daily_vocab_target?: number | null; daily_grammar_target?: number | null; furigana_enabled?: boolean | null; daily_reminder?: boolean | null } | null };

export const Route = createFileRoute("/_authenticated/profil")({ head: () => ({ meta: [{ title: "Profil — ENO JAPAN" }, { name: "description", content: "Kelola profil dan target belajar bahasa Jepang." }] }), component: ProfilePage });

async function readAccount(): Promise<Account> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Sesi masuk tidak ditemukan. Silakan masuk kembali.");
  const id = auth.user.id;
  const [{ data: profile, error: profileError }, { data: settings, error: settingsError }] = await Promise.all([
    supabase.from("profiles").select("display_name,target_level").eq("id", id).maybeSingle(),
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
  const { error: profileError } = await supabase.from("profiles").update({ display_name: values.display_name.trim(), target_level: values.target_level, ui_language: "id" }).eq("id", id);
  if (profileError) throw new Error(`Profil gagal disimpan: ${profileError.message}`);
  const { error: settingsError } = await supabase.from("user_settings").update({ daily_kanji_target: values.daily_kanji_target, daily_vocab_target: values.daily_vocab_target, daily_grammar_target: values.daily_grammar_target, furigana_enabled: values.furigana_enabled, daily_reminder: values.daily_reminder }).eq("user_id", id);
  if (settingsError) throw new Error(`Pengaturan gagal disimpan: ${settingsError.message}`);
}

function ProfilePage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["my-account-direct"], queryFn: readAccount, staleTime: 30_000 });
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  useEffect(() => { if (!data) return; const name = data.profile?.display_name ?? String(data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? ""); setForm({ display_name: name, target_level: data.profile?.target_level ?? "N5", ui_language: "id", daily_kanji_target: data.settings?.daily_kanji_target ?? 5, daily_vocab_target: data.settings?.daily_vocab_target ?? 10, daily_grammar_target: data.settings?.daily_grammar_target ?? 5, furigana_enabled: data.settings?.furigana_enabled ?? true, daily_reminder: data.settings?.daily_reminder ?? false }); }, [data]);
  const mutation = useMutation({ mutationFn: saveAccount, onSuccess: () => { toast.success("Pengaturan berhasil disimpan."); void qc.invalidateQueries({ queryKey: ["my-account-direct"] }); }, onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Pengaturan gagal disimpan.") });
  function submit(e: React.FormEvent) { e.preventDefault(); if (!form) return; if (form.display_name.trim().length < 2) { setFormError("Nama tampilan minimal 2 karakter."); return; } setFormError(null); mutation.mutate({ ...form, display_name: form.display_name.trim(), ui_language: "id" }); }
  if (isLoading || !form) return <AppShell title="Profil" description="Kelola akun dan target belajar kamu."><div className="space-y-4"><Skeleton className="h-48 w-full rounded-xl" /><Skeleton className="h-64 w-full rounded-xl" /></div></AppShell>;
  if (isError) return <AppShell title="Profil" description="Kelola akun dan target belajar kamu."><Card className="border-destructive/40"><CardHeader><CardTitle>Profil tidak dapat dimuat</CardTitle><CardDescription>{(error as Error).message}</CardDescription></CardHeader><CardContent><Button variant="outline" onClick={() => void refetch()}>Coba lagi</Button></CardContent></Card></AppShell>;
  return <AppShell title="Profil" description="Kelola akun dan target belajar kamu."><form onSubmit={submit} className="space-y-6" noValidate>
    <Card><CardHeader><CardTitle>Profil saya</CardTitle><CardDescription>{data.user.email ?? "Akun masuk"}</CardDescription></CardHeader><CardContent className="space-y-5"><div className="space-y-2"><Label htmlFor="display_name">Nama tampilan</Label><Input id="display_name" value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} /></div><div className="space-y-2"><Label htmlFor="target_level">Target JLPT</Label><Select value={form.target_level} onValueChange={v => setForm({ ...form, target_level: v as Level })}><SelectTrigger id="target_level"><SelectValue /></SelectTrigger><SelectContent>{LEVELS.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent></Select></div><div className="rounded-lg border bg-muted/30 p-4 text-sm">Bahasa aplikasi: <strong>Bahasa Indonesia</strong></div></CardContent></Card>
    <Card><CardHeader><CardTitle>Target harian</CardTitle><CardDescription>Tentukan jumlah materi yang ingin dipelajari setiap hari.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><NumberField id="daily_kanji_target" label="Kanji" value={form.daily_kanji_target} max={100} onChange={v => setForm({ ...form, daily_kanji_target: v })} /><NumberField id="daily_vocab_target" label="Kotoba" value={form.daily_vocab_target} max={200} onChange={v => setForm({ ...form, daily_vocab_target: v })} /><NumberField id="daily_grammar_target" label="Bunpō" value={form.daily_grammar_target} max={100} onChange={v => setForm({ ...form, daily_grammar_target: v })} /></div><ToggleRow id="furigana_enabled" label="Tampilkan furigana" description="Tampilkan bacaan hiragana di atas kanji." checked={form.furigana_enabled} onChange={v => setForm({ ...form, furigana_enabled: v })} /><ToggleRow id="daily_reminder" label="Pengingat belajar" description="Simpan pilihan pengingat belajar harian." checked={form.daily_reminder} onChange={v => setForm({ ...form, daily_reminder: v })} /></CardContent></Card>
    {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}<Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Loader2 aria-hidden className="size-4 animate-spin" />}Simpan perubahan</Button>
  </form></AppShell>;
}
function NumberField({ id, label, value, max, onChange }: { id: string; label: string; value: number; max: number; onChange: (v: number) => void }) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type="number" min={0} max={max} value={value} onChange={e => onChange(Math.min(max, Math.max(0, Number(e.target.value) || 0)))} /></div>; }
function ToggleRow({ id, label, description, checked, onChange }: { id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) { return <div className="flex items-start justify-between gap-4 rounded-lg border p-4"><div><Label htmlFor={id}>{label}</Label><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><Switch id={id} checked={checked} onCheckedChange={onChange} /></div>; }
