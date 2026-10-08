import { dashboardAuthorized, unauthorized, supabaseAdmin } from "@/lib/dashboard";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// Photo-check report for the last N days (default 7): how many photos were
// made, how many passed first time, how many needed retries or were flagged,
// what the checker rejected most, and what it all cost. Used to tell whether
// the QA thresholds have become too strict again.
export async function GET(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const url = new URL(req.url);
  const brandId = url.searchParams.get("brandId");
  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 7, 1), 90);
  if (!brandId) return Response.json({ error: "brandId is required" }, { status: 400 });
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const supabase = supabaseAdmin();

  const [{ data: attempts, error }, { data: flagged }] = await Promise.all([
    supabase.from("image_attempts").select("kind, attempt, generated, qa_pass, qa_hard_fails, fal_cost_usd, claude_cost_usd").eq("brand_id", brandId).gte("created_at", since).limit(5000),
    supabase.from("brand_media").select("id").eq("brand_id", brandId).eq("needs_check", true).gte("uploaded_at", since),
  ]);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const gen = (attempts || []).filter((a) => a.kind === "generate");
  const firstTries = gen.filter((a) => a.attempt === 1 && a.generated);
  const checked = gen.filter((a) => a.qa_pass !== null && a.qa_pass !== undefined);
  const reasons = {};
  for (const a of gen) for (const r of a.qa_hard_fails || []) {
    const key = r.replace(/^\d+ feet.*/, "wrong number of feet");
    reasons[key] = (reasons[key] || 0) + 1;
  }
  const sum = (rows, k) => rows.reduce((s, r) => s + Number(r[k] || 0), 0);
  return Response.json({
    days,
    photos: firstTries.length,
    attempts: gen.length,
    generationFailures: gen.filter((a) => !a.generated).length,
    firstTryPassRate: firstTries.length ? firstTries.filter((a) => a.qa_pass === true).length / firstTries.length : null,
    checkRejectRate: checked.length ? checked.filter((a) => a.qa_pass === false).length / checked.length : null,
    flagged: (flagged || []).length,
    topRejections: Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 5),
    costUsd: { images: sum(attempts || [], "fal_cost_usd"), claude: sum(attempts || [], "claude_cost_usd") },
  });
}
