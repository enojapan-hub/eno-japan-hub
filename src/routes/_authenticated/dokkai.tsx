import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPassages } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/dokkai")({ component: DokkaiPage });

const LEVELS = ["ALL", "N5", "N4", "N3", "N2", "N1"] as const;

type Level = (typeof LEVELS)[number];

function DokkaiPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["passages"], queryFn: fetchPassages });
  const [level, setLevel] = useState<Level>("ALL");
  const passages = useMemo(() => level === "ALL" ? (data ?? []) : (data ?? []).filter((p) => p.level === level), [data, level]);

  return <AppShell title="Dokkai" description="Baca bacaan bahasa Jepang dengan cara baca, suara, dan terjemahan." backTo="/belajar" backLabel="Belajar">
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 rounded-2xl border border-primary/15 bg-primary/[0.045] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><BookOpen className="size-5" /></div>
          <div><h2 className="text-[16px] font-semibold tracking-tight">Latihan membaca</h2><p className="mt-1 text-[12px] leading-5 text-muted-foreground">Pilih bacaan sesuai tingkat JLPT. Buka bacaan untuk melihat cara baca, mendengarkan suara, dan terjemahan Indonesia jika tersedia.</p></div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {LEVELS.map((item) => <Button key={item} type="button" size="sm" variant={level === item ? "default" : "outline"} className="h-8 rounded-lg px-3 text-[11px]" onClick={() => setLevel(item)}>{item === "ALL" ? "Semua" : item}</Button>)}
      </div>

      {!isLoading && !error && <p className="mb-3 text-[11px] text-muted-foreground">{passages.length} bacaan · {level === "ALL" ? "semua level" : level}</p>}
      {isLoading && <p className="py-8 text-center text-[12px] text-muted-foreground">Memuat bacaan…</p>}
      {error && <Card className="border-destructive/30 shadow-none"><CardContent className="py-6 text-center text-[12px] text-destructive">Gagal memuat bacaan. Coba lagi.</CardContent></Card>}

      <div className="space-y-3">
        {passages.map((p) => <Card key={p.id} className="overflow-hidden border-border/70 shadow-none transition-shadow hover:shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600"><BookOpen className="size-4.5" /></div><div className="min-w-0 flex-1"><div className="mb-1 flex items-center gap-1.5"><Badge variant="secondary" className="text-[10px]">{p.level}</Badge><span className="text-[10px] text-muted-foreground">Dokkai</span></div><h3 className="text-[15px] font-semibold leading-5">{p.title}</h3></div></div>
            <div className="mt-3 rounded-xl bg-muted/30 px-3.5 py-3"><p lang="ja" className="font-jp line-clamp-3 whitespace-pre-wrap text-[13px] leading-7 text-foreground/90">{p.body_jp}</p></div>
            <div className="mt-3 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">{p.estimated_minutes != null && <><Clock3 className="size-3.5" />約 {p.estimated_minutes} menit</>}</span><Button type="button" size="sm" className="h-9 rounded-lg px-4 text-[11px]" onClick={() => { window.location.assign(`/dokkai/${encodeURIComponent(p.id)}`); }}><span>Baca lengkap</span><ArrowRight className="ml-1 size-3.5" /></Button></div>
          </CardContent>
        </Card>)}
      </div>
      {!isLoading && !error && !passages.length && <Card className="mt-5 shadow-none"><CardContent className="py-10 text-center text-[12px] text-muted-foreground">Belum ada bacaan untuk level {level}.</CardContent></Card>}
    </div>
  </AppShell>;
}
