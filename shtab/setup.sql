-- Штаб: настройка базы. Вставь целиком в Supabase → SQL Editor → Run. Можно запускать повторно.

-- 1. Таблица: все записи штаба (проекты, задачи, спорт, настроение, заметки…)
create table if not exists public.docs (
  user_id    uuid not null references auth.users(id) on delete cascade default auth.uid(),
  col        text not null,
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, col, id)
);

-- 2. Каждый видит и меняет только свои записи
alter table public.docs enable row level security;
drop policy if exists "docs: own rows" on public.docs;
create policy "docs: own rows" on public.docs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 3. Мгновенная синхронизация между телефоном и компьютером
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- 4. Хранилище файлов (стратегии, PDF, картинки): у каждого своя папка
insert into storage.buckets (id, name, public, file_size_limit)
values ('files', 'files', false, 20971520)
on conflict (id) do nothing;

drop policy if exists "files: read own" on storage.objects;
drop policy if exists "files: add own" on storage.objects;
drop policy if exists "files: delete own" on storage.objects;
create policy "files: read own" on storage.objects for select to authenticated
  using (bucket_id = 'files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "files: add own" on storage.objects for insert to authenticated
  with check (bucket_id = 'files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "files: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'files' and (storage.foldername(name))[1] = (select auth.uid())::text);
