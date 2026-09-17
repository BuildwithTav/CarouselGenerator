-- Track how many times each media asset has been used in content, so the
-- dashboard can surface least-used files first and Tav isn't repeating the
-- same photos/videos over and over.
alter table public.brand_media
  add column if not exists use_count integer not null default 0,
  add column if not exists last_used_at timestamptz;
