import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchContentTotals } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/belajar")({
  head: () => ({
    meta: [
      { title: "Belajar — ENO JAPAN" },
      { name: "description", content: "Pusat belajar kanji, kotoba, bunpo, dokkai, dan choukai." },
      { property: "og:title", content: "Belajar — ENO JAPAN" },
      { property: "og:description", content: "Lima jalur belajar bahasa Jepang N5–N1." },
    ],
  }),
  component: BelajarPage,
});

const sections = [
  { to: "/kanji", jp: "漢字", label: "Kanji", desc: "Bacaan, arti, contoh, dan Kanji Connection.", key: "kanji" },
  { to: "/kotoba", jp: "言葉", label: "Kotoba", desc: "Kosakata dengan bacaan dan contoh kalimat.", key: "vocabulary" },
  { to: "/bunpo", jp: "文法", label: "Bunpō", desc: "Pola tata bahasa, struktur, dan contoh.", key: "grammar" },
  { to: "/dokkai", jp: "読解", label: "Dokkai", desc: "Bacaan pendek dengan soal pemahaman.", key: "reading" },
  { to: "/listening", jp: "聴解", label: "Choukai", desc: "Latihan menyimak dengan transkrip.", key: "listening" },
] as const;

function BelajarPage() {
  const { data } = useQuery({ queryKey: ["content-totals"], queryFn: fetchContentTotals });

  return (
    <AppShell
      title="Belajar"
      description="Pilih keterampilan yang ingin kamu latih hari ini."
      backTo="/dashboard"
      backLabel="Beranda"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.to} to={s.to} className="group block focus:outline-none">
            <Card className="h-full transition-colors group-hover:border-primary/60 group-focus-visible:border-primary">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <span lang="ja" className="font-jp text-3xl text-primary">
                    {s.jp}
                  </span>
                  <CardTitle className="mt-2 text-base">{s.label}</CardTitle>
                  <CardDescription>{s.desc}</CardDescription>
                </div>
                <Badge variant="secondary">
                  {data ? `${data[s.key as keyof typeof data]} item` : "…"}
                </Badge>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Materi demo ENO JAPAN — bukan salinan materi resmi JLPT.
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
