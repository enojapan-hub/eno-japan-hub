import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Headphones, Play, Square, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchListeningList } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/choukai")({ component: ChoukaiPage });

type Item = { id: string; title: string; level: string; audio_url?: string | null; transcript_jp?: string | null; translation_id?: string | null };

function ChoukaiPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["listening"], queryFn: fetchListeningList, retry: 1 });
  const items: Item[] = (data ?? []) as Item[];
  const [active, setActive] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState<Record<string, boolean>>({});
  const [speech, setSpeech] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const play = (item: Item) => {
    window.speechSynthesis?.cancel();
    if (item.audio_url) {
      const audio = document.getElementById(`audio-${item.id}`) as HTMLAudioElement | null;
      if (audio) { void audio.play(); setActive(item.id); return; }
    }
    if (!item.transcript_jp || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(item.transcript_jp);
    utterance.lang = "ja-JP"; utterance.rate = 0.85; utterance.onend = () => setActive(null);
    setSpeech(utterance); setActive(item.id); window.speechSynthesis.speak(utterance);
  };

  const stop = () => { window.speechSynthesis?.cancel(); if (speech) speech.onend = null; setSpeech(null); setActive(null); };

  return <AppShell title="聴解 · Chōkai" description="Latihan menyimak bahasa Jepang dari materi yang sudah tersedia di database." backTo="/belajar" backLabel="Belajar">
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="rounded-2xl border border-primary/15 bg-primary/[0.045] p-4 sm:p-5"><div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Headphones className="size-5" /></div><div><h2 className="font-semibold">Latihan menyimak</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Dengarkan materi Jepang yang tersedia, lalu buka transkrip dan terjemahan Indonesianya.</p></div></div></div>
      {isLoading && <p className="py-6 text-center text-xs text-muted-foreground">Memuat latihan…</p>}
      {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center"><p className="text-sm font-semibold text-destructive">Latihan Chōkai gagal dimuat.</p><p className="mt-1 text-xs text-muted-foreground">Silakan coba lagi setelah beberapa saat.</p></div>}
      {!isLoading && !error && items.length === 0 && <div className="rounded-2xl border border-dashed p-7 text-center"><Headphones className="mx-auto size-7 text-muted-foreground"/><p className="mt-3 text-sm font-semibold">Materi Chōkai belum tersedia.</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Materi akan tampil di sini setelah audio atau transkrip sumber yang terverifikasi ditambahkan.</p></div>}
      {items.map((item) => <Card key={item.id} className="overflow-hidden shadow-none"><CardHeader><div className="flex items-center justify-between gap-3"><div><p className="mb-1 text-xs text-primary">Latihan menyimak</p><CardTitle className="text-base leading-6">{item.title}</CardTitle></div><Badge variant="secondary">{item.level}</Badge></div></CardHeader><CardContent className="space-y-4">
        {item.audio_url && <audio id={`audio-${item.id}`} src={item.audio_url} onEnded={() => setActive(null)} preload="metadata" className="w-full" controls />}
        <div className="flex flex-wrap gap-2"><Button type="button" onClick={() => active === item.id ? stop() : play(item)} disabled={!item.audio_url&&!item.transcript_jp}>{active === item.id ? <><Square className="mr-2 size-4" />Berhenti</> : <><Play className="mr-2 size-4" />Dengarkan</>}</Button><Button type="button" variant="outline" onClick={() => setShowTranscript(x => ({ ...x, [item.id]: !x[item.id] }))}>{showTranscript[item.id] ? "Sembunyikan transkrip" : "Tampilkan transkrip"}</Button>{active === item.id && !item.audio_url && <Button type="button" variant="ghost" onClick={() => { stop(); play(item); }}><RotateCcw className="mr-2 size-4" />Ulangi</Button>}</div>
        {showTranscript[item.id] && <div className="space-y-3 rounded-2xl border bg-muted/20 p-4"><div><p className="mb-2 text-xs font-semibold text-muted-foreground">日本語</p><p lang="ja" className="font-jp text-lg leading-8">{item.transcript_jp || "Transkrip belum tersedia."}</p></div><div className="border-t pt-3"><p className="mb-2 text-xs font-semibold text-muted-foreground">Bahasa Indonesia</p><p className="text-sm leading-7">{item.translation_id || "Terjemahan Indonesia belum tersedia."}</p></div></div>}
      </CardContent></Card>)}
    </div>
  </AppShell>;
}
