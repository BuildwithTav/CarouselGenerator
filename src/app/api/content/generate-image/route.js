import { dashboardAuthorized, unauthorized, supabaseAdmin, BUCKET, SIGNED_URL_TTL_SECONDS } from "@/lib/dashboard";
import { imagePrompt, lockModelDescription } from "@/lib/contentAi";
import { themeOf } from "@/lib/brandTemplate";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Image models on fal.ai, tried in order. Nano Banana Pro (Gemini 3 Pro Image)
// is the strongest on anatomy and natural skin; FLUX 1.1 Pro Ultra is the
// fallback if it errors or refuses. Override the first with FAL_IMAGE_MODEL.
const MODELS = [
  { id: "fal-ai/nano-banana-pro", body: (prompt, negative) => ({ prompt, aspect_ratio: "4:5", num_images: 1, resolution: "2K", output_format: "jpeg" }) },
  // safety_tolerance is FLUX's own 1 (strictest) to 6 (most permissive) scale.
  // Keep this at the strict end — this brand's photos must never be explicit.
  { id: "fal-ai/flux-pro/v1.1-ultra", body: (prompt, negative) => ({ prompt, aspect_ratio: "4:5", num_images: 1, output_format: "jpeg", enable_safety_checker: true, safety_tolerance: "2", raw: true, ...(negative ? { negative_prompt: negative } : {}) }) },
];

async function generateWith(model, prompt, negative) {
  const res = await fetch(`https://fal.run/${model.id}`, {
    method: "POST",
    headers: { Authorization: `Key ${process.env.FAL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(model.body(prompt, negative)),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${model.id} ${res.status}: ${text.slice(0, 300)}`);
  }
  const out = await res.json();
  const url = out?.images?.[0]?.url || out?.image?.url;
  if (!url) throw new Error(`${model.id} returned no image`);
  return url;
}

// Generates one AI photo for a slide, saves it to the brand's media library
// (so it gets use-count tracking like any upload) and returns the media row.
// Body: { brandId, slideText, idea, style: "editorial"|"candid", prompt?, textZone? }
// Passing `prompt` skips the prompt-writing step and uses it verbatim.
export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  if (!process.env.FAL_API_KEY) return Response.json({ error: "FAL_API_KEY is not set" }, { status: 500 });
  const { brandId, slideText, idea, style, prompt: customPrompt, textZone, modelNote: incomingModelNote } = await req.json();
  if (!brandId) return Response.json({ error: "brandId is required" }, { status: 400 });
  const supabase = supabaseAdmin();

  const { data: brand, error: bErr } = await supabase.from("brands").select("*").eq("id", brandId).single();
  if (bErr || !brand) return Response.json({ error: "Brand not found" }, { status: 404 });
  const theme = themeOf(brand);

  // The locked model description keeps the same woman appearing across every
  // photo of one carousel. The caller sends it back on later slides; the
  // first call in a batch gets one generated and hands it back.
  let modelNote = String(incomingModelNote || "").trim();

  let prompt = String(customPrompt || "").trim();
  let negative = "";
  if (!prompt) {
    if (!modelNote) {
      try { modelNote = await lockModelDescription(brand); } catch (e) { console.error("Model description failed:", e.message); }
    }
    try {
      ({ prompt, negative } = await imagePrompt(brand, { slideText, idea, style, direction: theme.ai_style, textZone: textZone || "bottom", modelNote }));
    } catch (e) {
      return Response.json({ error: e.message }, { status: 502 });
    }
  }
  if (!prompt) return Response.json({ error: "Could not write an image prompt" }, { status: 502 });
  // Fold the negative list into the prompt itself too (not just the
  // negative_prompt field some models ignore) so every model sees it.
  const fullPrompt = negative ? `${prompt}\n\nAvoid: ${negative}` : prompt;

  const models = process.env.FAL_IMAGE_MODEL
    ? [{ id: process.env.FAL_IMAGE_MODEL, body: MODELS[0].body }, ...MODELS.filter((m) => m.id !== process.env.FAL_IMAGE_MODEL)]
    : MODELS;
  let imageUrl, usedModel;
  const failures = [];
  for (const model of models) {
    try {
      imageUrl = await generateWith(model, fullPrompt, negative);
      usedModel = model.id;
      break;
    } catch (e) {
      console.error("Image generation failed:", e.message);
      failures.push(e.message);
    }
  }
  if (!imageUrl) return Response.json({ error: "Image generation failed: " + failures.join(" | "), prompt }, { status: 502 });

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return Response.json({ error: "Could not download the generated image", prompt }, { status: 502 });
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const storagePath = `${brandId}/gen-${Date.now()}.jpg`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, { contentType: "image/jpeg", upsert: false });
  if (upErr) return Response.json({ error: upErr.message, prompt }, { status: 500 });

  const { data: row, error: insErr } = await supabase
    .from("brand_media")
    .insert({
      brand_id: brandId,
      storage_path: storagePath,
      file_type: "image",
      original_filename: `ai-${Date.now()}.jpg`,
      mime_type: "image/jpeg",
      size_bytes: buffer.length,
      note: `AI (${usedModel}): ${prompt}`.slice(0, 1000),
    })
    .select()
    .single();
  if (insErr) return Response.json({ error: insErr.message, prompt }, { status: 500 });

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  return Response.json({ media: { ...row, url: signed?.signedUrl || null }, prompt, model: usedModel, modelNote });
}
