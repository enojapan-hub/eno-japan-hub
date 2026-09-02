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
    return match ? <ruby key={index}>{match[1]}<rt className="text-[0.56em] font-normal tracking-normal">{match[2]}</rt></ruby> : <span key={index}>{part}</span>;
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
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showFurigana, setShowFurigana] = useState(true);
  const [fontSize, setFontSize] = useState(1);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  const p = data?.passage;
  const enriched = p as (typeof p & FuriganaPassage) | null | undefined;
  const paragraphs = useMemo(() => String(p?.body_jp ?? "").split(/\n\s*\n|\n/).map((t) => t.trim()).filter(Boolean), [p?.body_jp]);
  const furiganaParagraphs = useMemo(() => String(enriched?.body_furigana ?? "").split(/\n\s*\n|\n/).map((t) => t.trim()).filter(Boolean), [enriched?.body_furigana]);
  const answeredCount = Object.keys(answers).length;
  const score = useMemo(() => {
    if (!checked || !data?.questions?.length) return null;
    const correct = data.questions.reduce((sum, q) => sum + (answers[q.id] === Number(q.correct_index) ? 1 : 0), 0);
    return { correct, total: data.questions.length, percent: Math.round((correct / data.questions.length) * 100) };
  }, [answers, checked, data?.questions]);

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

  if (isLoading) return <AppShell title="読解 — Dokkai"><p className="text-sm text-muted-foreground">Memuat bacaan…</p></AppShell>;
  if (error || !p) return <AppShell title="読解 — Dokkai"><p className="text-sm text-destructive">Bacaan tidak ditemukan atau gagal dimuat.</p></AppShell>;

  return <AppShell title="読解 — Dokkai" description="Baca, dengarkan, pahami, lalu ukur hasilmu.">
    <div className="mx-auto max-w-4xl pb-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}><ArrowLeft className="mr-2 h-4 w-4" />Kembali</Button>
        <div className="flex items-center gap-2"><Badge variant="secondary">{p.level}</Badge><span className="text-xs text-muted-foreground">± {p.estimated_minutes ?? "—"} menit</span></div>
      </div>

      <Card className="overflow-hidden border-border/80 shadow-none">
        <CardHeader className="border-b border-border/70 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div><p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-primary">enonihongo · DOKKAI</p><CardTitle className="text-xl leading-8 sm:text-2xl">{p.title}</CardTitle></div>
            <Button variant="outline" size="icon" title="Baca seluruh teks" onClick={readAll}>{speakingIndex === -1 ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant={showFurigana ? "default" : "outline"} onClick={() => setShowFurigana((v) => !v)}>あ <span className="ml-1">Furigana</span></Button>
            <Button size="sm" variant="outline" onClick={() => setFontSize((v) => Math.max(0.9, Number((v - 0.08).toFixed(2))))}>A−</Button>
            <Button size="sm" variant="outline" onClick={() => setFontSize((v) => Math.min(1.3, Number((v + 0.08).toFixed(2))))}>A+</Button>
            <Button size="sm" variant={showTranslation ? "default" : "outline"} onClick={() => setShowTranslation((v) => !v)}>{showTranslation ? "Sembunyikan terjemahan" : "Terjemahan"}</Button>
            <Button size="sm" variant={showNotes ? "default" : "outline"} onClick={() => setShowNotes((v) => !v)}><FileText className="mr-1.5 h-4 w-4" />Catatan</Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="px-5 py-7 sm:px-9 sm:py-10">
            <div className="mb-7 flex items-center justify-between border-b border-border/70 pb-3"><span className="text-sm font-medium text-muted-foreground">本文 · Teks bacaan</span><span className="text-xs text-muted-foreground">{paragraphs.length} bagian</span></div>
            <article lang="ja" className="font-jp text-foreground" style={{ fontSize: `${fontSize}rem` }}>
              {paragraphs.map((paragraph, index) => {
                const readingText = showFurigana && furiganaParagraphs[index] ? furiganaParagraphs[index] : paragraph;
                return <div key={index} className="group relative mb-8 last:mb-0">
                  <button type="button" className="absolute -left-1 top-0 flex h-8 w-8 -translate-x-full items-center justify-center rounded-full text-muted-foreground opacity-80 transition hover:bg-muted hover:text-primary sm:opacity-0 sm:group-hover:opacity-100" aria-label={`Baca bagian ${index + 1}`} onClick={() => readParagraph(furiganaParagraphs[index] || paragraph, index)}>{speakingIndex === index ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
                  <p className="whitespace-pre-wrap text-[1.05em] leading-[2.3] tracking-[0.015em]">{showFurigana && furiganaParagraphs[index] ? renderFurigana(readingText) : readingText}</p>
                </div>;
              })}
            </article>
            {showTranslation && <div className="mt-9 rounded-xl border border-border/70 bg-muted/40 p-5"><div className="mb-2 text-sm font-semibold">Terjemahan</div><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{p.translation_id || "Terjemahan belum tersedia."}</p></div>}
            {showNotes && <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-5"><div className="mb-2 text-sm font-semibold">Catatan belajar</div><ul className="space-y-2 text-sm leading-6 text-muted-foreground"><li>• Baca sekali tanpa terjemahan untuk menangkap ide utama.</li><li>• Gunakan ▶ pada paragraf untuk mendengarkan pelafalan.</li><li>• Aktifkan furigana hanya ketika membutuhkan bantuan kanji.</li><li>• Setelah membaca, kerjakan pertanyaan berdasarkan isi teks.</li></ul></div>}
          </div>
        </CardContent>
      </Card>

      <section className="mt-8 space-y-4" aria-label="Pertanyaan bacaan">
        <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">理解チェック</p><h2 className="text-xl font-semibold">Pertanyaan pemahaman</h2></div><span className="text-xs text-muted-foreground">{answeredCount}/{data.questions?.length ?? 0}</span></div>
        {score && <Card className="border-primary/25 bg-primary/5 shadow-none"><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="text-sm font-medium">Hasil Dokkai</p><p className="text-xs text-muted-foreground">Jawaban benar setelah diperiksa</p></div><div className="text-right"><div className="text-2xl font-bold">{score.correct}/{score.total}</div><div className="text-xs text-muted-foreground">{score.percent}%</div></div></CardContent></Card>}
        {data.questions?.map((q, qi) => {
          const selected = answers[q.id];
          const isCorrect = checked && selected === Number(q.correct_index);
          return <Card key={q.id} className={checked ? (isCorrect ? "border-primary/40 shadow-none" : "border-destructive/40 shadow-none") : "shadow-none"}>
            <CardHeader><CardTitle className="text-base leading-6">{qi + 1}. {String(q.prompt)}</CardTitle>{q.prompt_note && <p className="text-xs text-muted-foreground">{String(q.prompt_note)}</p>}</CardHeader>
            <CardContent className="space-y-2">
              {(Array.isArray(q.choices) ? q.choices : []).map((c, i) => <Button key={i} variant={selected === i ? (checked ? (i === Number(q.correct_index) ? "default" : "destructive") : "default") : "outline"} className="h-auto min-h-11 w-full justify-start whitespace-normal py-3 text-left" onClick={() => { setAnswers((a) => ({ ...a, [q.id]: i })); setChecked(false); }}><span className="mr-2 font-semibold">{String.fromCharCode(65 + i)}.</span>{String(c)}</Button>)}
              {checked && <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-6"><span className="font-semibold">{isCorrect ? "Benar." : "Belum tepat."}</span> {String(q.explanation_id || "Pelajari kembali bagian bacaan yang terkait dengan pertanyaan ini.")}</div>}
            </CardContent>
          </Card>;
        })}
        {!!data.questions?.length && <div className="sticky bottom-4 z-10 rounded-xl border bg-card/95 p-3 shadow-sm backdrop-blur"><Button className="w-full" disabled={answeredCount !== data.questions.length} onClick={() => setChecked(true)}>{answeredCount === data.questions.length ? "Periksa jawaban" : `Jawab semua soal (${answeredCount}/${data.questions.length})`}</Button></div>}
      </section>

      <div className="mt-7 flex justify-center"><Button variant="outline" onClick={() => window.history.back()}><ArrowLeft className="mr-2 h-4 w-4" />Daftar bacaan<ChevronRight className="ml-1 h-4 w-4" /></Button></div>
    </div>
  </AppShell>;
}
