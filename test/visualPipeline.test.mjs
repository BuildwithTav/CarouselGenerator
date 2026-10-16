// Run with: npm test
// Exercises the Sky High Soles visual pipeline with a mocked fetch: no
// network, no spend.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mockFetch, calls, handlers } from "./support/mockFetch.mjs";

globalThis.fetch = mockFetch;
Object.assign(process.env, { ANTHROPIC_API_KEY: "test", FAL_API_KEY: "test", SUPABASE_URL: "https://fake.supabase.co", SUPABASE_SERVICE_KEY: "test" });
delete process.env.ANTHROPIC_BASE_URL;
await import("@anthropic-ai/sdk/shims/web");

const vp = await import("@/lib/visualPipeline");
const ig = await import("@/lib/imageGen");
const BRAND = { id: "brand-1", slug: "sky-high-soles", name: "Sky High Soles", voice: "flirty, seductive, feet fetish", pillars: "heels, tights" };
const reset = () => { calls.length = 0; };
const defaults = { ...handlers };
const restore = () => Object.assign(handlers, defaults);

// ── Pure helpers ─────────────────────────────────────────────────────────
test("sanitizeVisual strips quotes, hashtags and copy words", () => {
  const out = vp.sanitizeVisual({ a: 'She kicks off a heel "link in bio" #crewlife, flirty and seductive', b: ["teasing smile", "jumpseat"] });
  assert.ok(!out.a.includes("link in bio"));
  assert.ok(!out.a.includes("#crewlife"));
  assert.ok(!/flirty|seductive/i.test(out.a));
  assert.deepEqual(out.b, ["smile", "jumpseat"]);
});

test("normalizePlan validates the director's shape and locks continuity", () => {
  const locked = { setting: "galley", wardrobe: "uniform", lighting: "warm", mode: "editorial" };
  const plan = vp.normalizePlan({ continuity: { mode: "nonsense" }, shots: [{ scene: {}, shot: {} }] }, 1, locked);
  assert.deepEqual(plan.continuity, locked);
  assert.equal(plan.shots[0].scene.expected_feet_count, 2);
  assert.equal(plan.shots[0].shot.crop, "mid-calf", "a crop is always set");
  assert.throws(() => vp.normalizePlan({ shots: [] }, 2), /returned 0 shots for 2/);
  const fresh = vp.normalizePlan({ continuity: { mode: "nonsense" }, shots: [{}] }, 1);
  assert.equal(fresh.continuity.mode, "cabin_candid");
});

test("selectReferences always picks at least 2 when 2 exist, at most 4", () => {
  const pool = [
    { id: "a", reference_view: "A" }, { id: "b", reference_view: "B" }, { id: "c", reference_view: "C" },
    { id: "d", reference_view: "D" }, { id: "e", reference_view: "E" }, { id: "x", reference_view: null },
  ];
  const top = vp.selectReferences(pool, { view: "top down", camera_height: "own point of view", distance: "tight" }, { wardrobe: "bare feet at home" });
  assert.deepEqual(top, ["a", "b"]);
  const side = vp.selectReferences(pool, { view: "side profile", camera_height: "ankle", distance: "tight" }, { wardrobe: "uniform, black heels" });
  assert.deepEqual(side, ["a", "c", "d"]);
  const onlyUntagged = vp.selectReferences([{ id: "x" }, { id: "y" }], { view: "side" }, {});
  assert.equal(onlyUntagged.length, 2);
  assert.ok(vp.selectReferences(pool, { view: "top down" }, { wardrobe: "uniform" }, 4).length <= 4);
  assert.deepEqual(vp.selectReferences([], {}, {}), []);
  assert.deepEqual(vp.selectReferences([{ id: "only" }], {}, {}), ["only"]);
});

test("judgeQa hard-fails only the obvious failures", () => {
  const good = handlers.qa();
  assert.equal(vp.judgeQa(good).pass, true);
  for (const [field, value] of [["face_visible", true], ["feet_count", 3], ["left_right_plausible", false], ["extra_or_merged_items", true], ["pose_matches", false], ["wrong_shoe_colour", true], ["wrong_tights_colour", true], ["text_or_lettering_present", true]]) {
    assert.equal(vp.judgeQa({ ...good, [field]: value }).pass, false, field);
  }
  // Soft problems are scored but never fail the photo on their own.
  const soft = vp.judgeQa({ ...good, identity_match: 0.5, anatomy_score: 4, toes_plausible: false, wrong_setting: true });
  assert.equal(soft.pass, true);
  assert.ok(soft.soft.length >= 4);
  assert.ok(soft.score < vp.judgeQa(good).score);
  assert.equal(vp.judgeQa({ ...good, feet_count: 1 }, { expectedFeet: 1 }).pass, true);
});

