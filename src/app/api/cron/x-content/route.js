import { supabaseAdmin, brandPlatforms, assignSlideImages, bumpMediaUse } from "@/lib/dashboard";
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
const RECENT_DAYS = 30;
const RECENT_LIMIT = 20;

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = supabaseAdmin();

  const { data: brands } = await supabase.from("brands").select("*");
  const twitterBrands = (brands || []).filter((b) => brandPlatforms(b).includes("twitter"));
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

        const { text } = await generateXPost(brand, { slot, pillar, format, recentPosts: recentPosts.slice(0, RECENT_LIMIT) });
        if (!text) continue;
        recentPosts.unshift(text); // so the next slot today also avoids repeating this one

        let slidePaths = [];
        if (photoCount > 0) {
          const slots = Array.from({ length: photoCount }, () => ({}));
          await assignSlideImages(brand.id, slots, () => true, [brand.visual_theme?.profile_media_id], { sameForAll: false });
          slidePaths = slots.map((s) => s.image_path).filter(Boolean);
          await bumpMediaUse(slots.map((s) => s.image_media_id));
        }

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

  return Response.json({ results });
}
