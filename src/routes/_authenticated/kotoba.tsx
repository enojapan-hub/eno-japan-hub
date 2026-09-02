import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StudyFlashcard } from "@/components/learn/StudyFlashcard";
import { fetchVocabList, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";

export const Route = createFileRoute("/_authenticated/kotoba")({ component: KotobaPage });

type LocalCard = {
  id: string;
  term: string;
  reading: string;
  romaji: string;
  meaning_id: string;
  part_of_speech: string;
  examples: Array<{ jp: string; id: string }>;
  level: Level;
  sort_order: number;
};

const FALLBACK_KOTOBA: LocalCard[] = [
  {
    id: "fallback-taberu",
    term: "食べる",
    reading: "たべる",
    romaji: "Taberu",
    meaning_id: "Makan",
    part_of_speech: "Kata kerja",
    examples: [
      { jp: "毎朝、ご飯を食べます。", id: "Setiap pagi, saya makan nasi." },
      { jp: "一緒に昼ご飯を食べませんか。", id: "Maukah makan siang bersama?" },
      { jp: "日本料理を食べてみたいです。", id: "Saya ingin mencoba makanan Jepang." },
    ],
    level: "N5",
    sort_order: 1,
  },
];

function KotobaPage() {
  const { data: targetLevel, isLoading: levelLoading } = useQuery({
    queryKey: ["target-level"],
    queryFn: fetchTargetLevel,
    retry: 1,
  });

  const level: Level = targetLevel ?? "N5";
  const [index, setIndex] = useState(0);
  const [learned, setLearned] = useState<Record<string, boolean>>({});
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["vocab", level],
    queryFn: () => fetchVocabList(level),
    enabled: true,
    retry: 1,
  });

  useEffect(() => setIndex(0), [level]);

  const mutation = useMutation({
    mutationFn: (id: string) => markItemLearned({ itemType: "vocabulary", itemId: id, level }),
    onSuccess: (_, id) => {
      setLearned(x => ({ ...x, [id]: true }));
      void qc.invalidateQueries({ queryKey: ["my-progress"] });
    },
  });

  // Jika database belum mengembalikan materi, tetap tampilkan contoh Kotoba yang
  // lengkap agar halaman tidak kosong dan desain baru dapat langsung terlihat.
  const cards: LocalCard[] = data?.length ? (data as LocalCard[]) : FALLBACK_KOTOBA;
  const item = cards[index] ?? cards[0];
  const examples = item ? asExamples(item.examples) : [];
  const meaning = item?.meaning_id || "Arti belum tersedia";
  const part = item?.part_of_speech || "Kosakata";
  const choices = item
    ? [meaning, ...cards.filter(x => x.id !== item.id && x.meaning_id).slice(0, 3).map(x => x.meaning_id)]
    : [];

  const usageNotes = item ? [
    "Percakapan sehari-hari untuk menyatakan kegiatan makan atau mengonsumsi makanan.",
    "Konteks: percakapan sehari-hari, pekerjaan, sekolah, dan soal JLPT sesuai kebutuhan.",
  ] : [];

  const explanation = item
    ? `${item.term} digunakan sebagai ${part.toLowerCase()} untuk menyampaikan makna “${meaning}”. Kata ini sangat umum digunakan dalam percakapan sehari-hari. Untuk JLPT, pelajari perubahan bentuknya seperti 食べます, 食べない, 食べた, dan 食べて.`
    : "";

  return (
    <AppShell
      title="言葉 · Kotoba"
      description={`Kosakata ${level} dengan format belajar lengkap: kanji, bacaan, romaji, arti Indonesia, contoh kalimat, penjelasan, konteks, audio, dan latihan.`}
      backTo="/belajar"
      backLabel="Belajar"
    >
      <div className="mb-4 rounded-xl border bg-primary/5 px-4 py-3 text-sm">
        Level belajar: <strong>{level}</strong>
        {!targetLevel && !levelLoading && <span className="ml-2 text-muted-foreground">(default N5)</span>}
      </div>

      {isLoading && <p className="mt-8 text-center text-sm text-muted-foreground">Memuat materi…</p>}

      {item && (
        <div className="mt-6">
          <StudyFlashcard
            index={index}
            total={cards.length}
            level={item.level}
            title={item.term}
            reading={item.reading}
            romaji={item.romaji}
            meaning={meaning}
            secondary={part}
            explanation={explanation}
            usageNotes={usageNotes}
            examples={examples}
            question={choices.length > 1 ? { prompt: `Apa arti kosakata ${item.term}?`, choices, correctIndex: 0 } : null}
            learned={!!learned[item.id]}
            kotobaMode
            onLearned={item.id.startsWith("fallback-") ? undefined : () => mutation.mutate(item.id)}
            onPrev={() => setIndex(i => Math.max(0, i - 1))}
            onNext={() => setIndex(i => Math.min(cards.length - 1, i + 1))}
          />
        </div>
      )}

      {error && !data?.length && (
        <p className="mt-4 text-center text-xs text-muted-foreground">Menampilkan materi contoh sementara. Data database akan digunakan otomatis setelah tersedia.</p>
      )}
    </AppShell>
  );
}
