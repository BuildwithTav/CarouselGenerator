import { dashboardAuthorized, unauthorized, supabaseAdmin, BUCKET, attachSlideUrls, attachSlideUrlsMany, brandPlatforms, postedColumn, PLATFORMS } from "@/lib/dashboard";
import { generatePackage } from "@/lib/contentAi";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const EDITABLE = ["idea", "pillar", "status", "scheduled_for", "slides", "caption", "hashtags", "yt_title", "yt_tags", "yt_pinned_comment", "yt_category", "media_id"];

export async function GET(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const brandId = url.searchParams.get("brandId");
  const status = url.searchParams.get("status");
  const supabase = supabaseAdmin();

  if (id) {
    const { data, error } = await supabase.from("content_items").select("*, brands(name, visual_theme, daily_target, automation_mode)").eq("id", id).single();
    if (error) return Response.json({ error: error.message }, { status: 404 });
    return Response.json({ item: await attachSlideUrls(data) });
  }

  let q = supabase.from("content_items").select("*, brands(name, visual_theme)").order("scheduled_for", { ascending: false }).order("created_at", { ascending: false }).limit(200);
  if (brandId) q = q.eq("brand_id", brandId);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: await attachSlideUrlsMany(data || []) });
}

export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const { brandId, idea, pillar, mediaId, slideCount, scheduledFor } = await req.json();
  if (!brandId || !idea?.trim()) return Response.json({ error: "brandId and idea are required" }, { status: 400 });
  const supabase = supabaseAdmin();

  const { data: brand, error: bErr } = await supabase.from("brands").select("*").eq("id", brandId).single();
  if (bErr || !brand) return Response.json({ error: "Brand not found" }, { status: 404 });

  let pkg;
  try {
    pkg = await generatePackage(brand, { idea: idea.trim(), pillar, slideCount: Math.min(Math.max(Number(slideCount) || 7, 3), 10) });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502 });
  }

  const { data: item, error } = await supabase
    .from("content_items")
    .insert({
      brand_id: brandId,
      idea: idea.trim(),
      pillar: pillar || null,
      status: brand.automation_mode === "auto_ready" ? "ready" : "draft",
      scheduled_for: scheduledFor || new Date().toISOString().slice(0, 10),
      media_id: mediaId || null,
      ...pkg,
    })
    .select("*, brands(name, visual_theme, daily_target, automation_mode)")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (mediaId) {
    const { data: m } = await supabase.from("brand_media").select("use_count").eq("id", mediaId).single();
    if (m) await supabase.from("brand_media").update({ use_count: (m.use_count || 0) + 1, last_used_at: new Date().toISOString() }).eq("id", mediaId);
  }

  return Response.json({ item: await attachSlideUrls(item) });
}

export async function PATCH(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const body = await req.json();
  const { id, action, platform } = body;
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  const supabase = supabaseAdmin();

  let update = { updated_at: new Date().toISOString() };

  if (action === "mark_posted" || action === "unmark_posted") {
    if (!PLATFORMS.includes(platform)) return Response.json({ error: "Unknown platform" }, { status: 400 });
    update[postedColumn(platform)] = action === "mark_posted" ? new Date().toISOString() : null;
  } else {
    for (const k of EDITABLE) if (k in body) update[k] = body[k];
  }

  const { data: item, error } = await supabase.from("content_items").update(update).eq("id", id).select("*, brands(name, visual_theme, daily_target, automation_mode)").single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (action) {
    const platforms = brandPlatforms(item.brands);
    const allPosted = platforms.every((p) => item[postedColumn(p)]);
    const nextStatus = allPosted ? "posted" : item.status === "posted" ? "ready" : item.status;
    if (nextStatus !== item.status) {
      const { data: updated } = await supabase.from("content_items").update({ status: nextStatus }).eq("id", id).select("*, brands(name, visual_theme, daily_target, automation_mode)").single();
      return Response.json({ item: await attachSlideUrls(updated || item) });
    }
  }
  return Response.json({ item: await attachSlideUrls(item) });
}

export async function DELETE(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const { id } = await req.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  const supabase = supabaseAdmin();

  const { data: item } = await supabase.from("content_items").select("slide_paths").eq("id", id).single();
  if (item?.slide_paths?.length) await supabase.storage.from(BUCKET).remove(item.slide_paths);
  const { error } = await supabase.from("content_items").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
