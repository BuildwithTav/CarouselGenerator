import { dashboardAuthorized, supabaseAdmin, brandPlatforms, bumpMediaUse, BUCKET } from "@/lib/dashboard";
import { X_SLOTS, pickPillar, pickFormat, generateXPost, generateBrandedCarouselIdea, generatePackage } from "@/lib/xContent";
import { lockModelDescription } from "@/lib/contentAi";
import { generateMatchingPhoto } from "@/lib/imageGen";
import { buildBrandSlides, slideText } from "@/lib/brandTemplate";
import { renderSlides } from "@/lib/renderSlides";

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
//
// GET (CRON_SECRET) is the real daily cron. POST (dashboard passphrase) lets
// a brand's batch be generated on demand from the dashboard — useful the
// first few days, or any time a brand wants a fresh batch outside the
// schedule, without needing the cron secret itself.
const RECENT_DAYS = 30;
const RECENT_LIMIT = 20;

// Generates one or more AI photos matching the given scene descriptions
// (text-first: the scene already says exactly what the photo must show —
// see xContent.js's generateXPost), keeping the same locked model
// description across the set for a consistent-looking person. The model
// description is written once up front, then every photo (including the
// first) generates fully in parallel against it — an earlier version made
// the first photo finish before starting the rest purely to get that same
// description, which roughly doubled the critical path on a 3-4 photo
// carousel for no real reason and was the actual cause of the 45s timeout
// on the "visual" slot. Returns the storage paths (for posting) and media
// IDs (for use tracking).
async function photosForScenes(brand, scenes) {
  if (!scenes.length) return { paths: [], mediaIds: [] };
  const modelNote = await lockModelDescription(brand).catch((e) => { console.error("Model description failed:", e.message); return ""; });
  const all = await Promise.all(
    scenes.map((scene) => generateMatchingPhoto(brand, { slideText: scene, style: "editorial", textZone: "bottom", modelNote }))
  );
  return { paths: all.map((r) => r.media.storage_path), mediaIds: all.map((r) => r.media.id) };
}

// The branded-carousel format: a short multi-slide post rendered through
// the real template pipeline, same as any Instagram carousel, capped at 4
// slides for X's own image-per-post limit. Returns the finished slide_paths
// and the item's slide data (so it opens correctly in the carousel editor).
async function buildBrandedCarousel(brand, { pillar, recentPosts }) {
  const template = brand?.visual_theme?.template === "healthcode" ? "healthcode" : "elegant";
  const idea = await generateBrandedCarouselIdea(brand, { pillar, recentPosts });
  const pkg = await generatePackage(brand, { idea, pillar: pillar.label, slideCount: 4, template, ctaType: brand?.visual_theme?.cta?.type || "follow" });

  const contentSlides = pkg.slides.filter((s) => !s.isCta);
  const ctaSlide = pkg.slides.find((s) => s.isCta);
  // Model description written once up front, every slide's photo generated
  // fully in parallel against it (see photosForScenes above for why this
  // isn't a first-then-rest chain any more).
  const modelNote = await lockModelDescription(brand).catch((e) => { console.error("Model description failed:", e.message); return ""; });
  const photos = await Promise.all(
    contentSlides.map((s) => generateMatchingPhoto(brand, { slideText: slideText(s), idea, style: "editorial", textZone: "bottom", modelNote }))
  );
  const mediaIds = photos.map((p) => p.media.id);
  const slides = [
    ...contentSlides.map((s, i) => ({ ...s, image_media_id: photos[i].media.id, image_path: photos[i].media.storage_path, image_url: photos[i].media.url })),
    ...(ctaSlide ? [ctaSlide] : []),
  ];

  const htmls = buildBrandSlides({ brand, slides, profileUrl: null, coverImageUrl: null, template });
  const pngs = await renderSlides(htmls);

  const stamp = Date.now();
  const supabase = supabaseAdmin();
  const slidePaths = [];
  for (let i = 0; i < pngs.length; i++) {
    const path = `content/x-${brand.id}-${stamp}/slide-${String(i + 1).padStart(2, "0")}.png`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, pngs[i], { contentType: "image/png", upsert: true });
    if (upErr) throw new Error("Upload failed: " + upErr.message);
    slidePaths.push(path);
  }

  // Strip the signed image_url before storing — slides are stored with
  // image_media_id/image_path only, same as every other content item.
  const storedSlides = slides.map(({ image_url, ...rest }) => rest);
  return { idea, template, slidePaths, slides: storedSlides, caption: pkg.tw_caption || "", mediaIds };
}

