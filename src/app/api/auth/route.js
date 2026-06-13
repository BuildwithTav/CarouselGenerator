import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SYSTEME_API_KEY = process.env.SYSTEME_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "Carousel Studio <tav@mail.buildwithtav.co>";
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || "cs_unsub_secret";

function generateUnsubToken(email) {
  const crypto = require("crypto");
  return crypto.createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(email.toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

function unsubscribeFooter(email) {
  const token = generateUnsubToken(email);
  const url = `https://studio.buildwithtav.co/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
  return `<p style="font-size:12px;color:#7a7875;text-align:center;margin-top:16px;">You're receiving this because you signed up for Carousel Studio. <a href="${url}" style="color:#7a7875;text-decoration:underline;">Unsubscribe</a></p>`;
}

// ─── RESEND ───────────────────────────────────────────────────────────────────

async function sendEmail(to, subject, html, skipConsentCheck = false) {
  try {
    // Check marketing consent unless it's a transactional email
    if (!skipConsentCheck) {
      const { data: profile } = await supabase.from("users").select("marketing_consent").eq("email", to).single();
      if (profile && profile.marketing_consent === false) return;
    }
    // Add unsubscribe footer
    const htmlWithFooter = html.replace("</body>", unsubscribeFooter(to) + "</body>");
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html: htmlWithFooter })
    });
  } catch(e) {
    console.error("Resend error:", e);
  }
}

