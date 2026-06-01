import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: "portrait_4_3",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await response.json();
    const imageUrl = data.images?.[0]?.url;
    if (!imageUrl) return NextResponse.json({ error: "No image returned" }, { status: 500 });

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("BG generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
