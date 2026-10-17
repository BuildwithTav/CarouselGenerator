import { supabaseAdmin, BUCKET, SIGNED_URL_TTL_SECONDS } from "./dashboard";
import { imagePrompt, lockModelDescription, SHOT_VARIETY } from "./contentAi";
import { themeOf, characterOf } from "./brandTemplate";
import { directShots, selectReferences, writeShotPrompts, assemblePrompt, qaImage, judgeQa, plainPrompts } from "./visualPipeline";

// Shared AI photo generation — used by /api/content/generate-image (driven
// from the browser, one slide at a time) and the X content engine (driven
// from a cron with no browser to call that route from).
//
// The image model is set by PHOTO_MODEL / RETRY_MODEL below, chosen from
// Tav's blind model test. FLUX models reject this brand's content outright.
//
// Brands with a fixed character (Sky High Soles) go through the staged
// visual pipeline (visualPipeline.js): director → reference selection →
// prompt writer → generation with the same 2-4 identity references on every
// attempt → vision QA. QA hard-rejects only obvious failures (feet count,
// shoe or tights colour, a visible face, text in the image). It retries at
// most once, and only for a face, text or wrong colours (feet problems
// rarely came right on a retry), then keeps the best attempt flagged
// "Check this" so a post never loses its photo. Every
// attempt is logged with its cost in image_attempts.
//
// Brands without a character (HealthCode) keep the original single-prompt
// path below (generateMatchingPhoto's legacy branch).
const TIMEOUT_MS = 110000;

// Image models the photo pipeline can use, with the request settings and
// prices from Tav's blind model test (Oct 2026, model_tests table). `edit`
// takes reference photos, `text` is used when there are none.
export const PHOTO_MODELS = {
  "nano-banana-pro": { text: "fal-ai/nano-banana-pro", edit: "fal-ai/nano-banana-pro/edit", settings: { aspect_ratio: "4:5", resolution: "2K", output_format: "jpeg" }, cost: () => 0.15 },
  "nano-banana-2": { text: "fal-ai/nano-banana-2", edit: "fal-ai/nano-banana-2/edit", settings: { aspect_ratio: "4:5", resolution: "1K", output_format: "jpeg" }, cost: () => 0.08 },
  "seedream-5-pro": { text: "bytedance/seedream/v5/pro/text-to-image", edit: "bytedance/seedream/v5/pro/edit", settings: { image_size: { width: 1360, height: 1700 }, output_format: "jpeg" }, cost: (refs) => 0.0675 + 0.0045 * Math.max(0, refs - 1), timeoutMs: 170000 },
  "seedream-4.5": { text: "fal-ai/bytedance/seedream/v4.5/text-to-image", edit: "fal-ai/bytedance/seedream/v4.5/edit", settings: { image_size: { width: 1920, height: 2400 }, max_images: 1 }, cost: () => 0.04 },
};
// Sky High Soles' photos: the model for the first try, and for the one
// retry. The blind test (5 scenes) tied Seedream 5 Pro and Nano Banana 2 on
// 2 wins each, both passing every photo check at about $0.08, with Nano
// Banana Pro on 0 wins at $0.15. Seedream goes first for its sharper image
// (1360x1704, enough for a 1080x1350 slide); the retry switches model so it
// isn't the same model repeating the same mistake. The original
// single-prompt path (HealthCode, her reference pack) stays on
// LEGACY_MODEL, which wasn't part of the test.
export const PHOTO_MODEL = "seedream-5-pro";
export const RETRY_MODEL = "nano-banana-2";
const LEGACY_MODEL = "nano-banana-pro";

// How Sky High photos are planned. "plain" (Tav, Oct 2026: "strip back all
// the reference images and prompts"): one short ChatGPT-style request per
// photo, no reference photos, no forced poses or camera angles. "staged" is
// the earlier director + references + long prompt pipeline, kept intact so
// it can come back with this one line (her starred photos are untouched).
export const PHOTO_PIPELINE = "plain";
const MAX_ATTEMPTS = 2; // the first try plus at most 1 retry (caps the worst case)
const DEFAULT_BUDGET_MS = 170000; // no new attempt starts after this

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

// Every generation attempt, whether it worked or not, so pass rates and
// spend can be checked and the QA thresholds adjusted. Never throws.
async function logAttempt(row) {
  try {
    await supabaseAdmin().from("image_attempts").insert(row);
  } catch (e) {
    console.error("Couldn't log image attempt:", e.message);
  }
}

// ── References ───────────────────────────────────────────────────────────
// The brand's approved identity references (starred photos), newest first.
export async function loadReferenceRows(brandId) {
  const { data, error } = await supabaseAdmin()
    .from("brand_media")
    .select("id, storage_path, reference_view")
    .eq("brand_id", brandId)
    .eq("is_reference", true)
    .eq("file_type", "image")
    .order("uploaded_at", { ascending: false })
    .limit(12);
  if (error) {
    console.error("Couldn't load reference photos:", error.message);
    return [];
  }
  return data || [];
}

