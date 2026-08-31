create table if not exists public.social_follow_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram','tiktok','youtube','facebook')),
  created_at timestamptz not null default now(),
  unique(user_id, platform)
);

alter table public.social_follow_claims enable row level security;
create policy "social follow claims own select" on public.social_follow_claims for select to authenticated using ((select auth.uid()) = user_id);
create policy "social follow claims own insert" on public.social_follow_claims for insert to authenticated with check ((select auth.uid()) = user_id);

create index if not exists idx_social_follow_claims_user on public.social_follow_claims(user_id);
create index if not exists idx_kanji_level_published_order on public.kanji(level, is_published, sort_order);
create index if not exists idx_vocabulary_level_published_order on public.vocabulary(level, is_published, sort_order);
create index if not exists idx_grammar_level_published_order on public.grammar_points(level, is_published, sort_order);
create index if not exists idx_kanji_relations_related on public.kanji_relations(related_kanji_id);
create index if not exists idx_questions_grammar on public.questions(grammar_id);
create index if not exists idx_questions_kanji on public.questions(kanji_id);
create index if not exists idx_questions_vocabulary on public.questions(vocabulary_id);
create index if not exists idx_questions_passage on public.questions(passage_id);
create index if not exists idx_questions_listening on public.questions(listening_id);
create index if not exists idx_quiz_questions_question on public.quiz_questions(question_id);
create index if not exists idx_quiz_answers_attempt on public.quiz_answers(attempt_id);
create index if not exists idx_quiz_answers_question on public.quiz_answers(question_id);
create index if not exists idx_quiz_attempts_quiz on public.quiz_attempts(quiz_id);
create index if not exists idx_referrals_referred on public.referrals(referred_user_id);
create index if not exists idx_reward_grants_user on public.reward_grants(user_id);

drop index if exists public.questions_level_skill_idx;

create or replace function public.claim_social_follow_reward(p_platform text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  reward integer := 14;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if p_platform not in ('instagram','tiktok','youtube','facebook') then raise exception 'Unsupported platform'; end if;

  insert into public.social_follow_claims(user_id, platform)
  values(uid, p_platform)
  on conflict (user_id, platform) do nothing;

  if not found then return 0; end if;

  insert into public.reward_grants(user_id, reward_kind, premium_days, points_spent, metadata)
  values(uid, 'social_follow', reward, 0, jsonb_build_object('platform', p_platform));

  update public.profiles
  set plan = 'premium',
      premium_until = greatest(coalesce(premium_until, now()), now()) + make_interval(days => reward),
      updated_at = now()
  where id = uid;

  return reward;
end;
$$;

revoke all on function public.claim_social_follow_reward(text) from public, anon;
grant execute on function public.claim_social_follow_reward(text) to authenticated;
