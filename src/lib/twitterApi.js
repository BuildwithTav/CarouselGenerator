import crypto from "node:crypto";

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

// Posts one tweet, with an already-uploaded image attached if given.
export async function postTweet(text, mediaId) {
  const url = "https://api.twitter.com/2/tweets";
  const body = { text };
  if (mediaId) body.media = { media_ids: [mediaId] };
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: oauthHeader("POST", url), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Twitter post ${res.status}: ${JSON.stringify(out).slice(0, 400)}`);
  return out?.data?.id || null;
}
