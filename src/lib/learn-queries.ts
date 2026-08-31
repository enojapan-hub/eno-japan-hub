import { supabase } from "@/integrations/supabase/client";

export type Level = "N5" | "N4" | "N3" | "N2" | "N1";
export const LEVELS: Level[] = ["N5", "N4", "N3", "N2", "N1"];
export type Example = { jp?: string; id?: string; reading?: string };
export function asExamples(value: unknown): Example[] { return Array.isArray(value) ? value as Example[] : []; }
function must<T>(res: { data: T | null; error: { message: string } | null }): T { if (res.error) throw new Error(res.error.message); return (res.data ?? []) as T; }
function dayNumber() { return Math.floor(Date.now() / 86400000); }
function windowStart(count: number, step: number) { return count > 0 ? (dayNumber() * step) % count : 0; }

export async function fetchKanjiList(level: Level) {
  const countRes = await supabase.from("kanji").select("id", { count: "exact", head: true }).eq("level", level).eq("is_published", true);
  if (countRes.error) throw new Error(countRes.error.message);
  const count = countRes.count ?? 0;
  if (!count) return [];
  return must(await supabase.from("kanji").select("id, character, level, onyomi, kunyomi, meaning_id, meaning_en, stroke_count, sort_order").eq("level", level).eq("is_published", true).order("sort_order").range(windowStart(count, 17), windowStart(count, 17) + 59));
}

export async function fetchKanjiStudy(id: string) {
  const kanjiRows = must(await supabase.from("kanji").select("*").eq("id", id).eq("is_published", true).limit(1));
  const kanji = kanjiRows[0] ?? null;
  if (!kanji) return { kanji: null, examples: [] as Example[] };
  const char = String(kanji.character ?? "");
  const vocabRows = must(await supabase.from("vocabulary").select("term, reading, meaning_id, examples").eq("is_published", true).ilike("term", `%${char}%`).limit(5));
  const examples: Example[] = [];
  for (const v of vocabRows as Array<Record<string, unknown>>) {
    const ve = asExamples(v.examples);
    if (ve.length) examples.push(...ve);
    else if (v.term) examples.push({ jp: String(v.term), reading: v.reading ? String(v.reading) : undefined, id: v.meaning_id ? String(v.meaning_id) : undefined });
  }
  return { kanji, examples: examples.slice(0, 5) };
}

