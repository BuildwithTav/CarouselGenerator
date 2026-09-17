import { dashboardAuthorized, unauthorized, supabaseAdmin } from "@/lib/dashboard";
import { suggestIdeas } from "@/lib/contentAi";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const { brandId, count } = await req.json();
  if (!brandId) return Response.json({ error: "brandId is required" }, { status: 400 });

  const { data: brand, error } = await supabaseAdmin().from("brands").select("*").eq("id", brandId).single();
  if (error || !brand) return Response.json({ error: "Brand not found" }, { status: 404 });

  try {
    const ideas = await suggestIdeas(brand, Math.min(Math.max(Number(count) || 10, 3), 20));
    return Response.json({ ideas });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