test("assemblePrompt is short and plain: scene, who she is (with references), last fixes, format", () => {
  const withRefs = vp.assemblePrompt("A photo of her feet up on the sofa.", { hasReferences: true, corrections: ["separate the feet"] });
  assert.ok(withRefs.startsWith("A photo of her feet up on the sofa."));
  assert.ok(withRefs.includes(vp.IDENTITY_LOCK));
  assert.ok(withRefs.includes("Fix from the last try: separate the feet."));
  assert.ok(withRefs.endsWith(vp.OUTPUT_LINE));
  assert.ok(!/IDENTITY LOCK|SCENE\n|CORRECTIONS/.test(withRefs), "no shouty section headers");
  const noRefs = vp.assemblePrompt("A photo of her feet.", { hasReferences: false });
  assert.ok(!noRefs.includes(vp.IDENTITY_LOCK));
  assert.ok(!noRefs.includes("Fix from the last try"));
});

// ── Integration with mocked fetch ────────────────────────────────────────
test("captions, hashtags and brand voice never reach the prompt writer", async () => {
  reset(); restore();
  const plan = await ig.planPhotos(BRAND, { texts: ['Heels off the second we land "link in bio" #crewlife'] });
  const writer = calls.find((c) => c.kind === "anthropic" && c.stage === "writer");
  const payload = JSON.stringify(writer.req);
  assert.ok(!payload.includes("link in bio"));
  assert.ok(!payload.includes("#crewlife"));
  assert.ok(!payload.includes("Heels off the second we land"));
  assert.ok(!/feet fetish|seductive/.test(payload));
  assert.equal(plan.items.length, 1);
  assert.ok(plan.items[0].referenceIds.length >= 2);
});

test("a failed photo check retries once with the same references, then keeps the best flagged", async () => {
  reset(); restore();
  handlers.qa = () => ({ ...defaults.qa(), face_visible: true, corrections: ["crop at the hips"] });
  const plan = await ig.planPhotos(BRAND, { texts: ["Heel slipping off on the jumpseat"] });
  reset();
  const result = await ig.generatePlannedPhoto(BRAND, { item: plan.items[0], continuity: plan.continuity });
  const falCalls = calls.filter((c) => c.kind === "fal");
  assert.equal(falCalls.length, 2, "first try plus at most 1 retry");
  for (const c of falCalls) {
    assert.ok(c.url.endsWith("/edit"), "never text-only");
    assert.deepEqual(c.body.image_urls, falCalls[0].body.image_urls, "same references every attempt");
  }
  assert.equal(falCalls[0].url, `https://fal.run/${ig.PHOTO_MODELS[ig.PHOTO_MODEL].edit}`, "first try on the main model");
  assert.equal(falCalls[1].url, `https://fal.run/${ig.PHOTO_MODELS[ig.RETRY_MODEL].edit}`, "retry on the other model");
  assert.equal(falCalls[1].body.prompt.includes(vp.IDENTITY_LOCK), true);
  assert.ok(!falCalls[0].body.prompt.includes("Fix from the last try"));
  assert.ok(falCalls[1].body.prompt.includes("crop at the hips"));
  assert.equal(result.needsCheck, true);
  assert.match(result.checkReason, /face visible/);
  const logged = calls.filter((c) => c.kind === "supabase" && c.method === "POST" && c.url.includes("image_attempts"));
  assert.equal(logged.length, 2);
  assert.equal(Number(logged[0].body.fal_cost_usd), ig.PHOTO_MODELS[ig.PHOTO_MODEL].cost(falCalls[0].body.image_urls.length));
  assert.equal(Number(logged[1].body.fal_cost_usd), ig.PHOTO_MODELS[ig.RETRY_MODEL].cost(falCalls[1].body.image_urls.length));
  assert.ok(logged.every((c) => Number(c.body.fal_cost_usd) < 0.1), "both cheaper than the old $0.15");
  restore();
});

test("the wrong pose gets one retry on the other model", async () => {
  reset(); restore();
  let n = 0;
  handlers.qa = () => ({ ...defaults.qa(), pose_matches: ++n > 1, corrections: ["kneel, seen from behind"] });
  const plan = await ig.planPhotos(BRAND, { texts: ["Kneeling on the galley floor, soles to the camera"] });
  reset();
  const result = await ig.generatePlannedPhoto(BRAND, { item: plan.items[0], continuity: plan.continuity });
  const fal = calls.filter((c) => c.kind === "fal");
  assert.equal(fal.length, 2);
  assert.ok(fal[1].body.prompt.includes("kneel, seen from behind"));
  assert.equal(result.needsCheck, false);
  restore();
});

