import { dashboardAuthorized, unauthorized } from "@/lib/dashboard";

export const maxDuration = 40;
export const dynamic = "force-dynamic";

// Throwaway test route — proves out a realistic-human, no-voiceover Reel
// (music/overlay added afterward by hand) on one short, cheap sample before
// any real pipeline gets built around it. Delete this once the real Reels
// feature exists.
//
// Video generation is submitted here and polled from the browser (see
// status/route.js) rather than held open on this connection — a serverless
// function holding one request open for a 30-90s video generation can get
// killed by the platform mid-request, which the browser just sees as a bare
// "Failed to fetch" with no useful error.
//
// A model can fail two different ways: the submit call itself can error
// (caught here), or the job can be accepted fine and then die during actual
// processing (only visible once the browser polls status). The client
// handles the second case by calling this route again with `skipModels`
// set to try the next candidate — see ReelTest.js.

const FAL_HEADERS = { Authorization: `Key ${process.env.FAL_API_KEY}`, "Content-Type": "application/json" };

async function fetchWithTimeout(url, opts, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } catch (e) {
    if (e.name === "AbortError") throw new Error(`timed out after ${ms / 1000}s`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// The locked "world" for Healthcode Performance's Reels — one consistent
// person and a couple of recurring settings, reused word-for-word in every
// prompt so the series reads as one channel, not random stock clips.
const PERSON = "a woman in her late 20s, warm light-brown skin, dark hair in a loose low bun, wearing a soft cream knit jumper, natural and relaxed, no visible logos or text, no jewellery";
const MORNING_RESET = "a bright home kitchen with light wood countertops, a large window letting in soft warm morning sunlight, a couple of green plants, minimal and clean but lived-in, not a sterile studio";

const PROMPT = `${PERSON}, standing in ${MORNING_RESET}, slowly pouring hot coffee from a moka pot into a plain white mug, soft steam rising, unhurried natural movement, realistic photographic look, shallow depth of field, static or gentle handheld camera, no text, no logos, no other people, no dialogue`;

// Veo first — quality is the priority now that the budget supports it at
// this length. LTX-2/Wan stay as cheaper fallbacks if Veo's endpoint has
// trouble, same resilience pattern as before.
export const VIDEO_MODELS = [
  { id: "fal-ai/veo3.1", body: (prompt) => ({ prompt, aspect_ratio: "9:16", duration: 7, generate_audio: false }) },
  { id: "fal-ai/ltx-2/text-to-video/fast", body: (prompt) => ({ prompt, aspect_ratio: "9:16", duration: 7 }) },
  { id: "fal-ai/wan-25-preview/text-to-video", body: (prompt) => ({ prompt, resolution: "1080p", duration: "5", aspect_ratio: "9:16" }) },
];

async function submitVideo(prompt, skip) {
  const candidates = VIDEO_MODELS.filter((m) => !skip.includes(m.id));
  if (!candidates.length) throw new Error("no video models left to try — every candidate has failed");
  const failures = [];
  for (const model of candidates) {
    try {
      const submitRes = await fetchWithTimeout(`https://queue.fal.run/${model.id}`, { method: "POST", headers: FAL_HEADERS, body: JSON.stringify(model.body(prompt)) }, 15000);
      const submitText = await submitRes.text();
      let submitOut;
      try { submitOut = JSON.parse(submitText); } catch { submitOut = { raw: submitText }; }
      if (!submitRes.ok) throw new Error(`${submitRes.status}: ${submitText.slice(0, 400)}`);
      if (!submitOut.status_url || !submitOut.response_url) throw new Error(`no status/response URL: ${submitText.slice(0, 300)}`);
      return { model: model.id, statusUrl: submitOut.status_url, responseUrl: submitOut.response_url };
    } catch (e) {
      failures.push(`${model.id} — ${e.message}`);
    }
  }
  throw new Error(failures.join(" | "));
}

export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  if (!process.env.FAL_API_KEY) return Response.json({ error: "FAL_API_KEY is not set" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const skipModels = Array.isArray(body.skipModels) ? body.skipModels : [];

  const out = { statusUrl: null, responseUrl: null, model: null, errors: [] };

  try {
    const submitted = await submitVideo(PROMPT, skipModels);
    out.statusUrl = submitted.statusUrl;
    out.responseUrl = submitted.responseUrl;
    out.model = submitted.model;
  } catch (e) {
    out.errors.push("video: " + e.message);
  }

  return Response.json(out);
}
