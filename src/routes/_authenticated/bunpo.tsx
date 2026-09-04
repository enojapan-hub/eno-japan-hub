import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Info, ListTree, Volume2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetchGrammarList, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";

export const Route = createFileRoute("/_authenticated/bunpo")({ component: BunpoPage });
const splitStructure=(v?:string|null)=>v?.split(/\n|\\n|;/).map(x=>x.trim()).filter(Boolean)??[];
const usable=(id?:string|null,en?:string|null)=>!!id?.trim()&&id.trim().toLowerCase()!==(en??"").trim().toLowerCase();

function BunpoPage(){
  const {data:targetLevel,isLoading:levelLoading,error:levelError}=useQuery({queryKey:["target-level"],queryFn:fetchTargetLevel}); const level:Level=targetLevel??"N5";
  const {data,isLoading,error}=useQuery({queryKey:["grammar",level],queryFn:()=>fetchGrammarList(level),enabled:!!targetLevel});
  const cards=useMemo(()=>((data??[]).filter(c=>usable(c.meaning_id,c.meaning_en))),[data]);
  const lessons=useMemo(()=>[...new Set(cards.map(c=>c.lesson_number).filter((n):n is number=>typeof n==="number"))].sort((a,b)=>a-b),[cards]);
  const [lesson,setLesson]=useState<number|null>(null); const [index,setIndex]=useState<number|null>(null); const [learned,setLearned]=useState<Record<string,boolean>>({}); const touchStart=useRef<number|null>(null); const qc=useQueryClient();
  const activeLesson=lesson??lessons[0]??null; const list=activeLesson==null?cards:cards.filter(c=>c.lesson_number===activeLesson); const item=index==null?null:list[index];
  const examples=item?asExamples(item.examples):[]; const structures=item?splitStructure(item.structure):[];
  const mutation=useMutation({mutationFn:(id:string)=>markItemLearned({itemType:"grammar",itemId:id,level}),onSuccess:(_,id)=>{setLearned(v=>({...v,[id]:true}));void qc.invalidateQueries({queryKey:["my-progress"]})}});
  const speak=(t:string)=>{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang="ja-JP";u.rate=.85;window.speechSynthesis.speak(u)};
  const prev=()=>setIndex(i=>i==null?0:Math.max(0,i-1)); const next=()=>setIndex(i=>i==null?0:Math.min(list.length-1,i+1)); const touchEnd=(x:number)=>{if(touchStart.current==null)return;const d=x-touchStart.current;if(Math.abs(d)>45){d<0?next():prev()}touchStart.current=null};

  return <AppShell title="文法 · Bunpō" backTo="/belajar" backLabel="Materi" compact>{levelLoading?<p className="py-8 text-center text-sm text-muted-foreground">Memuat level…</p>:levelError?<p className="py-8 text-center text-sm text-destructive">Level profil tidak dapat dimuat.</p>:<div className="mx-auto max-w-3xl space-y-3">
    <div className="flex items-center justify-between"><div><h1 className="text-[18px] font-bold">Bunpō {level}</h1><p className="text-[11px] text-muted-foreground">Pola grammar disusun per bab.</p></div><Badge>{cards.length} pola</Badge></div>
    {lessons.length>0&&<div className="flex gap-2 overflow-x-auto pb-1">{lessons.map(n=><Button key={n} size="sm" variant={activeLesson===n?"default":"outline"} className="h-8 shrink-0 rounded-full px-3 text-[11px]" onClick={()=>{setLesson(n);setIndex(null)}}>Bab {n}</Button>)}</div>}
    {error&&<p className="text-xs text-destructive">Bunpō gagal dimuat.</p>}
    {isLoading?<p className="py-8 text-center text-xs text-muted-foreground">Memuat materi…</p>:index==null?<div className="space-y-2">{list.map((g,i)=><button key={g.id} onClick={()=>setIndex(i)} className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-sm hover:border-primary/40"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">{i+1}</span><div className="min-w-0 flex-1"><div lang="ja" className="font-jp text-[17px] font-bold">{g.pattern}</div><p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{g.meaning_id}</p></div>{learned[g.id]&&<Check className="size-4 text-primary"/>}<ChevronRight className="size-4 text-muted-foreground"/></button>)}</div>:item?<div onTouchStart={e=>touchStart.current=e.touches[0].clientX} onTouchEnd={e=>touchEnd(e.changedTouches[0].clientX)}>
      <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground"><button onClick={()=>setIndex(null)} className="font-semibold text-primary">← Daftar Bab {activeLesson}</button><span>{index+1}/{list.length}</span></div>
      <Card className="rounded-3xl shadow-sm"><CardContent className="p-4 sm:p-5"><div className="text-center"><Badge variant="secondary">{item.level}</Badge><div lang="ja" className="mt-3 font-jp text-[34px] font-bold">{item.pattern}</div><h2 className="mt-3 text-[17px] font-bold leading-6">{item.meaning_id}</h2><Button variant="outline" size="sm" className="mt-3 h-8 rounded-full text-[11px]" onClick={()=>speak(item.pattern)}><Volume2 className="mr-1.5 size-3.5"/>Audio</Button></div>
      {structures.length>0&&<section className="mt-4 rounded-2xl border p-3"><h3 className="flex items-center gap-2 text-[12px] font-bold"><ListTree className="size-4 text-primary"/>Struktur</h3><div className="mt-2 space-y-1">{structures.map((s,i)=><p key={i} className="text-[12px] leading-5">• {s}</p>)}</div></section>}
      {item.explanation_id?.trim()&&<section className="mt-3 rounded-2xl border p-3"><h3 className="flex items-center gap-2 text-[12px] font-bold"><Info className="size-4 text-primary"/>Penjelasan</h3><p className="mt-2 whitespace-pre-line text-[12px] leading-5 text-muted-foreground">{item.explanation_id}</p></section>}
      {examples.length>0&&<section className="mt-3 rounded-2xl border p-3"><h3 className="flex items-center gap-2 text-[12px] font-bold"><BookOpen className="size-4 text-primary"/>Contoh</h3>{examples.slice(0,3).map((e,i)=><div key={i} className="mt-2 rounded-xl bg-muted/30 p-3"><p className="font-jp text-sm leading-6">{e.jp}</p>{e.id&&<p className="mt-1 text-[11px] leading-5 text-muted-foreground">{e.id}</p>}</div>)}</section>}
      <Button className="mt-4 h-10 w-full rounded-xl text-[12px]" variant={learned[item.id]?"secondary":"default"} disabled={mutation.isPending||learned[item.id]} onClick={()=>mutation.mutate(item.id)}>{learned[item.id]?<><Check className="mr-2 size-4"/>Sudah dipelajari</>:"Tandai sudah dipelajari"}</Button>
      <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" className="h-10 rounded-xl text-[11px]" disabled={index===0} onClick={prev}><ArrowLeft className="mr-1.5 size-4"/>Sebelumnya</Button><Button className="h-10 rounded-xl text-[11px]" disabled={index===list.length-1} onClick={next}>Selanjutnya<ArrowRight className="ml-1.5 size-4"/></Button></div><p className="mt-2 text-center text-[9px] text-muted-foreground">Geser kiri / kanan untuk berpindah pola</p>
      </CardContent></Card></div>:<div className="rounded-2xl border p-6 text-center text-sm text-muted-foreground">Belum ada materi Bunpō yang siap untuk {level}.</div>}
  </div>}</AppShell>;
}