test("feet problems are flagged for Tav instead of paying for a retry", async () => {
  reset(); restore();
  handlers.qa = () => ({ ...defaults.qa(), left_right_plausible: false, corrections: ["separate the feet"] });
  const plan = await ig.planPhotos(BRAND, { texts: ["Heels on the jumpseat"] });
  reset();
  const result = await ig.generatePlannedPhoto(BRAND, { item: plan.items[0], continuity: plan.continuity });
  assert.equal(calls.filter((c) => c.kind === "fal").length, 1, "no paid retry for feet");
  assert.equal(result.needsCheck, true);
  assert.match(result.checkReason, /left\/right/);
  restore();
});

test("the photo checker never gets her reference photos", async () => {
  reset(); restore();
  const plan = await ig.planPhotos(BRAND, { texts: ["Feet up in the crew rest"] });
  reset();
  await ig.generatePlannedPhoto(BRAND, { item: plan.items[0], continuity: plan.continuity });
  const qa = calls.find((c) => c.kind === "anthropic" && c.stage === "qa");
  const images = qa.req.messages[0].content.filter((b) => b.type === "image");
  assert.equal(images.length, 1, "only the candidate");
  restore();
});

test("a passing photo is saved after one attempt, unflagged", async () => {
  reset(); restore();
  const plan = await ig.planPhotos(BRAND, { texts: ["Feet up on the crew rest bunk"] });
  reset();
  const result = await ig.generatePlannedPhoto(BRAND, { item: plan.items[0], continuity: plan.continuity });
  assert.equal(calls.filter((c) => c.kind === "fal").length, 1);
  assert.equal(result.needsCheck, false);
  const saved = calls.find((c) => c.kind === "supabase" && c.method === "POST" && c.url.includes("brand_media"));
  assert.equal(saved.body.needs_check, false);
  assert.ok(saved.body.shot.shot.view);
});

test("a generation error retries with the same references, never text-only", async () => {
  reset(); restore();
  let n = 0;
  handlers.fal = () => (++n === 1 ? { status: 500, body: { detail: "boom" } } : defaults.fal());
  const plan = await ig.planPhotos(BRAND, { texts: ["Slipping into flats in the crew room"] });
  reset();
  const result = await ig.generatePlannedPhoto(BRAND, { item: plan.items[0], continuity: plan.continuity });
  const falCalls = calls.filter((c) => c.kind === "fal");
  assert.equal(falCalls.length, 2);
  assert.ok(falCalls.every((c) => c.url.endsWith("/edit") && c.body.image_urls.length >= 2));
  assert.equal(result.needsCheck, false);
  restore();
});

test("the photo checker failing never costs the post its photo", async () => {
  reset(); restore();
  handlers.qa = () => { throw new Error("checker down"); };
  const plan = await ig.planPhotos(BRAND, { texts: ["Barefoot on the galley floor"] });
  reset();
  const result = await ig.generatePlannedPhoto(BRAND, { item: plan.items[0], continuity: plan.continuity });
  assert.ok(result.media);
  assert.equal(calls.filter((c) => c.kind === "fal").length, 1);
  restore();
});

// ── Posting order ────────────────────────────────────────────────────────
test("posting order mixes kinds instead of posting a batch back to back", async () => {
  const { pickNextPost, postKind } = await import("@/lib/postOrder");
  const img = (id) => ({ id, template: "x-post", slide_paths: ["a.jpg"] });
  const txt = (id) => ({ id, template: "x-post", slide_paths: [] });
  const car = (id) => ({ id, template: "elegant", slide_paths: ["1.png", "2.png"] });
  assert.equal(postKind(img(1)), "image");
  assert.equal(postKind(txt(1)), "text");
  assert.equal(postKind(car(1)), "carousel");
  const ready = [img(1), img(2), img(3), img(4), txt(5)];
  // After an image, the text post goes next even though 4 images are older.
  for (let i = 0; i < 20; i++) assert.equal(postKind(pickNextPost(ready, "image")), "text");
  // Only images waiting: still posts one rather than nothing.
  assert.equal(postKind(pickNextPost([img(1), img(2)], "image")), "image");
  assert.equal(pickNextPost([], "text"), null);
});

// ── Token room and shoe colour ───────────────────────────────────────────
test("every pipeline call leaves room for thinking plus the answer", async () => {
  reset(); restore();
  await ig.planPhotos(BRAND, { texts: ["a", "b", "c", "d"].map((t) => `Heels on the jumpseat ${t}`) });
  const claude = calls.filter((c) => c.kind === "anthropic");
  assert.ok(claude.length >= 2);
  for (const c of claude) assert.ok(c.req.max_tokens >= 16000, `${c.stage} max_tokens ${c.req.max_tokens}`);
});

