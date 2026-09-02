import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/simulasi")({ component: SimulationPage });
const levels: Level[] = ["N5", "N4", "N3", "N2", "N1"];
function SimulationPage() {
  return <AppShell title="Simulasi JLPT" description="Latihan ujian JLPT N5 sampai N1."><div className="mx-auto max-w-3xl"><Card className="mb-5 border-primary/15 bg-primary/[0.045] shadow-none"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><GraduationCap className="size-6" /></div><div><h1 className="text-lg font-semibold">Pilih level ujian</h1><p className="mt-1 text-xs text-muted-foreground">Halaman simulasi baru yang langsung mengambil soal dari database ENO JAPAN.</p></div></div></CardContent></Card><div className="grid gap-3 sm:grid-cols-2">{levels.map(level => <Card key={level} className="border-border/70 shadow-none"><CardContent className="flex items-center justify-between gap-4 p-5"><div><span className="text-2xl font-bold text-primary">{level}</span><p className="mt-1 text-xs text-muted-foreground">Simulasi JLPT {level}</p></div><Button asChild><Link to="/simulasi/$level" params={{ level }}>Mulai<ArrowRight className="ml-1 size-4" /></Link></Button></CardContent></Card>)}</div></div></AppShell>;
}
