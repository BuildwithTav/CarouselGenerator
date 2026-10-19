// Run with: npm test
// Tav's ChatGPT photos: photo posts come with a ChatGPT request instead of a
// fal photo, he uploads the photo he made, and nothing posts without one.
// Mocked fetch: no network, no spend.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mockFetch, calls, handlers } from "./support/mockFetch.mjs";

globalThis.fetch = mockFetch;
Object.assign(process.env, {
  ANTHROPIC_API_KEY: "test", FAL_API_KEY: "test", SUPABASE_URL: "https://fake.supabase.co", SUPABASE_SERVICE_KEY: "test",
  DASHBOARD_PASSPHRASE: "dash", CRON_SECRET: "cron",
  TWITTER_API_KEY: "t", TWITTER_API_SECRET: "t", TWITTER_ACCESS_TOKEN: "t", TWITTER_ACCESS_TOKEN_SECRET: "t",
});
delete process.env.ANTHROPIC_BASE_URL;
await import("@anthropic-ai/sdk/shims/web");

const { OUTPUT_LINE } = await import("@/lib/visualPipeline");
const { PHOTO_PLACES } = await import("@/lib/xContent");
const xContent = await import("@/app/api/cron/x-content/route");
const xPhoto = await import("@/app/api/content/x-photo/route");
const content = await import("@/app/api/content/route");
const postNow = await import("@/app/api/content/post-now/route");
const postTwitter = await import("@/app/api/cron/post-twitter/route");

const BRAND = { id: "brand-1", slug: "sky-high-soles", name: "Sky High Soles", voice: "flirty", pillars: "heels, tights", visual_theme: { platforms: ["twitter"] }, x_manual_photos: true, x_auto_post_paused: false };
const PROMPT = `A candid photo of her feet up on the crew rest bunk in sheer tan tights. Her face is not in the photo.\n\n${OUTPUT_LINE}`;
const defaults = { ...handlers };
const reset = (rest) => { calls.length = 0; Object.assign(handlers, defaults, { rest }); };
const anthropic = (stage) => calls.filter((c) => c.kind === "anthropic" && (!stage || c.stage === stage));
const fal = () => calls.filter((c) => c.kind === "fal");
const inserted = () => calls.filter((c) => c.kind === "supabase" && c.method === "POST" && c.url.includes("/rest/v1/content_items")).flatMap((c) => [].concat(c.body));
const updates = () => calls.filter((c) => c.kind === "supabase" && c.method === "PATCH" && c.url.includes("/rest/v1/content_items")).map((c) => c.body);

// Answers the brand list and records new posts; `item` answers single-post reads.
function db(brand = BRAND, item = null) {
  return ({ method, url, body }) => {
    if (url.includes("/rest/v1/brands")) return { body: [brand] };
    if (url.includes("/rest/v1/content_items") && method === "POST") return { status: 201 };
    if (url.includes("/rest/v1/content_items") && method === "PATCH") return { body: { ...item, ...body } };
    if (url.includes("/rest/v1/content_items") && item && url.includes("id=eq.")) return { body: item };
  };
}
const dashPost = (path, body) => new Request(`https://studio.test${path}`, { method: "POST", headers: { "x-dashboard-key": "dash", "content-type": "application/json" }, body: JSON.stringify(body) });

test("with ChatGPT photos on, an image post gets a ChatGPT request and no fal photo", async () => {
  reset(db());
  const res = await xContent.POST(dashPost("/api/cron/x-content", { brandId: BRAND.id, slotKey: "visual", format: "single" }));
  const { results } = await res.json();
  assert.equal(results[0].queued, 1);
  assert.equal(fal().length, 0, "nothing spent on fal");
  assert.deepEqual(anthropic().map((c) => c.stage), ["xpost", "plain"]);
  const [row] = inserted();
  assert.equal(row.needs_photo, true);
  assert.deepEqual(row.slide_paths, []);
  assert.equal(row.status, "draft");
  assert.ok(row.photo_prompt.startsWith("A candid photo"));
  assert.ok(row.photo_prompt.endsWith(OUTPUT_LINE), "ready to paste: ends with the format line");
});

