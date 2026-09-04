import { supabase } from "@/integrations/supabase/client";

export type AdaptiveTaskType = "new_kanji" | "new_vocabulary" | "new_grammar" | "review" | "quiz" | "reading" | "listening";
export type AdaptiveTask = {
  id: string;
  task_type: AdaptiveTaskType;
  target_count: number;
  completed_count: number;
  priority: number;
  reason: string | null;
  metadata: Record<string, unknown> | null;
};
export type AdaptivePlan = {
  active: boolean;
  targetLevel: string | null;
  targetDate: string | null;
  daysLeft: number | null;
  tasks: AdaptiveTask[];
  target: number;
  completed: number;
};

export async function fetchAdaptivePlan(): Promise<AdaptivePlan> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return { active: false, targetLevel: null, targetDate: null, daysLeft: null, tasks: [], target: 0, completed: 0 };

  const client = supabase as any;
  await client.rpc("generate_daily_study_tasks", {});
  await client.rpc("sync_daily_study_task_progress", {});

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: plans }, { data: tasks }] = await Promise.all([
    client.from("study_plans").select("id,target_level,target_date,status").eq("user_id", auth.user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1),
    client.from("daily_study_tasks").select("id,task_type,target_count,completed_count,priority,reason,metadata").eq("user_id", auth.user.id).eq("study_date", today).order("priority", { ascending: false }),
  ]);

  const plan = plans?.[0];
  if (!plan) return { active: false, targetLevel: null, targetDate: null, daysLeft: null, tasks: [], target: 0, completed: 0 };

  const taskRows = (tasks ?? []) as AdaptiveTask[];
  const target = taskRows.reduce((sum, task) => sum + Number(task.target_count || 0), 0);
  const completed = taskRows.reduce((sum, task) => sum + Math.min(Number(task.completed_count || 0), Number(task.target_count || 0)), 0);
  const targetMs = new Date(`${plan.target_date}T00:00:00`).getTime();
  const todayMs = new Date(`${today}T00:00:00`).getTime();
  const daysLeft = Math.max(0, Math.ceil((targetMs - todayMs) / 86400000));

  return {
    active: true,
    targetLevel: plan.target_level ?? null,
    targetDate: plan.target_date ?? null,
    daysLeft,
    tasks: taskRows,
    target,
    completed,
  };
}

export const adaptiveTaskLabels: Record<AdaptiveTaskType, string> = {
  new_kanji: "Kanji baru",
  new_vocabulary: "Kotoba baru",
  new_grammar: "Bunpō baru",
  review: "Review",
  quiz: "Kuis",
  reading: "Dokkai",
  listening: "Listening",
};
