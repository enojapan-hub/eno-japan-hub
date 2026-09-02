import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPassages } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/dokkai")({ component: DokkaiPage });

function DokkaiPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["passages"], queryFn: fetchPassages });
  return <AppShell title="読解 · Dokkai" description="Baca teks Jepang, dengarkan pelafalan, dan pahami isi bacaan." backTo="/belajar" backLabel="Belajar">
    {isLoading && <p className="text-sm text-muted-foreground">Memuat bacaan…</p>}
    {error && <Card className="border-destructive/30"><CardContent className="py-6 text-sm text-destructive">Gagal memuat bacaan. Coba lagi.</CardContent></Card>}
    <div className="grid gap-4 md:grid-cols-2">
      {data?.map((p) => <Card key={p.id} className="group overflow-hidden shadow-none transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        <CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-primary"><BookOpen className="size-3.5" /> Latihan membaca</p><CardTitle className="text-lg leading-7">{p.title}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Bacaan tingkat {p.level}</p></div><Badge variant="secondary">{p.level}</Badge></div></CardHeader>
        <CardContent className="space-y-4"><div className="max-h-52 overflow-hidden rounded-xl bg-muted/30 p-4"><p lang="ja" className="font-jp whitespace-pre-wrap text-[15px] leading-8">{p.body_jp}</p></div><div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">± {p.estimated_minutes ?? "—"} menit</span><Button asChild size="sm"><Link to="/dokkai/$id" params={{ id: p.id }}>Baca lengkap<ArrowRight className="size-4" /></Link></Button></div></CardContent>
      </Card>)}
    </div>
    {!isLoading && !error && !data?.length && <Card className="mt-5 shadow-none"><CardContent className="py-10 text-center text-sm text-muted-foreground">Belum ada bacaan yang diterbitkan.</CardContent></Card>}
  </AppShell>;
}
