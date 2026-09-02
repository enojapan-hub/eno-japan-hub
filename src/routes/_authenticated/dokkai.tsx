import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPassages } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/dokkai")({ component: DokkaiPage });

function DokkaiPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["passages"], queryFn: fetchPassages });
  return <AppShell title="Dokkai" description="Baca bacaan bahasa Jepang dengan cara baca, suara, dan terjemahan." backTo="/belajar" backLabel="Belajar">
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 rounded-2xl border border-primary/15 bg-primary/[0.045] p-4 sm:p-5"><div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><BookOpen className="size-5" /></div><div><h2 className="text-[16px] font-semibold tracking-tight">Latihan membaca</h2><p className="mt-1 text-[12px] leading-5 text-muted-foreground">Pilih bacaan sesuai tingkatmu. Kamu dapat menampilkan cara baca, mendengarkan suara, dan membuka terjemahan.</p></div></div></div>
      {isLoading && <p className="py-8 text-center text-[12px] text-muted-foreground">Memuat bacaan…</p>}
      {error && <Card className="border-destructive/30 shadow-none"><CardContent className="py-6 text-center text-[12px] text-destructive">Gagal memuat bacaan. Coba lagi.</CardContent></Card>}
      <div className="space-y-3">
        {data?.map((p) => <Card key={p.id} className="overflow-hidden border-border/70 shadow-none transition-shadow hover:shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600"><BookOpen className="size-4.5" /></div><div className="min-w-0 flex-1"><div className="mb-1 flex items-center gap-1.5"><Badge variant="secondary" className="text-[10px]">{p.level}</Badge><span className="text-[10px] text-muted-foreground">Dokkai</span></div><h3 className="text-[15px] font-semibold leading-5">{p.title}</h3></div></div>
            <div className="mt-3 rounded-xl bg-muted/30 px-3.5 py-3"><p lang="ja" className="font-jp line-clamp-3 whitespace-pre-wrap text-[13px] leading-7 text-foreground/90">{p.body_jp}</p></div>
            <div className="mt-3 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Clock3 className="size-3.5" />約 {p.estimated_minutes ?? "—"} menit</span><Button asChild size="sm" className="h-8 rounded-lg text-[11px]"><Link to="/dokkai/$id" params={{ id: p.id }}>Baca lengkap<ArrowRight className="ml-1 size-3.5" /></Link></Button></div>
          </CardContent>
        </Card>)}
      </div>
      {!isLoading && !error && !data?.length && <Card className="mt-5 shadow-none"><CardContent className="py-10 text-center text-[12px] text-muted-foreground">Belum ada bacaan yang diterbitkan.</CardContent></Card>}
    </div>
  </AppShell>;
}