export async function signedUrlsFor(rows) {
  const supabase = supabaseAdmin();
  const urls = await Promise.all(rows.map(async (r) => {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(r.storage_path, SIGNED_URL_TTL_SECONDS);
    return data?.signedUrl || null;
  }));
  return urls.filter(Boolean);
}

// Signed URLs for the brand's starred references (legacy path).
export async function loadReferenceUrls(brandId) {
  return signedUrlsFor((await loadReferenceRows(brandId)).slice(0, 4));
}

// Short descriptions of the brand's last 6 AI photos, so plain prompts can
// look different from them. Older staged photos describe their shot instead.
async function recentPrompts(brandId) {
  const { data } = await supabaseAdmin()
    .from("brand_media")
    .select("shot")
    .eq("brand_id", brandId)
    .not("shot", "is", null)
    .order("uploaded_at", { ascending: false })
    .limit(6);
  return (data || []).map(({ shot: s }) => s?.scene?.description || [s?.shot?.body_position, s?.shot?.view, s?.shot?.crop, s?.scene?.setting].filter(Boolean).join(", ")).filter(Boolean).map((t) => t.slice(0, 300));
}

// Shot specs of the brand's last 8 accepted AI images, for novelty.
async function recentShots(brandId) {
  const { data } = await supabaseAdmin()
    .from("brand_media")
    .select("shot")
    .eq("brand_id", brandId)
    .not("shot", "is", null)
    .order("uploaded_at", { ascending: false })
    .limit(8);
  return (data || []).map((r) => r.shot?.shot).filter(Boolean);
}

// ── Generation ───────────────────────────────────────────────────────────
export function modelEndpoint(modelKey, refCount) {
  const m = PHOTO_MODELS[modelKey];
  return refCount > 0 ? m.edit : m.text;
}

async function generateOnce(promptText, referenceUrls = [], modelKey = PHOTO_MODEL) {
  const m = PHOTO_MODELS[modelKey];
  const useRefs = referenceUrls.length > 0;
  const id = modelEndpoint(modelKey, referenceUrls.length);
  const body = {
    prompt: promptText,
    ...(useRefs ? { image_urls: referenceUrls } : {}),
    num_images: 1,
    ...m.settings,
  };
  const out = await falGenerate(id, body, { timeoutMs: m.timeoutMs || TIMEOUT_MS });
  return { ...out, costUsd: m.cost(referenceUrls.length), model: useRefs ? `${id}, ${referenceUrls.length} ref${referenceUrls.length === 1 ? "" : "s"}` : id };
}

