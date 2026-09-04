import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Volume2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchVocabList, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";

export const Route = createFileRoute("/_authenticated/kotoba")({ component: KotobaPage });

type VocabRow = {
  id: string;
  term: string;
  reading: string | null;
  romaji: string | null;
  meaning_id: string | null;
  meaning_en?: string | null;
  part_of_speech: string | null;
  examples: unknown;
  level: Level;
  source_book?: string | null;
  lesson_number?: number | null;
  lesson_title?: string | null;
};

function Furigana({ term, reading }: { term: string; reading?: string | null }) {
  const chars = Array.from(term);
  const kanaOnly = chars.length > 0 && chars.every((char) => /[ぁ-ゖァ-ヺー]/u.test(char));
  if (kanaOnly || !reading?.trim()) return <span>{term}</span>;
  return <ruby>{term}<rt className="font-jp text-[0.42em] font-medium leading-none text-muted-foreground">{reading}</rt></ruby>;
}

function KotobaPage() {
  const { data: targetLevel, isLoading: levelLoading, error: levelError } = useQuery({ queryKey: ["target-level"], queryFn: fetchTargetLevel, retry: 1 });
  const level: Level = targetLevel ?? "N5";
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [learned, setLearned] = useState<Record<string, boolean>>({});
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({ queryKey: ["vocab", level], queryFn: () => fetchVocabList(level), enabled: !!targetLevel, retry: 1 });
  const allCards = (data ?? []) as VocabRow[];
  const lessons = useMemo(() => [...new Set(allCards.map((x) => x.lesson_number).filter((n): n is number => typeof n === "number"))].sort((a, b) => a - b), [allCards]);

  useEffect(() => {
    if (!lessons.length) return;
    setSelectedLesson((current) => current && lessons.includes(current) ? current : lessons[0]);
    setIndex(0);
  }, [level, lessons.join(",")]);

  const cards = selectedLesson == null ? allCards : allCards.filter((x) => x.lesson_number === selectedLesson);
  const item = cards[index];
  const examples = item ? asExamples(item.examples).slice(0, 3) : [];

  const mutation = useMutation({
    mutationFn: (id: string) => markItemLearned({ itemType: "vocabulary", itemId: id, level }),
    onSuccess: (_, id) => {
      setLearned((x) => ({ ...x, [id]: true }));
      void qc.invalidateQueries({ queryKey: ["my-progress"] });
    },
  });

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  return (
    <AppShell title="言葉 · Kotoba" description={`Kosakata JLPT ${level}, disusun per pelajaran.`} backTo="/belajar" backLabel="Belajar">
      {levelLoading ? <p className="mt-8 text-center text-sm text-muted-foreground">Memuat level belajar…</p> : levelError ? <p className="mt-8 text-center text-sm text-destructive">Level profil tidak dapat dimuat.</p> : <div className="mx-auto max-w-3xl space-y-4">
        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Materi tersedia</p>
              <p className="mt-0.5 text-lg font-bold">{allCards.length} Kotoba · {lessons.length} pelajaran</p>
            </div>
            <Badge>{level}</Badge>
          </div>
          {lessons.length > 0 && <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {lessons.map((lesson) => {
              const count = allCards.filter((x) => x.lesson_number === lesson).length;
              const active = selectedLesson === lesson;
              return <Button key={lesson} type="button" size="sm" variant={active ? "default" : "outline"} className="shrink-0 rounded-full" onClick={() => { setSelectedLesson(lesson); setIndex(0); }}>Bab {lesson} <span className="ml-1 opacity-70">({count})</span></Button>;
            })}
          </div>}
        </section>

        {error && <p className="text-sm text-destructive">Kosakata gagal dimuat. Silakan coba lagi.</p>}
        {isLoading && <p className="py-8 text-center text-xs text-muted-foreground">Memuat materi…</p>}

        {item && <>
          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
            <span>Bab {item.lesson_number ?? "—"}{item.lesson_title ? ` · ${item.lesson_title}` : ""}</span>
            <span>{index + 1} / {cards.length}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${cards.length ? ((index + 1) / cards.length) * 100 : 0}%` }} /></div>

          <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
            <CardContent className="p-0">
              <div className="px-6 pb-7 pt-8 text-center sm:px-10">
                <div className="mb-5 flex justify-center gap-2"><Badge variant="outline">KOTOBA</Badge><Badge variant="secondary">{item.part_of_speech || "Kosakata"}</Badge></div>
                <div lang="ja" className="font-jp text-5xl font-bold tracking-wide sm:text-7xl"><Furigana term={item.term} reading={item.reading} /></div>
                {item.romaji && <p className="mt-3 text-base italic text-muted-foreground">{item.romaji}</p>}
                <p className="mt-5 text-2xl font-bold tracking-tight">{item.meaning_id?.trim() || "Arti Indonesia belum tersedia."}</p>
                <Button type="button" variant="outline" size="sm" className="mt-5 rounded-full px-5" onClick={() => speak(item.term)}><Volume2 className="mr-2 size-4" />Dengarkan</Button>
              </div>

              <div className="space-y-5 border-t bg-muted/20 p-5 sm:p-7">
                <section className="rounded-2xl border bg-background p-5">
                  <h2 className="text-sm font-bold">Sumber materi</h2>
                  <div className="mt-3 space-y-1 text-sm leading-6 text-muted-foreground">
                    <p>{item.source_book || "Sumber belum dicatat"}</p>
                    <p>{typeof item.lesson_number === "number" ? `Bab ${item.lesson_number}` : "Bab belum dicatat"}{item.lesson_title ? ` · ${item.lesson_title}` : ""}</p>
                  </div>
                </section>

                <section className="rounded-2xl border bg-background p-5">
                  <h2 className="text-sm font-bold">Contoh kalimat</h2>
                  <div className="mt-4 space-y-3">
                    {examples.length > 0 ? examples.map((example, i) => <div key={`${example.jp}-${i}`} className="rounded-xl border p-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1">{example.jp && <p lang="ja" className="font-jp text-lg leading-8">{example.jp}</p>}{example.reading && <p lang="ja" className="mt-1 text-xs text-muted-foreground">{example.reading}</p>}{example.id && <p className="mt-2 text-sm leading-6">{example.id}</p>}</div>{example.jp && <Button type="button" size="icon" variant="ghost" className="shrink-0" aria-label="Dengarkan contoh" onClick={() => speak(example.jp!)}><Volume2 className="size-4" /></Button>}</div></div>) : <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">Belum ada contoh kalimat yang tersimpan untuk kosakata ini.</div>}
                  </div>
                </section>
              </div>

              <div className="mx-4 mb-3 mt-4 sm:mx-5">
                <Button type="button" variant={learned[item.id] ? "secondary" : "outline"} onClick={() => mutation.mutate(item.id)} disabled={!!learned[item.id]} className="h-11 w-full rounded-xl font-semibold">
                  {learned[item.id] ? <><Check className="mr-2 size-4" />Sudah dipelajari</> : "Tandai sudah dipelajari"}
                </Button>
              </div>

              <div className="mx-4 mb-4 rounded-2xl border bg-muted/30 p-2 sm:mx-5 sm:mb-5 sm:p-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="h-12 rounded-xl"><ArrowLeft className="mr-2 size-4" />Sebelumnya</Button>
                  <Button type="button" onClick={() => setIndex((i) => Math.min(cards.length - 1, i + 1))} disabled={index === cards.length - 1} className="h-12 rounded-xl">Berikutnya<ArrowRight className="ml-2 size-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>}

        {!isLoading && !allCards.length && <p className="py-8 text-center text-sm text-muted-foreground">Belum ada Kotoba untuk {level}.</p>}
      </div>}
    </AppShell>
  );
}
