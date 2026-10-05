import { supabaseAdmin, BUCKET, SIGNED_URL_TTL_SECONDS } from "./dashboard";
import { imagePrompt, lockModelDescription } from "./contentAi";
import { themeOf } from "./brandTemplate";

// Shared AI photo generation — used by /api/content/generate-image (driven
// from the browser, one slide at a time) and the X content engine (driven
// from a cron with no browser to call that route from). Both need the exact
// same thing: write a prompt that matches a specific piece of text, generate
// the photo, save it to the brand's media library like any other upload.

// Nano Banana Pro (Gemini 3 Pro Image) is strongest on anatomy and natural
// skin; FLUX 1.1 Pro Ultra is the fallback if it errors or refuses.
const MODELS = [
  // 4K was tried for quality, but it pushed a single photo's generation
  // time past this route's 45s soft deadline on its own — with a hard 60s
  // ceiling on the whole request that can't be verified or raised from here
  // (see x-content/route.js), reliably finishing within budget matters more
  // than the resolution bump right now. Revisit if there's ever more time
  // to work with.
  { id: "fal-ai/nano-banana-pro", body: (prompt) => ({ prompt, aspect_ratio: "4:5", num_images: 1, resolution: "2K", output_format: "jpeg" }) },
  // safety_tolerance is FLUX's own 1 (strictest) to 6 (most permissive) scale.
  // Keep this at the strict end — brand photos must never be explicit.
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

// Writes an AI image prompt matching `slideText` (or uses `prompt` verbatim
// if given), generates the photo, uploads it to the brand's media library
// (so it gets use-count tracking like any other photo), and returns the
// resulting brand_media row. Throws on failure — callers decide how to
// handle that (skip this slide, fall back to a library photo, etc).
export async function generateMatchingPhoto(brand, { slideText, idea, style, prompt: customPrompt, textZone, modelNote: incomingModelNote } = {}) {
  if (!process.env.FAL_API_KEY) throw new Error("FAL_API_KEY is not set");
  const supabase = supabaseAdmin();
  const theme = themeOf(brand);

  let modelNote = String(incomingModelNote || "").trim();
  let prompt = String(customPrompt || "").trim();
  let negative = "";
  if (!prompt) {
    if (!modelNote) {
      try { modelNote = await lockModelDescription(brand); } catch (e) { console.error("Model description failed:", e.message); }
    }
    ({ prompt, negative } = await imagePrompt(brand, { slideText, idea, style, direction: theme.ai_style, textZone: textZone || "bottom", modelNote }));
  }
  if (!prompt) throw new Error("Could not write an image prompt");
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
  if (!imageUrl) throw new Error("Image generation failed: " + failures.join(" | "));

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error("Could not download the generated image");
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const storagePath = `${brand.id}/gen-${Date.now()}.jpg`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, { contentType: "image/jpeg", upsert: false });
  if (upErr) throw new Error(upErr.message);

  const { data: row, error: insErr } = await supabase
    .from("brand_media")
    .insert({
      brand_id: brand.id,
      storage_path: storagePath,
      file_type: "image",
      original_filename: `ai-${Date.now()}.jpg`,
      mime_type: "image/jpeg",
      size_bytes: buffer.length,
      note: `AI (${usedModel}): ${prompt}`.slice(0, 1000),
    })
    .select()
    .single();
  if (insErr) throw new Error(insErr.message);

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  return { media: { ...row, url: signed?.signedUrl || null }, prompt, model: usedModel, modelNote };
}
