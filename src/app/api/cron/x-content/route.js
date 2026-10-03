import { dashboardAuthorized, supabaseAdmin, brandPlatforms, bumpMediaUse, BUCKET } from "@/lib/dashboard";
import { X_SLOTS, pickPillar, pickFormat, generateXPost, generateBrandedCarouselIdea, generatePackage } from "@/lib/xContent";
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
// description across the set for a consistent-looking person. The first
// photo runs alone to establish that description; the rest run in parallel
// against it — sequential would risk this whole route running past its own
// function timeout once a carousel needs 3-4 generated photos in one call.
// Returns the storage paths (for posting) and media IDs (for use tracking).
async function photosForScenes(brand, scenes) {
  if (!scenes.length) return { paths: [], mediaIds: [] };
  const first = await generateMatchingPhoto(brand, { slideText: scenes[0], style: "editorial", textZone: "bottom" });
  const rest = await Promise.all(
    scenes.slice(1).map((scene) => generateMatchingPhoto(brand, { slideText: scene, style: "editorial", textZone: "bottom", modelNote: first.modelNote }))
  );
  const all = [first, ...rest];
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
  // First slide runs alone to establish the locked model description; the
  // rest run in parallel against it (same reasoning as photosForScenes —
  // sequential generation for 3+ slides risks the function's own timeout).
  const first = await generateMatchingPhoto(brand, { slideText: slideText(contentSlides[0]), idea, style: "editorial", textZone: "bottom" });
  const rest = await Promise.all(
    contentSlides.slice(1).map((s) => generateMatchingPhoto(brand, { slideText: slideText(s), idea, style: "editorial", textZone: "bottom", modelNote: first.modelNote }))
  );
  const photos = [first, ...rest];
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

async function runXContentGeneration(brandIdFilter) {
  const supabase = supabaseAdmin();

  const { data: brands } = await supabase.from("brands").select("*");
  let twitterBrands = (brands || []).filter((b) => brandPlatforms(b).includes("twitter"));
  if (brandIdFilter) twitterBrands = twitterBrands.filter((b) => b.id === brandIdFilter);
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.now() - RECENT_DAYS * 86400000).toISOString().slice(0, 10);

  const results = [];
  for (const brand of twitterBrands) {
    let queued = 0;
    const errors = [];
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
      recentPosts = (recent || []).map((r) => r.tw_caption).filter(Boolean);
    } catch (e) {
      results.push({ brand: brand.slug, queued: 0, error: "Couldn't load recent posts: " + e.message });
      continue;
    }

    // Each slot fails on its own — a slow or broken branded carousel
    // shouldn't cost the brand its other two posts for the day.
    for (const slot of X_SLOTS) {
      try {
        const pillar = pickPillar();
        const { format } = pickFormat(slot);

        if (format === "branded_carousel") {
          const built = await buildBrandedCarousel(brand, { pillar, recentPosts: recentPosts.slice(0, RECENT_LIMIT) });
          recentPosts.unshift(built.caption);
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
          queued++;
          continue;
        }

        const { text, scenes } = await generateXPost(brand, { slot, pillar, format, recentPosts: recentPosts.slice(0, RECENT_LIMIT) });
        if (!text) continue;
        recentPosts.unshift(text);

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
        queued++;
      } catch (e) {
        console.error(`X content generation failed for ${brand.slug} (${slot.key}):`, e.message);
        errors.push(`${slot.key}: ${e.message}`);
      }
    }
    results.push(errors.length ? { brand: brand.slug, queued, error: errors.join(" | ") } : { brand: brand.slug, queued });
  }

  return results;
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({ results: await runXContentGeneration() });
}

export async function POST(req) {
  if (!dashboardAuthorized(req)) return Response.json({ error: "Not authorized" }, { status: 403 });
  const { brandId } = await req.json().catch(() => ({}));
  return Response.json({ results: await runXContentGeneration(brandId || null) });
}
