import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StudyFlashcard } from "@/components/learn/StudyFlashcard";
import { fetchGrammarList, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";

export const Route = createFileRoute("/_authenticated/bunpo")({ component: BunpoPage });

function mistakeFor(pattern: string) {
  if (pattern.includes("なければならない")) return { wrong: "食べるなければならない。", right: "食べなければならない。", note: "Kata kerja harus diubah ke bentuk ない terlebih dahulu, kemudian い pada bentuk ない dihilangkan sebelum ditambahkan なければならない." };
  if (pattern.includes("てはいけない")) return { wrong: "食べてはいけます。", right: "食べてはいけません。", note: "Pola 〜てはいけない menyatakan larangan. Dalam percakapan sopan, 〜てはいけません lebih lazim." };
  if (pattern.includes("たことがある")) return { wrong: "日本へ行くことがあります。", right: "日本へ行ったことがあります。", note: "Pola 〜たことがあります menyatakan pengalaman yang pernah dilakukan, sehingga kata kerja memakai bentuk た." };
  return { wrong: null, right: null, note: "Periksa bentuk kata yang berada sebelum pola. Arti pola dapat berubah jika bentuk sebelumnya salah." };
}

function guideFor(pattern: string) {
  if (pattern.includes("たことがある")) return { fungsi: "Menyatakan pengalaman yang pernah dialami setidaknya satu kali.", penggunaan: ["Menceritakan pengalaman hidup tanpa perlu menyebut waktu tepatnya.", "Menanyakan apakah seseorang pernah melakukan sesuatu.", "Membicarakan pengalaman yang belum pernah dilakukan dengan bentuk negatif."], efisien: "Ingat sebagai: bentuk た + ことがあります = pernah melakukan. Jika membicarakan kejadian yang sedang terjadi atau kebiasaan, gunakan pola lain sesuai maksud kalimat." };
  if (pattern.includes("なければならない")) return { fungsi: "Menyatakan kewajiban atau sesuatu yang harus dilakukan.", penggunaan: ["Kewajiban dalam pekerjaan atau sekolah.", "Aturan dan keharusan sehari-hari.", "Menjelaskan sesuatu yang harus dilakukan agar tujuan tertentu tercapai."], efisien: "Mulai dari bentuk ない, lalu ubah menjadi 〜なければならない. Untuk percakapan yang lebih santai, pola 〜なきゃ juga dapat ditemui." };
  if (pattern.includes("てはいけない")) return { fungsi: "Menyatakan larangan atau sesuatu yang tidak boleh dilakukan.", penggunaan: ["Larangan berdasarkan aturan.", "Memberi tahu bahwa suatu tindakan tidak diperbolehkan.", "Memberi peringatan kepada orang lain."], efisien: "Ingat sebagai: bentuk て + はいけない = tidak boleh. Dalam situasi sopan gunakan 〜てはいけません." };
  return { fungsi: "Menjelaskan fungsi pola dalam kalimat dan hubungan pola dengan konteks pembicaraan.", penggunaan: ["Perhatikan siapa yang berbicara dan kepada siapa.", "Perhatikan waktu, tujuan, dan tingkat kesopanan.", "Bandingkan dengan pola yang memiliki arti hampir sama sebelum memilih pola."], efisien: "Jangan menghafalkan arti satu baris saja. Hafalkan bentuknya bersama satu contoh utama dan satu situasi penggunaan." };
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
  const examples = item ? asExamples(item.examples) : [];
  const meaning = item?.meaning_id || "Arti belum tersedia.";
  const explanation = item?.explanation_id || "Penjelasan belum tersedia. Gunakan contoh kalimat untuk memahami konteksnya.";
  const guide = item ? guideFor(item.pattern) : null;
  const mistake = item ? mistakeFor(item.pattern) : null;
  const choices = useMemo(() => {
    if (!item) return [];
    const pool = cards.filter(x => x.id !== item.id && x.meaning_id).slice(0, 3).map(x => x.meaning_id as string);
    const all = [meaning, ...pool];
    return all.map((value, i) => ({ value, original: i })).sort(() => Math.random() - 0.5);
  }, [item?.id, cards.length, meaning]);
  const correctIndex = Math.max(0, choices.findIndex(x => x.original === 0));

  return <AppShell title="文法 · Tata Bahasa" description={`Belajar tata bahasa sesuai target ${level}.`} backTo="/belajar" backLabel="Belajar">
    {levelLoading ? <p className="mt-8 text-center">Memuat tingkat belajar…</p> : levelError ? <p className="mt-8 text-center text-destructive">Tingkat dari profil tidak dapat dimuat.</p> : <>
      <div className="mb-4 rounded-xl border bg-primary/5 px-4 py-3 text-sm">Tingkat belajar: <strong>{level}</strong></div>
      {error && <p className="mt-5 text-sm text-destructive">Tata bahasa gagal dimuat. Silakan coba lagi.</p>}
      {isLoading && <p className="mt-8 text-center text-sm text-muted-foreground">Memuat materi…</p>}
      {item && <div className="mt-6 space-y-5">
        <StudyFlashcard index={index} total={cards.length} level={item.level} title={item.pattern} meaning={meaning} structure={item.structure} explanation={explanation} examples={examples} question={choices.length > 1 ? { prompt: `Apa fungsi pola ${item.pattern}?`, choices: choices.map(x => x.value), correctIndex } : null} learned={!!learned[item.id]} onLearned={() => mutation.mutate(item.id)} onPrev={() => setIndex(i => Math.max(0, i - 1))} onNext={() => setIndex(i => Math.min(cards.length - 1, i + 1))} />
        {guide && <section className="mx-auto max-w-2xl space-y-4 rounded-2xl border bg-background p-5">
          <div><p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">FUNGSI</p><p className="mt-2 leading-7">{guide.fungsi}</p></div>
          <div><p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">CARA PENGGUNAAN</p><ol className="mt-2 list-decimal space-y-2 pl-5 leading-7">{guide.penggunaan.map((x, i) => <li key={i}>{x}</li>)}</ol></div>
          <div><p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">CARA MENGGUNAKAN DENGAN EFISIEN</p><p className="mt-2 leading-7">{guide.efisien}</p></div>
        </section>}
        {mistake && <section className="mx-auto max-w-2xl space-y-3 rounded-2xl border bg-background p-5"><p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">KESALAHAN UMUM</p>{mistake.wrong && <><div className="rounded-xl bg-destructive/5 p-4"><p className="text-sm font-semibold text-destructive">✗ {mistake.wrong}</p></div><div className="rounded-xl bg-emerald-500/5 p-4"><p className="text-sm font-semibold">✓ {mistake.right}</p></div></>}<p className="text-sm leading-6 text-muted-foreground">{mistake.note}</p></section>}
      </div>}
      {!isLoading && !cards.length && <p className="mt-8 text-center text-sm text-muted-foreground">Belum ada pola tata bahasa untuk {level}.</p>}
    </>}
  </AppShell>;
}
