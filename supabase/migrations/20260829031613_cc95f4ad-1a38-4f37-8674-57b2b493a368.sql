-- =========================================================
-- ENO JAPAN — V1 Foundation: core learning domain
-- =========================================================

-- Enums -------------------------------------------------
create type public.jlpt_level as enum ('N5','N4','N3','N2','N1');
create type public.cefr_level as enum ('A1','A2','B1','B2','C1','C2');
create type public.content_source as enum ('eno_original','reference_derived');
create type public.skill_kind as enum ('kanji','vocabulary','grammar','reading','listening');
create type public.question_kind as enum ('multiple_choice','fill_blank','ordering','listening_choice');
create type public.item_kind as enum ('kanji','vocabulary','grammar');

-- Helper: moderator-or-admin ----------------------------
create or replace function public.is_content_editor(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id,'admin') or public.has_role(_user_id,'moderator')
$$;
revoke all on function public.is_content_editor(uuid) from public, anon;
grant execute on function public.is_content_editor(uuid) to authenticated, service_role;

-- Levels -------------------------------------------------
create table public.levels (
  code public.jlpt_level primary key,
  title text not null,
  description text,
  cefr_min public.cefr_level not null,
  cefr_max public.cefr_level not null,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.levels to anon, authenticated;
grant all on public.levels to service_role;
alter table public.levels enable row level security;
create policy "Levels readable by everyone" on public.levels for select to anon, authenticated using (true);
create policy "Editors manage levels" on public.levels for all to authenticated
  using (public.is_content_editor(auth.uid())) with check (public.is_content_editor(auth.uid()));
create trigger update_levels_updated_at before update on public.levels
  for each row execute function public.update_updated_at_column();

-- Kanji --------------------------------------------------
create table public.kanji (
  id uuid primary key default gen_random_uuid(),
  level public.jlpt_level not null references public.levels(code),
  character text not null unique,
  onyomi text[] not null default '{}',
  kunyomi text[] not null default '{}',
  meaning_id text not null,
  meaning_en text,
  stroke_count integer,
  examples jsonb not null default '[]'::jsonb,
  mnemonic text,
  source public.content_source not null default 'eno_original',
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.kanji to anon, authenticated;
grant insert, update, delete on public.kanji to authenticated;
grant all on public.kanji to service_role;
alter table public.kanji enable row level security;
create policy "Published kanji readable" on public.kanji for select to anon, authenticated using (is_published);
create policy "Editors read all kanji" on public.kanji for select to authenticated using (public.is_content_editor(auth.uid()));
create policy "Editors manage kanji" on public.kanji for all to authenticated
  using (public.is_content_editor(auth.uid())) with check (public.is_content_editor(auth.uid()));
create index kanji_level_idx on public.kanji(level, sort_order);
create trigger update_kanji_updated_at before update on public.kanji
  for each row execute function public.update_updated_at_column();

-- Vocabulary ---------------------------------------------
create table public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  level public.jlpt_level not null references public.levels(code),
  term text not null,
  reading text not null,
  romaji text,
  meaning_id text not null,
  meaning_en text,
  part_of_speech text,
  examples jsonb not null default '[]'::jsonb,
  source public.content_source not null default 'eno_original',
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (term, reading)
);
grant select on public.vocabulary to anon, authenticated;
grant insert, update, delete on public.vocabulary to authenticated;
grant all on public.vocabulary to service_role;
alter table public.vocabulary enable row level security;
create policy "Published vocabulary readable" on public.vocabulary for select to anon, authenticated using (is_published);
create policy "Editors read all vocabulary" on public.vocabulary for select to authenticated using (public.is_content_editor(auth.uid()));
create policy "Editors manage vocabulary" on public.vocabulary for all to authenticated
  using (public.is_content_editor(auth.uid())) with check (public.is_content_editor(auth.uid()));
create index vocabulary_level_idx on public.vocabulary(level, sort_order);
create trigger update_vocabulary_updated_at before update on public.vocabulary
  for each row execute function public.update_updated_at_column();

-- Grammar ------------------------------------------------
create table public.grammar_points (
  id uuid primary key default gen_random_uuid(),
  level public.jlpt_level not null references public.levels(code),
  pattern text not null unique,
  meaning_id text not null,
  meaning_en text,
  structure text,
  explanation_id text,
  examples jsonb not null default '[]'::jsonb,
  source public.content_source not null default 'eno_original',
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.grammar_points to anon, authenticated;
grant insert, update, delete on public.grammar_points to authenticated;
grant all on public.grammar_points to service_role;
alter table public.grammar_points enable row level security;
create policy "Published grammar readable" on public.grammar_points for select to anon, authenticated using (is_published);
create policy "Editors read all grammar" on public.grammar_points for select to authenticated using (public.is_content_editor(auth.uid()));
create policy "Editors manage grammar" on public.grammar_points for all to authenticated
  using (public.is_content_editor(auth.uid())) with check (public.is_content_editor(auth.uid()));
create index grammar_level_idx on public.grammar_points(level, sort_order);
create trigger update_grammar_updated_at before update on public.grammar_points
  for each row execute function public.update_updated_at_column();

-- Lessons ------------------------------------------------
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  level public.jlpt_level not null references public.levels(code),
  slug text not null unique,
  title text not null,
  summary text,
  skill public.skill_kind not null default 'vocabulary',
  estimated_minutes integer not null default 10,
  source public.content_source not null default 'eno_original',
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.lessons to anon, authenticated;
grant insert, update, delete on public.lessons to authenticated;
grant all on public.lessons to service_role;
alter table public.lessons enable row level security;
create policy "Published lessons readable" on public.lessons for select to anon, authenticated using (is_published);
create policy "Editors read all lessons" on public.lessons for select to authenticated using (public.is_content_editor(auth.uid()));
create policy "Editors manage lessons" on public.lessons for all to authenticated
  using (public.is_content_editor(auth.uid())) with check (public.is_content_editor(auth.uid()));
create trigger update_lessons_updated_at before update on public.lessons
  for each row execute function public.update_updated_at_column();

create table public.lesson_items (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  item_type public.item_kind not null,
  item_id uuid not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (lesson_id, item_type, item_id)
);
grant select on public.lesson_items to anon, authenticated;
grant insert, update, delete on public.lesson_items to authenticated;
grant all on public.lesson_items to service_role;
alter table public.lesson_items enable row level security;
create policy "Lesson items readable" on public.lesson_items for select to anon, authenticated using (
  exists (select 1 from public.lessons l where l.id = lesson_id and (l.is_published or public.is_content_editor(auth.uid())))
);
create policy "Editors manage lesson items" on public.lesson_items for all to authenticated
  using (public.is_content_editor(auth.uid())) with check (public.is_content_editor(auth.uid()));

-- Questions & quizzes ------------------------------------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  level public.jlpt_level not null references public.levels(code),
  skill public.skill_kind not null,
  kind public.question_kind not null default 'multiple_choice',
  prompt text not null,
  prompt_note text,
  choices jsonb not null default '[]'::jsonb,
  correct_index integer not null default 0,
  explanation_id text,
  item_type public.item_kind,
  item_id uuid,
  source public.content_source not null default 'eno_original',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.questions to anon, authenticated;
grant insert, update, delete on public.questions to authenticated;
grant all on public.questions to service_role;
alter table public.questions enable row level security;
create policy "Published questions readable" on public.questions for select to anon, authenticated using (is_published);
create policy "Editors read all questions" on public.questions for select to authenticated using (public.is_content_editor(auth.uid()));
create policy "Editors manage questions" on public.questions for all to authenticated
  using (public.is_content_editor(auth.uid())) with check (public.is_content_editor(auth.uid()));
create index questions_level_skill_idx on public.questions(level, skill);
create trigger update_questions_updated_at before update on public.questions
  for each row execute function public.update_updated_at_column();

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  level public.jlpt_level not null references public.levels(code),
  slug text not null unique,
  title text not null,
  description text,
  skill public.skill_kind not null default 'vocabulary',
  question_count integer not null default 0,
  time_limit_seconds integer,
  source public.content_source not null default 'eno_original',
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.quizzes to anon, authenticated;
grant insert, update, delete on public.quizzes to authenticated;
grant all on public.quizzes to service_role;
alter table public.quizzes enable row level security;
create policy "Published quizzes readable" on public.quizzes for select to anon, authenticated using (is_published);
create policy "Editors read all quizzes" on public.quizzes for select to authenticated using (public.is_content_editor(auth.uid()));
create policy "Editors manage quizzes" on public.quizzes for all to authenticated
  using (public.is_content_editor(auth.uid())) with check (public.is_content_editor(auth.uid()));
create trigger update_quizzes_updated_at before update on public.quizzes
  for each row execute function public.update_updated_at_column();

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  sort_order integer not null default 0,
  unique (quiz_id, question_id)
);
grant select on public.quiz_questions to anon, authenticated;
grant insert, update, delete on public.quiz_questions to authenticated;
grant all on public.quiz_questions to service_role;
alter table public.quiz_questions enable row level security;
create policy "Quiz questions readable" on public.quiz_questions for select to anon, authenticated using (
  exists (select 1 from public.quizzes q where q.id = quiz_id and (q.is_published or public.is_content_editor(auth.uid())))
);
create policy "Editors manage quiz questions" on public.quiz_questions for all to authenticated
  using (public.is_content_editor(auth.uid())) with check (public.is_content_editor(auth.uid()));

-- User progress (SRS-ready) -------------------------------
create table public.user_item_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type public.item_kind not null,
  item_id uuid not null,
  level public.jlpt_level,
  status text not null default 'learning',
  mastery numeric(4,3) not null default 0,
  repetitions integer not null default 0,
  lapses integer not null default 0,
  ease_factor numeric(4,2) not null default 2.50,
  interval_days integer not null default 0,
  due_at timestamptz,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);
