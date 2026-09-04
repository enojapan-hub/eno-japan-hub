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
import { supabase } from "@/integrations/supabase/client";

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
  const { data: masteredRows } = useQuery({
    queryKey: ["mastered-items", "kanji", level],
    enabled: !!targetLevel,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [] as Array<{ item_id: string }>;
      const { data, error } = await supabase.from("user_item_progress").select("item_id").eq("user_id", auth.user.id).eq("item_type", "kanji").eq("level", level).eq("status", "mastered");
      if (error) throw error;
      return (data ?? []) as Array<{ item_id: string }>;
    },
  });
  const allCards = (data ?? []) as KanjiRow[];
  const lessons = useMemo(() => [...new Set(allCards.map(x => x.lesson_number).filter((n): n is number => typeof n === "number"))].sort((a,b)=>a-b), [allCards]);
  const [lesson, setLesson] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [learned, setLearned] = useState<Record<string, boolean>>({});
  const touchStart = useRef<number | null>(null);
  const qc = useQueryClient();

  useEffect(() => { if (lessons.length) setLesson(current => current && lessons.includes(current) ? current : lessons[0]); }, [level, lessons.join(",")]);
  useEffect(() => { if (masteredRows) setLearned(Object.fromEntries(masteredRows.map(r => [r.item_id, true]))); }, [masteredRows]);
  const chapterCards = lesson == null ? allCards : allCards.filter(x => x.lesson_number === lesson);
  const detailIndex = detailId ? allCards.findIndex(x => x.id === detailId) : -1;
  const item = detailIndex >= 0 ? allCards[detailIndex] : null;
  const { data: study } = useQuery({ queryKey: ["kanji-study", item?.id], queryFn: () => fetchKanjiStudy(item!.id), enabled: !!item?.id });
  const mutation = useMutation({ mutationFn: (id:string) => markItemLearned({ itemType:"kanji", itemId:id, level }), onSuccess:(_,id)=>{ setLearned(v=>({...v,[id]:true})); void qc.invalidateQueries({queryKey:["my-progress"]}); void qc.invalidateQueries({queryKey:["mastered-items","kanji",level]}); void qc.invalidateQueries({queryKey:["leaderboard"]}); } });
  const speak=(text:string)=>{ if(!window.speechSynthesis)return; window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang="ja-JP"; u.rate=.85; window.speechSynthesis.speak(u); };
  const goPrev=()=>{ if(detailIndex>0) setDetailId(allCards[detailIndex-1].id); };
  const goNext=()=>{ if(detailIndex>=0 && detailIndex<allCards.length-1) setDetailId(allCards[detailIndex+1].id); };
  const onTouchEnd=(x:number)=>{ if(touchStart.current==null)return; const d=x-touchStart.current; if(Math.abs(d)>45){ if(d<0) goNext(); else goPrev(); } touchStart.current=null; };

  return <AppShell title="漢字 · Kanji" backTo="/belajar" backLabel="Materi" compact>
    {levelLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Memuat level…</p> : levelError ? <p className="py-8 text-center text-sm text-destructive">Level profil tidak dapat dimuat.</p> :
    <div className="mx-auto max-w-3xl space-y-3">
      {!item ? <>
        <div className="flex items-center justify-between gap-3"><div><h1 className="text-[18px] font-bold">Kanji {level}</h1><p className="text-[11px] text-muted-foreground">Pilih bab lalu tap kanji untuk membuka detail.</p></div><Badge>{allCards.length} Kanji</Badge></div>
        {lessons.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1">{lessons.map(n=><Button key={n} size="sm" variant={lesson===n?"default":"outline"} className="h-8 shrink-0 rounded-full px-3 text-[11px]" onClick={()=>setLesson(n)}>Bab {n}</Button>)}</div>}
        {error && <p className="text-xs text-destructive">Gagal memuat materi Kanji.</p>}
        {isLoading ? <p className="py-8 text-center text-xs text-muted-foreground">Memuat materi…</p> :
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{chapterCards.map((k)=><button key={k.id} onClick={()=>setDetailId(k.id)} className="min-h-[78px] rounded-2xl border bg-card px-1.5 py-2 text-center shadow-sm transition hover:border-primary/40">
            <div lang="ja" className="font-jp text-[30px] font-semibold leading-none text-primary">{k.character}</div>
            <div className="mt-2 line-clamp-1 text-[10px] font-medium">{k.meaning_id || "—"}</div>
            {learned[k.id] && <div className="mt-1 text-[9px] font-semibold text-primary">✓ Hafal</div>}
          </button>)}</div>}
      </> : <div onTouchStart={e=>touchStart.current=e.touches[0].clientX} onTouchEnd={e=>onTouchEnd(e.changedTouches[0].clientX)}>
          <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground"><button onClick={()=>setDetailId(null)} className="font-semibold text-primary">← Daftar Kanji</button><span>{detailIndex+1}/{allCards.length}</span></div>
          <Card className="rounded-3xl shadow-sm"><CardContent className="p-4 sm:p-5">
            <div className="text-center"><div lang="ja" className="font-jp text-[72px] leading-none text-primary">{item.character}</div><h2 className="mt-2 text-[18px] font-bold">{item.meaning_id || "Arti belum tersedia"}</h2><div className="mt-3 grid grid-cols-3 gap-2"><div className="rounded-xl bg-primary/5 p-2"><p className="text-[9px] text-muted-foreground">Onyomi</p><p className="mt-1 font-jp text-[12px] font-semibold">{(item.onyomi??[]).join("・")||"—"}</p></div><div className="rounded-xl bg-primary/5 p-2"><p className="text-[9px] text-muted-foreground">Kunyomi</p><p className="mt-1 font-jp text-[12px] font-semibold">{(item.kunyomi??[]).join("・")||"—"}</p></div><div className="rounded-xl bg-primary/5 p-2"><p className="text-[9px] text-muted-foreground">Jumlah Coretan</p><p className="mt-1 text-[12px] font-semibold">{item.stroke_count ?? "—"}</p></div></div><Button variant="outline" size="sm" className="mt-3 h-8 rounded-full text-[11px]" onClick={()=>speak(item.character)}><Volume2 className="mr-1.5 size-3.5"/>Audio</Button></div>
            {(study?.relatedWords?.length ?? 0) > 0 && <section className="mt-4"><h3 className="text-[12px] font-bold">Contoh Kosakata</h3><div className="mt-2 space-y-2">{(study?.relatedWords ?? []).slice(0,4).map((w:any,i:number)=><div key={`${w.term}-${i}`} className="flex items-center gap-2 text-[11px]"><span className="font-jp font-semibold">{w.term}</span><span className="font-jp text-muted-foreground">{w.reading}</span><span>{w.meaning}</span></div>)}</div></section>}
            {asExamples(study?.examples).length>0 && <section className="mt-4"><h3 className="text-[12px] font-bold">Contoh Kalimat</h3>{asExamples(study?.examples).slice(0,2).map((e,i)=><div key={i} className="mt-2"><p className="font-jp text-sm leading-6">{e.jp}</p>{e.id&&<p className="mt-1 text-[11px] text-muted-foreground">{e.id}</p>}</div>)}</section>}
            <Button className="mt-4 h-10 w-full rounded-xl text-[12px]" variant={learned[item.id]?"secondary":"default"} disabled={mutation.isPending||learned[item.id]} onClick={()=>mutation.mutate(item.id)}>{learned[item.id]?<><Check className="mr-2 size-4"/>Sudah Hafal</>:"Sudah Hafal · +5 XP +5 Poin"}</Button>
            <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" className="h-10 rounded-xl text-[11px]" disabled={detailIndex===0} onClick={goPrev}><ArrowLeft className="mr-1.5 size-4"/>Sebelumnya</Button><Button className="h-10 rounded-xl text-[11px]" disabled={detailIndex===allCards.length-1} onClick={goNext}>Selanjutnya<ArrowRight className="ml-1.5 size-4"/></Button></div>
            <p className="mt-2 text-center text-[9px] text-muted-foreground">Swipe berpindah ke seluruh Kanji level {level}, tidak dibatasi bab.</p>
          </CardContent></Card>
        </div>}
    </div>}
  </AppShell>;
}
