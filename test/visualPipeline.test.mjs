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
  for (const [field, value] of [["face_visible", true], ["feet_count", 3], ["wrong_shoe_colour", true], ["wrong_tights_colour", true], ["text_or_lettering_present", true]]) {
    assert.equal(vp.judgeQa({ ...good, [field]: value }).pass, false, field);
  }
  // Soft problems are scored but never fail the photo on their own.
  const soft = vp.judgeQa({ ...good, identity_match: 0.5, anatomy_score: 4, left_right_plausible: false, wrong_setting: true });
  assert.equal(soft.pass, true);
  assert.ok(soft.soft.length >= 4);
  assert.ok(soft.score < vp.judgeQa(good).score);
  assert.equal(vp.judgeQa({ ...good, feet_count: 1 }, { expectedFeet: 1 }).pass, true);
});

test("assemblePrompt adds the identity lock only with references, and only the last corrections", () => {
  const withRefs = vp.assemblePrompt("Scene text", { hasReferences: true, corrections: ["separate the feet"] });
  assert.ok(withRefs.startsWith("IDENTITY LOCK"));
  assert.ok(withRefs.includes("CORRECTIONS FROM THE LAST ATTEMPT\n- separate the feet"));
  assert.ok(withRefs.endsWith(vp.OUTPUT_LINE));
  const noRefs = vp.assemblePrompt("Scene text", { hasReferences: false });
  assert.ok(!noRefs.includes("IDENTITY LOCK"));
  assert.ok(!noRefs.includes("CORRECTIONS"));
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

test("a failed photo check retries with the same references, then keeps the best flagged", async () => {
  reset(); restore();
  handlers.qa = () => ({ ...defaults.qa(), face_visible: true, corrections: ["crop at the hips"] });
  const plan = await ig.planPhotos(BRAND, { texts: ["Heel slipping off on the jumpseat"] });
  reset();
  const result = await ig.generatePlannedPhoto(BRAND, { item: plan.items[0], continuity: plan.continuity });
  const falCalls = calls.filter((c) => c.kind === "fal");
  assert.equal(falCalls.length, 3, "first try plus at most 2 retries");
  for (const c of falCalls) {
    assert.ok(c.url.endsWith("/edit"), "never text-only");
    assert.deepEqual(c.body.image_urls, falCalls[0].body.image_urls, "same references every attempt");
  }
  assert.ok(!falCalls[0].body.prompt.includes("CORRECTIONS"));
  assert.ok(falCalls[1].body.prompt.includes("crop at the hips"));
  assert.equal(result.needsCheck, true);
  assert.match(result.checkReason, /face visible/);
  const logged = calls.filter((c) => c.kind === "supabase" && c.method === "POST" && c.url.includes("image_attempts"));
  assert.equal(logged.length, 3);
  assert.ok(logged.every((c) => Number(c.body.fal_cost_usd) === 0.15));
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
