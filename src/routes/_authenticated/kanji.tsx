import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Volume2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchKanjiList, fetchKanjiStudy, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";

export const Route = createFileRoute("/_authenticated/kanji")({ component: KanjiPage });

type KanjiRow = {
  id: string; character: string; level: Level; onyomi: string[] | null; kunyomi: string[] | null;
  meaning_id: string | null; stroke_count?: number | null; source_book?: string | null;
  lesson_number?: number | null; lesson_title?: string | null;
};

function KanjiPage() {
  const { data: targetLevel, isLoading: levelLoading, error: levelError } = useQuery({ queryKey: ["target-level"], queryFn: fetchTargetLevel });
  const level: Level = targetLevel ?? "N5";
  const { data, isLoading, error } = useQuery({ queryKey: ["kanji", level], queryFn: () => fetchKanjiList(level), enabled: !!targetLevel });
  const allCards = (data ?? []) as KanjiRow[];
  const lessons = useMemo(() => [...new Set(allCards.map(x => x.lesson_number).filter((n): n is number => typeof n === "number"))].sort((a,b)=>a-b), [allCards]);
  const [lesson, setLesson] = useState<number | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [learned, setLearned] = useState<Record<string, boolean>>({});
  const touchStart = useRef<number | null>(null);
  const qc = useQueryClient();

  useEffect(() => { if (lessons.length) setLesson(current => current && lessons.includes(current) ? current : lessons[0]); }, [level, lessons.join(",")]);
  const cards = lesson == null ? allCards : allCards.filter(x => x.lesson_number === lesson);
  const item = index == null ? null : cards[index];
  const { data: study } = useQuery({ queryKey: ["kanji-study", item?.id], queryFn: () => fetchKanjiStudy(item!.id), enabled: !!item?.id });
  const mutation = useMutation({ mutationFn: (id:string) => markItemLearned({ itemType:"kanji", itemId:id, level }), onSuccess:(_,id)=>{ setLearned(v=>({...v,[id]:true})); void qc.invalidateQueries({queryKey:["my-progress"]}); } });
  const speak=(text:string)=>{ if(!window.speechSynthesis)return; window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang="ja-JP"; u.rate=.85; window.speechSynthesis.speak(u); };
  const goPrev=()=>setIndex(i=>i==null?0:Math.max(0,i-1));
  const goNext=()=>setIndex(i=>i==null?0:Math.min(cards.length-1,i+1));
  const onTouchEnd=(x:number)=>{ if(touchStart.current==null)return; const d=x-touchStart.current; if(Math.abs(d)>45){ if(d<0) goNext(); else goPrev(); } touchStart.current=null; };

  return <AppShell title="漢字 · Kanji" backTo="/belajar" backLabel="Materi" compact>
    {levelLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Memuat level…</p> : levelError ? <p className="py-8 text-center text-sm text-destructive">Level profil tidak dapat dimuat.</p> :
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="flex items-center justify-between gap-3"><div><h1 className="text-[18px] font-bold">Kanji {level}</h1><p className="text-[11px] text-muted-foreground">Pilih bab lalu tap kanji untuk membuka detail.</p></div><Badge>{allCards.length} Kanji</Badge></div>
      {lessons.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1">{lessons.map(n=><Button key={n} size="sm" variant={lesson===n?"default":"outline"} className="h-8 shrink-0 rounded-full px-3 text-[11px]" onClick={()=>{setLesson(n);setIndex(null)}}>Bab {n}</Button>)}</div>}
      {error && <p className="text-xs text-destructive">Gagal memuat materi Kanji.</p>}
      {isLoading ? <p className="py-8 text-center text-xs text-muted-foreground">Memuat materi…</p> : index == null ?
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{cards.map((k,i)=><button key={k.id} onClick={()=>setIndex(i)} className="min-h-[78px] rounded-2xl border bg-card px-1.5 py-2 text-center shadow-sm transition hover:border-primary/40">
          <div lang="ja" className="font-jp text-[30px] font-semibold leading-none text-primary">{k.character}</div>
          <div className="mt-2 line-clamp-1 text-[10px] font-medium">{k.meaning_id || "—"}</div>
          {learned[k.id] && <div className="mt-1 text-[9px] font-semibold text-primary">✓ Hafal</div>}
        </button>)}</div>
      : item ? <div onTouchStart={e=>touchStart.current=e.touches[0].clientX} onTouchEnd={e=>onTouchEnd(e.changedTouches[0].clientX)}>
          <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground"><button onClick={()=>setIndex(null)} className="font-semibold text-primary">← Daftar</button><span>{index+1}/{cards.length}</span></div>
          <Card className="rounded-3xl shadow-sm"><CardContent className="p-4 sm:p-5">
            <div className="text-center"><div lang="ja" className="font-jp text-[72px] leading-none text-primary">{item.character}</div><h2 className="mt-2 text-[18px] font-bold">{item.meaning_id || "Arti belum tersedia"}</h2><div className="mt-3 flex justify-center gap-2"><Badge variant="outline">On {(item.onyomi??[]).join("・")||"—"}</Badge><Badge variant="outline">Kun {(item.kunyomi??[]).join("・")||"—"}</Badge></div>{item.stroke_count ? <p className="mt-2 text-[11px] text-muted-foreground">{item.stroke_count} stroke</p>:null}<Button variant="outline" size="sm" className="mt-3 h-8 rounded-full text-[11px]" onClick={()=>speak(item.character)}><Volume2 className="mr-1.5 size-3.5"/>Audio</Button></div>
            {(study?.relatedWords?.length ?? 0) > 0 && <section className="mt-4"><h3 className="text-[12px] font-bold">Kosakata terkait</h3><div className="mt-2 grid gap-2 sm:grid-cols-2">{(study?.relatedWords ?? []).slice(0,4).map((w:any,i:number)=><div key={`${w.term}-${i}`} className="rounded-xl border p-2.5"><div className="font-jp text-sm font-semibold">{w.term} <span className="text-[10px] text-muted-foreground">{w.reading}</span></div><div className="mt-0.5 text-[11px]">{w.meaning}</div></div>)}</div></section>}
            {asExamples(study?.examples).length>0 && <section className="mt-4"><h3 className="text-[12px] font-bold">Contoh kalimat</h3>{asExamples(study?.examples).slice(0,2).map((e,i)=><div key={i} className="mt-2 rounded-xl border p-3"><p className="font-jp text-sm leading-6">{e.jp}</p>{e.id&&<p className="mt-1 text-[11px] text-muted-foreground">{e.id}</p>}</div>)}</section>}
            <Button className="mt-4 h-10 w-full rounded-xl text-[12px]" variant={learned[item.id]?"secondary":"default"} disabled={mutation.isPending||learned[item.id]} onClick={()=>mutation.mutate(item.id)}>{learned[item.id]?<><Check className="mr-2 size-4"/>Sudah dipelajari</>:"Tandai sudah dipelajari"}</Button>
            <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" className="h-10 rounded-xl text-[11px]" disabled={index===0} onClick={goPrev}><ArrowLeft className="mr-1.5 size-4"/>Sebelumnya</Button><Button className="h-10 rounded-xl text-[11px]" disabled={index===cards.length-1} onClick={goNext}>Selanjutnya<ArrowRight className="ml-1.5 size-4"/></Button></div>
            <p className="mt-2 text-center text-[9px] text-muted-foreground">Bisa digeser ke kiri / kanan</p>
          </CardContent></Card>
        </div> : null}
    </div>}
  </AppShell>;
}
