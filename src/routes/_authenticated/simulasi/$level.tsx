import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, Flag, Headphones, BookOpen, Languages, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchSimulationQuestions, saveAttempt, type Level, type RunnerQuestion } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/simulasi/$level")({ component: SimulationRunner });
const validLevels: Level[] = ["N5", "N4", "N3", "N2", "N1"];

type SectionKey = "vocabulary" | "grammar_reading" | "listening";
type Section = { key: SectionKey; title: string; subtitle: string; minutes: number; icon: typeof Languages; group: "vocabulary_grammar" | "reading" | "listening" };

const format: Record<Level, Section[]> = {
  N5: [
    { key: "vocabulary", title: "言語知識（文字・語彙）", subtitle: "Language Knowledge · Vocabulary", minutes: 20, icon: Languages, group: "vocabulary_grammar" },
    { key: "grammar_reading", title: "言語知識（文法）・読解", subtitle: "Language Knowledge · Grammar & Reading", minutes: 40, icon: BookOpen, group: "reading" },
    { key: "listening", title: "聴解", subtitle: "Listening", minutes: 30, icon: Headphones, group: "listening" },
  ],
  N4: [
    { key: "vocabulary", title: "言語知識（文字・語彙）", subtitle: "Language Knowledge · Vocabulary", minutes: 25, icon: Languages, group: "vocabulary_grammar" },
    { key: "grammar_reading", title: "言語知識（文法）・読解", subtitle: "Language Knowledge · Grammar & Reading", minutes: 55, icon: BookOpen, group: "reading" },
    { key: "listening", title: "聴解", subtitle: "Listening", minutes: 35, icon: Headphones, group: "listening" },
  ],
  N3: [
    { key: "vocabulary", title: "言語知識（文字・語彙）", subtitle: "Language Knowledge · Vocabulary", minutes: 30, icon: Languages, group: "vocabulary_grammar" },
    { key: "grammar_reading", title: "言語知識（文法）・読解", subtitle: "Language Knowledge · Grammar & Reading", minutes: 70, icon: BookOpen, group: "reading" },
    { key: "listening", title: "聴解", subtitle: "Listening", minutes: 40, icon: Headphones, group: "listening" },
  ],
  N2: [
    { key: "grammar_reading", title: "言語知識（文字・語彙・文法）・読解", subtitle: "Language Knowledge · Vocabulary/Grammar & Reading", minutes: 105, icon: BookOpen, group: "vocabulary_grammar" },
    { key: "listening", title: "聴解", subtitle: "Listening", minutes: 50, icon: Headphones, group: "listening" },
  ],
  N1: [
    { key: "grammar_reading", title: "言語知識（文字・語彙・文法）・読解", subtitle: "Language Knowledge · Vocabulary/Grammar & Reading", minutes: 110, icon: BookOpen, group: "vocabulary_grammar" },
    { key: "listening", title: "聴解", subtitle: "Listening", minutes: 55, icon: Headphones, group: "listening" },
  ],
};

const PASS_MARK: Record<Level, { total: number; language: number; reading: number; listening: number }> = {
  N5: { total: 80, language: 38, reading: 38, listening: 19 },
  N4: { total: 90, language: 38, reading: 38, listening: 19 },
  N3: { total: 95, language: 19, reading: 19, listening: 19 },
  N2: { total: 90, language: 19, reading: 19, listening: 19 },
  N1: { total: 100, language: 19, reading: 19, listening: 19 },
};

