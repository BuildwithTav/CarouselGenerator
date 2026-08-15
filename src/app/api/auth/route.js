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

// Wraps any announcement body in the standard Carousel Studio email chrome
// (logo header, white card, footer). Used by the admin broadcast below.
function emailBroadcastWrapper(subject, bodyHtml) {
  return {
    subject,
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:40px 24px;"><div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div><div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;">${bodyHtml}</div><p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p></div></body></html>`
  };
}

// The current broadcast — update this each time a new admin announcement
// needs to go out via the "Send Update Email to All Users" admin button.
// Only the subject/body change between sends; emailBroadcastWrapper above
// keeps the header/card/footer consistent automatically.
function currentBroadcastEmail(firstName) {
  const subject = "A quick update to Carousel Studio";
  const body = `<p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Just a heads up — we've made the app a bit more user friendly. A few things have moved around (navigation is cleaner, photo and brand settings are simpler), so if anything looks a little different next time you log in, that's why.</p><div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:24px;"><p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;"><strong style="color:#BB9900;">One thing to do:</strong> refresh the app (or fully close and reopen it) to make sure you're on the latest version.</p></div><div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:24px;"><p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;font-weight:700;">Reminder — add Carousel Studio to your home screen</p><p style="font-size:15px;color:#0a0a0a;margin:0 0 8px;line-height:1.6;">So it opens like a native app, full screen, no browser bar:</p><p style="font-size:15px;color:#0a0a0a;margin:0 0 6px;line-height:1.6;"><strong>iPhone:</strong> tap the Share button in Safari, then "Add to Home Screen"</p><p style="font-size:15px;color:#0a0a0a;margin:0;line-height:1.6;"><strong>Android:</strong> tap the menu in Chrome, then "Add to Home Screen"</p></div><div style="text-align:center;margin:32px 0;"><a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">Open Carousel Studio →</a></div><p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">Thanks for using Carousel Studio.<br><br>— Tav</p>`;
  return emailBroadcastWrapper(subject, body);
}

function emailCreditsExhausted(firstName) {
  return {
    subject: "You've used your free credits — here's what's next",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:40px 24px;"><div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div><div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;"><p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">You've used your 60 credits. Hopefully you've seen what Carousel Studio can do.</p><p style="font-size:15px;color:#0a0a0a;margin:0 0 20px;line-height:1.7;">Two options — keep going now, or upgrade to unlock a lot more:</p><div style="background:#f5f3ef;border-radius:10px;padding:20px 24px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;"><div><p style="font-size:15px;color:#0a0a0a;margin:0 0 4px;font-weight:700;">Buy more credits</p><p style="font-size:13px;color:#7a7875;margin:0;line-height:1.5;">Top up and keep going on the free plan — no commitment</p></div><a href="https://studio.buildwithtav.co" style="background:#0a0a0a;color:#BB9900;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:800;text-decoration:none;white-space:nowrap;">Buy Credits →</a></div><div style="background:#f5f3ef;border-radius:10px;padding:20px 24px;margin-bottom:12px;"><p style="font-size:15px;color:#0a0a0a;margin:0 0 4px;font-weight:700;">Starter — $20/month</p><p style="font-size:13px;color:#7a7875;margin:0;line-height:1.5;">200 credits · clean downloads · 20% commission + 15% Tier 2</p></div><div style="background:#f5f3ef;border-radius:10px;padding:20px 24px;margin-bottom:12px;"><p style="font-size:15px;color:#0a0a0a;margin:0 0 4px;font-weight:700;">Pro — $50/month</p><p style="font-size:13px;color:#7a7875;margin:0;line-height:1.5;">800 credits · refer 4 and Pro pays itself · 30% commission + 15% Tier 2</p></div><div style="background:#1a1800;border-radius:10px;padding:20px 24px;margin-bottom:24px;border:1px solid rgba(187,153,0,0.3);"><p style="font-size:15px;color:#ffffff;margin:0 0 4px;font-weight:700;">Affiliate Licence — $297 once</p><p style="font-size:13px;color:rgba(255,255,255,0.7);margin:0;line-height:1.5;">Pay once. No monthly fee ever. 35% commission for life.</p></div><div style="text-align:center;margin:28px 0;"><a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">See All Plans →</a></div><p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Tav</p></div></div></body></html>`
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
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:40px 24px;"><div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div><div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;"><p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hey ${firstName},</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">A referral just upgraded to <strong>${planName}</strong> via your Carousel Studio link.</p><div style="background:#0a0a0a;border-radius:12px;padding:28px;margin-bottom:24px;text-align:center;"><p style="font-size:48px;font-weight:900;color:#BB9900;margin:0 0 4px;font-family:Georgia,serif;">$${amount}</p><p style="font-size:14px;color:rgba(255,255,255,0.6);margin:0;">commission earned</p></div><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">As long as they stay subscribed, that commission <strong style="color:#BB9900;">repeats every month</strong>.</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">You also earn commission on <strong>everyone they refer</strong> too.</p><div style="background:#f5f3ef;border-radius:10px;padding:20px;margin-bottom:24px;"><p style="font-size:14px;color:#7a7875;margin:0;line-height:1.6;">This commission is pending for 30 days, then moves to available for withdrawal.</p></div><div style="text-align:center;margin:32px 0;"><a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">View Your Dashboard →</a></div><p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Tav</p></div><p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p></div></body></html>`
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

export const maxDuration = 60;

// Emails allowed to skip the OTP-code step entirely (send-otp mints and
// returns a real Supabase session immediately). Scoped to specific,
// trusted addresses only — every other email still goes through the
// normal emailed-code flow.
const DIRECT_LOGIN_EMAILS = ["runerbean85@icloud.com"];

// Shared post-authentication step for both the normal verify-otp flow and
// the direct-login bypass above: provisions the user row on first login,
// sends welcome/affiliate-welcome emails, and returns the session payload.
async function finishLogin(user, session, body) {
  const resolvedFirstName = body.firstName || user.email.split("@")[0];
  const marketingConsent = body.marketingConsent === true;
  const affiliateRef = body.affiliateRef;

  const { data: existing } = await supabase.from("users").select("*").eq("email", user.email).single();

  if (!existing) {
    let affiliateId = generateAffiliateId();
    let { data: idCheck } = await supabase.from("users").select("affiliate_id").eq("affiliate_id", affiliateId).single();
    while (idCheck) {
      affiliateId = generateAffiliateId();
      const check = await supabase.from("users").select("affiliate_id").eq("affiliate_id", affiliateId).single();
      idCheck = check.data;
    }

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

    const { subject, html } = emailFreeWelcome(resolvedFirstName);
    await sendEmail(user.email, subject, html);

    if (resolvedRef) {
      try {
        const { data: affiliateUser } = await supabase.from("users").select("email, first_name").eq("affiliate_id", resolvedRef).single();
        if (affiliateUser?.email) {
          const { subject: aSubject, html: aHtml } = emailNewReferral(affiliateUser.first_name || "there", user.email);
          await sendEmail(affiliateUser.email, aSubject, aHtml, true);
        }
      } catch {}
    }

    await addToSysteme(user.email, "carousel-studio-free");

  } else if (existing.plan !== "free" && existing.affiliate_id && existing.affiliate_active && !existing.affiliate_welcome_email_sent) {
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
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    user: profile
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, email, token } = body;

    if (action === "send-otp") {
      const normalizedEmail = (email||"").trim().toLowerCase();
      if (DIRECT_LOGIN_EMAILS.includes(normalizedEmail)) {
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({ type: "magiclink", email: normalizedEmail });
        if (linkError) return NextResponse.json({ error: linkError.message }, { status: 400 });
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({ token_hash: linkData.properties.hashed_token, type: "magiclink" });
        if (verifyError) return NextResponse.json({ error: verifyError.message }, { status: 400 });
        return finishLogin(verifyData.user, verifyData.session, body);
      }
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
      return finishLogin(data.user, data.session, body);
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
      const { data: profile } = await supabase.from("users").select("credits_used, credits_limit, email, plan, first_name, credits_exhausted_email_sent").eq("email", user.email).single();
      const creditAmount = body.credits || 1;
      const newCreditsUsed = (profile?.credits_used || 0) + creditAmount;
      await supabase.from("users").update({ credits_used: newCreditsUsed }).eq("email", user.email);
      if (profile?.plan === "free" && newCreditsUsed >= (profile?.credits_limit || 60) && !profile?.credits_exhausted_email_sent) {
        const firstName = profile?.first_name || user.email.split("@")[0];
        const exhaustedEmail = emailCreditsExhausted(firstName);
        await sendEmail(user.email, exhaustedEmail.subject, exhaustedEmail.html);
        await supabase.from("users").update({ credits_exhausted_email_sent: true }).eq("email", user.email);
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
      const { data: openPayoutRequest } = await supabase.from("payout_requests").select("id, amount, requested_at").eq("affiliate_id", profile.affiliate_id).eq("status", "pending").order("requested_at", { ascending: false }).limit(1);
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
        tier2_count: tier2Commissions?.length || 0,
        has_pending_payout: !!(openPayoutRequest?.length),
        pending_payout_amount: openPayoutRequest?.[0]?.amount || null
      });
    }

    if (action === "request-payout") {
      const authHeader = req.headers.get("authorization");
      if (!authHeader) return NextResponse.json({ error: "No token" }, { status: 401 });
      const t = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(t);
      if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      const { payoutMethod, payoutDetails, amount } = body;
      const { data: profile } = await supabase.from("users").select("affiliate_id, first_name").eq("email", user.email).single();
      if (!profile?.affiliate_id) return NextResponse.json({ error: "Not an affiliate" }, { status: 400 });
      if (Number(amount) < 30) return NextResponse.json({ error: "Minimum withdrawal is $30" }, { status: 400 });

      await supabase.from("payout_requests").insert({
        affiliate_id: profile.affiliate_id,
        email: user.email,
        amount,
        payout_method: payoutMethod,
        payout_details: payoutDetails,
        status: "pending",
        requested_at: new Date().toISOString()
      });

      const firstName = profile.first_name || user.email.split("@")[0];
      const labelMap = {accountName:"Account Name",accountNumber:"Account Number",sortCode:"Sort Code",bankName:"Bank Name",iban:"IBAN",bicSwift:"BIC / SWIFT",country:"Country"};
      const methodLabel = payoutMethod === "uk_bank" ? "UK Bank Transfer" : "International Bank Transfer";
      const paymentDetailsRows = typeof payoutDetails === "object"
        ? Object.entries(payoutDetails).map(([k,v]) => `<tr><td style="padding:6px 0;color:#7a7875;font-size:14px;width:140px;">${labelMap[k]||k}</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#0a0a0a;">${v}</td></tr>`).join("")
        : `<tr><td colspan="2" style="padding:6px 0;font-size:14px;">${payoutDetails}</td></tr>`;
      const paymentDetailsTextPlain = typeof payoutDetails === "object"
        ? Object.entries(payoutDetails).map(([k,v]) => `${labelMap[k]||k}: ${v}`).join("\n")
        : String(payoutDetails || "");

      // Calculate next 10th
      const now = new Date();
      const nextTenth = now.getDate() < 10
        ? new Date(now.getFullYear(), now.getMonth(), 10)
        : new Date(now.getFullYear(), now.getMonth() + 1, 10);
      const payDateStr = nextTenth.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

      // Confirmation email to affiliate
      await sendEmail(user.email, "Payout request received — here's what happens next",
        `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
        <style>@media only screen and (max-width:620px){.outer{padding:0 !important;}.inner{padding:24px !important;border-radius:0 !important;}}</style>
        </head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <div class="outer" style="max-width:600px;margin:0 auto;padding:40px 16px;">
          <div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div>
          <div class="inner" style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;">
            <p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p>
            <p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Your payout request has been received. Here's a summary:</p>
            <div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:24px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:6px 0;color:#7a7875;font-size:14px;width:140px;">Amount</td><td style="padding:6px 0;font-size:16px;font-weight:800;color:#BB9900;">$${Number(amount).toFixed(2)}</td></tr>
                <tr><td style="padding:6px 0;color:#7a7875;font-size:14px;">Method</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#0a0a0a;">${methodLabel}</td></tr>
                ${paymentDetailsRows}
              </table>
            </div>
            <p style="font-size:17px;color:#0a0a0a;margin:0 0 16px;line-height:1.7;">Payment will be processed on or after <strong style="color:#BB9900;">${payDateStr}</strong>, within 7 days of that date.</p>
            <p style="font-size:15px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">If any of the payment details above are incorrect, please contact us immediately at <a href="mailto:tav@buildwithtav.co" style="color:#BB9900;">tav@buildwithtav.co</a> before the payment date.</p>
            <p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Tav</p>
          </div>
          <p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p>
        </div></body></html>`
      );

      // Notification email to Tav
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Carousel Studio <tav@mail.buildwithtav.co>",
          to: "tav@buildwithtav.co",
          subject: `Payout request — $${Number(amount).toFixed(2)} from ${user.email}`,
          html: `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;background:#f5f3ef;">
            <h2 style="color:#0a0a0a;">New Payout Request</h2>
            <p><strong>From:</strong> ${user.email}</p>
            <p><strong>Affiliate ID:</strong> ${profile.affiliate_id}</p>
            <p><strong>Amount:</strong> $${Number(amount).toFixed(2)}</p>
            <p><strong>Method:</strong> ${methodLabel}</p>
            <p><strong>Payment Details:</strong></p>
            <pre style="background:#fff;padding:12px;border-radius:8px;font-size:14px;">${paymentDetailsTextPlain}</pre>
            <p><strong>Pay on or after:</strong> ${payDateStr}</p>
            <p><strong>Requested:</strong> ${new Date().toLocaleDateString("en-GB")}</p>
            <p style="margin-top:24px;"><a href="https://studio.buildwithtav.co/admin" style="background:#BB9900;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">View in Admin Panel →</a></p>
          </body></html>`
        })
      });

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

      // Also mark the affiliate's pending commissions as paid
      try {
        const { data: pr } = await supabase.from("payout_requests").select("affiliate_id, amount").eq("id", payout_id).single();
        if (pr?.affiliate_id) {
          await supabase.from("commissions")
            .update({ status: "paid", payout_request_id: payout_id })
            .eq("affiliate_id", pr.affiliate_id)
            .eq("status", "pending")
            .lte("payable_at", new Date().toISOString());
        }
      } catch(e) { console.error("Commission update error:", e); }

      // Fetch payout details to send confirmation email to affiliate
      try {
        const { data: payout } = await supabase.from("payout_requests").select("email, amount, payout_method").eq("id", payout_id).single();
        if (payout?.email) {
          const { data: user } = await supabase.from("users").select("first_name").eq("email", payout.email).single();
          const firstName = user?.first_name || payout.email.split("@")[0];
          const methodLabel = payout.payout_method === "uk_bank" ? "UK Bank Transfer" : "International Bank Transfer";
          await sendEmail(payout.email, "Your Carousel Studio payout has been sent",
            `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
            <style>@media only screen and (max-width:620px){.outer{padding:0 !important;}.inner{padding:24px !important;border-radius:0 !important;}}</style>
            </head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
            <div class="outer" style="max-width:600px;margin:0 auto;padding:40px 16px;">
              <div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div>
              <div class="inner" style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;">
                <p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p>
                <p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Your payout has been sent. Here are the details:</p>
                <div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:24px;">
                  <div style="margin-bottom:12px;"><span style="font-size:14px;color:#7a7875;">Amount</span><br><span style="font-size:24px;font-weight:900;color:#BB9900;">$${Number(payout.amount).toFixed(2)}</span></div>
                  <div><span style="font-size:14px;color:#7a7875;">Method</span><br><span style="font-size:15px;font-weight:700;color:#0a0a0a;">${methodLabel}</span></div>
                </div>
                <p style="font-size:16px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Please allow 1–3 business days for the funds to arrive in your account. If you have any questions contact <a href="mailto:tav@buildwithtav.co" style="color:#BB9900;">tav@buildwithtav.co</a></p>
                <p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Tav</p>
              </div>
              <p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p>
            </div></body></html>`
          );
        }
      } catch(e) { console.error("Mark paid email error:", e); }

      return NextResponse.json({ ok: true });
    }

    if (action === "admin_send_update_email") {
      if (body.confirm !== true) return NextResponse.json({ error: "Confirmation required" }, { status: 400 });
      const { data: users } = await supabase.from("users").select("email, first_name").neq("marketing_consent", false);
      const targets = users || [];
      let sent = 0;
      for (const u of targets) {
        try {
          const firstName = u.first_name || u.email.split("@")[0];
          const { subject, html } = currentBroadcastEmail(firstName);
          await sendEmail(u.email, subject, html);
          sent++;
        } catch(e) { console.error("Update email error for", u.email, e); }
      }
      return NextResponse.json({ ok: true, sent, total: targets.length });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
