import { dashboardAuthorized, unauthorized } from "@/lib/dashboard";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// Throwaway test route — proves out the open-source video + voice stack
// (LTX-2/Wan for visuals, Kokoro for voiceover, both via fal.ai) on one
// short, cheap sample before any real pipeline gets built around them.
// Delete this once the real Reels feature exists.
//
// Video generation is submitted here and polled from the browser (see
// status/route.js) rather than held open on this connection — a serverless
// function holding one request open for the 30-90s video generation can
// take can get killed by the platform mid-request, which the browser just
// sees as a bare "Failed to fetch" with no useful error.

const FAL_HEADERS = { Authorization: `Key ${process.env.FAL_API_KEY}`, "Content-Type": "application/json" };

async function callFalSync(model, body) {
  const res = await fetch(`https://fal.run/${model}`, { method: "POST", headers: FAL_HEADERS, body: JSON.stringify(body) });
  const text = await res.text();
  let out;
  try { out = JSON.parse(text); } catch { out = { raw: text }; }
  if (!res.ok) throw new Error(`${model} ${res.status}: ${text.slice(0, 500)}`);
  return out;
}

function findUrl(out) {
  return out?.video?.url || out?.audio?.url || out?.image?.url || out?.url || out?.images?.[0]?.url || null;
}

// A downstream_service_error at submit time means that specific provider
// is having a bad day right now, not that our request is wrong — worth
// falling back to a different model/backend rather than just failing.
const VIDEO_MODELS = [
  { id: "fal-ai/ltx-2/text-to-video/fast", body: (prompt) => ({ prompt }) },
  { id: "fal-ai/wan-25-preview/text-to-video", body: (prompt) => ({ prompt, resolution: "1080p", duration: "5" }) },
];

async function submitVideo(prompt) {
  const failures = [];
  for (const model of VIDEO_MODELS) {
    try {
      const submitRes = await fetch(`https://queue.fal.run/${model.id}`, { method: "POST", headers: FAL_HEADERS, body: JSON.stringify(model.body(prompt)) });
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

  const out = { audio: null, statusUrl: null, responseUrl: null, model: null, errors: [] };

  try {
    const submitted = await submitVideo(
      "Close-up of a wooden bowl being filled with fresh berries, oats, and a drizzle of honey on a rustic kitchen counter, soft morning window light, slow gentle camera pan, no people, no text, no logos, natural food photography"
    );
    out.statusUrl = submitted.statusUrl;
    out.responseUrl = submitted.responseUrl;
    out.model = submitted.model;
  } catch (e) {
    out.errors.push("video: " + e.message);
  }

  try {
    const audioOut = await callFalSync("fal-ai/kokoro/british-english", {
      prompt: "Here's a food swap that could change your mornings. Swap your sugary cereal for a bowl of oats, fresh berries, and a little honey.",
      voice: "bf_alice",
      speed: 1.0,
    });
    out.audio = findUrl(audioOut) || audioOut;
  } catch (e) {
    out.errors.push("audio: " + e.message);
  }

  return Response.json(out);
}
