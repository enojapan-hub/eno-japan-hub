import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { fetchTargetLevel } from "@/lib/target-level";
import type { Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/belajar")({
  head: () => ({ meta: [{ title: "Belajar — ENO JAPAN" }, { name: "description", content: "Pusat belajar sesuai level JLPT pilihanmu." }] }),
  component: BelajarPage,
});

const sections = [
  { to: "/kanji", jp: "漢字", label: "Kanji", desc: "Flashcard kanji, bacaan, arti, audio, contoh, dan latihan." },
  { to: "/kotoba", jp: "言葉", label: "Kotoba", desc: "Kosakata dengan bacaan, arti, contoh kalimat, audio, dan latihan." },
  { to: "/bunpo", jp: "文法", label: "Bunpō", desc: "Tata bahasa dengan pola, penjelasan, contoh, dan latihan." },
  { to: "/dokkai", jp: "読解", label: "Dokkai", desc: "Bacaan Jepang sesuai level dengan pertanyaan dan pembahasan." },
  { to: "/listening", jp: "聴解", label: "Chōkai", desc: "Latihan menyimak sesuai level dengan audio, soal, dan pembahasan." },
] as const;

async function checkContent() {
  const checks = await Promise.allSettled([
    supabase.from("kanji").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("vocabulary").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("grammar_points").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("reading_passages").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("listening_items").select("id", { count: "exact", head: true }).eq("is_published", true),
  ]);
  return checks.reduce((total, result) => total + (result.status === "fulfilled" && !result.value.error ? result.value.count ?? 0 : 0), 0);
}

function BelajarPage() {
  const { data: level, isLoading: levelLoading } = useQuery({ queryKey: ["target-level"], queryFn: fetchTargetLevel, retry: 1 });
  const selected: Level = level ?? "N5";
  const { data: contentTotal, isLoading: contentLoading } = useQuery({ queryKey: ["content-total"], queryFn: checkContent, staleTime: 60_000, retry: 1 });

  return (
    <AppShell title="Belajar" description={`Materi yang ditampilkan untuk level ${selected} yang kamu pilih di profil.`} backTo="/dashboard" backLabel="Beranda">
      <div className="mb-5 rounded-2xl border bg-gradient-to-r from-primary/10 via-background to-secondary/20 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Level belajar: <span className="text-primary">{levelLoading ? "Memuat…" : selected}</span></p>
            <p className="mt-1 text-sm text-muted-foreground">Pelajari materi secara bertahap sesuai level JLPT kamu.</p>
          </div>
          <Badge variant="secondary">{contentLoading ? "…" : `${contentTotal ?? 0} materi`}</Badge>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.to} to={s.to} className="group block focus:outline-none">
            <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-primary">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <span lang="ja" className="font-jp text-3xl text-primary">{s.jp}</span>
                  <CardTitle className="mt-2 text-base">{s.label}</CardTitle>
                  <CardDescription className="mt-1 leading-6">{s.desc}</CardDescription>
                </div>
                <Badge variant="secondary">{selected}</Badge>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">Klik untuk mulai belajar →</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