test("+ 5 photo posts: written together, each a different place, topic and format, no fal", async () => {
  const waiting = `A candid photo of her at the departure gate, heels off beside her case. Her face is not in the photo.\n\n${OUTPUT_LINE}`;
  const base = db();
  reset((req) => (req.url.includes("needs_photo=eq.true") ? { body: [{ photo_prompt: waiting }] } : base(req)));
  const res = await xContent.POST(dashPost("/api/cron/x-content", { brandId: BRAND.id, format: "single", count: 5 }));
  const { results } = await res.json();
  assert.equal(results[0].queued, 5);
  assert.equal(results[0].error, undefined);
  assert.equal(fal().length, 0);
  assert.deepEqual(anthropic().map((c) => c.stage), ["xbatch", "plain"], "one call writes all 5, one writes their photo requests");
  const user = JSON.stringify(anthropic("xbatch")[0].req.messages);
  const places = PHOTO_PLACES.filter((pl) => user.includes(`Place: ${pl}.`));
  assert.equal(places.length, 5, "5 different places");
  const topics = new Set([...user.matchAll(/Topic: ([^.]+)\./g)].map((m) => m[1]));
  assert.equal(topics.size, 5, "5 different topics");
  assert.equal(user.split("A short flirty this-or-that").length - 1, 1, "only one this-or-that question");
  assert.match(user, /never two on the same idea/);
  const plain = anthropic("plain")[0];
  assert.match(String(plain.req.system), /separate post for a different day, not a set/);
  // Their photos are kept apart from the ones still waiting for a photo.
  const plainUser = JSON.stringify(plain.req.messages);
  assert.ok(plainUser.includes("at the departure gate, heels off beside her case"));
  assert.ok(!plainUser.includes(OUTPUT_LINE));
  const rows = inserted();
  assert.equal(rows.length, 5);
  assert.ok(rows.every((r) => r.needs_photo === true && r.slide_paths.length === 0 && r.photo_prompt.endsWith(OUTPUT_LINE)));
  assert.equal(new Set(rows.map((r) => r.tw_caption)).size, 5);
  // Asking for more still makes 5.
  reset(db());
  const big = await (await xContent.POST(dashPost("/api/cron/x-content", { brandId: BRAND.id, format: "single", count: 10 }))).json();
  assert.equal(big.results[0].queued, 5);
});

test("a batch is refused while photos are on AI, so it can't spend on fal", async () => {
  reset(db({ ...BRAND, x_manual_photos: false }));
  const { results } = await (await xContent.POST(dashPost("/api/cron/x-content", { brandId: BRAND.id, format: "single", count: 5 }))).json();
  assert.equal(results[0].queued, 0);
  assert.match(results[0].error, /ChatGPT/);
  assert.equal(anthropic().length, 0);
  assert.equal(fal().length, 0);
});

test("the daily photo slot is skipped while ChatGPT photos are on", async () => {
  reset(db());
  const res = await xContent.GET(new Request("https://studio.test/api/cron/x-content?slot=visual", { headers: { authorization: "Bearer cron" } }));
  const { results } = await res.json();
  assert.equal(results[0].queued, 0);
  assert.equal(anthropic().length, 0);
  assert.equal(inserted().length, 0);
});

