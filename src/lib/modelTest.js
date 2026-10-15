import { supabaseAdmin, BUCKET } from "./dashboard";
import { planPhotos, loadReferenceRows, signedUrlsFor, falGenerate } from "./imageGen";
import { assemblePrompt, qaImage, judgeQa } from "./visualPipeline";

// Side-by-side image model test (Tav, Oct 2026: "cheaper and better
// quality"). Each scene is planned once, then the exact same prompt and the
// same reference photos go to every model, so the only difference between
// the photos is the model. Every photo gets the normal photo check and is
// stored in model_tests (not the media library, so nothing here can end up
// in a post). Tav picks the best of each scene without seeing which model
// made it.
export const TEST_SCENES = [
  "Day off uniform: dressing gown, wet nail polish, kettle on. The heels don't get a say until Thursday",
  "Sitting on the jump seat before take-off, ankles together, navy court heels on",
  "Feet up on the crew rest bunk after a long flight in sheer tan tights, her heels set down beside the bunk",
  "Kneeling on the galley floor in sheer tan tights, soles to the camera, heels off beside her",
  "Bare feet up on the edge of the bath at home after a 14-hour shift, candles lit",
];

// Prices from fal's model pages (Oct 2026), by output size. Seedream 5 Pro
// also charges $0.0045 for each reference photo after the first.
const MP = (w, h) => (w && h ? (w * h) / 1e6 : null);
export const TEST_MODELS = [
  {
    key: "seedream-5-pro", label: "Seedream 5 Pro (now in use)", endpoint: "bytedance/seedream/v5/pro/edit",
    resolutions: ["1.5K", "1.5k"], size: { width: 1360, height: 1700 }, fallback: { image_size: { width: 1360, height: 1700 } },
    cost: (w, h, refs) => ((MP(w, h) ?? 2.3) > 2.36 ? 0.135 : 0.0675) + 0.0045 * Math.max(0, refs - 1),
  },
  // What ChatGPT itself uses. Priced by tokens on fal: about $0.07 a photo
  // at medium quality, $0.19 at high (third-party estimates, Oct 2026).
  // Tav ruled out high on price, so it's tested at medium.
  {
    key: "gpt-image-2", label: "GPT Image 2 (ChatGPT's model, medium)", endpoint: "openai/gpt-image-2/edit",
    resolutions: [], size: { width: 1024, height: 1280 }, sizeNames: ["1024x1536", "portrait_4_3", "portrait"],
    extra: { quality: "medium" }, fallback: { image_size: { width: 1024, height: 1280 }, quality: "medium" },
    cost: () => 0.07,
  },
  // Tav's ChatGPT experiment, with the logic kept: the director still works
  // out the moment (what's in view, what the words only mention), but the
  // model gets it as a short plain description instead of our long written
  // prompt. Shows whether the long prompt beats a short one.
  {
    key: "gpt-image-2-short", label: "GPT Image 2, short plain prompt", endpoint: "openai/gpt-image-2/edit",
    promptMode: "short",
    resolutions: [], size: { width: 1024, height: 1280 }, sizeNames: ["1024x1536", "portrait_4_3", "portrait"],
    extra: { quality: "medium" }, fallback: { image_size: { width: 1024, height: 1280 }, quality: "medium" },
    cost: () => 0.07,
  },
];

