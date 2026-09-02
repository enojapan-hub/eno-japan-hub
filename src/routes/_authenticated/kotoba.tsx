import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Volume2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchVocabList, markItemLearned, asExamples, type Level, type Example } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/kotoba")({ component: KotobaPage });

type LocalCard = { id: string; term: string; reading: string; romaji: string; meaning_id: string; part_of_speech: string; examples: Array<{ jp: string; id: string; reading?: string }>; explanation?: string | null; level: Level; sort_order: number };

const FALLBACK_KOTOBA: LocalCard[] = [{ id: "fallback-taberu", term: "食べる", reading: "たべる", romaji: "Taberu", meaning_id: "Makan", part_of_speech: "Kata kerja", examples: [{ jp: "毎朝、ご飯を食べます。", id: "Setiap pagi, saya makan nasi." }, { jp: "一緒に昼ご飯を食べませんか。", id: "Maukah makan siang bersama?" }, { jp: "日本料理を食べてみたいです。", id: "Saya ingin mencoba makanan Jepang." }], explanation: "食べる berarti makan, yaitu memasukkan makanan ke dalam mulut dan mengonsumsinya. Kata ini digunakan untuk makanan dan minuman tertentu sesuai konteks, dan bentuknya berubah menjadi 食べます, 食べない, 食べた, atau 食べて untuk mengikuti pola kalimat." , level: "N5", sort_order: 1 }];

function Furigana({ term, reading }: { term: string; reading: string }) {
  const chars = Array.from(term);
  const kanaOnly = chars.length > 0 && chars.every(char => /[ぁ-ゖァ-ヺー]/u.test(char));
  if (kanaOnly) return <span>{term}</span>;
  return <ruby>{term}<rt className="font-jp text-[0.42em] font-medium leading-none text-muted-foreground">{reading}</rt></ruby>;
}

