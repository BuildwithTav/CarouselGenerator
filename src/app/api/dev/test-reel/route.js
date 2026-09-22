import { dashboardAuthorized, unauthorized } from "@/lib/dashboard";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

// Throwaway test route — proves out the open-source video + voice stack
// (LTX-2 for visuals, Kokoro for voiceover, both via fal.ai) on one short,
// cheap sample before any real pipeline gets built around them. Delete this
// once the real Reels feature exists.
async function callFal(model, body) {
  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${process.env.FAL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let out;
  try { out = JSON.parse(text); } catch { out = { raw: text }; }
  if (!res.ok) throw new Error(`${model} ${res.status}: ${text.slice(0, 500)}`);
  return out;
}

function findUrl(out) {
  return out?.video?.url || out?.audio?.url || out?.image?.url || out?.url || out?.images?.[0]?.url || null;
}

export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  if (!process.env.FAL_API_KEY) return Response.json({ error: "FAL_API_KEY is not set" }, { status: 500 });

  const results = { video: null, audio: null, errors: [] };

  try {
    const videoOut = await callFal("fal-ai/ltx-2/text-to-video/fast", {
      prompt: "Close-up of a wooden bowl being filled with fresh berries, oats, and a drizzle of honey on a rustic kitchen counter, soft morning window light, slow gentle camera pan, no people, no text, no logos, natural food photography",
    });
    results.video = findUrl(videoOut) || videoOut;
  } catch (e) {
    results.errors.push("video: " + e.message);
  }

  try {
    const audioOut = await callFal("fal-ai/kokoro/british-english", {
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
