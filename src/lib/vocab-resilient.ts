import { supabase } from "@/integrations/supabase/client";
import { fetchVocabList, type Level } from "@/lib/learn-queries";

const QUERY_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: PromiseLike<T>, ms = QUERY_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Permintaan database terlalu lama. Silakan coba lagi.")), ms),
    ),
  ]);
}

export async function fetchVocabListResilient(level: Level) {
  // Jalur utama dibuat sesederhana mungkin agar daftar kosakata tetap muncul
  // meskipun tabel curriculum/senses belum lengkap atau lambat.
  try {
    const extended = await withTimeout(
      supabase
        .from("vocabulary")
        .select("id, term, reading, romaji, meaning_id, part_of_speech, examples, level, sort_order, source_book, lesson_number, lesson_title")
        .eq("level", level)
        .eq("is_published", true)
        .order("lesson_number", { ascending: true, nullsFirst: false })
        .order("sort_order", { ascending: true }),
    );

    if (!extended.error && (extended.data?.length ?? 0) > 0) {
      return (extended.data ?? []).map((row) => ({ ...row, senses: [], curriculum: [] }));
    }
  } catch {
    // Lanjut ke fallback berikutnya.
  }

  // Schema V1: hanya memakai kolom yang sudah ada sejak awal proyek.
  try {
    const basic = await withTimeout(
      supabase
        .from("vocabulary")
        .select("id, term, reading, romaji, meaning_id, part_of_speech, examples, level, sort_order")
        .eq("level", level)
        .eq("is_published", true)
        .order("sort_order", { ascending: true }),
    );

    if (!basic.error && (basic.data?.length ?? 0) > 0) {
      return (basic.data ?? []).map((row) => ({
        ...row,
        source_book: null,
        lesson_number: null,
        lesson_title: null,
        senses: [],
        curriculum: [],
      }));
    }
  } catch {
    // Lanjut ke query lengkap sebagai fallback terakhir.
  }

  // Fallback terakhir untuk instalasi database yang tabel tambahannya sudah sehat.
  try {
    return await withTimeout(fetchVocabList(level));
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Kosakata gagal dimuat dari database.");
  }
}
