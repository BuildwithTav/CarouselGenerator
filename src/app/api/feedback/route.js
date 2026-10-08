import { dashboardAuthorized, unauthorized, supabaseAdmin } from "@/lib/dashboard";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// "Why I rejected this" notes from the X tab. The latest few are fed back
// into the post and photo prompt writers (see src/lib/feedback.js), so a
// rejection actually changes what gets generated next.

export async function GET(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const brandId = new URL(req.url).searchParams.get("brandId");
  if (!brandId) return Response.json({ error: "brandId is required" }, { status: 400 });
  const { data, error } = await supabaseAdmin()
    .from("content_feedback")
    .select("id, item_id, reasons, note, caption, created_at")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ feedback: data || [] });
}

// Body: { brandId, itemId?, reasons: string[], note? }. Called before the
// item is deleted, so its caption and photo prompt are kept with the reason.
export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const { brandId, itemId, reasons, note } = await req.json();
  const cleanReasons = (Array.isArray(reasons) ? reasons : []).map((r) => String(r).trim()).filter(Boolean).slice(0, 10);
  const cleanNote = String(note || "").trim().slice(0, 500);
  if (!brandId) return Response.json({ error: "brandId is required" }, { status: 400 });
  if (!cleanReasons.length && !cleanNote) return Response.json({ error: "Pick a reason or write a note" }, { status: 400 });
  const supabase = supabaseAdmin();

  let caption = null;
  let imagePrompt = null;
  if (itemId) {
    const { data: item } = await supabase.from("content_items").select("tw_caption, caption, slide_paths").eq("id", itemId).single();
    caption = item?.tw_caption || item?.caption || null;
    const firstPath = item?.slide_paths?.[0];
    if (firstPath) {
      const { data: media } = await supabase.from("brand_media").select("note").eq("storage_path", firstPath).maybeSingle();
      imagePrompt = media?.note || null;
    }
  }

  const { data, error } = await supabase
    .from("content_feedback")
    .insert({ brand_id: brandId, item_id: itemId || null, reasons: cleanReasons, note: cleanNote || null, caption, image_prompt: imagePrompt })
    .select("id, item_id, reasons, note, caption, created_at")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ feedback: data });
}

export async function DELETE(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const { id } = await req.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  const { error } = await supabaseAdmin().from("content_feedback").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
