import { supabase } from "@/integrations/supabase/client";
import { fetchVocabList, type Level } from "@/lib/learn-queries";

export async function fetchVocabListResilient(level: Level) {
  try {
    const full = await fetchVocabList(level);
    if (full.length) return full;
  } catch {
    // Fall through to the base vocabulary table so the UI never disappears
    // if optional curriculum/sense joins are unavailable.
  }

  const { data, error } = await supabase
    .from("vocabulary")
    .select("id, term, reading, romaji, meaning_id, part_of_speech, examples, level, sort_order, source_book, lesson_number, lesson_title")
    .eq("level", level)
    .eq("is_published", true)
    .order("lesson_number", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...row, senses: [] }));
}
