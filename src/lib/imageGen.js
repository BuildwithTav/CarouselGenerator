import { supabaseAdmin, BUCKET, SIGNED_URL_TTL_SECONDS } from "./dashboard";
import { imagePrompt, lockModelDescription } from "./contentAi";
import { themeOf } from "./brandTemplate";
import { recentFeedback } from "./feedback";

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
//
// Character consistency: when a brand has reference photos starred ("Her
// look" in the X tab, or ★ in the media library), the same model's edit
// endpoint gets them alongside the prompt, so every photo copies the same
// woman's hair, build, skin, legs and feet instead of re-inventing her from
// text each time. Same model, same price per image.
const MODEL_ID = "fal-ai/nano-banana-pro";
const EDIT_ID = "fal-ai/nano-banana-pro/edit";
const TIMEOUT_MS = 110000;
const MAX_REFERENCES = 4;

// Generic on purpose (this file is shared by every brand): it says what to
// take from the references and that everything else comes from the brief.
const withReferences = (prompt) => `The reference photos show the person in this photo. Keep them exactly as they look in the references: the same skin tone, build, legs, feet and nails, and the same hair whenever hair is in frame. Take only their appearance from the references; the framing, pose, clothing and setting all come from this brief. ${prompt}`;

// Signed URLs for the brand's starred reference photos, newest first.
export async function loadReferenceUrls(brandId) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("brand_media")
    .select("storage_path")
    .eq("brand_id", brandId)
    .eq("is_reference", true)
    .eq("file_type", "image")
    .order("uploaded_at", { ascending: false })
    .limit(MAX_REFERENCES);
  if (error) {
    console.error("Couldn't load reference photos:", error.message);
    return [];
  }
  const urls = await Promise.all((data || []).map(async (r) => {
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(r.storage_path, SIGNED_URL_TTL_SECONDS);
    return signed?.signedUrl || null;
  }));
  return urls.filter(Boolean);
}

// One retry, only for a hard failure (API error, timeout, blank image) —
// never because of how a good image looks. With reference photos the retry
// goes without them, so a reference problem can't cost the post its photo.
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

async function generateOnce(prompt, referenceUrls = []) {
  const useRefs = referenceUrls.length > 0;
  const id = useRefs ? EDIT_ID : MODEL_ID;
  const body = {
    prompt: useRefs ? withReferences(prompt) : prompt,
    ...(useRefs ? { image_urls: referenceUrls } : {}),
    aspect_ratio: "4:5",
    num_images: 1,
    resolution: "2K",
    output_format: "jpeg",
  };
  const res = await fetchWithTimeout(`https://fal.run/${id}`, {
    method: "POST",
    headers: { Authorization: `Key ${process.env.FAL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, TIMEOUT_MS);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${id} ${res.status}: ${text.slice(0, 300)}`);
  }
  const out = await res.json();
  const url = out?.images?.[0]?.url || out?.image?.url;
  if (!url) throw new Error(`${id} returned no image`);

  const imgRes = await fetchWithTimeout(url, {}, 15000);
  if (!imgRes.ok) throw new Error("Could not download the generated image");
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  if (buffer.length < MIN_IMAGE_BYTES) throw new Error(`blank/blocked image (${buffer.length} bytes)`);
  return { buffer, model: useRefs ? `${id}, ${referenceUrls.length} ref${referenceUrls.length === 1 ? "" : "s"}` : id };
}

// Writes an AI image prompt matching `slideText` (or uses `prompt` verbatim
// if given), generates the photo, uploads it to the brand's media library
// (so it gets use-count tracking like any other photo), and returns the
// resulting brand_media row. Throws on failure — callers decide how to
// handle that (skip this slide, fall back to a library photo, etc).
// `useReferences: false` skips the brand's reference photos — used when
// generating new reference shots themselves, which must come from the
// character description alone.
export async function generateMatchingPhoto(brand, { slideText, idea, style, prompt: customPrompt, textZone, modelNote: incomingModelNote, useReferences = true, note: noteLabel } = {}) {
  if (!process.env.FAL_API_KEY) throw new Error("FAL_API_KEY is not set");
  const supabase = supabaseAdmin();
  const theme = themeOf(brand);

  let modelNote = String(incomingModelNote || "").trim();
  let prompt = String(customPrompt || "").trim();
  if (!prompt) {
    if (!modelNote) {
      try { modelNote = await lockModelDescription(brand); } catch (e) { console.error("Model description failed:", e.message); }
    }
    const feedback = await recentFeedback(brand.id);
    ({ prompt } = await imagePrompt(brand, { slideText, idea, style, direction: theme.ai_style, textZone: textZone || "bottom", modelNote, feedback }));
  }
  if (!prompt) throw new Error("Could not write an image prompt");

  const refs = useReferences ? await loadReferenceUrls(brand.id) : [];
  let buffer;
  let usedModel = MODEL_ID;
  const failures = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !buffer; attempt++) {
    try {
      ({ buffer, model: usedModel } = await generateOnce(prompt, attempt === 1 ? refs : []));
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
      note: `${noteLabel || "AI"} (${usedModel}): ${prompt}`.slice(0, 1000),
    })
    .select()
    .single();
  if (insErr) throw new Error(insErr.message);

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  return { media: { ...row, url: signed?.signedUrl || null }, prompt, model: usedModel, modelNote };
}
