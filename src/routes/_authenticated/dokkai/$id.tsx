import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Pause, Play, Volume2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchPassageDetail, type Level } from "@/lib/learn-queries";
import { markContentMastered } from "@/lib/progress-actions";

export const Route = createFileRoute("/_authenticated/dokkai/$id")({ component: DokkaiDetail });
type FuriganaPassage = { body_furigana?: string | null };
type PassageQuestion = { id: string; prompt: string; choices: string[]; correct_index: number; explanation_id?: string | null };

function renderFurigana(text: string) {
  return text.split(/(\[[^|\]]+\|[^\]]+\])/g).map((part, index) => {
    const match = part.match(/^\[([^|\]]+)\|([^|\]]+)\]$/);
    return match ? <ruby key={index}>{match[1]}<rt className="text-[0.46em] font-normal tracking-normal">{match[2]}</rt></ruby> : <span key={index}>{part}</span>;
  });
}
function normalizeBreaks(text: string) { return text.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n"); }
function splitParagraphs(text: string) { return normalizeBreaks(text).split(/\n\s*\n|\n/).map(t => t.trim()).filter(Boolean); }
function cleanJapanese(text: string) { return normalizeBreaks(text).replace(/\[([^|\]]+)\|[^\]]+\]/g, "$1"); }
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
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["passage", id], queryFn: () => fetchPassageDetail(id) });
  const [showFurigana, setShowFurigana] = useState(true);
  const [fontSize, setFontSize] = useState(1);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  const p = data?.passage;
  const enriched = p as (typeof p & FuriganaPassage) | null | undefined;
  const questions = (data?.questions ?? []) as PassageQuestion[];
  const paragraphs = useMemo(() => splitParagraphs(String(p?.body_jp ?? "")), [p?.body_jp]);
  const furiganaParagraphs = useMemo(() => splitParagraphs(String(enriched?.body_furigana ?? "")), [enriched?.body_furigana]);
  const completeMutation = useMutation({
    mutationFn: () => markContentMastered({ itemType: "reading", itemId: id, level: String(p?.level ?? "N5") as Level, durationSeconds: Math.max(60, Number(p?.estimated_minutes ?? 1) * 60) }),
    onSuccess: () => { setCompleted(true); void qc.invalidateQueries({ queryKey: ["dashboard-live"] }); void qc.invalidateQueries({ queryKey: ["my-progress"] }); },
  });

  const readParagraph = (text: string, index: number) => {
    if (speakingIndex === index) { window.speechSynthesis.cancel(); setSpeakingIndex(null); return; }
    speakJapanese(text, () => setSpeakingIndex(null)); setSpeakingIndex(index);
  };
  const readAll = () => {
    if (speakingIndex === -1) { window.speechSynthesis.cancel(); setSpeakingIndex(null); return; }
    speakJapanese(String(enriched?.body_furigana || p?.body_jp || ""), () => setSpeakingIndex(null)); setSpeakingIndex(-1);
  };
  const checkAnswers = () => { setChecked(true); if (!completeMutation.isPending) completeMutation.mutate(); };

  if (isLoading) return <AppShell title="Dokkai"><p className="text-[12px] text-muted-foreground">Memuat bacaan…</p></AppShell>;
  if (error || !p) return <AppShell title="Dokkai"><p className="text-[12px] text-destructive">Bacaan tidak ditemukan atau gagal dimuat.</p></AppShell>;

  return <AppShell title="Dokkai" compact>
    <div className="mx-auto max-w-3xl pb-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8"><a href="/dokkai"><ArrowLeft className="mr-1.5 size-4" />Dokkai {p.level}</a></Button>
        <span className="text-[10px] text-muted-foreground">{paragraphs.length} bagian</span>
      </div>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0"><h1 lang="ja" className="font-jp text-[22px] font-bold leading-8">{p.title}</h1><div className="mt-1 flex items-center gap-2"><Badge variant="secondary" className="text-[10px]">{p.level}</Badge>{p.estimated_minutes != null && <span className="text-[10px] text-muted-foreground">± {p.estimated_minutes} menit</span>}</div></div>
        <div className="flex shrink-0 items-center gap-1.5"><span className="text-[10px] text-muted-foreground">Furigana</span><button type="button" onClick={()=>setShowFurigana(v=>!v)} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${showFurigana?"bg-primary text-primary-foreground":"border bg-background"}`}>{showFurigana?"ON":"OFF"}</button></div>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl border bg-card px-3 py-2">
        <Button type="button" size="sm" className="h-8 rounded-full px-3 text-[11px]" onClick={readAll}>{speakingIndex===-1?<Pause className="mr-1.5 size-3.5"/>:<Volume2 className="mr-1.5 size-3.5"/>}Dengarkan semua</Button>
        <div className="flex items-center gap-1"><span className="mr-1 text-[10px] text-muted-foreground">Ukuran teks</span><Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={()=>setFontSize(v=>Math.max(.85,Number((v-.1).toFixed(2))))}>A−</Button><Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={()=>setFontSize(1)}>A</Button><Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={()=>setFontSize(v=>Math.min(1.3,Number((v+.1).toFixed(2))))}>A+</Button></div>
      </div>

      <article lang="ja" className="font-jp text-foreground" style={{fontSize:`${fontSize}rem`}}>
        {paragraphs.map((paragraph,index)=>{
          const reading = showFurigana && furiganaParagraphs[index] ? furiganaParagraphs[index] : paragraph;
          return <div key={index} className="mb-5 last:mb-0"><p className="whitespace-pre-wrap leading-[2] tracking-[0.01em]">{showFurigana&&furiganaParagraphs[index]?renderFurigana(reading):reading}</p><button type="button" onClick={()=>readParagraph(furiganaParagraphs[index]||paragraph,index)} className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-primary">{speakingIndex===index?<Pause className="size-3"/>:<Play className="size-3"/>}Dengarkan paragraf {index+1}</button></div>;
        })}
      </article>

      <div className="mt-6 space-y-2">
        <details className="group rounded-xl border bg-card px-3 py-2.5"><summary className="flex cursor-pointer list-none items-center justify-between text-[12px] font-semibold">Arti Seluruh Bagian<ChevronDown className="size-4 transition group-open:rotate-180"/></summary><p className="mt-3 whitespace-pre-wrap text-[12px] leading-6 text-muted-foreground">{normalizeBreaks(String(p.translation_id||"Terjemahan Indonesia belum tersedia."))}</p></details>
        <details className="group rounded-xl border bg-card px-3 py-2.5"><summary className="flex cursor-pointer list-none items-center justify-between text-[12px] font-semibold">Pertanyaan<ChevronDown className="size-4 transition group-open:rotate-180"/></summary><div className="mt-3 space-y-4">{questions.length===0?<p className="text-[11px] text-muted-foreground">Belum ada soal untuk bacaan ini.</p>:questions.map((q,i)=><div key={q.id}><p className="text-[12px] font-semibold">{i+1}. {q.prompt}</p><div className="mt-2 space-y-1.5">{q.choices.map((choice,ci)=><button key={ci} type="button" onClick={()=>{setAnswers(a=>({...a,[q.id]:ci}));setChecked(false)}} className={`w-full rounded-lg border px-3 py-2 text-left text-[11px] ${answers[q.id]===ci?"border-primary bg-primary/5":"bg-background"}`}>{String.fromCharCode(65+ci)}. {choice}</button>)}</div>{checked&&answers[q.id]!==undefined&&<p className="mt-2 text-[10px] text-muted-foreground">{answers[q.id]===Number(q.correct_index)?"Benar.":q.explanation_id||"Belum tepat. Baca kembali bagian terkait."}</p>}</div>)}{questions.length>0&&<Button className="h-9 w-full rounded-lg text-[11px]" disabled={Object.keys(answers).length!==questions.length||completeMutation.isPending} onClick={checkAnswers}>{completed?<><Check className="mr-1.5 size-3.5"/>Selesai</>:"Periksa Jawaban"}</Button>}</div></details>
        <details className="group rounded-xl border bg-card px-3 py-2.5"><summary className="flex cursor-pointer list-none items-center justify-between text-[12px] font-semibold">Kosakata Penting<ChevronDown className="size-4 transition group-open:rotate-180"/></summary><p className="mt-3 text-[11px] leading-5 text-muted-foreground">Kosakata penting akan ditampilkan dari data bacaan yang tersedia. Teks utama di atas selalu ditampilkan penuh tanpa dipotong.</p></details>
      </div>
      {questions.length===0&&<Button className="mt-4 h-10 w-full rounded-full text-[11px]" disabled={completed||completeMutation.isPending} onClick={()=>completeMutation.mutate()}>{completed?<><Check className="mr-1.5 size-4"/>Selesai dibaca</>:"Tandai selesai membaca · +5 XP"}</Button>}
    </div>
  </AppShell>;
}