function emailFreeWelcome(firstName) {
  return {
    subject: "Welcome to Carousel Studio — here's where to start",
    html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
<div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div>
<div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;">
<p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">You're in. Welcome to Carousel Studio.</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">You've got <strong>6 free credits</strong> — enough to generate a few carousels and see exactly what this does for your content.</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 8px;font-weight:700;">Start here:</p>
<div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:24px;">
<p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;"><strong style="color:#BB9900;">1.</strong> Go to the <strong>Brand tab</strong> — upload your photo, add your handle, set your voice profile. Takes 2 minutes and every carousel you generate will look and sound like you.</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;"><strong style="color:#BB9900;">2.</strong> Go to the <strong>Generate tab</strong> — type your topic, choose your audience, hit generate. Done in 15–25 seconds.</p>
<p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;"><strong style="color:#BB9900;">3.</strong> Edit anything, download, post. That's it.</p>
</div>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">When you're ready to unlock more credits, remove the studio branding from downloads and start earning commission on every person you refer — upgrade from inside the app.</p>
<div style="text-align:center;margin:32px 0;"><a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">Open Carousel Studio →</a></div>
<p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">If you need help, use the Help tab inside the app.<br><br>— Tav</p>
</div>
<p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p>
</div></body></html>`
  };
}

function emailPaidWelcome(firstName, planName, affiliateId, commissionRate) {
  const affiliateLink = `https://studio.buildwithtav.co?sa=${affiliateId}`;
  return {
    subject: "Your affiliate link is ready — start earning",
    html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
<div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div>
<div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;">
<p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Your account is set up. Here's everything you need to start earning.</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 8px;font-weight:700;">Your affiliate link:</p>
<div style="background:#0a0a0a;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
<a href="${affiliateLink}" style="color:#BB9900;font-size:16px;font-weight:700;text-decoration:none;word-break:break-all;">${affiliateLink}</a>
</div>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Share this link anywhere. When someone signs up and upgrades — you earn <strong style="color:#BB9900;">${commissionRate}% recurring commission</strong> every month they stay subscribed.</p>
<div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:24px;">
<p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;font-weight:700;">How commissions work:</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;">— You earn <strong style="color:#BB9900;">${commissionRate}%</strong> on every payment your referrals make</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;">— You earn <strong style="color:#BB9900;">15%</strong> on payments made by people your referrals refer</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;">— Your rate applies to your entire network — upgrade your plan and everyone moves up with you</p>
<p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Commissions are held for 30 days then paid out on the 10th of each month via Wise</p>
</div>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Your full earnings dashboard is in the <strong>Account tab</strong> inside the app — track referrals, pending commissions and request payouts from there.</p>
<div style="text-align:center;margin:32px 0;"><a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">Go to Your Dashboard →</a></div>
<p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">If you need help, use the Help tab inside the app.<br><br>— Tav</p>
</div>
<p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p>
</div></body></html>`
  };
}

// ─── CREDITS EXHAUSTED EMAIL ──────────────────────────────────────────────────

function emailCreditsExhausted(firstName) {
  return {
    subject: "You've used your free credits — here's what's next",
    html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
<div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div>
<div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;">
<p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">You've used your 6 free credits. Hopefully you've seen what Carousel Studio can do.</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">If you want to keep going — and start earning from the tool at the same time — here's what upgrading gets you:</p>
<div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:16px;">
<p style="font-size:17px;color:#0a0a0a;margin:0 0 4px;font-weight:700;">Starter — $20/month</p>
<p style="font-size:15px;color:#0a0a0a;margin:0 0 4px;line-height:1.6;">20 credits. Clean downloads. Enough for any solo creator.</p>
<p style="font-size:15px;color:#BB9900;margin:0;font-weight:700;">20% Tier 1 commission + 15% Tier 2 on your network</p>
</div>
<div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:16px;">
<p style="font-size:17px;color:#0a0a0a;margin:0 0 4px;font-weight:700;">Pro — $50/month</p>
<p style="font-size:15px;color:#0a0a0a;margin:0 0 4px;line-height:1.6;">80 credits — around 40 carousels. Refer 3 people and Pro pays for itself.</p>
<p style="font-size:15px;color:#BB9900;margin:0;font-weight:700;">30% Tier 1 commission + 15% Tier 2 on your network</p>
</div>
<div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:16px;">
<p style="font-size:17px;color:#0a0a0a;margin:0 0 4px;font-weight:700;">Agency — $100/month</p>
<p style="font-size:15px;color:#0a0a0a;margin:0 0 4px;line-height:1.6;">300 credits. High enough volume to run content for multiple clients under one account.</p>
<p style="font-size:15px;color:#BB9900;margin:0;font-weight:700;">40% Tier 1 commission + 15% Tier 2 on your network</p>
</div>
<div style="background:#1a1800;border-radius:10px;padding:24px;margin-bottom:16px;border:1px solid rgba(187,153,0,0.3);">
<p style="font-size:17px;color:#ffffff;margin:0 0 4px;font-weight:700;">Affiliate Licence — $297 once</p>
<p style="font-size:15px;color:rgba(255,255,255,0.8);margin:0 0 4px;line-height:1.6;">Pay once. Use forever. 15 credits/month for demos and promos. No monthly fee ever.</p>
<p style="font-size:15px;color:#BB9900;margin:0;font-weight:700;">35% Tier 1 commission + 15% Tier 2 on your network — for life</p>
</div>
<div style="background:#12001a;border-radius:10px;padding:24px;margin-bottom:24px;border:1px solid rgba(153,119,255,0.3);">
<p style="font-size:17px;color:#ffffff;margin:0 0 4px;font-weight:700;">White Label — $497 once</p>
<p style="font-size:15px;color:rgba(255,255,255,0.8);margin:0 0 4px;line-height:1.6;">Your brand, your domain. Resell as your own product. 80 credits/month. No monthly fee ever.</p>
<p style="font-size:15px;color:#9977ff;margin:0;font-weight:700;">40% Tier 1 commission + 15% Tier 2 on your network — for life</p>
</div>
<div style="text-align:center;margin:32px 0;"><a href="https://www.buildwithtav.co/carouselstudio" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">See All Plans →</a></div>
<p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">If you need help, use the Help tab inside the app.<br><br>— Tav</p>
</div>
<p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p>
</div></body></html>`
  };
}

// ─── SYSTEME ──────────────────────────────────────────────────────────────────

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

function getCommissionRate(plan) {
  switch(plan) {
    case "agency": return 40;
    case "pro": return 30;
    case "starter": return 20;
    case "affiliate_licence": return 35;
    case "white_label": return 40;
    default: return 0;
  }
}

function getPlanLabel(plan) {
  switch(plan) {
    case "agency": return "Agency";
    case "pro": return "Pro";
    case "starter": return "Starter";
    case "affiliate_licence": return "Affiliate Licence";
    case "white_label": return "White Label";
    default: return "Free";
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, email, token, affiliateRef } = body;

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
      const resolvedFirstName = body.firstName || user.email.split("@")[0];
      const marketingConsent = body.marketingConsent === true;

      const { data: existing } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .single();

      if (!existing) {
        // New user — generate affiliate ID
        let affiliateId = generateAffiliateId(user.email);
        let { data: idCheck } = await supabase.from("users").select("affiliate_id").eq("affiliate_id", affiliateId).single();
        while (idCheck) {
          affiliateId = generateAffiliateId(user.email);
          const check = await supabase.from("users").select("affiliate_id").eq("affiliate_id", affiliateId).single();
          idCheck = check.data;
        }

        // Check if they paid before signing up
        const { data: pendingRef } = await supabase
          .from("pending_affiliate_refs")
          .select("affiliate_ref")
          .eq("email", user.email)
          .single();

        const resolvedRef = affiliateRef || pendingRef?.affiliate_ref || null;

        await supabase.from("users").insert({
          email: user.email,
          first_name: resolvedFirstName,
          marketing_consent: marketingConsent,
          plan: "free",
          credits_used: 0,
          credits_limit: 6,
          downloads_used: 0,
          bonus_credits: 0,
          period_start: new Date().toISOString(),
          affiliate_id: affiliateId,
          affiliate_ref: resolvedRef,
          affiliate_tier: "none",
          affiliate_active: false
        });

        if (resolvedRef) {
          await supabase.from("referrals").insert({
            referred_email: user.email,
            affiliate_id: resolvedRef
          });

          const { data: referrer } = await supabase
            .from("users")
            .select("affiliate_parent_id")
            .eq("affiliate_id", resolvedRef)
            .single();

          if (referrer?.affiliate_parent_id) {
            await supabase.from("users").update({
              affiliate_parent_id: referrer.affiliate_parent_id
            }).eq("email", user.email);
          }
        }

        // Send welcome email — free user
        const { subject, html } = emailFreeWelcome(resolvedFirstName);
        await sendEmail(user.email, subject, html);

        addToSysteme(user.email, "carousel-studio-free");

      } else if (existing.plan !== "free" && existing.affiliate_id && existing.affiliate_active && !existing.affiliate_welcome_email_sent) {
        const commissionRate = getCommissionRate(existing.plan);
        const planLabel = getPlanLabel(existing.plan);
        const nameToUse = existing.first_name || resolvedFirstName;
        const { subject, html } = emailPaidWelcome(nameToUse, planLabel, existing.affiliate_id, commissionRate);
        await sendEmail(user.email, subject, html);
        await supabase.from("users").update({ affiliate_welcome_email_sent: true }).eq("email", user.email);
        await sendEmail(user.email, subject, html);
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

    if (action === "credits-exhausted-email") {
      const authHeader = req.headers.get("authorization");
      if (!authHeader) return NextResponse.json({ error: "No token" }, { status: 401 });
      const t = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(t);
      if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

      const { data: profile } = await supabase
        .from("users")
        .select("plan, credits_exhausted_email_sent, first_name")
        .eq("email", user.email)
        .single();

      // Only send once per credit period
      if (profile?.plan === "free" && !profile?.credits_exhausted_email_sent) {
        const firstName = profile?.first_name || user.email.split("@")[0];
        const exhaustedEmail = emailCreditsExhausted(firstName);
        await sendEmail(user.email, exhaustedEmail.subject, exhaustedEmail.html);
        await supabase.from("users").update({ credits_exhausted_email_sent: true }).eq("email", user.email);
      }

      return NextResponse.json({ success: true });
    }

    if (action === "increment-downloads") {
      const authHeader = req.headers.get("authorization");
      if (!authHeader) return NextResponse.json({ error: "No token" }, { status: 401 });
      const t = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(t);
      if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

      const { data: profile } = await supabase
        .from("users")
        .select("credits_used, credits_limit, email, plan, affiliate_id")
        .eq("email", user.email)
        .single();

      const newCreditsUsed = (profile?.credits_used || 0) + 1;

      await supabase.from("users").update({
        credits_used: newCreditsUsed
      }).eq("email", user.email);

      // Trigger credits exhausted email if free user just used last credit
      console.log("Credits check:", { plan: profile?.plan, newCreditsUsed, limit: profile?.credits_limit });
      if (profile?.plan === "free" && newCreditsUsed >= (profile?.credits_limit || 6)) {
        console.log("Sending credits exhausted email to:", user.email);
        const firstName = user.email.split("@")[0];
        const exhaustedEmail = emailCreditsExhausted(firstName);
        await sendEmail(user.email, exhaustedEmail.subject, exhaustedEmail.html);
        console.log("Credits exhausted email sent");
      }

      return NextResponse.json({ success: true });
    }

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

      const { data: referrals } = await supabase
        .from("referrals")
        .select("id")
        .eq("affiliate_id", profile.affiliate_id);

      const { data: tier1Commissions } = await supabase
        .from("commissions")
        .select("id")
        .eq("affiliate_id", profile.affiliate_id)
        .eq("tier", 1);

      const { data: tier2Commissions } = await supabase
        .from("commissions")
        .select("id")
        .eq("affiliate_id", profile.affiliate_id)
        .eq("tier", 2);

      return NextResponse.json({
        active: true,
        affiliate_id: profile.affiliate_id,
        affiliate_tier: profile.affiliate_tier,
        total: total.toFixed(2),
        pending: pending.toFixed(2),
        available: available.toFixed(2),
        paid: paid.toFixed(2),
        referral_count: referrals?.length || 0,
        tier1_count: tier1Commissions?.length || 0,
        tier2_count: tier2Commissions?.length || 0
      });
    }

    if (action === "request-payout") {
      const authHeader = req.headers.get("authorization");
      if (!authHeader) return NextResponse.json({ error: "No token" }, { status: 401 });
      const t = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(t);
      if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

      const { payoutMethod, payoutDetails, amount } = body;

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
