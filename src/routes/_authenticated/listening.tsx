import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchListeningList } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/listening")({ component: ListeningPage });
function ListeningPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["listening"], queryFn: fetchListeningList });
  return <AppShell title="聴解 Choukai" description="Latihan menyimak bahasa Jepang." backTo="/belajar" backLabel="Belajar">
    {isLoading && <p className="text-sm text-muted-foreground">Memuat audio…</p>}
    {error && <p className="text-sm text-destructive">Gagal memuat materi listening.</p>}
    <div className="mt-5 grid gap-4 md:grid-cols-2">{data?.map((item) => <Card key={item.id}><CardHeader><div className="flex justify-between gap-3"><CardTitle>{item.title}</CardTitle><Badge>{item.level}</Badge></div></CardHeader><CardContent className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{item.duration_seconds ? `${Math.ceil(item.duration_seconds / 60)} menit` : "Audio"}</span><Button size="sm" asChild><a href={`/listening/${item.id}`}>Mulai</a></Button></CardContent></Card>)}</div>
    {!isLoading && !data?.length && <Card className="mt-5"><CardContent className="py-8 text-center text-sm text-muted-foreground">Belum ada materi listening terbit.</CardContent></Card>}
  </AppShell>;
}