grant select, insert, update, delete on public.user_item_progress to authenticated;
grant all on public.user_item_progress to service_role;
alter table public.user_item_progress enable row level security;
create policy "Users manage own item progress" on public.user_item_progress for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins view item progress" on public.user_item_progress for select to authenticated
  using (public.has_role(auth.uid(),'admin'));
create index user_item_progress_due_idx on public.user_item_progress(user_id, due_at);
create trigger update_user_item_progress_updated_at before update on public.user_item_progress
  for each row execute function public.update_updated_at_column();

create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level public.jlpt_level,
  skill public.skill_kind,
  lesson_id uuid references public.lessons(id) on delete set null,
  items_studied integer not null default 0,
  correct_count integer not null default 0,
  xp_earned integer not null default 0,
  duration_seconds integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.learning_sessions to authenticated;
grant all on public.learning_sessions to service_role;
alter table public.learning_sessions enable row level security;
create policy "Users manage own sessions" on public.learning_sessions for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins view sessions" on public.learning_sessions for select to authenticated
  using (public.has_role(auth.uid(),'admin'));
create index learning_sessions_user_idx on public.learning_sessions(user_id, started_at desc);
create trigger update_learning_sessions_updated_at before update on public.learning_sessions
  for each row execute function public.update_updated_at_column();

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid references public.quizzes(id) on delete set null,
  level public.jlpt_level,
  skill public.skill_kind,
  total_questions integer not null default 0,
  correct_count integer not null default 0,
  score numeric(5,2) not null default 0,
  xp_earned integer not null default 0,
  duration_seconds integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.quiz_attempts to authenticated;