function SimulationRunner() {
  const raw = Route.useParams().level.toUpperCase();
  const level = validLevels.includes(raw as Level) ? raw as Level : "N5";
  const sections = format[level];
  const [sectionIndex, setSectionIndex] = useState(0);
  const section = sections[sectionIndex];
  const [sectionQuestions, setSectionQuestions] = useState<RunnerQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [sectionFinished, setSectionFinished] = useState(false);
  const [seconds, setSeconds] = useState(section.minutes * 60);
  const [saving, setSaving] = useState(false);
  const [started, setStarted] = useState(false);

  const query = useQuery({
    queryKey: ["jlpt-simulation", level, section.key],
    queryFn: () => fetchSimulationQuestions(level, section.group),
    enabled: started,
  });

  useEffect(() => {
    if (!query.data) return;
    setSectionQuestions(query.data);
    setIndex(0);
    setSectionFinished(false);
    setSeconds(section.minutes * 60);
  }, [query.data, section.key, section.minutes]);

  useEffect(() => {
    if (!started || sectionFinished || finished || !sectionQuestions.length) return;
    const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [started, sectionFinished, finished, sectionQuestions.length, section.key]);

  useEffect(() => {
    if (started && seconds === 0 && sectionQuestions.length && !sectionFinished && !finished) {
      void finishSection();
    }
  }, [seconds, started, sectionQuestions.length, sectionFinished, finished]);

  const answered = Object.keys(answers).filter(id => sectionQuestions.some(q => q.id === id)).length;
  const current = sectionQuestions[index];
  const selected = current ? answers[current.id] : undefined;
  const timer = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const scoreBySection = useMemo(() => {
    return sections.map((s) => {
      const qs = s.key === section.key ? sectionQuestions : [];
      const correct = qs.reduce((sum, q) => sum + (answers[q.id] === q.correct_index ? 1 : 0), 0);
      return { key: s.key, correct, total: qs.length };
    });
  }, [sections, section.key, sectionQuestions, answers]);

  function chooseAnswer(choice: number) {
    if (!current || sectionFinished) return;
    setAnswers(old => ({ ...old, [current.id]: choice }));
  }

  async function finishSection() {
    if (sectionFinished || finished || !sectionQuestions.length) return;
    setSectionFinished(true);
    if (sectionIndex < sections.length - 1) return;
    setFinished(true);
    setSaving(true);
    try {
      const all = sectionQuestions;
      const correct = all.reduce((n, q) => n + (answers[q.id] === q.correct_index ? 1 : 0), 0);
      await saveAttempt({
        level,
        skill: "vocabulary",
        total: all.length,
        correct,
        durationSeconds: sections.reduce((n, s) => n + s.minutes * 60, 0) - seconds,
        answers: all.map(q => ({ questionId: q.id, selectedIndex: answers[q.id] ?? -1, isCorrect: answers[q.id] === q.correct_index })),
      });
    } finally {
      setSaving(false);
    }
  }

  function nextSection() {
    setSectionIndex(value => value + 1);
    setIndex(0);
    setSectionFinished(false);
  }

  if (!started) return <AppShell title={`JLPT ${level}`} description="Simulasi dengan struktur dan waktu mengikuti format resmi JLPT.">
    <div className="mx-auto max-w-3xl space-y-4">
      <Card><CardContent className="p-6 sm:p-8">
        <div className="flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><BookOpen className="size-6" /></div><div><Badge>{level}</Badge><h1 className="mt-3 text-xl font-bold">Simulasi JLPT {level}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Bukan quiz 30 menit. Simulasi ini dibagi menjadi bagian ujian seperti JLPT asli dan setiap bagian memiliki batas waktu sendiri.</p></div></div>
        <div className="mt-6 space-y-2">{sections.map((s, i) => <div key={s.key} className="flex items-center justify-between rounded-xl border p-4"><div><p className="text-sm font-semibold">Bagian {i + 1} · {s.title}</p><p className="mt-1 text-xs text-muted-foreground">{s.subtitle}</p></div><span className="text-sm font-semibold">{s.minutes} menit</span></div>)}</div>
        <div className="mt-5 rounded-xl bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">Skor JLPT resmi menggunakan scaled score, sehingga hasil simulasi ENO JAPAN hanya merupakan estimasi latihan, bukan nilai resmi JLPT.</div>
        <Button className="mt-6 w-full" size="lg" onClick={() => setStarted(true)}>Mulai Simulasi {level}<ArrowRight className="ml-2 size-4" /></Button>
      </CardContent></Card>
    </div>
  </AppShell>;

  if (query.isLoading) return <AppShell title={`JLPT ${level}`}><p className="text-sm text-muted-foreground">Memuat bagian ujian…</p></AppShell>;
  if (query.error) return <AppShell title={`JLPT ${level}`}><Card><CardContent className="py-10 text-center"><p className="text-sm text-destructive">Soal belum dapat dimuat.</p><Button asChild className="mt-4"><Link to="/simulasi">Kembali</Link></Button></CardContent></Card></AppShell>;
  if (!sectionQuestions.length) return <AppShell title={`JLPT ${level}`}><Card><CardContent className="py-10 text-center"><p className="text-sm text-muted-foreground">Belum ada soal untuk bagian ini.</p><Button asChild className="mt-4"><Link to="/simulasi">Kembali</Link></Button></CardContent></Card></AppShell>;

  if (finished) {
    const allAnswered = Object.keys(answers).length;
    const allCorrect = sectionQuestions.reduce((n, q) => n + (answers[q.id] === q.correct_index ? 1 : 0), 0);
    const percentage = sectionQuestions.length ? Math.round(allCorrect / sectionQuestions.length * 100) : 0;
    return <AppShell title="Hasil Simulasi" description={`JLPT ${level}`}>
      <div className="mx-auto max-w-2xl"><Card><CardContent className="p-7 sm:p-9">
        <div className="text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Check className="size-7" /></div><p className="mt-4 text-xs text-muted-foreground">Simulasi JLPT {level} selesai</p><p className="mt-1 text-4xl font-bold">{percentage}%</p><p className="mt-2 text-sm text-muted-foreground">Estimasi latihan · {allCorrect} benar dari {sectionQuestions.length} soal yang tersedia</p></div>
        <div className="mt-7 space-y-2">{sections.map((s, i) => <div key={s.key} className="flex items-center justify-between rounded-xl border p-4"><div><p className="text-sm font-semibold">Bagian {i + 1} · {s.subtitle}</p><p className="text-xs text-muted-foreground">{s.minutes} menit</p></div><Badge variant="secondary">{i === sectionIndex ? allCorrect : "Tersimpan"}</Badge></div>)}</div>
        <div className="mt-5 grid grid-cols-2 gap-2"><div className="rounded-xl bg-muted/40 p-4"><p className="text-lg font-semibold">{allAnswered}</p><p className="text-xs text-muted-foreground">Terjawab</p></div><div className="rounded-xl bg-muted/40 p-4"><p className="text-lg font-semibold">{saving ? "…" : "Tersimpan"}</p><p className="text-xs text-muted-foreground">Progress</p></div></div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row"><Button asChild className="flex-1"><Link to="/simulasi"><ArrowLeft className="mr-1 size-4" />Pilih level lain</Link></Button><Button variant="outline" className="flex-1" onClick={() => window.location.reload()}><RotateCcw className="mr-1 size-4" />Ulangi</Button></div>
      </CardContent></Card></div>
    </AppShell>;
  }

  const progress = sectionQuestions.length ? ((index + 1) / sectionQuestions.length) * 100 : 0;
  const timerUrgent = seconds <= 60;
  const sectionScore = scoreBySection.find(s => s.key === section.key);

  return <AppShell title={`JLPT ${level}`} description={`${section.subtitle} · Bagian ${sectionIndex + 1} dari ${sections.length}`}>
    <div className="mx-auto max-w-3xl pb-8">
      <div className="mb-4 rounded-xl border bg-card p-3 text-xs"><div className="flex items-center justify-between gap-3"><span className="font-semibold">Bagian {sectionIndex + 1} / {sections.length}</span><span className={`inline-flex items-center gap-1.5 font-semibold ${timerUrgent ? "text-destructive" : "text-muted-foreground"}`}><Clock3 className="size-3.5" />{timer}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div></div>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{sections.map((s, i) => { const Icon = s.icon; return <div key={s.key} className={`rounded-xl border p-3 ${i === sectionIndex ? "border-primary bg-primary/5" : "bg-card"}`}><div className="flex items-center gap-2"><Icon className="size-4 text-primary" /><span className="text-[11px] font-semibold">{s.subtitle}</span></div><p className="mt-1 text-[10px] text-muted-foreground">{s.minutes} menit</p></div>; })}</div>
      <Card className="mb-4 shadow-none"><CardContent className="p-4"><div className="flex items-center justify-between text-xs text-muted-foreground"><span>Soal {index + 1} dari {sectionQuestions.length}</span><span>{answered}/{sectionQuestions.length} dijawab</span></div><div className="mt-3 flex flex-wrap gap-1.5">{sectionQuestions.map((question, i) => <button key={question.id} type="button" onClick={() => setIndex(i)} aria-label={`Buka soal ${i + 1}`} className={`grid size-8 place-items-center rounded-lg border text-xs font-medium ${i === index ? "border-primary bg-primary text-primary-foreground" : answers[question.id] !== undefined ? "border-primary/30 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>{i + 1}</button>)}</div></CardContent></Card>
      <Card><CardContent className="p-5 sm:p-7"><div className="mb-5 flex items-center justify-between"><Badge variant="secondary">{section.title}</Badge>{selected !== undefined ? <span className="inline-flex items-center gap-1 text-xs text-primary"><Flag className="size-3.5" />Sudah dijawab</span> : <span className="text-xs text-muted-foreground">Belum dijawab</span>}</div><h2 className="text-base font-semibold leading-7 sm:text-lg">{current.prompt}</h2>{current.prompt_note && <p className="mt-2 text-xs text-muted-foreground">{current.prompt_note}</p>}<div className="mt-6 space-y-2.5">{current.choices.map((choice, i) => <button key={`${current.id}-${i}`} type="button" onClick={() => chooseAnswer(i)} className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition ${selected === i ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:bg-muted/40"}`}><span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold">{String.fromCharCode(65 + i)}</span><span className="pt-0.5">{choice}</span></button>)}</div><div className="mt-7 flex items-center justify-between gap-2 border-t pt-4"><Button variant="outline" disabled={index === 0 || sectionFinished} onClick={() => setIndex(v => v - 1)}><ArrowLeft className="mr-1 size-4" />Sebelumnya</Button>{index === sectionQuestions.length - 1 ? <Button onClick={() => void finishSection()}><Check className="mr-1 size-4" />Selesaikan Bagian</Button> : <Button onClick={() => setIndex(v => v + 1)} disabled={selected === undefined}>Berikutnya<ArrowRight className="ml-1 size-4" /></Button>}</div>{index === sectionQuestions.length - 1 && <p className="mt-3 text-center text-[11px] text-muted-foreground">Bagian ini memiliki batas waktu {section.minutes} menit. Setelah dikumpulkan, kamu masuk ke bagian berikutnya.</p>}</CardContent></Card>
      {sectionFinished && sectionIndex < sections.length - 1 && <Card className="mt-4 border-primary/20"><CardContent className="p-5"><p className="text-sm font-semibold">Bagian selesai</p><p className="mt-1 text-xs text-muted-foreground">Jawaban bagian ini sudah dikunci. Lanjut ke bagian berikutnya.</p><Button className="mt-4" onClick={nextSection}>Lanjut ke {sections[sectionIndex + 1].subtitle}<ArrowRight className="ml-1 size-4" /></Button></CardContent></Card>}
      {sectionScore && <p className="mt-4 text-center text-[10px] text-muted-foreground">Skor akhir akan ditampilkan setelah semua bagian selesai.</p>}
    </div>
  </AppShell>;
}
