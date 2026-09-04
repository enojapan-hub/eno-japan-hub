import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Volume2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetchVocabList, markItemLearned, asExamples, type Level, type VocabSense } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";

export const Route=createFileRoute("/_authenticated/kotoba")({component:KotobaPage});
type VocabRow={id:string;term:string;reading:string|null;romaji:string|null;meaning_id:string|null;part_of_speech:string|null;examples:unknown;level:Level;source_book?:string|null;lesson_number?:number|null;lesson_title?:string|null;source_meaning_id?:string|null;senses?:VocabSense[]};

function KotobaPage(){
  const {data:targetLevel,isLoading:levelLoading,error:levelError}=useQuery({queryKey:["target-level"],queryFn:fetchTargetLevel,retry:1});
  const level:Level=targetLevel??"N5";
  const {data,isLoading,error}=useQuery({queryKey:["vocab",level],queryFn:()=>fetchVocabList(level),enabled:!!targetLevel,retry:1});
  const allCards=(data??[]) as VocabRow[];
  const lessons=useMemo(()=>[...new Set(allCards.map(x=>x.lesson_number).filter((n):n is number=>typeof n==="number"))].sort((a,b)=>a-b),[allCards]);
  const [lesson,setLesson]=useState<number|null>(null); const [index,setIndex]=useState<number|null>(null); const [learned,setLearned]=useState<Record<string,boolean>>({}); const touchStart=useRef<number|null>(null); const qc=useQueryClient();
  useEffect(()=>{if(lessons.length)setLesson(c=>c&&lessons.includes(c)?c:lessons[0])},[level,lessons.join(",")]);
  const cards=lesson==null?allCards:allCards.filter(x=>x.lesson_number===lesson); const item=index==null?null:cards[index];
  const senses=useMemo(()=>item?(item.senses??[]).filter(s=>s.meaning_id?.trim()):[],[item]);
  const examples=useMemo(()=>item?[...asExamples(item.examples),...senses.flatMap(s=>asExamples(s.examples))].slice(0,3):[],[item,senses]);
  const mutation=useMutation({mutationFn:(id:string)=>markItemLearned({itemType:"vocabulary",itemId:id,level}),onSuccess:(_,id)=>{setLearned(v=>({...v,[id]:true}));void qc.invalidateQueries({queryKey:["my-progress"]})}});
  const speak=(t:string)=>{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang="ja-JP";u.rate=.85;window.speechSynthesis.speak(u)};
  const prev=()=>setIndex(i=>i==null?0:Math.max(0,i-1)); const next=()=>setIndex(i=>i==null?0:Math.min(cards.length-1,i+1));
  const touchEnd=(x:number)=>{if(touchStart.current==null)return;const d=x-touchStart.current;if(Math.abs(d)>45){d<0?next():prev()}touchStart.current=null};

  return <AppShell title="言葉 · Kotoba" backTo="/belajar" backLabel="Materi" compact>{levelLoading?<p className="py-8 text-center text-sm text-muted-foreground">Memuat level…</p>:levelError?<p className="py-8 text-center text-sm text-destructive">Level profil tidak dapat dimuat.</p>:<div className="mx-auto max-w-3xl space-y-3">
    <div className="flex items-center justify-between"><div><h1 className="text-[18px] font-bold">Kotoba {level}</h1><p className="text-[11px] text-muted-foreground">Daftar kosakata per bab.</p></div><Badge>{allCards.length} kata</Badge></div>
    {lessons.length>0&&<div className="flex gap-2 overflow-x-auto pb-1">{lessons.map(n=><Button key={n} size="sm" variant={lesson===n?"default":"outline"} className="h-8 shrink-0 rounded-full px-3 text-[11px]" onClick={()=>{setLesson(n);setIndex(null)}}>Bab {n}</Button>)}</div>}
    {error&&<p className="text-xs text-destructive">Kosakata gagal dimuat.</p>}
    {isLoading?<p className="py-8 text-center text-xs text-muted-foreground">Memuat materi…</p>:index==null?<div className="space-y-2">{cards.map((w,i)=><button key={w.id} onClick={()=>setIndex(i)} className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-sm hover:border-primary/40"><div className="min-w-0 flex-1"><div className="font-jp text-[17px] font-semibold">{w.term} {w.reading&&<span className="ml-1 text-[11px] font-normal text-muted-foreground">{w.reading}</span>}</div><p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{w.meaning_id||w.source_meaning_id||"Arti belum tersedia"}</p></div>{learned[w.id]&&<Check className="size-4 text-primary"/>}<ChevronRight className="size-4 text-muted-foreground"/></button>)}</div>:item?<div onTouchStart={e=>touchStart.current=e.touches[0].clientX} onTouchEnd={e=>touchEnd(e.changedTouches[0].clientX)}>
      <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground"><button onClick={()=>setIndex(null)} className="font-semibold text-primary">← Daftar Bab {lesson}</button><span>{index+1}/{cards.length}</span></div>
      <Card className="rounded-3xl shadow-sm"><CardContent className="p-4 sm:p-5"><div className="text-center"><div lang="ja" className="font-jp text-[42px] font-bold leading-tight">{item.term}</div>{item.reading&&<p className="mt-1 font-jp text-[13px] text-muted-foreground">{item.reading}</p>}<h2 className="mt-3 text-[18px] font-bold">{item.meaning_id||item.source_meaning_id||"Arti belum tersedia"}</h2>{item.part_of_speech&&<Badge variant="secondary" className="mt-2 text-[10px]">{item.part_of_speech}</Badge>}<Button variant="outline" size="sm" className="mt-3 h-8 rounded-full text-[11px]" onClick={()=>speak(item.term)}><Volume2 className="mr-1.5 size-3.5"/>Audio</Button></div>
      {senses.length>1&&<section className="mt-4"><h3 className="text-[12px] font-bold">Penggunaan</h3><div className="mt-2 space-y-2">{senses.slice(0,3).map((s,i)=><div key={i} className="rounded-xl border p-3"><p className="text-[12px] font-semibold">{s.meaning_id}</p>{s.usage_note_id&&<p className="mt-1 text-[11px] leading-5 text-muted-foreground">{s.usage_note_id}</p>}</div>)}</div></section>}
      {examples.length>0&&<section className="mt-4"><h3 className="text-[12px] font-bold">Contoh kalimat</h3>{examples.map((e,i)=><div key={i} className="mt-2 rounded-xl border p-3"><p className="font-jp text-sm leading-6">{e.jp}</p>{e.id&&<p className="mt-1 text-[11px] text-muted-foreground">{e.id}</p>}</div>)}</section>}
      <Button className="mt-4 h-10 w-full rounded-xl text-[12px]" variant={learned[item.id]?"secondary":"default"} disabled={learned[item.id]||mutation.isPending} onClick={()=>mutation.mutate(item.id)}>{learned[item.id]?<><Check className="mr-2 size-4"/>Sudah dipelajari</>:"Tandai sudah dipelajari"}</Button>
      <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" className="h-10 rounded-xl text-[11px]" disabled={index===0} onClick={prev}><ArrowLeft className="mr-1.5 size-4"/>Sebelumnya</Button><Button className="h-10 rounded-xl text-[11px]" disabled={index===cards.length-1} onClick={next}>Selanjutnya<ArrowRight className="ml-1.5 size-4"/></Button></div><p className="mt-2 text-center text-[9px] text-muted-foreground">Geser kiri / kanan untuk berpindah kata</p>
      </CardContent></Card></div>:null}
  </div>}</AppShell>;
}
