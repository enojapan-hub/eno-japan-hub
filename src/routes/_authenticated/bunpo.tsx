import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, BookOpen, Check, ChevronRight, Info, ListTree, Volume2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetchGrammarList, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";

export const Route = createFileRoute("/_authenticated/bunpo")({ component: BunpoPage });

function splitStructure(value?: string | null) {
  if (!value?.trim()) return [];
  return value
    .split(/\n|\\n|;/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isUsableIndonesian(value?: string | null, english?: string | null) {
  const id = value?.trim() ?? "";
  const en = english?.trim() ?? "";
  if (!id) return false;
  if (en && id.toLowerCase() === en.toLowerCase()) return false;
  if (/^[a-z0-9]+(?:-[a-z0-9]+){1,}$/i.test(id)) return false;
  return true;
}

function BunpoPage() {
  const { data: targetLevel, isLoading: levelLoading, error: levelError } = useQuery({
    queryKey: ["target-level"],
    queryFn: fetchTargetLevel,
  });
  const level: Level = targetLevel ?? "N5";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [learned, setLearned] = useState<Record<string, boolean>>({});
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["grammar", level],
    queryFn: () => fetchGrammarList(level),
    enabled: !!targetLevel,
  });

  const mutation = useMutation({
    mutationFn: (id: string) => markItemLearned({ itemType: "grammar", itemId: id, level }),
    onSuccess: (_, id) => {
      setLearned((current) => ({ ...current, [id]: true }));
      void qc.invalidateQueries({ queryKey: ["my-progress"] });
    },
  });

  // Only source-backed Indonesian material is allowed to appear as finished content.
  const cards = (data ?? []).filter((card) =>
    isUsableIndonesian(card.meaning_id, card.meaning_en),
  );
  const item = cards.find((card) => card.id === selectedId) ?? null;
  const examples = item ? asExamples(item.examples) : [];
  const structures = item ? splitStructure(item.structure) : [];

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <AppShell title="文法 · Bunpō" description={`Tata bahasa JLPT ${level}`} backTo="/belajar" backLabel="Belajar">
      {levelLoading ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Memuat tingkat belajar…</p>
      ) : levelError ? (
        <p className="mt-8 text-center text-sm text-destructive">Tingkat dari profil tidak dapat dimuat.</p>
      ) : !item ? (
        <div className="mx-auto mt-5 max-w-2xl">
          <div className="mb-4 rounded-2xl border bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Tingkat belajar</p>
                <p className="mt-0.5 text-base font-bold">JLPT {level}</p>
              </div>
              <Badge className="rounded-full px-2.5 py-0.5 text-[11px]">{cards.length} pola siap</Badge>
            </div>
          </div>

          {error && <p className="mb-4 text-xs text-destructive">Tata bahasa gagal dimuat. Silakan coba lagi.</p>}

          {isLoading ? (
            <p className="py-12 text-center text-xs text-muted-foreground">Memuat materi…</p>
          ) : cards.length ? (
            <div className="space-y-2">
              {cards.map((card, index) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedId(card.id)}
                  className="group w-full rounded-xl border bg-card p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span lang="ja" className="font-jp text-lg font-bold leading-6">{card.pattern}</span>
                        <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">{level}</Badge>
                        {card.lesson_number ? <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">Pelajaran {card.lesson_number}</Badge> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{card.meaning_id}</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border bg-card p-6 text-center">
              <BookOpen className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">Materi {level} sedang dirapikan dari sumber.</p>
              <p className="mt-1 text-sm text-muted-foreground">Hanya materi berbahasa Indonesia yang sudah terverifikasi yang ditampilkan.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="mx-auto mt-5 max-w-2xl space-y-4">
          <Button type="button" variant="ghost" className="-ml-2 h-10 rounded-xl" onClick={() => setSelectedId(null)}>
            <ArrowLeft className="mr-2 size-4" />Kembali ke daftar {level}
          </Button>

          <Card className="overflow-hidden border-border/80 shadow-lg">
            <div className="border-b bg-muted/20 px-5 py-7 text-center sm:px-8">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary">{item.level}</Badge>
                {item.lesson_number ? <Badge variant="outline">Pelajaran {item.lesson_number}</Badge> : null}
              </div>
              <div lang="ja" className="mt-4 font-jp text-4xl font-bold tracking-wide sm:text-5xl">{item.pattern}</div>
              <p className="mt-4 text-lg font-semibold leading-7">{item.meaning_id}</p>
              <Button type="button" variant="outline" size="sm" className="mt-4 rounded-xl" onClick={() => speak(item.pattern)}>
                <Volume2 className="mr-2 size-4" />Dengarkan
              </Button>
            </div>

            <CardContent className="space-y-4 p-4 sm:p-6">
              {structures.length ? (
                <section className="rounded-2xl border bg-muted/20 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide"><ListTree className="size-4 text-primary" />STRUKTUR</h3>
                  <ul className="mt-4 list-disc space-y-2 pl-5 leading-7">
                    {structures.map((structure, index) => <li key={`${structure}-${index}`}>{structure}</li>)}
                  </ul>
                </section>
              ) : null}

              {item.explanation_id?.trim() ? (
                <section className="rounded-2xl border bg-muted/20 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide"><Info className="size-4 text-primary" />PENJELASAN</h3>
                  <p className="mt-4 whitespace-pre-line text-sm leading-7">{item.explanation_id}</p>
                </section>
              ) : null}

              {examples.length ? (
                <section className="rounded-2xl border bg-muted/20 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide"><BookOpen className="size-4 text-primary" />CONTOH</h3>
                  <div className="mt-4 space-y-4">
                    {examples.map((example, index) => (
                      <div key={`${example.jp ?? example.id}-${index}`} className="rounded-xl border bg-card p-4">
                        {example.jp ? <p lang="ja" className="font-jp text-base font-medium leading-8">{example.jp}</p> : null}
                        {example.reading ? <p className="mt-1 text-xs text-muted-foreground">{example.reading}</p> : null}
                        {example.id ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{example.id}</p> : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {item.source_book ? (
                <p className="text-center text-xs text-muted-foreground">Sumber: {item.source_book}{item.lesson_number ? ` · Pelajaran/Hari ${item.lesson_number}` : ""}</p>
              ) : null}

              <Button
                type="button"
                className="h-12 w-full rounded-xl"
                disabled={mutation.isPending || learned[item.id]}
                onClick={() => mutation.mutate(item.id)}
              >
                <Check className="mr-2 size-4" />{learned[item.id] ? "Sudah dipelajari" : "Tandai sudah dipelajari"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
