import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Check, ChevronRight, Info, Lightbulb, Link2, ListTree, MessageCircle, Volume2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fetchGrammarList, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";

export const Route = createFileRoute("/_authenticated/bunpo")({ component: BunpoPage });

type GrammarDetail = {
  structure: string[];
  type: string;
  kind: string;
  politeness: string;
  about: string;
  usage: string;
  synonyms: string[];
  antonyms: string[];
  related: string[];
  levels: Level[];
};

const JP_READINGS: Record<string, string> = {
  "私": "わたし", "毎朝": "まいあさ", "七時": "しちじ", "八時": "はちじ", "九時": "くじ", "十時": "じゅうじ", "何時": "なんじ",
  "今日": "きょう", "明日": "あした", "昨日": "きのう", "全部": "ぜんぶ", "みんな": "みんな", "必要": "ひつよう",
  "禁止": "きんし", "経験": "けいけん", "学校": "がっこう", "家": "いえ", "駅": "えき", "顔": "かお", "洗": "あら", "朝": "あさ", "飯": "はん", "起": "お", "出": "で", "歩": "ある",
};

function FuriganaText({ text, reading }: { text: string; reading?: string | null }) {
  if (!text || !/[一-龯々〆ヵヶ]/u.test(text)) return <>{text}</>;
  if (reading?.trim()) {
    return <ruby>{text}<rt className="font-jp text-[0.45em] font-medium leading-none text-muted-foreground">{reading.trim()}</rt></ruby>;
  }
  const keys = Object.keys(JP_READINGS).filter((key) => text.includes(key)).sort((a, b) => b.length - a.length);
  if (!keys.length) return <>{text}</>;
  const escaped = keys.map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "gu"));
  return <>{parts.map((part, index) => JP_READINGS[part] ? <ruby key={`${part}-${index}`}>{part}<rt className="font-jp text-[0.45em] font-medium leading-none text-muted-foreground">{JP_READINGS[part]}</rt></ruby> : <span key={`${part}-${index}`}>{part}</span>)}</>;
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