// The director's scene (already reasoned through) as one short request,
// the way you'd ask ChatGPT for it.
export function shortPrompt(item, hasReferences) {
  const sc = item?.scene || {}, sh = item?.shot || {};
  const objects = (sc.required_objects || []).filter(Boolean);
  return [
    `Make a photo of this moment: ${sc.subject_action || ""}`.trim(),
    sc.setting ? `Where: ${sc.setting}.` : "",
    [sc.wardrobe, sc.footwear_state].filter(Boolean).length ? `She's wearing ${[sc.wardrobe, sc.footwear_state].filter(Boolean).join("; ")}.` : "",
    objects.length ? `Also in the shot: ${objects.join(", ")}.` : "",
    `Framing: ${[sh.distance, sh.crop && `cropped at ${sh.crop}`, sh.view, sh.camera_height && `camera at ${sh.camera_height}`].filter(Boolean).join(", ")}. Her face is not in the photo.`,
    hasReferences ? "The woman is the one in the reference photos." : "",
  ].filter(Boolean).join("\n");
}
// Models from earlier tests, so their photos still get a name.
export const OLD_MODEL_LABELS = { "nano-banana-pro": "Nano Banana Pro (old)", "seedream-4.5": "Seedream 4.5", "nano-banana-2": "Nano Banana 2" };

