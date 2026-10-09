import { askDetailed } from "./contentAi";
import { characterOf } from "./brandTemplate";

// The visual pipeline for brands with a fixed character (Sky High Soles).
// Replaces "one Claude call absorbs everything and writes a prompt" with
// small stages that pass structured data:
//
//   slide/scene text → DIRECTOR (visual facts + shot + carousel continuity)
//                    → REFERENCE SELECTOR (2-4 identity photos for the shot)
//                    → PROMPT WRITER (visual data only, never captions)
//                    → generator + vision QA (imageGen.js)
//
// The prompt writer never receives captions, hashtags, calls to action, the
// brand voice or the slide copy: it can't leak what it never sees. The
// director is the only visual stage that reads slide text, and its output is
// sanitised and validated before anything downstream uses it.
//
// Brands without a fixed character (HealthCode) keep the original
// imagePrompt() path in contentAi.js.

// Planning, prompt writing and the photo check run on Sonnet 5.5: half
// Opus's price, still strong at vision and structured work (Tav's call: cut
// cost, keep quality). The image model is unchanged.
export const PIPELINE_MODEL = "claude-sonnet-5-5";
export const VISUAL_RULES_VERSION = "2.0";

// Permanent visual constraints (versioned config). Tav's recurring rejection
// reasons (face showing, wrong setting, not slim/blonde, wrong shoe colour,
// feet wrong) live here as rules, not as a growing list in every prompt.
const VISUAL_RULES = {
  "sky-high-soles": [
    "Her face is never in the photo. Frame so her head is outside the frame: the top edge of the frame cuts across her waist or hips, her own point of view looking down, a close-up of feet and ankles, or directly behind where the back of her blonde head is the only part of her head in view.",
    "Work uniform: fitted navy pencil skirt, white blouse, sheer tan tights and navy court heels with a mid heel (the same navy as the skirt), or plain navy flats. With the uniform, shoes are always that same navy and tights always sheer tan.",
    "Off duty, tights when worn are sheer tan or nude. Bare feet are fine.",
    "Settings: the aircraft (cabin aisle, jump seat, galley, crew rest), the crew room, the airport (gate, lounge, terminal floor), her home (mirror, bed, sofa, bath) or a pedicure chair. A hotel room or pool only occasionally. Never a bus, taxi, car, train, gym, street or shop.",
    "Her feet are the focal point, sharp and well lit.",
    "Fully clothed above the waist. Elegant and sensual through light, pose and styling, never explicit.",
    "Her own hands are slim and feminine with a French manicure. A partner appears only as a man's hand, at most up to the wrist or forearm, entering from the edge of the frame.",
    "Anything that could carry a photo of a person (ID badge, lanyard card, photo frame, phone screen) is face-down or angled away.",
    "Shoes, insoles, clothing and props are plain and unbranded.",
  ],
};

export function visualRules(brand) {
  return VISUAL_RULES[brand?.slug] || [];
}

export const ANATOMY_BASELINE = "Both complete feet are clearly readable and naturally oriented as a matched left and right pair. Keep them separated enough that each silhouette and toe line is individually clear.";

export const VISUAL_MODES = {
  editorial: "Campaign-like, polished imagery: controlled warm light, deliberate composition. Lens language (35, 50 or 85mm equivalent) only when it defines the perspective or depth.",
  cabin_candid: "A believable on-duty or post-shift moment: modern phone-camera feel, ambient aircraft or terminal light, moderate depth, natural perspective, slight imperfection.",
  lifestyle_intimate: "A home, hotel or pedicure scene: warm practical lamps, close framing, believable high-quality lifestyle photography.",
};

const SHOT_DIMENSIONS = `Shot dimensions (pick one value for each, or a close natural variant):
- distance: extreme detail, tight, medium, wider environmental
- camera_height: floor, ankle, knee, seated eye level, own point of view
- view: top down, three quarter, side profile, straight on feet, directly behind
- body_position: seated, standing, reclining, legs stretched, ankle crossed, knee crossed, one foot raised
- footwear_state: both heels on, one loose, one removed, both beside her, flats, tights only, bare
- emphasis: toe line, arch, hosiery texture, heel slipping, shoe detail, full legs, cabin context`;

