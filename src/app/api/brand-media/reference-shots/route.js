import { dashboardAuthorized, unauthorized, supabaseAdmin } from "@/lib/dashboard";
import { generateMatchingPhoto, loadReferenceUrls } from "@/lib/imageGen";
import { characterOf } from "@/lib/brandTemplate";
import { logGenerationError, friendlyError } from "@/lib/genLog";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Builds her identity reference pack: one clean photo per view the visual
// pipeline selects from (see REFERENCE_VIEWS in visualPipeline.js).
//   A lower body, standing      → leg shape, proportions, skin tone, ankles
//   B both feet from above      → toe line, nail shape, left/right relationship
//   C feet and ankles, low side → arch profile and side silhouette
//   D uniform, tights, heels    → wardrobe, hosiery colour, navy shoes
// Each is generated from her already-starred photos (so the pack matches
// her), lands in the library unstarred and tagged with its view; the ones
// that look right get starred in the X tab's "Her look" panel.
function viewPrompts(c) {
  const look = "Soft, even natural daylight, neutral true-to-life colour, sharp focus throughout, real skin and fabric texture, a plain uncluttered background.";
  return {
    A: `The top of the frame cuts across her hips: her ${c.legs}, standing barefoot on a pale wooden floor in a fitted navy knee-length pencil skirt, feet flat and side by side, seen in a three quarter view at knee height. Her ${c.feet}; ${c.skin}. ${look}`,
    B: `Looking straight down from above at both of her bare feet resting side by side and slightly apart on a crisp white sheet, toes pointing up the frame, both complete feet clearly readable as a natural left and right pair. Her ${c.feet}; ${c.skin}. ${look}`,
    C: `A low side view at ankle height of her bare feet and ankles resting side by side on a pale wooden floor, the top of the frame at her mid-calf, the arch profile of the nearer foot clearly visible. Her ${c.feet}; ${c.skin}. ${look}`,
    D: `The top of the frame cuts across her waist: she stands in her cabin crew uniform, a fitted navy pencil skirt, a white blouse tucked in, sheer tan tights and navy court heels with a mid heel in the same navy as the skirt, feet side by side on a pale floor, seen in a three quarter view at knee height. Her ${c.legs}; ${c.hands}. ${look}`,
  };
}

export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  // `views` limits the run to the views still missing from her pack (the
  // X tab sends those), so redoing one view doesn't pay for all four.
  const { brandId, views } = await req.json();
  if (!brandId) return Response.json({ error: "brandId is required" }, { status: 400 });
  const supabase = supabaseAdmin();
  const { data: brand, error } = await supabase.from("brands").select("*").eq("id", brandId).single();
  if (error || !brand) return Response.json({ error: "Brand not found" }, { status: 404 });
  const c = characterOf(brand);
  if (!c) return Response.json({ error: "This brand has no fixed character set up yet" }, { status: 400 });

  const hasRefs = (await loadReferenceUrls(brand.id)).length > 0;
  const all = viewPrompts(c);
  const wanted = Array.isArray(views) && views.length ? Object.entries(all).filter(([v]) => views.includes(v)) : Object.entries(all);
  const results = await Promise.allSettled(
    wanted.map(async ([view, prompt]) => {
      const r = await generateMatchingPhoto(brand, { prompt, useReferences: hasRefs, note: `Reference ${view}`, source: "reference-pack" });
      const { data: row } = await supabase.from("brand_media").update({ reference_view: view }).eq("id", r.media.id).select().single();
      return { ...r.media, ...(row || {}), url: r.media.url, reference_view: view };
    })
  );
  const media = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
  const errors = results.filter((r) => r.status === "rejected").map((r) => r.reason?.message || String(r.reason));
  for (const e of errors) await logGenerationError(brand.id, "reference-shots", null, e);
  if (!media.length) return Response.json({ error: "No reference shots came back: " + friendlyError(errors[0]) }, { status: 502 });
  return Response.json({ media, errors });
}
