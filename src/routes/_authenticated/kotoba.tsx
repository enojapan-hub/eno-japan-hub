import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight, Star, Volume2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { markItemLearned, asExamples, type Level, type VocabSense } from "@/lib/learn-queries";
import { fetchVocabListResilient } from "@/lib/vocab-resilient";
import { fetchTargetLevel } from "@/lib/target-level";
import { supabase } from "@/integrations/supabase/client";

const LEVELS: Level[]=["N5","N4","N3","N2","N1"];
export const Route=createFileRoute("/_authenticated/kotoba")({
  validateSearch:(search:Record<string,unknown>)=>({level:LEVELS.includes(search.level as Level)?search.level as Level:undefined}),
  component:KotobaPage,
});
type VocabRow={id:string;term:string;reading:string|null;romaji?:string|null;meaning_id:string|null;part_of_speech:string|null;examples:unknown;level:Level;source_book?:string|null;lesson_number?:number|null;lesson_title?:string|null;source_meaning_id?:string|null;senses?:VocabSense[]};
const tones=["bg-rose-50 text-rose-500","bg-amber-50 text-amber-500","bg-emerald-50 text-emerald-600","bg-sky-50 text-sky-600"];
const extraKey=-1;
function displayChapter(level:Level,raw:number){if(level==="N4"&&raw>=26&&raw<=50)return raw-25;return raw}

