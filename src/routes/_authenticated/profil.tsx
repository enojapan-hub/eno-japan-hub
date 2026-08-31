import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getMyAccount, updateMyAccount } from "@/lib/profile.functions";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({ meta: [{ title: "Profil & Pengaturan — ENO JAPAN" }, { name: "description", content: "Atur profil dan target belajar bahasa Jepang." }] }),
  component: ProfilePage,
});
type FormState = { display_name: string; target_level: (typeof LEVELS)[number]; ui_language: "id"; daily_kanji_target: number; daily_vocab_target: number; daily_grammar_target: number; furigana_enabled: boolean; daily_reminder: boolean };
function ProfilePage() {
  const fetchAccount = useServerFn(getMyAccount); const saveAccount = useServerFn(updateMyAccount); const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["my-account"], queryFn: () => fetchAccount() });
  const [form, setForm] = useState<FormState | null>(null); const [formError, setFormError] = useState<string | null>(null);
  useEffect(() => { if (!data) return; setForm({ display_name: data.profile?.display_name ?? "", target_level: (data.profile?.target_level as FormState["target_level"]) ?? "N5", ui_language: "id", daily_kanji_target: data.settings?.daily_kanji_target ?? 5, daily_vocab_target: data.settings?.daily_vocab_target ?? 10, daily_grammar_target: data.settings?.daily_grammar_target ?? 5, furigana_enabled: data.settings?.furigana_enabled ?? true, daily_reminder: data.settings?.daily_reminder ?? false }); }, [data]);
  const mutation = useMutation({ mutationFn: (values: FormState) => saveAccount({ data: values }), onSuccess: () => { toast.success("Pengaturan berhasil disimpan."); void qc.invalidateQueries({ queryKey: ["my-account"] }); }, onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal menyimpan pengaturan.") });
  function onSubmit(e: React.FormEvent) { e.preventDefault(); if (!form) return; if (form.display_name.trim().length < 2) { setFormError("Nama tampilan minimal 2 karakter."); return; } setFormError(null); mutation.mutate({ ...form, display_name: form.display_name.trim(), ui_language: "id" }); }
  return <AppShell title="Profil & Pengaturan" description="Kelola profil, target belajar, dan preferensi kamu.">
    {isLoading || !form ? isError ? <Card className="border-destructive/40"><CardHeader><CardTitle>Profil tidak dapat dimuat</CardTitle><CardDescription>{(error as Error).message}</CardDescription></CardHeader><CardContent><Button variant="outline" onClick={() => refetch()}>Coba lagi</Button></CardContent></Card> : <div className="space-y-4"><Skeleton className="h-48 w-full rounded-xl" /><Skeleton className="h-64 w-full rounded-xl" /></div> : <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Card><CardHeader><CardTitle className="text-base">Profil saya</CardTitle><CardDescription>Informasi akun dan level tujuan belajar.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="display_name">Nama tampilan</Label><Input id="display_name" value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="target_level">Target JLPT</Label><Select value={form.target_level} onValueChange={v => setForm({ ...form, target_level: v as FormState["target_level"] })}><SelectTrigger id="target_level"><SelectValue /></SelectTrigger><SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Bahasa aplikasi</Label><div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm">Bahasa Indonesia</div></div></div></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Target harian</CardTitle><CardDescription>Atur jumlah materi yang ingin kamu pelajari setiap hari.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-3"><NumberField id="daily_kanji_target" label="Kanji" value={form.daily_kanji_target} max={100} onChange={v => setForm({ ...form, daily_kanji_target: v })} /><NumberField id="daily_vocab_target" label="Kotoba" value={form.daily_vocab_target} max={200} onChange={v => setForm({ ...form, daily_vocab_target: v })} /><NumberField id="daily_grammar_target" label="Bunpō" value={form.daily_grammar_target} max={100} onChange={v => setForm({ ...form, daily_grammar_target: v })} /></div><ToggleRow id="furigana_enabled" label="Tampilkan furigana" description="Membantu membaca kanji dengan hiragana." checked={form.furigana_enabled} onChange={v => setForm({ ...form, furigana_enabled: v })} /><ToggleRow id="daily_reminder" label="Pengingat belajar" description="Simpan preferensi pengingat harian." checked={form.daily_reminder} onChange={v => setForm({ ...form, daily_reminder: v })} /></CardContent></Card>
      {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}<Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Loader2 aria-hidden className="size-4 animate-spin" />}Simpan perubahan</Button>
    </form>}
  </AppShell>;
}
function NumberField({ id, label, value, max, onChange }: { id: string; label: string; value: number; max: number; onChange: (v: number) => void }) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type="number" min={0} max={max} value={value} onChange={e => onChange(Math.min(max, Math.max(0, Number(e.target.value) || 0)))} /></div>; }
function ToggleRow({ id, label, description, checked, onChange }: { id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) { return <div className="flex items-start justify-between gap-4 rounded-lg border p-4"><div><Label htmlFor={id}>{label}</Label><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><Switch id={id} checked={checked} onCheckedChange={onChange} /></div>; }