test("uploading the ChatGPT photo attaches it, files it in the library and clears 'needs photo'", async () => {
  const item = { id: "item-1", brand_id: BRAND.id, template: "x-post", status: "draft", needs_photo: true, photo_prompt: PROMPT, slide_paths: [], tw_caption: "Feet up", brands: BRAND };
  reset(db(BRAND, item));
  const jpeg = new Uint8Array(1000); jpeg[0] = 0xff; jpeg[1] = 0xd8;
  const form = new FormData();
  form.append("id", "item-1");
  form.append("file", new File([jpeg], "chatgpt.jpg", { type: "image/jpeg" }));
  const res = await xPhoto.POST(new Request("https://studio.test/api/content/x-photo", { method: "POST", headers: { "x-dashboard-key": "dash" }, body: form }));
  assert.equal(res.status, 200);
  const media = calls.find((c) => c.kind === "supabase" && c.method === "POST" && c.url.includes("/rest/v1/brand_media")).body;
  assert.equal(media.shot.source, "chatgpt");
  assert.ok(!media.shot.scene.description.includes(OUTPUT_LINE), "described by the scene, for later variety");
  assert.match(media.storage_path, /^brand-1\/chatgpt-/);
  const [update] = updates();
  assert.deepEqual(update.slide_paths, [media.storage_path]);
  assert.equal(update.needs_photo, false);
  assert.equal(fal().length, 0);
  assert.equal(anthropic().length, 0, "no photo check on a photo Tav made himself");

  reset(db(BRAND, item));
  const bad = new FormData();
  bad.append("id", "item-1");
  bad.append("file", new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "x.png", { type: "image/png" }));
  const refused = await xPhoto.POST(new Request("https://studio.test/api/content/x-photo", { method: "POST", headers: { "x-dashboard-key": "dash" }, body: bad }));
  assert.equal(refused.status, 400);
  assert.equal(updates().length, 0);
});

test("'Make it with AI instead' makes the same request on fal, with the photo check", async () => {
  const item = { id: "item-2", brand_id: BRAND.id, template: "x-post", status: "draft", needs_photo: true, photo_prompt: PROMPT, slide_paths: [], tw_caption: "Feet up", brands: BRAND };
  reset(db(BRAND, item));
  const res = await xPhoto.POST(dashPost("/api/content/x-photo", { id: "item-2" }));
  assert.equal(res.status, 200);
  const [gen] = fal();
  assert.ok(gen.body.prompt.startsWith("A candid photo of her feet up on the crew rest bunk"));
  assert.equal(gen.body.prompt.split(OUTPUT_LINE).length - 1, 1, "the format line once, not twice");
  assert.equal(gen.body.image_urls, undefined, "plain request, no reference photos");
  assert.deepEqual(anthropic().map((c) => c.stage), ["qa"]);
  assert.equal(updates()[0].needs_photo, false);
});

test("a post waiting for its photo can't be approved, posted now, or picked by the posting cron", async () => {
  const waiting = { id: "item-3", brand_id: BRAND.id, template: "x-post", status: "ready", needs_photo: true, platforms: ["twitter"], slide_paths: [], tw_caption: "Feet up", scheduled_for: "2026-01-01", brands: BRAND };
  reset(db(BRAND, waiting));
  const approve = await content.PATCH(new Request("https://studio.test/api/content", { method: "PATCH", headers: { "x-dashboard-key": "dash", "content-type": "application/json" }, body: JSON.stringify({ id: "item-3", status: "ready" }) }));
  assert.equal(approve.status, 400);
  assert.equal(updates().length, 0);

  const now = await postNow.POST(dashPost("/api/content/post-now", { id: "item-3" }));
  assert.equal(now.status, 400);
  assert.match((await now.json()).error, /photo/);

  reset(({ url }) => {
    if (url.includes("/rest/v1/brands")) return { body: [BRAND] };
    if (url.includes("/rest/v1/content_items") && url.includes("status=eq.ready")) return { body: [waiting] };
  });
  const cron = await postTwitter.GET(new Request("https://studio.test/api/cron/post-twitter", { headers: { authorization: "Bearer cron" } }));
  const { results } = await cron.json();
  assert.equal(results[0].posted, false);
  assert.equal(results[0].reason, "nothing ready");
});
