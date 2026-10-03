-- X (Twitter) caption and posted-tracking columns — these already exist live
-- (added when Twitter was wired up as a platform) but never got a checked-in
-- migration file until now.
alter table public.content_items
  add column if not exists tw_caption text,
  add column if not exists posted_twitter_at timestamptz;
