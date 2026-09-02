import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Info, Layers3, Lightbulb, Link2, ListTree, MessageCircle, Sparkles, Volume2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fetchGrammarList, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";

export const Route = createFileRoute("/_authenticated/bunpo")({ component: BunpoPage });

type GrammarDetail = { structure: string[]; type: string; kind: string; politeness: string; about: string; usage: string; synonyms: string[]; antonyms: string[]; related: string[]; levels: Level[] };

const JP_READINGS: Record<string, string> = {
  "私": "わたし", "毎朝": "まいあさ", "七時": "しちじ", "八時": "はちじ", "九時": "くじ", "十時": "じゅうじ", "何時": "なんじ", "今日": "きょう", "明日": "あした", "昨日": "きのう",
  "これ": "これ", "それ": "それ", "全部": "ぜんぶ", "みんな": "みんな", "必要": "ひつよう", "禁止": "きんし", "経験": "けいけん", "食": "た", "行": "い", "学校": "がっこう", "家": "いえ", "駅": "えき", "顔": "かお", "洗": "あら", "朝": "あさ", "飯": "はん", "起": "お", "出": "で", "歩": "ある",
  "禁止する": "きんしする", "必要がある": "ひつようがある", "経験がある": "けいけんがある",
  "てはいけない": "てはいけない", "てはいけません": "てはいけません", "なければならない": "なければならない", "なくてもいい": "なくてもいい", "てもいい": "てもいい", "べきだ": "べきだ",
  "だけ": "だけ", "たことがある": "たことがある", "たことがない": "たことがない", "しか〜ない": "しか〜ない", "のみ": "のみ", "ばかり": "ばかり", "ほど": "ほど", "こと": "こと", "ある": "ある", "ない": "ない",
};

function FuriganaText({ text, reading }: { text: string; reading?: string | null }) {
  if (!/[一-龯々〆ヵヶ]/u.test(text)) return <>{text}</>;
  if (reading?.trim()) return <ruby>{text}<rt className="font-jp text-[0.45em] font-medium leading-none text-muted-foreground">{reading.trim()}</rt></ruby>;
  const keys = Object.keys(JP_READINGS).filter(k => /[一-龯々〆ヵヶ]/u.test(k) && text.includes(k)).sort((a, b) => b.length - a.length);
  if (!keys.length) return <>{text}</>;
  const escaped = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "gu"));
  return <>{parts.map((part, i) => JP_READINGS[part] ? <ruby key={`${part}-${i}`}>{part}<rt className="font-jp text-[0.45em] font-medium leading-none text-muted-foreground">{JP_READINGS[part]}</rt></ruby> : <span key={`${part}-${i}`}>{part}</span>)}</>;
}

