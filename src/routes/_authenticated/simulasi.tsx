import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, BookOpen, Headphones, Languages, ListChecks, Timer, Type } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import type { Level } from "@/lib/learn-queries";

export const Route=createFileRoute("/_authenticated/simulasi")({component:SimulationPage});
const levels:Level[]=["N5","N4","N3","N2","N1"];
const sections=[
  {jp:"文字・語彙",label:"Kanji & Kosakata",icon:Type,tone:"bg-emerald-50 text-emerald-600"},
  {jp:"文法",label:"Bunpou",icon:Languages,tone:"bg-amber-50 text-amber-600"},
  {jp:"読解",label:"Dokkai",icon:BookOpen,tone:"bg-sky-50 text-sky-600"},
  {jp:"聴解",label:"Choukai",icon:Headphones,tone:"bg-rose-50 text-rose-500"},
] as const;

function SimulationPage(){
  const [level,setLevel]=useState<Level>("N3");
  const [mode,setMode]=useState<"section"|"full">("section");
  return <AppShell title="Simulasi JLPT" compact><div className="mx-auto max-w-md">
    <h1 className="text-[20px] font-bold tracking-tight">Simulasi JLPT</h1>
    <div className="mt-3 grid grid-cols-5 overflow-hidden rounded-xl border bg-card p-1">{levels.map(l=><button key={l} onClick={()=>setLevel(l)} className={`h-8 rounded-lg text-[11px] font-semibold transition ${level===l?"bg-primary text-primary-foreground":"text-muted-foreground"}`}>{l}</button>)}</div>
    <div className="mt-3 grid grid-cols-2 rounded-xl bg-muted/50 p-1"><button onClick={()=>setMode("section")} className={`h-8 rounded-lg text-[11px] font-semibold ${mode==="section"?"bg-background text-foreground shadow-sm":"text-muted-foreground"}`}>Latihan Per Bagian</button><button onClick={()=>setMode("full")} className={`h-8 rounded-lg text-[11px] font-semibold ${mode==="full"?"bg-background text-foreground shadow-sm":"text-muted-foreground"}`}>Simulasi Penuh</button></div>

    {mode==="section"?<div className="mt-3 space-y-2">{sections.map(({jp,label,icon:Icon,tone})=><Link key={jp} to="/simulasi/$level" params={{level}} className="flex items-center gap-3 rounded-xl border bg-card px-3 py-3 transition hover:border-primary/40 hover:shadow-sm"><span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tone}`}><Icon className="size-4"/></span><span className="min-w-0 flex-1"><span lang="ja" className="block font-jp text-[13px] font-bold">{jp}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{label}</span></span><ArrowRight className="size-4 text-muted-foreground"/></Link>)}</div>:null}

    <section className="mt-4 rounded-2xl border bg-card p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-[14px] font-bold">JLPT {level} Mock Test #01</h2><p className="mt-1 text-[10px] text-muted-foreground">Simulasi lengkap semua bagian ujian</p></div><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{level}</span></div>
      <div className="mt-3 space-y-2 text-[11px]"><div className="flex items-center gap-2"><Timer className="size-3.5 text-primary"/><span>± 140 menit</span></div><div className="flex items-center gap-2"><ListChecks className="size-3.5 text-primary"/><span>Soal dari database ENO NIHONGO</span></div><div className="flex items-center gap-2"><Headphones className="size-3.5 text-primary"/><span>Termasuk Choukai</span></div></div>
      <Button asChild className="mt-4 h-10 w-full rounded-full text-[11px]"><Link to="/simulasi/$level" params={{level}}>Mulai Simulasi<ArrowRight className="ml-1.5 size-3.5"/></Link></Button>
    </section>
  </div></AppShell>
}
