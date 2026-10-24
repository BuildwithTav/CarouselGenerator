import { dashboardAuthorized, unauthorized, supabaseAdmin } from "@/lib/dashboard";
import { startXConnect, finishXConnect, xAppConfigured } from "@/lib/twitterApi";
import { logGenerationError, friendlyError } from "@/lib/genLog";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// "Reconnect X" in the X tab (Tav, Oct 2026: X cancelled the login when he
// closed the account for a day, and he wanted to fix it from the dashboard,
// not Vercel). POST step "start" asks X for a sign-in link; Tav approves on
// X's page and types the code X shows; POST step "finish" swaps the code for
// a fresh login, saved in x_credentials (server-only) and used for posting
// from then on. GET says which account is connected and whether the latest
// post failed since the last successful one.
export async function GET(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const brandId = new URL(req.url).searchParams.get("brandId");
  if (!brandId) return Response.json({ error: "brandId is required" }, { status: 400 });
  const supabase = supabaseAdmin();
  const [{ data: login }, { data: lastError }, { data: lastPost }] = await Promise.all([
    supabase.from("x_credentials").select("screen_name, connected_at").eq("brand_id", brandId).maybeSingle(),
    supabase.from("generation_log").select("created_at, error").eq("brand_id", brandId).in("source", ["post-twitter", "post-now"]).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("content_items").select("posted_twitter_at").eq("brand_id", brandId).not("posted_twitter_at", "is", null).order("posted_twitter_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const after = (a, b) => !b || new Date(a) > new Date(b);
  const failing = lastError && after(lastError.created_at, lastPost?.posted_twitter_at) && after(lastError.created_at, login?.connected_at)
    ? { at: lastError.created_at, message: friendlyError(lastError.error), loggedOut: /Invalid or expired token|"code":\s*89|\b401\b|isn't connected/i.test(lastError.error) }
    : null;
  return Response.json({ connected: !!login?.connected_at, screenName: login?.screen_name || null, connectedAt: login?.connected_at || null, failing });
}

export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  if (!xAppConfigured()) return Response.json({ error: "The X app keys (TWITTER_API_KEY / TWITTER_API_SECRET) are not set" }, { status: 500 });
  const { brandId, step, pin } = await req.json().catch(() => ({}));
  if (!brandId) return Response.json({ error: "brandId is required" }, { status: 400 });
  const supabase = supabaseAdmin();
  const now = new Date().toISOString();

  if (step === "start") {
    try {
      const { token, tokenSecret, authorizeUrl } = await startXConnect();
      // Only the sign-in in progress is stored here; the current login stays
      // in use until the new one is confirmed.
      const { error } = await supabase.from("x_credentials").upsert({ brand_id: brandId, request_token: token, request_token_secret: tokenSecret, updated_at: now });
      if (error) throw new Error(error.message);
      return Response.json({ authorizeUrl });
    } catch (e) {
      await logGenerationError(brandId, "x-connect", "start", e.message);
      return Response.json({ error: friendlyError(e.message) }, { status: 502 });
    }
  }

  if (step === "finish") {
    const code = String(pin || "").replace(/\D/g, "");
    if (code.length < 4 || code.length > 10) return Response.json({ error: "Type the number X showed you after you pressed Authorize." }, { status: 400 });
    const { data: pending } = await supabase.from("x_credentials").select("request_token, request_token_secret").eq("brand_id", brandId).maybeSingle();
    if (!pending?.request_token) return Response.json({ error: "Press Reconnect X first." }, { status: 400 });
    try {
      const login = await finishXConnect({ token: pending.request_token, tokenSecret: pending.request_token_secret }, code);
      const { error } = await supabase.from("x_credentials").update({
        access_token: login.token, access_token_secret: login.tokenSecret, screen_name: login.screenName, x_user_id: login.userId,
        connected_at: now, request_token: null, request_token_secret: null, updated_at: now,
      }).eq("brand_id", brandId);
      if (error) throw new Error(error.message);
      return Response.json({ connected: true, screenName: login.screenName, connectedAt: now });
    } catch (e) {
      await logGenerationError(brandId, "x-connect", "finish", e.message);
      const wrongCode = /Twitter sign-in finish 401/.test(e.message);
      return Response.json({ error: wrongCode ? "X didn't accept that code. Press Reconnect X again and use the new code." : friendlyError(e.message) }, { status: wrongCode ? 400 : 502 });
    }
  }

  return Response.json({ error: "Unknown step" }, { status: 400 });
}