function DetailSection({ icon: Icon, title, children }: { icon: typeof Info; title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border bg-muted/20 p-5">
    <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide"><span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>{title}</h3>
    <div className="mt-4">{children}</div>
  </section>;
}

function detailFor(pattern: string, level: Level, storedStructure?: string | null): GrammarDetail {
  const p = pattern.trim();
  if (p.includes("だけ")) return {
    structure: ["Kata Benda + だけ", "Kata Kerja (bentuk biasa) + だけ", "Kata Sifat (i) + だけ", "Kata Sifat (na) + な + だけ"],
    type: "partikel adverbal", kind: "partikel", politeness: "standar",
    about: "だけ membatasi sesuatu pada jumlah, orang, benda, atau tindakan tertentu. Arti dasarnya adalah hanya atau cuma.",
    usage: "Gunakan だけ ketika ingin membatasi sesuatu pada hal yang disebutkan. だけ ditempatkan setelah kata atau frasa yang dibatasi. Bedakan dengan しか〜ない yang membutuhkan bentuk negatif dan memberi nuansa pembatasan lebih kuat.",
    synonyms: ["しか〜ない — hanya, dengan bentuk negatif", "のみ — hanya; lebih formal atau tertulis"], antonyms: ["全部 — semua", "みんな — semuanya / semua orang"], related: ["しか〜ない", "のみ", "ばかり", "ほど"], levels: ["N5", "N4", "N3"],
  };
  if (p.includes("たことがある")) return {
    structure: ["Kata Kerja (bentuk た) + ことがある", "Kata Kerja (bentuk た) + ことがない"], type: "pola tata bahasa", kind: "ungkapan pengalaman", politeness: "standar",
    about: "Menyatakan pengalaman pernah atau belum pernah melakukan sesuatu.",
    usage: "Dipakai untuk membicarakan pengalaman sampai sekarang tanpa harus menyebut waktu spesifik. Bentuk た ditempatkan sebelum ことがある.",
    synonyms: ["経験がある — memiliki pengalaman; lebih formal"], antonyms: ["たことがない — belum pernah"], related: ["ことがある", "ことがない"], levels: ["N5", "N4"],
  };
  if (p.includes("てはいけない")) return {
    structure: ["Kata Kerja (bentuk て) + はいけない", "Kata Kerja (bentuk て) + はいけません"], type: "pola tata bahasa", kind: "ungkapan larangan", politeness: "standar; はいけません lebih sopan",
    about: "Menyatakan bahwa suatu tindakan tidak boleh dilakukan.",
    usage: "Digunakan untuk aturan, larangan, atau peringatan. Bentuk てはいけません cocok untuk situasi sopan; てはいけない lebih langsung dan netral.",
    synonyms: ["禁止する — melarang; digunakan sebagai kata kerja"], antonyms: ["てもいい — boleh melakukan"], related: ["てもいい", "なければならない"], levels: ["N5", "N4"],
  };
  if (p.includes("なければならない")) return {
    structure: ["Kata Kerja (bentuk ない) + なければならない", "Kata Kerja (bentuk ない) + なければいけない"], type: "pola tata bahasa", kind: "ungkapan kewajiban", politeness: "standar",
    about: "Menyatakan kewajiban atau sesuatu yang harus dilakukan.",
    usage: "Dipakai ketika pembicara menyatakan keharusan berdasarkan aturan, keadaan, tanggung jawab, atau kebutuhan.",
    synonyms: ["必要がある — perlu / ada kebutuhan untuk"], antonyms: ["なくてもいい — tidak harus"], related: ["なくてもいい", "てはいけない", "べきだ"], levels: ["N4", "N3"],
  };
  const rawStructure = storedStructure?.split(/\n|\\n|;/).map((x) => x.trim()).filter(Boolean) ?? [];
  return {
    structure: rawStructure.length ? rawStructure : ["Kata atau frasa + pola tata bahasa sesuai bentuk yang ditentukan"],
    type: "pola tata bahasa", kind: "ungkapan tata bahasa", politeness: "standar",
    about: `Pola ${p} digunakan untuk menyampaikan makna sesuai konteks kalimat.`,
    usage: `Perhatikan bentuk kata yang berada sebelum ${p}, lalu gunakan pola sesuai fungsi dan konteksnya. Pahami hubungan pola dengan maksud kalimat, bukan hanya terjemahannya.`,
    synonyms: [], antonyms: [], related: [], levels: [level],
  };
}

function BunpoPage() {
  const { data: targetLevel, isLoading: levelLoading, error: levelError } = useQuery({ queryKey: ["target-level"], queryFn: fetchTargetLevel });
  const level: Level = targetLevel ?? "N5";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [learned, setLearned] = useState<Record<string, boolean>>({});
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["grammar", level], queryFn: () => fetchGrammarList(level), enabled: !!targetLevel });
  const mutation = useMutation({
    mutationFn: (id: string) => markItemLearned({ itemType: "grammar", itemId: id, level }),
    onSuccess: (_, id) => { setLearned((current) => ({ ...current, [id]: true })); void qc.invalidateQueries({ queryKey: ["my-progress"] }); },
  });

  const cards = data ?? [];
  const item = cards.find((card) => card.id === selectedId) ?? null;
  const detail = item ? detailFor(item.pattern, item.level as Level, item.structure) : null;
  const examples = item ? asExamples(item.examples).slice(0, 3) : [];
  const meaningSource = typeof item?.meaning_id === "string" ? item.meaning_id.trim() : "";
  const englishSource = typeof item?.meaning_en === "string" ? item.meaning_en.trim() : "";
  const meaning = meaningSource && meaningSource.toLowerCase() !== englishSource.toLowerCase() ? meaningSource : "Terjemahan Indonesia sedang diproses…";
  const speak = (text: string) => { if (!window.speechSynthesis) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "ja-JP"; utterance.rate = 0.85; window.speechSynthesis.speak(utterance); };

  const listView = !item;

  return <AppShell title="文法 · Bunpō" description={`Tata bahasa JLPT ${level}`} backTo="/belajar" backLabel="Belajar">
    {levelLoading ? <p className="mt-8 text-center text-sm text-muted-foreground">Memuat tingkat belajar…</p> : levelError ? <p className="mt-8 text-center text-sm text-destructive">Tingkat dari profil tidak dapat dimuat.</p> : <>
      {listView ? <div className="mx-auto mt-5 max-w-2xl">
        <div className="mb-5 rounded-2xl border bg-card px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tingkat belajar</p><p className="mt-1 text-xl font-bold">JLPT {level}</p></div>
            <Badge className="rounded-full px-3 py-1">{cards.length} pola</Badge>
          </div>
        </div>
        {error && <p className="mb-5 text-sm text-destructive">Tata bahasa gagal dimuat. Silakan coba lagi.</p>}
        {isLoading ? <p className="py-12 text-center text-sm text-muted-foreground">Memuat materi…</p> : cards.length ? <div className="space-y-3">
          {cards.map((card, index) => {
            const source = typeof card.meaning_id === "string" ? card.meaning_id.trim() : "";
            const english = typeof card.meaning_en === "string" ? card.meaning_en.trim() : "";
            const summary = source && source.toLowerCase() !== english.toLowerCase() ? source : "Penjelasan Bahasa Indonesia sedang diproses…";
            return <button key={card.id} type="button" onClick={() => setSelectedId(card.id)} className="group w-full rounded-2xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30">
              <div className="flex items-center gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span lang="ja" className="font-jp text-2xl font-bold"><FuriganaText text={card.pattern} /></span><Badge variant="secondary" className="rounded-full">{level}</Badge></div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{summary}</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </button>;
          })}
        </div> : <p className="py-12 text-center text-sm text-muted-foreground">Belum ada pola tata bahasa untuk {level}.</p>}
      </div> : detail && item ? <div className="mx-auto mt-5 max-w-2xl space-y-4">
        <Button type="button" variant="ghost" className="-ml-2 h-10 rounded-xl" onClick={() => setSelectedId(null)}><ArrowLeft className="mr-2 size-4" />Kembali ke daftar {level}</Button>
        <Card className="overflow-hidden border-border/80 shadow-lg">
          <div className="border-b bg-muted/20 px-5 py-7 text-center sm:px-8">
            <div className="flex items-center justify-center gap-2"><Badge variant="secondary">{item.level}</Badge><Badge variant="outline">BUNPŌ</Badge></div>
            <div lang="ja" className="mt-4 font-jp text-5xl font-bold tracking-wide sm:text-6xl"><FuriganaText text={item.pattern} /></div>
            <p className="mt-4 text-lg font-semibold leading-7">{meaning}</p>
            <Button type="button" variant="outline" size="sm" className="mt-4 rounded-xl" onClick={() => speak(item.pattern)}><Volume2 className="mr-2 size-4" />Dengarkan</Button>
          </div>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <DetailSection icon={ListTree} title="STRUKTUR"><ul className="list-disc space-y-2 pl-5 leading-7">{detail.structure.map((structure, index) => <li key={`${structure}-${index}`}><FuriganaText text={normalizeGrammarNotation(structure)} /></li>)}</ul></DetailSection>
            <DetailSection icon={Info} title="DETAIL"><dl className="space-y-3 text-sm"><div className="flex gap-3"><dt className="w-36 shrink-0 text-muted-foreground">Tipe</dt><dd className="font-medium">{detail.type}</dd></div><div className="flex gap-3"><dt className="w-36 shrink-0 text-muted-foreground">Jenis</dt><dd className="font-medium">{detail.kind}</dd></div><div className="flex gap-3"><dt className="w-36 shrink-0 text-muted-foreground">Kesopanan</dt><dd className="font-medium">{detail.politeness}</dd></div></dl></DetailSection>
            <DetailSection icon={Lightbulb} title="TENTANG"><p className="leading-7">{detail.about}</p></DetailSection>
            <DetailSection icon={MessageCircle} title="CONTOH KALIMAT"><div className="space-y-3">{examples.length ? examples.map((example, index) => <div key={`${example.jp ?? "contoh"}-${index}`} className="rounded-xl border bg-background p-4"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p lang="ja" className="font-jp text-lg leading-9"><FuriganaText text={example.jp ?? ""} reading={example.reading} /></p><p className="mt-2 border-t pt-2 text-sm leading-6">{example.id ?? "Arti Bahasa Indonesia belum tersedia."}</p></div>{example.jp && <Button type="button" size="icon" variant="ghost" aria-label="Dengarkan contoh kalimat" onClick={() => speak(example.jp!)}><Volume2 className="size-4" /></Button>}</div></div>) : <p className="text-sm text-muted-foreground">Belum ada contoh kalimat untuk pola ini.</p>}</div></DetailSection>
            <DetailSection icon={Lightbulb} title={`PENJELASAN PENGGUNAAN · ${item.pattern}`}><p className="whitespace-pre-line leading-7">{item.explanation_id || detail.usage}</p></DetailSection>
            <div className="grid gap-4 sm:grid-cols-2"><DetailSection icon={Link2} title="SINONIM">{detail.synonyms.length ? <ul className="list-disc space-y-2 pl-5 text-sm leading-6">{detail.synonyms.map((value, index) => <li key={index}>{value}</li>)}</ul> : <p className="text-sm text-muted-foreground">Tidak ada sinonim utama.</p>}</DetailSection><DetailSection icon={Link2} title="ANTONIM">{detail.antonyms.length ? <ul className="list-disc space-y-2 pl-5 text-sm leading-6">{detail.antonyms.map((value, index) => <li key={index}>{value}</li>)}</ul> : <p className="text-sm text-muted-foreground">Tidak ada antonim langsung.</p>}</DetailSection></div>
            <DetailSection icon={Link2} title="TATA BAHASA TERKAIT">{detail.related.length ? <div className="flex flex-wrap gap-2">{detail.related.map((value, index) => <Badge key={`${value}-${index}`} variant="outline" className="px-3 py-1.5">{value}</Badge>)}</div> : <p className="text-sm text-muted-foreground">Belum ada tata bahasa terkait yang terdata.</p>}</DetailSection>
          </CardContent>
        </Card>
        <Button type="button" variant={learned[item.id] ? "secondary" : "default"} onClick={() => mutation.mutate(item.id)} disabled={!!learned[item.id] || mutation.isPending} className="h-12 w-full rounded-xl font-semibold">{learned[item.id] ? <><Check className="mr-2 size-4" />Sudah dipelajari</> : "Tandai sudah dipelajari"}</Button>
      </div> : null}
    </>}
  </AppShell>;
}
