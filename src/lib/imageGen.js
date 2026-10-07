import { supabaseAdmin, BUCKET, SIGNED_URL_TTL_SECONDS } from "./dashboard";
import { imagePrompt, lockModelDescription, reviewGeneratedImage } from "./contentAi";
import { themeOf } from "./brandTemplate";

// Shared AI photo generation — used by /api/content/generate-image (driven
// from the browser, one slide at a time) and the X content engine (driven
// from a cron with no browser to call that route from). Both need the exact
// same thing: write a prompt that matches a specific piece of text, generate
// the photo, save it to the brand's media library like any other upload.

// Nano Banana Pro (Gemini 3 Pro Image) is the only model this brand's
// content actually works with — confirmed three separate ways: FLUX.2
// Pro's own content checker has returned a silent blocked-black image, an
// explicit "Failed" with no image at all, and a flat 422 rejecting the
// *prompt text itself* before any generation even started. That's not
// "sometimes unreliable", that's a model whose content policy this brand's
// sensual/suggestive-but-tasteful style doesn't clear, so it's gone
// entirely rather than kept as a fallback that was never going to work.
//
// Three attempts, not one: this brand's spec is genuinely demanding (no
// face ever, feet always the compositional focus, exact anatomy, a tight
// crop on any implied second person) and a single roll against all of
// that at once was landing basically nothing - not because the QA gate
// was wrong (its catches have been correct), but because one failed
// attempt meant the whole slot failed with no second chance. 2K keeps
// three attempts cheap and fast enough that this is still worth it.
//
// 2K, not 4K: every real problem reported (face visible, wrong anatomy,
// wrong gender on a background prop, feet not the focus) was never a
// resolution issue — it's exactly what the vision QA check below catches.
// 4K was the expensive, slow part with no real payoff for how these
// actually get viewed (X doesn't display photos at print resolution).
const NANO_BANANA_PRO = { id: "fal-ai/nano-banana-pro", timeoutMs: 35000, body: (prompt) => ({ prompt, aspect_ratio: "4:5", num_images: 1, resolution: "2K", output_format: "jpeg" }) };
const MODELS = [NANO_BANANA_PRO, NANO_BANANA_PRO, NANO_BANANA_PRO];

// A real photo from either model is consistently hundreds of KB or more.
// A safety-filter block (seen in production: Flux returning the exact same
// 10372-byte file for three completely different prompts) comes back as a
// normal 200 response with a real image URL, so nothing above catches it -
// only the actual downloaded size gives it away.
const MIN_IMAGE_BYTES = 50000;

// Neither fal.ai call below had a timeout at all — a single slow provider
// response (no error, just slow) could silently eat the entire per-slot
// budget in x-content/route.js with nothing forcing a fast fallback to the
// second model. These bound each call so a stuck request fails fast instead.
async function fetchWithTimeout(url, opts, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } catch (e) {
    if (e.name === "AbortError") throw new Error(`timed out after ${Math.round(ms / 1000)}s`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function generateWith(model, prompt, negative) {
  const res = await fetchWithTimeout(`https://fal.run/${model.id}`, {
    method: "POST",
    headers: { Authorization: `Key ${process.env.FAL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(model.body(prompt, negative)),
  }, model.timeoutMs);
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
    ? [{ ...MODELS[0], id: process.env.FAL_IMAGE_MODEL }, ...MODELS.filter((m) => m.id !== process.env.FAL_IMAGE_MODEL)]
    : MODELS;
  let buffer, usedModel;
  const failures = [];
  for (const model of models) {
    try {
      const imageUrl = await generateWith(model, fullPrompt, negative);
      const imgRes = await fetchWithTimeout(imageUrl, {}, 15000);
      if (!imgRes.ok) throw new Error("Could not download the generated image");
      const candidate = Buffer.from(await imgRes.arrayBuffer());
      // Catches a safety-filter block: the provider still returns a normal
      // 200 with a real (but near-blank) image URL, so only the actual
      // downloaded size exposes it - see MIN_IMAGE_BYTES above.
      if (candidate.length < MIN_IMAGE_BYTES) throw new Error(`${model.id} returned a suspiciously small image (${candidate.length} bytes) - likely blocked by its safety filter`);
      // Vision QA pass: catches the specific things only ever caught by eye
      // so far — a visible face, the wrong gender on a background prop,
      // broken hand/foot anatomy. Checked against this exact photo's own
      // generated URL, so it sees exactly what the image actually shows.
      const qa = await reviewGeneratedImage(imageUrl, theme.ai_style || "(no brand-specific style set)");
      if (!qa.pass) throw new Error(`${model.id} image failed visual QA: ${qa.reason}`);
      buffer = candidate;
      usedModel = model.id;
      break;
    } catch (e) {
      console.error("Image generation failed:", e.message);
      failures.push(e.message);
    }
  }
  if (!buffer) throw new Error("Image generation failed: " + failures.join(" | "));

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
