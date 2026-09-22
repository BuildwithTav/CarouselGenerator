import { dashboardAuthorized, unauthorized } from "@/lib/dashboard";

export const maxDuration = 40;
export const dynamic = "force-dynamic";

// Throwaway test route — proves out the open-source video + voice stack
// (LTX-2/Wan for visuals, Kokoro for voiceover, both via fal.ai) on one
// short, cheap sample before any real pipeline gets built around them.
// Delete this once the real Reels feature exists.
//
// Video generation is submitted here and polled from the browser (see
// status/route.js) rather than held open on this connection — a serverless
// function holding one request open for the 30-90s video generation can
// get killed by the platform mid-request, which the browser just sees as
// a bare "Failed to fetch" with no useful error.
//
// A model can fail two different ways: the submit call itself can error
// (caught here), or the job can be accepted fine and then die during
// actual processing (only visible once the browser polls status). The
// client handles the second case by calling this route again with
// `skipModels` set to try the next candidate — see ReelTest.js.

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

async function callFalSync(model, body, timeoutMs = 15000) {
  const res = await fetchWithTimeout(`https://fal.run/${model}`, { method: "POST", headers: FAL_HEADERS, body: JSON.stringify(body) }, timeoutMs);
  const text = await res.text();
  let out;
  try { out = JSON.parse(text); } catch { out = { raw: text }; }
  if (!res.ok) throw new Error(`${model} ${res.status}: ${text.slice(0, 500)}`);
  return out;
}

function findUrl(out) {
  return out?.video?.url || out?.audio?.url || out?.image?.url || out?.url || out?.images?.[0]?.url || null;
}

export const VIDEO_MODELS = [
  { id: "fal-ai/ltx-2/text-to-video/fast", body: (prompt) => ({ prompt }) },
  { id: "fal-ai/wan-25-preview/text-to-video", body: (prompt) => ({ prompt, resolution: "1080p", duration: "5" }) },
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
  const isRetry = skipModels.length > 0;

  const out = { audio: null, statusUrl: null, responseUrl: null, model: null, errors: [] };

  // Video (up to 2 sequential model attempts, 15s each) and audio (15s) ran
  // one after another before — worst case 45s against a 30s budget, which
  // is exactly the kind of thing that gets a function killed mid-request
  // with no response at all. Running them concurrently caps the worst case
  // at whichever is slower, not the sum of both.
  const videoPromise = submitVideo(
    "Close-up of a wooden bowl being filled with fresh berries, oats, and a drizzle of honey on a rustic kitchen counter, soft morning window light, slow gentle camera pan, no people, no text, no logos, natural food photography",
    skipModels
  );
  // Only generate the voiceover on the first call — a retry-with-a-different-
  // model doesn't need it regenerated.
  const audioPromise = isRetry
    ? Promise.resolve(null)
    : callFalSync("fal-ai/kokoro/british-english", {
        prompt: "Here's a food swap that could change your mornings. Swap your sugary cereal for a bowl of oats, fresh berries, and a little honey.",
        voice: "bf_alice",
        speed: 1.0,
      });

  const [videoResult, audioResult] = await Promise.allSettled([videoPromise, audioPromise]);

  if (videoResult.status === "fulfilled") {
    out.statusUrl = videoResult.value.statusUrl;
    out.responseUrl = videoResult.value.responseUrl;
    out.model = videoResult.value.model;
  } else {
    out.errors.push("video: " + videoResult.reason.message);
  }

  if (audioResult.status === "fulfilled" && audioResult.value) {
    out.audio = findUrl(audioResult.value) || audioResult.value;
  } else if (audioResult.status === "rejected") {
    out.errors.push("audio: " + audioResult.reason.message);
  }

  return Response.json(out);
}
