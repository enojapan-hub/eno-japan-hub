import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPassages } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/dokkai")({ component: DokkaiPage });

function DokkaiPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["passages"], queryFn: fetchPassages });

  return (
    <AppShell title="読解 — Membaca" description="Latihan membaca bahasa Jepang sesuai tingkat JLPT." backTo="/belajar" backLabel="Belajar">
      {isLoading && <p className="text-sm text-muted-foreground">Memuat bacaan…</p>}
      {error && <p className="text-sm text-destructive">Gagal memuat bacaan. Silakan coba lagi.</p>}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {data?.map((p) => (
          <Card key={p.id} className="overflow-hidden transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{p.title}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Bacaan tingkat {p.level}</p>
                </div>
                <Badge>{p.level}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-56 overflow-hidden rounded-lg border bg-muted/20 p-4">
                <p lang="ja" className="font-jp whitespace-pre-wrap text-sm leading-8">{p.body_jp}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  Perkiraan waktu: {p.estimated_minutes ?? "—"} menit
                </span>
                <Button size="sm" asChild>
                  <Link to="/dokkai/$id" params={{ id: p.id }}>Baca lengkap</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && !data?.length && (
        <Card className="mt-5">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Belum ada bacaan yang diterbitkan.
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
