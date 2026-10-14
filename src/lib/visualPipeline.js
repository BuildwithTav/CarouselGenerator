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
    "Her face is never in the photo. Keep her head out of the frame in a different way from photo to photo: a close-up of her feet and ankles, the frame's top edge at mid-calf, her knees or her thighs, her own point of view looking down, or directly behind her (her soles and the backs of her legs, or the back of her blonde head as the only part of her head in view). A top edge at her waist is occasional; her blouse and chest are rarely in the photo.",
    "Work uniform: fitted navy pencil skirt, white blouse, sheer tan tights and navy court heels with a mid heel (the same navy as the skirt), or plain navy flats. With the uniform, shoes are always that same navy, a rich mid navy that is clearly blue in the light and never near-black, and tights always sheer tan.",
    "Off duty, tights when worn are sheer tan or nude. Bare feet are fine.",
    "Settings: the aircraft (cabin aisle, jump seat, galley, crew rest), the crew room, the airport (gate, lounge, terminal floor), her home (mirror, bed, sofa, bath) or a pedicure chair. A hotel room or pool only occasionally. Never a bus, taxi, car, train, gym, street or shop.",
    "Her feet are the focal point, sharp and well lit.",
    "Her legs are never crossed, not at the knee and not at the ankle: both legs stay uncrossed with her two feet clearly apart, side by side or one slightly forward.",
    "Simple moments, varied from photo to photo: her feet resting, up on a seat, ledge or wall, stretching, on tiptoe, one heel dangling from her toes, kneeling seen from behind, lying on her front with her feet raised, or walking away from the camera. Her hands never hold a shoe or work on her tights or feet; they rest on her lap, the seat or a cup, or stay out of the frame. Shoes are either on her feet or set on the floor clearly apart from them, one pair at most.",
    "Fully clothed above the waist. Elegant and sensual through light, pose and styling, never explicit.",
    "Her own hands are slim and feminine with a French manicure. A partner appears only as a man's hand, at most up to the wrist or forearm, entering from the edge of the frame.",
    "Anything that could carry a photo of a person (ID badge, lanyard card, photo frame, phone screen) is face-down or angled away.",
    "Shoes, insoles, clothing and props are plain and unbranded.",
  ],
};

// Work-shoe colour per brand. Enforced in code on the director's facts and
// the written prompts, because reference photos and scene text kept
// pulling the model back to black heels.
const SHOE_COLOUR = { "sky-high-soles": "navy" };
const BLACK_SHOES = /\bblack((?:[\s-]+(?:patent|leather|suede|glossy|shiny|low|mid|heeled|kitten|court|pointed|stiletto|block|work))*[\s-]+(?:court shoes?|heels?|shoes?|pumps?|flats?|stilettos?))/gi;

export function enforceShoeColour(brand, value) {
  const colour = SHOE_COLOUR[brand?.slug];
  if (!colour) return value;
  if (Array.isArray(value)) return value.map((v) => enforceShoeColour(brand, v));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, enforceShoeColour(brand, v)]));
  return typeof value === "string" ? value.replace(BLACK_SHOES, `${colour}$1`) : value;
}

// "Navy" alone kept rendering so dark it read as black. Every prompt that
// puts her in shoes gets this line, written in code so it can't be dropped.
const SHOE_COLOUR_LINE = {
  "sky-high-soles": "Her shoes are a rich mid navy blue, exactly the navy of her skirt, clearly and visibly blue in the light.",
};

export function addShoeColourLine(brand, prompt) {
  const line = SHOE_COLOUR_LINE[brand?.slug];
  if (!line || !/\b(heels?|shoes?|flats?|court|pumps?)\b/i.test(prompt) || prompt.includes(line)) return prompt;
  return `${prompt} ${line}`;
}

export function visualRules(brand) {
  return VISUAL_RULES[brand?.slug] || [];
}

export const ANATOMY_BASELINE = "Both complete feet are clearly readable and naturally oriented as a matched left and right pair, each big toe on the inner edge of its foot, the side facing her other foot. Keep them separated enough that each silhouette and toe line is individually clear.";

export const VISUAL_MODES = {
  editorial: "Campaign-like but lived in: controlled warm light, deliberate composition, real props and textures, never a bare studio set. Lens language (35, 50 or 85mm equivalent) only when it defines the perspective or depth.",
  cabin_candid: "A believable on-duty or post-shift moment: modern phone-camera feel, ambient aircraft or terminal light, moderate depth, natural perspective, slight imperfection.",
  lifestyle_intimate: "A home, hotel or pedicure scene that feels lived in: warm practical lamps and candlelight, soft throws, real everyday clutter, close framing, believable high-quality lifestyle photography.",
};

