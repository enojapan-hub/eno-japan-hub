import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchKanjiDetail, fetchKanjiList, markItemLearned, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/kanji/$id")({ component: KanjiDetailPage });

function KanjiDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [done, setDone] = useState(false);
  const touchStart = useRef<number | null>(null);

  const { data, isLoading, error } = useQuery({ queryKey: ["kanji-detail", id], queryFn: () => fetchKanjiDetail(id) });
  const level = (data?.kanji?.level ?? "N5") as Level;
  const list = useQuery({ queryKey: ["kanji-list", level], queryFn: () => fetchKanjiList(level), enabled: Boolean(data?.kanji) });
  const k = data?.kanji;

  const currentIndex = list.data?.findIndex((item) => item.id === id) ?? -1;
  const previous = currentIndex > 0 ? list.data?.[currentIndex - 1] : undefined;
  const next = currentIndex >= 0 && currentIndex < (list.data?.length ?? 0) - 1 ? list.data?.[currentIndex + 1] : undefined;

  const mutation = useMutation({
    mutationFn: () => markItemLearned({ itemType: "kanji", itemId: id, level }),
    onSuccess: () => {
      setDone(true);
      void qc.invalidateQueries({ queryKey: ["my-progress"] });
    },
  });

  function goTo(nextId?: string) {
    if (!nextId) return;
    setDone(false);
    navigate({ to: "/kanji/$id", params: { id: nextId } });
  }

  function onTouchEnd(endX: number) {
    if (touchStart.current === null) return;
    const delta = endX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(delta) < 55) return;
    if (delta < 0) goTo(next?.id);
    else goTo(previous?.id);
  }

  if (isLoading) return <AppShell compact title="Kanji"><p className="text-[11px] text-muted-foreground">Memuat materi…</p></AppShell>;
  if (error || !k) return <AppShell compact title="Kanji"><Card><CardContent className="py-8 text-center text-[11px] text-destructive">Kanji tidak ditemukan.</CardContent></Card></AppShell>;

  return (
    <AppShell compact title="Kanji" backTo="/kanji" backLabel="Daftar Kanji">
      <div className="mx-auto max-w-xl space-y-3">
        <div className="flex items-center justify-between px-1 text-[9px] text-muted-foreground">
          <span>{currentIndex >= 0 ? `${currentIndex + 1} / ${list.data?.length ?? 0}` : k.level}</span>
          <span>Geser kanan / kiri untuk pindah</span>
        </div>

        <Card
          className="overflow-hidden rounded-2xl border-border/70 shadow-sm touch-pan-y"
          onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
          onTouchEnd={(event) => onTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <Button variant="ghost" size="icon" className="size-9 rounded-xl" disabled={!previous} onClick={() => goTo(previous?.id)} aria-label="Kanji sebelumnya"><ChevronLeft className="size-5" /></Button>
              <div className="min-w-0 flex-1 text-center">
                <div lang="ja" className="font-jp text-[72px] font-medium leading-none text-primary">{k.character}</div>
                <h1 className="mt-2 text-[18px] font-bold leading-tight">{k.meaning_id || k.meaning_en || "Arti belum tersedia"}</h1>
                <Badge className="mt-2 px-2 py-0 text-[9px]">{k.level}</Badge>
              </div>
              <Button variant="ghost" size="icon" className="size-9 rounded-xl" disabled={!next} onClick={() => goTo(next?.id)} aria-label="Kanji selanjutnya"><ChevronRight className="size-5" /></Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-muted/55 p-3"><p className="text-[9px] text-muted-foreground">Onyomi</p><p lang="ja" className="mt-1 truncate font-jp text-[13px] font-semibold">{(k.onyomi ?? []).join("・") || "—"}</p></div>
              <div className="rounded-xl bg-muted/55 p-3"><p className="text-[9px] text-muted-foreground">Kunyomi</p><p lang="ja" className="mt-1 truncate font-jp text-[13px] font-semibold">{(k.kunyomi ?? []).join("・") || "—"}</p></div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" className="h-9 flex-1 rounded-xl text-[10px]" disabled={mutation.isPending || done} onClick={() => mutation.mutate()}>{done ? "✓ Sudah dipelajari" : mutation.isPending ? "Menyimpan…" : "Tandai dipelajari"}</Button>
              <Button size="sm" variant="outline" className="h-9 rounded-xl px-3" aria-label="Audio"><Volume2 className="size-4" /></Button>
              <Button size="sm" variant="outline" className="h-9 rounded-xl text-[10px]" asChild><Link to="/quiz">Quiz</Link></Button>
            </div>
            {mutation.error && <p className="mt-2 text-[9px] text-destructive">Gagal menyimpan progress.</p>}
          </CardContent>
        </Card>

        {data.relations?.length > 0 && (
          <Card className="rounded-2xl"><CardContent className="p-3"><div className="flex items-center justify-between gap-2"><p className="text-[11px] font-semibold">Kanji terkait</p><div className="flex flex-wrap justify-end gap-1">{data.relations.slice(0, 6).map((r) => <Badge key={r.id} variant="outline" className="px-1.5 py-0 text-[9px]">{r.related?.character ?? "—"}</Badge>)}</div></div></CardContent></Card>
        )}

        <div className="grid grid-cols-2 gap-2 pb-1">
          <Button variant="outline" className="h-9 rounded-xl text-[10px]" disabled={!previous} onClick={() => goTo(previous?.id)}><ChevronLeft className="mr-1 size-3.5" />Sebelumnya</Button>
          <Button variant="outline" className="h-9 rounded-xl text-[10px]" disabled={!next} onClick={() => goTo(next?.id)}>Selanjutnya<ChevronRight className="ml-1 size-3.5" /></Button>
        </div>
      </div>
    </AppShell>
  );
}
