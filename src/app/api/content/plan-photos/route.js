import { dashboardAuthorized, unauthorized, supabaseAdmin } from "@/lib/dashboard";
import { planPhotos } from "@/lib/imageGen";
import { characterOf, itemTemplate, slideCanHaveImage, slideText } from "@/lib/brandTemplate";
import { VISUAL_RULES_VERSION } from "@/lib/visualPipeline";
import { logGenerationError, friendlyError } from "@/lib/genLog";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

// Plans every photo of a carousel in one go — one continuity (setting,
// wardrobe, light, mode) for the whole set, a different shot per slide —
// and stores it on the item as photo_plan. generate-image then makes each
// slide's photo from its entry. Brands without a fixed character return
// { plan: null } and generate-image falls back to the single-prompt path.
export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const { itemId } = await req.json();
  if (!itemId) return Response.json({ error: "itemId is required" }, { status: 400 });
  const supabase = supabaseAdmin();
  const { data: item, error } = await supabase.from("content_items").select("*, brands(*)").eq("id", itemId).single();
  if (error || !item) return Response.json({ error: "Item not found" }, { status: 404 });
  const brand = item.brands;
  if (!characterOf(brand)) return Response.json({ plan: null });

  const template = itemTemplate(item, brand);
  const slides = Array.isArray(item.slides) ? item.slides : [];
  const indices = slides.map((s, i) => i).filter((i) => slideCanHaveImage(template, i, slides[i]));
  if (!indices.length) return Response.json({ plan: null });

  try {
    const p = await planPhotos(brand, { texts: indices.map((i) => slideText(slides[i])), textZone: "bottom", source: "carousel" });
    const plan = { version: VISUAL_RULES_VERSION, continuity: p.continuity, shots: p.items.map((it, n) => ({ slideIndex: indices[n], ...it })) };
    await supabase.from("content_items").update({ photo_plan: plan }).eq("id", itemId);
    return Response.json({ plan });
  } catch (e) {
    await logGenerationError(brand.id, "plan-photos", null, e.message);
    return Response.json({ error: friendlyError(e.message) }, { status: 502 });
  }
}
