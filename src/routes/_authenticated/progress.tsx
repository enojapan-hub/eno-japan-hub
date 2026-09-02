import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Flame, Trophy } from "lucide-react";
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
  return <AppShell title="Kemajuan" description="Lihat hasil nyata dari belajar dan latihanmu." backTo="/dashboard" backLabel="Beranda">
    {isLoading && <p className="text-sm text-muted-foreground">Memuat kemajuan…</p>}
    {error && <Card className="shadow-none"><CardContent className="py-6 text-sm text-destructive">Gagal memuat kemajuan. Coba lagi.</CardContent></Card>}
    {!isLoading && !error && <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3"><Metric icon={Trophy} label="XP" value={String(stats?.total_xp ?? 0)} /><Metric icon={Flame} label="Rangkaian belajar" value={`${stats?.current_streak ?? 0} hari`} /><Metric icon={BarChart3} label="Latihan soal" value={String(attempts.length)} /></div>
      <Card className="shadow-none"><CardHeader><CardTitle>Materi yang sudah dipelajari</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-3"><div className="rounded-xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Kanji</p><p className="mt-1 text-2xl font-semibold">{byType("kanji")}</p></div><div className="rounded-xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Kotoba</p><p className="mt-1 text-2xl font-semibold">{byType("vocabulary")}</p></div><div className="rounded-xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Bunpō</p><p className="mt-1 text-2xl font-semibold">{byType("grammar")}</p></div></CardContent></Card>
      <Card className="shadow-none"><CardHeader><CardTitle>Riwayat latihan</CardTitle></CardHeader><CardContent className="space-y-2">{attempts.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada hasil latihan.</p> : attempts.map(a => <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-medium">{a.level ?? "—"} · {a.skill ?? "Latihan"}</p><p className="text-xs text-muted-foreground">{a.correct_count}/{a.total_questions} benar</p></div><Badge>{a.score}%</Badge></div>)}</CardContent></Card>
      <Card className="shadow-none"><CardHeader><CardTitle>Perlu diulang</CardTitle></CardHeader><CardContent>{weak.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada soal yang tercatat salah.</p> : <div className="space-y-2">{weak.slice(0, 8).map((w, i) => <div key={`${i}-${w.question?.prompt}`} className="rounded-xl border p-3 text-sm"><Badge variant="outline" className="mr-2">{w.question?.skill ?? "latihan"}</Badge>{w.question?.prompt}</div>)}</div>}</CardContent></Card>
    </div>}
  </AppShell>;
}
function Metric({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) { return <Card className="shadow-none"><CardContent className="flex items-center gap-3 p-5"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="size-5" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold">{value}</p></div></CardContent></Card>; }
