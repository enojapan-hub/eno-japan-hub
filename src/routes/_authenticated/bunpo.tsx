import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { fetchGrammarList, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";
import { supabase } from "@/integrations/supabase/client";

export const Route=createFileRoute("/_authenticated/bunpo")({component:BunpoPage});
const split=(v?:string|null)=>v?.split(/\n|\\n|;/).map(x=>x.trim()).filter(Boolean)??[];
const usable=(id?:string|null)=>!!id?.trim();

function BunpoPage(){
  const {data:targetLevel,isLoading:levelLoading,error:levelError}=useQuery({queryKey:["target-level"],queryFn:fetchTargetLevel});
  const level:Level=targetLevel??"N5";
  const {data,isLoading,error}=useQuery({queryKey:["grammar",level],queryFn:()=>fetchGrammarList(level),enabled:!!targetLevel});
  const {data:masteredRows}=useQuery({queryKey:["mastered-items","grammar",level],enabled:!!targetLevel,queryFn:async()=>{const {data:auth}=await supabase.auth.getUser();if(!auth.user)return [] as Array<{item_id:string}>;const {data,error}=await supabase.from("user_item_progress").select("item_id").eq("user_id",auth.user.id).eq("item_type","grammar").eq("level",level).eq("status","mastered");if(error)throw error;return (data??[]) as Array<{item_id:string}>;}});
  const cards=useMemo(()=>((data??[]).filter(c=>usable(c.meaning_id))),[data]);
  const lessons=useMemo(()=>[...new Set(cards.map(c=>c.lesson_number).filter((n):n is number=>typeof n==="number"))].sort((a,b)=>a-b),[cards]);
  const [lesson,setLesson]=useState<number|null>(null);const [index,setIndex]=useState<number|null>(null);const [learned,setLearned]=useState<Record<string,boolean>>({});const touch=useRef<number|null>(null);const qc=useQueryClient();
  useEffect(()=>{if(masteredRows)setLearned(Object.fromEntries(masteredRows.map(r=>[r.item_id,true])))},[masteredRows]);
  const activeLesson=lesson??lessons[0]??null;const list=activeLesson==null?cards:cards.filter(c=>c.lesson_number===activeLesson);const item=index==null?null:list[index];
  const examples=item?asExamples(item.examples):[];const structures=item?split(item.structure):[];
  const mutation=useMutation({mutationFn:(id:string)=>markItemLearned({itemType:"grammar",itemId:id,level}),onSuccess:(_,id)=>{setLearned(v=>({...v,[id]:true}));void qc.invalidateQueries({queryKey:["my-progress"]});void qc.invalidateQueries({queryKey:["mastered-items","grammar",level]});void qc.invalidateQueries({queryKey:["leaderboard"]})}});
  const prev=()=>setIndex(i=>i==null?0:Math.max(0,i-1));const next=()=>setIndex(i=>i==null?0:Math.min(list.length-1,i+1));const finishSwipe=(x:number)=>{if(touch.current==null)return;const d=x-touch.current;if(Math.abs(d)>45)(d<0?next:prev)();touch.current=null};

  return <AppShell title="Bunpō" backTo="/belajar" backLabel="Materi" compact>{levelLoading?<p className="py-8 text-center text-xs text-muted-foreground">Memuat level…</p>:levelError?<p className="py-8 text-center text-xs text-destructive">Level profil tidak dapat dimuat.</p>:<div className="mx-auto max-w-md">
    {index==null?<>
      <div className="mb-3 flex items-end justify-between"><h1 className="text-[20px] font-bold tracking-tight">Bunpou {level}</h1><span className="text-[11px] font-semibold text-muted-foreground">{cards.length} pola</span></div>
      {lessons.length>0&&<div className="relative mb-3"><select value={activeLesson??""} onChange={e=>{setLesson(Number(e.target.value));setIndex(null)}} className="h-10 w-full appearance-none rounded-xl border bg-background px-3 pr-9 text-[12px] font-medium outline-none focus:border-primary">{lessons.map(n=><option key={n} value={n}>Bab {n}{cards.find(x=>x.lesson_number===n)?.lesson_title?` — ${cards.find(x=>x.lesson_number===n)?.lesson_title}`:""}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/></div>}
      {error&&<p className="mb-3 text-xs text-destructive">Bunpō gagal dimuat.</p>}
      {isLoading?<p className="py-10 text-center text-xs text-muted-foreground">Memuat materi…</p>:<div className="space-y-2">{list.map((g,i)=><button key={g.id} onClick={()=>setIndex(i)} className="flex w-full items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left transition hover:border-primary/40 hover:shadow-sm"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/8 text-[10px] font-bold text-primary">文</span><div className="min-w-0 flex-1"><div lang="ja" className="font-jp text-[15px] font-bold">{g.pattern}</div><p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{g.meaning_id}</p></div>{learned[g.id]&&<Check className="size-3.5 text-primary"/>}<ChevronRight className="size-4 text-muted-foreground"/></button>)}</div>}
    </>:item?<div onTouchStart={e=>touch.current=e.touches[0].clientX} onTouchEnd={e=>finishSwipe(e.changedTouches[0].clientX)}>
      <div className="mb-3 flex items-center justify-between"><button onClick={()=>setIndex(null)} className="flex items-center gap-1.5 text-[12px] font-semibold"><ArrowLeft className="size-4"/>Bunpou {level}</button><span className="text-[11px] font-semibold text-muted-foreground">{index+1} / {list.length}</span></div>
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><button onClick={prev} disabled={index===0} className="grid size-9 place-items-center rounded-full bg-primary/8 text-primary disabled:opacity-30"><ArrowLeft className="size-4"/></button><div lang="ja" className="font-jp text-[30px] font-bold">{item.pattern}</div><button onClick={next} disabled={index===list.length-1} className="grid size-9 place-items-center rounded-full bg-primary/8 text-primary disabled:opacity-30"><ArrowRight className="size-4"/></button></div>
        <section className="border-t py-3 first:border-t-0"><h2 className="text-[10px] font-bold text-muted-foreground">Arti</h2><p className="mt-1 text-[12px] leading-5">{item.meaning_id}</p></section>
        {item.explanation_id?.trim()&&<section className="border-t py-3"><h2 className="text-[10px] font-bold text-muted-foreground">Fungsi</h2><p className="mt-1 whitespace-pre-line text-[12px] leading-5">{item.explanation_id}</p></section>}
        {structures.length>0&&<section className="border-t py-3"><h2 className="text-[10px] font-bold text-muted-foreground">Struktur</h2><div className="mt-1 space-y-1">{structures.map((s,i)=><p key={i} className="font-jp text-[12px] leading-5">{s}</p>)}</div></section>}
        {examples.length>0&&<section className="border-t py-3"><h2 className="text-[10px] font-bold text-emerald-600">Contoh Benar ✓</h2>{examples.slice(0,3).map((e,i)=><div key={i} className="mt-2 text-[11px] leading-5"><p lang="ja" className="font-jp text-[13px]">{e.jp}</p>{e.reading&&<p className="text-muted-foreground">{e.reading}</p>}{e.id&&<p className="text-muted-foreground">{e.id}</p>}</div>)}</section>}
        {item.source_book&&<section className="border-t py-3"><h2 className="text-[10px] font-bold text-muted-foreground">Catatan</h2><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Sumber: {item.source_book}{item.lesson_number?` · Bab ${item.lesson_number}`:""}</p></section>}
        <Button className="mt-2 h-10 w-full rounded-full text-[11px]" onClick={()=>mutation.mutate(item.id)} disabled={mutation.isPending||learned[item.id]}>{learned[item.id]?<><Check className="mr-1.5 size-3.5"/>Sudah Hafal</>:"Sudah Hafal · +5 XP +5 Poin"}</Button>
      </div>
    </div>:<div className="rounded-xl border p-6 text-center text-xs text-muted-foreground">Belum ada Bunpō untuk {level}.</div>}
  </div>}</AppShell>
}
