import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function getPlanRate(plan) {
  switch(plan) {
    case "agency": return 0.40;
    case "pro": return 0.30;
    case "starter": return 0.20;
    case "affiliate_licence": return 0.35;
    case "white_label": return 0.40;
    default: return 0;
  }
}

export async function GET(req) {
  // Verify cron secret to prevent unauthorised calls
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const dayOfMonth = now.getDate();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Determine snapshot type
  let snapshotType = null;
  if (dayOfMonth === 1) snapshotType = "month_start";
  if (dayOfMonth === lastDay) snapshotType = "month_end";

  if (!snapshotType) {
    return NextResponse.json({ message: "Not a snapshot day" });
  }

  const { data: affiliates } = await supabase
    .from("users")
    .select("affiliate_id, plan")
    .eq("affiliate_active", true);

  if (!affiliates?.length) {
    return NextResponse.json({ message: "No active affiliates" });
  }

  const snapshots = affiliates.map(a => ({
    affiliate_id: a.affiliate_id,
    snapshot_date: today,
    snapshot_type: snapshotType,
    plan: a.plan,
    commission_rate: getPlanRate(a.plan)
  }));

  await supabase
    .from("monthly_rate_snapshots")
    .upsert(snapshots, { onConflict: "affiliate_id,snapshot_date,snapshot_type" });

  return NextResponse.json({
    message: `${snapshotType} snapshot taken`,
    affiliates: snapshots.length,
    date: today
  });
}
