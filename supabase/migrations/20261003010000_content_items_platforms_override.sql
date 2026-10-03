-- Per-item platform override. Most content targets every platform the brand
-- has enabled (the existing default, via visual_theme.platforms). The new X
-- content engine generates posts that only ever go to X — with no override,
-- they'd sit "remaining" on Instagram/TikTok/YouTube forever, since nothing
-- ever posts the (nonexistent) Instagram version of an X-only post.
alter table public.content_items
  add column if not exists platforms text[];
