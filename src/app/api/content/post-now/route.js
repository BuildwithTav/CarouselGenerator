import { dashboardAuthorized, unauthorized, supabaseAdmin, attachSlideUrls } from "@/lib/dashboard";
import { postItemToX } from "@/lib/twitterApi";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// Posts one specific item to X immediately, instead of waiting for the next
// scheduled posting window (see cron/post-twitter) — the dashboard's X
// section's "Post now" button. Same underlying postItemToX() as the cron.
export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET || !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_TOKEN_SECRET) {
    return Response.json({ error: "Twitter API keys are not set" }, { status: 500 });
  }
  const { id } = await req.json().catch(() => ({}));
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  const supabase = supabaseAdmin();

  const { data: item, error } = await supabase.from("content_items").select("*, brands(*)").eq("id", id).single();
  if (error || !item) return Response.json({ error: "Item not found" }, { status: 404 });
  if (item.posted_twitter_at) return Response.json({ error: "Already posted to X" }, { status: 400 });
  // Same kill switch as the cron — no manual posting loophole while paused.
  if (item.brands?.x_auto_post_paused) return Response.json({ error: "Auto-posting is paused for this brand — resume it from the X tab first." }, { status: 400 });

  try {
    const updated = await postItemToX(supabase, item, item.brands);
    return Response.json({ item: await attachSlideUrls({ ...updated, brands: item.brands }) });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
