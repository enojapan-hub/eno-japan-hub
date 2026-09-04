import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Headphones, Languages, ListChecks, Timer, Type } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/simulasi")({ component: SimulationPage });
const levels: Level[] = ["N5","N4","N3","N2","N1"];
const sections = [
  { jp:"文字・語彙", label:"Kanji & Kosakata", icon:Type },
  { jp:"文法", label:"Bunpō", icon:Languages },
  { jp:"読解", label:"Dokkai", icon:BookOpen },
  { jp:"聴解", label:"Chōkai", icon:Headphones },
] as const;

function SimulationPage(){
  return <AppShell title="Simulasi JLPT" compact><div className="mx-auto max-w-3xl space-y-4">
    <div><h1 className="text-[20px] font-bold">Simulasi JLPT</h1><p className="mt-1 text-[11px] text-muted-foreground">Latihan per bagian atau ujian penuh N5 sampai N1.</p></div>

    <section className="rounded-2xl border bg-card p-3 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-medium text-muted-foreground">Pilih level</p><p className="mt-0.5 text-[15px] font-bold">JLPT Mock Test</p></div><Badge variant="secondary">N5–N1</Badge></div><div className="mt-3 grid grid-cols-5 gap-2">{levels.map(level=><Link key={level} to="/simulasi/$level" params={{level}} className="rounded-xl border bg-background px-2 py-3 text-center text-[13px] font-bold transition hover:border-primary/40 hover:bg-primary/5">{level}</Link>)}</div></section>

    <section><div className="mb-2 flex items-center justify-between px-1"><h2 className="text-[13px] font-bold">Latihan per bagian</h2><span className="text-[10px] text-muted-foreground">Pilih kemampuan</span></div><div className="grid grid-cols-2 gap-2">{sections.map(({jp,label,icon:Icon})=><Card key={jp} className="rounded-2xl shadow-sm"><CardContent className="p-3"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4"/></span><div className="min-w-0"><p lang="ja" className="font-jp text-[13px] font-bold">{jp}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p></div></div></CardContent></Card>)}</div></section>

    <section><div className="mb-2 px-1"><h2 className="text-[13px] font-bold">Full JLPT Simulation</h2><p className="mt-0.5 text-[10px] text-muted-foreground">Timer, navigasi soal, autosave, tandai soal, dan hasil per kemampuan.</p></div><div className="space-y-2">{levels.map(level=><Card key={level} className="rounded-2xl shadow-sm"><CardContent className="flex items-center gap-3 p-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground text-[15px] font-bold">{level}</span><div className="min-w-0 flex-1"><p className="text-[12px] font-bold">JLPT {level} Mock Test</p><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground"><span className="flex items-center gap-1"><Timer className="size-3"/>Ujian penuh</span><span className="flex items-center gap-1"><ListChecks className="size-3"/>Semua bagian</span><span className="flex items-center gap-1"><Headphones className="size-3"/>Termasuk Chōkai</span></div></div><Button asChild size="sm" className="h-9 rounded-xl px-3 text-[11px]"><Link to="/simulasi/$level" params={{level}}>Mulai<ArrowRight className="ml-1 size-3.5"/></Link></Button></CardContent></Card>)}</div></section>

    <section className="rounded-2xl border bg-muted/25 p-3"><p className="text-[12px] font-bold">Hasil simulasi</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Setelah ujian, tampilkan skor total, Vocabulary, Grammar, Reading, Listening, estimasi CEFR bila memenuhi syarat, kelemahan utama, dan tombol Latih Materi Lemah.</p></section>
  </div></AppShell>;
}
