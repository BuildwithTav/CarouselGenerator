export const dynamic = "force-dynamic";

export async function POST(req) {
  const { passphrase } = await req.json();
  const expected = process.env.DASHBOARD_PASSPHRASE;
  if (!expected) return Response.json({ error: "Dashboard passphrase not configured" }, { status: 500 });
  if (passphrase !== expected) return Response.json({ error: "Wrong passphrase" }, { status: 401 });
  return Response.json({ ok: true });
}
