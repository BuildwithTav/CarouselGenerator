-- Kill switch for automated X posting (cron + "Post now"), toggled from the
-- X tab's automation panel. Added after a batch posted with broken/mismatched
-- photos, so nothing more goes out unattended until the pipeline's verified.
alter table public.brands
  add column if not exists x_auto_post_paused boolean not null default false;