// fal publishes each endpoint's input schema. Reading it means the request
// only uses parameters the model actually has (Nano Banana takes an aspect
// ratio and resolution, Seedream a pixel size), instead of guessing.
async function inputSchema(endpoint) {
  try {
    const res = await fetch(`https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=${endpoint}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const spec = await res.json();
    const schemas = spec?.components?.schemas || {};
    const ref = spec?.paths?.[`/${endpoint}`]?.post?.requestBody?.content?.["application/json"]?.schema?.$ref;
    const props = ref ? schemas[ref.split("/").pop()]?.properties : null;
    return props ? { props, schemas } : null;
  } catch {
    return null;
  }
}

function enumOf(node, schemas, depth = 0) {
  if (!node || depth > 4) return [];
  if (node.$ref) return enumOf(schemas[node.$ref.split("/").pop()], schemas, depth + 1);
  return [
    ...(Array.isArray(node.enum) ? node.enum : []),
    ...["anyOf", "oneOf", "allOf"].flatMap((k) => (node[k] || []).flatMap((n) => enumOf(n, schemas, depth + 1))),
  ];
}

// True when a schema node accepts a {width, height} object.
function allowsObject(node, schemas, depth = 0) {
  if (!node || depth > 4) return false;
  if (node.$ref) return allowsObject(schemas[node.$ref.split("/").pop()], schemas, depth + 1);
  if (node.type === "object" || node.properties) return true;
  return ["anyOf", "oneOf", "allOf"].some((k) => (node[k] || []).some((n) => allowsObject(n, schemas, depth + 1)));
}

export function buildRequest(model, prompt, imageUrls, schema) {
  const body = { prompt, image_urls: imageUrls, num_images: 1 };
  if (!schema) return { ...body, ...model.fallback };
  const { props, schemas } = schema;
  const pick = (name, wanted) => {
    const options = enumOf(props[name], schemas);
    if (!options.length) return wanted[0];
    for (const w of wanted) {
      const hit = options.find((o) => String(o).toLowerCase() === String(w).toLowerCase());
      if (hit !== undefined) return hit;
    }
    return undefined;
  };
  if (props.aspect_ratio) { const v = pick("aspect_ratio", ["4:5", "3:4"]); if (v) body.aspect_ratio = v; }
  if (props.resolution && model.resolutions.length) { const v = pick("resolution", model.resolutions); if (v) body.resolution = v; }
  if (props.image_size && !body.resolution) {
    const named = enumOf(props.image_size, schemas);
    if (named.length && !allowsObject(props.image_size, schemas)) {
      const v = pick("image_size", model.sizeNames || []);
      if (v) body.image_size = v;
    } else if (model.size) body.image_size = model.size;
  }
  for (const [k, v] of Object.entries(model.extra || {})) {
    if (!props[k]) continue;
    const options = enumOf(props[k], schemas);
    if (!options.length || options.includes(v)) body[k] = v;
  }
  if (props.output_format) { const v = pick("output_format", ["jpeg", "jpg"]); if (v) body.output_format = v; }
  if (props.max_images) body.max_images = 1;
  return body;
}

// Width and height straight from a JPEG or PNG, for when fal doesn't say.
export function imageSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  return { width: null, height: null };
}

async function runModel(brand, { model, schema, promptText, refUrls, item, continuity, runId, sceneIndex }) {
  const request = buildRequest(model, promptText, refUrls, schema);
  const row = { brand_id: brand.id, run_id: runId, scene_index: sceneIndex, scene: TEST_SCENES[sceneIndex], prompt: promptText, model: model.key, request: { ...request, prompt: undefined, image_urls: refUrls.length } };
  let gen;
  try {
    gen = await falGenerate(model.endpoint, request, { timeoutMs: GEN_TIMEOUT_MS });
  } catch (e) {
    return { ...row, error: e.message.slice(0, 500), cost_usd: e.charged ? model.cost(null, null, refUrls.length) : 0 };
  }
  const size = gen.width && gen.height ? { width: gen.width, height: gen.height } : imageSize(gen.buffer);
  const png = gen.buffer.readUInt32BE(0) === 0x89504e47;
  const storagePath = `${brand.id}/model-tests/${runId}/${sceneIndex}-${model.key}.${png ? "png" : "jpg"}`;
  const { error: upErr } = await supabaseAdmin().storage.from(BUCKET).upload(storagePath, gen.buffer, { contentType: png ? "image/png" : "image/jpeg", upsert: true });
  let qa = null, verdict = null, qaCost = 0;
  try {
    const out = await qaImage(brand, { candidateUrl: gen.url, scene: item.scene, shot: item.shot, continuity });
    qa = out.qa; qaCost = out.costUsd || 0;
    verdict = judgeQa(qa, { expectedFeet: item.scene?.expected_feet_count || 2 });
  } catch (e) {
    qa = { error: e.message.slice(0, 300) };
  }
  return {
    ...row,
    storage_path: upErr ? null : storagePath,
    error: upErr ? `Saved image failed: ${upErr.message}` : null,
    width: size.width, height: size.height,
    cost_usd: Number((model.cost(size.width, size.height, refUrls.length) + qaCost).toFixed(4)),
    qa, qa_pass: verdict ? verdict.pass : null, qa_hard_fails: verdict ? verdict.hard : null,
  };
}

// Seedream 5 Pro took over 110s once; the route allows 300s in total.
const GEN_TIMEOUT_MS = 170000;

// Runs one scene on every model in parallel (4 requests, well under fal's
// limit of 10 at once) and stores the results. Running a scene again in the
// same test replaces its photos, so a scene with a gap can be redone fairly:
// every model gets the new prompt.
export async function runModelTestScene(brand, { runId, sceneIndex }) {
  const scene = TEST_SCENES[sceneIndex];
  if (!scene) throw new Error("No such test scene");
  const [plan, schemas, refRows] = await Promise.all([
    planPhotos(brand, { texts: [scene], source: "model-test" }),
    Promise.all(TEST_MODELS.map((m) => inputSchema(m.endpoint))),
    loadReferenceRows(brand.id),
  ]);
  const item = plan.items[0];
  const refUrls = await signedUrlsFor((item.referenceIds || []).map((id) => refRows.find((r) => r.id === id)).filter(Boolean));
  const promptText = assemblePrompt(item.prompt, { hasReferences: refUrls.length > 0 });
  const plainPrompt = shortPrompt(item, refUrls.length > 0);
  const rows = await Promise.all(TEST_MODELS.map((model, i) => runModel(brand, { model, schema: schemas[i], promptText: model.promptMode === "short" ? plainPrompt : promptText, refUrls, item, continuity: plan.continuity, runId, sceneIndex })));
  await supabaseAdmin().from("model_tests").delete().eq("run_id", runId).eq("scene_index", sceneIndex);
  const { data, error } = await supabaseAdmin().from("model_tests").insert(rows).select();
  if (error) throw new Error(error.message);
  return data;
}
