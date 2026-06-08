import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(req) {
  try {
    const { email } = await req.json();

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Only reset if on paid plan and period has expired
    const now = new Date();
    const periodStart = user.period_start ? new Date(user.period_start) : null;
    const daysSinceReset = periodStart
      ? (now - periodStart) / (1000 * 60 * 60 * 24)
      : 999;

    if (user.plan !== "free" && daysSinceReset >= 30) {
      await supabase.from("users").update({
        credits_used: 0,
        period_start: now.toISOString()
      }).eq("email", email);
      return NextResponse.json({ reset: true });
    }

    return NextResponse.json({ reset: false });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
