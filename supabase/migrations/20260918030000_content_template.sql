-- The carousel template is chosen per post (Raw photo set today, Clean Pro
-- facts tomorrow). Null means "use the brand's default template".
alter table public.content_items
  add column if not exists template text
  check (template is null or template in ('bold', 'raw', 'clean-pro'));
