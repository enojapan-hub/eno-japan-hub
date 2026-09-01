import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LevelTabs } from "@/components/learn/LevelTabs";
import { StudyFlashcard } from "@/components/learn/StudyFlashcard";
import { fetchGrammarList, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
export const Route=createFileRoute("/_authenticated/bunpo")({component:BunpoPage});
function mistakeFor(pattern:string){
  if(pattern.includes("なければならない")) return {wrong:"食べるなければならない。",right:"食べなければならない。",note:"Gunakan bentuk ない lalu hilangkan い sebelum menambahkan なければならない."};
  if(pattern.includes("てはいけない")) return {wrong:"食べてはいけます。",right:"食べてはいけません。",note:"Untuk larangan sopan, bentuk yang lazim adalah 〜てはいけません."};
  if(pattern.includes("たことがある")) return {wrong:"日本へ行くことがあります。",right:"日本へ行ったことがあります。",note:"Pola ini menyatakan pengalaman yang pernah dilakukan, sehingga menggunakan bentuk lampau た."};
  if(pattern.includes("つもり")) return {wrong:"日本へ行くつもりでした。",right:"日本へ行くつもりです。",note:"Jangan menyamakan niat saat ini dengan rencana masa lalu; perhatikan bentuk waktu kalimat."};
  return {wrong:null,right:null,note:"Periksa bentuk kata sebelum pola dan jangan memasangkan pola dengan bentuk yang tidak sesuai. Contoh kesalahan khusus akan ditambahkan bertahap dari materi editorial ENO JAPAN."};
}
function BunpoPage(){
  const[level,setLevel]=useState<Level>("N5");const[index,setIndex]=useState(0);const[learned,setLearned]=useState<Record<string,boolean>>({});const qc=useQueryClient();
  const{data,isLoading,error}=useQuery({queryKey:["grammar",level],queryFn:()=>fetchGrammarList(level)});
  const mutation=useMutation({mutationFn:(id:string)=>markItemLearned({itemType:"grammar",itemId:id,level}),onSuccess:(_,id)=>{setLearned(x=>({...x,[id]:true}));void qc.invalidateQueries({queryKey:["my-progress"]})}});
  const cards=data??[];const item=cards[index];const examples=item?asExamples(item.examples):[];const meaning=item?.meaning_id||"Arti belum tersedia";const explanation=item?.explanation_id||"Penjelasan belum tersedia.";const choices=item?[meaning,...cards.filter((x:any)=>x.id!==item.id&&x.meaning_id).slice(0,3).map((x:any)=>x.meaning_id)]:[];const mistake=item?mistakeFor(item.pattern):null;
  return <AppShell title="文法 · Bunpō" description="Belajar tata bahasa dengan pola, arti, cara penggunaan, contoh, kesalahan umum, dan latihan." backTo="/belajar" backLabel="Belajar">
    <LevelTabs value={level} onChange={v=>{setLevel(v);setIndex(0)}}/>
    {error&&<p className="mt-5 text-sm text-destructive">Gagal memuat tata bahasa. Silakan coba lagi.</p>}{isLoading&&<p className="mt-8 text-center text-sm text-muted-foreground">Memuat materi…</p>}
    {item&&<div className="mt-6 space-y-5">
      <StudyFlashcard index={index} total={cards.length} level={item.level} title={item.pattern} meaning={meaning} structure={item.structure} explanation={explanation} examples={examples} question={choices.length>1?{prompt:`Apa fungsi pola ${item.pattern}?`,choices,correctIndex:0}:null} learned={!!learned[item.id]} onLearned={()=>mutation.mutate(item.id)} onPrev={()=>setIndex(i=>Math.max(0,i-1))} onNext={()=>setIndex(i=>Math.min(cards.length-1,i+1))}/>
      <section className="mx-auto max-w-2xl rounded-2xl border bg-muted/25 p-5"><p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">CARA MENGGUNAKAN DENGAN EFISIEN</p><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6"><li>Pahami arti dan fungsi pola sebelum menghafalkan rumusnya.</li><li>Perhatikan bentuk kata yang ditempelkan pada pola.</li><li>Baca beberapa contoh dalam konteks berbeda.</li><li>Kerjakan latihan tanpa melihat arti terlebih dahulu, lalu periksa pembahasannya.</li><li>Masukkan pola yang masih salah ke pengulangan agar muncul kembali saat waktunya tiba.</li></ol><p className="mt-4 text-xs leading-5 text-muted-foreground">Materi ENO JAPAN disusun dengan prinsip bertahap dan berbasis konteks, dengan acuan pola yang lazim ditemukan dalam buku pembelajaran seperti Genki, Minna no Nihongo, TRY! JLPT, Shin Kanzen Master, serta materi Tobira. ENO JAPAN tidak menyalin isi buku secara utuh.</p></section>
      {mistake&&<section className="mx-auto max-w-2xl rounded-2xl border bg-background p-5"><p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">KESALAHAN UMUM</p>{mistake.wrong&&<><div className="mt-3 rounded-xl bg-destructive/5 p-4"><p className="text-sm font-semibold text-destructive">✗ {mistake.wrong}</p></div><div className="mt-2 rounded-xl bg-emerald-500/5 p-4"><p className="text-sm font-semibold">✓ {mistake.right}</p></div></>}<p className="mt-3 text-sm leading-6 text-muted-foreground">{mistake.note}</p></section>}
    </div>}
    {!isLoading&&!cards.length&&<p className="mt-8 text-center text-sm text-muted-foreground">Belum ada pola tata bahasa untuk {level}.</p>}
  </AppShell>
}
