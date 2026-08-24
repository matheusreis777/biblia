-- ─────────────────────────────────────────────────────────────────────────────
-- Perfil, última leitura e versículos favoritos, um registro por usuário do
-- auth.users. Tudo protegido por RLS: cada pessoa só enxerga as próprias linhas.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  language text not null default 'pt-BR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Preferências da conta. Uma linha por usuário, criada por trigger no cadastro.';

-- Última leitura: uma linha por usuário, sobrescrita a cada capítulo aberto.
create table if not exists public.reading_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  book_id text not null,
  chapter integer not null check (chapter > 0),
  updated_at timestamptz not null default now()
);

comment on table public.reading_progress is 'Último capítulo aberto por usuário, para retomar a leitura em qualquer dispositivo.';

create table if not exists public.favorite_verses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id text not null,
  chapter integer not null check (chapter > 0),
  verse integer not null check (verse > 0),
  text text,
  created_at timestamptz not null default now(),
  unique (user_id, book_id, chapter, verse)
);

comment on table public.favorite_verses is 'Versículos destacados pelo usuário.';

create index if not exists favorite_verses_user_chapter_idx
  on public.favorite_verses (user_id, book_id, chapter);

-- ── updated_at automático ────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists reading_progress_set_updated_at on public.reading_progress;
create trigger reading_progress_set_updated_at
  before update on public.reading_progress
  for each row execute function public.set_updated_at();

-- ── Perfil criado junto com a conta ──────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, language)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'language', ''), 'pt-BR')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.reading_progress enable row level security;
alter table public.favorite_verses enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using ((select auth.uid()) = id);

drop policy if exists "reading_progress_select_own" on public.reading_progress;
create policy "reading_progress_select_own" on public.reading_progress
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "reading_progress_insert_own" on public.reading_progress;
create policy "reading_progress_insert_own" on public.reading_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "reading_progress_update_own" on public.reading_progress;
create policy "reading_progress_update_own" on public.reading_progress
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "reading_progress_delete_own" on public.reading_progress;
create policy "reading_progress_delete_own" on public.reading_progress
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "favorite_verses_select_own" on public.favorite_verses;
create policy "favorite_verses_select_own" on public.favorite_verses
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "favorite_verses_insert_own" on public.favorite_verses;
create policy "favorite_verses_insert_own" on public.favorite_verses
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "favorite_verses_update_own" on public.favorite_verses;
create policy "favorite_verses_update_own" on public.favorite_verses
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "favorite_verses_delete_own" on public.favorite_verses;
create policy "favorite_verses_delete_own" on public.favorite_verses
  for delete to authenticated using ((select auth.uid()) = user_id);