export async function fetchVocabList(level: Level) {
  const countRes = await supabase.from("vocabulary").select("id", { count: "exact", head: true }).eq("level", level).eq("is_published", true);
  if (countRes.error) throw new Error(countRes.error.message);
  const count = countRes.count ?? 0;
  if (!count) return [];
  return must(await supabase.from("vocabulary").select("id, term, reading, romaji, meaning_id, meaning_en, part_of_speech, examples, level, sort_order").eq("level", level).eq("is_published", true).order("sort_order").range(windowStart(count, 31), windowStart(count, 31) + 59));
}
export async function fetchGrammarList(level: Level) {
  const countRes = await supabase.from("grammar_points").select("id", { count: "exact", head: true }).eq("level", level).eq("is_published", true);
  if (countRes.error) throw new Error(countRes.error.message);
  const count = countRes.count ?? 0;
  if (!count) return [];
  return must(await supabase.from("grammar_points").select("id, pattern, meaning_id, meaning_en, structure, explanation_id, explanation_en, examples, level, sort_order").eq("level", level).eq("is_published", true).order("sort_order").range(windowStart(count, 13), windowStart(count, 13) + 39));
}
export async function fetchPassages() { return must(await supabase.from("reading_passages").select("id, title, level, body_jp, translation_id, translation_en, estimated_minutes, sort_order").eq("is_published", true).order("sort_order")); }
export async function fetchPassageDetail(id: string) { const passages = must(await supabase.from("reading_passages").select("*").eq("id", id).limit(1)); const questions = must(await supabase.from("questions").select("id, prompt, prompt_note, choices, correct_index, explanation_id, explanation_en").eq("passage_id", id).eq("is_published", true)); return { passage: passages[0] ?? null, questions }; }
export async function fetchListeningList() { return must(await supabase.from("listening_items").select("id, title, level, duration_seconds, sort_order, audio_url, question_type, audio_license, audio_attribution, source").eq("is_published", true).order("sort_order")); }
export async function fetchListeningDetail(id: string) { const items = must(await supabase.from("listening_items").select("*").eq("id", id).limit(1)); const questions = must(await supabase.from("questions").select("id, prompt, choices, correct_index, explanation_id, explanation_en").eq("listening_id", id).eq("is_published", true)); return { item: items[0] ?? null, questions }; }
export async function fetchQuizzes() { return must(await supabase.from("quizzes").select("id, slug, title, description, level, skill, question_count, time_limit_seconds").eq("is_published", true).order("level").order("sort_order")); }
export type RunnerQuestion = { id: string; prompt: string; prompt_note: string | null; choices: string[]; correct_index: number; explanation_id: string | null; };
function toRunnerQuestions(rows: unknown[]): RunnerQuestion[] { return (rows as Array<Record<string, unknown>>).map(q => ({ id: String(q.id), prompt: String(q.prompt), prompt_note: (q.prompt_note as string | null) ?? null, choices: Array.isArray(q.choices) ? (q.choices as string[]).map(String) : [], correct_index: Number(q.correct_index), explanation_id: (q.explanation_id as string | null) ?? null })); }
export async function fetchQuizBySlug(slug: string) { const quizzes = must(await supabase.from("quizzes").select("*").eq("slug", slug).eq("is_published", true).limit(1)); const quiz = quizzes[0] ?? null; if (!quiz) return { quiz: null, questions: [] as RunnerQuestion[] }; const rows = must(await supabase.from("quiz_questions").select("sort_order, question:question_id (id, prompt, prompt_note, choices, correct_index, explanation_id, is_published)").eq("quiz_id", quiz.id).order("sort_order")) as Array<{ question: Record<string, unknown> | null }>; return { quiz, questions: toRunnerQuestions(rows.map(r => r.question).filter((q): q is Record<string, unknown> => !!q && q.is_published === true)) }; }
export type SimSkillGroup = "vocabulary_grammar" | "reading" | "listening";
export async function fetchSimulationQuestions(level: Level, group: SimSkillGroup) { const skills = group === "vocabulary_grammar" ? (["vocabulary", "grammar", "kanji"] as const) : group === "reading" ? (["reading"] as const) : (["listening"] as const); const rows = must(await supabase.from("questions").select("id, prompt, prompt_note, choices, correct_index, explanation_id, level, skill").eq("is_published", true).eq("level", level).in("skill", skills as unknown as ("kanji"|"vocabulary"|"grammar"|"reading"|"listening")[]).limit(12)) as Array<Record<string, unknown>>; return toRunnerQuestions(rows); }
export async function saveAttempt(input: { quizId?: string | null; level?: Level | null; skill?: "kanji" | "vocabulary" | "grammar" | "reading" | "listening" | null; total: number; correct: number; durationSeconds: number; answers: Array<{ questionId: string; selectedIndex: number; isCorrect: boolean }> }) { const { data: userRes } = await supabase.auth.getUser(); const userId = userRes.user?.id; if (!userId) return; const score = input.total > 0 ? Math.round((input.correct / input.total) * 10000) / 100 : 0; const { data: attempt, error } = await supabase.from("quiz_attempts").insert({ user_id: userId, quiz_id: input.quizId ?? null, level: input.level ?? null, skill: input.skill ?? null, total_questions: input.total, correct_count: input.correct, score, xp_earned: input.correct * 10, duration_seconds: input.durationSeconds, completed_at: new Date().toISOString() }).select("id").maybeSingle(); if (error || !attempt) return; await supabase.from("quiz_answers").insert(input.answers.map(a => ({ attempt_id: attempt.id, user_id: userId, question_id: a.questionId, selected_index: a.selectedIndex, is_correct: a.isCorrect }))); }
export async function markItemLearned(input: { itemType: "kanji" | "vocabulary" | "grammar"; itemId: string; level: Level }) { const { data: userRes } = await supabase.auth.getUser(); const userId = userRes.user?.id; if (!userId) throw new Error("Sesi tidak ditemukan."); const { data: existing } = await supabase.from("user_item_progress").select("id, repetitions").eq("user_id", userId).eq("item_type", input.itemType).eq("item_id", input.itemId).maybeSingle(); const due = new Date(); due.setDate(due.getDate() + 1); if (existing) { await supabase.from("user_item_progress").update({ status: "learning", repetitions: (existing.repetitions ?? 0) + 1, last_reviewed_at: new Date().toISOString(), due_at: due.toISOString() }).eq("id", existing.id); return; } await supabase.from("user_item_progress").insert({ user_id: userId, item_type: input.itemType, item_id: input.itemId, level: input.level, status: "learning", repetitions: 1, last_reviewed_at: new Date().toISOString(), due_at: due.toISOString() }); }
export async function fetchMyProgress() { const { data: userRes } = await supabase.auth.getUser(); const userId = userRes.user?.id; if (!userId) return null; const [progress, stats, attempts, answers] = await Promise.all([supabase.from("user_item_progress").select("item_type, level, status").eq("user_id", userId), supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle(), supabase.from("quiz_attempts").select("id, level, skill, score, correct_count, total_questions, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10), supabase.from("quiz_answers").select("is_correct, question:question_id (skill, prompt)").eq("user_id", userId).eq("is_correct", false).limit(50)]); return { progress: progress.data ?? [], stats: stats.data, attempts: attempts.data ?? [], weak: (answers.data ?? []) as Array<{ question: { skill: string; prompt: string } | null }> }; }
export async function fetchContentTotals() { const [kanji, vocab, grammar, reading, listening] = await Promise.all([supabase.from("kanji").select("id", { count: "exact", head: true }).eq("is_published", true), supabase.from("vocabulary").select("id", { count: "exact", head: true }).eq("is_published", true), supabase.from("grammar_points").select("id", { count: "exact", head: true }).eq("is_published", true), supabase.from("reading_passages").select("id", { count: "exact", head: true }).eq("is_published", true), supabase.from("listening_items").select("id", { count: "exact", head: true }).eq("is_published", true)]); return { kanji: kanji.count ?? 0, vocabulary: vocab.count ?? 0, grammar: grammar.count ?? 0, reading: reading.count ?? 0, listening: listening.count ?? 0 }; }
export async function fetchRewards() { const { data: userRes } = await supabase.auth.getUser(); const userId = userRes.user?.id; if (!userId) return null; const [profile, stats, referrals, grants] = await Promise.all([supabase.from("profiles").select("referral_code, display_name").eq("id", userId).maybeSingle(), supabase.from("user_stats").select("reward_points, total_xp, current_streak").eq("user_id", userId).maybeSingle(), supabase.from("referrals").select("id, code, status, points_awarded, created_at").eq("referrer_id", userId).order("created_at", { ascending: false }), supabase.from("reward_grants").select("id, reward_kind, premium_days, points_spent, created_at").eq("user_id", userId).order("created_at", { ascending: false })]); return { referralCode: profile.data?.referral_code ?? null, points: stats.data?.reward_points ?? 0, xp: stats.data?.total_xp ?? 0, streak: stats.data?.current_streak ?? 0, referrals: referrals.data ?? [], grants: grants.data ?? [] }; }
