import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function requireAdmin(email) {
  if (!email) return null;
  const { data: user } = await supabase
    .from("users")
    .select("email,is_admin")
    .eq("email", email)
    .single();
  return user?.is_admin ? user : null;
}

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export async function GET(req) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const brandId = url.searchParams.get("brandId");
  if (!(await requireAdmin(email))) return Response.json({ error: "Not authorized" }, { status: 403 });
  if (!brandId) return Response.json({ error: "brandId is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("brand_media")
    .select("*")
    .eq("brand_id", brandId)
    .order("uploaded_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const withUrls = await Promise.all(
    (data || []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from("brand-media")
        .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SECONDS);
      return { ...row, url: signed?.signedUrl || null };
    })
  );

  return Response.json({ media: withUrls });
}

export async function POST(req) {
  const formData = await req.formData();
  const email = formData.get("email");
  const brandId = formData.get("brandId");
  const file = formData.get("file");

  if (!(await requireAdmin(email))) return Response.json({ error: "Not authorized" }, { status: 403 });
  if (!brandId || !file) return Response.json({ error: "brandId and file are required" }, { status: 400 });

  const mimeType = file.type || "application/octet-stream";
  const fileType = mimeType.startsWith("video/") ? "video" : "image";
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = (file.name || `upload-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${brandId}/${Date.now()}-${safeName}`;

  // Original bytes, no recompression — preserves source quality for the library.
  const { error: uploadError } = await supabase.storage
    .from("brand-media")
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false });
  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 });

  const { data: row, error: insertError } = await supabase
    .from("brand_media")
    .insert({
      brand_id: brandId,
      storage_path: storagePath,
      file_type: fileType,
      original_filename: file.name || null,
      mime_type: mimeType,
      size_bytes: buffer.length,
    })
    .select()
    .single();
  if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

  const { data: signed } = await supabase.storage
    .from("brand-media")
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  return Response.json({ media: { ...row, url: signed?.signedUrl || null } });
}

export async function DELETE(req) {
  const body = await req.json();
  const { email, id, storagePath } = body;
  if (!(await requireAdmin(email))) return Response.json({ error: "Not authorized" }, { status: 403 });
  if (!id || !storagePath) return Response.json({ error: "id and storagePath are required" }, { status: 400 });

  await supabase.storage.from("brand-media").remove([storagePath]);
  const { error } = await supabase.from("brand_media").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
