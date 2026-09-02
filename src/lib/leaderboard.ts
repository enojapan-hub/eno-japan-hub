import { supabase } from "@/integrations/supabase/client";

export type LeaderboardUser = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  level: string;
  points: number;
  xp: number;
  streak: number;
};

export async function fetchLeaderboard(limit = 10): Promise<LeaderboardUser[]> {
  const { data: stats, error } = await supabase
    .from("user_stats")
    .select("user_id, total_xp, reward_points, current_streak")
    .order("total_xp", { ascending: false })
    .limit(limit);

  if (error || !stats?.length) return [];

  const ids = stats.map((row) => row.user_id).filter(Boolean);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, target_level")
    .in("id", ids);

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return stats.map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      userId: row.user_id,
      displayName: profile?.display_name?.trim() || "Pengguna enonihongo",
      avatarUrl: profile?.avatar_url ?? null,
      level: profile?.target_level || "N5",
      points: Number(row.reward_points ?? 0),
      xp: Number(row.total_xp ?? 0),
      streak: Number(row.current_streak ?? 0),
    };
  });
}
