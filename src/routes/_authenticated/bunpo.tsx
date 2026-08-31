import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LevelTabs } from "@/components/learn/LevelTabs";
import { StudyFlashcard } from "@/components/learn/StudyFlashcard";
import { fetchGrammarList, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
export const Route = createFileRoute("/_authenticated/bunpo")({ component: BunpoPage });
function BunpoPage() {
  const [level, setLevel] = useState<Level>("N5"); const [index, setIndex] = useState(0); const [learned, setLearned] = useState<Record<string, boolean>>({}); const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["grammar", level], queryFn: () => fetchGrammarList(level) });
  const mutation = useMutation({ mutationFn: (id: string) => markItemLearned({ itemType: "grammar", itemId: id, level }), onSuccess: (_, id) => { setLearned(x => ({ ...x, [id]: true })); void qc.invalidateQueries({ queryKey: ["my-progress"] }); } });
  const cards = data ?? []; const item = cards[index]; const examples = item ? asExamples(item.examples) : [];
  return <AppShell title="文法 · Bunpō" description="Tata bahasa N5–N1 dalam kartu belajar: pola, arti, struktur, penjelasan, dan contoh." backTo="/belajar" backLabel="Belajar">
    <LevelTabs value={level} onChange={v => { setLevel(v); setIndex(0); }} />
    {error && <p className="mt-5 text-sm text-destructive">Gagal memuat tata bahasa. Coba refresh.</p>}
    {isLoading && <p className="mt-8 text-center text-sm text-muted-foreground">Memuat pola tata bahasa…</p>}
    {item && <div className="mt-6"><StudyFlashcard index={index} total={cards.length} level={item.level} title={item.pattern} meaning={item.meaning_id || item.meaning_en || "Arti belum tersedia"} secondary={item.explanation_en && !item.explanation_id ? item.explanation_en : null} structure={item.structure} explanation={item.explanation_id || item.explanation_en} examples={examples} learned={!!learned[item.id]} onLearned={() => mutation.mutate(item.id)} onPrev={() => setIndex(i => Math.max(0, i - 1))} onNext={() => setIndex(i => Math.min(cards.length - 1, i + 1))} /></div>}
    {!isLoading && !cards.length && <p className="mt-8 text-center text-sm text-muted-foreground">Belum ada pola tata bahasa terbit untuk {level}.</p>}
  </AppShell>;
}
