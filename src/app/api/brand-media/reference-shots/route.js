import { dashboardAuthorized, unauthorized, supabaseAdmin } from "@/lib/dashboard";
import { generateMatchingPhoto } from "@/lib/imageGen";
import { characterOf } from "@/lib/brandTemplate";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Three clean "this is her" shots generated from the brand's fixed
// character description alone (no existing references): her feet up
// close, her legs, and her hair and build from behind. They land in the
// media library unstarred; the ones that look right get starred in the X
// tab and from then on every new photo copies her from them.
function shotPrompts(c) {
  const look = "Soft natural daylight, shot on an iPhone, everything in focus, real skin and fabric texture, true-to-life colour, a calm, simple background.";
  return [
    `The top of the frame sits at her mid-calf: a close-up of her bare feet and ankles resting side by side on a crisp white hotel bed sheet, seen side-on at foot level. Her ${c.feet}, and ${c.skin}. Both feet fully in view, relaxed and natural, a true left and right pair, every toe clear and sharp. ${look}`,
    `The top of the frame cuts across her hips: her ${c.legs}, standing barefoot on a pale wooden hotel floor in a fitted navy knee-length skirt, feet flat, relaxed and side by side. Her ${c.feet}, and ${c.skin}. Legs and feet sharp and central. ${look}`,
    `Shot from directly behind as she stands at a hotel window looking out, framed from the top of her head down to her knees: the back of her head with ${c.hair}, her slim back and ${c.legs}, in a fitted navy skirt, a white blouse and sheer tan tights. ${c.skin}. ${look}`,
  ];
}

export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const { brandId } = await req.json();
  if (!brandId) return Response.json({ error: "brandId is required" }, { status: 400 });
  const { data: brand, error } = await supabaseAdmin().from("brands").select("*").eq("id", brandId).single();
  if (error || !brand) return Response.json({ error: "Brand not found" }, { status: 404 });
  const c = characterOf(brand);
  if (!c) return Response.json({ error: "This brand has no fixed character set up yet" }, { status: 400 });

  const results = await Promise.allSettled(
    shotPrompts(c).map((prompt) => generateMatchingPhoto(brand, { prompt, useReferences: false, note: "Reference shot" }))
  );
  const media = results.filter((r) => r.status === "fulfilled").map((r) => r.value.media);
  const errors = results.filter((r) => r.status === "rejected").map((r) => r.reason?.message || String(r.reason));
  if (!media.length) return Response.json({ error: "No reference shots came back: " + errors.join(" | ") }, { status: 502 });
  return Response.json({ media, errors });
}
