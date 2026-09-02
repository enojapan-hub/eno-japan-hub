import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPassageDetail } from "@/lib/learn-queries";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, FileText, Pause, Play, Volume2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dokkai/$id")({ component: DokkaiDetail });
type FuriganaPassage = { body_furigana?: string | null };

function renderFurigana(text: string) {
  return text.split(/(\[[^|\]]+\|[^\]]+\])/g).map((part, index) => {
    const match = part.match(/^\[([^|\]]+)\|([^\]]+)\]$/);
    return match ? <ruby key={index}>{match[1]}<rt className="text-[0.48em] font-normal tracking-normal">{match[2]}</rt></ruby> : <span key={index}>{part}</span>;
  });
}

function speakJapanese(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/\[([^|\]]+)\|[^\]]+\]/g, "$1"));
  utterance.lang = "ja-JP";
  utterance.rate = 0.86;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
  return true;
}

function DokkaiDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ["passage", id], queryFn: () => fetchPassageDetail(id) });
  const [showTranslation, setShowTranslation] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showFurigana, setShowFurigana] = useState(true);
  const [fontSize, setFontSize] = useState(0.92);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  const p = data?.passage;
  const enriched = p as (typeof p & FuriganaPassage) | null | undefined;
  const paragraphs = useMemo(() => String(p?.body_jp ?? "").split(/\n\s*\n|\n/).map((t) => t.trim()).filter(Boolean), [p?.body_jp]);
  const furiganaParagraphs = useMemo(() => String(enriched?.body_furigana ?? "").split(/\n\s*\n|\n/).map((t) => t.trim()).filter(Boolean), [enriched?.body_furigana]);

  const readParagraph = (text: string, index: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingIndex === index) { window.speechSynthesis.cancel(); setSpeakingIndex(null); return; }
    speakJapanese(text, () => setSpeakingIndex(null));
    setSpeakingIndex(index);
  };
  const readAll = () => {
    if (speakingIndex === -1) { window.speechSynthesis.cancel(); setSpeakingIndex(null); return; }
    speakJapanese(String(enriched?.body_furigana || p?.body_jp || ""), () => setSpeakingIndex(null));
    setSpeakingIndex(-1);
  };

  if (isLoading) return <AppShell title="読解"><p className="text-[13px] text-muted-foreground">Memuat bacaan…</p></AppShell>;
  if (error || !p) return <AppShell title="読解"><p className="text-[13px] text-destructive">Bacaan tidak ditemukan atau gagal dimuat.</p></AppShell>;

  return <AppShell title="読解" description="Baca dan dengarkan bacaan bahasa Jepang.">
    <div className="mx-auto max-w-3xl pb-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}><ArrowLeft className="mr-2 h-4 w-4" />Kembali</Button>
        <div className="flex items-center gap-2"><Badge variant="secondary">{p.level}</Badge><span className="text-[11px] text-muted-foreground">± {p.estimated_minutes ?? "—"} menit</span></div>
      </div>

      <Card className="overflow-hidden border-border/70 shadow-none">
        <CardHeader className="border-b border-border/70 px-4 py-3.5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div><p className="mb-1 text-[10px] font-medium tracking-[0.12em] text-primary">enonihongo · 読解</p><CardTitle className="text-base leading-6 sm:text-lg">{p.title}</CardTitle></div>
            <Button variant="outline" size="icon" title="Baca seluruh teks" onClick={readAll}>{speakingIndex === -1 ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</Button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Button size="sm" variant={showFurigana ? "default" : "outline"} onClick={() => setShowFurigana((v) => !v)}>あ <span className="ml-1">Cara baca</span></Button>
            <Button size="sm" variant="outline" onClick={() => setFontSize((v) => Math.max(0.82, Number((v - 0.05).toFixed(2))))}>A−</Button>
            <Button size="sm" variant="outline" onClick={() => setFontSize((v) => Math.min(1.06, Number((v + 0.05).toFixed(2))))}>A+</Button>
            <Button size="sm" variant={showTranslation ? "default" : "outline"} onClick={() => setShowTranslation((v) => !v)}>{showTranslation ? "Sembunyikan terjemahan" : "Terjemahan"}</Button>
            <Button size="sm" variant={showNotes ? "default" : "outline"} onClick={() => setShowNotes((v) => !v)}><FileText className="mr-1.5 h-4 w-4" />Catatan</Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="px-4 py-5 sm:px-7 sm:py-6">
            <div className="mb-4 flex items-center justify-between border-b border-border/70 pb-2"><span className="text-[11px] font-medium text-muted-foreground">Teks bacaan</span><span className="text-[10px] text-muted-foreground">{paragraphs.length} bagian</span></div>
            <article lang="ja" className="font-jp text-foreground" style={{ fontSize: `${fontSize}rem` }}>
              {paragraphs.map((paragraph, index) => {
                const readingText = showFurigana && furiganaParagraphs[index] ? furiganaParagraphs[index] : paragraph;
                return <div key={index} className="group relative mb-5 last:mb-0">
                  <button type="button" className="absolute -left-1 top-0 flex h-7 w-7 -translate-x-full items-center justify-center rounded-full text-muted-foreground opacity-80 transition hover:bg-muted hover:text-primary sm:opacity-0 sm:group-hover:opacity-100" aria-label={`Baca bagian ${index + 1}`} onClick={() => readParagraph(furiganaParagraphs[index] || paragraph, index)}>{speakingIndex === index ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button>
                  <p className="whitespace-pre-wrap text-[1em] leading-[1.9] tracking-[0.005em]">{showFurigana && furiganaParagraphs[index] ? renderFurigana(readingText) : readingText}</p>
                </div>;
              })}
            </article>
            {showTranslation && <div className="mt-6 rounded-lg border border-border/70 bg-muted/40 p-3.5"><div className="mb-1 text-[13px] font-semibold">Terjemahan</div><p className="whitespace-pre-wrap text-[13px] leading-5 text-muted-foreground">{p.translation_id || "Terjemahan belum tersedia."}</p></div>}
            {showNotes && <div className="mt-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3.5"><div className="mb-1 text-[13px] font-semibold">Catatan belajar</div><p className="text-[13px] leading-5 text-muted-foreground">Gunakan cara baca saat diperlukan dan dengarkan audio untuk membiasakan pelafalan. Cobalah memahami isi bacaan sebelum membuka terjemahan.</p></div>}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-center"><Button variant="outline" size="sm" onClick={() => window.history.back()}><ArrowLeft className="mr-2 h-4 w-4" />Daftar bacaan<ChevronRight className="ml-1 h-4 w-4" /></Button></div>
    </div>
  </AppShell>;
}
