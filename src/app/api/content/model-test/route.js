import { dashboardAuthorized, unauthorized, supabaseAdmin, signPaths } from "@/lib/dashboard";
import { characterOf } from "@/lib/brandTemplate";
import { runModelTestScene, TEST_SCENES, TEST_MODELS, OLD_MODEL_LABELS } from "@/lib/modelTest";
import { logGenerationError, friendlyError } from "@/lib/genLog";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Image model comparison (see src/lib/modelTest.js).
// POST {brandId, runId, sceneIndex} runs one scene on every model.
// GET ?brandId= returns the latest run, photos signed, grouped by scene.
// PATCH {id} marks one photo as Tav's pick for its scene.
export async function POST(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const { brandId, runId, sceneIndex } = await req.json();
  if (!brandId || !runId || !Number.isInteger(sceneIndex)) return Response.json({ error: "brandId, runId and sceneIndex are required" }, { status: 400 });
  const { data: brand } = await supabaseAdmin().from("brands").select("*").eq("id", brandId).single();
  if (!brand) return Response.json({ error: "Brand not found" }, { status: 404 });
  if (!characterOf(brand)) return Response.json({ error: "The model test is for Sky High Soles photos" }, { status: 400 });
  try {
    const rows = await runModelTestScene(brand, { runId, sceneIndex });
    return Response.json({ rows: rows.length });
  } catch (e) {
    await logGenerationError(brand.id, "model-test", null, e.message);
    return Response.json({ error: friendlyError(e.message) }, { status: 502 });
  }
}

export async function GET(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const brandId = new URL(req.url).searchParams.get("brandId");
  if (!brandId) return Response.json({ error: "brandId is required" }, { status: 400 });
  const supabase = supabaseAdmin();
  const { data: latest } = await supabase.from("model_tests").select("run_id").eq("brand_id", brandId).order("created_at", { ascending: false }).limit(1);
  const meta = { scenes: TEST_SCENES, models: TEST_MODELS.map(({ key, label }) => ({ key, label })), oldLabels: OLD_MODEL_LABELS };
  if (!latest?.length) return Response.json({ run: null, ...meta });
  const { data: rows, error } = await supabase.from("model_tests").select("id, run_id, scene_index, scene, model, storage_path, width, height, cost_usd, qa_pass, qa_hard_fails, error, picked, created_at").eq("run_id", latest[0].run_id).order("scene_index");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const urls = await signPaths(rows.filter((r) => r.storage_path).map((r) => r.storage_path));
  let u = 0;
  const photos = rows.map((r) => ({ ...r, url: r.storage_path ? urls[u++] : null }));
  return Response.json({ run: { id: latest[0].run_id, photos }, ...meta });
}

export async function PATCH(req) {
  if (!dashboardAuthorized(req)) return unauthorized();
  const { id } = await req.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  const supabase = supabaseAdmin();
  const { data: row } = await supabase.from("model_tests").select("run_id, scene_index").eq("id", id).single();
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  await supabase.from("model_tests").update({ picked: false }).eq("run_id", row.run_id).eq("scene_index", row.scene_index);
  const { error } = await supabase.from("model_tests").update({ picked: true }).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
