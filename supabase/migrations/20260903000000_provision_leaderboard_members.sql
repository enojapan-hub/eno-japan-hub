-- Provision every new ENO JAPAN member into persistent leaderboard stats.
-- This keeps leaderboard membership independent from whether the user has completed
-- their first lesson/quiz yet.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_avatar text;
  v_code text;
  v_level text;
  v_language text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, 'member'), '@', 1),
    'ENO JAPAN Member'
  );
  v_avatar := coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture');
  v_code := upper(substr(replace(new.id::text, '-', ''), 1, 12));
  v_level := 'N5';
  v_language := 'id';

  insert into public.profiles (id, display_name, avatar_url, target_level, ui_language, referral_code, role)
  values (new.id, v_name, v_avatar, v_level, v_language, v_code, 'student')
  on conflict (id) do nothing;

  insert into public.user_stats (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_learning_stats (
    user_id, display_name, avatar_url, jlpt_level, ui_language,
    xp, total_points, current_streak, longest_streak
  )
  values (new.id, v_name, v_avatar, v_level, v_language, 0, 0, 0, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill leaderboard membership for accounts created before this migration.
insert into public.user_learning_stats (
  user_id, display_name, avatar_url, jlpt_level, ui_language,
  xp, total_points, current_streak, longest_streak
)
select
  u.id,
  coalesce(p.display_name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(coalesce(u.email, 'member'), '@', 1), 'ENO JAPAN Member'),
  coalesce(p.avatar_url, u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture'),
  coalesce(p.target_level, 'N5'),
  coalesce(p.ui_language, 'id'),
  0, 0, 0, 0
from auth.users u
left join public.profiles p on p.id = u.id
on conflict (user_id) do nothing;

-- Keep leaderboard identity fields synchronized when a member edits their profile.
create or replace function public.sync_user_learning_stats_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_learning_stats (user_id, display_name, avatar_url, jlpt_level, ui_language)
  values (new.id, new.display_name, new.avatar_url, coalesce(new.target_level, 'N5'), coalesce(new.ui_language, 'id'))
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    jlpt_level = excluded.jlpt_level,
    ui_language = excluded.ui_language,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_sync_learning_stats on public.profiles;
create trigger profiles_sync_learning_stats
after insert or update of display_name, avatar_url, target_level, ui_language on public.profiles
for each row execute function public.sync_user_learning_stats_identity();

grant execute on function public.sync_user_learning_stats_identity() to authenticated;
