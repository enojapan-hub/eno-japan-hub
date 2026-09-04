import { supabase } from "@/integrations/supabase/client";
import { fetchVocabList, type Level } from "@/lib/learn-queries";

export async function fetchVocabListResilient(level: Level) {
  try {
    const full = await fetchVocabList(level);
    if (full.length) return full;
  } catch {
    // Optional curriculum/sense tables must never make vocabulary disappear.
  }

  const extended = await supabase
    .from("vocabulary")
    .select("id, term, reading, romaji, meaning_id, part_of_speech, examples, level, sort_order, source_book, lesson_number, lesson_title")
    .eq("level", level)
    .eq("is_published", true)
    .order("lesson_number", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true });

  if (!extended.error) {
    return (extended.data ?? []).map((row) => ({ ...row, senses: [], curriculum: [] }));
  }

  // Final fallback only uses columns from the original V1 vocabulary schema.
  const basic = await supabase
    .from("vocabulary")
    .select("id, term, reading, romaji, meaning_id, part_of_speech, examples, level, sort_order")
    .eq("level", level)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (basic.error) throw new Error(basic.error.message);
  return (basic.data ?? []).map((row) => ({
    ...row,
    source_book: null,
    lesson_number: null,
    lesson_title: null,
    senses: [],
    curriculum: [],
  }));
}
