import { dashboardAuthorized, unauthorized, supabaseAdmin } from "@/lib/dashboard";
import { fetchTweetMetrics, fetchFollowerCount } from "@/lib/twitterApi";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// Refreshes engagement metrics for this brand's recently-posted X items and
// its current follower count. Manual ("Refresh stats" button), not an
// automatic poll — each X API read has a small real cost under X's
// pay-per-use pricing, so it only runs when asked.
export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET || !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_TOKEN_SECRET) {
    return Response.json({ error: "Twitter API keys are not set" }, { status: 500 });
  }
  const { brandId } = await req.json().catch(() => ({}));
  if (!brandId) return Response.json({ error: "brandId is required" }, { status: 400 });
  const supabase = supabaseAdmin();

  const { data: brand, error: bErr } = await supabase.from("brands").select("*").eq("id", brandId).single();
  if (bErr || !brand) return Response.json({ error: "Brand not found" }, { status: 404 });

  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: items } = await supabase
    .from("content_items")
    .select("id, twitter_post_id")
    .eq("brand_id", brandId)
    .not("twitter_post_id", "is", null)
    .gte("posted_twitter_at", since)
    .limit(100);

  let metrics = {};
  try {
    metrics = await fetchTweetMetrics((items || []).map((i) => i.twitter_post_id));
  } catch (e) {
    return Response.json({ error: "Follower count/post refresh failed: " + e.message }, { status: 502 });
  }
  await Promise.all(
    (items || []).filter((i) => metrics[i.twitter_post_id]).map((i) =>
      supabase.from("content_items").update({ x_metrics: metrics[i.twitter_post_id] }).eq("id", i.id)
    )
  );

  let followers = brand.x_followers;
  try {
    const count = await fetchFollowerCount();
    if (count != null) {
      const today = new Date().toISOString().slice(0, 10);
      const lastDay = brand.x_followers_updated_at ? brand.x_followers_updated_at.slice(0, 10) : null;
      // Only roll "prev" forward once a day, so the delta shown is always a
      // real day-over-day change, not whatever the last refresh happened to be.
      const prev = lastDay === today ? brand.x_followers_prev : brand.x_followers;
      const { data: updatedBrand } = await supabase
        .from("brands")
        .update({ x_followers: count, x_followers_prev: prev ?? count, x_followers_updated_at: new Date().toISOString() })
        .eq("id", brandId)
        .select("x_followers, x_followers_prev, x_followers_updated_at")
        .single();
      followers = updatedBrand?.x_followers ?? count;
      brand.x_followers_prev = updatedBrand?.x_followers_prev ?? prev;
    }
  } catch (e) {
    return Response.json({ postsUpdated: Object.keys(metrics).length, error: "Follower count refresh failed: " + e.message }, { status: 207 });
  }

  return Response.json({ postsUpdated: Object.keys(metrics).length, followers, followersPrev: brand.x_followers_prev });
}