// Image identity lock — sent before the scene whenever reference photos are
// attached. References control identity; the brief controls everything else.
export const IDENTITY_LOCK = `IDENTITY LOCK
Use the supplied reference images as the authoritative identity of the same established woman. Preserve her established body proportions, leg shape, ankle shape, foot shape, arch profile, toe proportions, skin tone, nail shape and nail colour.
The references control identity. The scene brief controls pose, camera position, clothing, location and lighting. Do not blend identities, invent a different body type or reinterpret the referenced anatomy.
Create one new photograph of this same established person.`;

export const OUTPUT_LINE = "OUTPUT\nVertical 4 by 5 photograph. No words, captions, signs, logos or added typography.";

// ── Sanitising director output ───────────────────────────────────────────
// Anything copy-like that slips through the director is stripped before it
// reaches the prompt writer: quoted text, hashtags, persuasion/mood words,
// typography and audience directions.
const COPY_WORDS = /\b(flirt\w*|seduc\w*|sexy|sexual\w*|erotic\w*|fetish\w*|teas(?:e|es|ed|ing)|persua\w*|desir(?:e|es|ed|ing|able)|enticing|caption\w*|hashtags?|call to action|typography|headline|overlay text)\b/gi;

export function sanitizeVisual(value) {
  if (Array.isArray(value)) return value.map(sanitizeVisual).filter((v) => v !== "");
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeVisual(v)]));
  }
  if (typeof value !== "string") return value;
  return value
    .replace(/["“”][^"“”]*["“”]/g, "")
    .replace(/#\w+/g, "")
    .replace(COPY_WORDS, "")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const MODES = Object.keys(VISUAL_MODES);
const str = (v, fallback = "") => (typeof v === "string" && v.trim() ? v.trim() : fallback);

// Validates the director's JSON into the exact shape every later stage uses.
export function normalizePlan(raw, count, lockedContinuity = null) {
  const c = raw?.continuity || {};
  const continuity = lockedContinuity || {
    setting: str(c.setting, "aircraft cabin"),
    wardrobe: str(c.wardrobe, "established uniform with sheer tan tights and navy court heels"),
    lighting: str(c.lighting, "warm ambient light"),
    mode: MODES.includes(c.mode) ? c.mode : "cabin_candid",
  };
  const shots = (Array.isArray(raw?.shots) ? raw.shots : []).slice(0, count).map((s) => {
    const scene = s?.scene || {};
    const shot = s?.shot || {};
    const feet = Number(scene.expected_feet_count);
    return {
      scene: {
        setting: str(scene.setting, continuity.setting),
        subject_action: str(scene.subject_action, "seated, relaxing her feet"),
        wardrobe: str(scene.wardrobe, continuity.wardrobe),
        footwear_state: str(scene.footwear_state, str(shot.footwear_state, "both heels on")),
        required_objects: (Array.isArray(scene.required_objects) ? scene.required_objects : []).map((o) => str(o)).filter(Boolean).slice(0, 5),
        expected_feet_count: feet === 1 ? 1 : 2,
      },
      shot: {
        distance: str(shot.distance, "tight"),
        camera_height: str(shot.camera_height, "ankle"),
        view: str(shot.view, "side profile"),
        body_position: str(shot.body_position, "seated"),
        footwear_state: str(shot.footwear_state, str(scene.footwear_state, "both heels on")),
        emphasis: str(shot.emphasis, "clear foot silhouettes"),
      },
      reason: str(s?.score_reason),
    };
  });
  if (shots.length !== count) throw new Error(`Director returned ${shots.length} shots for ${count} scenes`);
  return sanitizeVisual({ continuity, shots });
}

// A coarse composition key, used to compare a shot against recent ones.
export function compositionKey(shot) {
  const n = (s) => String(s || "").toLowerCase().replace(/[^a-z ]/g, "").trim();
  return [n(shot?.distance), n(shot?.camera_height), n(shot?.view), n(shot?.body_position)].join("|");
}

// ── Director: scene extraction + shot direction + continuity ─────────────
// One call per set (a carousel, or an X post's photos). `texts` are the only
// copy the visual pipeline ever reads, and only here. `recentShots` are the
// shot specs of the brand's last 8 accepted images. `lockedContinuity`
// pins setting/wardrobe/light/mode when re-planning one slide of an
// existing carousel.
export async function directShots(brand, { texts, recentShots = [], lockedContinuity = null, avoidShots = [] }) {
  const rules = visualRules(brand);
  const system = `You are the visual director for a faceless photo series. You turn each scene text into observable visual facts and choose the camera shot. You never write captions or prompts.
Permanent visual rules (every shot must obey them):
${rules.map((r) => `- ${r}`).join("\n")}

Visual modes (choose one for the whole set):
${Object.entries(VISUAL_MODES).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

${SHOT_DIMENSIONS}

How to choose:
- The set is one short photographic event: lock the setting, wardrobe, lighting period and mode for the whole set; vary camera position, crop and the next small action from photo to photo. Only change location if the texts clearly move to a new place.
- For each scene, consider several candidate shots and pick the best, weighing: semantic fit with the scene 40%, fit with the set's story order 20%, how well her identity references cover that view 15%, novelty against the recent shots 15%, anatomical simplicity 10%. Novelty is a penalty, not the goal: the shot that best shows the action wins.
- Never repeat a composition (same distance, camera height, view and body position) used by another photo in this set or by any recent shot listed.
- Keep anatomy simple: don't combine crossed ankles, pointed toes, extreme foreshortening, shoe removal and a floor-level camera unless the scene genuinely needs it.
- Translate only the observable event into a plausible photograph. Drop narration, metaphor, mood, persuasion, audience reactions, other people watching, and any wording or lettering. If a scene mentions a place outside the permanent settings, show the moment just before or after it in an allowed setting.
- expected_feet_count is 2 unless the shot is a deliberate one-foot detail.

Reply with JSON only:
{"continuity": {"setting": "...", "wardrobe": "...", "lighting": "...", "mode": "editorial|cabin_candid|lifestyle_intimate"},
 "shots": [{"scene": {"setting": "...", "subject_action": "...", "wardrobe": "...", "footwear_state": "...", "required_objects": ["..."], "expected_feet_count": 2},
            "shot": {"distance": "...", "camera_height": "...", "view": "...", "body_position": "...", "footwear_state": "...", "emphasis": "..."},
            "score_reason": "one short sentence"}]}
Exactly one entry in "shots" per scene, same order. Observable facts only, no quotes.`;

  const user = `${lockedContinuity ? `This set's continuity is already locked; keep it exactly:\n${JSON.stringify(lockedContinuity)}\n\n` : ""}${avoidShots.length ? `Other photos already in this set (don't repeat these compositions):\n${avoidShots.map((s) => `- ${JSON.stringify(s)}`).join("\n")}\n\n` : ""}Recent shots for this brand (most recent first; penalise repeating them):
${recentShots.length ? recentShots.map((s) => `- ${JSON.stringify(s)}`).join("\n") : "- none yet"}

Scenes, in order:
${texts.map((t, i) => `${i + 1}. ${t || "(cover photo for the set)"}`).join("\n")}`;

  const { json, costUsd } = await askDetailed(system, user, { maxTokens: 800 * texts.length + 800, model: PIPELINE_MODEL });
  const plan = normalizePlan(json, texts.length, lockedContinuity);
  return { ...plan, costUsd };
}

// ── Reference selection ──────────────────────────────────────────────────
// Reference pack views: A legs/lower body, B feet from above, C feet low
// side, D uniform + tights + navy heels, E hair/back. Untagged starred
// photos count as general fillers.
export const REFERENCE_VIEWS = {
  A: "Lower body, standing or three quarter",
  B: "Both feet from above",
  C: "Feet and ankles, low side view",
  D: "Uniform, tights and navy heels",
  E: "Hair and back, from behind",
};

export function wantedViews(shot, continuity) {
  const v = `${shot?.view || ""} ${shot?.camera_height || ""}`.toLowerCase();
  const d = String(shot?.distance || "").toLowerCase();
  const wardrobe = `${continuity?.wardrobe || ""} ${shot?.footwear_state || ""}`.toLowerCase();
  const wants = ["A"];
  if (/top down|point of view|pov|above/.test(v)) wants.push("B");
  else if (/behind/.test(v)) wants.push("E");
  else if (/side|floor|ankle|low/.test(v)) wants.push("C");
  else wants.push("C");
  if (/uniform|heel|court|tights|navy/.test(wardrobe) || /medium|wide/.test(d)) wants.push("D");
  return [...new Set(wants)];
}

// Picks 2-4 approved references for a shot. `refs` are starred brand_media
// rows ({ id, reference_view }), newest first. Returns ids in priority order.
export function selectReferences(refs, shot, continuity, max = 4) {
  const pool = (refs || []).filter((r) => r && r.id);
  if (!pool.length) return [];
  const chosen = [];
  const take = (r) => { if (r && !chosen.includes(r.id) && chosen.length < max) chosen.push(r.id); };
  for (const view of wantedViews(shot, continuity)) take(pool.find((r) => r.reference_view === view));
  // Never fewer than 2 when 2 exist: top up with the remaining views, then
  // untagged references.
  const order = ["A", "C", "B", "D", "E"];
  for (const view of order) if (chosen.length < 2) take(pool.find((r) => r.reference_view === view));
  for (const r of pool) if (chosen.length < 2) take(r);
  return chosen;
}

// ── Prompt writer ────────────────────────────────────────────────────────
// Receives structured visual data only: identity notes, permanent rules,
// the mode, continuity and each shot. No brand voice, captions, CTAs,
// hashtags, slide copy or rejection history.
function identityNotes(brand) {
  const c = characterOf(brand);
  if (!c) return "";
  return `Identity notes (use only the features inside the frame; leave out hair when the crop excludes it): ${c.legs}; ${c.feet}; ${c.skin}; ${c.hands}; ${c.hair}.`;
}

export async function writeShotPrompts(brand, { continuity, items, textZone = null }) {
  const rules = visualRules(brand);
  const system = `You write image prompts for Nano Banana Pro, a photorealistic image model, from structured visual facts.
Write the shortest prompt that completely defines each shot, normally 70 to 140 words. Never pad to reach a length.
Order: the framing first (where the frame's edges fall, camera height, view, distance); then her pose, body position and footwear; the setting and required objects; the light and camera feel of the mode.
Translate the facts into one plausible photograph. Don't add people, objects or details the facts don't contain.
Phrase everything positively: describe what is in the photo. Never write "no X", "without X" or "avoid".
Feet: include this sentence, then only the left/right relationship the pose needs (for example "her left ankle rests lightly across her right ankle"): ${ANATOMY_BASELINE}
Name colours explicitly when the uniform is worn: "navy court heels matching her navy skirt" (or "navy flats"), "sheer tan tights".
Use plain visual language. No mood or persuasion words, no captions, quotes or lettering.${textZone ? `\nKeep the ${textZone} of the frame calm and uncluttered.` : ""}
Reply with JSON only: {"prompts": ["...", ...]}, one per item, same order.`;

  const user = `Permanent visual rules:
${rules.map((r) => `- ${r}`).join("\n")}

${identityNotes(brand)}

Mode (${continuity.mode}): ${VISUAL_MODES[continuity.mode] || VISUAL_MODES.cabin_candid}

Continuity for the whole set: ${JSON.stringify({ setting: continuity.setting, wardrobe: continuity.wardrobe, lighting: continuity.lighting })}

Items:
${items.map((it, i) => `${i + 1}. ${JSON.stringify({ scene: it.scene, shot: it.shot, ...(it.corrections?.length ? { corrections_from_last_attempt: it.corrections } : {}) })}`).join("\n")}`;

  const { json, costUsd } = await askDetailed(system, user, { maxTokens: 700 * items.length + 400, model: PIPELINE_MODEL });
  const prompts = (Array.isArray(json.prompts) ? json.prompts : []).map((p) => sanitizeVisual(String(p || "")));
  if (prompts.length !== items.length || prompts.some((p) => !p)) throw new Error("Prompt writer returned an incomplete set");
  return { prompts, costUsd };
}

// The full text sent to the image model: identity lock (only when reference
// photos are attached), the scene prompt, the previous attempt's
// corrections (only those), and the output line.
export function assemblePrompt(prompt, { hasReferences, corrections = [] } = {}) {
  return [
    hasReferences ? IDENTITY_LOCK : null,
    `SCENE\n${prompt}`,
    corrections.length ? `CORRECTIONS FROM THE LAST ATTEMPT\n${corrections.map((c) => `- ${c}`).join("\n")}` : null,
    OUTPUT_LINE,
  ].filter(Boolean).join("\n\n");
}

// ── Vision QA ────────────────────────────────────────────────────────────
// Hard rejection only for obvious failures (Tav's call): extra/missing feet,
// wrong shoe colour, wrong tights colour, a visible face, unintended text.
// Everything else is a soft score used to pick the best attempt and to
// report on — it never triggers a retry on its own.
export const QA_THRESHOLDS = { identity: 0.85, anatomy: 7, photorealism: 7, continuity: 0.8 };

export function judgeQa(qa, { expectedFeet = 2, faceAllowed = false, laterSlide = false } = {}) {
  const hard = [];
  if (!faceAllowed && qa?.face_visible === true) hard.push("face visible");
  const feet = Number(qa?.feet_count);
  if (Number.isFinite(feet) && expectedFeet && feet !== expectedFeet) hard.push(`${feet} feet (expected ${expectedFeet})`);
  if (qa?.wrong_shoe_colour === true) hard.push("wrong shoe colour");
  if (qa?.wrong_tights_colour === true) hard.push("wrong tights colour");
  if (qa?.text_or_lettering_present === true) hard.push("text in image");

  const soft = [];
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
  const identity = num(qa?.identity_match), anatomy = num(qa?.anatomy_score), photo = num(qa?.photorealism_score), cont = num(qa?.continuity_score);
  if (identity !== null && identity < QA_THRESHOLDS.identity) soft.push(`identity ${identity}`);
  if (anatomy !== null && anatomy < QA_THRESHOLDS.anatomy) soft.push(`anatomy ${anatomy}/10`);
  if (photo !== null && photo < QA_THRESHOLDS.photorealism) soft.push(`realism ${photo}/10`);
  if (laterSlide && cont !== null && cont < QA_THRESHOLDS.continuity) soft.push(`continuity ${cont}`);
  if (qa?.left_right_plausible === false) soft.push("left/right feet");
  if (qa?.toes_plausible === false) soft.push("toes");
  if (qa?.feet_clear === false) soft.push("feet unclear");
  if (qa?.wrong_setting === true) soft.push("setting");
  if (qa?.wrong_uniform === true) soft.push("uniform");

  const score = (identity ?? 0.8) * 10 + (anatomy ?? 6) + (photo ?? 6) + (laterSlide ? (cont ?? 0.8) * 5 : 0) - soft.length - hard.length * 100;
  return { pass: hard.length === 0, hard, soft, score };
}

export async function qaImage(brand, { candidateUrl, referenceUrls = [], previousUrl = null, scene, shot, continuity }) {
  const images = [...referenceUrls, ...(previousUrl ? [previousUrl] : []), candidateUrl];
  const n = referenceUrls.length;
  const system = `You are a strict photo checker for a faceless photo series. Inspect the candidate photo against the identity references and the expected scene. Judge only what you can see.
Reply with strict JSON only, no prose:
{"decision": "pass|fail", "face_visible": false, "identity_match": 0.0, "feet_count": 2, "toes_plausible": true, "left_right_plausible": true, "feet_clear": true, "anatomy_score": 0, "photorealism_score": 0, "wrong_uniform": false, "wrong_shoe_colour": false, "wrong_tights_colour": false, "wrong_setting": false, "continuity_score": 0.0, "text_or_lettering_present": false, "corrections": ["..."]}
- identity_match and continuity_score are 0 to 1; anatomy_score and photorealism_score are 0 to 10.
- face_visible: true only if her face (eyes, nose or mouth) is in the photo.
- feet_count: the number of her feet visible in the photo.
- wrong_shoe_colour: true if she wears her work uniform and her shoes are not navy blue (the same navy as the skirt). wrong_tights_colour: true if her tights are anything other than sheer tan or nude.
- text_or_lettering_present: true only for prominent words that draw the eye: a caption, watermark, overlaid text, or a large readable sign or logo. Small brand marks on shoes, insoles, clothing or products, and the small placards and exit signs that belong in an aircraft cabin, do not count.
- corrections: at most 3 short, observable changes for the next attempt (for example "separate the feet so both silhouettes are readable"). Fix the failures above first (face, number of feet, shoe or tights colour, prominent text); add style suggestions only if nothing failed. Empty if none.`;
  const user = `${n ? `Images 1 to ${n} are identity references for the same woman.` : "No identity references."}${previousUrl ? ` Image ${n + 1} is the previous accepted photo in this carousel (for continuity).` : ""} The last image is the candidate.
Expected scene: ${JSON.stringify(scene)}
Shot: ${JSON.stringify(shot)}
Continuity: ${JSON.stringify(continuity)}
Permanent rules: ${visualRules(brand).join(" ")}`;
  const { json, costUsd } = await askDetailed(system, user, { maxTokens: 1200, imageUrls: images, model: PIPELINE_MODEL, effort: "medium" });
  const corrections = (Array.isArray(json.corrections) ? json.corrections : []).map((c) => sanitizeVisual(String(c || ""))).filter(Boolean).slice(0, 3);
  return { qa: { ...json, corrections }, costUsd };
}
