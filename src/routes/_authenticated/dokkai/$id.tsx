import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPassageDetail } from "@/lib/learn-queries";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/dokkai/$id")({ component: DokkaiDetail });
function DokkaiDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ["passage", id], queryFn: () => fetchPassageDetail(id) });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const p = data?.passage;
  if (isLoading) return <AppShell title="Dokkai"><p className="text-sm text-muted-foreground">Memuat bacaan…</p></AppShell>;
  if (error || !p) return <AppShell title="Dokkai"><p className="text-sm text-destructive">Bacaan tidak ditemukan.</p></AppShell>;
  return <AppShell title={p.title} description={`${p.level} · ${p.estimated_minutes ?? "—"} menit`} backTo="/dokkai" backLabel="Dokkai">
    <div className="space-y-5"><Card><CardHeader><Badge className="w-fit">{p.level}</Badge></CardHeader><CardContent><p lang="ja" className="font-jp whitespace-pre-line text-base leading-8">{String(p.body_jp ?? "")}</p></CardContent></Card>
      {data.questions?.map((q, qi) => <Card key={q.id}><CardHeader><CardTitle className="text-base">{qi + 1}. {q.prompt}</CardTitle></CardHeader><CardContent className="space-y-2">{(Array.isArray(q.choices) ? q.choices : []).map((c, i) => <Button key={i} variant={answers[q.id] === i ? "default" : "outline"} className="h-auto w-full justify-start whitespace-normal py-3 text-left" onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}>{String.fromCharCode(65 + i)}. {String(c)}</Button>)}</CardContent></Card>)}
    </div>
  </AppShell>;
}
