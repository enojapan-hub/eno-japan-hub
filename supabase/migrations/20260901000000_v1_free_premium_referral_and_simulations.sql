-- ENO JAPAN V1 backup of production migration 2026-09-01
-- Applied to Supabase project upxtqsvgppvqpbrjoitz.

alter table public.profiles add column if not exists plan text not null default 'free' check (plan in ('free','premium','lifetime'));
alter table public.profiles add column if not exists premium_until timestamptz;
alter table public.profiles add column if not exists referral_points integer not null default 0 check (referral_points >= 0);
alter table public.profiles add column if not exists focus_mode boolean not null default false;

create table if not exists public.referral_events (
 id uuid primary key default gen_random_uuid(), referrer_id uuid not null references auth.users(id) on delete cascade,
 referred_user_id uuid references auth.users(id) on delete set null, referral_code text not null,
 event_type text not null default 'signup' check (event_type in ('signup','share','conversion')),
 points_awarded integer not null default 0 check (points_awarded >= 0), created_at timestamptz not null default now(),
 unique(referrer_id,referred_user_id,event_type)
);
alter table public.referral_events enable row level security;

create or replace function public.is_premium(p_user_id uuid default auth.uid()) returns boolean language sql stable security definer set search_path=public as $$
select exists(select 1 from public.profiles p where p.id=p_user_id and (p.plan in ('premium','lifetime') or p.premium_until>now())); $$;

create or replace function public.award_referral_signup(p_code text) returns integer language plpgsql security definer set search_path=public as $$
declare v_referrer uuid; v_points integer:=100;
begin
 if auth.uid() is null then raise exception 'not_authenticated'; end if;
 select id into v_referrer from public.profiles where upper(referral_code)=upper(trim(p_code)) and id<>auth.uid();
 if v_referrer is null then return 0; end if;
 insert into public.referral_events(referrer_id,referred_user_id,referral_code,event_type,points_awarded) values(v_referrer,auth.uid(),upper(trim(p_code)),'signup',v_points) on conflict do nothing;
 if found then update public.profiles set referral_points=referral_points+v_points,updated_at=now() where id=v_referrer; return v_points; end if;
 return 0;
end; $$;

create or replace function public.redeem_referral_points(p_points integer default 1000) returns integer language plpgsql security definer set search_path=public as $$
declare v_days integer:=7; v_balance integer;
begin
 if auth.uid() is null then raise exception 'not_authenticated'; end if;
 if p_points<>1000 then raise exception 'invalid_points'; end if;
 select referral_points into v_balance from public.profiles where id=auth.uid() for update;
 if coalesce(v_balance,0)<p_points then return 0; end if;
 update public.profiles set referral_points=referral_points-p_points,plan=case when plan='lifetime' then plan else 'premium' end,premium_until=case when plan='lifetime' then premium_until else greatest(coalesce(premium_until,now()),now())+make_interval(days=>v_days) end,updated_at=now() where id=auth.uid();
 insert into public.reward_grants(user_id,reward_kind,premium_days,points_spent,metadata) values(auth.uid(),'referral_premium',v_days,p_points,jsonb_build_object('source','referral_points'));
 return v_days;
end; $$;

update public.profiles set plan='free' where plan is null;
update public.kanji set is_published=true where is_published=false;
update public.vocabulary set is_published=true where is_published=false;
update public.grammar_points set is_published=true where is_published=false;
update public.reading_passages set is_published=true where is_published=false;
update public.questions set is_published=true where is_published=false;

insert into public.quizzes(slug,title,description,level,question_count,time_limit_seconds,sort_order,is_published)
select 'simulasi-jlpt-'||l,'Simulasi JLPT '||l,'Simulasi latihan V1 berbasis bank soal ENO JAPAN untuk level '||l||'.',l::jlpt_level,50,3600,case l when 'N5' then 1 when 'N4' then 2 when 'N3' then 3 when 'N2' then 4 else 5 end,true
from unnest(array['N5','N4','N3','N2','N1']) l on conflict(slug) do update set is_published=true;
