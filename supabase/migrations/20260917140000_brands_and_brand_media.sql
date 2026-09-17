-- Multi-brand content workspace: brand profiles + their raw media library.
-- Admin-only feature (Tav managing Build with Tav / HealthCode Performance /
-- SkyHighSoles), never exposed to paying Carousel Studio customers.
-- No RLS policies added, same reasoning as the RLS migration: these tables
-- are only ever touched by server routes using SUPABASE_SERVICE_KEY, which
-- bypasses RLS. Enabling RLS with no policies blocks anon/authenticated
-- access entirely, which is what we want since there's no legitimate
-- non-service-role access path to these tables.

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  voice text,
  pillars text,
  visual_theme jsonb default '{}'::jsonb,
  cta_rules text,
  daily_target integer default 1,
  automation_mode text not null default 'needs_review' check (automation_mode in ('needs_review','auto_ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brand_media (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  storage_path text not null,
  file_type text not null check (file_type in ('image','video')),
  original_filename text,
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  note text,
  uploaded_at timestamptz not null default now()
);

create index if not exists brand_media_brand_id_idx on public.brand_media(brand_id);

alter table public.brands enable row level security;
alter table public.brand_media enable row level security;

-- Private Storage bucket for original-quality brand media (photos/video/B-roll).
-- No public URLs; the app hands out short-lived signed URLs on request.
insert into storage.buckets (id, name, public)
values ('brand-media', 'brand-media', false)
on conflict (id) do nothing;
