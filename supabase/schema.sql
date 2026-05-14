-- Run in Supabase SQL editor
create extension if not exists "uuid-ossp";

create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  subject_name text not null,
  subject_code text not null,
  branch text not null,
  year int not null,
  semester int not null,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  unit_number int,
  resource_url text not null,
  resource_size bigint,
  resource_type text not null default 'pdf',
  exam_year int,
  exam_type text,
  is_premium boolean not null default false,
  uploaded_by text,
  created_at timestamptz not null default now()
);

alter table public.subjects enable row level security;
alter table public.resources enable row level security;

create policy "public can read subjects" on public.subjects for select using (true);
create policy "authenticated can manage subjects" on public.subjects for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public can read resources" on public.resources for select using (true);
create policy "authenticated can manage resources" on public.resources for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public)
values
  ('syllabus', 'syllabus', true),
  ('notes', 'notes', true),
  ('pyqs', 'pyqs', true),
  ('premium', 'premium', true),
  ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

create policy "public read storage" on storage.objects for select using (bucket_id in ('syllabus','notes','pyqs','premium','thumbnails'));
create policy "auth upload storage" on storage.objects for insert with check (auth.role() = 'authenticated' and bucket_id in ('syllabus','notes','pyqs','premium','thumbnails'));
create policy "auth update storage" on storage.objects for update using (auth.role() = 'authenticated' and bucket_id in ('syllabus','notes','pyqs','premium','thumbnails'));
create policy "auth delete storage" on storage.objects for delete using (auth.role() = 'authenticated' and bucket_id in ('syllabus','notes','pyqs','premium','thumbnails'));
