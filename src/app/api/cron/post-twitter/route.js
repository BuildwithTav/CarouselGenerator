import { supabaseAdmin, brandPlatforms } from "@/lib/dashboard";
import { postItemToX, xAppConfigured } from "@/lib/twitterApi";
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
// Every run leaves a row in cron_runs, whatever happens, including runs
// that stop early or crash: in Nov 2026 posting slots were missed with no
// trace anywhere, and Vercel's logs can't be read from here.
async function recordRun(outcome, detail = null) {
  try {
    const { error } = await supabaseAdmin().from("cron_runs").insert({ job: "post-twitter", outcome, detail: detail ? String(detail).slice(0, 2000) : null });
    if (error) console.error("Couldn't write cron_runs:", error.message);
  } catch (e) {
    console.error("Couldn't write cron_runs:", e.message);
  }
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    await recordRun("unauthorized", authHeader ? "wrong secret" : "no secret sent");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!xAppConfigured()) {
    await recordRun("failed", "Twitter API keys are not set");
    return Response.json({ error: "Twitter API keys are not set" }, { status: 500 });
  }
  try {
    const results = await postNextForEachBrand();
    await recordRun(results.some((r) => r.posted) ? "posted" : results.some((r) => r.error) ? "failed" : "nothing posted", JSON.stringify(results));
    return Response.json({ results });
  } catch (e) {
    console.error("post-twitter crashed:", e);
    await recordRun("crashed", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

async function postNextForEachBrand() {
  const supabase = supabaseAdmin();

  const { data: brands, error: brandsErr } = await supabase.from("brands").select("*");
  if (brandsErr) throw new Error("Couldn't load brands: " + brandsErr.message);
  const twitterBrands = (brands || []).filter((b) => brandPlatforms(b).includes("twitter"));
  const today = new Date().toISOString().slice(0, 10);

  const results = [];
  for (const brand of twitterBrands) {
    // Kill switch, toggled from the X tab's automation panel — set after a
    // batch went out with broken photos, so nothing more posts unattended
    // until the generation pipeline's been verified again.
    if (brand.x_auto_post_paused) { results.push({ brand: brand.slug, posted: false, reason: "auto-posting paused" }); continue; }
    const [{ data: ready, error: readyErr }, { data: last }] = await Promise.all([
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
    if (readyErr) { results.push({ brand: brand.slug, posted: false, error: "Couldn't load the queue: " + readyErr.message }); continue; }
    // A ChatGPT photo post still waiting for its photo never goes out.
    const item = pickNextPost((ready || []).filter((i) => !i.needs_photo), last ? postKind(last) : null);

    if (!item) { results.push({ brand: brand.slug, posted: false, reason: "nothing ready", waiting: (ready || []).length }); continue; }

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
  return results;
}