function KotobaPage() {
  const { data: targetLevel } = useQuery({ queryKey: ["target-level"], queryFn: fetchTargetLevel, retry: 1 });
  const level: Level = targetLevel ?? "N5";
  const [index, setIndex] = useState(0); const [learned, setLearned] = useState<Record<string, boolean>>({}); const [generatedExamples, setGeneratedExamples] = useState<Record<string, Example[]>>({}); const [generatedExplanations, setGeneratedExplanations] = useState<Record<string, string>>({}); const [generating, setGenerating] = useState(false); const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["vocab", level], queryFn: () => fetchVocabList(level), retry: 1 });
  useEffect(() => setIndex(0), [level]);
  const mutation = useMutation({ mutationFn: (id: string) => markItemLearned({ itemType: "vocabulary", itemId: id, level }), onSuccess: (_, id) => { setLearned(x => ({ ...x, [id]: true })); void qc.invalidateQueries({ queryKey: ["my-progress"] }); } });
  const cards: LocalCard[] = data?.length ? (data as LocalCard[]) : FALLBACK_KOTOBA; const item = cards[index] ?? cards[0]; const storedExamples = asExamples(item.examples); const examples = (generatedExamples[item.id] ?? storedExamples).filter(x => x.jp || x.id).slice(0, 3);
  const storedExplanation = typeof item.explanation === "string" ? item.explanation.trim() : "";
  const explanation = generatedExplanations[item.id] ?? storedExplanation;
  useEffect(() => {
    let cancelled = false;
    async function ensureContent() {
      if (!item || item.id.startsWith("fallback-") || (storedExamples.length >= 3 && storedExplanation) || generatedExamples[item.id] || generatedExplanations[item.id]) return;
      setGenerating(true);
      try {
        const { data: session } = await supabase.auth.getSession(); const token = session.session?.access_token; if (!token) return;
        const response = await fetch("/api/kotoba/examples", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) });
        if (!response.ok) return;
        const result = await response.json() as { examples?: Example[]; explanation?: string };
        if (!cancelled) { if (result.examples?.length) setGeneratedExamples(x => ({ ...x, [item.id]: result.examples! })); if (result.explanation) setGeneratedExplanations(x => ({ ...x, [item.id]: result.explanation! })); }
      } finally { if (!cancelled) setGenerating(false); }
    }
    void ensureContent(); return () => { cancelled = true; };
  }, [item?.id, storedExamples.length, storedExplanation, generatedExamples, generatedExplanations]);
  const speak = (text: string) => { if (!window.speechSynthesis) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "ja-JP"; u.rate = 0.85; window.speechSynthesis.speak(u); };
  return (
    <AppShell title="Kotoba" description="Pelajari kosakata Jepang dengan arti, cara baca, contoh kalimat, dan penjelasan penggunaan." backTo="/belajar" backLabel="Belajar">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground"><span>Kosakata {index + 1} dari {cards.length}</span><Badge variant="secondary">{item.level}</Badge></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((index + 1) / cards.length) * 100}%` }} /></div>
        <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm"><CardContent className="p-0">
          <div className="px-6 pb-7 pt-8 text-center sm:px-10"><div className="mb-5 flex justify-center gap-2"><Badge variant="outline">KOTOBA</Badge><Badge variant="secondary">{item.part_of_speech || "Kosakata"}</Badge></div><div lang="ja" className="font-jp text-6xl font-bold tracking-wide sm:text-7xl"><Furigana term={item.term} reading={item.reading} /></div><p className="mt-3 text-base italic text-muted-foreground">{item.romaji}</p><p className="mt-5 text-2xl font-bold tracking-tight">{item.meaning_id}</p><Button type="button" variant="outline" size="sm" className="mt-5 rounded-full px-5" onClick={() => speak(item.term)}><Volume2 className="mr-2 size-4" />Dengarkan</Button></div>
          <div className="space-y-5 border-t bg-muted/20 p-5 sm:p-7">
            <section className="rounded-2xl border bg-background p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-bold">Penjelasan</h2>{generating && !explanation && <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="size-3.5 animate-pulse" />Membuat penjelasan...</span>}</div><p className="mt-3 text-sm leading-7 text-muted-foreground">{explanation || "Penjelasan sedang dibuat berdasarkan arti dan penggunaan kosakata ini."}</p></section>
            <section className="rounded-2xl border bg-background p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-bold">Contoh kalimat</h2>{generating && <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="size-3.5 animate-pulse" />Membuat contoh...</span>}</div><div className="mt-4 space-y-3">{examples.length > 0 ? examples.map((example, i) => <div key={`${example.jp}-${i}`} className="rounded-xl border p-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p lang="ja" className="font-jp text-lg leading-8">{example.jp}</p>{example.reading && <p lang="ja" className="mt-1 text-xs text-muted-foreground">{example.reading}</p>}<p className="mt-2 text-sm leading-6">{example.id}</p></div>{example.jp && <Button type="button" size="icon" variant="ghost" className="shrink-0" aria-label="Dengarkan contoh" onClick={() => speak(example.jp!)}><Volume2 className="size-4" /></Button>}</div></div>) : <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">Contoh kalimat sedang dibuat secara otomatis.</div>}</div></section>
            <section className="rounded-2xl border bg-background p-5"><h2 className="text-sm font-bold">Cocok digunakan dalam konteks</h2><div className="mt-3 flex flex-wrap gap-2 text-xs">{["Percakapan sehari-hari", "Pekerjaan", "Sekolah", `JLPT ${item.level}`].map(x => <span key={x} className="rounded-full bg-muted px-3 py-1.5 text-muted-foreground">{x}</span>)}</div></section>
          </div>
          <div className="rounded-2xl border bg-muted/30 p-2 m-4 sm:m-5 sm:p-2.5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0} className="h-12 rounded-xl px-3 font-semibold sm:px-5"><ArrowLeft className="mr-2 size-4" strokeWidth={2.25} /><span>Sebelumnya</span></Button>
              <Button type="button" variant={learned[item.id] ? "secondary" : "outline"} onClick={() => item.id.startsWith("fallback-") ? undefined : mutation.mutate(item.id)} disabled={!!learned[item.id] || item.id.startsWith("fallback-")} className="h-12 min-w-12 rounded-xl px-3 font-semibold" aria-label={learned[item.id] ? "Sudah dipelajari" : "Tandai sudah dipelajari"}>{learned[item.id] ? <Check className="size-5" strokeWidth={2.25} /> : <span className="text-xs sm:text-sm">Pelajari</span>}</Button>
              <Button type="button" onClick={() => setIndex(i => Math.min(cards.length - 1, i + 1))} disabled={index === cards.length - 1} className="h-12 rounded-xl px-3 font-semibold shadow-sm sm:px-5"><span>Berikutnya</span><ArrowRight className="ml-2 size-4" strokeWidth={2.25} /></Button>
            </div>
          </div>
        </CardContent></Card>{isLoading && <p className="text-center text-xs text-muted-foreground">Memuat materi…</p>}
      </div>
    </AppShell>
  );
}
