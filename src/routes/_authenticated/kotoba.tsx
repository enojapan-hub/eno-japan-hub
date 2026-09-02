import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StudyFlashcard } from "@/components/learn/StudyFlashcard";
import { fetchVocabList, markItemLearned, asExamples, type Level } from "@/lib/learn-queries";
import { fetchTargetLevel } from "@/lib/target-level";

export const Route = createFileRoute("/_authenticated/kotoba")({ component: KotobaPage });

function KotobaPage() {
  const { data: targetLevel, isLoading: levelLoading } = useQuery({
    queryKey: ["target-level"],
    queryFn: fetchTargetLevel,
    retry: 1,
  });

  // Kotoba harus tetap tampil walaupun profil/target level belum tersedia.
  // N5 menjadi fallback agar halaman tidak kosong hanya karena query profil gagal.
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

  useEffect(() => {
    setIndex(0);
  }, [level]);

  const mutation = useMutation({
    mutationFn: (id: string) => markItemLearned({ itemType: "vocabulary", itemId: id, level }),
    onSuccess: (_, id) => {
      setLearned(x => ({ ...x, [id]: true }));
      void qc.invalidateQueries({ queryKey: ["my-progress"] });
    },
  });

  const cards = data ?? [];
  const item = cards[index];
  const examples = item ? asExamples(item.examples) : [];
  const meaning = item?.meaning_id || "Arti belum tersedia";
  const part = item?.part_of_speech || "Kosakata";
  const choices = item
    ? [meaning, ...cards.filter((x: any) => x.id !== item.id && x.meaning_id).slice(0, 3).map((x: any) => x.meaning_id)]
    : [];

  const usageNotes = item ? [
    part.toLowerCase().includes("verb") || part.toLowerCase().includes("kata kerja")
      ? "Percakapan sehari-hari untuk menyatakan tindakan atau aktivitas."
      : part.toLowerCase().includes("adjective") || part.toLowerCase().includes("kata sifat")
        ? "Menjelaskan sifat, keadaan, atau kondisi seseorang maupun sesuatu."
        : part.toLowerCase().includes("adverb") || part.toLowerCase().includes("kata keterangan")
          ? "Menjelaskan cara, waktu, tingkat, atau keadaan suatu tindakan."
          : "Percakapan dan bacaan sehari-hari sesuai konteks kalimat.",
    "Konteks: percakapan sehari-hari, pekerjaan, sekolah, dan soal JLPT sesuai kebutuhan.",
  ] : [];

  const explanation = item
    ? `${item.term} digunakan sebagai ${part.toLowerCase()} untuk menyampaikan makna “${meaning}”. Perhatikan contoh kalimat karena makna dan nuansa sebuah kosakata dapat berubah sesuai konteks. Untuk JLPT, pelajari cara kata ini digunakan dalam kalimat, bukan hanya arti tunggalnya.`
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
        {!targetLevel && !levelLoading && <span className="ml-2 text-muted-foreground">(default)</span>}
      </div>

      {error && (
        <p className="mt-5 text-sm text-destructive">
          Gagal memuat kosakata. Silakan coba lagi.
        </p>
      )}
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
            onLearned={() => mutation.mutate(item.id)}
            onPrev={() => setIndex(i => Math.max(0, i - 1))}
            onNext={() => setIndex(i => Math.min(cards.length - 1, i + 1))}
          />
        </div>
      )}

      {!isLoading && !error && !cards.length && (
        <div className="mt-8 rounded-2xl border p-6 text-center">
          <p className="font-semibold">Belum ada kosakata untuk {level}.</p>
          <p className="mt-2 text-sm text-muted-foreground">Materi akan muncul setelah data kosakata tersedia.</p>
        </div>
      )}
    </AppShell>
  );
}
