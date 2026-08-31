import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  const byType = (type: string) => learned.filter((x) => x.item_type === type).length;

  return <AppShell title="Progress" description="Pantau perkembangan belajar dan hasil latihanmu." backTo="/dashboard" backLabel="Beranda">
    {isLoading && <p className="text-sm text-muted-foreground">Memuat progress…</p>}
    {error && <p className="text-sm text-destructive">Gagal memuat progress.</p>}
    {!isLoading && !error && <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm">XP</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats?.total_xp ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Streak</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats?.current_streak ?? 0} hari</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Kanji</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{byType("kanji")}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Kotoba</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{byType("vocabulary")}</CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Riwayat Quiz</CardTitle></CardHeader><CardContent className="space-y-3">
        {attempts.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada hasil quiz.</p> : attempts.map((a) => <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><div><div className="font-medium">{a.level ?? "—"} · {a.skill ?? "Quiz"}</div><div className="text-xs text-muted-foreground">{a.correct_count}/{a.total_questions} benar</div></div><Badge>{a.score}%</Badge></div>)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Materi yang sudah dipelajari</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-3"><div className="rounded-lg border p-3">Kanji: <b>{byType("kanji")}</b></div><div className="rounded-lg border p-3">Kotoba: <b>{byType("vocabulary")}</b></div><div className="rounded-lg border p-3">Bunpō: <b>{byType("grammar")}</b></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Yang perlu diulang</CardTitle></CardHeader><CardContent>{weak.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada soal lemah. Terus latihan.</p> : <div className="space-y-2">{weak.slice(0, 8).map((w, i) => <div key={`${i}-${w.question?.prompt}`} className="rounded-lg border p-3 text-sm"><Badge variant="outline" className="mr-2">{w.question?.skill ?? "quiz"}</Badge>{w.question?.prompt}</div>)}</div>}</CardContent></Card>
    </div>}
  </AppShell>;
}
