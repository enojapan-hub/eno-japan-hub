import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LevelTabs } from "@/components/learn/LevelTabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { fetchKanjiList, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/kanji")({ component: KanjiPage });

function KanjiPage() {
  const [level, setLevel] = useState<Level>("N5");
  const { data, isLoading, error } = useQuery({ queryKey: ["kanji", level], queryFn: () => fetchKanjiList(level) });
  return <AppShell title="漢字 Kanji" description="Belajar kanji yang berbeda setiap hari dari database ENO JAPAN." backTo="/belajar" backLabel="Belajar">
    <LevelTabs value={level} onChange={setLevel} />
    {error && <p className="mt-5 text-sm text-destructive">Gagal memuat kanji. Coba refresh.</p>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {isLoading ? [0,1,2,3,4,5].map(i => <Skeleton key={i} className="h-28 rounded-xl" />) : data?.map(k => <Link key={k.id} to="/kanji/$id" params={{ id: k.id }} className="group block">
        <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/60 group-hover:shadow-md">
          <CardContent className="flex items-center gap-4 py-5"><span lang="ja" className="font-jp text-5xl leading-none text-primary">{k.character}</span><div className="min-w-0"><div className="flex items-center gap-2"><Badge variant="secondary">{k.level}</Badge>{k.stroke_count ? <span className="text-xs text-muted-foreground">{k.stroke_count} coretan</span> : null}</div><p className="mt-2 font-semibold">{k.meaning_id || k.meaning_en || "Arti belum tersedia"}</p>{k.meaning_en && k.meaning_id !== k.meaning_en ? <p className="truncate text-xs text-muted-foreground">{k.meaning_en}</p> : null}<p className="mt-1 truncate text-xs text-muted-foreground" lang="ja">{[...(k.onyomi ?? []), ...(k.kunyomi ?? [])].join("・") || "Bacaan belum tersedia"}</p></div></CardContent>
        </Card>
      </Link>)}
    </div>
    {!isLoading && !data?.length && <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Belum ada kanji terbit untuk {level}.</CardContent></Card>}
  </AppShell>;
}
