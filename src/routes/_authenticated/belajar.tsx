import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchKanjiList, fetchVocabList, fetchGrammarList, type Level } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";

export const Route = createFileRoute("/_authenticated/belajar")({
  head: () => ({ meta: [{ title: "Belajar — ENO NIHONGO" }, { name: "description", content: "Pusat belajar bertahap sesuai level JLPT pilihanmu." }] }),
  component: BelajarPage,
});

const sections = [
  { to: "/kanji", jp: "漢字", label: "Kanji", desc: "Kanji disusun bertahap dari materi awal ke materi berikutnya." },
  { to: "/kotoba", jp: "言葉", label: "Kotoba", desc: "Kosakata mengikuti urutan lesson dan tingkat JLPT." },
  { to: "/bunpo", jp: "文法", label: "Bunpō", desc: "Tata bahasa mengikuti urutan pembelajaran, bukan acak." },
  { to: "/dokkai", jp: "読解", label: "Dokkai", desc: "Bacaan disusun sesuai tingkat dan tahap pembelajaran." },
  { to: "/listening", jp: "聴解", label: "Chōkai", desc: "Latihan menyimak mengikuti tingkat kemampuan." },
] as const;

function lessonNumbers(rows: Array<{ lesson_number?: number | null }>) {
  return [...new Set(rows.map((row) => row.lesson_number).filter((n): n is number => typeof n === "number"))].sort((a, b) => a - b);
}

function BelajarPage() {
  const { data: targetLevel, isLoading: levelLoading } = useQuery({ queryKey: ["target-level"], queryFn: fetchTargetLevel, retry: 1 });
  const level: Level = targetLevel ?? "N5";

  const kanji = useQuery({ queryKey: ["learning-roadmap-kanji", level], queryFn: () => fetchKanjiList(level), enabled: !!targetLevel, retry: 1 });
  const vocab = useQuery({ queryKey: ["learning-roadmap-vocab", level], queryFn: () => fetchVocabList(level), enabled: !!targetLevel, retry: 1 });
  const grammar = useQuery({ queryKey: ["learning-roadmap-grammar", level], queryFn: () => fetchGrammarList(level), enabled: !!targetLevel, retry: 1 });

  const kLessons = lessonNumbers((kanji.data ?? []) as Array<{ lesson_number?: number | null }>);
  const vLessons = lessonNumbers((vocab.data ?? []) as Array<{ lesson_number?: number | null }>);
  const gLessons = lessonNumbers((grammar.data ?? []) as Array<{ lesson_number?: number | null }>);
  const allLessons = [...new Set([...kLessons, ...vLessons, ...gLessons])].sort((a, b) => a - b);
  const loading = kanji.isLoading || vocab.isLoading || grammar.isLoading;

  return (
    <AppShell title="Belajar" description={`Materi bertahap untuk level ${level}.`} backTo="/dashboard" backLabel="Beranda">
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-2xl border bg-gradient-to-r from-primary/10 via-background to-secondary/20 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Level belajar</p>
              <p className="mt-0.5 text-xl font-bold text-primary">{levelLoading ? "…" : level}</p>
            </div>
            <Badge variant="secondary">{loading ? "Memuat…" : `${allLessons.length} lesson`}</Badge>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Materi tidak dicampur. Lesson menjadi jalur utama agar Kanji, Kotoba, dan Bunpō dipelajari secara bertahap.</p>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-bold">Materi belajar</h2>
            <span className="text-xs text-muted-foreground">{allLessons.length ? `Lesson 1–${allLessons[allLessons.length - 1]}` : ""}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {sections.map((section) => (
              <Link key={section.to} to={section.to} className="group block focus:outline-none">
                <Card className="h-full rounded-2xl border-border/70 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-primary">
                  <CardHeader className="flex flex-row items-start justify-between gap-3 p-4 pb-2">
                    <div className="min-w-0">
                      <span lang="ja" className="font-jp text-2xl font-semibold text-primary">{section.jp}</span>
                      <CardTitle className="mt-1 text-sm">{section.label}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">{level}</Badge>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <p className="text-xs leading-5 text-muted-foreground">{section.desc}</p>
                    <p className="mt-2 text-[11px] font-medium text-primary">Buka materi →</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {allLessons.length > 0 && (
          <section>
            <h2 className="mb-3 px-1 text-sm font-bold">Urutan pembelajaran</h2>
            <div className="space-y-2">
              {allLessons.slice(0, 12).map((lesson, index) => (
                <div key={lesson} className="flex items-center gap-3 rounded-xl border bg-background px-3 py-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Lesson {lesson}</p>
                    <p className="text-[11px] text-muted-foreground">Kanji · Kotoba · Bunpō mengikuti urutan materi</p>
                  </div>
                </div>
              ))}
              {allLessons.length > 12 && <p className="pt-1 text-center text-[11px] text-muted-foreground">+ {allLessons.length - 12} lesson berikutnya</p>}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
