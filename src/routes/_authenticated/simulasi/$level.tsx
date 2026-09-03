import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, Flag, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchSimulationQuestions, saveAttempt, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/simulasi/$level")({ component: SimulationRunner });
const validLevels: Level[] = ["N5", "N4", "N3", "N2", "N1"];
const SIMULATION_SECONDS = 1800;

function SimulationRunner() {
  const raw = Route.useParams().level.toUpperCase();
  const level = validLevels.includes(raw as Level) ? raw as Level : "N5";
  const { data, isLoading, error } = useQuery({
    queryKey: ["simulation", level],
    queryFn: () => fetchSimulationQuestions(level, "vocabulary_grammar"),
  });
  const questions = data ?? [];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [seconds, setSeconds] = useState(SIMULATION_SECONDS);
  const [saving, setSaving] = useState(false);

  const score = useMemo(
    () => questions.reduce((n, q) => n + (answers[q.id] === q.correct_index ? 1 : 0), 0),
    [questions, answers],
  );
  const answered = Object.keys(answers).length;
  const unanswered = Math.max(0, questions.length - answered);

  useEffect(() => {
    if (finished || !questions.length) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [finished, questions.length]);

  useEffect(() => {
    if (seconds === 0 && questions.length && !finished) void finish();
  }, [seconds, questions.length, finished]);

  async function finish() {
    if (finished || !questions.length) return;
    setFinished(true);
    setSaving(true);
    try {
      await saveAttempt({
        level,
        skill: "vocabulary",
        total: questions.length,
        correct: score,
        durationSeconds: SIMULATION_SECONDS - seconds,
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedIndex: answers[q.id] ?? -1,
          isCorrect: answers[q.id] === q.correct_index,
        })),
      });
    } finally {
      setSaving(false);
    }
  }

  function chooseAnswer(choice: number) {
    const question = questions[index];
    if (!question) return;
    setAnswers((current) => ({ ...current, [question.id]: choice }));
  }

  if (isLoading) return <AppShell title={`Simulasi ${level}`}><p className="text-sm text-muted-foreground">Memuat soal…</p></AppShell>;
  if (error) return <AppShell title={`Simulasi ${level}`}><Card><CardContent className="py-10 text-center"><p className="text-sm text-destructive">Soal belum dapat dimuat.</p><Button asChild className="mt-4"><Link to="/simulasi">Kembali</Link></Button></CardContent></Card></AppShell>;
  if (!questions.length) return <AppShell title={`Simulasi ${level}`}><Card><CardContent className="py-10 text-center"><p className="text-sm text-muted-foreground">Belum ada soal untuk level {level}.</p><Button asChild className="mt-4"><Link to="/simulasi">Kembali</Link></Button></CardContent></Card></AppShell>;

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return <AppShell title="Hasil Simulasi" description={`Simulasi JLPT ${level}`}>
      <div className="mx-auto max-w-xl">
        <Card><CardContent className="p-7 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Check className="size-7" /></div>
          <p className="mt-4 text-xs text-muted-foreground">Simulasi JLPT {level} selesai</p>
          <p className="mt-1 text-4xl font-bold">{score}/{questions.length}</p>
          <Badge className="mt-2">{percentage}%</Badge>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-muted/40 p-3"><p className="text-lg font-semibold">{answered}</p><p className="text-[11px] text-muted-foreground">Dijawab</p></div>
            <div className="rounded-xl bg-muted/40 p-3"><p className="text-lg font-semibold">{unanswered}</p><p className="text-[11px] text-muted-foreground">Kosong</p></div>
            <div className="rounded-xl bg-muted/40 p-3"><p className="text-lg font-semibold">{Math.floor((SIMULATION_SECONDS - seconds) / 60)} m</p><p className="text-[11px] text-muted-foreground">Waktu</p></div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{saving ? "Menyimpan hasil…" : "Hasil simulasi tersimpan ke Progress."}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild><Link to="/simulasi"><ArrowLeft className="mr-1 size-4" />Pilih level lain</Link></Button>
            <Button variant="outline" onClick={() => window.location.reload()}><RotateCcw className="mr-1 size-4" />Ulangi</Button>
          </div>
        </CardContent></Card>
      </div>
    </AppShell>;
  }

  const q = questions[index];
  const selected = answers[q.id];
  const timer = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const timerUrgent = seconds <= 60;

  return <AppShell title={`Simulasi ${level}`} description="Pilih satu jawaban yang paling tepat.">
    <div className="mx-auto max-w-3xl pb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild><Link to="/simulasi"><ArrowLeft className="mr-1 size-4" />Keluar</Link></Button>
        <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${timerUrgent ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground"}`}><Clock3 className="size-3.5" />{timer}</div>
      </div>

      <Card className="mb-4 shadow-none"><CardContent className="p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Soal {index + 1} dari {questions.length}</span>
          <span>{answered}/{questions.length} dijawab</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {questions.map((question, questionIndex) => <button key={question.id} type="button" onClick={() => setIndex(questionIndex)} aria-label={`Buka soal ${questionIndex + 1}`} className={`grid size-8 place-items-center rounded-lg border text-xs font-medium transition ${questionIndex === index ? "border-primary bg-primary text-primary-foreground" : answers[question.id] !== undefined ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>{questionIndex + 1}</button>)}
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-3"><Badge variant="secondary">{level}</Badge>{selected !== undefined ? <span className="inline-flex items-center gap-1 text-xs text-primary"><Flag className="size-3.5" />Sudah dijawab</span> : <span className="text-xs text-muted-foreground">Belum dijawab</span>}</div>
        <h2 className="text-base font-semibold leading-7 sm:text-lg">{q.prompt}</h2>
        {q.prompt_note && <p className="mt-2 text-xs text-muted-foreground">{q.prompt_note}</p>}
        <div className="mt-6 space-y-2.5">{q.choices.map((choice, choiceIndex) => <button key={`${q.id}-${choiceIndex}`} type="button" onClick={() => chooseAnswer(choiceIndex)} className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition ${selected === choiceIndex ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:bg-muted/40"}`}><span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold">{String.fromCharCode(65 + choiceIndex)}</span><span className="pt-0.5">{choice}</span></button>)}</div>
        <div className="mt-7 flex items-center justify-between gap-2 border-t pt-4">
          <Button variant="outline" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}><ArrowLeft className="mr-1 size-4" />Sebelumnya</Button>
          {index === questions.length - 1 ? <Button onClick={finish}><Check className="mr-1 size-4" />Selesai</Button> : <Button onClick={() => setIndex((value) => value + 1)} disabled={selected === undefined}>Berikutnya<ArrowRight className="ml-1 size-4" /></Button>}
        </div>
        {index === questions.length - 1 && unanswered > 0 && <p className="mt-3 text-center text-[11px] text-muted-foreground">Masih ada {unanswered} soal yang belum dijawab. Kamu tetap bisa mengumpulkan sekarang.</p>}
      </CardContent></Card>
    </div>
  </AppShell>;
}
