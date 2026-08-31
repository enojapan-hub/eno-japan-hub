import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LevelTabs } from "@/components/learn/LevelTabs";
import { StudyFlashcard } from "@/components/learn/StudyFlashcard";
import { fetchKanjiList, fetchKanjiStudy, markItemLearned, type Level, asExamples } from "@/lib/learn-queries";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/_authenticated/kanji")({ component: KanjiPage });
function KanjiPage(){
  const[level,setLevel]=useState<Level>("N5"); const[index,setIndex]=useState(0); const[learned,setLearned]=useState<Record<string,boolean>>({}); const[furigana,setFurigana]=useState(true); const qc=useQueryClient();
  const{data,isLoading,error}=useQuery({queryKey:["kanji",level],queryFn:()=>fetchKanjiList(level)});
  const cards=data??[]; const item=cards[index];
  const{data:study}=useQuery({queryKey:["kanji-study",item?.id],queryFn:()=>fetchKanjiStudy(item!.id),enabled:!!item?.id});
  useQuery({queryKey:["furigana-setting"],queryFn:async()=>{const{data:u}=await supabase.auth.getUser();if(!u.user)return true;const{data}=await supabase.from("user_settings").select("furigana_enabled").eq("user_id",u.user.id).maybeSingle();const enabled=data?.furigana_enabled??true;setFurigana(enabled);return enabled;}});
  const mutation=useMutation({mutationFn:(id:string)=>markItemLearned({itemType:"kanji",itemId:id,level}),onSuccess:(_,id)=>{setLearned(x=>({...x,[id]:true}));void qc.invalidateQueries({queryKey:["my-progress"]})}});
  const meaning=(item?.meaning_id||"Arti belum tersedia") as string; const examples=asExamples(study?.examples);
  const choices=item?[meaning,...cards.filter((x:any)=>x.id!==item.id&&x.meaning_id).slice(0,3).map((x:any)=>x.meaning_id)]:[];
  const reading=[...(item?.onyomi??[]),...(item?.kunyomi??[])].join("・");
  return <AppShell title="漢字 · Kanji" description="Pelajari kanji melalui arti, bacaan, contoh penggunaan, audio, dan latihan." backTo="/belajar" backLabel="Belajar">
    <div className="mb-4 flex items-center justify-between rounded-xl border bg-muted/30 p-3"><span className="text-sm">Furigana / bacaan</span><button type="button" className="rounded-full border px-3 py-1 text-sm" onClick={()=>setFurigana(v=>!v)}>{furigana?"Aktif":"Mati"}</button></div>
    <LevelTabs value={level} onChange={v=>{setLevel(v);setIndex(0)}}/>
    {error&&<p className="mt-5 text-sm text-destructive">Gagal memuat kanji. Silakan coba lagi.</p>}{isLoading&&<p className="mt-8 text-center text-sm text-muted-foreground">Memuat materi…</p>}
    {item&&<div className="mt-6"><StudyFlashcard index={index} total={cards.length} level={item.level} title={item.character} reading={furigana?reading:null} meaning={meaning} secondary={item.stroke_count?`${item.stroke_count} coretan`:null} explanation={`Kanji ${item.character} berarti ${meaning}. Bacaan yang tampil di atas membantu mengenali cara membaca kanji ini. Pelajari juga kata dan kalimat yang menggunakan kanji tersebut agar hafalan tidak terlepas dari konteks.`} examples={examples} furiganaEnabled={furigana} question={choices.length>1?{prompt:`Apa arti kanji ${item.character}?`,choices,correctIndex:0}:null} learned={!!learned[item.id]} onLearned={()=>mutation.mutate(item.id)} onPrev={()=>setIndex(i=>Math.max(0,i-1))} onNext={()=>setIndex(i=>Math.min(cards.length-1,i+1))}/></div>}
    {!isLoading&&!cards.length&&<p className="mt-8 text-center text-sm text-muted-foreground">Belum ada kanji untuk {level}.</p>}
  </AppShell>}
