import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchSimulationQuestions, saveAttempt, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/simulasi/$level")({ component: SimulationRunner });
const validLevels: Level[] = ["N5", "N4", "N3", "N2", "N1"];
function SimulationRunner() {
  const raw = Route.useParams().level.toUpperCase(); const level = validLevels.includes(raw as Level) ? raw as Level : "N5";
  const { data, isLoading, error } = useQuery({ queryKey: ["simulation", level], queryFn: () => fetchSimulationQuestions(level, "vocabulary_grammar") });
  const questions = data ?? []; const [index, setIndex] = useState(0); const [answers, setAnswers] = useState<Record<string, number>>({}); const [finished, setFinished] = useState(false); const [seconds, setSeconds] = useState(1800); const [saving, setSaving] = useState(false);
  useEffect(() => { if (finished) return; const t = window.setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000); return () => window.clearInterval(t); }, [finished]);
  useEffect(() => { if (seconds === 0 && questions.length && !finished) void finish(); }, [seconds]);
  const score = useMemo(() => questions.reduce((n,q) => n + (answers[q.id] === q.correct_index ? 1 : 0), 0), [questions, answers]);
  async function finish() { if (finished || !questions.length) return; setFinished(true); setSaving(true); try { await saveAttempt({ level, skill: "vocabulary", total: questions.length, correct: score, durationSeconds: 1800 - seconds, answers: questions.map(q => ({ questionId: q.id, selectedIndex: answers[q.id] ?? -1, isCorrect: answers[q.id] === q.correct_index })) }); } finally { setSaving(false); } }
  if (isLoading) return <AppShell title={`Simulasi ${level}`}><p className="text-sm text-muted-foreground">Memuat soal…</p></AppShell>;
  if (error) return <AppShell title={`Simulasi ${level}`}><Card><CardContent className="py-10 text-center"><p className="text-sm text-destructive">Soal belum dapat dimuat.</p><Button asChild className="mt-4"><Link to="/simulasi">Kembali</Link></Button></CardContent></Card></AppShell>;
  if (!questions.length) return <AppShell title={`Simulasi ${level}`}><Card><CardContent className="py-10 text-center"><p className="text-sm text-muted-foreground">Belum ada soal untuk level {level}.</p><Button asChild className="mt-4"><Link to="/simulasi">Kembali</Link></Button></CardContent></Card></AppShell>;
  if (finished) return <AppShell title="Hasil Simulasi"><div className="mx-auto max-w-xl"><Card><CardContent className="p-7 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Check className="size-7" /></div><p className="mt-4 text-xs text-muted-foreground">Simulasi {level} selesai</p><p className="mt-1 text-4xl font-bold">{score}/{questions.length}</p><Badge className="mt-2">{Math.round(score / questions.length * 100)}%</Badge><p className="mt-3 text-xs text-muted-foreground">{saving ? "Menyimpan hasil…" : "Hasil sudah tersimpan."}</p><Button asChild className="mt-5"><Link to="/simulasi">Pilih simulasi lain</Link></Button></CardContent></Card></div></AppShell>;
  const q = questions[index]; const timer = `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`; const selected = answers[q.id];
  return <AppShell title={`Simulasi ${level}`} description="Pilih satu jawaban yang paling tepat."><div className="mx-auto max-w-2xl pb-8"><div className="mb-4 flex items-center justify-between"><Button variant="ghost" size="sm" asChild><Link to="/simulasi"><ArrowLeft className="mr-1 size-4" />Keluar</Link></Button><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3.5" />{timer}</span></div><div className="mb-4 flex items-center justify-between text-xs text-muted-foreground"><span>Soal {index+1} / {questions.length}</span><Badge variant="secondary">{level}</Badge></div><Card><CardContent className="p-5 sm:p-7"><h2 className="text-base font-semibold leading-6">{q.prompt}</h2>{q.prompt_note && <p className="mt-2 text-xs text-muted-foreground">{q.prompt_note}</p>}<div className="mt-5 space-y-2">{q.choices.map((choice,i) => <button key={i} type="button" onClick={() => setAnswers(a => ({...a,[q.id]:i}))} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm ${selected === i ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}><span className="font-semibold">{String.fromCharCode(65+i)}.</span><span>{choice}</span></button>)}</div><div className="mt-6 flex justify-between gap-2"><Button variant="outline" disabled={index===0} onClick={() => setIndex(i=>i-1)}>Sebelumnya</Button>{index===questions.length-1 ? <Button disabled={selected===undefined} onClick={finish}>Selesai</Button> : <Button disabled={selected===undefined} onClick={() => setIndex(i=>i+1)}>Berikutnya<ArrowRight className="ml-1 size-4" /></Button>}</div></CardContent></Card></div></AppShell>;
}