// One synchronous fal call for any image endpoint, returning the downloaded
// image. Also used by the model comparison test (modelTest.js).
// fal allows 10 requests at once per account; a 429 for that limit isn't
// charged, so it waits and tries again rather than failing the photo.
const BUSY_WAITS_MS = [4000, 8000];
export async function falGenerate(id, body, { timeoutMs = TIMEOUT_MS } = {}) {
  let res;
  for (let i = 0; ; i++) {
    res = await fetchWithTimeout(`https://fal.run/${id}`, {
      method: "POST",
      headers: { Authorization: `Key ${process.env.FAL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, timeoutMs);
    if (res.status !== 429 || i >= BUSY_WAITS_MS.length) break;
    await new Promise((r) => setTimeout(r, BUSY_WAITS_MS[i]));
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`${id} ${res.status}: ${text.slice(0, 300)}`);
    err.charged = false;
    throw err;
  }
  const out = await res.json();
  const url = out?.images?.[0]?.url || out?.image?.url;
  if (!url) throw new Error(`${id} returned no image`);

  const imgRes = await fetchWithTimeout(url, {}, 15000);
  if (!imgRes.ok) throw new Error("Could not download the generated image");
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  if (buffer.length < MIN_IMAGE_BYTES) {
    const err = new Error(`blank/blocked image (${buffer.length} bytes)`);
    err.charged = true;
    throw err;
  }
  return { buffer, url, width: out?.images?.[0]?.width || null, height: out?.images?.[0]?.height || null };
}

async function saveImage(brand, buffer, { note, shot = null, qa = null, needsCheck = false }) {
  const supabase = supabaseAdmin();
  const storagePath = `${brand.id}/gen-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
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
      note: String(note || "").slice(0, 1000),
      shot,
      qa,
      needs_check: needsCheck,
    })
    .select()
    .single();
  if (insErr) throw new Error(insErr.message);
  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  return { ...row, url: signed?.signedUrl || null };
}

// ── Planned (character) pipeline ─────────────────────────────────────────
// Plans a set of photos: director → per-shot references → prompt writer.
// `texts` are scene/slide texts — the only copy that enters the visual
// stages, and only the director reads it.
export async function planPhotos(brand, { texts, lockedContinuity = null, avoidShots = [], textZone = null, source = "plan", pipeline = PHOTO_PIPELINE }) {
  if (pipeline === "plain") return planPlainPhotos(brand, { texts, lockedContinuity, avoidShots, textZone, source });
  const [refs, recent] = await Promise.all([loadReferenceRows(brand.id), recentShots(brand.id)]);
  const directed = await directShots(brand, { texts, recentShots: recent, lockedContinuity, avoidShots });
  const { prompts, costUsd: writeCost } = await writeShotPrompts(brand, { continuity: directed.continuity, items: directed.shots, textZone });
  await logAttempt({ brand_id: brand.id, source, kind: "plan", claude_cost_usd: (directed.costUsd || 0) + (writeCost || 0) });
  return {
    continuity: directed.continuity,
    items: directed.shots.map((s, i) => ({
      scene: s.scene,
      shot: s.shot,
      reason: s.reason,
      prompt: prompts[i],
      referenceIds: selectReferences(refs, s.shot, directed.continuity),
    })),
  };
}

// Plain mode: one short request per photo, no references. A plan item has
// the same shape as a staged one so the rest of the pipeline (generation,
// photo check, carousels) works unchanged; the prompt doubles as the scene
// the photo check compares against.
async function planPlainPhotos(brand, { texts, lockedContinuity, avoidShots, textZone, source }) {
  const keep = lockedContinuity?.look || (lockedContinuity?.setting ? `${lockedContinuity.setting}; ${lockedContinuity.wardrobe || ""}; ${lockedContinuity.lighting || ""}` : null);
  const avoid = (avoidShots || []).map((s) => s?.prompt || [s?.body_position, s?.view, s?.crop].filter(Boolean).join(", ")).filter(Boolean);
  const recent = await recentPrompts(brand.id);
  const { prompts, costUsd } = await plainPrompts(brand, { texts, recent, keep, avoid, textZone });
  await logAttempt({ brand_id: brand.id, source, kind: "plan", claude_cost_usd: costUsd || 0 });
  return {
    continuity: { mode: "plain", look: lockedContinuity?.look || prompts[0] },
    items: prompts.map((prompt) => ({ plain: true, scene: { description: prompt }, shot: { prompt }, reason: "", prompt, referenceIds: [] })),
  };
}

// Generates one planned photo with QA. Every attempt uses the same
// references; a retry only adds the previous attempt's corrections. Throws
// only if no attempt produced an image at all.
export async function generatePlannedPhoto(brand, { item, continuity, previousUrl = null, source = "photo", budgetMs = DEFAULT_BUDGET_MS, noteLabel = "AI" }) {
  if (!process.env.FAL_API_KEY) throw new Error("FAL_API_KEY is not set");
  const started = Date.now();
  const allRefs = await loadReferenceRows(brand.id);
  const refRows = (item.referenceIds || []).map((id) => allRefs.find((r) => r.id === id)).filter(Boolean);
  const refUrls = await signedUrlsFor(refRows);
  // References were selected but none could be loaded: block rather than
  // silently generating text-only.
  if ((item.referenceIds || []).length && !refUrls.length) throw new Error("Her reference photos couldn't be loaded — check the reference pack in the X tab");

  // A plain prompt doesn't fix how many feet show, so the check doesn't either.
  const expectedFeet = item.plain ? null : (item.scene?.expected_feet_count || 2);
  const laterSlide = !!previousUrl;
  let corrections = [];
  let best = null;
  const failures = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1 && Date.now() - started > budgetMs) break;
    const promptText = assemblePrompt(item.prompt, { hasReferences: refUrls.length > 0, corrections });
    const modelKey = attempt === 1 ? PHOTO_MODEL : RETRY_MODEL;
    let gen;
    try {
      gen = await generateOnce(promptText, refUrls, modelKey);
    } catch (e) {
      failures.push(e.message);
      await logAttempt({ brand_id: brand.id, source, attempt, model: modelEndpoint(modelKey, refUrls.length), reference_count: refUrls.length, generated: false, error: e.message.slice(0, 500), fal_cost_usd: e.charged ? PHOTO_MODELS[modelKey].cost(refUrls.length) : 0 });
      continue;
    }

    let qa = null, verdict = { pass: true, hard: [], soft: [], score: 0 }, qaCost = 0;
    try {
      const out = await qaImage(brand, { candidateUrl: gen.url, previousUrl, scene: item.scene, shot: item.shot, continuity });
      qa = out.qa;
      qaCost = out.costUsd || 0;
      verdict = judgeQa(qa, { expectedFeet, laterSlide });
    } catch (e) {
      // The checker itself failing (or declining) never costs the post its
      // photo: the image is kept unchecked and Tav reviews it as normal.
      qa = { error: e.message.slice(0, 300) };
      qaCost = e.costUsd || 0;
    }
    await logAttempt({ brand_id: brand.id, source, attempt, model: gen.model, reference_count: refUrls.length, generated: true, qa_pass: qa?.error ? null : verdict.pass, qa_hard_fails: verdict.hard, qa_scores: qa, fal_cost_usd: gen.costUsd, claude_cost_usd: qaCost });

    const candidate = { ...gen, qa, verdict, attempt, promptText };
    if (!best || verdict.score > best.verdict.score) best = candidate;
    if (verdict.pass) { best = candidate; break; }
    if (!verdict.retry) break; // a retry wouldn't fix this: flag it instead of paying again
    corrections = (qa?.corrections || []).length ? qa.corrections : verdict.hard.map((h) => `fix: ${h}`);
  }

  if (!best) throw new Error("Image generation failed: " + failures.join(" | "));
  const needsCheck = !best.verdict.pass;
  const checkReason = needsCheck ? `Check this: ${best.verdict.hard.join(", ")}` : null;
  const media = await saveImage(brand, best.buffer, {
    note: `${noteLabel} (${best.model}, attempt ${best.attempt}): ${best.promptText}`,
    shot: { scene: item.scene, shot: item.shot, mode: continuity?.mode, referenceIds: item.referenceIds || [] },
    qa: best.qa ? { ...best.qa, verdict: best.verdict } : null,
    needsCheck,
  });
  return { media, prompt: best.promptText, model: best.model, needsCheck, checkReason };
}