grant all on public.quiz_attempts to service_role;
alter table public.quiz_attempts enable row level security;
create policy "Users manage own quiz attempts" on public.quiz_attempts for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins view quiz attempts" on public.quiz_attempts for select to authenticated
  using (public.has_role(auth.uid(),'admin'));
create trigger update_quiz_attempts_updated_at before update on public.quiz_attempts
  for each row execute function public.update_updated_at_column();

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid references public.questions(id) on delete set null,
  selected_index integer,
  is_correct boolean not null default false,
  time_spent_seconds integer not null default 0,
  answered_at timestamptz not null default now()
);
grant select, insert, update, delete on public.quiz_answers to authenticated;
grant all on public.quiz_answers to service_role;
alter table public.quiz_answers enable row level security;
create policy "Users manage own quiz answers" on public.quiz_answers for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins view quiz answers" on public.quiz_answers for select to authenticated
  using (public.has_role(auth.uid(),'admin'));
create index quiz_answers_attempt_idx on public.quiz_answers(attempt_id);

-- Stats, streak, XP ---------------------------------------
create table public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  estimated_cefr public.cefr_level,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.user_stats to authenticated;
grant all on public.user_stats to service_role;
alter table public.user_stats enable row level security;
create policy "Users manage own stats" on public.user_stats for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins view stats" on public.user_stats for select to authenticated
  using (public.has_role(auth.uid(),'admin'));
