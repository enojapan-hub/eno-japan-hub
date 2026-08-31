import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchKanjiDetail, markItemLearned, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/kanji/$id")({ component: KanjiDetailPage });

function KanjiDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [done, setDone] = useState(false);
  const { data, isLoading, error } = useQuery({ queryKey: ["kanji-detail", id], queryFn: () => fetchKanjiDetail(id) });
  const level = (data?.kanji?.level ?? "N5") as Level;
  const mutation = useMutation({ mutationFn: () => markItemLearned({ itemType: "kanji", itemId: id, level }), onSuccess: () => { setDone(true); void qc.invalidateQueries({ queryKey: ["my-progress"] }); } });
  const k = data?.kanji;

  if (isLoading) return <AppShell title="Kanji"><p className="text-sm text-muted-foreground">Memuat materi…</p></AppShell>;
  if (error || !k) return <AppShell title="Kanji"><Card><CardContent className="py-8 text-center text-sm text-destructive">Kanji tidak ditemukan.</CardContent></Card></AppShell>;

  return <AppShell title="Kanji" backTo="/kanji" backLabel="Daftar Kanji">
    <div className="space-y-5">
      <Card><CardContent className="flex flex-col items-center py-10 text-center">
        <div lang="ja" className="font-jp text-8xl text-primary">{k.character}</div>
        <h1 className="mt-4 text-2xl font-bold">{k.meaning_id}</h1>
        <Badge className="mt-3">{k.level}</Badge>
        <div className="mt-5 grid grid-cols-2 gap-6 text-sm"><div><div className="text-muted-foreground">Onyomi</div><b>{(k.onyomi ?? []).join("・") || "—"}</b></div><div><div className="text-muted-foreground">Kunyomi</div><b>{(k.kunyomi ?? []).join("・") || "—"}</b></div></div>
        <div className="mt-6 flex gap-2"><Button disabled={mutation.isPending || done} onClick={() => mutation.mutate()}>{done ? "✓ Sudah dipelajari" : mutation.isPending ? "Menyimpan…" : "Tandai dipelajari"}</Button><Button variant="outline" asChild><Link to="/quiz">Latihan Quiz</Link></Button></div>
        {mutation.error && <p className="mt-3 text-sm text-destructive">Gagal menyimpan progress.</p>}
      </CardContent></Card>
      {data.relations?.length > 0 && <Card><CardHeader><CardTitle>Kanji terkait</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{data.relations.map((r) => <Badge key={r.id} variant="outline">{r.related?.character ?? "—"}</Badge>)}</CardContent></Card>}
    </div>
  </AppShell>;
}
