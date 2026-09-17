import { createClient } from "@supabase/supabase-js";

export const BUCKET = "brand-media";
export const SIGNED_URL_TTL_SECONDS = 60 * 60;

export function dashboardAuthorized(req) {
  const key = req.headers.get("x-dashboard-key");
  return !!process.env.DASHBOARD_PASSPHRASE && key === process.env.DASHBOARD_PASSPHRASE;
}

let cached;
export function supabaseAdmin() {
  if (!cached) cached = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  return cached;
}

export async function signPaths(paths) {
  if (!paths?.length) return [];
  const { data } = await supabaseAdmin().storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  return (data || []).map((d) => d.signedUrl || null);
}

export const PLATFORMS = ["instagram", "tiktok", "youtube"];

export function brandPlatforms(brand) {
  const p = brand?.visual_theme?.platforms;
  return Array.isArray(p) && p.length ? p.filter((x) => PLATFORMS.includes(x)) : PLATFORMS;
}

export function postedColumn(platform) {
  return `posted_${platform}_at`;
}

export function unauthorized() {
  return Response.json({ error: "Not authorized" }, { status: 403 });
}

export async function attachSlideUrls(item) {
  if (!item) return item;
  const slide_urls = await signPaths(item.slide_paths || []);
  return { ...item, slide_urls, thumb_url: slide_urls[0] || null };
}

export async function attachSlideUrlsMany(items) {
  const all = items.flatMap((i) => i.slide_paths || []);
  const urls = await signPaths(all);
  let cursor = 0;
  return items.map((i) => {
    const n = (i.slide_paths || []).length;
    const slide_urls = urls.slice(cursor, cursor + n);
    cursor += n;
    return { ...i, slide_urls, thumb_url: slide_urls[0] || null };
  });
}

// Increments use_count / last_used_at on brand_media rows. Counts duplicates
// (the same photo on two slides counts twice).
export async function bumpMediaUse(ids) {
  const counts = {};
  for (const id of ids || []) if (id) counts[id] = (counts[id] || 0) + 1;
  const entries = Object.entries(counts);
  if (!entries.length) return;
  const supabase = supabaseAdmin();
  const { data: rows } = await supabase.from("brand_media").select("id, use_count").in("id", entries.map(([id]) => id));
  const now = new Date().toISOString();
  await Promise.all((rows || []).map((r) => supabase.from("brand_media").update({ use_count: (r.use_count || 0) + counts[r.id], last_used_at: now }).eq("id", r.id)));
}

// Picks photos for slides that need one but have none, least-used first,
// never repeating a photo within the carousel while the library allows it.
// Mutates and returns the slides array. `needs(idx, slide)` decides which
// slides get a photo; `exclude` is a set of media ids to skip (profile photo).
export async function assignSlideImages(brandId, slides, needs, exclude = []) {
  const supabase = supabaseAdmin();
  const { data: media } = await supabase
    .from("brand_media")
    .select("id, storage_path, use_count, last_used_at")
    .eq("brand_id", brandId)
    .eq("file_type", "image")
    .order("use_count", { ascending: true })
    .order("last_used_at", { ascending: true, nullsFirst: true })
    .limit(500);
  const skip = new Set(exclude.filter(Boolean));
  const pool = (media || []).filter((m) => !skip.has(m.id));
  if (!pool.length) return slides;
  const usedHere = new Set(slides.map((s) => s.image_media_id).filter(Boolean));
  let cursor = 0;
  const next = () => {
    for (let n = 0; n < pool.length; n++) {
      const m = pool[(cursor + n) % pool.length];
      if (!usedHere.has(m.id)) { cursor = (cursor + n + 1) % pool.length; usedHere.add(m.id); return m; }
    }
    const m = pool[cursor % pool.length]; // library smaller than the carousel: repeat
    cursor = (cursor + 1) % pool.length;
    return m;
  };
  slides.forEach((s, i) => {
    if (s.image_media_id || !needs(i, s)) return;
    const m = next();
    s.image_media_id = m.id;
    s.image_path = m.storage_path;
  });
  return slides;
}
