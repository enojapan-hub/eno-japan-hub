import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, Pause, Play, Settings2, Volume2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { fetchPassageDetail } from "@/lib/learn-queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/dokkai/$id")({ component: DokkaiDetail });
type FuriganaPassage = { body_furigana?: string | null };

function renderFurigana(text: string) {
  return text.split(/(\[[^|\]]+\|[^\]]+\])/g).map((part, index) => {
    const match = part.match(/^\[([^|\]]+)\|([^\]]+)\]$/);
    return match ? <ruby key={index}>{match[1]}<rt className="text-[0.46em] font-normal tracking-normal">{match[2]}</rt></ruby> : <span key={index}>{part}</span>;
  });
}

function cleanJapanese(text: string) { return text.replace(/\[([^|\]]+)\|[^\]]+\]/g, "$1"); }
function speakJapanese(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanJapanese(text));
  utterance.lang = "ja-JP"; utterance.rate = 0.86;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance); return true;
}

function DokkaiDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ["passage", id], queryFn: () => fetchPassageDetail(id) });
  const [showTranslation, setShowTranslation] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showFurigana, setShowFurigana] = useState(true);
  const [fontSize, setFontSize] = useState(0.94);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  const p = data?.passage;
  const enriched = p as (typeof p & FuriganaPassage) | null | undefined;
  const paragraphs = useMemo(() => String(p?.body_jp ?? "").split(/\n\s*\n|\n/).map(t => t.trim()).filter(Boolean), [p?.body_jp]);
  const furiganaParagraphs = useMemo(() => String(enriched?.body_furigana ?? "").split(/\n\s*\n|\n/).map(t => t.trim()).filter(Boolean), [enriched?.body_furigana]);

  const readParagraph = (text: string, index: number) => {
    if (speakingIndex === index) { window.speechSynthesis.cancel(); setSpeakingIndex(null); return; }
    speakJapanese(text, () => setSpeakingIndex(null)); setSpeakingIndex(index);
  };
  const readAll = () => {
    if (speakingIndex === -1) { window.speechSynthesis.cancel(); setSpeakingIndex(null); return; }
    speakJapanese(String(enriched?.body_furigana || p?.body_jp || ""), () => setSpeakingIndex(null)); setSpeakingIndex(-1);
  };

  if (isLoading) return <AppShell title="Dokkai"><p className="text-[12px] text-muted-foreground">Memuat bacaan…</p></AppShell>;
  if (error || !p) return <AppShell title="Dokkai"><p className="text-[12px] text-destructive">Bacaan tidak ditemukan atau gagal dimuat.</p></AppShell>;

  return <AppShell title="Dokkai" description="Latihan membaca bahasa Jepang dengan cara baca, suara, dan terjemahan.">
    <div className="mx-auto max-w-3xl pb-8">
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" className="h-8 px-2 text-[12px]" onClick={() => window.history.back()}><ArrowLeft className="mr-1.5 size-4" />Kembali</Button>
        <div className="flex items-center gap-2"><Badge variant="secondary" className="text-[10px]">{p.level}</Badge><span className="text-[11px] text-muted-foreground">± {p.estimated_minutes ?? "—"} menit</span></div>
      </div>

      <Card className="overflow-hidden border-border/70 shadow-none">
        <div className="border-b border-border/70 px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="mb-1 text-[10px] font-semibold tracking-[0.12em] text-primary">ENONIHONGO · 読解</p><h1 className="text-[17px] font-semibold leading-6 tracking-tight sm:text-lg">{p.title}</h1></div>
            <Button variant="outline" size="icon" className="size-9 shrink-0 rounded-xl" title="Baca seluruh bacaan" onClick={readAll}>{speakingIndex === -1 ? <Pause className="size-4" /> : <Volume2 className="size-4" />}</Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Button size="sm" className="h-8 rounded-lg text-[11px]" variant={showFurigana ? "default" : "outline"} onClick={() => setShowFurigana(v => !v)}>あ <span className="ml-1">Cara baca</span></Button>
            <Button size="sm" className="h-8 rounded-lg text-[11px]" variant="outline" onClick={() => setFontSize(v => Math.max(0.84, Number((v - 0.05).toFixed(2))))}>A−</Button>
            <Button size="sm" className="h-8 rounded-lg text-[11px]" variant="outline" onClick={() => setFontSize(v => Math.min(1.04, Number((v + 0.05).toFixed(2))))}>A+</Button>
            <Button size="sm" className="h-8 rounded-lg text-[11px]" variant={showTranslation ? "default" : "outline"} onClick={() => setShowTranslation(v => !v)}>Tampilkan terjemahan</Button>
            <Button size="sm" className="h-8 rounded-lg text-[11px]" variant={showNotes ? "default" : "outline"} onClick={() => setShowNotes(v => !v)}><FileText className="mr-1.5 size-3.5" />Tampilkan catatan</Button>
          </div>
        </div>

        <CardContent className="px-4 py-5 sm:px-7 sm:py-6">
          <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-2"><span className="text-[11px] font-medium text-muted-foreground">Bacaan</span><span className="text-[10px] text-muted-foreground">{paragraphs.length} bagian</span></div>
          <article lang="ja" className="font-jp text-foreground" style={{ fontSize: `${fontSize}rem` }}>
            {paragraphs.map((paragraph, index) => {
              const readingText = showFurigana && furiganaParagraphs[index] ? furiganaParagraphs[index] : paragraph;
              return <div key={index} className="group relative mb-5 last:mb-0">
                <button type="button" aria-label={`Putar bagian ${index + 1}`} className="absolute -left-1 top-0 flex size-7 -translate-x-full items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-primary sm:opacity-0 sm:group-hover:opacity-100" onClick={() => readParagraph(furiganaParagraphs[index] || paragraph, index)}>{speakingIndex === index ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}</button>
                <p className="whitespace-pre-wrap text-[1em] leading-[1.82] tracking-[0.002em]">{showFurigana && furiganaParagraphs[index] ? renderFurigana(readingText) : readingText}</p>
              </div>;
            })}
          </article>

          {showTranslation && <div className="mt-6 rounded-xl border border-border/70 bg-muted/35 p-4"><p className="mb-1 text-[12px] font-semibold">Terjemahan</p><p className="whitespace-pre-wrap text-[12px] leading-5 text-muted-foreground">{p.translation_id || "Terjemahan belum tersedia."}</p></div>}
          {showNotes && <div className="mt-2.5 rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold"><Settings2 className="size-3.5 text-primary" />Catatan belajar</p><p className="text-[12px] leading-5 text-muted-foreground">Coba pahami isi bacaan terlebih dahulu. Gunakan cara baca dan suara saat menemukan bagian yang sulit.</p></div>}
        </CardContent>
      </Card>
    </div>
  </AppShell>;
}
