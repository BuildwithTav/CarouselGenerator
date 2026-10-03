import { dashboardAuthorized, supabaseAdmin, brandPlatforms, assignSlideImages, bumpMediaUse, signPaths } from "@/lib/dashboard";
import { X_SLOTS, pickPillar, pickFormat, generateXPost } from "@/lib/xContent";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Runs once a day, before the first posting window (see vercel.json), and
// queues the day's 3 X posts for every brand with twitter enabled. The
// posting cron (post-twitter) just posts whatever's ready and due, same as
// any other content — this is the piece that actually writes it.
//
// New posts default to "draft" regardless of the brand's automation_mode:
// this is a brand-new, untested generation prompt on an account with real
// ban history, so the first runs get a manual look before anything auto-
// posts. Once the output's trusted, switch these to auto-ready the same way
// any other content type is controlled.
//
// GET (CRON_SECRET) is the real daily cron. POST (dashboard passphrase) lets
// a brand's batch be generated on demand from the dashboard — useful the
// first few days, or any time a brand wants a fresh batch outside the
// schedule, without needing the cron secret itself.
const RECENT_DAYS = 30;
const RECENT_LIMIT = 20;

async function runXContentGeneration(brandIdFilter) {
  const supabase = supabaseAdmin();

  const { data: brands } = await supabase.from("brands").select("*");
  let twitterBrands = (brands || []).filter((b) => brandPlatforms(b).includes("twitter"));
  if (brandIdFilter) twitterBrands = twitterBrands.filter((b) => b.id === brandIdFilter);
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.now() - RECENT_DAYS * 86400000).toISOString().slice(0, 10);

  const results = [];
  for (const brand of twitterBrands) {
    try {
      const { data: recent } = await supabase
        .from("content_items")
        .select("tw_caption, created_at")
        .eq("brand_id", brand.id)
        .not("tw_caption", "is", null)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(RECENT_LIMIT);
      const recentPosts = (recent || []).map((r) => r.tw_caption).filter(Boolean);

      let posted = 0;
      for (const slot of X_SLOTS) {
        const pillar = pickPillar();
        const { format, photoCount } = pickFormat(slot);

        // Photos are picked before the copy is written, not after — the
        // caption is written looking at the actual photo(s), so it can
        // genuinely respond to what's in them instead of being a generic
        // line bolted onto whatever got picked.
        let slidePaths = [];
        let mediaIds = [];
        let imageUrls = [];
        if (photoCount > 0) {
          const slots = Array.from({ length: photoCount }, () => ({}));
          await assignSlideImages(brand.id, slots, () => true, [brand.visual_theme?.profile_media_id], { sameForAll: false });
          slidePaths = slots.map((s) => s.image_path).filter(Boolean);
          mediaIds = slots.map((s) => s.image_media_id).filter(Boolean);
          imageUrls = await signPaths(slidePaths);
        }

        const { text } = await generateXPost(brand, { slot, pillar, format, recentPosts: recentPosts.slice(0, RECENT_LIMIT), imageUrls });
        if (!text) continue;
        recentPosts.unshift(text); // so the next slot today also avoids repeating this one
        await bumpMediaUse(mediaIds);

        const { error: insErr } = await supabase.from("content_items").insert({
          brand_id: brand.id,
          idea: `X · ${slot.key} · ${pillar.label}`,
          pillar: pillar.label,
          status: "draft",
          scheduled_for: today,
          slide_paths: slidePaths,
          tw_caption: text,
          platforms: ["twitter"],
          template: "x-post",
        });
        if (insErr) throw new Error(`insert failed (${slot.key}): ${insErr.message}`);
        posted++;
      }
      results.push({ brand: brand.slug, queued: posted });
    } catch (e) {
      console.error(`X content generation failed for ${brand.slug}:`, e.message);
      results.push({ brand: brand.slug, queued: 0, error: e.message });
    }
  }

  return results;
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({ results: await runXContentGeneration() });
}

export async function POST(req) {
  if (!dashboardAuthorized(req)) return Response.json({ error: "Not authorized" }, { status: 403 });
  const { brandId } = await req.json().catch(() => ({}));
  return Response.json({ results: await runXContentGeneration(brandId || null) });
}
