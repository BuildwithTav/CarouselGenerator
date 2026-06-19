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

async function sendEmail(to, subject, html, skipConsentCheck = false) {
  try {
    if (!skipConsentCheck) {
      const { data: profile } = await supabase.from("users").select("marketing_consent").eq("email", to).single();
      if (profile && profile.marketing_consent === false) return;
    }
    const htmlWithFooter = html.replace("</body>", unsubscribeFooter(to) + "</body>");
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html: htmlWithFooter })
    });
  } catch(e) { console.error("Resend error:", e); }
}

function emailFreeWelcome(firstName) {
  return {
    subject: "Welcome to Carousel Studio — here's where to start",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:40px 24px;"><div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div><div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;"><p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">You're in. Welcome to Carousel Studio.</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">You've got <strong>60 credits</strong> — enough to generate a few carousels and see exactly what this does for your content.</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 8px;font-weight:700;">Start here:</p><div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:24px;"><p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;"><strong style="color:#BB9900;">1.</strong> Go to the <strong>Brand tab</strong> — upload your photo, add your handle, set your voice profile.</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;"><strong style="color:#BB9900;">2.</strong> Go to the <strong>Generate tab</strong> — type your topic, choose your audience, hit generate. Done in 15–25 seconds.</p><p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;"><strong style="color:#BB9900;">3.</strong> Edit anything, download, post. That's it.</p></div><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">When you're ready to unlock more credits, remove studio branding and start earning commission — upgrade from inside the app.</p><div style="text-align:center;margin:32px 0;"><a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">Open Carousel Studio →</a></div><p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">If you need help, use the Help tab inside the app.<br><br>— Tav</p></div><p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p></div></body></html>`
  };
}

function emailPaidWelcome(firstName, planName, affiliateId, commissionRate) {
  const affiliateLink = `https://studio.buildwithtav.co/landing?sa=${affiliateId}`;
  return {
    subject: "Your affiliate link is ready — start earning",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:40px 24px;"><div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div><div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;"><p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Your account is set up. Here's everything you need to start earning.</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 8px;font-weight:700;">Your affiliate link:</p><div style="background:#0a0a0a;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;"><a href="${affiliateLink}" style="color:#BB9900;font-size:16px;font-weight:700;text-decoration:none;word-break:break-all;">${affiliateLink}</a></div><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Share this link anywhere. When someone signs up and upgrades — you earn <strong style="color:#BB9900;">${commissionRate}% recurring commission</strong> every month they stay subscribed.</p><div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:24px;"><p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;font-weight:700;">How commissions work:</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;">— You earn <strong style="color:#BB9900;">${commissionRate}%</strong> on every payment your referrals make</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;">— You earn <strong style="color:#BB9900;">15%</strong> on payments made by people your referrals refer</p><p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Commissions held 30 days then paid on the 10th via Wise</p></div><div style="text-align:center;margin:32px 0;"><a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">Go to Your Dashboard →</a></div><p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">If you need help, use the Help tab inside the app.<br><br>— Tav</p></div><p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p></div></body></html>`
  };
}

function emailCreditsExhausted(firstName) {
  return {
    subject: "You've used your free credits — here's what's next",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:40px 24px;"><div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div><div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;"><p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">You've used your 60 credits. Hopefully you've seen what Carousel Studio can do.</p><div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:16px;"><p style="font-size:17px;color:#0a0a0a;margin:0 0 4px;font-weight:700;">Starter — $20/month</p><p style="font-size:15px;color:#0a0a0a;margin:0 0 4px;line-height:1.6;">200 credits · clean downloads · 20% commission + 15% Tier 2</p></div><div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:16px;"><p style="font-size:17px;color:#0a0a0a;margin:0 0 4px;font-weight:700;">Pro — $50/month</p><p style="font-size:15px;color:#0a0a0a;margin:0 0 4px;line-height:1.6;">800 credits · refer 4 and Pro pays itself · 30% commission + 15% Tier 2</p></div><div style="background:#1a1800;border-radius:10px;padding:24px;margin-bottom:24px;border:1px solid rgba(187,153,0,0.3);"><p style="font-size:17px;color:#ffffff;margin:0 0 4px;font-weight:700;">Affiliate Licence — $297 once</p><p style="font-size:15px;color:rgba(255,255,255,0.8);margin:0 0 4px;line-height:1.6;">Pay once. No monthly fee ever. 35% commission for life.</p></div><div style="text-align:center;margin:32px 0;"><a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">See All Plans →</a></div><p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Tav</p></div></div></body></html>`
  };
}