// Soft per-slot deadline, under the route's own 60s maxDuration — a stuck or
// slow slot (a hung fal.ai call, a slow render) reports as a timeout for
// that one slot instead of taking the whole request past Vercel's hard
// limit, which previously surfaced as a flat 504 with zero detail and no
// partial results at all. This wraps the slot's ENTIRE pipeline (writing
// the text, then generating its photos — they're sequential, photos can't
// start until the text names the scenes) as a single deadline, not two
// separate 45s budgets stacked one after another that could sum past the
// 60s ceiling even when each individual step was itself within 45s.
const SLOT_TIMEOUT_MS = 50000;
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} took too long (over ${Math.round(ms / 1000)}s)`)), ms)),
  ]);
}

async function generateSlot(supabase, brand, slot, pillar, format, recentPosts, today) {
  if (format === "branded_carousel") {
    const built = await buildBrandedCarousel(brand, { pillar, recentPosts });
    await bumpMediaUse(built.mediaIds);
    const { error: insErr } = await supabase.from("content_items").insert({
      brand_id: brand.id,
      idea: built.idea,
      pillar: pillar.label,
      status: "draft",
      scheduled_for: today,
      slides: built.slides,
      slide_paths: built.slidePaths,
      tw_caption: built.caption,
      platforms: ["twitter"],
      template: built.template,
    });
    if (insErr) throw new Error(`insert failed (${slot.key}): ${insErr.message}`);
    return { queued: true };
  }

  const { text, scenes } = await generateXPost(brand, { slot, pillar, format, recentPosts });
  if (!text) return { queued: false };

  let slidePaths = [];
  if (scenes.length) {
    const photos = await photosForScenes(brand, scenes);
    slidePaths = photos.paths;
    await bumpMediaUse(photos.mediaIds);
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
  return { queued: true };
}

// One slot end to end: pick pillar/format, write it, generate its photo(s),
// insert the draft. Returns a result object rather than throwing, so slots
// run concurrently via Promise.all without one failure rejecting the rest.
async function runSlot(supabase, brand, slot, recentPosts, today) {
  try {
    const pillar = pickPillar();
    const { format } = pickFormat(slot);
    return await withTimeout(generateSlot(supabase, brand, slot, pillar, format, recentPosts, today), SLOT_TIMEOUT_MS, `${slot.key} (${format})`);
  } catch (e) {
    console.error(`X content generation failed for ${brand.slug} (${slot.key}):`, e.message);
    return { queued: false, error: `${slot.key}: ${e.message}` };
  }
}

// `slotKeyFilter`, when given, generates only that one slot instead of all
// 3 — even with slots run concurrently, the slowest single slot (a branded
// carousel: a text call, several AI photos, a template render) can still eat
// most of a 60s budget on its own, and this environment's actual enforced
// function-duration ceiling isn't something this session can read back from
// Vercel to confirm. Doing one slot per request is the one fix that doesn't
// depend on knowing that number: the dashboard's "Generate today's batch"
// now fires one request per slot instead of one request for all 3, and the
// daily cron is split the same way in vercel.json.
async function runXContentGeneration(brandIdFilter, slotKeyFilter) {
  const supabase = supabaseAdmin();

  const { data: brands } = await supabase.from("brands").select("*");
  let twitterBrands = (brands || []).filter((b) => brandPlatforms(b).includes("twitter"));
  if (brandIdFilter) twitterBrands = twitterBrands.filter((b) => b.id === brandIdFilter);
  const slots = slotKeyFilter ? X_SLOTS.filter((s) => s.key === slotKeyFilter) : X_SLOTS;
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.now() - RECENT_DAYS * 86400000).toISOString().slice(0, 10);

  const results = await Promise.all(twitterBrands.map(async (brand) => {
    let recentPosts = [];
    try {
      const { data: recent } = await supabase
        .from("content_items")
        .select("tw_caption, created_at")
        .eq("brand_id", brand.id)
        .not("tw_caption", "is", null)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(RECENT_LIMIT);
      recentPosts = (recent || []).map((r) => r.tw_caption).filter(Boolean).slice(0, RECENT_LIMIT);
    } catch (e) {
      return { brand: brand.slug, queued: 0, error: "Couldn't load recent posts: " + e.message };
    }

    const slotResults = await Promise.all(slots.map((slot) => runSlot(supabase, brand, slot, recentPosts, today)));
    const queued = slotResults.filter((r) => r.queued).length;
    const errors = slotResults.map((r) => r.error).filter(Boolean);
    return errors.length ? { brand: brand.slug, queued, error: errors.join(" | ") } : { brand: brand.slug, queued };
  }));

  return results;
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const slot = new URL(req.url).searchParams.get("slot");
  return Response.json({ results: await runXContentGeneration(null, slot || null) });
}

export async function POST(req) {
  if (!dashboardAuthorized(req)) return Response.json({ error: "Not authorized" }, { status: 403 });
  const { brandId, slotKey } = await req.json().catch(() => ({}));
  return Response.json({ results: await runXContentGeneration(brandId || null, slotKey || null) });
}
