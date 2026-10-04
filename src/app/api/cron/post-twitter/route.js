import { supabaseAdmin, brandPlatforms } from "@/lib/dashboard";
import { postItemToX } from "@/lib/twitterApi";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// Fires 3x/day (see vercel.json). For every brand with "twitter" in its
// platforms, posts the single oldest ready item due today or earlier that
// hasn't gone out on X yet — so three firings a day post up to three times a
// day per brand, spread across the schedule rather than all landing at once.
export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET || !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_TOKEN_SECRET) {
    return Response.json({ error: "Twitter API keys are not set" }, { status: 500 });
  }
  const supabase = supabaseAdmin();

  const { data: brands } = await supabase.from("brands").select("*");
  const twitterBrands = (brands || []).filter((b) => brandPlatforms(b).includes("twitter"));
  const today = new Date().toISOString().slice(0, 10);

  const results = [];
  for (const brand of twitterBrands) {
    // Kill switch, toggled from the X tab's automation panel — set after a
    // batch went out with broken photos, so nothing more posts unattended
    // until the generation pipeline's been verified again.
    if (brand.x_auto_post_paused) { results.push({ brand: brand.slug, posted: false, reason: "auto-posting paused" }); continue; }
    const { data: item } = await supabase
      .from("content_items")
      .select("*")
      .eq("brand_id", brand.id)
      .eq("status", "ready")
      .lte("scheduled_for", today)
      .is("posted_twitter_at", null)
      .order("scheduled_for", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!item) { results.push({ brand: brand.slug, posted: false, reason: "nothing ready" }); continue; }

    try {
      await postItemToX(supabase, item, brand);
      results.push({ brand: brand.slug, posted: true, itemId: item.id });
    } catch (e) {
      console.error(`Twitter post failed for ${brand.slug}:`, e.message);
      results.push({ brand: brand.slug, posted: false, error: e.message });
    }
  }

  return Response.json({ results });
}
