// Run with: npm test
// The image model comparison (src/lib/modelTest.js), with a mocked fetch.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mockFetch, calls, handlers } from "./support/mockFetch.mjs";

globalThis.fetch = mockFetch;
Object.assign(process.env, { ANTHROPIC_API_KEY: "test", FAL_API_KEY: "test", SUPABASE_URL: "https://fake.supabase.co", SUPABASE_SERVICE_KEY: "test" });
delete process.env.ANTHROPIC_BASE_URL;
await import("@anthropic-ai/sdk/shims/web");

const mt = await import("@/lib/modelTest");
const BRAND = { id: "brand-1", slug: "sky-high-soles", name: "Sky High Soles" };
const model = (key) => mt.TEST_MODELS.find((m) => m.key === key);
const spec = (endpoint, properties, extra = {}) => ({
  paths: { [`/${endpoint}`]: { post: { requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Input" } } } } } } },
  components: { schemas: { Input: { properties }, ...extra } },
});

test("requests use each model's own size settings from its schema", () => {
  const nb = spec("x", { aspect_ratio: { enum: ["1:1", "4:5", "9:16"] }, resolution: { enum: ["1K", "2K", "4K"] }, output_format: { enum: ["jpeg", "png"] } });
  const nbBody = mt.buildRequest(model("nano-banana-2"), "p", ["r1", "r2"], { props: nb.components.schemas.Input.properties, schemas: nb.components.schemas });
  assert.deepEqual([nbBody.aspect_ratio, nbBody.resolution, nbBody.output_format], ["4:5", "1K", "jpeg"]);
  assert.deepEqual(nbBody.image_urls, ["r1", "r2"]);

  const sd5 = { aspect_ratio: { anyOf: [{ enum: ["1:1", "3:4", "4:3"] }] }, resolution: { enum: ["1k", "1.5k", "2k"] }, image_size: {} };
  const sd5Body = mt.buildRequest(model("seedream-5-pro"), "p", [], { props: sd5, schemas: {} });
  assert.deepEqual([sd5Body.aspect_ratio, sd5Body.resolution, sd5Body.image_size], ["3:4", "1.5k", undefined]);

  // A size that takes either a named preset or {width, height}: the object wins.
  const sdObj = spec("y", { image_size: { anyOf: [{ $ref: "#/components/schemas/ImageSize" }, { enum: ["square_hd", "auto_2K"] }] }, max_images: {} }, { ImageSize: { properties: { width: {}, height: {} } } });
  const sdObjBody = mt.buildRequest(model("seedream-5-pro"), "p", [], { props: sdObj.components.schemas.Input.properties, schemas: sdObj.components.schemas });
  assert.deepEqual(sdObjBody.image_size, { width: 1360, height: 1700 });
  assert.equal(sdObjBody.max_images, 1);

  // GPT Image 2: named sizes only, and quality set to high when it exists.
  const gpt = { image_size: { enum: ["auto", "1024x1024", "1536x1024", "1024x1536"] }, quality: { enum: ["low", "medium", "high"] } };
  const gptBody = mt.buildRequest(model("gpt-image-2"), "p", ["r1"], { props: gpt, schemas: {} });
  assert.equal(gptBody.image_size, "1024x1536");
  assert.equal(gptBody.quality, "high");
  const gptObj = mt.buildRequest(model("gpt-image-2"), "p", [], { props: { image_size: { type: "object" }, quality: {} }, schemas: {} });
  assert.deepEqual(gptObj.image_size, { width: 1024, height: 1280 });
  assert.equal(gptObj.quality, "high");

  assert.deepEqual(mt.buildRequest(model("nano-banana-2"), "p", [], null).resolution, "1K");
});

test("image sizes are read from PNG and JPEG headers", () => {
  const png = Buffer.alloc(32); png.writeUInt32BE(0x89504e47, 0); png.writeUInt32BE(1360, 16); png.writeUInt32BE(1700, 20);
  assert.deepEqual(mt.imageSize(png), { width: 1360, height: 1700 });
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0, 0, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x08, 0x98, 0x06, 0xd8, 0, 0, 0]);
  assert.deepEqual(mt.imageSize(jpg), { width: 1752, height: 2200 });
});

test("Seedream 5 Pro is priced by size and extra references", () => {
  assert.equal(model("seedream-5-pro").cost(1360, 1700, 4).toFixed(4), "0.0810");
  assert.equal(model("seedream-5-pro").cost(2048, 2048, 1), 0.135);
  assert.equal(model("nano-banana-2").cost(928, 1152), 0.08);
  assert.equal(model("nano-banana-2").cost(1792, 2240), 0.12);
});

test("a test scene sends the same prompt and references to every model and checks each", async () => {
  calls.length = 0;
  handlers.falSchema = (endpoint) => endpoint.includes("nano-banana")
    ? spec(endpoint, { aspect_ratio: { enum: ["4:5"] }, resolution: { enum: ["1K", "2K"] } })
    : null;
  const rows = await mt.runModelTestScene(BRAND, { runId: "run-1", sceneIndex: 0 });
  const fal = calls.filter((c) => c.kind === "fal");
  assert.equal(fal.length, mt.TEST_MODELS.length);
  assert.deepEqual(new Set(fal.map((c) => c.url)), new Set(mt.TEST_MODELS.map((m) => `https://fal.run/${m.endpoint}`)));
  for (const c of fal) {
    assert.equal(c.body.prompt, fal[0].body.prompt, "same prompt");
    assert.deepEqual(c.body.image_urls, fal[0].body.image_urls, "same references");
  }
  assert.ok(fal[0].body.image_urls.length >= 2);
  const qa = calls.filter((c) => c.kind === "anthropic" && c.stage === "qa");
  assert.equal(qa.length, mt.TEST_MODELS.length);
  assert.equal(rows.length, mt.TEST_MODELS.length);
  assert.ok(rows.every((r) => r.qa_pass === true && r.storage_path && Number(r.cost_usd) > 0));
  assert.ok(!calls.some((c) => c.kind === "supabase" && c.method === "POST" && c.url.includes("brand_media")), "never in the media library");
  delete handlers.falSchema;
});

test("fal's 'too many at once' limit waits and retries instead of failing the photo", async () => {
  calls.length = 0;
  let first = true;
  const ok = handlers.fal;
  handlers.fal = (body) => (first ? ((first = false), { status: 429, body: { detail: "Reached concurrent requests limit of 10", type: "concurrent_requests_limit" } }) : ok(body));
  const rows = await mt.runModelTestScene(BRAND, { runId: "run-2", sceneIndex: 1 });
  assert.equal(calls.filter((c) => c.kind === "fal").length, mt.TEST_MODELS.length + 1, "every model + 1 retry");
  assert.ok(rows.every((r) => !r.error && r.storage_path), "every model came back");
  assert.ok(calls.some((c) => c.kind === "supabase" && c.method === "DELETE" && c.url.includes("model_tests")), "a redo replaces the scene");
  handlers.fal = ok;
});
