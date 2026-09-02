import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Clock3, ListChecks } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchQuizBySlug, saveAttempt } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/quiz/$slug")({ component: QuizRunner });

function QuizRunner() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({ queryKey: ["quiz", slug], queryFn: () => fetchQuizBySlug(slug) });
  const questions = data?.questions ?? [];
  const quiz = data?.quiz;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!quiz?.time_limit_seconds || finished) return;
    setSecondsLeft(quiz.time_limit_seconds);
    const timer = window.setInterval(() => setSecondsLeft(s => s === null ? s : Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [quiz?.time_limit_seconds, finished]);
  useEffect(() => { if (secondsLeft === 0 && questions.length && !finished) void finish(); }, [secondsLeft]);

  const current = questions[index];
  const answeredCount = Object.keys(answers).length;
  const score = useMemo(() => questions.reduce((n, q) => n + (answers[q.id] === q.correct_index ? 1 : 0), 0), [questions, answers]);

  async function finish() {
    if (finished || !questions.length || !quiz) return;
    setFinished(true); setSaving(true);
    try { await saveAttempt({ quizId: quiz.id, level: quiz.level ?? null, skill: quiz.skill ?? null, total: questions.length, correct: score, durationSeconds: Math.round((Date.now() - startedAt) / 1000), answers: questions.map(q => ({ questionId: q.id, selectedIndex: answers[q.id] ?? -1, isCorrect: answers[q.id] === q.correct_index })) }); }
    finally { setSaving(false); }
  }

  if (isLoading) return <AppShell title="Simulasi JLPT"><p className="text-[12px] text-muted-foreground">Memuat soal…</p></AppShell>;
  if (error || !quiz) return <AppShell title="Simulasi JLPT"><Card><CardContent className="py-8 text-center"><p className="mb-4 text-[12px] text-destructive">Simulasi tidak ditemukan atau gagal dimuat.</p><Button asChild size="sm"><Link to="/quiz">Kembali ke simulasi</Link></Button></CardContent></Card></AppShell>;
  if (!questions.length) return <AppShell title={quiz.title}><Card><CardContent className="py-8 text-center text-[12px] text-muted-foreground">Belum ada soal pada simulasi ini.</CardContent></Card></AppShell>;

  if (finished) return <AppShell title="Hasil simulasi" description={quiz.title}>
    <div className="mx-auto max-w-xl"><Card className="border-border/70 shadow-none"><CardContent className="p-6 text-center"><div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Check className="size-7" /></div><p className="text-[12px] text-muted-foreground">Hasil simulasi</p><div className="mt-1 text-3xl font-semibold tracking-tight">{score} / {questions.length}</div><Badge className="mt-2 text-[10px]">{Math.round((score / questions.length) * 100)}%</Badge><p className="mt-3 text-[12px] leading-5 text-muted-foreground">{saving ? "Menyimpan hasil…" : "Hasil sudah tersimpan."}</p><div className="mt-5 flex gap-2"><Button className="flex-1" size="sm" onClick={() => navigate({ to: "/quiz/$slug", params: { slug } })}>Ulangi</Button><Button className="flex-1" size="sm" variant="outline" asChild><Link to="/quiz">Daftar simulasi</Link></Button></div></CardContent></Card></div>
  </AppShell>;

  if (!current) return null;
  const progress = Math.round(((index + 1) / questions.length) * 100);
  const timer = secondsLeft === null ? null : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return <AppShell title="Simulasi JLPT" description={`${quiz.level} · ${quiz.title}`}>
    <div className="mx-auto max-w-2xl pb-6">
      <div className="mb-4 flex items-center justify-between gap-3"><Button variant="ghost" size="sm" className="h-8 px-2 text-[11px]" asChild><Link to="/quiz"><ArrowLeft className="mr-1.5 size-3.5" />Keluar</Link></Button><div className="flex items-center gap-3 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1"><ListChecks className="size-3.5" />{answeredCount}/{questions.length}</span>{timer && <span className="inline-flex items-center gap-1 font-medium"><Clock3 className="size-3.5" />{timer}</span>}</div></div>
      <div className="mb-4"><div className="mb-1.5 flex justify-between text-[10px] text-muted-foreground"><span>Soal {index + 1} dari {questions.length}</span><span>{progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div></div>
      <Card className="border-border/70 shadow-none"><CardContent className="p-4 sm:p-6"><div className="mb-4 flex items-center justify-between"><Badge variant="secondary" className="text-[10px]">{quiz.level}</Badge><span className="text-[10px] text-muted-foreground">Pilih satu jawaban</span></div><h2 className="text-[16px] font-semibold leading-6 tracking-tight sm:text-[17px]">{current.prompt}</h2>{current.prompt_note && <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{current.prompt_note}</p>}
        <div className="mt-5 space-y-2">{current.choices.map((choice, i) => { const selected = answers[current.id] === i; return <button key={i} type="button" className={`flex min-h-11 w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-[12px] leading-5 transition ${selected ? "border-primary bg-primary/5 text-foreground" : "border-border/70 hover:bg-muted/50"}`} onClick={() => setAnswers(a => ({ ...a, [current.id]: i }))}><span className={`grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{String.fromCharCode(65 + i)}</span><span>{choice}</span></button>; })}</div>
        <div className="mt-6 flex items-center justify-between gap-2"><Button variant="outline" size="sm" disabled={index === 0} onClick={() => setIndex(i => i - 1)}><ChevronLeft className="mr-1 size-4" />Sebelumnya</Button>{index === questions.length - 1 ? <Button size="sm" disabled={answers[current.id] === undefined} onClick={finish}>Selesai</Button> : <Button size="sm" disabled={answers[current.id] === undefined} onClick={() => setIndex(i => i + 1)}>Berikutnya<ChevronRight className="ml-1 size-4" /></Button>}</div>
      </CardContent></Card>
    </div>
  </AppShell>;
}
