import { dashboardAuthorized, unauthorized } from "@/lib/dashboard";
import { supabaseAdmin } from "@/lib/dashboard";
import { generateMatchingPhoto } from "@/lib/imageGen";
import { logGenerationError, friendlyError } from "@/lib/genLog";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Generates one AI photo for a slide, saves it to the brand's media library
// (so it gets use-count tracking like any upload) and returns the media row.
// Body: { brandId, slideText, idea, style: "editorial"|"candid", prompt?, textZone? }
// Passing `prompt` skips the prompt-writing step and uses it verbatim.
// The actual generation lives in src/lib/imageGen.js, shared with the X
// content engine (which has no browser to call this route from).
export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const { brandId, slideText, idea, style, prompt, textZone, modelNote } = await req.json();
  if (!brandId) return Response.json({ error: "brandId is required" }, { status: 400 });
  const supabase = supabaseAdmin();

  const { data: brand, error: bErr } = await supabase.from("brands").select("*").eq("id", brandId).single();
  if (bErr || !brand) return Response.json({ error: "Brand not found" }, { status: 404 });

  try {
    const result = await generateMatchingPhoto(brand, { slideText, idea, style, prompt, textZone, modelNote });
    return Response.json(result);
  } catch (e) {
    await logGenerationError(brand.id, "generate-image", null, e.message);
    return Response.json({ error: friendlyError(e.message) }, { status: 502 });
  }
}
