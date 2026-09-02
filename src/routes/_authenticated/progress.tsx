import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Flame, Lightbulb, Target, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchMyProgress } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/progress")({ component: ProgressPage });

function ProgressPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["my-progress"], queryFn: fetchMyProgress });
  const learned = data?.progress ?? [];
  const attempts = data?.attempts ?? [];
  const stats = data?.stats;
  const weak = data?.weak ?? [];
  const byType = (type: string) => learned.filter(x => x.item_type === type).length;
  const kanji = byType("kanji"); const kotoba = byType("vocabulary"); const bunpo = byType("grammar");
  const totalLearned = kanji + kotoba + bunpo;
  const bestScore = attempts.length ? Math.max(...attempts.map(a => Number(a.score) || 0)) : 0;
  const suggestion = weak.length > 0 ? "Ulangi materi yang paling sering salah agar pemahamanmu lebih kuat." : totalLearned === 0 ? "Mulai dari target harian kecil dan pertahankan konsistensi setiap hari." : "Perkembanganmu sudah berjalan. Pertahankan ritme belajar dan naikkan target sedikit demi sedikit.";
  const tip = bestScore < 70 ? "Setelah mengerjakan soal, baca kembali alasan jawaban benar dan salah sebelum lanjut." : bestScore < 90 ? "Coba campurkan Kanji, Kotoba, dan Bunpō dalam satu sesi agar ingatan tidak bergantung pada satu jenis latihan." : "Pertahankan hasilmu dengan latihan singkat setiap hari dan ulangi materi yang lama secara berkala.";
  const max = Math.max(kanji, kotoba, bunpo, 1);
  return <AppShell title="Kemajuan" description="Lihat perkembangan belajar dan dapatkan saran untuk langkah berikutnya." backTo="/dashboard" backLabel="Beranda">
    {isLoading && <p className="text-sm text-muted-foreground">Memuat kemajuan…</p>}
    {error && <Card className="shadow-none"><CardContent className="py-6 text-sm text-destructive">Gagal memuat kemajuan. Coba lagi.</CardContent></Card>}
    {!isLoading && !error && <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2"><Metric icon={Trophy} label="XP" value={String(stats?.total_xp ?? 0)} /><Metric icon={Flame} label="Rangkaian" value={`${stats?.current_streak ?? 0} hari`} /><Metric icon={BarChart3} label="Latihan" value={String(attempts.length)} /></div>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">📊 Grafik pencapaian</CardTitle></CardHeader><CardContent><div className="flex h-40 items-end justify-around gap-4 border-b border-border/60 px-4 pb-1">{[["Kanji",kanji],["Kotoba",kotoba],["Bunpō",bunpo]].map(([label,value]) => <div key={String(label)} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[11px] font-semibold">{value}</span><div className="w-full max-w-12 rounded-t-xl bg-primary/70 transition-all" style={{ height: `${Math.max(8, (Number(value) / max) * 100)}%` }} /><span className="text-[10px] text-muted-foreground">{label}</span></div>)}</div><div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground"><span>Materi selesai</span><span>{totalLearned} materi</span></div></CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="size-4 text-amber-500" /> Saran untukmu</CardTitle></CardHeader><CardContent><p className="text-sm leading-6">{suggestion}</p></CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Target className="size-4 text-primary" /> Tips belajar</CardTitle></CardHeader><CardContent><p className="text-sm leading-6">{tip}</p></CardContent></Card>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Materi yang sudah dipelajari</CardTitle></CardHeader><CardContent className="grid grid-cols-3 gap-2"><Stat label="Kanji" value={kanji} /><Stat label="Kotoba" value={kotoba} /><Stat label="Bunpō" value={bunpo} /></CardContent></Card>
      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Riwayat latihan</CardTitle></CardHeader><CardContent className="space-y-2">{attempts.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada hasil latihan.</p> : attempts.slice(0, 8).map(a => <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="text-sm font-medium">{a.level ?? "—"} · {a.skill ?? "Latihan"}</p><p className="text-xs text-muted-foreground">{a.correct_count}/{a.total_questions} benar</p></div><Badge>{a.score}%</Badge></div>)}</CardContent></Card>
      <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Perlu diulang</CardTitle></CardHeader><CardContent>{weak.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada soal yang tercatat salah.</p> : <div className="space-y-2">{weak.slice(0, 8).map((w, i) => <div key={`${i}-${w.question?.prompt}`} className="rounded-xl border p-3 text-sm"><Badge variant="outline" className="mr-2">{w.question?.skill ?? "latihan"}</Badge>{w.question?.prompt}</div>)}</div>}</CardContent></Card>
    </div>}
  </AppShell>;
}
function Metric({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) { return <Card className="rounded-xl border-border/70 shadow-sm"><CardContent className="flex items-center gap-2 p-3"><div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="size-4" /></div><div><p className="text-[10px] text-muted-foreground">{label}</p><p className="text-sm font-semibold">{value}</p></div></CardContent></Card>; }
function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-muted/50 p-3 text-center"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>; }
