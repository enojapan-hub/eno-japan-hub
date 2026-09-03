import { supabase } from "@/integrations/supabase/client";
import type { Level, RunnerQuestion } from "@/lib/learn-queries";

export type SimulationGroup = "vocabulary" | "grammar_reading" | "language_reading" | "listening";
export type SimulationQuestion = RunnerQuestion & { skill: string | null; questionType: string | null; audioUrl: string | null; transcriptJp: string | null };

const skillsByGroup: Record<SimulationGroup, string[]> = {
  vocabulary: ["vocabulary", "kanji"],
  grammar_reading: ["grammar", "reading"],
  language_reading: ["vocabulary", "kanji", "grammar", "reading"],
  listening: ["listening"],
};

const targets: Record<Level, Record<SimulationGroup, number>> = {
  N5: { vocabulary: 20, grammar_reading: 40, language_reading: 40, listening: 24 },
  N4: { vocabulary: 25, grammar_reading: 55, language_reading: 55, listening: 28 },
  N3: { vocabulary: 30, grammar_reading: 70, language_reading: 70, listening: 28 },
  N2: { vocabulary: 32, grammar_reading: 70, language_reading: 70, listening: 30 },
  N1: { vocabulary: 35, grammar_reading: 75, language_reading: 75, listening: 30 },
};

function normalize(rows: unknown[]): SimulationQuestion[] {
  return (rows as Array<Record<string, unknown>>).map((q) => {
    const listening = q.listening && typeof q.listening === "object" ? q.listening as Record<string, unknown> : null;
    return {
      id: String(q.id),
      prompt: String(q.prompt ?? ""),
      prompt_note: typeof q.prompt_note === "string" ? q.prompt_note : null,
      choices: Array.isArray(q.choices) ? q.choices.map(String) : [],
      correct_index: Number(q.correct_index),
      explanation_id: typeof q.explanation_id === "string" ? q.explanation_id : null,
      skill: typeof q.skill === "string" ? q.skill : null,
      questionType: typeof q.question_type === "string" ? q.question_type : null,
      audioUrl: listening && typeof listening.audio_url === "string" ? listening.audio_url : null,
      transcriptJp: listening && typeof listening.transcript_jp === "string" ? listening.transcript_jp : null,
    };
  });
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

async function fetchSkill(level: Level, skill: string, limit: number) {
  const result = await supabase
    .from("questions")
    .select("id, prompt, prompt_note, choices, correct_index, explanation_id, level, skill, question_type, listening:listening_id (audio_url, transcript_jp)")
    .eq("is_published", true)
    .eq("level", level)
    .eq("skill", skill)
    .limit(limit);
  if (result.error) throw new Error(result.error.message);
  return normalize(result.data ?? []);
}

export async function fetchSimulationQuestionSet(level: Level, group: SimulationGroup): Promise<SimulationQuestion[]> {
  const target = targets[level][group];
  const skills = skillsByGroup[group];

  if (group === "vocabulary") {
    const vocab = await fetchSkill(level, "vocabulary", Math.ceil(target * 0.8));
    const kanji = await fetchSkill(level, "kanji", Math.ceil(target * 0.2));
    return shuffle([...vocab, ...kanji]).slice(0, target);
  }

  if (group === "grammar_reading") {
    const grammarTarget = Math.ceil(target * 0.42);
    const readingTarget = target - grammarTarget;
    const grammar = await fetchSkill(level, "grammar", grammarTarget);
    const reading = await fetchSkill(level, "reading", readingTarget);
    return shuffle([...grammar, ...reading]).slice(0, target);
  }

  if (group === "language_reading") {
    const vocabularyTarget = Math.ceil(target * 0.28);
    const grammarTarget = Math.ceil(target * 0.24);
    const readingTarget = target - vocabularyTarget - grammarTarget;
    const [vocabulary, kanji, grammar, reading] = await Promise.all([
      fetchSkill(level, "vocabulary", vocabularyTarget),
      fetchSkill(level, "kanji", Math.max(2, Math.ceil(vocabularyTarget * 0.25))),
      fetchSkill(level, "grammar", grammarTarget),
      fetchSkill(level, "reading", readingTarget),
    ]);
    return shuffle([...vocabulary, ...kanji, ...grammar, ...reading]).slice(0, target);
  }

  const listening = await Promise.all(skills.map((skill) => fetchSkill(level, skill, target)));
  return shuffle(listening.flat()).slice(0, target);
}

export function getSimulationTarget(level: Level, group: SimulationGroup) {
  return targets[level][group];
}
