import { dashboardAuthorized, unauthorized, supabaseAdmin, attachSlideUrlsMany, brandPlatforms, postedColumn, PLATFORMS } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const supabase = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: brands, error: bErr }, { data: due, error: dErr }, { data: postedToday }] = await Promise.all([
    supabase.from("brands").select("id, name, daily_target, visual_theme").order("created_at"),
    supabase.from("content_items").select("*, brands(name, visual_theme)").eq("status", "ready").lte("scheduled_for", today).order("scheduled_for").order("created_at"),
    supabase.from("content_items").select(["brand_id", ...PLATFORMS.map(postedColumn)].join(", "))
      .or(PLATFORMS.map((p) => `${postedColumn(p)}.gte.${today}`).join(",")),
  ]);
  if (bErr) return Response.json({ error: bErr.message }, { status: 500 });
  if (dErr) return Response.json({ error: dErr.message }, { status: 500 });

  const items = (due || []).map((i) => {
    const platforms = brandPlatforms(i.brands);
    const remaining = platforms.filter((p) => !i[postedColumn(p)]);
    return { ...i, platforms, remaining };
  }).filter((i) => i.remaining.length);

  const counts = {};
  for (const row of postedToday || []) {
    const n = PLATFORMS.filter((p) => row[postedColumn(p)] && row[postedColumn(p)] >= today).length;
    counts[row.brand_id] = (counts[row.brand_id] || 0) + n;
  }

  return Response.json({
    today,
    items: await attachSlideUrlsMany(items),
    brands: (brands || []).map((b) => ({ id: b.id, name: b.name, daily_target: b.daily_target, platforms: brandPlatforms(b), posted_today: counts[b.id] || 0 })),
  });
}
