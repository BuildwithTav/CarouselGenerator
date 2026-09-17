-- Enable Row Level Security on all public tables in the Carousel-studio project.
-- No policies added: every server route that reads/writes these tables uses
-- SUPABASE_SERVICE_KEY (service role), which bypasses RLS regardless of policies.
-- The only client-side Supabase call in the app (CarouselGenerator.jsx) is
-- sb.auth.refreshSession(), which operates on Supabase's internal auth schema,
-- not these tables. So enabling RLS with zero policies blocks the actual gap
-- (anon key could read/write every row directly) without changing app behavior.

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."commissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."payout_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."licence_purchases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."monthly_rate_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pending_affiliate_refs" ENABLE ROW LEVEL SECURITY;