test("shoe prompts always carry the clearly-blue navy line, bare-feet prompts don't", () => {
  const shod = vp.addShoeColourLine(BRAND, "She stands in the galley in navy court heels.");
  assert.match(shod, /clearly and visibly blue/);
  assert.equal(vp.addShoeColourLine(BRAND, shod), shod, "added once");
  const bare = "Her bare feet rest on the sofa.";
  assert.equal(vp.addShoeColourLine(BRAND, bare), bare);
  assert.equal(vp.addShoeColourLine({ slug: "healthcode" }, "In trainers and shoes"), "In trainers and shoes");
  // Barefoot scenes stay barefoot even when the wording says "flat" or "heel".
  const barefoot = "She stands barefoot, feet flat on the kitchen floor, the heel of each foot lit.";
  assert.equal(vp.addShoeColourLine(BRAND, barefoot, vp.shoeFacts({ scene: { footwear_state: "bare", required_objects: ["kettle", "mug"] }, shot: { footwear_state: "bare" } })), barefoot);
  assert.match(vp.addShoeColourLine(BRAND, "Tights only, legs up on the seat.", vp.shoeFacts({ scene: { footwear_state: "tights only", required_objects: ["one pair of navy court heels on the floor"] }, shot: {} })), /clearly and visibly blue/);
});

// ── On-demand photo idea ─────────────────────────────────────────────────
test("Tav's own photo description reaches the post writer for an image post", async () => {
  reset(); restore();
  const { generateXPost, X_SLOTS } = await import("@/lib/xContent");
  const slot = X_SLOTS.find((s) => s.key === "visual");
  await generateXPost(BRAND, { slot, pillar: { label: "Feet", guidance: "" }, format: "single", photoIdea: "kneeling on the floor, soles in tights showing" });
  const req = JSON.stringify(calls.find((c) => c.kind === "anthropic").req);
  assert.ok(req.includes("kneeling on the floor, soles in tights showing"));
  reset();
  await generateXPost(BRAND, { slot, pillar: { label: "Feet", guidance: "" }, format: "text", photoIdea: "kneeling" });
  assert.ok(!JSON.stringify(calls.find((c) => c.kind === "anthropic").req).includes("Tav has asked for this exact photo"), "text posts ignore it");
});

test("the director is pushed to vary pose and crop, not repeat a waist or chest crop", async () => {
  reset(); restore();
  await ig.planPhotos(BRAND, { texts: ["Feet up after a long day"] });
  const sys = String(calls.find((c) => c.kind === "anthropic" && c.stage === "director").req.system);
  assert.match(sys, /never crop at her chest/);
  assert.match(sys, /novelty against the recent shots 30%/);
  assert.match(sys, /lying on her front with her lower legs raised/);
  assert.notEqual(vp.compositionKey({ distance: "tight", crop: "knees", view: "side" }), vp.compositionKey({ distance: "tight", crop: "waist", view: "side" }));
});

test("the director works out the moment instead of illustrating every word", async () => {
  reset(); restore();
  await ig.planPhotos(BRAND, { texts: ["Day off uniform: dressing gown, wet nail polish, kettle on. The heels don't get a say until Thursday"] });
  const director = String(calls.find((c) => c.kind === "anthropic" && c.stage === "director").req.system);
  const writer = String(calls.find((c) => c.kind === "anthropic" && c.stage === "writer").req.system);
  assert.match(director, /Never illustrate every word/);
  assert.match(director, /feet up on the balcony" is a balcony photo with her feet up and maybe a mug beside her, never a kettle/);
  assert.match(director, /If it is only there because the words mention it, remove it/);
  assert.match(director, /balcony\) or a pedicure chair/);
  assert.equal(calls.find((c) => c.kind === "anthropic" && c.stage === "director").req.output_config.effort, "high");
  assert.match(director, /Off duty means off duty: no uniform, no work heels/);
  assert.match(director, /0 to 4 things the moment genuinely needs/);
  assert.match(writer, /the way a person would ask ChatGPT for a photo/);
  assert.match(writer, /normally 60 to 110 words/);
  assert.match(writer, /No camera jargon/);
  assert.match(director, /Choose the photo she would actually take of that moment/);
  const plan = vp.normalizePlan({ shots: [{ scene: { required_objects: ["a", "b", "c", "d", "e", "f"] }, shot: {} }] }, 1);
  assert.equal(plan.shots[0].scene.required_objects.length, 4);
});

test("the director is allowed a kneeling, soles-to-camera shot", async () => {
  reset(); restore();
  await ig.planPhotos(BRAND, { texts: ["Kneeling on the floor, soles in tights towards the camera"] });
  const director = calls.find((c) => c.kind === "anthropic" && c.stage === "director");
  assert.match(String(director.req.system), /kneeling \(sitting back on her heels, seen from directly behind her/);
  const writer = calls.find((c) => c.kind === "anthropic" && c.stage === "writer");
  assert.match(String(writer.req.system), /Kneeling with her soles to the camera means she faces away from it/);
});
