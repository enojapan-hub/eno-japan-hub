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

export function StudyFlashcard({ index, total, level, title, reading, meaning, secondary, structure, explanation, examples, question, onPrev, onNext, onLearned, learned }: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const progress = total ? Math.round(((index + 1) / total) * 100) : 0;
  const usableExamples = (examples ?? []).filter((x) => x.jp || x.id || x.reading).slice(0, 5);

  useEffect(() => { setShowAnswer(false); setSelected(null); window.speechSynthesis?.cancel(); }, [index, title]);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP"; utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  return <div className="mx-auto max-w-2xl">
    <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground"><span>Kartu {index + 1} dari {total}</span><span>{progress}%</span></div>
    <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} /></div>
    <Card className="overflow-hidden border-primary/20 shadow-lg">
      <CardHeader className="space-y-4 bg-gradient-to-br from-primary/10 via-background to-secondary/20 pb-7 text-center">
        <div className="flex justify-center"><Badge variant="secondary">{level}</Badge></div>
        <div lang="ja" className="font-jp text-5xl font-bold tracking-wide sm:text-6xl">{title}</div>
        {reading && <div lang="ja" className="text-base text-muted-foreground">{reading}</div>}
        <p className="text-lg font-semibold">{meaning}</p>
        {secondary && <p className="text-sm text-muted-foreground">{secondary}</p>}
        <div className="flex justify-center"><Button type="button" variant="outline" size="sm" onClick={() => speak(`${title}${reading ? ` ${reading}` : ""}`)}>🔊 Dengarkan</Button></div>
      </CardHeader>
      <CardContent className="space-y-4 p-5 sm:p-7">
        <Button className="w-full" variant={showAnswer ? "secondary" : "default"} onClick={() => setShowAnswer(v => !v)}>{showAnswer ? "Tutup penjelasan" : "Buka penjelasan lengkap"}</Button>
        {showAnswer && <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
          {structure && <section className="rounded-xl border bg-muted/40 p-4"><p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">STRUKTUR</p><p lang="ja" className="font-jp text-lg">{structure}</p></section>}
          {explanation && <section className="rounded-xl border bg-muted/40 p-4"><p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">PENJELASAN</p><p className="leading-7">{explanation}</p></section>}
          {usableExamples.length > 0 && <section className="rounded-xl border bg-muted/40 p-4"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold tracking-wide text-muted-foreground">CONTOH PENGGUNAAN</p><Badge variant="outline">{usableExamples.length} contoh</Badge></div><div className="space-y-4">{usableExamples.map((example, i) => <div key={`${example.jp ?? "example"}-${i}`} className="rounded-lg border bg-background/70 p-3">{example.jp && <div className="flex items-start gap-2"><p lang="ja" className="flex-1 font-jp text-lg leading-8">{example.jp}</p><Button type="button" size="icon" variant="ghost" aria-label="Dengarkan contoh" onClick={() => speak(example.jp!)}>🔊</Button></div>}{example.reading && <p lang="ja" className="mt-1 text-sm text-muted-foreground">{example.reading}</p>}{example.id && <p className="mt-2 text-sm leading-6">{example.id}</p>}</div>)}</div></section>}
          {question && <section className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="mb-2 text-xs font-semibold tracking-wide text-primary">CEK PEMAHAMAN</p><p className="mb-3 font-medium">{question.prompt}</p><div className="grid gap-2">{question.choices.map((choice, i) => <Button key={`${choice}-${i}`} variant={selected === i ? (i === question.correctIndex ? "secondary" : "destructive") : "outline"} className="justify-start whitespace-normal text-left" onClick={() => setSelected(i)}>{String.fromCharCode(65 + i)}. {choice}</Button>)}</div>{selected !== null && <div className="mt-3 rounded-lg bg-background/80 p-3 text-sm leading-6">{selected === question.correctIndex ? <p className="font-medium">✓ Benar. Bagus, lanjutkan ke kartu berikutnya.</p> : <p className="font-medium">✗ Belum tepat. Jawaban yang benar: {String.fromCharCode(65 + question.correctIndex)}. Baca kembali penjelasan di atas.</p>}</div>}</section>}
        </div>}
        <div className="flex flex-wrap gap-2"><Button variant="outline" className="flex-1" onClick={onPrev} disabled={index === 0}>← Sebelumnya</Button>{onLearned && <Button variant={learned ? "secondary" : "outline"} onClick={onLearned}>{learned ? "✓ Dipelajari" : "Tandai dipelajari"}</Button>}<Button className="flex-1" onClick={onNext} disabled={index === total - 1}>Berikutnya →</Button></div>
      </CardContent>
    </Card>
  </div>;
}
