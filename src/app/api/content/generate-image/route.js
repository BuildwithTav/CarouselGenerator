import { dashboardAuthorized, unauthorized, supabaseAdmin, BUCKET, SIGNED_URL_TTL_SECONDS } from "@/lib/dashboard";
import { imagePrompt } from "@/lib/contentAi";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// FLUX 1.1 Pro Ultra via fal.ai — photoreal, strong on anatomy, 4:5 output.
const FAL_MODEL = "fal-ai/flux-pro/v1.1-ultra";

// Generates one AI photo for a slide, saves it to the brand's media library
// (so it gets use-count tracking like any upload) and returns the media row.
// Body: { brandId, slideText, idea, style: "editorial"|"candid", prompt? }
// Passing `prompt` skips the prompt-writing step and uses it verbatim.
export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  if (!process.env.FAL_API_KEY) return Response.json({ error: "FAL_API_KEY is not set" }, { status: 500 });
  const { brandId, slideText, idea, style, prompt: customPrompt } = await req.json();
  if (!brandId) return Response.json({ error: "brandId is required" }, { status: 400 });
  const supabase = supabaseAdmin();

  const { data: brand, error: bErr } = await supabase.from("brands").select("*").eq("id", brandId).single();
  if (bErr || !brand) return Response.json({ error: "Brand not found" }, { status: 404 });

  let prompt = String(customPrompt || "").trim();
  if (!prompt) {
    try {
      ({ prompt } = await imagePrompt(brand, { slideText, idea, style }));
    } catch (e) {
      return Response.json({ error: e.message }, { status: 502 });
    }
  }
  if (!prompt) return Response.json({ error: "Could not write an image prompt" }, { status: 502 });

  let imageUrl;
  try {
    const res = await fetch(`https://fal.run/${FAL_MODEL}`, {
      method: "POST",
      headers: { Authorization: `Key ${process.env.FAL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, aspect_ratio: "4:5", output_format: "jpeg", num_images: 1, enable_safety_checker: true, safety_tolerance: "5" }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`fal.ai ${res.status}: ${text.slice(0, 300)}`);
    }
    const out = await res.json();
    imageUrl = out?.images?.[0]?.url;
    if (!imageUrl) throw new Error("fal.ai returned no image");
  } catch (e) {
    console.error("Image generation failed:", e);
    return Response.json({ error: "Image generation failed: " + e.message, prompt }, { status: 502 });
  }

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return Response.json({ error: "Could not download the generated image", prompt }, { status: 502 });
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const storagePath = `${brandId}/gen-${Date.now()}.jpg`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, { contentType: "image/jpeg", upsert: false });
  if (upErr) return Response.json({ error: upErr.message, prompt }, { status: 500 });

  const { data: row, error: insErr } = await supabase
    .from("brand_media")
    .insert({
      brand_id: brandId,
      storage_path: storagePath,
      file_type: "image",
      original_filename: `ai-${Date.now()}.jpg`,
      mime_type: "image/jpeg",
      size_bytes: buffer.length,
      note: `AI: ${prompt}`.slice(0, 1000),
    })
    .select()
    .single();
  if (insErr) return Response.json({ error: insErr.message, prompt }, { status: 500 });

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  return Response.json({ media: { ...row, url: signed?.signedUrl || null }, prompt });
}
