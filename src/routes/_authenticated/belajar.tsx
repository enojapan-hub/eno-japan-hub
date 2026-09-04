import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchKanjiList, fetchVocabList, fetchGrammarList, type Level } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";

export const Route = createFileRoute("/_authenticated/belajar")({
  head: () => ({ meta: [{ title: "Materi — ENO NIHONGO" }, { name: "description", content: "Perpustakaan materi JLPT sesuai level aktif." }] }),
  component: BelajarPage,
});

const sections = [
  { to: "/kanji", jp: "漢字", label: "Kanji", desc: "Daftar kanji per level dan bab, dengan detail yang dapat digeser kanan-kiri." },
  { to: "/kotoba", jp: "言葉", label: "Kosakata", desc: "Kosakata disusun per bab. Buka item untuk melihat detail penggunaan dan contoh." },
  { to: "/bunpo", jp: "文法", label: "Bunpou", desc: "Grammar per bab dengan struktur, fungsi, contoh benar/salah, dan perbandingan pola." },
  { to: "/dokkai", jp: "読解", label: "Dokkai", desc: "Bacaan pendek, sedang, panjang, dan gaya JLPT dengan reader penuh." },
  { to: "/listening", jp: "聴解", label: "Choukai", desc: "Audio, pertanyaan, pilihan jawaban, transcript, dan penjelasan." },
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
    <AppShell compact title="Materi">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="flex items-end justify-between gap-3">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Perpustakaan Belajar</p><h1 className="mt-1 text-[20px] font-bold tracking-tight">Materi</h1><p className="mt-1 text-[10px] text-muted-foreground">Pilih kategori lalu lanjutkan sesuai bab.</p></div>
          <div className="rounded-xl border bg-card px-3 py-2 text-right"><p className="text-[8px] text-muted-foreground">Level aktif</p><p className="text-[14px] font-bold text-primary">{levelLoading ? "…" : level}</p></div>
        </section>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {sections.map((section) => (
            <Link key={section.to} to={section.to} className="group block focus:outline-none">
              <Card className="h-full rounded-2xl border-border/70 transition group-hover:border-primary/45 group-hover:shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-2 p-3 pb-1.5">
                  <div className="min-w-0"><span lang="ja" className="font-jp text-[24px] font-semibold leading-none text-primary">{section.jp}</span><CardTitle className="mt-1.5 text-[12px]">{section.label}</CardTitle></div>
                  <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[8px]">{level}</Badge>
                </CardHeader>
                <CardContent className="p-3 pt-1"><p className="line-clamp-3 text-[9px] leading-4 text-muted-foreground">{section.desc}</p><p className="mt-2 text-[9px] font-semibold text-primary">Buka →</p></CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <section>
          <div className="mb-2 flex items-center justify-between px-1"><h2 className="text-[13px] font-semibold">Bab tersedia</h2><span className="text-[9px] text-muted-foreground">{loading ? "Memuat…" : `${allLessons.length} bab`}</span></div>
          {allLessons.length ? <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{allLessons.slice(0, 18).map((lesson) => <div key={lesson} className="rounded-xl border bg-card px-2 py-2.5 text-center"><p className="text-[9px] text-muted-foreground">Bab</p><p className="text-[13px] font-bold">{lesson}</p></div>)}</div> : <Card className="rounded-2xl"><CardContent className="p-4 text-[10px] text-muted-foreground">Bab akan muncul setelah data level aktif selesai dimuat.</CardContent></Card>}
        </section>
      </div>
    </AppShell>
  );
}
