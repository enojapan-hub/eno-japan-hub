import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPassages } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/dokkai")({ component: DokkaiPage });
function DokkaiPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["passages"], queryFn: fetchPassages });
  return <AppShell title="読解 Dokkai" description="Latihan membaca bahasa Jepang." backTo="/belajar" backLabel="Belajar">
    {isLoading && <p className="text-sm text-muted-foreground">Memuat bacaan…</p>}
    {error && <p className="text-sm text-destructive">Gagal memuat bacaan.</p>}
    <div className="mt-5 grid gap-4 md:grid-cols-2">{data?.map((p) => <Card key={p.id}><CardHeader><div className="flex justify-between gap-3"><CardTitle>{p.title}</CardTitle><Badge>{p.level}</Badge></div></CardHeader><CardContent className="space-y-4"><p lang="ja" className="font-jp whitespace-pre-line text-sm leading-7 line-clamp-5">{p.body_jp}</p><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">± {p.estimated_minutes ?? "—"} menit</span><Button size="sm" asChild><a href={`/dokkai/${p.id}`}>Baca</a></Button></div></CardContent></Card>)}</div>
    {!isLoading && !data?.length && <Card className="mt-5"><CardContent className="py-8 text-center text-sm text-muted-foreground">Belum ada bacaan terbit.</CardContent></Card>}
  </AppShell>;
}
