import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Example = { jp?: string; id?: string; reading?: string };
type Props = {
  index: number; total: number; level: string; title: string; reading?: string | null;
  meaning: string; secondary?: string | null; structure?: string | null; explanation?: string | null;
  examples?: Example[]; question?: { prompt: string; choices: string[]; correctIndex: number } | null;
  onPrev: () => void; onNext: () => void; onLearned?: () => void; learned?: boolean;
};
const sectionLabel = "text-[11px] font-semibold tracking-[0.18em] text-muted-foreground";
export function StudyFlashcard({ index, total, level, title, reading, meaning, secondary, structure, explanation, examples, question, onPrev, onNext, onLearned, learned }: Props) {
  const [showDetails, setShowDetails] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const progress = total ? Math.round(((index + 1) / total) * 100) : 0;
  const usableExamples = (examples ?? []).filter((x) => x.jp || x.id || x.reading).slice(0, 5);
  useEffect(() => { setShowDetails(true); setSelected(null); window.speechSynthesis?.cancel(); }, [index, title]);
  const speak = (text: string) => { if (!window.speechSynthesis) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "ja-JP"; u.rate = 0.85; window.speechSynthesis.speak(u); };
  return <div className="mx-auto max-w-2xl">
    <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground"><span>Materi {index + 1} dari {total}</span><span>{progress}%</span></div>
    <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} /></div>
    <Card className="overflow-hidden border-border/80 shadow-xl">
      <CardHeader className="space-y-4 bg-gradient-to-br from-primary/10 via-background to-secondary/20 px-6 py-8 text-center sm:px-8">
        <div className="flex items-center justify-center gap-2"><Badge variant="secondary">{level}</Badge><Badge variant="outline">Belajar</Badge></div>
        <div lang="ja" className="font-jp text-5xl font-bold tracking-wide sm:text-6xl">{title}</div>
        {reading && <div lang="ja" className="text-base text-muted-foreground">{reading}</div>}
        <p className="text-xl font-semibold leading-relaxed">{meaning}</p>
        {secondary && <p className="text-sm text-muted-foreground">{secondary}</p>}
        <div className="flex justify-center"><Button type="button" variant="outline" size="sm" onClick={() => speak(`${title}${reading ? ` ${reading}` : ""}`)}>🔊 Dengarkan</Button></div>
      </CardHeader>
      <CardContent className="space-y-5 p-5 sm:p-7">
        <Button className="w-full" variant="secondary" onClick={() => setShowDetails(v => !v)}>{showDetails ? "Sembunyikan penjelasan" : "Tampilkan penjelasan lengkap"}</Button>
        {showDetails && <div className="space-y-5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
          {structure && <section className="rounded-2xl border bg-muted/35 p-5"><p className={sectionLabel}>POLA / STRUKTUR</p><p lang="ja" className="mt-3 whitespace-pre-line font-jp text-lg leading-8">{structure}</p></section>}
          {explanation && <section className="rounded-2xl border bg-muted/35 p-5"><p className={sectionLabel}>PENJELASAN</p><p className="mt-3 whitespace-pre-line leading-7">{explanation}</p></section>}
          {usableExamples.length > 0 && <section className="rounded-2xl border bg-muted/35 p-5"><div className="mb-4 flex items-center justify-between"><p className={sectionLabel}>CONTOH KALIMAT</p><Badge variant="outline">{usableExamples.length} contoh</Badge></div><div className="space-y-4">{usableExamples.map((example, i) => <div key={`${example.jp ?? "contoh"}-${i}`} className="rounded-xl border bg-background p-4">{example.jp && <div className="flex items-start gap-2"><p lang="ja" className="flex-1 font-jp text-lg leading-8">{example.jp}</p><Button type="button" size="icon" variant="ghost" aria-label="Dengarkan contoh kalimat" onClick={() => speak(example.jp!)}>🔊</Button></div>}{example.reading && <p lang="ja" className="mt-1 text-sm text-muted-foreground">{example.reading}</p>}{example.id && <p className="mt-2 text-sm leading-6">{example.id}</p>}</div>)}</div></section>}
          {question && <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5"><p className={sectionLabel + " text-primary"}>CONTOH SOAL</p><p className="mt-3 font-medium leading-7">{question.prompt}</p><div className="mt-3 grid gap-2">{question.choices.map((choice, i) => <Button key={`${choice}-${i}`} type="button" variant={selected === i ? (i === question.correctIndex ? "secondary" : "destructive") : "outline"} className="h-auto justify-start whitespace-normal py-3 text-left" onClick={() => setSelected(i)}>{String.fromCharCode(65 + i)}. {choice}</Button>)}</div>{selected !== null && <div className="mt-4 rounded-xl border bg-background p-4 text-sm leading-6"><p className="font-semibold">{selected === question.correctIndex ? "✓ Jawaban benar" : "✗ Jawaban belum tepat"}</p>{selected !== question.correctIndex && <p className="mt-1">Jawaban yang benar: {String.fromCharCode(65 + question.correctIndex)}.</p>}<p className="mt-2">Perhatikan kembali pola dan contoh di atas.</p></div>}</section>}
        </div>}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><Button variant="outline" onClick={onPrev} disabled={index === 0}>← Sebelumnya</Button>{onLearned && <Button variant={learned ? "secondary" : "outline"} onClick={onLearned}>{learned ? "✓ Sudah dipelajari" : "Tandai dipelajari"}</Button>}<Button className="col-span-2 sm:col-span-1" onClick={onNext} disabled={index === total - 1}>Berikutnya →</Button></div>
      </CardContent>
    </Card>
  </div>;
}