create trigger update_user_stats_updated_at before update on public.user_stats
  for each row execute function public.update_updated_at_column();

create table public.user_daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null default (now() at time zone 'utc')::date,
  kanji_learned integer not null default 0,
  vocab_learned integer not null default 0,
  grammar_learned integer not null default 0,
  reviews_done integer not null default 0,
  xp_earned integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, activity_date)
);
grant select, insert, update, delete on public.user_daily_activity to authenticated;
grant all on public.user_daily_activity to service_role;
alter table public.user_daily_activity enable row level security;
create policy "Users manage own daily activity" on public.user_daily_activity for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins view daily activity" on public.user_daily_activity for select to authenticated
  using (public.has_role(auth.uid(),'admin'));
create trigger update_user_daily_activity_updated_at before update on public.user_daily_activity
  for each row execute function public.update_updated_at_column();

-- Provision stats for new users ---------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict (user_id, role) do nothing;
  insert into public.user_stats (user_id) values (new.id) on conflict (user_id) do nothing;

  return new;
end;
$$;

insert into public.user_stats (user_id)
select id from auth.users on conflict (user_id) do nothing;

-- Seed: levels --------------------------------------------
insert into public.levels (code, title, description, cefr_min, cefr_max, sort_order) values
  ('N5','JLPT N5','Dasar: huruf, salam, kalimat sederhana.','A1','A1',1),
  ('N4','JLPT N4','Dasar lanjutan: percakapan sehari-hari.','A2','A2',2),
  ('N3','JLPT N3','Menengah: teks dan percakapan umum.','B1','B1',3),
  ('N2','JLPT N2','Menengah atas: berita dan teks kerja.','B2','B2',4),
  ('N1','JLPT N1','Mahir: teks abstrak dan akademis.','C1','C2',5);

-- Seed: small ENO-original sample content ------------------
insert into public.kanji (level, character, onyomi, kunyomi, meaning_id, meaning_en, stroke_count, examples, sort_order) values
  ('N5','日','{ニチ,ジツ}','{ひ,か}','hari, matahari','day, sun',4,'[{"jp":"日本","reading":"にほん","id":"Jepang"}]'::jsonb,1),
  ('N5','人','{ジン,ニン}','{ひと}','orang','person',2,'[{"jp":"一人","reading":"ひとり","id":"satu orang"}]'::jsonb,2),
  ('N5','山','{サン}','{やま}','gunung','mountain',3,'[{"jp":"火山","reading":"かざん","id":"gunung berapi"}]'::jsonb,3),
  ('N4','待','{タイ}','{ま}','menunggu','wait',9,'[{"jp":"待つ","reading":"まつ","id":"menunggu"}]'::jsonb,1),
  ('N3','økonomi'||'','{}','{}','placeholder','placeholder',0,'[]'::jsonb,99);

delete from public.kanji where meaning_id = 'placeholder';

