import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BookOpenCheck, Clock3, GraduationCap, ListChecks, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchQuizzes, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/quiz")({ component: QuizPage });

const levelStyles: Record<Level, { icon: typeof GraduationCap; box: string; iconColor: string; badge: string; note: string }> = {
  N5: { icon: Sparkles, box: "bg-emerald-50", iconColor: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700", note: "Dasar" },
  N4: { icon: BookOpenCheck, box: "bg-sky-50", iconColor: "text-sky-600", badge: "bg-sky-100 text-sky-700", note: "Dasar–menengah" },
  N3: { icon: ListChecks, box: "bg-violet-50", iconColor: "text-violet-600", badge: "bg-violet-100 text-violet-700", note: "Menengah" },
  N2: { icon: GraduationCap, box: "bg-amber-50", iconColor: "text-amber-600", badge: "bg-amber-100 text-amber-700", note: "Menengah–mahir" },
  N1: { icon: GraduationCap, box: "bg-rose-50", iconColor: "text-rose-600", badge: "bg-rose-100 text-rose-700", note: "Mahir" },
};

const fallbackQuizzes = (["N5", "N4", "N3", "N2", "N1"] as Level[]).map((level) => ({
  id: `fallback-${level}`,
  slug: `simulasi-jlpt-${level}`,
  title: `Simulasi JLPT ${level}`,
  description: `Latihan simulasi JLPT ${level}`,
  level,
  skill: null,
  question_count: 5,
  time_limit_seconds: 600,
  sort_order: 0,
}));

function QuizPage() {
  const [level, setLevel] = useState<Level | "ALL">("ALL");
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["quizzes"], queryFn: fetchQuizzes, retry: 1 });
  const source = data?.length ? data : fallbackQuizzes;
  const quizzes = useMemo(() => source.filter((q) => q.slug.startsWith("simulasi-jlpt-") && (level === "ALL" || q.level === level)), [source, level]);
  const levels: Array<Level | "ALL"> = ["ALL", "N5", "N4", "N3", "N2", "N1"];

  return (
    <AppShell title="Simulasi JLPT" description="Uji kemampuanmu dengan simulasi dari N5 sampai N1.">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 rounded-2xl border border-primary/15 bg-primary/[0.045] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><GraduationCap className="size-5" /></div>
            <div><h2 className="text-[16px] font-semibold tracking-tight">Simulasi JLPT</h2><p className="mt-1 text-[12px] leading-5 text-muted-foreground">Pilih tingkat ujian dan mulai mengerjakan soal.</p></div>
          </div>
        </div>

        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {levels.map((item) => <Button key={item} size="sm" className="shrink-0 rounded-full text-[12px]" variant={level === item ? "default" : "outline"} onClick={() => setLevel(item)}>{item === "ALL" ? "Semua tingkat" : item}</Button>)}
        </div>

        {isLoading && <p className="py-8 text-center text-[12px] text-muted-foreground">Memuat simulasi…</p>}
        {error && <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-[11px] text-amber-800"><p>Data simulasi sementara menggunakan daftar tingkat JLPT.</p><button type="button" className="mt-1 font-semibold underline" onClick={() => void refetch()}>Coba muat ulang data</button></div>}
        {!isLoading && quizzes.length === 0 && <Card><CardContent className="py-8 text-center text-[12px] text-muted-foreground">Belum ada simulasi untuk tingkat ini.</CardContent></Card>}

        <div className="space-y-3">
          {quizzes.map((q) => {
            const cfg = levelStyles[q.level as Level] ?? levelStyles.N5;
            const Icon = cfg.icon;
            return <Card key={q.id} className="overflow-hidden border-border/70 shadow-none transition-shadow hover:shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${cfg.box}`}><Icon className={`size-5 ${cfg.iconColor}`} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5"><Badge className={`border-0 text-[10px] ${cfg.badge}`}>{q.level}</Badge><span className="text-[10px] text-muted-foreground">{cfg.note}</span></div>
                    <h3 className="truncate text-[15px] font-semibold">{q.title}</h3>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1"><ListChecks className="size-3.5" />{q.question_count} soal</span><span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />10 menit</span></div>
                <Button type="button" className="mt-4 h-10 w-full rounded-xl text-[12px]" onClick={() => { window.location.assign(`/quiz/${encodeURIComponent(q.slug)}`); }}>Mulai simulasi</Button>
              </CardContent>
            </Card>;
          })}
        </div>
      </div>
    </AppShell>
  );
}
