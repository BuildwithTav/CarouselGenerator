import crypto from "node:crypto";
import { BUCKET, itemPlatforms, postedColumn } from "./dashboard";

// X's API (both the v1.1 media endpoint and v2 tweet creation) authenticates
// writes with OAuth 1.0a user-context signing — there's no simpler bearer-token
// option for posting as a specific account. This hand-rolls that signing
// rather than pulling in a dependency, since it's ~30 lines of well-specified
// crypto with no good reason to trust a third-party package for it.

function pct(s) {
  return encodeURIComponent(s).replace(/[!*'()]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

// Builds the "Authorization: OAuth ..." header for one request. `extraParams`
// is only for requests whose non-OAuth parameters are themselves part of the
// signature base (form-urlencoded body or query string) — neither of our two
// calls below have any, since one sends multipart and the other JSON.
function oauthHeader(method, url, extraParams = {}) {
  const oauth = {
    oauth_consumer_key: process.env.TWITTER_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: process.env.TWITTER_ACCESS_TOKEN,
    oauth_version: "1.0",
  };
  const allParams = { ...oauth, ...extraParams };
  const normalized = Object.keys(allParams).sort().map((k) => `${pct(k)}=${pct(allParams[k])}`).join("&");
  const baseString = `${method.toUpperCase()}&${pct(url)}&${pct(normalized)}`;
  const signingKey = `${pct(process.env.TWITTER_API_SECRET)}&${pct(process.env.TWITTER_ACCESS_TOKEN_SECRET)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
  const headerParams = { ...oauth, oauth_signature: signature };
  return "OAuth " + Object.keys(headerParams).sort().map((k) => `${pct(k)}="${pct(headerParams[k])}"`).join(", ");
}

// Uploads one image via X's v1.1 media endpoint (the v2 API has no media
// upload of its own, every account still goes through this one) and returns
// a media_id to attach to a post. Simple (non-chunked) upload tops out at
// 5MB, comfortably above a single rendered slide PNG.
export async function uploadMedia(buffer, mimeType = "image/png") {
  const url = "https://upload.twitter.com/1.1/media/upload.json";
  const form = new FormData();
  form.append("media", new Blob([buffer], { type: mimeType }), "slide.png");
  const res = await fetch(url, { method: "POST", headers: { Authorization: oauthHeader("POST", url) }, body: form });
  const text = await res.text();
  if (!res.ok) throw new Error(`Twitter media upload ${res.status}: ${text.slice(0, 400)}`);
  let out;
  try { out = JSON.parse(text); } catch { out = {}; }
  if (!out.media_id_string) throw new Error("Twitter media upload returned no media_id");
  return out.media_id_string;
}

// Posts one tweet, with already-uploaded images attached if given (X allows
// up to 4 per post — pass one media_id for a single image, several for a
// carousel-style post, or none for a text-only post).
export async function postTweet(text, mediaIds) {
  const url = "https://api.twitter.com/2/tweets";
  const ids = (Array.isArray(mediaIds) ? mediaIds : [mediaIds]).filter(Boolean);
  const body = { text };
  if (ids.length) body.media = { media_ids: ids };
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: oauthHeader("POST", url), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Twitter post ${res.status}: ${JSON.stringify(out).slice(0, 400)}`);
  return out?.data?.id || null;
}

// Posts one content item to X right now: uploads its slide photos (if any,
// up to X's 4-per-post limit) then the post text, records posted_twitter_at,
// and flips status to "posted" once every platform this item targets has
// been marked posted. Shared by the scheduled cron and the dashboard's
// "Post now" button so both go through the exact same path.
//
// Refuses outright rather than silently posting the first 4 and dropping
// the rest — a multi-slide story cut short with no warning is exactly what
// happened the first time this ran against ordinary 5-7 slide carousels.
export async function postItemToX(supabase, item, brand) {
  const text = (item.tw_caption || item.caption || "").slice(0, 280);
  const paths = item.slide_paths || [];
  if (paths.length > 4) throw new Error(`This item has ${paths.length} photos — X allows at most 4 per post. Trim it to 4 or fewer before posting.`);
  const mediaIds = [];
  for (const path of paths) {
    const { data: file, error: dlErr } = await supabase.storage.from(BUCKET).download(path);
    if (dlErr) throw new Error("Could not download slide image: " + dlErr.message);
    mediaIds.push(await uploadMedia(Buffer.from(await file.arrayBuffer()), "image/png"));
  }
  const tweetId = await postTweet(text, mediaIds);

  const { data: updatedItem, error: upErr } = await supabase
    .from("content_items")
    .update({ posted_twitter_at: new Date().toISOString(), twitter_post_id: tweetId, updated_at: new Date().toISOString() })
    .eq("id", item.id)
    .select("*")
    .single();
  if (upErr) throw new Error("Posted to X but failed to record it: " + upErr.message);

  const platforms = itemPlatforms(updatedItem, brand);
  if (platforms.every((p) => updatedItem[postedColumn(p)])) {
    const { data: final } = await supabase.from("content_items").update({ status: "posted" }).eq("id", item.id).select("*").single();
    return final || updatedItem;
  }
  return updatedItem;
}

// Reads public engagement metrics for up to 100 already-posted tweets in one
// call, keyed by tweet ID. On-demand only (a "Refresh stats" button) rather
// than polled automatically — each read is a small but real per-call cost on
// X's pay-per-use API.
export async function fetchTweetMetrics(tweetIds) {
  const ids = [...new Set((tweetIds || []).filter(Boolean))].slice(0, 100);
  if (!ids.length) return {};
  const baseUrl = "https://api.twitter.com/2/tweets";
  const params = { ids: ids.join(","), "tweet.fields": "public_metrics" };
  const qs = Object.keys(params).map((k) => `${pct(k)}=${pct(params[k])}`).join("&");
  const res = await fetch(`${baseUrl}?${qs}`, { headers: { Authorization: oauthHeader("GET", baseUrl, params) } });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Twitter metrics ${res.status}: ${JSON.stringify(out).slice(0, 400)}`);
  const byId = {};
  for (const t of out.data || []) byId[t.id] = t.public_metrics;
  return byId;
}

// The authenticated account's current follower count.
export async function fetchFollowerCount() {
  const baseUrl = "https://api.twitter.com/2/users/me";
  const params = { "user.fields": "public_metrics" };
  const qs = Object.keys(params).map((k) => `${pct(k)}=${pct(params[k])}`).join("&");
  const res = await fetch(`${baseUrl}?${qs}`, { headers: { Authorization: oauthHeader("GET", baseUrl, params) } });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Twitter profile ${res.status}: ${JSON.stringify(out).slice(0, 400)}`);
  return out?.data?.public_metrics?.followers_count ?? null;
}
