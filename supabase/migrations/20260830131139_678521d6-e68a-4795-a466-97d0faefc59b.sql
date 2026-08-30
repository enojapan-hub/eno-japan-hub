
-- ============ enums ============
alter type public.app_role add value if not exists 'teacher';
alter type public.app_role add value if not exists 'owner';

create type public.plan_kind as enum ('free','premium_monthly','premium_yearly','lifetime');
create type public.entitlement_status as enum ('active','expired','cancelled','pending');
create type public.referral_status as enum ('pending','registered','verified','active','qualified','reward_granted');

-- ============ kanji relations ============
create table public.kanji_relations (
  id uuid primary key default gen_random_uuid(),
  kanji_id uuid not null references public.kanji(id) on delete cascade,
  related_kanji_id uuid not null references public.kanji(id) on delete cascade,
  note_id text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (kanji_id, related_kanji_id),
  check (kanji_id <> related_kanji_id)
);
grant select on public.kanji_relations to anon, authenticated;
grant all on public.kanji_relations to service_role;
alter table public.kanji_relations enable row level security;
create policy "kanji relations readable" on public.kanji_relations for select using (true);
create policy "editors manage kanji relations" on public.kanji_relations for all to authenticated
  using (public.is_content_editor(auth.uid())) with check (public.is_content_editor(auth.uid()));

-- ============ reading passages ============
create table public.reading_passages (
  id uuid primary key default gen_random_uuid(),
  level public.jlpt_level not null references public.levels(code),
  title text not null,
  body_jp text not null,
  translation_id text,
  estimated_minutes integer not null default 4,
  source public.content_source not null default 'eno_original',
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.reading_passages to anon, authenticated;
grant all on public.reading_passages to service_role;
alter table public.reading_passages enable row level security;
create policy "published passages readable" on public.reading_passages for select using (is_published);
create policy "editors manage passages" on public.reading_passages for all to authenticated
  using (public.is_content_editor(auth.uid())) with check (public.is_content_editor(auth.uid()));
create trigger update_reading_passages_updated_at before update on public.reading_passages
  for each row execute function public.update_updated_at_column();

-- ============ listening items ============
create table public.listening_items (
  id uuid primary key default gen_random_uuid(),
  level public.jlpt_level not null references public.levels(code),
  title text not null,
  audio_url text,
  transcript_jp text not null,
  transcript_id text,
  duration_seconds integer not null default 30,
  source public.content_source not null default 'eno_original',
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.listening_items to anon, authenticated;
grant all on public.listening_items to service_role;
alter table public.listening_items enable row level security;
create policy "published listening readable" on public.listening_items for select using (is_published);
create policy "editors manage listening" on public.listening_items for all to authenticated
  using (public.is_content_editor(auth.uid())) with check (public.is_content_editor(auth.uid()));
create trigger update_listening_items_updated_at before update on public.listening_items
  for each row execute function public.update_updated_at_column();

alter table public.questions add column passage_id uuid references public.reading_passages(id) on delete cascade;
alter table public.questions add column listening_id uuid references public.listening_items(id) on delete cascade;

-- ============ exam plan ============
alter table public.user_settings add column exam_date date;
alter table public.user_settings add column exam_level public.jlpt_level;

-- ============ entitlements ============
create table public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan public.plan_kind not null default 'free',
  status public.entitlement_status not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  source text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.user_entitlements to authenticated;
grant all on public.user_entitlements to service_role;
alter table public.user_entitlements enable row level security;
create policy "own entitlement" on public.user_entitlements for select to authenticated using (auth.uid() = user_id);
create policy "admins read entitlements" on public.user_entitlements for select to authenticated
  using (public.has_role(auth.uid(),'admin'));
create trigger update_user_entitlements_updated_at before update on public.user_entitlements
  for each row execute function public.update_updated_at_column();

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan public.plan_kind not null,
  amount_cents integer not null default 0,
  currency text not null default 'IDR',
  provider text not null default 'demo',
  provider_ref text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
grant select on public.payment_events to authenticated;
grant all on public.payment_events to service_role;
alter table public.payment_events enable row level security;
create policy "own payment events" on public.payment_events for select to authenticated using (auth.uid() = user_id);

create or replace function public.is_premium(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_entitlements
    where user_id = _user_id
      and status = 'active'
      and plan <> 'free'
      and (expires_at is null or expires_at > now())
  )
$$;

-- ============ referral & rewards ============
alter table public.profiles add column referral_code text unique;
alter table public.user_stats add column reward_points integer not null default 0;

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid references auth.users(id) on delete set null,
  code text not null,
  status public.referral_status not null default 'pending',
  points_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.referrals to authenticated;
grant all on public.referrals to service_role;
alter table public.referrals enable row level security;
create policy "own referrals" on public.referrals for select to authenticated
  using (auth.uid() = referrer_id or auth.uid() = referred_user_id);
create trigger update_referrals_updated_at before update on public.referrals
  for each row execute function public.update_updated_at_column();

create table public.reward_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_kind text not null,
  premium_days integer,
  points_spent integer not null default 0,
  note text,
  created_at timestamptz not null default now()
);
grant select on public.reward_grants to authenticated;
grant all on public.reward_grants to service_role;
alter table public.reward_grants enable row level security;
create policy "own reward grants" on public.reward_grants for select to authenticated using (auth.uid() = user_id);

-- ============ teacher profile foundation ============
create table public.teacher_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  headline text,
  bio text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.teacher_profiles to anon, authenticated;
grant insert, update on public.teacher_profiles to authenticated;
grant all on public.teacher_profiles to service_role;
alter table public.teacher_profiles enable row level security;
create policy "teacher profiles readable" on public.teacher_profiles for select using (true);
create policy "own teacher profile insert" on public.teacher_profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "own teacher profile update" on public.teacher_profiles for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger update_teacher_profiles_updated_at before update on public.teacher_profiles
  for each row execute function public.update_updated_at_column();

-- ============ provisioning trigger update ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    'ENO' || upper(substr(replace(new.id::text,'-',''), 1, 6))
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict (user_id, role) do nothing;
  insert into public.user_stats (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.user_entitlements (user_id) values (new.id) on conflict (user_id) do nothing;

  return new;
end;
$$;

update public.profiles
set referral_code = 'ENO' || upper(substr(replace(id::text,'-',''), 1, 6))
where referral_code is null;

insert into public.user_entitlements (user_id)
select id from auth.users on conflict (user_id) do nothing;
