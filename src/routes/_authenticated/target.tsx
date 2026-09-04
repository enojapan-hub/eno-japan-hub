import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpenCheck,
  Brain,
  CheckCircle2,
  Clock3,
  Flame,
  Languages,
  ListChecks,
  RefreshCcw,
  Sparkles,
  Target,
  Type,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { adaptiveTaskLabels, fetchAdaptivePlan, type AdaptiveTaskType } from "@/lib/adaptive-plan";

export const Route = createFileRoute("/_authenticated/target")({
  head: () => ({ meta: [{ title: "Target — ENO NIHONGO" }] }),
  component: TargetPage,
});

const taskLinks: Partial<Record<AdaptiveTaskType, string>> = {
  new_kanji: "/kanji",
  new_vocabulary: "/kotoba",
  new_grammar: "/bunpo",
  review: "/belajar",
  quiz: "/quiz",
  reading: "/dokkai",
  listening: "/listening",
};

const quizzes = [
  { label: "Quiz Kanji", icon: Type, to: "/quiz" },
  { label: "Quiz Kosakata", icon: Languages, to: "/quiz" },
  { label: "Quiz Bunpou", icon: BookOpenCheck, to: "/quiz" },
  { label: "Mixed Quiz", icon: ListChecks, to: "/quiz" },
  { label: "Review Kesalahan", icon: RefreshCcw, to: "/quiz" },
] as const;

const missions = [
  { label: "Belajar 30 menit", xp: 50, points: 10 },
  { label: "Selesaikan 1 latihan Kanji", xp: 20, points: 5 },
  { label: "Pelajari 10 kosakata", xp: 30, points: 5 },
  { label: "Selesaikan semua target", xp: 100, points: 25 },
];

