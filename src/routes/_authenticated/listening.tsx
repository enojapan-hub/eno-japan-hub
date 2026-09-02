import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Headphones } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchListeningList } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/listening")({ component: ListeningPage });

function ListeningPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["listening"], queryFn: fetchListeningList });
  return <AppShell title="聴解 · Chōkai" description="Latihan menyimak bahasa Jepang. Dengarkan dahulu, lihat transcript setelahnya." backTo="/belajar" backLabel="Belajar">
    {isLoading && <p className="text-sm text-muted-foreground">Memuat latihan…</p>}
    {error && <Card className="border-destructive/30 shadow-none"><CardContent className="py-6 text-sm text-destructive">Gagal memuat materi listening. Coba lagi.</CardContent></Card>}
    <div className="grid gap-4 sm:grid-cols-2">{data?.map((item) => <Card key={item.id} className="shadow-none transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"><CardHeader><div className="flex items-center justify-between gap-3"><div><p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-primary"><Headphones className="size-3.5" /> Listening practice</p><CardTitle className="text-lg">{item.title}</CardTitle></div><Badge variant="secondary">{item.level}</Badge></div></CardHeader><CardContent className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{item.duration_seconds ? `${Math.ceil(item.duration_seconds / 60)} menit` : "Audio"}</span><Button asChild size="sm"><Link to="/listening/$id" params={{ id: item.id }}>Mulai<ArrowRight className="size-4" /></Link></Button></CardContent></Card>)}</div>
    {!isLoading && !error && !data?.length && <Card className="mt-5 shadow-none"><CardContent className="py-10 text-center text-sm text-muted-foreground">Belum ada materi listening terbit.</CardContent></Card>}
  </AppShell>;
}
