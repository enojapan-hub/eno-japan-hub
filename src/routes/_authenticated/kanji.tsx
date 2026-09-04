import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Star, Volume2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { fetchKanjiList, fetchKanjiStudy, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";

export const Route = createFileRoute("/_authenticated/kanji")({ component: KanjiPage });

type KanjiRow = { id:string; character:string; level:Level; onyomi:string[]|null; kunyomi:string[]|null; meaning_id:string|null; stroke_count?:number|null; lesson_number?:number|null; lesson_title?:string|null };

function KanjiPage(){
  const {data:targetLevel,isLoading:levelLoading,error:levelError}=useQuery({queryKey:["target-level"],queryFn:fetchTargetLevel});
  const level:Level=targetLevel??"N5";
  const {data,isLoading,error}=useQuery({queryKey:["kanji",level],queryFn:()=>fetchKanjiList(level),enabled:!!targetLevel});
  const allCards=(data??[]) as KanjiRow[];
  const lessons=useMemo(()=>[...new Set(allCards.map(x=>x.lesson_number).filter((n):n is number=>typeof n==="number"))].sort((a,b)=>a-b),[allCards]);
  const [lesson,setLesson]=useState<number|null>(null); const [index,setIndex]=useState<number|null>(null); const [learned,setLearned]=useState<Record<string,boolean>>({}); const [fav,setFav]=useState<Record<string,boolean>>({}); const touch=useRef<number|null>(null); const qc=useQueryClient();
  useEffect(()=>{if(lessons.length)setLesson(c=>c&&lessons.includes(c)?c:lessons[0])},[level,lessons.join(",")]);
  const cards=lesson==null?allCards:allCards.filter(x=>x.lesson_number===lesson); const item=index==null?null:cards[index];
  const {data:study}=useQuery({queryKey:["kanji-study",item?.id],queryFn:()=>fetchKanjiStudy(item!.id),enabled:!!item?.id});
  const mutation=useMutation({mutationFn:(id:string)=>markItemLearned({itemType:"kanji",itemId:id,level}),onSuccess:(_,id)=>{setLearned(v=>({...v,[id]:true}));void qc.invalidateQueries({queryKey:["my-progress"]})}});
  const speak=(t:string)=>{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang="ja-JP";u.rate=.85;window.speechSynthesis.speak(u)};
  const prev=()=>setIndex(i=>i==null?0:Math.max(0,i-1)); const next=()=>setIndex(i=>i==null?0:Math.min(cards.length-1,i+1));
  const finishSwipe=(x:number)=>{if(touch.current==null)return;const d=x-touch.current;if(Math.abs(d)>45)(d<0?next:prev)();touch.current=null};

  return <AppShell title="Kanji" backTo="/belajar" backLabel="Materi" compact>
    {levelLoading?<p className="py-8 text-center text-xs text-muted-foreground">Memuat level…</p>:levelError?<p className="py-8 text-center text-xs text-destructive">Level profil tidak dapat dimuat.</p>:<div className="mx-auto max-w-md">
      {index==null?<>
        <div className="mb-3 flex items-end justify-between"><div><h1 className="text-[20px] font-bold tracking-tight">Kanji {level}</h1></div><span className="text-[11px] font-semibold text-muted-foreground">{allCards.length} / {allCards.length}</span></div>
        {lessons.length>0&&<div className="relative mb-3"><select value={lesson??""} onChange={e=>{setLesson(Number(e.target.value));setIndex(null)}} className="h-10 w-full appearance-none rounded-xl border bg-background px-3 pr-9 text-[12px] font-medium outline-none focus:border-primary"><option value="">Pilih bab</option>{lessons.map(n=><option key={n} value={n}>Bab {n}{allCards.find(x=>x.lesson_number===n)?.lesson_title?` — ${allCards.find(x=>x.lesson_number===n)?.lesson_title}`:""}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/></div>}
        {error&&<p className="mb-3 text-xs text-destructive">Gagal memuat materi Kanji.</p>}
        {isLoading?<p className="py-10 text-center text-xs text-muted-foreground">Memuat materi…</p>:<div className="grid grid-cols-4 gap-2">{cards.map((k,i)=><button key={k.id} onClick={()=>setIndex(i)} className="relative min-h-[78px] rounded-xl border bg-card px-1 py-2 text-center transition hover:border-primary/40 hover:shadow-sm">
          {learned[k.id]&&<span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-[9px] text-primary-foreground">✓</span>}
          <div lang="ja" className="font-jp text-[30px] font-semibold leading-none">{k.character}</div><p className="mt-2 line-clamp-1 text-[9px] font-medium text-muted-foreground">{k.meaning_id||"—"}</p>
        </button>)}</div>}
      </>:item?<div onTouchStart={e=>touch.current=e.touches[0].clientX} onTouchEnd={e=>finishSwipe(e.changedTouches[0].clientX)}>
        <div className="mb-3 flex items-center justify-between"><button onClick={()=>setIndex(null)} className="flex items-center gap-1.5 text-[12px] font-semibold"><ArrowLeft className="size-4"/>Kanji {level}</button><span className="text-[11px] font-semibold text-muted-foreground">{index+1} / {cards.length}</span></div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between"><button onClick={prev} disabled={index===0} className="grid size-10 place-items-center rounded-full bg-primary/8 text-primary disabled:opacity-30"><ArrowLeft className="size-5"/></button><div className="text-center"><div lang="ja" className="font-jp text-[76px] font-semibold leading-none">{item.character}</div><p className="mt-2 font-jp text-[13px] font-semibold">{[...(item.onyomi??[]),...(item.kunyomi??[])].join("・")||"—"}</p><p className="mt-1 text-[14px] font-semibold">{item.meaning_id||"Arti belum tersedia"}</p></div><button onClick={next} disabled={index===cards.length-1} className="grid size-10 place-items-center rounded-full bg-primary/8 text-primary disabled:opacity-30"><ArrowRight className="size-5"/></button></div>
          <div className="mt-3 flex items-center justify-center gap-2"><button onClick={()=>speak(item.character)} className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground"><Volume2 className="size-5"/></button><button onClick={()=>setFav(v=>({...v,[item.id]:!v[item.id]}))} className="grid size-10 place-items-center rounded-full border"><Star className={`size-4 ${fav[item.id]?"fill-current text-primary":""}`}/></button></div>
          <div className="mt-4 grid grid-cols-3 gap-2">{[["Onyomi",(item.onyomi??[]).join("・")||"—"],["Kunyomi",(item.kunyomi??[]).join("・")||"—"],["Jumlah Coretan",String(item.stroke_count??"—")]].map(([a,b])=><div key={a} className="rounded-xl bg-primary/7 p-2.5 text-center"><p className="text-[9px] font-medium text-muted-foreground">{a}</p><p className="mt-1 font-jp text-[12px] font-bold">{b}</p></div>)}</div>
          {(study?.relatedWords?.length??0)>0&&<section className="mt-4"><h2 className="text-[12px] font-bold">Contoh Kosakata</h2><div className="mt-2 space-y-2">{(study?.relatedWords??[]).slice(0,4).map((w:any,i:number)=><div key={`${w.term}-${i}`} className="flex items-baseline gap-2 text-[11px]"><span className="text-primary">◆</span><span className="font-jp font-semibold">{w.term}</span>{w.reading&&<span className="font-jp text-muted-foreground">({w.reading})</span>}<span className="ml-auto text-muted-foreground">{w.meaning}</span></div>)}</div></section>}
          {asExamples(study?.examples).length>0&&<section className="mt-4"><h2 className="text-[12px] font-bold">Contoh Kalimat</h2>{asExamples(study?.examples).slice(0,2).map((e,i)=><div key={i} className="mt-2 text-[11px] leading-5"><p lang="ja" className="font-jp text-[13px]">{e.jp}</p>{e.reading&&<p className="text-muted-foreground">{e.reading}</p>}{e.id&&<p className="text-muted-foreground">{e.id}</p>}</div>)}</section>}
          <div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" className="h-10 rounded-full text-[11px]" onClick={()=>setFav(v=>({...v,[item.id]:true}))}><Star className="mr-1.5 size-3.5"/>Tambah ke Review</Button><Button className="h-10 rounded-full text-[11px]" onClick={()=>mutation.mutate(item.id)} disabled={mutation.isPending||learned[item.id]}>{learned[item.id]?<><Check className="mr-1.5 size-3.5"/>Sudah Hafal</>:"Sudah Hafal"}</Button></div>
          <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" className="h-10 rounded-full text-[11px]" onClick={prev} disabled={index===0}><ArrowLeft className="mr-1.5 size-3.5"/>Sebelumnya</Button><Button variant="outline" className="h-10 rounded-full text-[11px]" onClick={next} disabled={index===cards.length-1}>Selanjutnya<ArrowRight className="ml-1.5 size-3.5"/></Button></div>
        </div>
      </div>:null}
    </div>}
  </AppShell>
}