function KotobaPage(){
  const search=Route.useSearch();
  const {data:targetLevel,isLoading:levelLoading,error:levelError}=useQuery({queryKey:["target-level"],queryFn:fetchTargetLevel,retry:1});
  const level:Level=(search.level as Level|undefined)??targetLevel??"N5";
  const ready=Boolean(search.level)||!levelLoading;
  const {data,isLoading,error,refetch}=useQuery({queryKey:["vocab-primary",level],queryFn:()=>fetchVocabListResilient(level),enabled:ready,retry:2});
  const {data:masteredRows}=useQuery({queryKey:["mastered-items","vocabulary",level],enabled:ready,queryFn:async()=>{const {data:auth}=await supabase.auth.getUser();if(!auth.user)return [] as Array<{item_id:string}>;const {data,error}=await supabase.from("user_item_progress").select("item_id").eq("user_id",auth.user.id).eq("item_type","vocabulary").eq("level",level);if(error)throw error;return (data??[]) as Array<{item_id:string}>;}});
  const allCards=(data??[]) as VocabRow[];
  const lessons=useMemo(()=>[...new Set(allCards.map(x=>x.lesson_number).filter((n):n is number=>typeof n==="number"))].sort((a,b)=>a-b),[allCards]);
  const extras=useMemo(()=>allCards.filter(x=>x.lesson_number==null),[allCards]);
  const [lesson,setLesson]=useState<number|null>(null);
  const [index,setIndex]=useState<number|null>(null);
  const [learned,setLearned]=useState<Record<string,boolean>>({});
  const [review,setReview]=useState<Record<string,boolean>>({});
  const touch=useRef<number|null>(null);
  const qc=useQueryClient();
  useEffect(()=>{setIndex(null);if(lessons.length)setLesson(c=>c!==null&&(c===extraKey||lessons.includes(c))?c:lessons[0]);else if(extras.length)setLesson(extraKey);else setLesson(null)},[level,lessons.join(","),extras.length]);
  useEffect(()=>{if(masteredRows)setLearned(Object.fromEntries(masteredRows.map(r=>[r.item_id,true])))},[masteredRows]);
  const cards=lesson===extraKey?extras:lesson==null?allCards:allCards.filter(x=>x.lesson_number===lesson);
  const item=index==null?null:allCards[index];
  const senses=useMemo(()=>item?(item.senses??[]).filter(s=>s.meaning_id?.trim()):[],[item]);
  const examples=useMemo(()=>item?[...asExamples(item.examples),...senses.flatMap(s=>asExamples(s.examples))].slice(0,4):[],[item,senses]);
  const mutation=useMutation({mutationFn:(id:string)=>markItemLearned({itemType:"vocabulary",itemId:id,level}),onSuccess:(_,id)=>{setLearned(v=>({...v,[id]:true}));void qc.invalidateQueries({queryKey:["my-progress"]});void qc.invalidateQueries({queryKey:["mastered-items","vocabulary",level]});void qc.invalidateQueries({queryKey:["dashboard-live"]});void qc.invalidateQueries({queryKey:["leaderboard"]})}});
  const speak=(t:string)=>{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang="ja-JP";u.rate=.85;window.speechSynthesis.speak(u)};
  const prev=()=>setIndex(i=>i==null?0:Math.max(0,i-1));
  const next=()=>setIndex(i=>i==null?0:Math.min(allCards.length-1,i+1));
  const finishSwipe=(x:number)=>{if(touch.current==null)return;const d=x-touch.current;if(Math.abs(d)>45)(d<0?next:prev)();touch.current=null};
  const sparse=lesson!==extraKey&&cards.length>0&&cards.length<10;
  const openDetail=(w:VocabRow)=>{const globalIndex=allCards.findIndex(x=>x.id===w.id&&x.lesson_number===w.lesson_number);setIndex(globalIndex>=0?globalIndex:0)};

  return <AppShell title="Kotoba" backTo="/belajar" backLabel="Materi" compact>{!ready?<p className="py-8 text-center text-xs text-muted-foreground">Memuat level…</p>:<div className="mx-auto max-w-md">
    {index==null?<><div className="mb-3 flex items-end justify-between"><div><h1 className="text-[20px] font-bold tracking-tight">Kosakata {level}</h1>{levelError&&!search.level&&<p className="mt-1 text-[10px] text-amber-700">Level profil tidak terbaca. Sementara menggunakan N5.</p>}</div><span className="text-[11px] font-semibold text-muted-foreground">{allCards.length}</span></div>
      <div className="mb-3 grid grid-cols-5 gap-1.5 rounded-xl border bg-card p-1.5">{LEVELS.map(l=><a key={l} href={`/kotoba?level=${l}`} className={`grid h-8 place-items-center rounded-lg text-[10px] font-semibold ${l===level?"bg-primary text-primary-foreground shadow-sm":"text-muted-foreground"}`}>{l}</a>)}</div>
      {(lessons.length>0||extras.length>0)&&<div className="relative mb-3"><select value={lesson??""} onChange={e=>{setLesson(Number(e.target.value));setIndex(null)}} className="h-10 w-full appearance-none rounded-xl border bg-background px-3 pr-9 text-[12px] font-medium outline-none focus:border-primary"><option value="">Pilih bab</option>{lessons.map(n=><option key={n} value={n}>Bab {displayChapter(level,n)} · {allCards.filter(x=>x.lesson_number===n).length} kata</option>)}{extras.length>0&&<option value={extraKey}>Materi tambahan · {extras.length} kata</option>}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/></div>}
      {sparse&&<div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-4 text-amber-800"><AlertTriangle className="mt-0.5 size-3.5 shrink-0"/><p>Bab {displayChapter(level,lesson!)} baru memiliki {cards.length} kosakata yang terpetakan. Materi bab sedang dilengkapi.</p></div>}
      {error&&<div className="mb-3 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive"><p className="font-semibold">Kosakata gagal dimuat dari database.</p><p className="mt-1 break-words text-[10px]">{error instanceof Error?error.message:"Koneksi database bermasalah"}</p><button onClick={()=>void refetch()} className="mt-2 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold">Coba lagi</button></div>}
      {isLoading?<p className="py-10 text-center text-xs text-muted-foreground">Memuat materi…</p>:!error&&allCards.length===0?<div className="rounded-xl border p-4 text-center text-xs text-muted-foreground">Belum ada kosakata {level} yang dipublikasikan di database.</div>:<div className="space-y-2">{cards.map((w,i)=><button key={`${w.id}-${i}`} onClick={()=>openDetail(w)} className="flex w-full items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left transition hover:border-primary/40"><span className={`grid size-7 shrink-0 place-items-center rounded-lg text-[10px] font-bold ${tones[i%tones.length]}`}>語</span><div className="min-w-0 flex-1"><div className="font-jp text-[14px] font-bold">{w.term}{w.reading&&<span className="ml-1.5 text-[10px] font-normal text-muted-foreground">（{w.reading}）</span>}</div><p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{w.meaning_id||w.source_meaning_id||"Arti belum tersedia"}</p></div>{learned[w.id]&&<Check className="size-3.5 text-primary"/>}<ChevronRight className="size-4 text-muted-foreground"/></button>)}</div>}</>:
      item?<div onTouchStart={e=>touch.current=e.touches[0].clientX} onTouchEnd={e=>finishSwipe(e.changedTouches[0].clientX)} className="pb-2">
        <div className="mb-4 flex items-center justify-between"><button onClick={()=>setIndex(null)} className="flex items-center gap-1.5 text-[12px] font-semibold"><ArrowLeft className="size-4"/>Kosakata {level}</button><span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">◔ {index+1} / {allCards.length}</span></div>
        <section className="px-1"><div className="grid grid-cols-[42px_1fr_42px] items-center gap-2"><button onClick={prev} disabled={index===0} className="grid size-10 place-items-center rounded-full bg-primary/[0.07] text-primary disabled:opacity-25"><ArrowLeft className="size-5"/></button><div className="min-w-0 text-center"><div lang="ja" className="font-jp text-[48px] font-bold leading-none tracking-tight">{item.term}</div>{item.reading&&<p lang="ja" className="mt-2 font-jp text-[15px] text-muted-foreground">{item.reading}</p>}<p className="mt-1 text-[16px] font-medium">{item.meaning_id||item.source_meaning_id||"Arti belum tersedia"}</p></div><button onClick={next} disabled={index===allCards.length-1} className="grid size-10 place-items-center rounded-full bg-primary/[0.07] text-primary disabled:opacity-25"><ArrowRight className="size-5"/></button></div>
          <div className="mt-3 flex items-center justify-center gap-3"><button onClick={()=>speak(item.term)} className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm"><Volume2 className="size-5"/></button><button onClick={()=>setReview(v=>({...v,[item.id]:!v[item.id]}))} className="grid size-10 place-items-center rounded-full bg-primary/[0.06] text-primary"><Star className={`size-4 ${review[item.id]?"fill-current":""}`}/></button></div>
          <div className="mt-4 grid grid-cols-2 gap-1.5"><Info label="Kelas Kata" value={item.part_of_speech||senses[0]?.part_of_speech||"—"}/><Info label="Arti Inggris" value="Belum tersedia"/></div>
          <section className="mt-1.5 rounded-xl bg-primary/[0.06] p-3"><h2 className="text-[10px] font-bold text-primary">Penggunaan</h2>{senses[0]?.usage_note_id?<p className="mt-1 text-[11px] leading-5 text-foreground/80">{senses[0].usage_note_id}</p>:<p className="mt-1 text-[11px] leading-5 text-muted-foreground">{item.meaning_id||item.source_meaning_id||"Catatan penggunaan belum tersedia."}</p>}</section>
          <section className="mt-4"><h2 className="text-[13px] font-bold">Contoh Kalimat</h2>{examples.length?<div className="mt-2 rounded-xl bg-muted/35 p-3">{examples.slice(0,1).map((e,i)=><div key={i} className="relative pr-8 text-[11px] leading-5"><button type="button" onClick={()=>e.jp&&speak(e.jp)} className="absolute right-0 top-0 grid size-7 place-items-center rounded-lg text-primary" aria-label="Putar contoh kalimat"><Volume2 className="size-4"/></button><p lang="ja" className="font-jp text-[14px] text-foreground">{e.jp}</p>{e.reading&&<p className="text-muted-foreground">{e.reading}</p>}{e.id&&<p className="text-foreground/80">{e.id}</p>}</div>)}</div>:<div className="mt-2 rounded-xl bg-muted/35 p-3 text-[11px] text-muted-foreground">Contoh kalimat belum tersedia.</div>}</section>
          <div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" className="h-10 rounded-full border-primary/15 bg-primary/[0.05] text-[10px] text-primary" onClick={()=>setReview(v=>({...v,[item.id]:true}))}><Star className="mr-1.5 size-3.5"/>Tambah ke Review</Button><Button className="h-10 rounded-full text-[10px]" onClick={()=>mutation.mutate(item.id)} disabled={learned[item.id]||mutation.isPending}>{learned[item.id]?<><Check className="mr-1.5 size-3.5"/>Sudah Hafal</>:"Sudah Hafal · +5 XP"}</Button></div><div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" className="h-10 rounded-full text-[10px]" onClick={prev} disabled={index===0}><ArrowLeft className="mr-1.5 size-3.5"/>Sebelumnya</Button><Button variant="outline" className="h-10 rounded-full text-[10px]" onClick={next} disabled={index===allCards.length-1}>Selanjutnya<ArrowRight className="ml-1.5 size-3.5"/></Button></div>
        </section></div>:null}
  </div>}</AppShell>
}
function Info({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-primary/[0.06] p-3"><p className="text-[9px] font-semibold text-primary">{label}</p><p className="mt-1 text-[11px] font-medium">{value}</p></div>}
