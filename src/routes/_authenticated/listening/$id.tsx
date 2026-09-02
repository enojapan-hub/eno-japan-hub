import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Pause, Play, Volume2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchListeningDetail } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/listening/$id")({ component: ListeningDetail });

function cleanJapanese(text: string) { return text.replace(/\[[^|\]]+\|([^\]]+)\]/g, "$1"); }
function speak(text: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(cleanJapanese(text));
  u.lang = "ja-JP"; u.rate = 0.86; if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u); return true;
}

function ListeningDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ["listening", id], queryFn: () => fetchListeningDetail(id) });
  const [playing, setPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const item = data?.item;
  const score = useMemo(() => checked ? data?.questions.reduce((n, q) => n + (answers[q.id] === Number(q.correct_index) ? 1 : 0), 0) ?? 0 : null, [answers, checked, data?.questions]);
  const play = () => {
    if (playing) { window.speechSynthesis.cancel(); setPlaying(false); return; }
    if (!item) return;
    if (item.audio_url) { const audio = new Audio(item.audio_url); audio.onended = () => setPlaying(false); void audio.play(); setPlaying(true); return; }
    setPlaying(speak(item.transcript_jp ?? "", () => setPlaying(false)));
  };

  if (isLoading) return <AppShell title="聴解"><p className="text-sm text-muted-foreground">Memuat latihan…</p></AppShell>;
  if (error || !item) return <AppShell title="聴解"><Card><CardContent className="py-8 text-center"><p className="text-sm text-destructive">Latihan listening tidak ditemukan.</p><Button asChild className="mt-4"><Link to="/listening">Kembali</Link></Button></CardContent></Card></AppShell>;

  return <AppShell title="聴解 · Chōkai" description="Dengarkan dahulu, buka transcript hanya jika perlu." backTo="/listening" backLabel="Daftar listening">
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <Card className="overflow-hidden shadow-none">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-center justify-between gap-3"><Badge>{item.level}</Badge><span className="text-xs text-muted-foreground">{item.duration_seconds ? `${Math.ceil(item.duration_seconds / 60)} menit` : "Audio"}</span></div>
          <CardTitle className="pt-2 text-xl">{item.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-7">
          <div className="rounded-2xl border bg-muted/20 p-6 text-center">
            <Button size="lg" className="h-14 w-14 rounded-full p-0" onClick={play} aria-label={playing ? "Berhenti" : "Putar audio"}>{playing ? <Pause /> : <Play />}</Button>
            <p className="mt-3 text-sm font-medium">{playing ? "Sedang diputar…" : item.audio_url ? "Putar audio" : "Putar dengan suara Jepang"}</p>
            {!item.audio_url && <p className="mt-1 text-xs text-muted-foreground">Audio file belum tersedia; perangkat menggunakan Japanese text-to-speech.</p>}
          </div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setShowTranscript(v => !v)}>{showTranscript ? "Sembunyikan transcript" : "Tampilkan transcript"}</Button><Button variant="outline" onClick={() => setShowTranslation(v => !v)}>{showTranslation ? "Sembunyikan terjemahan" : "Tampilkan terjemahan"}</Button></div>
          {showTranscript && <div className="rounded-xl border p-5"><p lang="ja" className="font-jp text-lg leading-9">{item.transcript_jp || "Transcript belum tersedia."}</p></div>}
          {showTranslation && <div className="rounded-xl border bg-muted/20 p-5"><p className="text-sm leading-7 text-muted-foreground">{item.translation_id || "Terjemahan belum tersedia."}</p></div>}
        </CardContent>
      </Card>

      <section className="space-y-4"><div className="flex items-end justify-between"><div><p className="text-xs uppercase tracking-widest text-primary">理解チェック</p><h2 className="text-xl font-semibold">Cek pemahaman</h2></div>{score !== null && <Badge>{score}/{data.questions.length}</Badge>}</div>
        {data.questions.length === 0 ? <Card><CardContent className="py-6 text-sm text-muted-foreground">Belum ada soal untuk audio ini.</CardContent></Card> : data.questions.map((q, i) => <Card key={q.id} className="shadow-none"><CardHeader><CardTitle className="text-base">{i + 1}. {q.prompt}</CardTitle></CardHeader><CardContent className="space-y-2">{q.choices.map((choice, ci) => <Button key={ci} variant={answers[q.id] === ci ? "default" : "outline"} className="h-auto min-h-11 w-full justify-start whitespace-normal py-3 text-left" onClick={() => { setAnswers(a => ({ ...a, [q.id]: ci })); setChecked(false); }}>{String.fromCharCode(65 + ci)}. {choice}</Button>)}{checked && <p className="rounded-lg bg-muted p-3 text-sm">{answers[q.id] === Number(q.correct_index) ? "Benar." : `Belum tepat. ${q.explanation_id ?? "Perhatikan kembali informasi utama pada audio."}`}</p>}</CardContent></Card>)}
        {data.questions.length > 0 && <Button className="w-full" disabled={Object.keys(answers).length !== data.questions.length} onClick={() => setChecked(true)}>{checked ? "Periksa lagi" : "Periksa jawaban"}</Button>}
      </section>
      <Button asChild variant="ghost"><Link to="/listening"><ArrowLeft className="mr-2 size-4" />Kembali ke daftar</Link></Button>
    </div>
  </AppShell>;
}
