-- Classic (Carousel Studio's "dark-fade": photo on every slide) joins the
-- templates a post can be made with.
alter table public.content_items drop constraint if exists content_items_template_check;
alter table public.content_items
  add constraint content_items_template_check
  check (template is null or template in ('bold', 'raw', 'clean-pro', 'dark-fade'));
