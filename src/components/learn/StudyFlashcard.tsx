import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, Volume2, X } from "lucide-react";

type Example = { jp?: string; id?: string; reading?: string; note?: string };
type RelatedWord = { term: string; reading?: string | null; meaning?: string | null; example?: string | null };
type Props = { index:number; total:number; level:string; title:string; reading?:string|null; romaji?:string|null; meaning:string; secondary?:string|null; structure?:string|null; explanation?:string|null; examples?:Example[]; relatedWords?:RelatedWord[]; onyomi?:string[]; kunyomi?:string[]; usageNotes?:string[]; commonMistakes?:string[]; question?:{prompt:string;choices:string[];correctIndex:number;explanation?:string}|null; furiganaEnabled?:boolean; kotobaMode?:boolean; onPrev:()=>void; onNext:()=>void; onLearned?:()=>void; learned?:boolean };
const sectionTitle = "text-xs font-bold tracking-wide text-muted-foreground";

export function StudyFlashcard({index,total,level,title,reading,romaji,meaning,secondary,structure,explanation,examples,relatedWords,onyomi,kunyomi,usageNotes,commonMistakes,question,furiganaEnabled=true,kotobaMode=false,onPrev,onNext,onLearned,learned}:Props){
 const [showDetails,setShowDetails]=useState(true); const [selected,setSelected]=useState<number|null>(null); const progress=total?Math.round(((index+1)/total)*100):0;
 const usableExamples=useMemo(()=> (examples??[]).filter(x=>x.jp||x.id).slice(0,6),[examples]);
 useEffect(()=>{setShowDetails(true);setSelected(null);window.speechSynthesis?.cancel()},[index,title]);
 const speak=(text:string)=>{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="ja-JP";u.rate=.85;window.speechSynthesis.speak(u)};
 return <div className="mx-auto max-w-2xl">
  <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground"><span>Materi {index+1} dari {total}</span><span>{progress}% selesai</span></div>
  <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{width:`${progress}%`}}/></div>
  <Card className="overflow-hidden border-border/80 shadow-xl">
   <CardHeader className="space-y-4 bg-gradient-to-br from-primary/10 via-background to-secondary/20 px-6 py-8 text-center sm:px-8">
    <div className="flex items-center justify-center gap-2"><Badge variant="secondary">{level}</Badge><Badge variant="outline">{kotobaMode?"KOTOBA":"Pelajaran"}</Badge></div>
    <div lang="ja" className="font-jp text-5xl font-bold tracking-wide sm:text-6xl">{title}{kotobaMode&&reading&&<span className="ml-3 text-2xl font-normal text-muted-foreground sm:text-3xl">— {reading}</span>}</div>
    {!kotobaMode&&reading&&furiganaEnabled&&<div lang="ja" className="text-base text-muted-foreground">{reading}</div>}
    {kotobaMode&&romaji&&<div className="text-base italic text-muted-foreground">{romaji}</div>}
    <p className="text-xl font-semibold leading-relaxed">{meaning}</p>
    {!kotobaMode&&secondary&&<p className="text-sm text-muted-foreground">{secondary}</p>}
    <div className="flex flex-wrap justify-center gap-2"><Button type="button" variant="outline" size="sm" onClick={()=>speak(title)}><Volume2 className="mr-2 size-4" strokeWidth={2}/><span>Dengarkan</span></Button><Button type="button" variant="ghost" size="sm" onClick={()=>setShowDetails(v=>!v)}>{showDetails?<ChevronUp className="mr-2 size-4" strokeWidth={2}/>:<ChevronDown className="mr-2 size-4" strokeWidth={2}/>}<span>{showDetails?"Sembunyikan penjelasan":"Tampilkan penjelasan lengkap"}</span></Button></div>
   </CardHeader>
   <CardContent className="space-y-6 p-5 sm:p-7">
    {showDetails&&<div className="space-y-6">
     {explanation&&<section className="rounded-2xl border bg-muted/30 p-5"><p className={sectionTitle}>PENJELASAN</p><p className="mt-3 whitespace-pre-line leading-7">{explanation}</p></section>}
     {!!usageNotes?.length&&<section className="rounded-2xl border bg-muted/30 p-5"><p className={sectionTitle}>COCOK DIGUNAKAN DALAM KONTEKS</p><ul className="mt-3 list-disc space-y-2 pl-5 leading-7">{usageNotes.map((n,i)=><li key={`${n}-${i}`}>{n}</li>)}</ul></section>}
     {!!usableExamples.length&&<section className="rounded-2xl border bg-muted/30 p-5"><p className={sectionTitle}>CONTOH KALIMAT</p><div className="mt-4 space-y-4">{usableExamples.map((example,i)=><div key={`${example.jp??"contoh"}-${i}`} className="rounded-xl border bg-background p-4"><div className="flex items-start gap-2"><div className="flex-1">{example.jp&&<p lang="ja" className="font-jp text-lg leading-8">{example.jp}</p>}{example.reading&&furiganaEnabled&&<p lang="ja" className="mt-1 text-sm text-muted-foreground">{example.reading}</p>}{example.id&&<p className="mt-2 text-sm leading-6">{example.id}</p>}{example.note&&<p className="mt-2 text-xs leading-5 text-muted-foreground">Catatan: {example.note}</p>}</div>{example.jp&&<Button type="button" size="icon" variant="ghost" aria-label="Dengarkan contoh kalimat" onClick={()=>speak(example.jp!)}><Volume2 className="size-4" strokeWidth={2}/></Button>}</div></div>)}</div></section>}
     {!!commonMistakes?.length&&<section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5"><p className="text-xs font-bold tracking-wide text-destructive">KESALAHAN YANG SERING TERJADI</p><div className="mt-3 space-y-3">{commonMistakes.map((n,i)=><div key={`${n}-${i}`} className="rounded-xl bg-background p-4 leading-7">{n}</div>)}</div></section>}
     {!!relatedWords?.length&&<section className="rounded-2xl border bg-muted/30 p-5"><p className={sectionTitle}>KOSAKATA TERKAIT</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{relatedWords.slice(0,10).map((w,i)=><div key={`${w.term}-${i}`} className="rounded-xl border bg-background p-4"><p lang="ja" className="font-jp text-xl">{w.term}</p>{furiganaEnabled&&w.reading&&<p lang="ja" className="mt-1 text-sm text-muted-foreground">{w.reading}</p>}<p className="mt-2 text-sm leading-6">{w.meaning||"Arti belum tersedia"}</p>{w.example&&<p lang="ja" className="mt-2 border-t pt-2 font-jp text-sm leading-6">{w.example}</p>}</div>)}</div></section>}
     {question&&<section className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5"><p className="text-xs font-bold tracking-wide text-primary">LATIHAN PEMAHAMAN</p><p className="mt-3 font-medium leading-7">{question.prompt}</p><div className="mt-4 grid gap-3">{question.choices.map((choice,i)=><Button key={`${choice}-${i}`} type="button" variant={selected===i?(i===question.correctIndex?"secondary":"destructive"):"outline"} className="h-auto min-h-12 justify-start whitespace-normal py-3 text-left" onClick={()=>setSelected(i)}>{String.fromCharCode(65+i)}. {choice}</Button>)}</div>{selected!==null&&<div className="mt-4 rounded-xl border bg-background p-4 text-sm leading-6"><p className="font-semibold flex items-center gap-2">{selected===question.correctIndex?<><Check className="size-4" strokeWidth={2}/><span>Jawaban benar</span></>:<><X className="size-4" strokeWidth={2}/><span>Jawaban belum tepat</span></>}</p>{selected!==question.correctIndex&&<p className="mt-1">Jawaban yang benar: {String.fromCharCode(65+question.correctIndex)}.</p>}{question.explanation&&<p className="mt-2">{question.explanation}</p>}</div>}</section>}
    </div>}
    <div className="rounded-2xl border bg-muted/30 p-2 sm:p-2.5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Button type="button" variant="ghost" onClick={onPrev} disabled={index===0} className="h-12 rounded-xl px-3 font-semibold sm:px-5">
          <ArrowLeft className="mr-2 size-4" strokeWidth={2.25}/><span>Sebelumnya</span>
        </Button>
        {onLearned&&<Button type="button" variant={learned?"secondary":"outline"} onClick={onLearned} className="h-12 min-w-12 rounded-xl px-3 font-semibold" aria-label={learned?"Sudah dipelajari":"Tandai sudah dipelajari"}>
          {learned?<Check className="size-5" strokeWidth={2.25}/>:<span className="text-xs sm:text-sm">Pelajari</span>}
        </Button>}
        {!onLearned&&<span />}
        <Button type="button" onClick={onNext} disabled={index===total-1} className="h-12 rounded-xl px-3 font-semibold shadow-sm sm:px-5">
          <span>Berikutnya</span><ArrowRight className="ml-2 size-4" strokeWidth={2.25}/>
        </Button>
      </div>
    </div>
   </CardContent>
  </Card>
 </div>;
}
