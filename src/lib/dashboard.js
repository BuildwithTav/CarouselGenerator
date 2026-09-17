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