const SHOT_DIMENSIONS = `Shot dimensions (pick one value for each, or a close natural variant):
- distance: extreme detail, tight, medium, wider environmental
- crop (where the frame's top edge falls): feet and ankles only, mid-calf, knees, mid-thigh, waist (occasional), none (seen from behind or from her own view)
- camera_height: floor, ankle, knee, seated eye level, overhead, own point of view
- view: top down, three quarter, side profile, straight on feet, directly behind, low from behind, soles towards the camera
- body_position: seated, standing, standing on tiptoe, walking away from the camera (mid-step, seen from behind), reclining, lying on her front with her lower legs raised and soles up, legs stretched out side by side, feet up on a seat, ledge or wall, perched on a counter or bunk edge with her feet hanging, one foot slightly forward, one foot raised, kneeling (sitting back on her heels, seen from directly behind her: the camera sees both soles, the backs of her calves and her skirt from behind, feet side by side and not overlapping) (legs always uncrossed)
- footwear_state: both heels on, one heel dangling from her toes, one removed, both beside her, flats, tights only, bare
- emphasis: toe line, arch, soles, hosiery texture, heel slipping, shoe detail, full legs, cabin context`;

// Image identity lock — sent before the scene whenever reference photos are
// attached. References control identity; the brief controls everything else.
export const IDENTITY_LOCK = `IDENTITY LOCK
Use the supplied reference images as the authoritative identity of the same established woman. Preserve her established body proportions, leg shape, ankle shape, foot shape, arch profile, toe proportions, skin tone, nail shape and nail colour.
The references control identity. The scene brief controls pose, camera position, clothing, location and lighting. Do not blend identities, invent a different body type or reinterpret the referenced anatomy.
Clothing, shoes and their colours come only from the scene brief, never from the reference images.
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
        required_objects: (Array.isArray(scene.required_objects) ? scene.required_objects : []).map((o) => str(o)).filter(Boolean).slice(0, 6),
        expected_feet_count: feet === 1 ? 1 : 2,
      },
      shot: {
        distance: str(shot.distance, "tight"),
        crop: str(shot.crop, "mid-calf"),
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
  return [n(shot?.distance), n(shot?.crop), n(shot?.camera_height), n(shot?.view), n(shot?.body_position)].join("|");
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
- For each scene, consider several candidate shots and pick the best, weighing: semantic fit with the scene 35%, novelty against the recent shots 30%, fit with the set's story order 15%, how well her identity references cover that view 10%, anatomical simplicity 10%.
- The account must never look predictable. Never repeat a composition (same distance, camera height, view, body position and crop) used by another photo in this set or by any recent shot listed, and when two recent shots share a crop, view or body position, choose a different one. Lead with her feet and legs: most photos crop at the feet, calves, knees or thighs, or are seen from behind or from her own view. A waist crop is occasional, and never crop at her chest.
- What stays the same in every photo is her: the same feet, legs and skin, and her uniform, sheer tan tights and navy heels when she's working. Everything else varies: pose, angle, crop, place and moment.
- Keep her hands out of the action: no hands holding shoes, rolling tights or touching her feet, and no shoe being put on or pulled off mid-action (these produce extra shoes, extra feet and wrong hands). Show the moment just before or after instead: heels already off and set beside her, tights already on.
- Keep anatomy simple. Legs are never crossed (crossed legs make the image model draw two left or two right feet). Don't combine pointed toes, extreme foreshortening, shoe removal and a floor-level camera unless the scene genuinely needs it.
- Translate the event into a plausible, lived-in photograph that tells the scene's story without words. Give each scene 3 to 6 required_objects: small real details that belong to that exact moment (for example a mug of tea, a kettle, an open nail polish bottle, her folded uniform jacket with its wings badge, a candle, a throw blanket, her crew bag, a boarding card face-down), and put the time of day in the lighting. Details are plain and unbranded, with no words on them. Drop narration, metaphor, audience reactions and other people. If a scene mentions a place outside the permanent settings, show the moment just before or after it in an allowed setting.
- expected_feet_count is 2 unless the shot is a deliberate one-foot detail.

Reply with JSON only:
{"continuity": {"setting": "...", "wardrobe": "...", "lighting": "...", "mode": "editorial|cabin_candid|lifestyle_intimate"},
 "shots": [{"scene": {"setting": "...", "subject_action": "...", "wardrobe": "...", "footwear_state": "...", "required_objects": ["..."], "expected_feet_count": 2},
            "shot": {"distance": "...", "crop": "...", "camera_height": "...", "view": "...", "body_position": "...", "footwear_state": "...", "emphasis": "..."},
            "score_reason": "one short sentence"}]}
Exactly one entry in "shots" per scene, same order. Observable facts only, no quotes.`;

  const user = `${lockedContinuity ? `This set's continuity is already locked; keep it exactly:\n${JSON.stringify(lockedContinuity)}\n\n` : ""}${avoidShots.length ? `Other photos already in this set (don't repeat these compositions):\n${avoidShots.map((s) => `- ${JSON.stringify(s)}`).join("\n")}\n\n` : ""}Recent shots for this brand (most recent first; penalise repeating them):
${recentShots.length ? recentShots.map((s) => `- ${JSON.stringify(s)}`).join("\n") : "- none yet"}

Scenes, in order:
${texts.map((t, i) => `${i + 1}. ${t || "(cover photo for the set)"}`).join("\n")}`;

  const { json, costUsd } = await askDetailed(system, user, { maxTokens: 800 * texts.length + 800, model: PIPELINE_MODEL });
  const plan = enforceShoeColour(brand, normalizePlan(json, texts.length, lockedContinuity));
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
  const system = `You write image prompts for a photorealistic image model, from structured visual facts.
Write a rich, specific prompt, normally 120 to 200 words, that reads like a description of a real photo taken that day, not a studio shoot.
Order: the framing first (where the frame's edges fall, taken from the shot's crop, then camera height, view, distance); then her pose, body position and footwear; then the setting and every required object, with its materials and textures; then the light (its source, direction, warmth and the time of day) and the camera feel of the mode (lens, depth of field, a little natural grain).
Translate the facts into one plausible photograph. You may add small textures and surface details that fit the facts; never add people or extra objects.
Phrase everything positively: describe what is in the photo. Never write "no X", "without X" or "avoid".
Make the framing physically possible for the pose. Her soles face the camera only when the camera is beyond her feet, looking at the bottoms of them. Kneeling with her soles to the camera means she faces away from it: the frame shows her from behind (soles, the backs of her calves, her skirt) and its top edge cuts across her waist, never her lap or chest.
Feet: include this sentence, then only the left/right relationship the pose needs (for example "her left ankle rests lightly across her right ankle"): ${ANATOMY_BASELINE}
Name colours explicitly when the uniform is worn: "rich mid navy court heels matching her navy skirt" (or "navy flats"), "sheer tan tights".
Use concrete visual language (light, texture, warmth, materials) rather than mood or persuasion words. No captions, quotes or lettering.${textZone ? `\nKeep the ${textZone} of the frame calm and uncluttered.` : ""}
Reply with JSON only: {"prompts": ["...", ...]}, one per item, same order.`;

  const user = `Permanent visual rules:
${rules.map((r) => `- ${r}`).join("\n")}

${identityNotes(brand)}

Mode (${continuity.mode}): ${VISUAL_MODES[continuity.mode] || VISUAL_MODES.cabin_candid}

Continuity for the whole set: ${JSON.stringify({ setting: continuity.setting, wardrobe: continuity.wardrobe, lighting: continuity.lighting })}

Items:
${items.map((it, i) => `${i + 1}. ${JSON.stringify({ scene: it.scene, shot: it.shot, ...(it.corrections?.length ? { corrections_from_last_attempt: it.corrections } : {}) })}`).join("\n")}`;

  const { json, costUsd } = await askDetailed(system, user, { maxTokens: 700 * items.length + 400, model: PIPELINE_MODEL });
  const prompts = (Array.isArray(json.prompts) ? json.prompts : []).map((p) => addShoeColourLine(brand, enforceShoeColour(brand, sanitizeVisual(String(p || "")))));
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
  // Two left (or two right) feet is Tav's most repeated rejection, so it's a
  // hard failure like the wrong number of feet.
  if (qa?.left_right_plausible === false) hard.push("left/right feet wrong");
  if (qa?.extra_or_merged_items === true) hard.push("extra or merged shoe/foot/limb");
  // The post text describes the pose, so the wrong one is a mismatch Tav
  // has to reject (her sitting when the post says kneeling).
  if (qa?.pose_matches === false) hard.push("pose doesn't match the post");

  const soft = [];
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
  const identity = num(qa?.identity_match), anatomy = num(qa?.anatomy_score), photo = num(qa?.photorealism_score), cont = num(qa?.continuity_score);
  if (identity !== null && identity < QA_THRESHOLDS.identity) soft.push(`identity ${identity}`);
  if (anatomy !== null && anatomy < QA_THRESHOLDS.anatomy) soft.push(`anatomy ${anatomy}/10`);
  if (photo !== null && photo < QA_THRESHOLDS.photorealism) soft.push(`realism ${photo}/10`);
  if (laterSlide && cont !== null && cont < QA_THRESHOLDS.continuity) soft.push(`continuity ${cont}`);
  if (qa?.toes_plausible === false) soft.push("toes");
  if (qa?.feet_clear === false) soft.push("feet unclear");
  if (qa?.wrong_setting === true) soft.push("setting");
  if (qa?.wrong_uniform === true) soft.push("uniform");

  const score = (identity ?? 0.8) * 10 + (anatomy ?? 6) + (photo ?? 6) + (laterSlide ? (cont ?? 0.8) * 5 : 0) - soft.length - hard.length * 100;
  return { pass: hard.length === 0, hard, soft, score, retry: hard.length > 0 && hard.every((h) => RETRY_FIXES.includes(h)) };
}

