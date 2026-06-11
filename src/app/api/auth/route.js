import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SYSTEME_API_KEY = process.env.SYSTEME_API_KEY;

async function getOrCreateTag(tagName) {
  try {
    const res = await fetch("https://api.systeme.io/api/tags?limit=100", {
      headers: { "X-API-Key": SYSTEME_API_KEY, "Accept": "application/json" }
    });
    const data = await res.json();
    const existing = data?.items?.find(t => t.name === tagName);
    if (existing) return existing.id;
    const create = await fetch("https://api.systeme.io/api/tags", {
      method: "POST",
      headers: { "X-API-Key": SYSTEME_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ name: tagName })
    });
    const created = await create.json();
    return created?.id;
  } catch(e) {
    console.error("Systeme tag error:", e);
    return null;
  }
}

async function addToSysteme(email, tagName) {
  try {
    const tagId = await getOrCreateTag(tagName);
    if (!tagId) return;
    const check = await fetch(`https://api.systeme.io/api/contacts?email=${encodeURIComponent(email)}`, {
      headers: { "X-API-Key": SYSTEME_API_KEY, "Accept": "application/json" }
    });
    const checkData = await check.json();
    const existing = checkData?.items?.[0];
    if (existing) {
      await fetch(`https://api.systeme.io/api/contacts/${existing.id}/tags`, {
        method: "POST",
        headers: { "X-API-Key": SYSTEME_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ tagId })
      });
    } else {
      await fetch("https://api.systeme.io/api/contacts", {
        method: "POST",
        headers: { "X-API-Key": SYSTEME_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, tags: [{ id: tagId }] })
      });
    }
  } catch(e) {
    console.error("Systeme sync error:", e);
  }
}

function generateAffiliateId(email) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export async function POST(req) {
  try {
    const { action, email, token, affiliateRef } = await req.json();

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
        // Generate unique affiliate ID for new user
        let affiliateId = generateAffiliateId(user.email);
        // Ensure uniqueness
        let { data: idCheck } = await supabase.from("users").select("affiliate_id").eq("affiliate_id", affiliateId).single();
        while (idCheck) {
          affiliateId = generateAffiliateId(user.email);
          const check = await supabase.from("users").select("affiliate_id").eq("affiliate_id", affiliateId).single();
          idCheck = check.data;
        }

        await supabase.from("users").insert({
          email: user.email,
          plan: "free",
          credits_used: 0,
          credits_limit: 6,
          downloads_used: 0,
          bonus_credits: 0,
          period_start: new Date().toISOString(),
          affiliate_id: affiliateId,
          affiliate_ref: affiliateRef || null,
          affiliate_tier: "none",
          affiliate_active: false
        });

        // If referred by an affiliate, log the referral
        if (affiliateRef) {
          await supabase.from("referrals").insert({
            referred_email: user.email,
            affiliate_id: affiliateRef
          });

          // Find the referring affiliate's parent for tier 2 tracking
          const { data: referrer } = await supabase
            .from("users")
            .select("affiliate_parent_id")
            .eq("affiliate_id", affiliateRef)
            .single();

          if (referrer?.affiliate_parent_id) {
            await supabase.from("users").update({
              affiliate_parent_id: referrer.affiliate_parent_id
            }).eq("email", user.email);
          }
        }

        addToSysteme(user.email, "carousel-studio-free");
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

    // Get affiliate stats for dashboard
    if (action === "affiliate-stats") {
      const authHeader = req.headers.get("authorization");
      if (!authHeader) return NextResponse.json({ error: "No token" }, { status: 401 });
      const t = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(t);
      if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

      const { data: profile } = await supabase
        .from("users")
        .select("affiliate_id, affiliate_active, affiliate_tier")
        .eq("email", user.email)
        .single();

      if (!profile?.affiliate_active) {
        return NextResponse.json({ active: false });
      }

      // Get all commissions
      const { data: commissions } = await supabase
        .from("commissions")
        .select("*")
        .eq("affiliate_id", profile.affiliate_id);

      const now = new Date();
      const total = commissions?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const pending = commissions?.filter(c => c.status === "pending" && new Date(c.payable_at) > now)
        .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const available = commissions?.filter(c => c.status === "pending" && new Date(c.payable_at) <= now)
        .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const paid = commissions?.filter(c => c.status === "paid")
        .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

      // Get referral count
      const { data: referrals } = await supabase
        .from("referrals")
        .select("id")
        .eq("affiliate_id", profile.affiliate_id);

      return NextResponse.json({
        active: true,
        affiliate_id: profile.affiliate_id,
        affiliate_tier: profile.affiliate_tier,
        total: total.toFixed(2),
        pending: pending.toFixed(2),
        available: available.toFixed(2),
        paid: paid.toFixed(2),
        referral_count: referrals?.length || 0
      });
    }

    // Submit payout request
    if (action === "request-payout") {
      const authHeader = req.headers.get("authorization");
      if (!authHeader) return NextResponse.json({ error: "No token" }, { status: 401 });
      const t = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(t);
      if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

      const { payoutMethod, payoutDetails, amount } = await req.json().catch(() => ({}));
      const body2 = await req.json().catch(() => ({}));

      const { data: profile } = await supabase
        .from("users")
        .select("affiliate_id")
        .eq("email", user.email)
        .single();

      if (!profile?.affiliate_id) return NextResponse.json({ error: "Not an affiliate" }, { status: 400 });
      if (Number(amount) < 30) return NextResponse.json({ error: "Minimum withdrawal is $30" }, { status: 400 });

      await supabase.from("payout_requests").insert({
        affiliate_id: profile.affiliate_id,
        amount,
        payout_method: payoutMethod,
        payout_details: payoutDetails,
        status: "pending"
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