function emailNewReferral(firstName, referralEmail) {
  return {
    subject: "Someone just joined via your link 👀",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:40px 24px;"><div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div><div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;"><p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hey ${firstName},</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Someone just signed up to Carousel Studio using your affiliate link.</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">They're on the free plan right now — but if they upgrade, you'll earn <strong style="color:#BB9900;">recurring monthly commission for as long as they stay subscribed.</strong></p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">And remember — you also earn commission on everyone they refer too.</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Keep sharing your link.</p><div style="text-align:center;margin:32px 0;"><a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">View Your Dashboard →</a></div><p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Tav</p></div><p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p></div></body></html>`
  };
}

function emailCommissionEarned(firstName, amount, planName, commissionRate) {
  return {
    subject: "💰 You just earned a commission",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:40px 24px;"><div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div><div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;"><p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hey ${firstName},</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">A referral just upgraded to <strong>${planName}</strong> via your Carousel Studio link.</p><div style="background:#0a0a0a;border-radius:12px;padding:28px;margin-bottom:24px;text-align:center;"><p style="font-size:48px;font-weight:900;color:#BB9900;margin:0 0 4px;font-family:Georgia,serif;">$${amount}</p><p style="font-size:14px;color:rgba(255,255,255,0.6);margin:0;">commission earned</p></div><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">As long as they stay subscribed, that commission <strong style="color:#BB9900;">repeats every month</strong>. You've just earned a lifetime monthly commission based on their continued subscription.</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">On top of that, you also earn commission on <strong>everyone they refer</strong> too — so every person you bring in could bring in more.</p><div style="background:#f5f3ef;border-radius:10px;padding:20px;margin-bottom:24px;"><p style="font-size:14px;color:#7a7875;margin:0;line-height:1.6;">This commission is pending for 30 days, then moves to available for withdrawal. Results may vary based on referral retention.</p></div><div style="text-align:center;margin:32px 0;"><a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">View Your Dashboard →</a></div><p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Tav</p></div><p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p></div></body></html>`
  };
}

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
  } catch(e) { console.error("Systeme tag error:", e); return null; }
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
      const create = await fetch("https://api.systeme.io/api/contacts", {
        method: "POST",
        headers: { "X-API-Key": SYSTEME_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const created = await create.json();
      if (created?.id) {
        await fetch(`https://api.systeme.io/api/contacts/${created.id}/tags`, {
          method: "POST",
          headers: { "X-API-Key": SYSTEME_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ tagId })
        });
      }
    }
  } catch(e) { console.error("Systeme sync error:", e); }
}