function normalizeGrammarNotation(text: string) {
  return text
    .replace(/\bVerb\b/gi, "Kata Kerja")
    .replace(/\bV\b/g, "Kata Kerja")
    .replace(/\bN\b/g, "Kata Benda")
    .replace(/\bO\b/g, "Objek")
    .replace(/\s*\+\s*/g, " + ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function FuriganaDetailText({ text }: { text: string }) { return <FuriganaText text={normalizeGrammarNotation(text)} />; }

function SectionTitle({ icon: Icon, children }: { icon: typeof Info; children: React.ReactNode }) {
  return <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide"><span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span><span>{children}</span></h3>;
}

function detailFor(pattern: string, level: Level, storedStructure?: string | null): GrammarDetail {
  const p = pattern.trim();
  if (p.includes("だけ")) return {
    structure: ["Kata Benda + だけ", "Kata Kerja (bentuk biasa) + だけ", "Kata Sifat (i) + だけ", "Kata Sifat (na) + な + だけ"], type: "partikel adverbal", kind: "partikel", politeness: "standar",
    about: "だけ membatasi sesuatu pada jumlah, orang, benda, atau tindakan tertentu. Arti dasarnya adalah hanya atau cuma. Dalam beberapa pola, だけ dapat menekankan batas atau tingkat yang dicapai.",
    usage: "Gunakan だけ ketika ingin mengatakan bahwa sesuatu terbatas pada hal yang disebutkan. だけ biasanya ditempatkan setelah kata atau frasa yang dibatasi. Dalam kalimat seperti 私だけ, fokusnya hanya pada saya; sedangkan これだけ食べる berarti makan hanya sebanyak ini. Bedakan dengan しか yang hampir selalu membutuhkan bentuk negatif dan memberi nuansa pembatasan yang lebih kuat.",
    synonyms: ["しか〜ない — hanya, tetapi harus menggunakan bentuk negatif", "のみ — hanya; lebih formal atau tertulis"], antonyms: ["全部 — semua", "みんな — semuanya / semua orang"], related: ["しか〜ない", "のみ", "ばかり", "ほど"], levels: ["N5", "N4", "N3"],
  };
  if (p.includes("たことがある")) return { structure: ["Kata Kerja (bentuk た) + ことがある", "Kata Kerja (bentuk た) + ことがない"], type: "pola tata bahasa", kind: "ungkapan pengalaman", politeness: "standar", about: "Menyatakan pengalaman pernah atau belum pernah melakukan sesuatu.", usage: "Dipakai untuk membicarakan pengalaman sampai sekarang tanpa harus menyebut waktu spesifik. Bentuk た ditempatkan sebelum ことがある.", synonyms: ["経験がある — memiliki pengalaman; lebih formal"], antonyms: ["たことがない — belum pernah"], related: ["ことがある", "ことがない"], levels: ["N5", "N4"] };
  if (p.includes("てはいけない")) return { structure: ["Kata Kerja (bentuk て) + はいけない", "Kata Kerja (bentuk て) + はいけません"], type: "pola tata bahasa", kind: "ungkapan larangan", politeness: "standar; はいけません lebih sopan", about: "Menyatakan bahwa suatu tindakan tidak boleh dilakukan.", usage: "Digunakan untuk aturan, larangan, atau peringatan. Bentuk てはいけません cocok untuk situasi sopan; てはいけない lebih langsung dan netral.", synonyms: ["禁止する — melarang; digunakan sebagai kata kerja"], antonyms: ["てもいい — boleh melakukan"], related: ["てもいい", "なければならない"], levels: ["N5", "N4"] };
  if (p.includes("なければならない")) return { structure: ["Kata Kerja (bentuk ない → い diganti menjadi ければならない)", "Kata Kerja (bentuk ない) + なければならない"], type: "pola tata bahasa", kind: "ungkapan kewajiban", politeness: "standar", about: "Menyatakan kewajiban atau sesuatu yang harus dilakukan.", usage: "Dipakai ketika pembicara menyatakan keharusan berdasarkan aturan, keadaan, tanggung jawab, atau kebutuhan. Dalam percakapan, bentuk seperti なきゃ juga sering digunakan.", synonyms: ["必要がある — perlu / ada kebutuhan untuk"], antonyms: ["なくてもいい — tidak harus"], related: ["なくてもいい", "てはいけない", "べきだ"], levels: ["N4", "N3"] };
  const rawStructure = storedStructure?.split(/\n|\\n|;/).map(x => x.trim()).filter(Boolean) ?? [];
  return { structure: rawStructure.length ? rawStructure : ["Kata atau frasa + pola tata bahasa sesuai bentuk yang ditentukan"], type: "pola tata bahasa", kind: "ungkapan tata bahasa", politeness: "standar", about: `Pola ${p} digunakan untuk menyampaikan makna yang ditentukan oleh konteks kalimat.`, usage: `Perhatikan bentuk kata yang berada sebelum ${p}, lalu gunakan pola sesuai fungsi dan konteksnya. Jangan hanya menghafalkan terjemahan; pahami hubungan pola dengan maksud kalimat.`, synonyms: [], antonyms: [], related: [], levels: [level] };
}

function BunpoPage() {
  const { data: targetLevel, isLoading: levelLoading, error: levelError } = useQuery({ queryKey: ["target-level"], queryFn: fetchTargetLevel });
  const level: Level = targetLevel ?? "N5";
  const [index, setIndex] = useState(0);
  const [learned, setLearned] = useState<Record<string, boolean>>({});
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["grammar", level], queryFn: () => fetchGrammarList(level), enabled: !!targetLevel });
  const mutation = useMutation({ mutationFn: (id: string) => markItemLearned({ itemType: "grammar", itemId: id, level }), onSuccess: (_, id) => { setLearned(x => ({ ...x, [id]: true })); void qc.invalidateQueries({ queryKey: ["my-progress"] }); } });
  const cards = data ?? [];
  const item = cards[index];
  const examples = item ? asExamples(item.examples).slice(0, 3) : [];
  const meaningSource = typeof item?.meaning_id === "string" ? item.meaning_id.trim() : "";
  const englishSource = typeof item?.meaning_en === "string" ? item.meaning_en.trim() : "";
  const meaning = meaningSource && meaningSource.toLowerCase() !== englishSource.toLowerCase() ? meaningSource : "Terjemahan Indonesia sedang diproses…";
  const detail = item ? detailFor(item.pattern, item.level as Level, item.structure) : null;
  const progress = cards.length ? Math.round(((index + 1) / cards.length) * 100) : 0;
  const normalizedPattern = item ? normalizeGrammarNotation(item.pattern) : "";
  const speak = (text: string) => { if (!window.speechSynthesis) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "ja-JP"; u.rate = 0.85; window.speechSynthesis.speak(u); };

  return <AppShell title="文法 · Tata Bahasa" description={`Belajar tata bahasa sesuai target ${level}.`} backTo="/belajar" backLabel="Belajar">
    {levelLoading ? <p className="mt-8 text-center">Memuat tingkat belajar…</p> : levelError ? <p className="mt-8 text-center text-destructive">Tingkat dari profil tidak dapat dimuat.</p> : <>
      <div className="mb-4 rounded-xl border bg-primary/5 px-4 py-3 text-sm">Tingkat belajar: <strong>{level}</strong></div>
      {error && <p className="mt-5 text-sm text-destructive">Tata bahasa gagal dimuat. Silakan coba lagi.</p>}
      {isLoading && <p className="mt-8 text-center text-sm text-muted-foreground">Memuat materi…</p>}
      {item && detail && <div className="mt-6 space-y-5">
        <div className="mx-auto max-w-2xl"><div className="mb-3 flex items-center justify-between text-xs text-muted-foreground"><span>Materi {index + 1} dari {cards.length}</span><span>{progress}% selesai</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div></div>
        <Card className="mx-auto max-w-2xl overflow-hidden border-border/80 shadow-xl">
          <CardHeader className="space-y-4 bg-gradient-to-br from-primary/10 via-background to-secondary/20 px-6 py-8 text-center sm:px-8">
            <div className="flex items-center justify-center gap-2"><Badge variant="secondary">{item.level}</Badge><Badge variant="outline">BUNPOU</Badge></div>
            <div lang="ja" className="font-jp text-5xl font-bold tracking-wide sm:text-6xl"><FuriganaText text={normalizedPattern} /></div>
            <p className="text-xl font-semibold leading-relaxed">Arti : {meaning}</p>
            <Button type="button" variant="outline" size="sm" className="mx-auto" onClick={() => speak(item.pattern)}><Volume2 className="mr-2 size-4" />Dengarkan</Button>
          </CardHeader>
          <CardContent className="space-y-5 p-5 sm:p-7">
            <section className="rounded-2xl border bg-muted/30 p-5"><SectionTitle icon={ListTree}>STRUKTUR</SectionTitle><ul className="mt-3 list-disc space-y-2 pl-5 leading-7">{detail.structure.map((x, i) => <li key={`${x}-${i}`}><FuriganaDetailText text={x} /></li>)}</ul></section>
            <section className="rounded-2xl border bg-muted/30 p-5"><SectionTitle icon={Info}>DETAIL</SectionTitle><dl className="mt-3 space-y-3 text-sm"><div className="flex gap-3"><dt className="w-36 shrink-0 text-muted-foreground">Tipe kata</dt><dd className="font-medium"><FuriganaDetailText text={detail.type} /></dd></div><div className="flex gap-3"><dt className="w-36 shrink-0 text-muted-foreground">Jenis kata</dt><dd className="font-medium"><FuriganaDetailText text={detail.kind} /></dd></div><div className="flex gap-3"><dt className="w-36 shrink-0 text-muted-foreground">Tingkat kesopanan</dt><dd className="font-medium"><FuriganaDetailText text={detail.politeness} /></dd></div></dl></section>
            <section className="rounded-2xl border bg-muted/30 p-5"><SectionTitle icon={Sparkles}>TENTANG</SectionTitle><p className="mt-3 leading-7"><FuriganaDetailText text={detail.about} /></p></section>
            <section className="rounded-2xl border bg-muted/30 p-5"><SectionTitle icon={MessageCircle}>CONTOH KALIMAT</SectionTitle><p className="mt-2 text-sm text-muted-foreground">Setiap contoh menampilkan kalimat Jepang, furigana di atas kanji, lalu arti Bahasa Indonesia.</p><div className="mt-4 space-y-3">{examples.length ? examples.map((ex, i) => <div key={`${ex.jp ?? "contoh"}-${i}`} className="rounded-xl border bg-background p-4"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p lang="ja" className="font-jp text-lg leading-9"><FuriganaText text={ex.jp ?? ""} reading={ex.reading} /></p><p className="mt-2 border-t pt-2 text-sm leading-6">{ex.id ?? "Arti Bahasa Indonesia belum tersedia."}</p></div>{ex.jp && <Button type="button" size="icon" variant="ghost" aria-label="Dengarkan contoh kalimat" onClick={() => speak(ex.jp!)}><Volume2 className="size-4" /></Button>}</div></div>) : <p className="text-sm text-muted-foreground">Belum ada 3 contoh kalimat pada data materi ini.</p>}</div></section>
            <section className="rounded-2xl border bg-muted/30 p-5"><SectionTitle icon={Lightbulb}>PENJELASAN TENTANG PENGGUNAAN <FuriganaText text={normalizedPattern} /></SectionTitle><p className="mt-3 whitespace-pre-line leading-7"><FuriganaDetailText text={item.explanation_id || detail.usage} /></p>{item.explanation_id && <p className="mt-4 border-t pt-4 text-sm leading-6 text-muted-foreground"><FuriganaDetailText text={detail.usage} /></p>}</section>
            <div className="grid gap-4 sm:grid-cols-2"><section className="rounded-2xl border bg-muted/30 p-5"><SectionTitle icon={Link2}>SINONIM</SectionTitle>{detail.synonyms.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">{detail.synonyms.map((x, i) => <li key={i}><FuriganaDetailText text={x} /></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Tidak ada sinonim utama.</p>}</section><section className="rounded-2xl border bg-muted/30 p-5"><SectionTitle icon={Link2}>ANTONIM</SectionTitle>{detail.antonyms.length ? <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">{detail.antonyms.map((x, i) => <li key={i}><FuriganaDetailText text={x} /></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Tidak ada antonim langsung.</p>}</section></div>
            <section className="rounded-2xl border bg-muted/30 p-5"><SectionTitle icon={Link2}>TATA BAHASA TERKAIT</SectionTitle>{detail.related.length ? <div className="mt-3 flex flex-wrap gap-2">{detail.related.map((x, i) => <Badge key={`${x}-${i}`} variant="outline" className="px-3 py-1.5"><FuriganaDetailText text={x} /></Badge>)}</div> : <p className="mt-3 text-sm text-muted-foreground">Belum ada tata bahasa terkait yang terdata.</p>}</section>
            <section className="rounded-2xl border bg-muted/30 p-5"><SectionTitle icon={Layers3}>ADA DI LEVEL BERAPA SAJA?</SectionTitle><div className="mt-3 flex flex-wrap gap-2">{detail.levels.map(l => <Badge key={l} variant={l === item.level ? "default" : "secondary"}>{l}</Badge>)}</div><p className="mt-3 text-xs leading-5 text-muted-foreground">Level menunjukkan tingkat materi ENO JAPAN. Beberapa pola dapat muncul kembali di level berbeda untuk penggunaan yang lebih luas.</p></section>
          </CardContent>
        </Card>
        <div className="mx-auto max-w-2xl"><Button type="button" variant={learned[item.id] ? "secondary" : "outline"} onClick={() => mutation.mutate(item.id)} disabled={!!learned[item.id]} className="h-11 w-full rounded-xl font-semibold">{learned[item.id] ? <><Check className="mr-2 size-4" />Sudah dipelajari</> : "Tandai sudah dipelajari"}</Button></div>
        <div className="mx-auto max-w-2xl rounded-2xl border bg-muted/30 p-2 sm:p-2.5"><div className="grid grid-cols-2 gap-2"><Button type="button" variant="ghost" onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0} className="h-12 rounded-xl font-semibold"><ArrowLeft className="mr-2 size-4" />Sebelumnya</Button><Button type="button" onClick={() => setIndex(i => Math.min(cards.length - 1, i + 1))} disabled={index === cards.length - 1} className="h-12 rounded-xl font-semibold">Berikutnya<ArrowRight className="ml-2 size-4" /></Button></div></div>
      </div>}
      {!isLoading && !cards.length && <p className="mt-8 text-center text-sm text-muted-foreground">Belum ada pola tata bahasa untuk {level}.</p>}
    </>}
  </AppShell>;
}