import { dashboardAuthorized, unauthorized } from "@/lib/dashboard";

export const maxDuration = 25;
export const dynamic = "force-dynamic";

// One quick check of a fal.ai queue job's status, relayed from the browser's
// poll loop — see the parent route for why polling happens client-side
// instead of holding one long connection open server-side.
//
// Every fal call has an explicit timeout so a hung connection fails fast
// with a real error instead of holding this function open until the
// platform itself kills it (a bare 504 with no detail).

async function fetchWithTimeout(url, opts, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } catch (e) {
    if (e.name === "AbortError") throw new Error(`timed out after ${ms / 1000}s`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  if (!process.env.FAL_API_KEY) return Response.json({ error: "FAL_API_KEY is not set" }, { status: 500 });

  const { statusUrl, responseUrl } = await req.json();
  if (!statusUrl || !responseUrl) return Response.json({ error: "statusUrl and responseUrl are required" }, { status: 400 });

  const headers = { Authorization: `Key ${process.env.FAL_API_KEY}` };

  try {
    const statusRes = await fetchWithTimeout(statusUrl, { headers }, 10000);
    const statusOut = await statusRes.json().catch(() => ({}));
    if (!statusRes.ok || statusOut.status === "ERROR") {
      return Response.json({ status: "ERROR", error: JSON.stringify(statusOut).slice(0, 500) });
    }
    if (statusOut.status !== "COMPLETED") {
      return Response.json({ status: statusOut.status || "IN_QUEUE" });
    }

    const finalRes = await fetchWithTimeout(responseUrl, { headers }, 10000);
    const finalOut = await finalRes.json().catch(() => ({}));
    if (!finalRes.ok) return Response.json({ status: "ERROR", error: JSON.stringify(finalOut).slice(0, 500) });

    const video = finalOut?.video?.url || finalOut?.url || null;
    return Response.json({ status: "COMPLETED", video: video || finalOut });
  } catch (e) {
    return Response.json({ status: "ERROR", error: e.message });
  }
}
