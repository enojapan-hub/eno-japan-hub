import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LevelTabs } from "@/components/learn/LevelTabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchVocabList, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
export const Route = createFileRoute("/_authenticated/kotoba")({ component: KotobaPage });
function KotobaPage() {
  const [level, setLevel] = useState<Level>("N5"); const [learned, setLearned] = useState<Record<string, boolean>>({}); const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["vocab", level], queryFn: () => fetchVocabList(level) });
  const mutation = useMutation({ mutationFn: (id: string) => markItemLearned({ itemType: "vocabulary", itemId: id, level }), onSuccess: (_, id) => { setLearned(x => ({ ...x, [id]: true })); void qc.invalidateQueries({ queryKey: ["my-progress"] }); } });
  return <AppShell title="言葉 Kotoba" description="Kosakata N5–N1. Daftar berganti setiap hari agar kamu tidak mengulang kartu yang sama terus." backTo="/belajar" backLabel="Belajar">
    <LevelTabs value={level} onChange={setLevel}/>{error && <p className="mt-5 text-sm text-destructive">Gagal memuat kosakata.</p>}{isLoading && <p className="mt-5 text-sm text-muted-foreground">Memuat kosakata…</p>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data?.map(v => { const ex = asExamples(v.examples)[0]; return <Card key={v.id} className="transition-all hover:-translate-y-0.5 hover:shadow-md"><CardContent className="space-y-3 py-5"><div className="flex items-start justify-between gap-3"><div><div lang="ja" className="font-jp text-2xl font-semibold">{v.term}</div><div lang="ja" className="text-sm text-muted-foreground">{v.reading || "—"} {v.romaji ? `· ${v.romaji}` : ""}</div></div><Badge variant="outline">{v.part_of_speech || "—"}</Badge></div><p className="font-medium">{v.meaning_id || v.meaning_en || "Arti belum tersedia"}</p>{v.meaning_en && v.meaning_id !== v.meaning_en ? <p className="text-xs text-muted-foreground">{v.meaning_en}</p> : null}{ex?.jp ? <div className="rounded-lg bg-muted/60 p-3 text-sm" lang="ja">{ex.jp}{ex.reading ? <div className="mt-1 text-xs text-muted-foreground">{ex.reading}</div> : null}</div> : null}<Button size="sm" variant={learned[v.id] ? "secondary" : "outline"} disabled={!!learned[v.id] || mutation.isPending} onClick={() => mutation.mutate(v.id)}>{learned[v.id] ? "✓ Dipelajari" : "Tandai dipelajari"}</Button></CardContent></Card>})}</div>
    {!isLoading && !data?.length && <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Belum ada kosakata terbit untuk {level}.</CardContent></Card>}<div className="mt-5"><Button asChild variant="outline"><Link to="/quiz">Latihan Quiz →</Link></Button></div>
  </AppShell>;
}
