import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchContentTotals } from "@/lib/learn-queries";
export const Route = createFileRoute("/_authenticated/belajar")({ head: () => ({ meta: [{ title: "Belajar — ENO JAPAN" }, { name: "description", content: "Pusat belajar kanji, kotoba, bunpō, dokkai, dan chōkai." }] }), component: BelajarPage });
const sections = [
  { to: "/kanji", jp: "漢字", label: "Kanji", desc: "Flashcard kanji, bacaan, arti, audio, contoh, dan latihan.", key: "kanji" },
  { to: "/kotoba", jp: "言葉", label: "Kotoba", desc: "Kosakata dengan bacaan, arti, contoh kalimat, audio, dan latihan.", key: "vocabulary" },
  { to: "/bunpo", jp: "文法", label: "Bunpō", desc: "Pola tata bahasa lengkap: struktur, penjelasan, contoh, dan latihan.", key: "grammar" },
  { to: "/dokkai", jp: "読解", label: "Dokkai", desc: "Bacaan bahasa Jepang dengan pertanyaan dan pembahasan.", key: "reading" },
  { to: "/listening", jp: "聴解", label: "Chōkai", desc: "Latihan menyimak dengan audio, soal, dan pembahasan.", key: "listening" },
] as const;
function BelajarPage() {
  const { data, isLoading } = useQuery({ queryKey: ["content-totals"], queryFn: fetchContentTotals });
  return <AppShell title="Belajar" description="Pelajari materi sesuai level JLPT. Setiap kartu berisi penjelasan, contoh, audio, dan latihan." backTo="/dashboard" backLabel="Beranda">
    <div className="mb-5 rounded-2xl border bg-gradient-to-r from-primary/10 via-background to-secondary/20 p-5"><p className="text-sm font-semibold">Belajar dengan cara yang terarah</p><p className="mt-1 text-sm text-muted-foreground">Pilih materi, buka penjelasan lengkap, dengarkan contoh, lalu cek pemahaman sebelum lanjut.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">{sections.map(s => <Link key={s.to} to={s.to} className="group block focus:outline-none"><Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-primary"><CardHeader className="flex flex-row items-start justify-between gap-4"><div><span lang="ja" className="font-jp text-3xl text-primary">{s.jp}</span><CardTitle className="mt-2 text-base">{s.label}</CardTitle><CardDescription className="mt-1 leading-6">{s.desc}</CardDescription></div><Badge variant="secondary">{isLoading ? "…" : `${data?.[s.key as keyof typeof data] ?? 0} materi`}</Badge></CardHeader><CardContent className="text-xs text-muted-foreground">Klik untuk mulai belajar →</CardContent></Card></Link>)}</div>
  </AppShell>;
}
