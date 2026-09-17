import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function authorized(req) {
  const key = req.headers.get("x-dashboard-key");
  return !!process.env.DASHBOARD_PASSPHRASE && key === process.env.DASHBOARD_PASSPHRASE;
}

export async function GET(req) {
  if (!authorized(req)) return Response.json({ error: "Not authorized" }, { status: 403 });

  const { data, error } = await supabase.from("brands").select("*").order("created_at", { ascending: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ brands: data });
}

export async function POST(req) {
  if (!authorized(req)) return Response.json({ error: "Not authorized" }, { status: 403 });
  const fields = await req.json();
  if (!fields.name || !fields.slug) return Response.json({ error: "name and slug are required" }, { status: 400 });

  const { data, error } = await supabase
    .from("brands")
    .insert({
      slug: fields.slug,
      name: fields.name,
      voice: fields.voice || null,
      pillars: fields.pillars || null,
      visual_theme: fields.visual_theme || {},
      cta_rules: fields.cta_rules || null,
      daily_target: fields.daily_target ?? 1,
      automation_mode: fields.automation_mode || "needs_review",
    })
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ brand: data });
}

export async function PATCH(req) {
  if (!authorized(req)) return Response.json({ error: "Not authorized" }, { status: 403 });
  const { id, ...fields } = await req.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const update = { ...fields, updated_at: new Date().toISOString() };
  delete update.id;

  const { data, error } = await supabase.from("brands").update(update).eq("id", id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ brand: data });
}

export async function DELETE(req) {
  if (!authorized(req)) return Response.json({ error: "Not authorized" }, { status: 403 });
  const { id } = await req.json();
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const { data: media } = await supabase.from("brand_media").select("storage_path").eq("brand_id", id);
  if (media?.length) {
    await supabase.storage.from("brand-media").remove(media.map((m) => m.storage_path));
  }

  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
