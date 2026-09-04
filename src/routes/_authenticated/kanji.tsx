import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StudyFlashcard } from "@/components/learn/StudyFlashcard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchKanjiList, fetchKanjiStudy, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/kanji")({ component: KanjiPage });

type KanjiRow = {
  id: string;
  character: string;
  level: Level;
  onyomi: string[] | null;
  kunyomi: string[] | null;
  meaning_id: string | null;
  stroke_count?: number | null;
  source_book?: string | null;
  lesson_number?: number | null;
  lesson_title?: string | null;
};

function KanjiPage() {
  const { data: targetLevel, isLoading: levelLoading, error: levelError } = useQuery({ queryKey: ["target-level"], queryFn: fetchTargetLevel });
  const level: Level = targetLevel ?? "N5";
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [learned, setLearned] = useState<Record<string, boolean>>({});
  const [furigana, setFurigana] = useState(true);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({ queryKey: ["kanji", level], queryFn: () => fetchKanjiList(level), enabled: !!targetLevel });
  const allCards = (data ?? []) as KanjiRow[];
  const lessons = useMemo(() => [...new Set(allCards.map((x) => x.lesson_number).filter((n): n is number => typeof n === "number"))].sort((a, b) => a - b), [allCards]);

  useEffect(() => {
    if (!lessons.length) return;
    setSelectedLesson((current) => current && lessons.includes(current) ? current : lessons[0]);
    setIndex(0);
  }, [level, lessons.join(",")]);

  const cards = selectedLesson == null ? allCards : allCards.filter((x) => x.lesson_number === selectedLesson);
  const item = cards[index];
  const { data: study } = useQuery({ queryKey: ["kanji-study", item?.id], queryFn: () => fetchKanjiStudy(item!.id), enabled: !!item?.id });

  useQuery({
    queryKey: ["furigana-setting"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return true;
      const { data } = await supabase.from("user_settings").select("furigana_enabled").eq("user_id", u.user.id).maybeSingle();
      const enabled = data?.furigana_enabled ?? true;
      setFurigana(enabled);
      return enabled;
    },
  });

  const mutation = useMutation({
    mutationFn: (id: string) => markItemLearned({ itemType: "kanji", itemId: id, level }),
    onSuccess: (_, id) => {
      setLearned((x) => ({ ...x, [id]: true }));
      void qc.invalidateQueries({ queryKey: ["my-progress"] });
    },
  });

  const meaning = typeof item?.meaning_id === "string" && item.meaning_id.trim() ? item.meaning_id.trim() : "Arti Indonesia belum tersedia.";
  const examples = asExamples(study?.examples);
  const reading = [...(item?.onyomi ?? []), ...(item?.kunyomi ?? [])].join("・");
  const relatedWords = (study?.relatedWords ?? []) as Array<{ term: string; reading?: string | null; meaning?: string | null; example?: string | null }>;

  return (
    <AppShell title="漢字 · Kanji" description={`Materi Kanji JLPT ${level}, disusun per pelajaran.`} backTo="/belajar" backLabel="Belajar">
      {levelLoading ? <p className="mt-8 text-center">Memuat level belajar…</p> : levelError ? <p className="mt-8 text-center text-destructive">Level profil tidak dapat dimuat. Silakan coba lagi.</p> : <>
        <div className="mx-auto max-w-3xl space-y-4">
          <section className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Materi tersedia</p>
                <p className="mt-0.5 text-lg font-bold">{allCards.length} Kanji · {lessons.length} pelajaran</p>
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

          <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
            <div>
              <p className="text-sm font-medium">Furigana / bacaan</p>
              <p className="text-xs text-muted-foreground">Bacaan kanji dapat ditampilkan atau disembunyikan.</p>
            </div>
            <button type="button" className="rounded-full border px-3 py-1 text-sm" onClick={() => setFurigana((v) => !v)}>{furigana ? "Aktif" : "Mati"}</button>
          </div>

          {error && <p className="text-sm text-destructive">Gagal memuat materi Kanji. Silakan coba lagi.</p>}
          {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Memuat materi…</p>}

          {item && <div>
            <div className="mb-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
              <span>Bab {item.lesson_number ?? "—"}{item.lesson_title ? ` · ${item.lesson_title}` : ""}</span>
              <span>{index + 1} / {cards.length}</span>
            </div>
            <StudyFlashcard
              index={index}
              total={cards.length}
              level={item.level}
              title={item.character}
              reading={furigana ? reading : null}
              meaning={meaning}
              onyomi={item.onyomi ?? []}
              kunyomi={item.kunyomi ?? []}
              relatedWords={relatedWords}
              examples={examples}
              furiganaEnabled={furigana}
              kanjiMode
              question={null}
              learned={!!learned[item.id]}
              onLearned={() => mutation.mutate(item.id)}
              onPrev={() => setIndex((i) => Math.max(0, i - 1))}
              onNext={() => setIndex((i) => Math.min(cards.length - 1, i + 1))}
            />
          </div>}

          {!isLoading && !allCards.length && <p className="py-8 text-center text-sm text-muted-foreground">Belum ada Kanji untuk {level}.</p>}
        </div>
      </>}
    </AppShell>
  );
}
