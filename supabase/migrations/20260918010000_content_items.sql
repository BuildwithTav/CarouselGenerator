-- Content items: one record per piece of content, from idea through generated
-- slides + per-platform packages to posted. Drives the dashboard's Today queue.
-- RLS enabled with no policies (service-role-only access), same as brands.

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  idea text not null,
  pillar text,
  status text not null default 'draft' check (status in ('draft','ready','posted')),
  scheduled_for date not null default current_date,
  slides jsonb not null default '[]'::jsonb,
  slide_paths text[] not null default '{}',
  caption text,
  hashtags text[] not null default '{}',
  yt_title text,
  yt_tags text[] not null default '{}',
  yt_pinned_comment text,
  yt_category text,
  media_id uuid references public.brand_media(id) on delete set null,
  posted_instagram_at timestamptz,
  posted_tiktok_at timestamptz,
  posted_youtube_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_queue_idx
  on public.content_items(brand_id, status, scheduled_for);

alter table public.content_items enable row level security;
