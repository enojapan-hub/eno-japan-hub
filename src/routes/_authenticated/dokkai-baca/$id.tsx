import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pause, Play, Volume2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetchPassageDetail } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/dokkai-baca/$id")({ component: DokkaiReader });

function renderFurigana(text: string) {
  return text.split(/(\[[^|\]]+\|[^\]]+\])/g).map((part, i) => {
    const m = part.match(/^\[([^|\]]+)\|([^\]]+)\]$/);
    return m ? <ruby key={i}>{m[1]}<rt className="text-[0.45em]">{m[2]}</rt></ruby> : <span key={i}>{part}</span>;
  });
}
function cleanJapanese(text: string) { return text.replace(/\[([^|\]]+)\|[^\]]+\]/g, "$1"); }

function DokkaiReader() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ["dokkai-reader", id], queryFn: () => fetchPassageDetail(id) });
  const [furigana, setFurigana] = useState(true);
  const [translation, setTranslation] = useState(false);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const p = data?.passage;
  const paragraphs = useMemo(() => String(p?.body_jp ?? "").split(/\n\s*\n|\n/).map(x => x.trim()).filter(Boolean), [p?.body_jp]);
  const furiganaParagraphs = useMemo(() => String((p as { body_furigana?: string | null } | undefined)?.body_furigana ?? "").split(/\n\s*\n|\n/).map(x => x.trim()).filter(Boolean), [p]);

  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  const speak = (text: string, index: number) => {
    if (!("speechSynthesis" in window)) return;
    if (speaking === index) { window.speechSynthesis.cancel(); setSpeaking(null); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(cleanJapanese(text));
    u.lang = "ja-JP"; u.rate = 0.86; u.onend = () => setSpeaking(null);
    window.speechSynthesis.speak(u); setSpeaking(index);
  };

  if (isLoading) return <AppShell title="Dokkai"><p className="text-sm text-muted-foreground">Memuat bacaan…</p></AppShell>;
  if (error || !p) return <AppShell title="Dokkai"><Card><CardContent className="py-10 text-center"><p className="text-sm text-destructive">Bacaan tidak ditemukan.</p><Button asChild className="mt-4"><Link to="/dokkai">Kembali ke Dokkai</Link></Button></CardContent></Card></AppShell>;

  return <AppShell title="Dokkai" description="Baca bacaan Jepang secara lengkap.">
    <div className="mx-auto max-w-3xl pb-8">
      <div className="mb-3 flex items-center justify-between"><Button variant="ghost" size="sm" asChild><Link to="/dokkai"><ArrowLeft className="mr-1.5 size-4" />Kembali</Link></Button><Badge variant="secondary">{p.level}</Badge></div>
      <Card className="border-border/70 shadow-none"><CardContent className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3 border-b pb-4"><div><p className="text-[10px] font-semibold tracking-[.12em] text-primary">ENONIHONGO · 読解</p><h1 className="mt-1 text-xl font-semibold">{p.title}</h1></div><Button variant="outline" size="icon" onClick={() => speak(String(p.body_jp ?? ""), -1)}>{speaking === -1 ? <Pause className="size-4" /> : <Volume2 className="size-4" />}</Button></div>
        <div className="my-4 flex flex-wrap gap-2"><Button size="sm" variant={furigana ? "default" : "outline"} onClick={() => setFurigana(v => !v)}>あ Cara baca</Button><Button size="sm" variant={translation ? "default" : "outline"} onClick={() => setTranslation(v => !v)}>Terjemahan</Button></div>
        <article lang="ja" className="font-jp space-y-5 text-[16px] leading-[2]">
          {paragraphs.map((text, i) => { const display = furigana && furiganaParagraphs[i] ? furiganaParagraphs[i] : text; return <div key={i} className="group relative"><button type="button" aria-label={`Putar bagian ${i + 1}`} className="absolute -left-8 top-1 hidden size-6 items-center justify-center rounded-full text-muted-foreground hover:text-primary group-hover:flex" onClick={() => speak(furiganaParagraphs[i] || text, i)}>{speaking === i ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}</button><p className="whitespace-pre-wrap">{furigana && furiganaParagraphs[i] ? renderFurigana(display) : display}</p></div>; })}
        </article>
        {translation && <div className="mt-7 rounded-xl border bg-muted/30 p-4"><p className="mb-1 text-sm font-semibold">Terjemahan Indonesia</p><p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{p.translation_id || "Terjemahan sedang diproses."}</p></div>}
      </CardContent></Card>
    </div>
  </AppShell>;
}
