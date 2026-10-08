// A fetch stand-in for Anthropic, fal and Supabase, so the image pipeline
// can be exercised end to end without network access or spend. Tests set
// `handlers` and read `calls`.
export const calls = [];
export const handlers = {
  director: (n = 1) => ({ continuity: { setting: "aircraft jumpseat", wardrobe: "established uniform, sheer tan tights, black patent court heels", lighting: "warm ambient cabin light", mode: "cabin_candid" }, shots: Array.from({ length: n }, () => ({ scene: { setting: "aircraft jumpseat", subject_action: "seated after shift", wardrobe: "uniform", footwear_state: "one heel removed", required_objects: ["jumpseat"], expected_feet_count: 2 }, shot: { distance: "tight", camera_height: "ankle", view: "side profile", body_position: "seated", footwear_state: "one heel removed", emphasis: "heel slipping" }, score_reason: "fits" })) }),
  writer: (n) => ({ prompts: Array.from({ length: n }, (_, i) => `Tight ankle-height side view ${i + 1}, sheer tan tights, black patent court heels.`) }),
  qa: () => ({ decision: "pass", face_visible: false, identity_match: 0.92, feet_count: 2, toes_plausible: true, left_right_plausible: true, feet_clear: true, anatomy_score: 9, photorealism_score: 9, wrong_uniform: false, wrong_shoe_colour: false, wrong_tights_colour: false, wrong_setting: false, continuity_score: 0.9, text_or_lettering_present: false, corrections: [] }),
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
    else if (sys.includes("strict photo checker")) { stage = "qa"; out = handlers.qa(); }
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
  if (url.startsWith("https://fake.fal.media/")) return new Response(new Uint8Array(400000), { status: 200, headers: { "content-type": "image/jpeg" } });
  if (url.includes("fake.supabase.co")) {
    calls.push({ kind: "supabase", method, url: decodeURIComponent(url), body: body ? JSON.parse(body) : null });
    if (url.includes("/storage/v1/object/sign/")) return json({ signedURL: "/object/sign/" + url.split("/sign/")[1].split("?")[0] + "?token=t" });
    if (url.includes("/storage/v1/object/")) return json({ Key: "brand-media/x.jpg" });
    if (url.includes("/rest/v1/image_attempts")) return new Response(null, { status: 201 });
    if (url.includes("/rest/v1/brand_media") && method === "POST") return json({ id: "media-new", ...JSON.parse(body) }, 201);
    if (url.includes("/rest/v1/brand_media") && url.includes("is_reference")) return json(handlers.refs());
    if (url.includes("/rest/v1/brand_media")) return json([]);
    return json([]);
  }
  throw new Error("Unmocked fetch: " + url);
}