// ── Entry point used by both routes ──────────────────────────────────────
// Character brands with no custom prompt run the planned pipeline for one
// photo. A custom prompt, or a brand without a character, runs the original
// single-prompt path — with the same references on every attempt.
// `useReferences: false` skips references (reference-pack generation from
// the description alone, when no references exist yet).
export async function generateMatchingPhoto(brand, { slideText, idea, style, prompt: customPrompt, textZone, modelNote: incomingModelNote, useReferences = true, note: noteLabel, shotIndex, source = "photo" } = {}) {
  if (!process.env.FAL_API_KEY) throw new Error("FAL_API_KEY is not set");

  if (characterOf(brand) && !String(customPrompt || "").trim()) {
    const plan = await planPhotos(brand, { texts: [slideText || idea || ""], textZone: textZone || null, source });
    return generatePlannedPhoto(brand, { item: plan.items[0], continuity: plan.continuity, source, noteLabel: noteLabel || "AI" });
  }

  const theme = themeOf(brand);
  let modelNote = String(incomingModelNote || "").trim();
  let prompt = String(customPrompt || "").trim();
  if (!prompt) {
    if (!modelNote) {
      try { modelNote = await lockModelDescription(brand); } catch (e) { console.error("Model description failed:", e.message); }
    }
    const shot = Number.isInteger(shotIndex) ? SHOT_VARIETY[((shotIndex % SHOT_VARIETY.length) + SHOT_VARIETY.length) % SHOT_VARIETY.length] : null;
    ({ prompt } = await imagePrompt(brand, { slideText, idea, style, direction: theme.ai_style, textZone: textZone || "bottom", modelNote, shot }));
  }
  if (!prompt) throw new Error("Could not write an image prompt");

  const refs = useReferences ? await loadReferenceUrls(brand.id) : [];
  const promptText = refs.length ? assemblePrompt(prompt, { hasReferences: true }) : prompt;
  let gen;
  const failures = [];
  for (let attempt = 1; attempt <= 2 && !gen; attempt++) {
    try {
      gen = await generateOnce(promptText, refs, LEGACY_MODEL);
      await logAttempt({ brand_id: brand.id, source, attempt, model: gen.model, reference_count: refs.length, generated: true, fal_cost_usd: gen.costUsd });
    } catch (e) {
      console.error(`Image generation attempt ${attempt} failed:`, e.message);
      failures.push(e.message);
      await logAttempt({ brand_id: brand.id, source, attempt, model: modelEndpoint(LEGACY_MODEL, refs.length), reference_count: refs.length, generated: false, error: e.message.slice(0, 500), fal_cost_usd: e.charged ? PHOTO_MODELS[LEGACY_MODEL].cost(refs.length) : 0 });
    }
  }
  if (!gen) throw new Error("Image generation failed: " + failures.join(" | "));
  const media = await saveImage(brand, gen.buffer, { note: `${noteLabel || "AI"} (${gen.model}): ${promptText}` });
  return { media, prompt: promptText, model: gen.model, modelNote, needsCheck: false, checkReason: null };
}