function TargetPage() {
  const adaptive = useQuery({ queryKey: ["adaptive-plan"], queryFn: fetchAdaptivePlan, staleTime: 30_000 });
  const completed = adaptive.data?.completed ?? 0;
  const target = adaptive.data?.target ?? 0;
  const percent = target ? Math.min(100, (completed / target) * 100) : 0;

  return (
    <AppShell compact title="Target">
      <div className="mx-auto max-w-3xl space-y-4">
        <section>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Adaptive Study Planner</p>
              <h1 className="mt-1 text-[20px] font-bold tracking-tight">Target hari ini</h1>
              <p className="mt-1 text-[11px] text-muted-foreground">Rencana otomatis berdasarkan progres, review, dan target JLPT.</p>
              {adaptive.data?.active && <p className="mt-1 text-[10px] font-medium text-primary">{adaptive.data.targetLevel} · {adaptive.data.daysLeft ?? 0} hari menuju target</p>}
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Target className="size-5" /></span>
          </div>

          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-xl bg-muted/45 p-2"><Flame className="mx-auto size-4 text-orange-500" /><p className="mt-1 text-[12px] font-bold">—</p><p className="text-[9px] text-muted-foreground">Streak</p></div>
                <div className="rounded-xl bg-muted/45 p-2"><Zap className="mx-auto size-4 text-amber-500" /><p className="mt-1 text-[12px] font-bold">—</p><p className="text-[9px] text-muted-foreground">XP hari ini</p></div>
                <div className="rounded-xl bg-muted/45 p-2"><Clock3 className="mx-auto size-4 text-sky-500" /><p className="mt-1 text-[12px] font-bold">—</p><p className="text-[9px] text-muted-foreground">Waktu</p></div>
                <div className="rounded-xl bg-primary/10 p-2"><CheckCircle2 className="mx-auto size-4 text-primary" /><p className="mt-1 text-[12px] font-bold">{Math.round(percent)}%</p><p className="text-[9px] text-muted-foreground">Selesai</p></div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} /></div>
              <p className="mt-2 text-[10px] text-muted-foreground">{target ? `${completed} dari ${target} aktivitas selesai` : "Planner sedang menyiapkan targetmu."}</p>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between px-1"><h2 className="text-[13px] font-semibold">Rencana Belajar Hari Ini</h2><Sparkles className="size-4 text-primary" /></div>
          <div className="space-y-2">
            {adaptive.data?.tasks?.length ? adaptive.data.tasks.map((task) => {
              const done = Math.min(task.completed_count, task.target_count);
              const taskPercent = task.target_count ? Math.min(100, (done / task.target_count) * 100) : 0;
              const to = taskLinks[task.task_type] || "/belajar";
              return (
                <Link key={task.id} to={to as "/belajar"} className="block rounded-2xl border bg-card p-3 transition hover:border-primary/35">
                  <div className="flex items-start gap-3">
                    <span className={done >= task.target_count && task.target_count > 0 ? "grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" : "grid size-8 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"}><CheckCircle2 className="size-4" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2"><p className="truncate text-[12px] font-semibold">{adaptiveTaskLabels[task.task_type]}</p><span className="text-[10px] font-bold">{done}/{task.target_count}</span></div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${taskPercent}%` }} /></div>
                      <p className="mt-1 text-[9px] text-muted-foreground">{done >= task.target_count && task.target_count > 0 ? "Selesai ✓" : done > 0 ? "Sedang dikerjakan" : "Belum dimulai"}</p>
                      {!!task.suggestions?.length && <div className="mt-2 rounded-xl bg-primary/[0.045] px-2.5 py-2">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-primary">Materi yang disarankan</p>
                        <div className="mt-1.5 space-y-1.5">{task.suggestions.map((item,i)=><div key={`${item.id}-${i}`} className="flex items-start gap-2"><span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-primary/10 text-[8px] font-bold text-primary">{i+1}</span><div className="min-w-0"><p className="truncate font-jp text-[11px] font-semibold text-foreground">{item.label}</p>{item.subtitle&&<p className="truncate text-[9px] text-muted-foreground">{item.subtitle}</p>}</div></div>)}</div>
                      </div>}
                      {!task.suggestions?.length && task.task_type!=="quiz" && <p className="mt-2 rounded-lg bg-muted/40 px-2 py-1.5 text-[9px] text-muted-foreground">Materi spesifik sedang dipilih berdasarkan progresmu.</p>}
                    </div>
                  </div>
                </Link>
              );
            }) : <Card className="rounded-2xl"><CardContent className="p-4 text-[11px] text-muted-foreground">Rencana adaptif belum tersedia. Buka Profil → Edit Profil, pilih level dan target bulan, lalu simpan untuk mengaktifkan planner.</CardContent></Card>}
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold">Quick Quiz</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {quizzes.map(({ label, icon: Icon, to }) => <Link key={label} to={to} className="rounded-2xl border bg-card p-3 transition hover:border-primary/35"><Icon className="size-4 text-primary" /><p className="mt-2 text-[11px] font-semibold">{label}</p></Link>)}
          </div>
        </section>

        <Card className="rounded-2xl border-primary/20 bg-primary/[0.04]">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary"><Brain className="size-5" /></span>
            <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold">Spaced Repetition</p><p className="mt-0.5 text-[10px] text-muted-foreground">Ulangi materi yang sudah jatuh tempo agar tidak cepat lupa.</p></div>
            <Link to="/belajar" className="shrink-0 rounded-xl bg-primary px-3 py-2 text-[10px] font-semibold text-primary-foreground">Mulai Review</Link>
          </CardContent>
        </Card>

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold">Misi Harian</h2>
          <Card className="rounded-2xl"><CardContent className="divide-y p-1">{missions.map((mission) => <div key={mission.label} className="flex items-center gap-3 px-3 py-2.5"><span className="grid size-7 place-items-center rounded-lg bg-muted"><CheckCircle2 className="size-3.5 text-muted-foreground" /></span><p className="min-w-0 flex-1 text-[11px] font-medium">{mission.label}</p><div className="text-right"><p className="text-[10px] font-bold text-primary">+{mission.xp} XP</p><p className="text-[9px] text-amber-600">+{mission.points} Pts</p></div></div>)}</CardContent></Card>
        </section>
      </div>
    </AppShell>
  );
}
