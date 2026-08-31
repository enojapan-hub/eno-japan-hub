import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LevelTabs } from "@/components/learn/LevelTabs";
import { StudyFlashcard } from "@/components/learn/StudyFlashcard";
import { fetchVocabList, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
export const Route = createFileRoute("/_authenticated/kotoba")({ component: KotobaPage });
function KotobaPage() {
  const [level, setLevel] = useState<Level>("N5"); const [index, setIndex] = useState(0); const [learned, setLearned] = useState<Record<string, boolean>>({}); const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["vocab", level], queryFn: () => fetchVocabList(level) });
  const mutation = useMutation({ mutationFn: (id: string) => markItemLearned({ itemType: "vocabulary", itemId: id, level }), onSuccess: (_, id) => { setLearned(x => ({ ...x, [id]: true })); void qc.invalidateQueries({ queryKey: ["my-progress"] }); } });
  const cards = data ?? []; const item = cards[index]; const examples = item ? asExamples(item.examples) : [];
  return <AppShell title="言葉 · Kotoba" description="Hafalkan kosakata melalui kartu: bacaan, arti, contoh kalimat, dan konteks penggunaan." backTo="/belajar" backLabel="Belajar">
    <LevelTabs value={level} onChange={v => { setLevel(v); setIndex(0); }} />
    {error && <p className="mt-5 text-sm text-destructive">Gagal memuat kosakata. Coba refresh.</p>}
    {isLoading && <p className="mt-8 text-center text-sm text-muted-foreground">Memuat kosakata…</p>}
    {item && <div className="mt-6"><StudyFlashcard index={index} total={cards.length} level={item.level} title={item.term} reading={item.reading} meaning={item.meaning_id || item.meaning_en || "Arti belum tersedia"} secondary={item.romaji || item.part_of_speech} explanation={`Gunakan ${item.term} sesuai konteks. Perhatikan bentuk kata, tingkat kesopanan, dan kata yang biasanya muncul bersamanya.`} examples={examples} learned={!!learned[item.id]} onLearned={() => mutation.mutate(item.id)} onPrev={() => setIndex(i => Math.max(0, i - 1))} onNext={() => setIndex(i => Math.min(cards.length - 1, i + 1))} /></div>}
    {!isLoading && !cards.length && <p className="mt-8 text-center text-sm text-muted-foreground">Belum ada kosakata terbit untuk {level}.</p>}
  </AppShell>;
}
