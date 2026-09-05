import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Headphones, Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { Level } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";
import { markContentMastered } from "@/lib/progress-actions";

export const Route = createFileRoute("/_authenticated/choukai")({ component: ChoukaiPage });

type Item = {
  id: string;
  title: string;
  level: string;
  duration_seconds?: number | null;
  audio_url?: string | null;
  transcript_jp?: string | null;
  translation_id?: string | null;
  source?: string | null;
  source_book?: string | null;
  lesson_number?: number | null;
  lesson_title?: string | null;
};

async function fetchChoukaiItems(level: Level): Promise<Item[]> {
  const { data, error } = await supabase
    .from("listening_items")
    .select("id, title, level, duration_seconds, audio_url, transcript_jp, translation_id, source, source_book, lesson_number, lesson_title, sort_order")
    .eq("is_published", true)
    .eq("level", level)
    .order("lesson_number", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).filter((item) => Boolean(item.audio_url?.trim()) || Boolean(item.transcript_jp?.trim())) as Item[];
}

function ChoukaiPage() {
  const qc = useQueryClient();
  const target = useQuery({ queryKey:["target-level"], queryFn:fetchTargetLevel, retry:1 });
  const level = target.data;
  const { data, isLoading, error } = useQuery({
    queryKey: ["choukai-canonical", level],
    queryFn: () => fetchChoukaiItems(level!),
    enabled: Boolean(level),
    retry: 1,
  });
  const items = data ?? [];
  const [active, setActive] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState<Record<string, boolean>>({});
  const [speech, setSpeech] = useState<SpeechSynthesisUtterance | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const completeMutation = useMutation({
    mutationFn: (item: Item) => markContentMastered({ itemType: "listening", itemId: item.id, level: item.level as Level, durationSeconds: Math.max(60, Number(item.duration_seconds ?? 60)) }),
    onSuccess: (_, item) => {
      setCompleted((value) => ({ ...value, [item.id]: true }));
      void qc.invalidateQueries({ queryKey: ["dashboard-live"] });
      void qc.invalidateQueries({ queryKey: ["my-progress"] });
    },
  });

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const stop = () => {
    window.speechSynthesis?.cancel();
    document.querySelectorAll<HTMLAudioElement>("audio[data-choukai-audio]").forEach((audio) => audio.pause());
    if (speech) speech.onend = null;
    setSpeech(null);
    setActive(null);
  };

  const play = (item: Item) => {
    stop();
    if (item.audio_url) {
      const audio = document.getElementById(`audio-${item.id}`) as HTMLAudioElement | null;
      if (audio) {
        audio.currentTime = 0;
        void audio.play();
        setActive(item.id);
        return;
      }
    }
    if (!item.transcript_jp || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(item.transcript_jp);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85;
    utterance.onend = () => setActive(null);
    utterance.onerror = () => setActive(null);
    setSpeech(utterance);
    setActive(item.id);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <AppShell title={`聴解 · Chōkai${level ? ` ${level}` : ""}`} description="Latihan menyimak mengikuti level JLPT yang dipilih di Profil." backTo="/belajar" backLabel="Materi">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-2xl border border-primary/15 bg-primary/[0.045] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Headphones className="size-5" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Latihan menyimak</h2>{level&&<Badge variant="secondary">{level}</Badge>}</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Semua Chōkai otomatis mengikuti target JLPT pada Profil. Audio sumber diprioritaskan; TTS Jepang hanya digunakan bila transkrip tersedia tetapi audio sumber belum ada.</p>
            </div>
          </div>
        </div>

        {target.isLoading && <p className="py-6 text-center text-xs text-muted-foreground">Memuat level profil…</p>}
        {target.isError && <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center"><p className="text-sm font-semibold text-destructive">Level profil tidak dapat dimuat.</p></div>}
        {isLoading && <p className="py-6 text-center text-xs text-muted-foreground">Memuat latihan…</p>}
        {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center"><p className="text-sm font-semibold text-destructive">Latihan Chōkai gagal dimuat.</p><p className="mt-1 text-xs text-muted-foreground">Silakan coba lagi setelah beberapa saat.</p></div>}
        {!target.isLoading && !target.isError && !isLoading && !error && items.length === 0 && <div className="rounded-2xl border border-dashed p-7 text-center"><Headphones className="mx-auto size-7 text-muted-foreground"/><p className="mt-3 text-sm font-semibold">Materi Chōkai {level} belum tersedia.</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Materi akan tampil setelah audio atau transkrip sumber yang terverifikasi ditambahkan.</p></div>}

        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-3"><div><p className="mb-1 text-xs text-primary">{item.audio_url ? "Audio sumber" : "TTS dari transkrip"}</p><CardTitle className="text-base leading-6">{item.title}</CardTitle></div><Badge variant="secondary">{item.level}</Badge></div>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.audio_url && <audio id={`audio-${item.id}`} data-choukai-audio src={item.audio_url} onPlay={() => setActive(item.id)} onEnded={() => setActive(null)} onPause={() => setActive((value) => value === item.id ? null : value)} preload="metadata" className="w-full" controls />}
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => active === item.id ? stop() : play(item)} disabled={!item.audio_url && !item.transcript_jp}>{active === item.id ? <><Square className="mr-2 size-4"/>Berhenti</> : <><Play className="mr-2 size-4"/>Dengarkan</>}</Button>
                <Button type="button" variant="outline" disabled={!item.transcript_jp} onClick={() => setShowTranscript((value) => ({ ...value, [item.id]: !value[item.id] }))}>{showTranscript[item.id] ? "Sembunyikan transkrip" : "Tampilkan transkrip"}</Button>
                {active === item.id && !item.audio_url && <Button type="button" variant="ghost" onClick={() => play(item)}><RotateCcw className="mr-2 size-4"/>Ulangi</Button>}
              </div>
              {showTranscript[item.id] && item.transcript_jp && <div className="space-y-3 rounded-2xl border bg-muted/20 p-4"><div><p className="mb-2 text-xs font-semibold text-muted-foreground">日本語</p><p lang="ja" className="font-jp text-lg leading-8">{item.transcript_jp}</p></div><div className="border-t pt-3"><p className="mb-2 text-xs font-semibold text-muted-foreground">Bahasa Indonesia</p><p className="text-sm leading-7">{item.translation_id || "Terjemahan Indonesia belum tersedia."}</p></div></div>}
              <Button type="button" className="h-10 w-full rounded-full text-[11px]" variant={completed[item.id] ? "secondary" : "default"} disabled={completed[item.id] || completeMutation.isPending} onClick={() => completeMutation.mutate(item)}>{completed[item.id] ? <><Check className="mr-1.5 size-4"/>Sudah selesai</> : "Tandai selesai · +5 XP"}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
