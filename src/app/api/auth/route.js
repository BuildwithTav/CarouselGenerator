import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(req) {
  try {
    const { action, email, token } = await req.json();

    if (action === "send-otp") {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true }
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === "verify-otp") {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email"
      });
      if (error) return NextResponse.json({ error: "Invalid code — check your email and try again." }, { status: 400 });

      const user = data.user;

      const { data: existing } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .single();

      if (!existing) {
        await supabase.from("users").insert({
          email: user.email,
          plan: "free",
          credits_used: 0,
          credits_limit: 6,
          downloads_used: 0,
          bonus_credits: 0,
          period_start: new Date().toISOString()
        });
      }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .single();

      return NextResponse.json({
        success: true,
        email: user.email,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: profile
      });
    }

    if (action === "me") {
      const authHeader = req.headers.get("authorization");
      if (!authHeader) return NextResponse.json({ error: "No token" }, { status: 401 });
      const t = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(t);
      if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .single();

      return NextResponse.json({ user: profile });
    }

    if (action === "increment-downloads") {
      const authHeader = req.headers.get("authorization");
      if (!authHeader) return NextResponse.json({ error: "No token" }, { status: 401 });
      const t = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(t);
      if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

      const { data: profile } = await supabase
        .from("users")
        .select("credits_used")
        .eq("email", user.email)
        .single();

      await supabase.from("users").update({
        credits_used: (profile?.credits_used || 0) + 1
      }).eq("email", user.email);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
