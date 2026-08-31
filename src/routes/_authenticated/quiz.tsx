import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchQuizzes, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/quiz")({ component: QuizPage });

function QuizPage() {
  const [level, setLevel] = useState<Level | "ALL">("ALL");
  const { data, isLoading, error } = useQuery({ queryKey: ["quizzes"], queryFn: fetchQuizzes });
  const quizzes = useMemo(() => (data ?? []).filter((q) => level === "ALL" || q.level === level), [data, level]);
  const levels: Array<Level | "ALL"> = ["ALL", "N5", "N4", "N3", "N2", "N1"];

  return (
    <AppShell title="Quiz" description="Latihan soal berdasarkan level JLPT." backTo="/dashboard" backLabel="Beranda">
      <div className="mb-5 flex flex-wrap gap-2">
        {levels.map((item) => (
          <Button key={item} size="sm" variant={level === item ? "default" : "outline"} onClick={() => setLevel(item)}>{item === "ALL" ? "Semua" : item}</Button>
        ))}
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Memuat quiz…</p>}
      {error && <p className="text-sm text-destructive">Gagal memuat quiz. Coba lagi nanti.</p>}
      {!isLoading && !error && quizzes.length === 0 && <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Belum ada quiz yang dipublikasikan.</CardContent></Card>}
      <div className="grid gap-4 sm:grid-cols-2">
        {quizzes.map((q) => (
          <Card key={q.id}>
            <CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="text-base">{q.title}</CardTitle><Badge>{q.level}</Badge></div></CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">{q.description || "Latihan untuk mengukur pemahamanmu."}</p>
              <div className="mb-4 text-xs text-muted-foreground">{q.question_count} soal · {Math.round((q.time_limit_seconds ?? 0) / 60)} menit · {q.skill}</div>
              <Button asChild><Link to="/quiz/$slug" params={{ slug: q.slug }}>Mulai Quiz</Link></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
