import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LevelTabs } from "@/components/learn/LevelTabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchGrammarList, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
export const Route = createFileRoute("/_authenticated/bunpo")({ component: BunpoPage });
function BunpoPage() {
  const [level, setLevel] = useState<Level>("N5"); const [learned, setLearned] = useState<Record<string, boolean>>({}); const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["grammar", level], queryFn: () => fetchGrammarList(level) });
  const mutation = useMutation({ mutationFn: (id: string) => markItemLearned({ itemType: "grammar", itemId: id, level }), onSuccess: (_, id) => { setLearned(x => ({ ...x, [id]: true })); void qc.invalidateQueries({ queryKey: ["my-progress"] }); } });
  return <AppShell title="文法 Bunpō" description="Pola tata bahasa N5–N1. Materi berganti setiap hari." backTo="/belajar" backLabel="Belajar">
    <LevelTabs value={level} onChange={setLevel}/>{error && <p className="mt-5 text-sm text-destructive">Gagal memuat tata bahasa.</p>}{isLoading && <p className="mt-5 text-sm text-muted-foreground">Memuat pola…</p>}
    <div className="mt-5 grid gap-3 md:grid-cols-2">{data?.map(g => { const ex = asExamples(g.examples)[0]; return <Card key={g.id} className="transition-all hover:-translate-y-0.5 hover:shadow-md"><CardContent className="space-y-3 py-5"><div className="flex items-center justify-between gap-3"><div lang="ja" className="font-jp text-2xl font-semibold">{g.pattern}</div><Badge variant="outline">{g.level}</Badge></div><p className="font-medium">{g.meaning_id || g.meaning_en || "Arti belum tersedia"}</p>{g.meaning_en && g.meaning_id !== g.meaning_en ? <p className="text-xs text-muted-foreground">{g.meaning_en}</p> : null}{g.structure && <p className="rounded-md bg-muted p-3 text-sm" lang="ja">{g.structure}</p>}{g.explanation_id && <p className="text-sm text-muted-foreground">{g.explanation_id}</p>}{ex?.jp && <div className="rounded-lg bg-muted/60 p-3 text-sm" lang="ja">{ex.jp}</div>}<Button size="sm" variant={learned[g.id] ? "secondary" : "outline"} disabled={!!learned[g.id] || mutation.isPending} onClick={() => mutation.mutate(g.id)}>{learned[g.id] ? "✓ Dipelajari" : "Tandai dipelajari"}</Button></CardContent></Card>})}</div>
    {!isLoading && !data?.length && <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Belum ada pola tata bahasa terbit untuk {level}.</CardContent></Card>}
  </AppShell>;
}
