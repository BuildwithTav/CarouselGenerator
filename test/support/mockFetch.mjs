// A fetch stand-in for Anthropic, fal and Supabase, so the image pipeline
// can be exercised end to end without network access or spend. Tests set
// `handlers` and read `calls`.
export const calls = [];
export const handlers = {
  director: (n = 1) => ({ continuity: { setting: "aircraft jumpseat", wardrobe: "established uniform, sheer tan tights, black patent court heels", lighting: "warm ambient cabin light", mode: "cabin_candid" }, shots: Array.from({ length: n }, () => ({ scene: { setting: "aircraft jumpseat", subject_action: "seated after shift", wardrobe: "uniform", footwear_state: "one heel removed", required_objects: ["jumpseat"], expected_feet_count: 2 }, shot: { distance: "tight", camera_height: "ankle", view: "side profile", body_position: "seated", footwear_state: "one heel removed", emphasis: "heel slipping" }, score_reason: "fits" })) }),
  writer: (n) => ({ prompts: Array.from({ length: n }, (_, i) => `Tight ankle-height side view ${i + 1}, sheer tan tights, black patent court heels.`) }),
  qa: () => ({ decision: "pass", face_visible: false, identity_match: 0.92, feet_count: 2, toes_plausible: true, left_right_plausible: true, extra_or_merged_items: false, feet_clear: true, anatomy_score: 9, photorealism_score: 9, wrong_uniform: false, wrong_shoe_colour: false, wrong_tights_colour: false, wrong_setting: false, continuity_score: 0.9, text_or_lettering_present: false, corrections: [] }),
  plain: (n) => ({ prompts: Array.from({ length: n }, (_, i) => `A candid photo of her curled up on the sofa on her day off, a mug of tea beside her, ${i + 1}.`) }),
  xpost: (n) => ({ text: `Feet up after a long one, number ${n} ✈️ #cabincrew`, scenes: [`Feet up on the crew rest bunk in sheer tan tights, ${n}`] }),
  xbatch: (n) => ({ posts: Array.from({ length: n }, (_, i) => ({ text: `Batch post ${i + 1} ✈️ #cabincrew`, scene: `Batch scene ${i + 1} in sheer tan tights` })) }),
  // Tests set this to answer a Supabase REST call themselves: return
  // { status, body } to answer, or nothing to fall through to the defaults.
  rest: null,
  fal: () => ({ status: 200, body: { images: [{ url: "https://fake.fal.media/out.jpg" }] } }),
  refs: () => [
    { id: "ref-a", storage_path: "b/ref-a.jpg", reference_view: "A" },
    { id: "ref-c", storage_path: "b/ref-c.jpg", reference_view: "C" },
    { id: "ref-d", storage_path: "b/ref-d.jpg", reference_view: "D" },
  ],
};
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

export async function mockFetch(input, init = {}) {
  const url = typeof input === "string" ? input : input.url;
  const method = (init.method || "GET").toUpperCase();
  const body = typeof init.body === "string" ? init.body : null;
  if (url.includes("api.anthropic.com")) {
    const req = JSON.parse(body);
    const sys = String(req.system || "");
    const userText = JSON.stringify(req.messages);
    let stage, out;
    if (sys.includes("visual director")) { stage = "director"; out = handlers.director((userText.split("Scenes, in order")[1]?.match(/\\n\d+\. /g) || []).length || 1); }
    else if (sys.includes("You write image prompts")) { stage = "writer"; out = handlers.writer((userText.match(/\\n\d+\. \{/g) || []).length || 1); }
    else if (sys.includes("photo checker")) { stage = "qa"; out = handlers.qa(); }
    else if (sys.includes("each written the way a person would ask ChatGPT")) { stage = "plain"; out = handlers.plain((userText.split("Scenes, in order")[1]?.match(/\\n\d+\. /g) || []).length || 1); }
    else if (sys.includes("You write one X (Twitter) post")) { stage = "xpost"; out = handlers.xpost(calls.filter((c) => c.stage === "xpost").length + 1); }
    else if (/You write \d+ X \(Twitter\) posts/.test(sys)) { stage = "xbatch"; out = handlers.xbatch(Number(sys.match(/You write (\d+) X/)[1])); }
    else { stage = "other"; out = {}; }
    calls.push({ kind: "anthropic", stage, req });
    return json({ id: "m", type: "message", role: "assistant", model: req.model, stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(out) }], usage: { input_tokens: 1000, output_tokens: 200 } });
  }
  if (url.startsWith("https://fal.run/")) {
    const parsed = JSON.parse(body);
    calls.push({ kind: "fal", url, body: parsed });
    const r = handlers.fal(parsed);
    return json(r.body, r.status);
  }
  if (url.startsWith("https://fal.ai/api/openapi/")) {
    const endpoint = new URL(url).searchParams.get("endpoint_id");
    const spec = handlers.falSchema?.(endpoint);
    return spec ? json(spec) : json({ detail: "not found" }, 404);
  }
  if (url.startsWith("https://fake.fal.media/")) return new Response(new Uint8Array(400000), { status: 200, headers: { "content-type": "image/jpeg" } });
  // X: by default the login has lapsed, as after Tav closed the account.
  if (url.startsWith("https://api.twitter.com/") || url.startsWith("https://upload.twitter.com/")) {
    calls.push({ kind: "twitter", method, url, auth: new Headers(init.headers).get("authorization") || "" });
    const r = handlers.twitter?.(url) || { status: 401, body: { errors: [{ message: "Invalid or expired token", code: 89 }] } };
    // X's sign-in steps answer in form encoding, not JSON.
    return r.text !== undefined ? new Response(r.text, { status: r.status || 200 }) : json(r.body, r.status);
  }
  if (url.includes("fake.supabase.co")) {
    const parsed = body ? JSON.parse(body) : null;
    calls.push({ kind: "supabase", method, url: decodeURIComponent(url), body: parsed });
    const own = handlers.rest?.({ method, url: decodeURIComponent(url), body: parsed });
    if (own) return own.body === undefined ? new Response(null, { status: own.status || 204 }) : json(own.body, own.status || 200);
    if (url.includes("/storage/v1/object/sign/") && Array.isArray(parsed?.paths)) return json(parsed.paths.map((p) => ({ path: p, signedURL: `/object/sign/brand-media/${p}?token=t` })));
    if (url.includes("/storage/v1/object/sign/")) return json({ signedURL: "/object/sign/" + url.split("/sign/")[1].split("?")[0] + "?token=t" });
    if (url.includes("/storage/v1/object/")) return json({ Key: "brand-media/x.jpg" });
    if (url.includes("/rest/v1/image_attempts")) return new Response(null, { status: 201 });
    if (url.includes("/rest/v1/model_tests") && method === "POST") return json(JSON.parse(body).map((r, i) => ({ id: `mt-${i}`, ...r })), 201);
    if (url.includes("/rest/v1/brand_media") && method === "POST") return json({ id: "media-new", ...JSON.parse(body) }, 201);
    if (url.includes("/rest/v1/brand_media") && url.includes("is_reference")) return json(handlers.refs());
    if (url.includes("/rest/v1/brand_media")) return json([]);
    return json([]);
  }
  throw new Error("Unmocked fetch: " + url);
}
