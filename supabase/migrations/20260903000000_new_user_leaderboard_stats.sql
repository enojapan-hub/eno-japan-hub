-- ENO JAPAN: keep every authenticated member represented in leaderboard stats.
-- Safe to rerun: all writes use upsert/conflict handling.

insert into public.user_learning_stats (user_id, display_name, avatar_url, jlpt_level, ui_language)
select p.id, p.display_name, p.avatar_url, p.target_level, p.ui_language
from public.profiles p
join auth.users u on u.id = p.id
on conflict (user_id) do update set
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url,
  jlpt_level = excluded.jlpt_level,
  ui_language = excluded.ui_language,
  updated_at = now();

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
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, 'member'), '@', 1),
    'ENO JAPAN Member'
  );
  v_avatar := coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture');
  v_code := upper(substr(replace(new.id::text, '-', ''), 1, 12));

  insert into public.profiles (id, display_name, avatar_url, target_level, ui_language, referral_code, role)
  values (new.id, v_name, v_avatar, 'N5', 'id', v_code, 'student')
  on conflict (id) do nothing;

  insert into public.user_stats (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_learning_stats (user_id, display_name, avatar_url, jlpt_level, ui_language)
  values (new.id, v_name, v_avatar, 'N5', 'id')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.sync_profile_to_learning_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_learning_stats (user_id, display_name, avatar_url, jlpt_level, ui_language)
  values (new.id, new.display_name, new.avatar_url, new.target_level, new.ui_language)
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
for each row execute function public.sync_profile_to_learning_stats();

-- Existing members are included immediately, while future members are provisioned by the auth trigger above.
