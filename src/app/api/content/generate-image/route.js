import { dashboardAuthorized, unauthorized, supabaseAdmin, BUCKET, SIGNED_URL_TTL_SECONDS } from "@/lib/dashboard";
import { generateMatchingPhoto, planPhotos, generatePlannedPhoto } from "@/lib/imageGen";
import { characterOf, slideText } from "@/lib/brandTemplate";
import { VISUAL_RULES_VERSION } from "@/lib/visualPipeline";
import { logGenerationError, friendlyError } from "@/lib/genLog";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Generates one AI photo for a slide, saves it to the brand's media library
// (so it gets use-count tracking like any upload) and returns the media row
// plus { needsCheck, checkReason } from the photo check.
//
// Body: { brandId, itemId?, slideIndex?, replan?, slideText, idea, style, prompt?, textZone? }
// With itemId + slideIndex on a brand with a fixed character, the photo is
// made from that slide's entry in the item's photo_plan (planned by
// /api/content/plan-photos), keeping the carousel's continuity and checking
// it against the previous slide's photo. replan: true picks a new shot for
// that slide ("Generate another"). Otherwise the single-prompt path runs.
const CAROUSEL_BUDGET_MS = 150000;

export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const { brandId, itemId, slideIndex, replan, slideText: text, idea, style, prompt, textZone, modelNote, shotIndex } = await req.json();
  if (!brandId) return Response.json({ error: "brandId is required" }, { status: 400 });
  const supabase = supabaseAdmin();

  const { data: brand, error: bErr } = await supabase.from("brands").select("*").eq("id", brandId).single();
  if (bErr || !brand) return Response.json({ error: "Brand not found" }, { status: 404 });

  try {
    if (itemId && Number.isInteger(slideIndex) && characterOf(brand) && !prompt) {
      const started = Date.now();
      const { data: item, error: iErr } = await supabase.from("content_items").select("id, slides, photo_plan").eq("id", itemId).single();
      if (iErr || !item) return Response.json({ error: "Item not found" }, { status: 404 });
      const slides = Array.isArray(item.slides) ? item.slides : [];
      let plan = item.photo_plan;
      let entry = plan?.shots?.find((s) => s.slideIndex === slideIndex);
      if (!plan || !entry || replan) {
        const others = (plan?.shots || []).filter((s) => s.slideIndex !== slideIndex).map((s) => s.shot);
        const avoid = entry && replan ? [...others, entry.shot] : others;
        const p = await planPhotos(brand, { texts: [slideText(slides[slideIndex]) || text || idea || ""], lockedContinuity: plan?.continuity || null, avoidShots: avoid, textZone: "bottom", source: "carousel" });
        entry = { slideIndex, ...p.items[0] };
        plan = { version: VISUAL_RULES_VERSION, continuity: plan?.continuity || p.continuity, shots: [...(plan?.shots || []).filter((s) => s.slideIndex !== slideIndex), entry] };
        await supabase.from("content_items").update({ photo_plan: plan }).eq("id", itemId);
      }
      // The previous slide's accepted photo, for the continuity check.
      let previousUrl = null;
      const prev = slides.slice(0, slideIndex).reverse().find((s) => s?.image_path);
      if (prev) {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(prev.image_path, SIGNED_URL_TTL_SECONDS);
        previousUrl = data?.signedUrl || null;
      }
      const result = await generatePlannedPhoto(brand, { item: entry, continuity: plan.continuity, previousUrl, source: "carousel", budgetMs: Math.max(60000, CAROUSEL_BUDGET_MS - (Date.now() - started)) });
      return Response.json(result);
    }

    const result = await generateMatchingPhoto(brand, { slideText: text, idea, style, prompt, textZone, modelNote, shotIndex: Number.isInteger(shotIndex) ? shotIndex : undefined, source: "carousel" });
    return Response.json(result);
  } catch (e) {
    await logGenerationError(brand.id, "generate-image", null, e.message);
    return Response.json({ error: friendlyError(e.message) }, { status: 502 });
  }
}