// The only failures a paid retry reliably fixes. Feet problems (left/right,
// count, extra shoe) came back on 5 of 6 retries, so those are flagged
// "Check this" for Tav instead of paying for another try.
export const RETRY_FIXES = ["face visible", "text in image", "wrong shoe colour", "wrong tights colour", "pose doesn't match the post"];

// The checker sees only the candidate (plus the previous slide in a
// carousel). Every pass/fail check is answerable from the photo alone, and
// leaving her reference photos out more than halves the cost of a check.
export async function qaImage(brand, { candidateUrl, previousUrl = null, scene, shot, continuity }) {
  const images = [...(previousUrl ? [previousUrl] : []), candidateUrl];
  const system = `You are a careful photo checker for a faceless photo series. Inspect the candidate photo against the expected scene. Judge only what you can see.
Reply with strict JSON only, no prose:
{"decision": "pass|fail", "face_visible": false, "pose_matches": true, "feet_count": 2, "toes_plausible": true, "left_right_plausible": true, "extra_or_merged_items": false, "feet_clear": true, "anatomy_score": 0, "photorealism_score": 0, "wrong_uniform": false, "wrong_shoe_colour": false, "wrong_tights_colour": false, "wrong_setting": false, "continuity_score": 0.0, "text_or_lettering_present": false, "corrections": ["..."]}
- continuity_score is 0 to 1; anatomy_score and photorealism_score are 0 to 10.
- face_visible: true only if her face (eyes, nose or mouth) is in the photo.
- feet_count: the number of her feet visible in the photo.
- left_right_plausible: check this carefully, it is the most common failure. Trace each visible foot back up its own leg to the knee and hip, so you know which is her left foot and which is her right. On every real foot the big toe is on the inner edge, the side facing her other leg, and the toes get smaller towards the outer edge. False only when you can clearly see it: a foot with its big toe on the outer edge, both feet looking like the same foot (two left or two right), or a foot attached to the wrong leg. If the feet are partly hidden, overlapping, foreshortened or you can't tell, answer true.
- pose_matches: false only when her body position is clearly different from the shot's body_position (for example sitting with her legs stretched out when the shot says kneeling, or standing when it says lying down). A different angle or crop of the right pose still matches.
- extra_or_merged_items: true if anything is duplicated or impossible: an extra shoe (for example a shoe under a foot that is already in a shoe, or more shoes than she could be wearing plus one pair set down), an extra foot, toe, hand or leg, a shoe merged into a foot, or a hand that doesn't connect to an arm. Count the shoes and limbs before answering.
- wrong_shoe_colour: true if she wears her work uniform and her shoes are not clearly navy blue (the same navy as the skirt). Shoes that look black, or so dark they could pass for black at a glance, count as wrong. wrong_tights_colour: true if her tights are anything other than sheer tan or nude.
- text_or_lettering_present: true only for prominent words that draw the eye: a caption, watermark, overlaid text, or a large readable sign or logo. Small brand marks on shoes, insoles, clothing or products, and the small placards and exit signs that belong in an aircraft cabin, do not count.
- corrections: at most 3 short, observable changes for the next attempt (for example "separate the feet so both silhouettes are readable"). Fix the failures above first (face, number of feet, left/right feet, extra or merged items, shoe or tights colour, prominent text); add style suggestions only if nothing failed. Empty if none.`;
  const user = `${previousUrl ? "Image 1 is the previous accepted photo in this carousel (for continuity). " : ""}The last image is the candidate.
Expected scene: ${JSON.stringify(scene)}
Shot: ${JSON.stringify(shot)}
Continuity: ${JSON.stringify(continuity)}
Permanent rules: ${visualRules(brand).join(" ")}`;
  const { json, costUsd } = await askDetailed(system, user, { maxTokens: 1200, imageUrls: images, model: PIPELINE_MODEL, effort: "medium" });
  const corrections = (Array.isArray(json.corrections) ? json.corrections : []).map((c) => sanitizeVisual(String(c || ""))).filter(Boolean).slice(0, 3);
  return { qa: { ...json, corrections }, costUsd };
}
