import { dashboardAuthorized, unauthorized, supabaseAdmin, BUCKET, attachSlideUrls } from "@/lib/dashboard";
import { regenerateSlides, regenerateCopy } from "@/lib/contentAi";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const { id, field } = await req.json();
  if (!id || !["slides", "copy"].includes(field)) return Response.json({ error: "id and field (slides|copy) are required" }, { status: 400 });
  const supabase = supabaseAdmin();

  const { data: item, error } = await supabase.from("content_items").select("*, brands(*)").eq("id", id).single();
  if (error || !item) return Response.json({ error: "Content not found" }, { status: 404 });

  let update;
  try {
    if (field === "slides") {
      const slides = await regenerateSlides(item.brands, item);
      if (item.slide_paths?.length) await supabase.storage.from(BUCKET).remove(item.slide_paths);
      update = { slides, slide_paths: [] };
    } else {
      update = await regenerateCopy(item.brands, item);
    }
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }

  const { data: updated, error: uErr } = await supabase
    .from("content_items")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, brands(name, visual_theme, daily_target, automation_mode)")
    .single();
  if (uErr) return Response.json({ error: uErr.message }, { status: 500 });
  return Response.json({ item: await attachSlideUrls(updated) });
}
