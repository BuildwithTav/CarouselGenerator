-- Per-platform copy: Instagram keeps `caption`; TikTok gets its own caption
-- (with hashtags); YouTube gets a description with hashtags alongside the
-- existing title / tags / pinned comment.
alter table public.content_items
  add column if not exists tt_caption text,
  add column if not exists yt_description text;