insert into public.vocabulary (level, term, reading, romaji, meaning_id, meaning_en, part_of_speech, examples, sort_order) values
  ('N5','学生','がくせい','gakusei','pelajar','student','meishi','[{"jp":"私は学生です。","id":"Saya seorang pelajar."}]'::jsonb,1),
  ('N5','食べる','たべる','taberu','makan','to eat','doushi','[{"jp":"ご飯を食べる。","id":"Makan nasi."}]'::jsonb,2),
  ('N5','大きい','おおきい','ookii','besar','big','i-keiyoushi','[{"jp":"大きい家。","id":"Rumah besar."}]'::jsonb,3),
  ('N4','けれども','けれども','keredomo','tetapi','however','setsuzokushi','[]'::jsonb,1);

insert into public.grammar_points (level, pattern, meaning_id, meaning_en, structure, explanation_id, examples, sort_order) values
  ('N5','〜です','bentuk sopan untuk menyatakan sesuatu','polite copula','Kata benda + です','Dipakai untuk menyatakan identitas atau sifat secara sopan.','[{"jp":"これは本です。","id":"Ini adalah buku."}]'::jsonb,1),
  ('N5','〜ませんか','ajakan sopan','shall we?','Kata kerja (masu-stem) + ませんか','Mengajak lawan bicara melakukan sesuatu.','[{"jp":"一緒に行きませんか。","id":"Maukah pergi bersama?"}]'::jsonb,2),
  ('N4','〜ながら','sambil melakukan dua hal','while doing','Kata kerja (masu-stem) + ながら','Dua aktivitas dilakukan bersamaan oleh subjek yang sama.','[{"jp":"音楽を聞きながら勉強する。","id":"Belajar sambil mendengarkan musik."}]'::jsonb,1);

-- Seed: lesson --------------------------------------------
insert into public.lessons (level, slug, title, summary, skill, estimated_minutes, sort_order)
values ('N5','n5-dasar-1','N5 Dasar 1 — Perkenalan','Contoh pelajaran ENO JAPAN: kanji, kotoba, dan bunpo dasar.','vocabulary',10,1);

insert into public.lesson_items (lesson_id, item_type, item_id, sort_order)
select l.id, 'kanji'::public.item_kind, k.id, k.sort_order
from public.lessons l, public.kanji k
where l.slug = 'n5-dasar-1' and k.level = 'N5';

insert into public.lesson_items (lesson_id, item_type, item_id, sort_order)
select l.id, 'vocabulary'::public.item_kind, v.id, v.sort_order
from public.lessons l, public.vocabulary v
where l.slug = 'n5-dasar-1' and v.level = 'N5';

insert into public.lesson_items (lesson_id, item_type, item_id, sort_order)
select l.id, 'grammar'::public.item_kind, g.id, g.sort_order
from public.lessons l, public.grammar_points g
where l.slug = 'n5-dasar-1' and g.level = 'N5';

-- Seed: quiz ----------------------------------------------
insert into public.questions (level, skill, kind, prompt, choices, correct_index, explanation_id) values
  ('N5','kanji','multiple_choice','Bagaimana cara baca 「山」?','["やま","かわ","そら","うみ"]'::jsonb,0,'「山」 dibaca やま dan berarti gunung.'),
  ('N5','vocabulary','multiple_choice','Apa arti 「学生」?','["pelajar","guru","dokter","pegawai"]'::jsonb,0,'学生 (がくせい) berarti pelajar.'),
  ('N5','grammar','multiple_choice','Lengkapi: 一緒に行き____。','["ませんか","ますか","ました","ません"]'::jsonb,0,'〜ませんか dipakai untuk mengajak.');

insert into public.quizzes (level, slug, title, description, skill, question_count, time_limit_seconds, sort_order)
values ('N5','n5-latihan-dasar','Latihan Dasar N5','Contoh kuis campuran ENO JAPAN untuk N5.','vocabulary',3,300,1);

insert into public.quiz_questions (quiz_id, question_id, sort_order)
select q.id, qs.id, row_number() over (order by qs.created_at)
from public.quizzes q, public.questions qs
where q.slug = 'n5-latihan-dasar' and qs.level = 'N5';