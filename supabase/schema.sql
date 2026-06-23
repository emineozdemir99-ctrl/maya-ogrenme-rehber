-- Maya Öğrenme Rehberi veritabanı şeması
-- Supabase SQL Editor içinde tek seferde çalıştırın.
create extension if not exists pgcrypto;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_no text unique not null,
  full_name text not null,
  password text not null,
  class_name text not null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  started_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 10000),
  created_at timestamptz not null default now()
);

create index if not exists conversations_student_id_idx on public.conversations(student_id);
create index if not exists conversations_started_at_idx on public.conversations(started_at desc);
create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_created_at_idx on public.messages(created_at desc);

-- Tarayıcıdan doğrudan erişim kapalıdır. Yalnızca Netlify Functions içindeki
-- SUPABASE_SERVICE_ROLE_KEY bu tablolara erişir.
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Sunucu tarafındaki Netlify Functions bu rolü kullanır. Yeni Supabase
-- projelerinde tablo izinleri açıkça verilmelidir.
grant usage on schema public to service_role;
grant all privileges on table public.students to service_role;
grant all privileges on table public.teachers to service_role;
grant all privileges on table public.conversations to service_role;
grant all privileges on table public.messages to service_role;

-- Örnek hesaplar. Parolalar veritabanında bcrypt özeti olarak tutulur.
insert into public.students (student_no, full_name, password, class_name)
values
  ('101', 'Ece Yılmaz', crypt('1234', gen_salt('bf', 10)), '6-A'),
  ('102', 'Arda Demir', crypt('1234', gen_salt('bf', 10)), '6-A'),
  ('103', 'Defne Kaya', crypt('1234', gen_salt('bf', 10)), '7-B')
on conflict (student_no) do nothing;

insert into public.teachers (username, password)
values ('ogretmen', crypt('Maya2026!', gen_salt('bf', 10)))
on conflict (username) do nothing;
