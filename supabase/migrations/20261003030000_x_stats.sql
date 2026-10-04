-- Tracks the actual X post ID per item (needed to look up its public metrics
-- later) and a lightweight per-brand follower-count snapshot for the X
-- section's day-over-day delta — refreshed on demand from the dashboard,
-- not polled automatically, to keep X API read costs predictable.
alter table public.content_items
  add column if not exists twitter_post_id text,
  add column if not exists x_metrics jsonb;

alter table public.brands
  add column if not exists x_followers integer,
  add column if not exists x_followers_prev integer,
  add column if not exists x_followers_updated_at timestamptz;
