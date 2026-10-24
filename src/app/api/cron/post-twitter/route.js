import { supabaseAdmin, brandPlatforms } from "@/lib/dashboard";
import { postItemToX } from "@/lib/twitterApi";
import { pickNextPost, postKind } from "@/lib/postOrder";
import { logGenerationError } from "@/lib/genLog";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// Fires 3x/day (see vercel.json). For every brand with "twitter" in its
// platforms, posts one ready item due today or earlier that hasn't gone out
// on X yet — so three firings a day post up to three times a day per brand.
// Which one is mixed, not oldest-first (see pickNextPost in postOrder.js):
// a different kind (text / image / carousel) from the last post when one is
// waiting, picked at random.
//
// Only items the X engine itself produced (always tagged with an explicit
// platforms: ["twitter"] override) are eligible here — never a regular
// Instagram/TikTok/YouTube carousel that merely inherits "twitter" from the
// brand's general platform toggle. That toggle only controls whether the
// carousel editor shows an X caption box for manual copy-paste; those
// carousels can run 5-10 slides with no cap, while X allows at most 4
// images per post, so auto-posting one meant silently cutting it to 4 and
// dropping the rest with no warning — found after every auto-post since
// this was built turned out to be exactly that.
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
    const [{ data: ready }, { data: last }] = await Promise.all([
      supabase
        .from("content_items")
        .select("*")
        .eq("brand_id", brand.id)
        .eq("status", "ready")
        .lte("scheduled_for", today)
        .is("posted_twitter_at", null)
        .contains("platforms", ["twitter"])
        .order("created_at", { ascending: true })
        .limit(100),
      supabase
        .from("content_items")
        .select("template, slide_paths")
        .eq("brand_id", brand.id)
        .not("posted_twitter_at", "is", null)
        .order("posted_twitter_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    // A ChatGPT photo post still waiting for its photo never goes out.
    const item = pickNextPost((ready || []).filter((i) => !i.needs_photo), last ? postKind(last) : null);

    if (!item) { results.push({ brand: brand.slug, posted: false, reason: "nothing ready" }); continue; }

    try {
      await postItemToX(supabase, item, brand);
      results.push({ brand: brand.slug, posted: true, itemId: item.id });
    } catch (e) {
      console.error(`Twitter post failed for ${brand.slug}:`, e.message);
      // Recorded so a run of failed posts shows up in the database, not
      // only in Vercel's logs (X's login lapsed for 2 days unnoticed).
      await logGenerationError(brand.id, "post-twitter", item.id, e.message);
      results.push({ brand: brand.slug, posted: false, error: e.message });
    }
  }

  return Response.json({ results });
}
