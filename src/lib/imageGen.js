import { supabaseAdmin, BUCKET, SIGNED_URL_TTL_SECONDS } from "./dashboard";
import { imagePrompt, lockModelDescription, SHOT_VARIETY } from "./contentAi";
import { themeOf, characterOf } from "./brandTemplate";
import { directShots, selectReferences, writeShotPrompts, assemblePrompt, qaImage, judgeQa } from "./visualPipeline";

// Shared AI photo generation — used by /api/content/generate-image (driven
// from the browser, one slide at a time) and the X content engine (driven
// from a cron with no browser to call that route from).
//
// One image model only: Nano Banana Pro at 2K, 4:5. FLUX models reject this
// brand's content outright, so there's no fallback model.
//
// Brands with a fixed character (Sky High Soles) go through the staged
// visual pipeline (visualPipeline.js): director → reference selection →
// prompt writer → generation with the same 2-4 identity references on every
// attempt → vision QA. QA hard-rejects only obvious failures (feet count,
// shoe or tights colour, a visible face, text in the image), retries at most
// once with the last attempt's corrections, and otherwise keeps the best
// attempt flagged "Check this" so a post never loses its photo. Every
// attempt is logged with its cost in image_attempts.
//
// Brands without a character (HealthCode) keep the original single-prompt
// path below (generateMatchingPhoto's legacy branch).
const MODEL_ID = "fal-ai/nano-banana-pro";
const EDIT_ID = "fal-ai/nano-banana-pro/edit";
const TIMEOUT_MS = 110000;
const FAL_COST_USD = 0.15; // per 2K image, edit or text-to-image
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

async function signedUrlsFor(rows) {
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
async function generateOnce(promptText, referenceUrls = []) {
  const useRefs = referenceUrls.length > 0;
  const id = useRefs ? EDIT_ID : MODEL_ID;
  const body = {
    prompt: promptText,
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
  return { buffer, url, model: useRefs ? `${id}, ${referenceUrls.length} ref${referenceUrls.length === 1 ? "" : "s"}` : id };
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
export async function planPhotos(brand, { texts, lockedContinuity = null, avoidShots = [], textZone = null, source = "plan" }) {
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

  const expectedFeet = item.scene?.expected_feet_count || 2;
  const laterSlide = !!previousUrl;
  let corrections = [];
  let best = null;
  const failures = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1 && Date.now() - started > budgetMs) break;
    const promptText = assemblePrompt(item.prompt, { hasReferences: refUrls.length > 0, corrections });
    let gen;
    try {
      gen = await generateOnce(promptText, refUrls);
    } catch (e) {
      failures.push(e.message);
      await logAttempt({ brand_id: brand.id, source, attempt, model: refUrls.length ? EDIT_ID : MODEL_ID, reference_count: refUrls.length, generated: false, error: e.message.slice(0, 500), fal_cost_usd: e.charged ? FAL_COST_USD : 0 });
      continue;
    }

    let qa = null, verdict = { pass: true, hard: [], soft: [], score: 0 }, qaCost = 0;
    try {
      const out = await qaImage(brand, { candidateUrl: gen.url, referenceUrls: refUrls, previousUrl, scene: item.scene, shot: item.shot, continuity });
      qa = out.qa;
      qaCost = out.costUsd || 0;
      verdict = judgeQa(qa, { expectedFeet, laterSlide });
    } catch (e) {
      // The checker itself failing (or declining) never costs the post its
      // photo: the image is kept unchecked and Tav reviews it as normal.
      qa = { error: e.message.slice(0, 300) };
      qaCost = e.costUsd || 0;
    }
    await logAttempt({ brand_id: brand.id, source, attempt, model: gen.model, reference_count: refUrls.length, generated: true, qa_pass: qa?.error ? null : verdict.pass, qa_hard_fails: verdict.hard, qa_scores: qa, fal_cost_usd: FAL_COST_USD, claude_cost_usd: qaCost });

    const candidate = { ...gen, qa, verdict, attempt, promptText };
    if (!best || verdict.score > best.verdict.score) best = candidate;
    if (verdict.pass) { best = candidate; break; }
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
      gen = await generateOnce(promptText, refs);
      await logAttempt({ brand_id: brand.id, source, attempt, model: gen.model, reference_count: refs.length, generated: true, fal_cost_usd: FAL_COST_USD });
    } catch (e) {
      console.error(`Image generation attempt ${attempt} failed:`, e.message);
      failures.push(e.message);
      await logAttempt({ brand_id: brand.id, source, attempt, model: refs.length ? EDIT_ID : MODEL_ID, reference_count: refs.length, generated: false, error: e.message.slice(0, 500), fal_cost_usd: e.charged ? FAL_COST_USD : 0 });
    }
  }
  if (!gen) throw new Error("Image generation failed: " + failures.join(" | "));
  const media = await saveImage(brand, gen.buffer, { note: `${noteLabel || "AI"} (${gen.model}): ${promptText}` });
  return { media, prompt: promptText, model: gen.model, modelNote, needsCheck: false, checkReason: null };
}
