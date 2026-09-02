-- ENO JAPAN: expose leaderboard through a controlled security-definer function.
-- This avoids requiring public SELECT access to every user's private stats row.
create or replace function public.get_leaderboard(p_limit integer default 50)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  avatar_url text,
  jlpt_level text,
  total_points integer,
  xp integer,
  study_minutes integer,
  lessons_completed integer,
  quizzes_completed integer,
  correct_answers integer,
  total_answers integer,
  current_streak integer,
  longest_streak integer,
  last_activity_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    row_number() over(order by s.total_points desc, s.xp desc, s.last_activity_at asc nulls last) as rank,
    s.user_id,
    s.display_name,
    s.avatar_url,
    s.jlpt_level,
    s.total_points,
    s.xp,
    s.study_minutes,
    s.lessons_completed,
    s.quizzes_completed,
    s.correct_answers,
    s.total_answers,
    s.current_streak,
    s.longest_streak,
    s.last_activity_at
  from public.user_learning_stats s
  order by s.total_points desc, s.xp desc, s.last_activity_at asc nulls last
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;

grant execute on function public.get_leaderboard(integer) to authenticated;

-- Keep the underlying stats table private to each user.
revoke all on public.leaderboard from anon, authenticated;
