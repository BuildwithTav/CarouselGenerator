import { NextResponse } from "next/server";

// fal.ai hosts several image models behind the same API key. "schnell" is
// fal's fastest/cheapest Flux tier (near-free, noticeably lower quality —
// this was the default). "nano-banana" (Google's Gemini 2.5 Flash Image) is
// much stronger for realistic photography at ~$0.04/image; "flux-dev" is a
// quality step up from schnell at ~$0.025/image. All three go through the
// same FAL_API_KEY, no extra signup needed.
const MODELS = {
  "nano-banana": { endpoint: "fal-ai/gemini-25-flash-image", body: (prompt) => ({ prompt, num_images: 1 }) },
  "flux-dev": { endpoint: "fal-ai/flux/dev", body: (prompt) => ({ prompt, image_size: "portrait_4_3", num_inference_steps: 28, num_images: 1, enable_safety_checker: true }) },
  "flux-schnell": { endpoint: "fal-ai/flux/schnell", body: (prompt) => ({ prompt, image_size: "portrait_4_3", num_inference_steps: 4, num_images: 1, enable_safety_checker: true }) },
};
const DEFAULT_MODEL = "nano-banana";

export async function POST(req) {
  try {
    const { prompt, model } = await req.json();
    const chosen = MODELS[model] ? model : DEFAULT_MODEL;
    const { endpoint, body } = MODELS[chosen];

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
