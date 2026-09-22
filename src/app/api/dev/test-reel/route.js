import { dashboardAuthorized, unauthorized } from "@/lib/dashboard";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

// Throwaway test route — proves out the open-source video + voice stack
// (LTX-2 for visuals, Kokoro for voiceover, both via fal.ai) on one short,
// cheap sample before any real pipeline gets built around them. Delete this
// once the real Reels feature exists.

const FAL_HEADERS = { Authorization: `Key ${process.env.FAL_API_KEY}`, "Content-Type": "application/json" };

// Direct/sync call — fine for fast models like Kokoro TTS.
async function callFalSync(model, body) {
  const res = await fetch(`https://fal.run/${model}`, { method: "POST", headers: FAL_HEADERS, body: JSON.stringify(body) });
  const text = await res.text();
  let out;
  try { out = JSON.parse(text); } catch { out = { raw: text }; }
  if (!res.ok) throw new Error(`${model} ${res.status}: ${text.slice(0, 500)}`);
  return out;
}

// Queue-based call — required for slower models like video generation.
// Sync calls to fal.run get no retry on a transient "downstream_service_error";
// only queue-based requests get fal's own automatic retry on that class of
// failure, which is also why video needs this path and TTS doesn't.
async function callFalQueue(model, body, { timeoutMs = 95000, pollMs = 3000 } = {}) {
  const submitRes = await fetch(`https://queue.fal.run/${model}`, { method: "POST", headers: FAL_HEADERS, body: JSON.stringify(body) });
  const submitText = await submitRes.text();
  let submitOut;
  try { submitOut = JSON.parse(submitText); } catch { submitOut = { raw: submitText }; }
  if (!submitRes.ok) throw new Error(`${model} submit ${submitRes.status}: ${submitText.slice(0, 500)}`);
  const { status_url, response_url } = submitOut;
  if (!status_url || !response_url) throw new Error(`${model} submit returned no status/response URL: ${submitText.slice(0, 300)}`);

  const started = Date.now();
  let lastStatus = null;
  while (Date.now() - started < timeoutMs) {
    const statusRes = await fetch(status_url, { headers: FAL_HEADERS });
    lastStatus = await statusRes.json().catch(() => ({}));
    if (lastStatus.status === "COMPLETED") break;
    if (!statusRes.ok || lastStatus.status === "ERROR") throw new Error(`${model} failed: ${JSON.stringify(lastStatus).slice(0, 500)}`);
    await new Promise((r) => setTimeout(r, pollMs));
  }
  if (lastStatus?.status !== "COMPLETED") throw new Error(`${model} timed out after ${Math.round(timeoutMs / 1000)}s (last status: ${lastStatus?.status || "unknown"})`);

  const finalRes = await fetch(response_url, { headers: FAL_HEADERS });
  const finalText = await finalRes.text();
  let finalOut;
  try { finalOut = JSON.parse(finalText); } catch { finalOut = { raw: finalText }; }
  if (!finalRes.ok) throw new Error(`${model} response ${finalRes.status}: ${finalText.slice(0, 500)}`);
  return finalOut;
}

function findUrl(out) {
  return out?.video?.url || out?.audio?.url || out?.image?.url || out?.url || out?.images?.[0]?.url || null;
}

export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  if (!process.env.FAL_API_KEY) return Response.json({ error: "FAL_API_KEY is not set" }, { status: 500 });

  const results = { video: null, audio: null, errors: [] };

  try {
    const videoOut = await callFalQueue("fal-ai/ltx-2/text-to-video/fast", {
      prompt: "Close-up of a wooden bowl being filled with fresh berries, oats, and a drizzle of honey on a rustic kitchen counter, soft morning window light, slow gentle camera pan, no people, no text, no logos, natural food photography",
    });
    results.video = findUrl(videoOut) || videoOut;
  } catch (e) {
    results.errors.push("video: " + e.message);
  }

  try {
    const audioOut = await callFalSync("fal-ai/kokoro/british-english", {
      prompt: "Here's a food swap that could change your mornings. Swap your sugary cereal for a bowl of oats, fresh berries, and a little honey.",
      voice: "bf_alice",
      speed: 1.0,
    });
    results.audio = findUrl(audioOut) || audioOut;
  } catch (e) {
    results.errors.push("audio: " + e.message);
  }

  return Response.json(results);
}
