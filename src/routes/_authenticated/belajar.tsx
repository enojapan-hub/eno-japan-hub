import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight, FileText, Headphones, NotebookTabs } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { fetchGrammarList, fetchKanjiList, fetchListeningList, fetchMyProgress, fetchPassages, type Level } from "@/lib/learn-queries";
import { fetchVocabListResilient } from "@/lib/vocab-resilient";
import { fetchTargetLevel } from "@/lib/target-level";

export const Route = createFileRoute("/_authenticated/belajar")({
  head: () => ({ meta: [{ title: "Materi — ENO NIHONGO" }] }),
  component: BelajarPage,
});

function pct(done:number,total:number){return total > 0 ? Math.min(100, Math.round(done / total * 100)) : 0}

function BelajarPage(){
  const target = useQuery({ queryKey:["target-level"], queryFn:fetchTargetLevel, retry:1 });
  const level = target.data as Level | undefined;
  const ready = Boolean(level);
  const kanji = useQuery({ queryKey:["materi-kanji",level], queryFn:()=>fetchKanjiList(level!), enabled:ready });
  const vocab = useQuery({ queryKey:["materi-vocab",level], queryFn:()=>fetchVocabListResilient(level!), enabled:ready, retry:1 });
  const grammar = useQuery({ queryKey:["materi-grammar",level], queryFn:()=>fetchGrammarList(level!), enabled:ready });
  const passages = useQuery({ queryKey:["materi-reading"], queryFn:fetchPassages, enabled:ready });
  const listening = useQuery({ queryKey:["materi-listening"], queryFn:fetchListeningList, enabled:ready });
  const progress = useQuery({ queryKey:["my-progress"], queryFn:fetchMyProgress, staleTime:15_000, enabled:ready });

  const rows = progress.data?.progress ?? [];
  const learned = (type:string) => rows.filter((r:any)=>r.level===level && r.item_type===type && (r.status==="learning" || r.status==="mastered")).length;
  const readingRows=(passages.data??[]).filter((r:any)=>r.level===level);
  const listeningRows=(listening.data??[]).filter((r:any)=>r.level===level);

  const cards = [
    {to:"/kanji",label:"Kanji",icon:"井",tone:"bg-emerald-100 text-emerald-700",total:kanji.data?.length??0,done:learned("kanji"),meta:`${kanji.data?.length??0} kanji · ${learned("kanji")} dipelajari`},
    {to:"/kotoba",label:"Kosakata",icon:BookOpen,tone:"bg-rose-100 text-rose-600",total:vocab.data?.length??0,done:learned("vocabulary"),meta:vocab.isError?"Ketuk untuk memuat kosakata":`${vocab.data?.length??0} kata · ${learned("vocabulary")} dipelajari`},
    {to:"/bunpo",label:"Bunpou",icon:FileText,tone:"bg-blue-100 text-blue-600",total:grammar.data?.length??0,done:learned("grammar"),meta:`${grammar.data?.length??0} pola · ${learned("grammar")} dipelajari`},
    {to:"/dokkai",label:"Dokkai",icon:NotebookTabs,tone:"bg-orange-100 text-orange-600",total:readingRows.length,done:learned("reading"),meta:`${readingRows.length} bacaan · ${learned("reading")} selesai`},
    {to:"/listening",label:"Choukai",icon:Headphones,tone:"bg-sky-100 text-sky-600",total:listeningRows.length,done:learned("listening"),meta:`${listeningRows.length} latihan · ${learned("listening")} selesai`},
  ] as const;

  return <AppShell compact title="Materi"><div className="mx-auto w-full max-w-md pb-2">
    <section className="mb-3"><div className="flex items-end justify-between gap-3"><div><h1 className="text-[20px] font-bold tracking-tight">Materi</h1><p className="mt-0.5 text-[10px] text-muted-foreground">Semua materi mengikuti level JLPT di Profil</p></div>{level&&<span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">{level}</span>}</div></section>
    {target.isLoading?<p className="py-8 text-center text-xs text-muted-foreground">Memuat level profil…</p>:target.isError||!level?<p className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-center text-[11px] text-destructive">Level profil tidak dapat dimuat. Atur target JLPT di Profil terlebih dahulu.</p>:<div className="space-y-2">{cards.map((card)=>{const Icon=card.icon;const percent=pct(card.done,card.total);return <a key={card.to} href={card.to} className="flex items-center gap-3 rounded-2xl border bg-card px-3 py-3 shadow-[0_1px_3px_rgba(0,0,0,.04)] transition active:scale-[.995]"><span className={`grid size-12 shrink-0 place-items-center rounded-xl ${card.tone}`}>{typeof Icon==="string"?<span className="font-jp text-[26px] font-bold">{Icon}</span>:<Icon className="size-6"/>}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-[12px] font-bold">{card.label} {level}</p><ChevronRight className="size-4 text-muted-foreground"/></div><p className="mt-0.5 truncate text-[9px] text-muted-foreground">{card.meta}</p><div className="mt-2 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${percent}%`}}/></div><span className="w-8 text-right text-[9px] font-semibold text-muted-foreground">{percent}%</span></div></div></a>})}</div>}
    <div className="mt-3 rounded-2xl bg-emerald-50/80 px-4 py-3 text-center"><p className="text-[10px] leading-4 text-emerald-900">Konsistensi hari ini,<br/>hasil luar biasa nanti.</p><p lang="ja" className="mt-1 font-jp text-[11px] font-semibold text-emerald-700">継続は力なり</p></div>
  </div></AppShell>
}
