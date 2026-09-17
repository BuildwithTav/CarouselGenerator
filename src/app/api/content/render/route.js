import { dashboardAuthorized, unauthorized, supabaseAdmin, BUCKET, SIGNED_URL_TTL_SECONDS, attachSlideUrls } from "@/lib/dashboard";
import { buildSlideHTML } from "@/lib/slideTemplate";
import { renderSlides } from "@/lib/renderSlides";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const { id } = await req.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  const supabase = supabaseAdmin();

  const { data: item, error } = await supabase.from("content_items").select("*, brands(*)").eq("id", id).single();
  if (error || !item) return Response.json({ error: "Content not found" }, { status: 404 });
  const slides = Array.isArray(item.slides) ? item.slides : [];
  if (!slides.length) return Response.json({ error: "No slides to render" }, { status: 400 });

  let coverImageUrl = null;
  if (item.media_id) {
    const { data: media } = await supabase.from("brand_media").select("storage_path, file_type").eq("id", item.media_id).single();
    if (media?.file_type === "image") {
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(media.storage_path, SIGNED_URL_TTL_SECONDS);
      coverImageUrl = signed?.signedUrl || null;
    }
  }

  const brand = item.brands;
  const htmls = slides.map((s, i) => buildSlideHTML(s, i, slides.length, brand.visual_theme, brand, coverImageUrl));

  let pngs;
  try {
    pngs = await renderSlides(htmls);
  } catch (e) {
    console.error("Render failed:", e);
    return Response.json({ error: "Rendering failed: " + e.message }, { status: 500 });
  }

  if (item.slide_paths?.length) await supabase.storage.from(BUCKET).remove(item.slide_paths);

  const stamp = Date.now();
  const paths = [];
  for (let i = 0; i < pngs.length; i++) {
    const path = `content/${id}/${stamp}-slide-${String(i + 1).padStart(2, "0")}.png`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, pngs[i], { contentType: "image/png", upsert: true });
    if (upErr) return Response.json({ error: "Upload failed: " + upErr.message }, { status: 500 });
    paths.push(path);
  }

  const { data: updated, error: uErr } = await supabase
    .from("content_items")
    .update({ slide_paths: paths, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, brands(name, visual_theme, daily_target, automation_mode)")
    .single();
  if (uErr) return Response.json({ error: uErr.message }, { status: 500 });
  return Response.json({ item: await attachSlideUrls(updated) });
}
