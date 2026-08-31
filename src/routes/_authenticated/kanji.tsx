import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { LevelTabs } from "@/components/learn/LevelTabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchKanjiList, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/kanji")({
  head: () => ({
    meta: [
      { title: "Kanji — ENO JAPAN" },
      { name: "description", content: "Pelajari kanji N5–N1 dengan bacaan, arti, dan kanji terkait." },
      { property: "og:title", content: "Kanji — ENO JAPAN" },
      { property: "og:description", content: "Daftar kanji demo per level JLPT." },
    ],
  }),
  component: KanjiPage,
});

function KanjiPage() {
  const [level, setLevel] = useState<Level>("N5");
  const { data, isLoading } = useQuery({
    queryKey: ["kanji", level],
    queryFn: () => fetchKanjiList(level),
  });

  return (
    <AppShell
      title="漢字 Kanji"
      description="Urutan belajar harian mengikuti daftar di bawah ini."
      backTo="/belajar"
      backLabel="Belajar"
    >
      <LevelTabs value={level} onChange={setLevel} />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : data?.length
            ? data.map((k) => (
                <Link key={k.id} to="/kanji/$id" params={{ id: k.id }} className="group block">
                  <Card className="h-full transition-colors group-hover:border-primary/60">
                    <CardContent className="flex items-center gap-4 py-5">
                      <span lang="ja" className="font-jp text-4xl leading-none text-primary">
                        {k.character}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{k.meaning_id}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground" lang="ja">
                          {[...(k.onyomi ?? []), ...(k.kunyomi ?? [])].join("・") || "—"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            : (
              <Card className="sm:col-span-2 lg:col-span-3">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada kanji demo untuk level {level}.
                </CardContent>
              </Card>
            )}
      </div>
    </AppShell>
  );
}