function generateAffiliateId() {
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
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (error) return NextResponse.json({ error: "Invalid code — check your email and try again." }, { status: 400 });

      const user = data.user;
      const resolvedFirstName = body.firstName || user.email.split("@")[0];
      const marketingConsent = body.marketingConsent === true;

      const { data: existing } = await supabase.from("users").select("*").eq("email", user.email).single();

      if (!existing) {
        // New user — generate unique affiliate ID
        let affiliateId = generateAffiliateId();
        let { data: idCheck } = await supabase.from("users").select("affiliate_id").eq("affiliate_id", affiliateId).single();
        while (idCheck) {
          affiliateId = generateAffiliateId();
          const check = await supabase.from("users").select("affiliate_id").eq("affiliate_id", affiliateId).single();
          idCheck = check.data;
        }

        // Check pending refs (for users who paid before signing up)
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
          credits_limit: 60,
          downloads_used: 0,
          bonus_credits: 0,
          period_start: new Date().toISOString(),
          affiliate_id: affiliateId,
          affiliate_ref: resolvedRef,
          affiliate_tier: "none",
          affiliate_active: false
        });

        // Send free welcome email
        const { subject, html } = emailFreeWelcome(resolvedFirstName);
        await sendEmail(user.email, subject, html);

        // Notify affiliate of new referral signup
        if (resolvedRef) {
          try {
            const { data: affiliateUser } = await supabase.from("users").select("email, first_name").eq("affiliate_id", resolvedRef).single();
            if (affiliateUser?.email) {
              const { subject: aSubject, html: aHtml } = emailNewReferral(affiliateUser.first_name || "there", user.email);
              await sendEmail(affiliateUser.email, aSubject, aHtml, true);
            }
          } catch {}
        }

        // Add to Systeme
        await addToSysteme(user.email, "carousel-studio-free");

      } else if (existing.plan !== "free" && existing.affiliate_id && existing.affiliate_active && !existing.affiliate_welcome_email_sent) {
        // Returning paid user who hasn't had welcome email yet
        const commissionRate = getCommissionRate(existing.plan);
        const planLabel = getPlanLabel(existing.plan);
        const nameToUse = existing.first_name || resolvedFirstName;
        const { subject, html } = emailPaidWelcome(nameToUse, planLabel, existing.affiliate_id, commissionRate);
        await sendEmail(user.email, subject, html);
        await supabase.from("users").update({ affiliate_welcome_email_sent: true }).eq("email", user.email);
      }

      const { data: profile } = await supabase.from("users").select("*").eq("email", user.email).single();

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
      const { data: profile } = await supabase.from("users").select("*").eq("email", user.email).single();
      return NextResponse.json({ user: profile });
    }

    if (action === "credits-exhausted-email") {
      const authHeader = req.headers.get("authorization");
      if (!authHeader) return NextResponse.json({ error: "No token" }, { status: 401 });
      const t = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(t);
      if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      const { data: profile } = await supabase.from("users").select("plan, credits_exhausted_email_sent, first_name").eq("email", user.email).single();
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
      const { data: profile } = await supabase.from("users").select("credits_used, credits_limit, email, plan").eq("email", user.email).single();
      const creditAmount = body.credits || 1;
      const newCreditsUsed = (profile?.credits_used || 0) + creditAmount;
      await supabase.from("users").update({ credits_used: newCreditsUsed }).eq("email", user.email);
      if (profile?.plan === "free" && newCreditsUsed >= (profile?.credits_limit || 60)) {
        const firstName = user.email.split("@")[0];
        const exhaustedEmail = emailCreditsExhausted(firstName);
        await sendEmail(user.email, exhaustedEmail.subject, exhaustedEmail.html);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "affiliate-stats") {
      const authHeader = req.headers.get("authorization");
      if (!authHeader) return NextResponse.json({ error: "No token" }, { status: 401 });
      const t = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(t);
      if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      const { data: profile } = await supabase.from("users").select("affiliate_id, affiliate_active, affiliate_tier").eq("email", user.email).single();
      if (!profile?.affiliate_active) return NextResponse.json({ active: false });
      const { data: commissions } = await supabase.from("commissions").select("*").eq("affiliate_id", profile.affiliate_id);
      const now = new Date();
      const total = commissions?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const pending = commissions?.filter(c => c.status === "pending" && new Date(c.payable_at) > now).reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const available = commissions?.filter(c => c.status === "pending" && new Date(c.payable_at) <= now).reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const paid = commissions?.filter(c => c.status === "paid").reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
      const { data: referrals } = await supabase.from("referrals").select("id").eq("affiliate_id", profile.affiliate_id);
      const { data: tier1Commissions } = await supabase.from("commissions").select("id").eq("affiliate_id", profile.affiliate_id).eq("tier", 1);
      const { data: tier2Commissions } = await supabase.from("commissions").select("id").eq("affiliate_id", profile.affiliate_id).eq("tier", 2);
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
      const { data: profile } = await supabase.from("users").select("affiliate_id").eq("email", user.email).single();
      if (!profile?.affiliate_id) return NextResponse.json({ error: "Not an affiliate" }, { status: 400 });
      if (Number(amount) < 30) return NextResponse.json({ error: "Minimum withdrawal is $30" }, { status: 400 });
      await supabase.from("payout_requests").insert({ affiliate_id: profile.affiliate_id, amount, payout_method: payoutMethod, payout_details: payoutDetails, status: "pending" });
      return NextResponse.json({ success: true });
    }

    if (action === "admin_get_users") {
      const { data: users } = await supabase.from("users").select("*").order("created_at", { ascending: false }).limit(300);
      return NextResponse.json({ users: users || [] });
    }

    if (action === "admin_get_commissions") {
      const { data: commissions } = await supabase.from("commissions").select("*").order("created_at", { ascending: false }).limit(300);
      return NextResponse.json({ commissions: commissions || [] });
    }

    if (action === "admin_get_payouts") {
      const { data: payouts } = await supabase.from("payout_requests").select("*").order("requested_at", { ascending: false }).limit(100);
      return NextResponse.json({ payouts: payouts || [] });
    }

    if (action === "admin_update_user") {
      const { email: targetEmail, plan: newPlan, add_credits } = body;
      const { data: user } = await supabase.from("users").select("*").eq("email", targetEmail).single();
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      const updates = {};
      if (newPlan && newPlan !== user.plan) {
        const planCredits = { free: 60, starter: 200, pro: 800, agency: 3000, affiliate_licence: 150, white_label: 800 };
        const planTiers = { starter: 20, pro: 30, agency: 40, affiliate_licence: 35, white_label: 40 };
        updates.plan = newPlan;
        updates.credits_limit = planCredits[newPlan] || 60;
        updates.affiliate_active = newPlan !== "free";
        updates.affiliate_tier = planTiers[newPlan] || 0;
      }
      if (add_credits && parseInt(add_credits) > 0) {
        updates.bonus_credits = (user.bonus_credits || 0) + parseInt(add_credits);
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("users").update(updates).eq("email", targetEmail);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "admin_mark_payout_paid") {
      const { payout_id } = body;
      await supabase.from("payout_requests").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", payout_id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
