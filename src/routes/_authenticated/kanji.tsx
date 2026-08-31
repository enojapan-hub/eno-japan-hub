import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LevelTabs } from "@/components/learn/LevelTabs";
import { StudyFlashcard } from "@/components/learn/StudyFlashcard";
import { fetchKanjiList, markItemLearned, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/kanji")({ component: KanjiPage });
function KanjiPage() {
  const [level, setLevel] = useState<Level>("N5"); const [index, setIndex] = useState(0); const [learned, setLearned] = useState<Record<string, boolean>>({}); const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["kanji", level], queryFn: () => fetchKanjiList(level) });
  const mutation = useMutation({ mutationFn: (id: string) => markItemLearned({ itemType: "kanji", itemId: id, level }), onSuccess: (_, id) => { setLearned(x => ({ ...x, [id]: true })); void qc.invalidateQueries({ queryKey: ["my-progress"] }); } });
  const cards = data ?? []; const item = cards[index];
  return <AppShell title="漢字 · Kanji" description="Belajar kanji dengan kartu interaktif: arti, bacaan, contoh, dan penjelasan." backTo="/belajar" backLabel="Belajar">
    <LevelTabs value={level} onChange={v => { setLevel(v); setIndex(0); }} />
    {error && <p className="mt-5 text-sm text-destructive">Gagal memuat kanji. Coba refresh.</p>}
    {isLoading && <p className="mt-8 text-center text-sm text-muted-foreground">Memuat materi…</p>}
    {item && <div className="mt-6"><StudyFlashcard index={index} total={cards.length} level={item.level} title={item.character} reading={[...(item.onyomi ?? []), ...(item.kunyomi ?? [])].join("・")} meaning={item.meaning_id || item.meaning_en || "Arti belum tersedia"} secondary={item.stroke_count ? `${item.stroke_count} coretan` : null} explanation="Perhatikan bentuk kanji, bacaannya, arti utamanya, lalu gunakan contoh untuk memahami konteks pemakaian." examples={[]} learned={!!learned[item.id]} onLearned={() => mutation.mutate(item.id)} onPrev={() => setIndex(i => Math.max(0, i - 1))} onNext={() => setIndex(i => Math.min(cards.length - 1, i + 1))} /></div>}
    {!isLoading && !cards.length && <p className="mt-8 text-center text-sm text-muted-foreground">Belum ada kanji terbit untuk {level}.</p>}
  </AppShell>;
}
