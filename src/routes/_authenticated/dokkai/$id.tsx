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
  const { data, isLoading, error } = useQuery({
    queryKey: ["passage", id],
    queryFn: () => fetchPassageDetail(id),
  });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const p = data?.passage;

  if (isLoading) {
    return <AppShell title="読解 — Membaca"><p className="text-sm text-muted-foreground">Memuat bacaan…</p></AppShell>;
  }
  if (error || !p) {
    return <AppShell title="読解 — Membaca"><p className="text-sm text-destructive">Bacaan tidak ditemukan atau gagal dimuat.</p></AppShell>;
  }

  const paragraphs = String(p.body_jp ?? "")
    .split(/\n\s*\n/)
    .map((text) => text.trim())
    .filter(Boolean);

  return (
    <AppShell
      title={p.title}
      description={`Tingkat ${p.level} · Perkiraan ${p.estimated_minutes ?? "—"} menit`}
      backTo="/dokkai"
      backLabel="Daftar bacaan"
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>大問 — Bacaan</CardTitle>
              <Badge>{p.level}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Baca seluruh teks terlebih dahulu. Setelah itu, jawab pertanyaan berdasarkan informasi yang ada dalam bacaan.
            </p>
          </CardHeader>
          <CardContent>
            <article lang="ja" className="rounded-xl border bg-muted/20 px-5 py-6 font-jp text-[17px] leading-[2.25] tracking-wide">
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph, index) => (
                  <p key={index} className="mb-6 last:mb-0 whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="whitespace-pre-wrap">{String(p.body_jp ?? "")}</p>
              )}
            </article>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border px-3 py-1">Bacaan lengkap</span>
              <span className="rounded-full border px-3 py-1">Tingkat {p.level}</span>
              <span className="rounded-full border px-3 py-1">{p.estimated_minutes ?? "—"} menit</span>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4" aria-label="Pertanyaan bacaan">
          <div>
            <h2 className="text-xl font-semibold">Pertanyaan</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pilih jawaban yang paling sesuai dengan isi bacaan.</p>
          </div>

          {data.questions?.map((q, qi) => (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-base">{qi + 1}. {String(q.prompt)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(Array.isArray(q.choices) ? q.choices : []).map((c, i) => (
                  <Button
                    key={i}
                    variant={answers[q.id] === i ? "default" : "outline"}
                    className="h-auto w-full justify-start whitespace-normal py-3 text-left"
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                  >
                    {String.fromCharCode(65 + i)}. {String(c)}
                  </Button>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
