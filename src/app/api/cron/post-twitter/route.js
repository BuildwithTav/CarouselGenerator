import { supabaseAdmin, BUCKET, brandPlatforms, itemPlatforms, postedColumn } from "@/lib/dashboard";
import { uploadMedia, postTweet } from "@/lib/twitterApi";

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
      const text = (item.tw_caption || item.caption || "").slice(0, 280);
      // Up to 4 images (a carousel-style X post), one (a single-image post),
      // or none at all (text-only) — the X content engine decides this by how
      // many photos it attached, not by any separate "format" field.
      const paths = (item.slide_paths || []).slice(0, 4);
      const mediaIds = [];
      for (const path of paths) {
        const { data: file, error: dlErr } = await supabase.storage.from(BUCKET).download(path);
        if (dlErr) throw new Error("Could not download slide image: " + dlErr.message);
        mediaIds.push(await uploadMedia(Buffer.from(await file.arrayBuffer()), "image/png"));
      }
      await postTweet(text, mediaIds);

      const { data: updatedItem, error: upErr } = await supabase
        .from("content_items")
        .update({ posted_twitter_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", item.id)
        .select("*")
        .single();
      if (upErr) throw new Error("Posted to X but failed to record it: " + upErr.message);

      const platforms = itemPlatforms(updatedItem, brand);
      if (platforms.every((p) => updatedItem[postedColumn(p)])) {
        await supabase.from("content_items").update({ status: "posted" }).eq("id", item.id);
      }

      results.push({ brand: brand.slug, posted: true, itemId: item.id });
    } catch (e) {
      console.error(`Twitter post failed for ${brand.slug}:`, e.message);
      results.push({ brand: brand.slug, posted: false, error: e.message });
    }
  }

  return Response.json({ results });
}
