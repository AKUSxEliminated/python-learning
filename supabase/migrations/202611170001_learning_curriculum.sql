create table if not exists public.learning_levels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  rank smallint not null unique check (rank > 0),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  learning_level_id uuid not null references public.learning_levels(id) on delete cascade,
  slug text not null unique,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  slug text not null,
  title text not null,
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug),
  unique (course_id, position)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  slug text not null,
  title text not null,
  position integer not null check (position > 0),
  estimated_minutes integer not null check (estimated_minutes > 0),
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, slug),
  unique (chapter_id, position),
  check (
    content ? 'objectives' and content ? 'theory' and content ? 'code'
    and content ? 'explanation' and content ? 'output' and content ? 'mistakes'
    and content ? 'summary' and content ? 'exercises'
  )
);

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null check (status in ('in_progress', 'completed')),
  started_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id),
  check ((status = 'completed') = (completed_at is not null))
);

create index if not exists chapters_course_position_idx on public.chapters(course_id, position);
create index if not exists lessons_chapter_position_idx on public.lessons(chapter_id, position);
create index if not exists lesson_progress_user_updated_idx on public.lesson_progress(user_id, updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists learning_levels_set_updated_at on public.learning_levels;
create trigger learning_levels_set_updated_at before update on public.learning_levels
  for each row execute function public.set_updated_at();
drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at before update on public.courses
  for each row execute function public.set_updated_at();
drop trigger if exists chapters_set_updated_at on public.chapters;
create trigger chapters_set_updated_at before update on public.chapters
  for each row execute function public.set_updated_at();
drop trigger if exists lessons_set_updated_at on public.lessons;
create trigger lessons_set_updated_at before update on public.lessons
  for each row execute function public.set_updated_at();
drop trigger if exists lesson_progress_set_updated_at on public.lesson_progress;
create trigger lesson_progress_set_updated_at before update on public.lesson_progress
  for each row execute function public.set_updated_at();

alter table public.learning_levels enable row level security;
alter table public.courses enable row level security;
alter table public.chapters enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;

grant select on public.learning_levels, public.courses, public.chapters, public.lessons to anon, authenticated;
grant insert, update, delete on public.learning_levels, public.courses, public.chapters, public.lessons to authenticated;
grant select, insert, update, delete on public.lesson_progress to authenticated;

create policy "curriculum is readable by everyone" on public.learning_levels
  for select to anon, authenticated using (true);
create policy "admins manage learning levels" on public.learning_levels
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "courses are readable by everyone" on public.courses
  for select to anon, authenticated using (true);
create policy "admins manage courses" on public.courses
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "chapters are readable by everyone" on public.chapters
  for select to anon, authenticated using (true);
create policy "admins manage chapters" on public.chapters
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "lessons are readable by everyone" on public.lessons
  for select to anon, authenticated using (true);
create policy "admins manage lessons" on public.lessons
  for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "users read their own lesson progress" on public.lesson_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "users create their own lesson progress" on public.lesson_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users update their own lesson progress" on public.lesson_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users delete their own lesson progress" on public.lesson_progress
  for delete to authenticated using ((select auth.uid()) = user_id);
