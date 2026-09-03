import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, Brain, Languages, ListChecks, Sparkles, Type } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchQuizzes, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/quiz")({ head: () => ({ meta: [{ title: "Quiz — enonihongo" }] }), component: QuizPage });

const skills = [
  { key: "kanji", label: "Kanji", icon: Type, tone: "bg-emerald-50 text-emerald-600" },
  { key: "vocabulary", label: "Kotoba", icon: Languages, tone: "bg-amber-50 text-amber-600" },
  { key: "grammar", label: "Bunpō", icon: BookOpenCheck, tone: "bg-violet-50 text-violet-600" },
  { key: "reading", label: "Dokkai", icon: ListChecks, tone: "bg-rose-50 text-rose-600" },
  { key: "listening", label: "Choukai", icon: Brain, tone: "bg-sky-50 text-sky-600" },
] as const;

function QuizPage() {
  const [level, setLevel] = useState<Level | "ALL">("ALL");
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["quizzes"], queryFn: fetchQuizzes, retry: 1 });
  const quizzes = useMemo(() => (data ?? []).filter(q => !q.slug.startsWith("simulasi-jlpt-") && (level === "ALL" || q.level === level)), [data, level]);
  const levels: Array<Level | "ALL"> = ["ALL", "N5", "N4", "N3", "N2", "N1"];

  return <AppShell title="Quiz" description="Latihan cepat berdasarkan materi yang sudah kamu pelajari.">
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="rounded-2xl border-primary/15 bg-primary/[0.045] shadow-none"><CardContent className="p-5"><div className="flex items-start gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="size-5" /></div><div><h1 className="text-base font-semibold">Quiz latihan</h1><p className="mt-1 text-xs leading-5 text-muted-foreground">Perkuat Kanji, Kotoba, Bunpō, Dokkai, dan Choukai dengan soal yang sesuai level.</p></div></div></CardContent></Card>
      <div className="flex gap-1.5 overflow-x-auto pb-1">{levels.map(item => <Button key={item} size="sm" className="shrink-0 rounded-full text-xs" variant={level === item ? "default" : "outline"} onClick={() => setLevel(item)}>{item === "ALL" ? "Semua" : item}</Button>)}</div>
      {isLoading && <p className="py-8 text-center text-xs text-muted-foreground">Memuat quiz…</p>}
      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-800">Data quiz belum dapat dimuat. <button type="button" className="font-semibold underline" onClick={() => void refetch()}>Coba lagi</button></div>}
      {!isLoading && quizzes.length > 0 && <div className="space-y-3">{quizzes.map(q => <Card key={q.id} className="rounded-2xl border-border/70 shadow-none"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ListChecks className="size-5" /></div><div className="min-w-0 flex-1"><div className="mb-1 flex items-center gap-1.5"><Badge className="border-0 bg-primary/10 text-[10px] text-primary">{q.level}</Badge>{q.skill && <span className="text-[10px] text-muted-foreground">{q.skill}</span>}</div><h2 className="truncate text-sm font-semibold">{q.title}</h2></div><ArrowRight className="size-4 text-muted-foreground" /></div><p className="mt-2 text-xs text-muted-foreground">{q.question_count} soal · latihan bertahap</p><Button type="button" className="mt-3 h-9 w-full rounded-xl text-xs" onClick={() => { window.location.assign(`/quiz/${encodeURIComponent(q.slug)}`); }}>Mulai quiz</Button></CardContent></Card>)}</div>}
      {!isLoading && quizzes.length === 0 && <Card className="rounded-2xl border-dashed"><CardContent className="p-6 text-center"><div className="mx-auto grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground"><ListChecks className="size-5" /></div><p className="mt-3 text-sm font-semibold">Quiz latihan belum tersedia</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Soal simulasi tetap tersedia di menu Simulasi. Quiz per materi akan muncul setelah bank soal latihan tersedia.</p></CardContent></Card>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{skills.map(({ key, label, icon: Icon, tone }) => <div key={key} className="rounded-2xl border bg-card p-3 text-center"><span className={`mx-auto grid size-9 place-items-center rounded-xl ${tone}`}><Icon className="size-4" /></span><p className="mt-2 text-[11px] font-medium">{label}</p></div>)}</div>
    </div>
  </AppShell>;
}
