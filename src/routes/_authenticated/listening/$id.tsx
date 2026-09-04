import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, Pause, Play } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { fetchListeningDetail } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/listening/$id")({ component: ListeningDetail });
function cleanJapanese(text: string) { return text.replace(/\[[^|\]]+\|([^\]]+)\]/g, "$1"); }

function ListeningDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ["listening", id], queryFn: () => fetchListeningDetail(id) });
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const item = data?.item;
  const question = data?.questions?.[0];
  const selected = question ? answers[question.id] : undefined;
  const score = useMemo(() => checked ? data?.questions.reduce((n, q) => n + (answers[q.id] === Number(q.correct_index) ? 1 : 0), 0) ?? 0 : null, [answers, checked, data?.questions]);

  const play = () => {
    if (!item) return;
    if (playing) { window.speechSynthesis?.cancel(); setPlaying(false); return; }
    if (item.audio_url) { const audio = new Audio(item.audio_url); audio.playbackRate=rate; audio.onended=()=>setPlaying(false); void audio.play(); setPlaying(true); return; }
    if (!("speechSynthesis" in window)) return;
    const u=new SpeechSynthesisUtterance(cleanJapanese(item.transcript_jp??""));u.lang="ja-JP";u.rate=.86*rate;u.onend=()=>setPlaying(false);window.speechSynthesis.cancel();window.speechSynthesis.speak(u);setPlaying(true);
  };

  if (isLoading) return <AppShell title="Choukai"><p className="text-xs text-muted-foreground">Memuat latihan…</p></AppShell>;
  if (error || !item) return <AppShell title="Choukai"><p className="text-xs text-destructive">Latihan listening tidak ditemukan.</p></AppShell>;

  return <AppShell title={`Choukai ${item.level}`} backTo="/listening" backLabel="Choukai" compact>
    <div className="mx-auto max-w-md pb-4">
      <div className="mb-2 flex items-center justify-between"><Link to="/listening" className="flex items-center gap-1 text-[11px] font-semibold"><ArrowLeft className="size-3.5"/>Choukai {item.level}</Link><span className="text-[10px] text-muted-foreground">{data.questions.length?`1 / ${data.questions.length}`:"—"}</span></div>
      <div className="rounded-xl border bg-card p-3.5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-1/3 rounded-full bg-primary"/></div><button onClick={play} className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">{playing?<Pause className="size-5"/>:<Play className="ml-0.5 size-5"/>}</button><div className="h-1.5 rounded-full bg-muted"/></div>
        <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground"><span>0:00 / {item.duration_seconds?`${Math.floor(item.duration_seconds/60)}:${String(item.duration_seconds%60).padStart(2,"0")}`:"0:45"}</span><div className="flex gap-1"><button onClick={()=>setRate(rate===1?1.25:1)} className="rounded-full border px-2 py-0.5">{rate.toFixed(1)}x</button><button onClick={()=>setRate(.5)} className="rounded-full border px-2 py-0.5">0.5x</button></div></div>
      </div>

      {question&&<section className="mt-4"><h2 className="text-[11px] font-bold">Pertanyaan 1 / {data.questions.length}</h2><p className="mt-3 font-jp text-[13px] font-semibold leading-5">{question.prompt}</p><div className="mt-3 space-y-2">{question.choices.map((choice,ci)=><button key={ci} onClick={()=>{setAnswers(a=>({...a,[question.id]:ci}));setChecked(false)}} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-[11px] ${selected===ci?"border-primary bg-primary/7":"bg-card"}`}><span className="grid size-5 shrink-0 place-items-center rounded-full border text-[9px] font-bold">{String.fromCharCode(65+ci)}</span><span>{choice}</span></button>)}</div><Button className="mt-4 h-10 w-full rounded-full text-[11px]" disabled={selected===undefined} onClick={()=>setChecked(true)}>Periksa Jawaban</Button></section>}

      <div className="mt-4 space-y-2"><details className="group rounded-lg border bg-card px-3 py-2.5"><summary className="flex cursor-pointer list-none items-center justify-between text-[10px] font-semibold">Transkrip<ChevronDown className="size-3.5 transition group-open:rotate-180"/></summary><p className="mt-2 whitespace-pre-wrap font-jp text-[10px] leading-5">{item.transcript_jp||"Transkrip belum tersedia."}</p></details><details className="group rounded-lg border bg-card px-3 py-2.5"><summary className="flex cursor-pointer list-none items-center justify-between text-[10px] font-semibold">Penjelasan Jawaban<ChevronDown className="size-3.5 transition group-open:rotate-180"/></summary><p className="mt-2 text-[10px] leading-5 text-muted-foreground">{checked&&question?selected===Number(question.correct_index)?"Jawaban benar.":question.explanation_id||"Belum tepat. Dengarkan kembali bagian utama audio.":"Jawab pertanyaan lalu tekan Periksa Jawaban."}</p>{score!==null&&<p className="mt-1 text-[9px] font-semibold text-primary">Skor: {score}/{data.questions.length}</p>}</details></div>
    </div>
  </AppShell>;
}
