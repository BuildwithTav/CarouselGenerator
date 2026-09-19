import { dashboardAuthorized, unauthorized, supabaseAdmin, BUCKET, SIGNED_URL_TTL_SECONDS, attachSlideUrls } from "@/lib/dashboard";
import { buildBrandSlides, themeOf, itemTemplate } from "@/lib/brandTemplate";
import { renderSlides } from "@/lib/renderSlides";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Signs every brand_media image referenced by the item (per-slide images,
// cover image, profile photo) in one go. Returns { [mediaId]: signedUrl }.
async function signMedia(supabase, ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const { data: rows } = await supabase.from("brand_media").select("id, storage_path, file_type").in("id", unique);
  const images = (rows || []).filter((r) => r.file_type === "image");
  if (!images.length) return {};
  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(images.map((r) => r.storage_path), SIGNED_URL_TTL_SECONDS);
  const out = {};
  images.forEach((r, i) => { if (signed?.[i]?.signedUrl) out[r.id] = signed[i].signedUrl; });
  return out;
}

export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const { id } = await req.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  const supabase = supabaseAdmin();

  const { data: item, error } = await supabase.from("content_items").select("*, brands(*)").eq("id", id).single();
  if (error || !item) return Response.json({ error: "Content not found" }, { status: 404 });
  const slides = Array.isArray(item.slides) ? item.slides : [];
  if (!slides.length) return Response.json({ error: "No slides to render" }, { status: 400 });

  const brand = item.brands;
  const theme = themeOf(brand);
  const template = itemTemplate(item, brand);
  const urls = await signMedia(supabase, [item.media_id, theme.profile_media_id, ...slides.map((s) => s.image_media_id)]);

  const coverImageUrl = (item.media_id && urls[item.media_id]) || null;
  const profileUrl = (theme.profile_media_id && urls[theme.profile_media_id]) || null;
  const withImages = slides.map((s) => ({ ...s, image_url: (s.image_media_id && urls[s.image_media_id]) || null }));

  if (template === "raw" || template === "elegant") {
    const missing = withImages.filter((s) => !s.isCta && !s.image_url).length;
    if (missing) return Response.json({ error: `This template needs a photo on every slide — ${missing} slide${missing === 1 ? "" : "s"} still ${missing === 1 ? "has" : "have"} none.` }, { status: 400 });
  }

  const htmls = buildBrandSlides({ brand, slides: withImages, profileUrl, coverImageUrl, template });

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
