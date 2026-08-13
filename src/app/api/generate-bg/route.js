import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

// fal.ai hosts several image models behind the same API key — no separate
// signup/billing needed for any of these. "schnell" is fal's fastest/
// cheapest Flux tier (near-free, noticeably lower quality). "nano-banana"
// (Google's Gemini 2.5 Flash Image) is strong for realistic photography at
// ~$0.04/image. "flux-dev" is a quality step up from schnell at ~$0.025/
// image. "ideogram-v3" is the pick when the image needs short in-image
// labels/icons/callouts composed cleanly — it's built specifically for
// legible typography in images (posters, diagrams) — at $0.06/image
// ("balanced" tier).
const FAL_MODELS = {
  "nano-banana": { endpoint: "fal-ai/gemini-25-flash-image", body: (prompt) => ({ prompt, num_images: 1 }) },
  "ideogram-v3": { endpoint: "fal-ai/ideogram/v3", body: (prompt) => ({ prompt, image_size: "portrait_4_3", rendering_speed: "BALANCED", num_images: 1 }) },
  "flux-dev": { endpoint: "fal-ai/flux/dev", body: (prompt) => ({ prompt, image_size: "portrait_4_3", num_inference_steps: 28, num_images: 1, enable_safety_checker: true }) },
  "flux-schnell": { endpoint: "fal-ai/flux/schnell", body: (prompt) => ({ prompt, image_size: "portrait_4_3", num_inference_steps: 4, num_images: 1, enable_safety_checker: true }) },
};
const DEFAULT_MODEL = "ideogram-v3";

// gpt-image-1 (OpenAI) — separate provider, separate API key (OPENAI_API_KEY,
// not set up yet as of writing). Requires its own billing at
// platform.openai.com; a ChatGPT subscription does not cover this. Notably
// stronger than the fal.ai models at composing short diagram-style labels/
// icons directly into the image, which is why it's worth wiring up alongside
// them rather than replacing them. Always returns base64 (no hosted URL), so
// this route uploads it to Vercel Blob itself and returns a normal imageUrl —
// callers don't need to know the difference.
async function generateWithOpenAI(prompt) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
      quality: "medium",
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
  }
  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned from OpenAI");
  const buffer = Buffer.from(b64, "base64");
  const { url } = await put(`theme-hero-${Date.now()}.png`, buffer, { access: "public", contentType: "image/png" });
  return url;
}

export async function POST(req) {
  try {
    const { prompt, model } = await req.json();

    if (model === "gpt-image-1") {
      const imageUrl = await generateWithOpenAI(prompt);
      return NextResponse.json({ imageUrl });
    }

    const chosen = FAL_MODELS[model] ? model : DEFAULT_MODEL;
    const { endpoint, body } = FAL_MODELS[chosen];

    const response = await fetch(`https://fal.run/${endpoint}`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body(prompt)),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await response.json();
    const imageUrl = data.images?.[0]?.url || data.image?.url;
    if (!imageUrl) return NextResponse.json({ error: "No image returned" }, { status: 500 });

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("BG generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
