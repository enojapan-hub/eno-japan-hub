import { supabase } from "@/integrations/supabase/client";
import { fetchVocabList, type Level } from "@/lib/learn-queries";

const QUERY_TIMEOUT_MS = 8000;
function withTimeout<T>(promise: PromiseLike<T>, ms = QUERY_TIMEOUT_MS): Promise<T> {
  return Promise.race([Promise.resolve(promise),new Promise<T>((_,reject)=>setTimeout(()=>reject(new Error("Permintaan database terlalu lama. Silakan coba lagi.")),ms))]);
}

export async function fetchVocabListResilient(level: Level) {
  // Detail Kotoba membutuhkan meaning_en dan vocabulary_senses. Loader lama sengaja
  // membuang senses sehingga kelas kata/penggunaan/contoh selalu kosong di UI.
  try {
    const extended = await withTimeout(
      supabase.from("vocabulary")
        .select("id, term, reading, romaji, meaning_id, meaning_en, part_of_speech, examples, level, sort_order, source_book, lesson_number, lesson_title, vocabulary_senses(meaning_id, part_of_speech, usage_note_id, examples, source_book)")
        .eq("level",level).eq("is_published",true)
        .order("lesson_number",{ascending:true,nullsFirst:false}).order("sort_order",{ascending:true}),
    );
    if(!extended.error&&(extended.data?.length??0)>0){
      return (extended.data??[]).map((row:any)=>({...row,senses:row.vocabulary_senses??[],curriculum:[]}));
    }
  } catch {}

  try {
    const basic=await withTimeout(
      supabase.from("vocabulary")
        .select("id, term, reading, romaji, meaning_id, meaning_en, part_of_speech, examples, level, sort_order, source_book, lesson_number, lesson_title")
        .eq("level",level).eq("is_published",true).order("sort_order",{ascending:true}),
    );
    if(!basic.error&&(basic.data?.length??0)>0)return (basic.data??[]).map((row:any)=>({...row,senses:[],curriculum:[]}));
  } catch {}

  try{return await withTimeout(fetchVocabList(level));}
  catch(error){throw error instanceof Error?error:new Error("Kosakata gagal dimuat dari database.");}
}
