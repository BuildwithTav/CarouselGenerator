import { supabaseAdmin, BUCKET, SIGNED_URL_TTL_SECONDS } from "./dashboard";
import { imagePrompt, lockModelDescription } from "./contentAi";
import { themeOf } from "./brandTemplate";

// Shared AI photo generation — used by /api/content/generate-image (driven
// from the browser, one slide at a time) and the X content engine (driven
// from a cron with no browser to call that route from). Both need the exact
// same thing: write a prompt that matches a specific piece of text, generate
// the photo, save it to the brand's media library like any other upload.
//
// Deliberately simple: one model (Nano Banana Pro at 2K), a positive-only
// prompt (see PROMPT_RULES in contentAi.js), and no AI vision check on the
// result. A vision QA gate was tried and passed 0 of 9+ real generations
// while billing both APIs for every rejected attempt — every draft already
// gets a manual look before it posts, which is the real quality gate.
// FLUX models were also tried as fallbacks and their content checkers
// reject this brand's style outright, so there's no fallback model.
const MODEL = { id: "fal-ai/nano-banana-pro", timeoutMs: 110000, body: (prompt) => ({ prompt, aspect_ratio: "4:5", num_images: 1, resolution: "2K", output_format: "jpeg" }) };

// One retry, only for a hard failure (API error, timeout, blank image) —
// never because of how a good image looks.
const MAX_ATTEMPTS = 2;

// A real 2K photo is consistently hundreds of KB. A safety-filter block
// comes back as a normal 200 with a tiny near-blank image, so only the
// downloaded size gives it away.
const MIN_IMAGE_BYTES = 50000;

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

async function generateOnce(prompt) {
  const res = await fetchWithTimeout(`https://fal.run/${MODEL.id}`, {
    method: "POST",
    headers: { Authorization: `Key ${process.env.FAL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(MODEL.body(prompt)),
  }, MODEL.timeoutMs);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${MODEL.id} ${res.status}: ${text.slice(0, 300)}`);
  }
  const out = await res.json();
  const url = out?.images?.[0]?.url || out?.image?.url;
  if (!url) throw new Error(`${MODEL.id} returned no image`);

  const imgRes = await fetchWithTimeout(url, {}, 15000);
  if (!imgRes.ok) throw new Error("Could not download the generated image");
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  if (buffer.length < MIN_IMAGE_BYTES) throw new Error(`blank/blocked image (${buffer.length} bytes)`);
  return buffer;
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
  if (!prompt) {
    if (!modelNote) {
      try { modelNote = await lockModelDescription(brand); } catch (e) { console.error("Model description failed:", e.message); }
    }
    ({ prompt } = await imagePrompt(brand, { slideText, idea, style, direction: theme.ai_style, textZone: textZone || "bottom", modelNote }));
  }
  if (!prompt) throw new Error("Could not write an image prompt");

  let buffer;
  const failures = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !buffer; attempt++) {
    try {
      buffer = await generateOnce(prompt);
    } catch (e) {
      console.error(`Image generation attempt ${attempt} failed:`, e.message);
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
      note: `AI (${MODEL.id}): ${prompt}`.slice(0, 1000),
    })
    .select()
    .single();
  if (insErr) throw new Error(insErr.message);

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  return { media: { ...row, url: signed?.signedUrl || null }, prompt, model: MODEL.id, modelNote };
}
