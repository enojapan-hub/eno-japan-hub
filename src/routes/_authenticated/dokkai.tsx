import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPassages } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/dokkai")({ component: DokkaiPage });

function DokkaiPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({ queryKey: ["passages"], queryFn: fetchPassages });

  return (
    <AppShell title="読解 — Dokkai" description="Latihan membaca bahasa Jepang sesuai tingkat JLPT." backTo="/belajar" backLabel="Belajar">
      {isLoading && <p className="text-sm text-muted-foreground">Memuat bacaan…</p>}
      {error && <p className="text-sm text-destructive">Gagal memuat bacaan. Silakan coba lagi.</p>}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {data?.map((p) => (
          <Card key={p.id} className="overflow-hidden border-border/80 shadow-none transition-shadow hover:shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg leading-7">{p.title}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Bacaan tingkat {p.level}</p>
                </div>
                <Badge variant="secondary">{p.level}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-56 overflow-hidden rounded-xl border border-border/70 bg-muted/20 p-4">
                <p lang="ja" className="font-jp whitespace-pre-wrap text-base leading-8 text-foreground">{p.body_jp}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">± {p.estimated_minutes ?? "—"} menit</span>
                <Button size="sm" onClick={() => navigate({ to: "/dokkai/$id", params: { id: p.id } })}>Baca lengkap →</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && !data?.length && (
        <Card className="mt-5 border-border/80 shadow-none">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">Belum ada bacaan yang diterbitkan.</CardContent>
        </Card>
      )}
    </AppShell>
  );
}
