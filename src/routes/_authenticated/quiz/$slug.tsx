import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    const timer = window.setInterval(() => setSecondsLeft((s) => (s === null ? s : Math.max(0, s - 1))), 1000);
    return () => window.clearInterval(timer);
  }, [quiz?.time_limit_seconds, finished]);

  useEffect(() => {
    if (secondsLeft === 0 && questions.length && !finished) void finish();
  }, [secondsLeft]);

  const current = questions[index];
  const score = useMemo(() => questions.reduce((n, q) => n + (answers[q.id] === q.correct_index ? 1 : 0), 0), [questions, answers]);

  async function finish() {
    if (finished || !questions.length) return;
    setFinished(true);
    setSaving(true);
    try {
      await saveAttempt({ quizId: quiz?.id, level: quiz?.level, skill: quiz?.skill, total: questions.length, correct: score, durationSeconds: Math.round((Date.now() - startedAt) / 1000), answers: questions.map((q) => ({ questionId: q.id, selectedIndex: answers[q.id] ?? -1, isCorrect: answers[q.id] === q.correct_index })) });
    } finally { setSaving(false); }
  }

  if (isLoading) return <AppShell title="Quiz"><p className="text-sm text-muted-foreground">Memuat soal…</p></AppShell>;
  if (error || !quiz) return <AppShell title="Quiz"><Card><CardContent className="py-8 text-center"><p className="mb-4 text-sm text-destructive">Quiz tidak ditemukan atau gagal dimuat.</p><Button asChild><Link to="/quiz">Kembali ke Quiz</Link></Button></CardContent></Card></AppShell>;
  if (!questions.length) return <AppShell title={quiz.title}><Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Belum ada soal pada quiz ini.</CardContent></Card></AppShell>;

  if (finished) return <AppShell title="Hasil Quiz" description={quiz.title}>
    <Card><CardHeader><CardTitle>Skor kamu</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="text-4xl font-bold">{score}/{questions.length}</div><Badge>{Math.round((score / questions.length) * 100)}%</Badge>
      <p className="text-sm text-muted-foreground">{saving ? "Menyimpan hasil…" : "Hasil sudah diproses. XP akan mengikuti aturan akunmu."}</p>
      <div className="flex gap-2"><Button onClick={() => navigate({ to: "/quiz/$slug", params: { slug } })}>Ulangi</Button><Button variant="outline" asChild><Link to="/quiz">Daftar Quiz</Link></Button></div>
    </CardContent></Card>
  </AppShell>;

  return <AppShell title={quiz.title} description={`${quiz.level} · ${index + 1}/${questions.length}${secondsLeft !== null ? ` · ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}` : ""}`}>
    <Card><CardHeader><div className="flex items-center justify-between"><Badge>{quiz.skill}</Badge><span className="text-sm text-muted-foreground">Soal {index + 1}</span></div><CardTitle className="pt-3 text-lg">{current.prompt}</CardTitle>{current.prompt_note && <p className="text-sm text-muted-foreground">{current.prompt_note}</p>}</CardHeader>
      <CardContent className="space-y-3">{current.choices.map((choice, i) => <Button key={i} variant={answers[current.id] === i ? "default" : "outline"} className="h-auto w-full justify-start whitespace-normal py-3 text-left" onClick={() => setAnswers((a) => ({ ...a, [current.id]: i }))}>{String.fromCharCode(65 + i)}. {choice}</Button>)}
      <div className="flex justify-between pt-4"><Button variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>Sebelumnya</Button>{index === questions.length - 1 ? <Button disabled={answers[current.id] === undefined} onClick={finish}>Selesai</Button> : <Button disabled={answers[current.id] === undefined} onClick={() => setIndex((i) => i + 1)}>Berikutnya</Button>}</div>
    </CardContent></Card>
  </AppShell>;
}
