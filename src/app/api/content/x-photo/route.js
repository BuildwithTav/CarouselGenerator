import { dashboardAuthorized, unauthorized, supabaseAdmin, BUCKET, attachSlideUrls, bumpMediaUse } from "@/lib/dashboard";
import { saveChatgptPhoto, generatePhotoFromPrompt } from "@/lib/imageGen";
import { logGenerationError, friendlyError } from "@/lib/genLog";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// The photo for an X photo post (Tav's ChatGPT photos, Oct 2026). Multipart
// (id, file) attaches a photo he made in ChatGPT; JSON { id } makes it on fal
// from the same request instead (about $0.08). Either way it replaces the
// post's old photo, and the post can then be approved.
const ITEM_SELECT = "*, brands(name, visual_theme, daily_target, automation_mode, x_auto_post_paused)";
// The browser shrinks the photo to a JPEG first: Vercel takes ~4.5MB a request.
const MAX_BYTES = 4 * 1024 * 1024;
const AI_BUDGET_MS = 100000;

export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const upload = (req.headers.get("content-type") || "").includes("multipart/form-data");
  let id, file = null;
  if (upload) {
    const form = await req.formData();
    id = form.get("id");
    file = form.get("file");
  } else {
    ({ id } = await req.json().catch(() => ({})));
  }
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: item, error } = await supabase.from("content_items").select("*, brands(*)").eq("id", id).single();
  if (error || !item) return Response.json({ error: "Post not found" }, { status: 404 });
  if (item.template !== "x-post") return Response.json({ error: "Only X photo posts take a photo here" }, { status: 400 });
  if (item.posted_twitter_at) return Response.json({ error: "Already posted to X" }, { status: 400 });

  let media, checkNotes = null;
  if (upload) {
    if (!file || typeof file.arrayBuffer !== "function") return Response.json({ error: "Choose a photo first" }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_BYTES) return Response.json({ error: "That photo is too big — try again, it gets shrunk first" }, { status: 400 });
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return Response.json({ error: "That file isn't a photo the dashboard can use" }, { status: 400 });
    try {
      media = await saveChatgptPhoto(item.brands, buffer, item.photo_prompt || item.tw_caption);
    } catch (e) {
      return Response.json({ error: "Saving the photo failed: " + e.message }, { status: 500 });
    }
  } else {
    if (!item.photo_prompt) return Response.json({ error: "This post has no photo request to make it from" }, { status: 400 });
    try {
      const out = await generatePhotoFromPrompt(item.brands, item.photo_prompt, { source: "x-content", budgetMs: AI_BUDGET_MS });
      media = out.media;
      checkNotes = out.checkReason ? [out.checkReason] : null;
    } catch (e) {
      await logGenerationError(item.brand_id, "x-photo", "ai", e.message);
      return Response.json({ error: friendlyError(e.message) }, { status: 502 });
    }
  }

  await removeReplaced(supabase, item.slide_paths);
  const { data: updated, error: upErr } = await supabase
    .from("content_items")
    .update({ slide_paths: [media.storage_path], needs_photo: false, check_notes: checkNotes, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(ITEM_SELECT)
    .single();
  if (upErr) return Response.json({ error: upErr.message }, { status: 500 });
  await bumpMediaUse([media.id]);
  return Response.json({ item: await attachSlideUrls(updated) });
}

// A replaced photo leaves the library too, so a rejected attempt can't be
// picked for a carousel later. Kept if it's starred as her look or another
// post has used it.
async function removeReplaced(supabase, paths) {
  if (!paths?.length) return;
  const { data: rows } = await supabase.from("brand_media").select("id, storage_path, is_reference, use_count").in("storage_path", paths);
  const drop = (rows || []).filter((r) => !r.is_reference && (r.use_count || 0) <= 1);
  if (!drop.length) return;
  await supabase.storage.from(BUCKET).remove(drop.map((r) => r.storage_path));
  await supabase.from("brand_media").delete().in("id", drop.map((r) => r.id));
}
