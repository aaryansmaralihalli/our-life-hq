-- ============================================================
--  Our Life HQ — full database schema
--  Run this ONCE in Supabase: SQL Editor → New query → paste → Run.
--  Safe to re-run (idempotent). It replaces the old bucket_items table.
-- ============================================================

-- The old single-file app made a bucket_items table with the wrong shape.
-- Drop it so we can recreate it for the full app.
drop table if exists public.bucket_items cascade;

-- 1. Profiles (the two of you)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Me',
  dob date,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  body_fat numeric,
  neck numeric,
  waist numeric,
  hip numeric,
  activity_level text default 'moderate',
  goal text default 'maintain',
  color text default '#c75b39',
  created_at timestamptz not null default now()
);

-- 2. Bucket list (with photo memories)
create table if not exists public.bucket_items (
  id uuid primary key default gen_random_uuid(),
  dream text not null,
  category text,
  who text,
  status text default 'Idea',
  target_date date,
  done_date date,
  excitement int default 2,
  notes text default '',
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 3. Food (with photos)
create table if not exists public.food_spots (
  id uuid primary key default gen_random_uuid(),
  place text not null,
  cuisine text,
  city text,
  status text default 'Want to try',
  visited_on date,
  rating int,
  cost_for_two numeric,
  who text,
  notes text default '',
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 4. Travel destinations (with photos)
create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  region text,
  status text default 'Wishlist',
  lat double precision,
  lng double precision,
  visited_on date,
  trip_days int,
  budget numeric,
  who text,
  notes text default '',
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 5. Gym entries (one row per exercise per session)
create table if not exists public.gym_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  who text,
  session text,
  muscles jsonb not null default '[]'::jsonb,
  exercise text not null,
  sets numeric,
  reps numeric,
  weight numeric,
  rpe numeric,
  duration numeric,
  distance numeric,
  volume numeric,
  e1rm numeric,
  created_at timestamptz not null default now()
);

-- 6. Health weigh-ins
create table if not exists public.health_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  who text,
  weight numeric not null,
  body_fat numeric,
  waist numeric,
  neck numeric,
  hip numeric,
  resting_hr numeric,
  notes text default '',
  created_at timestamptz not null default now()
);

-- If you ran an earlier version of this schema, add the photos columns:
alter table public.bucket_items add column if not exists photos jsonb not null default '[]'::jsonb;
alter table public.food_spots  add column if not exists photos jsonb not null default '[]'::jsonb;
alter table public.destinations add column if not exists photos jsonb not null default '[]'::jsonb;

-- ============================================================
--  Row-Level Security — both signed-in accounts share all data.
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['profiles','bucket_items','food_spots','destinations','gym_entries','health_entries']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "shared authenticated access" on public.%I;', t);
    execute format(
      'create policy "shared authenticated access" on public.%I for all to authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- ============================================================
--  Storage bucket for photos (private; signed URLs in the app)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "photos read"   on storage.objects;
drop policy if exists "photos insert" on storage.objects;
drop policy if exists "photos delete" on storage.objects;
create policy "photos read"   on storage.objects for select to authenticated using (bucket_id = 'photos');
create policy "photos insert" on storage.objects for insert to authenticated with check (bucket_id = 'photos');
create policy "photos delete" on storage.objects for delete to authenticated using (bucket_id = 'photos');
