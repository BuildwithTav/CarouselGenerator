import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "Carousel Studio <tav@mail.buildwithtav.co>";
const CRON_SECRET = process.env.CRON_SECRET;

async function sendEmail(to, subject, html) {
  try {
    const { data: profile } = await supabase.from("users").select("marketing_consent").eq("email", to).single();
    if (profile && profile.marketing_consent === false) return;
    const token = require("crypto").createHmac("sha256", process.env.UNSUBSCRIBE_SECRET || "cs_unsub_secret").update(to.toLowerCase()).digest("hex").slice(0, 32);
    const unsubUrl = `https://studio.buildwithtav.co/api/unsubscribe?email=${encodeURIComponent(to)}&token=${token}`;
    const footer = `<p style="font-size:12px;color:#7a7875;text-align:center;margin-top:16px;">You're receiving this because you signed up for Carousel Studio. <a href="${unsubUrl}" style="color:#7a7875;text-decoration:underline;">Unsubscribe</a></p>`;
    const htmlWithFooter = html.replace("</body>", footer + "</body>");
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html: htmlWithFooter })
    });
  } catch(e) { console.error("Resend error:", e); }
}

function emailCreditsReset(firstName) {
  return {
    subject: "Your Carousel Studio credits have reset — 60 credits ready to use",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
<div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div>
<div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;">
<p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Your free credits have reset. You have <strong style="color:#BB9900;">60 fresh credits</strong> ready to use right now.</p>

<div style="background:#0a0a0a;border-radius:12px;padding:28px;margin-bottom:24px;text-align:center;">
  <p style="font-size:48px;font-weight:900;color:#BB9900;margin:0 0 4px;font-family:Georgia,serif;">60</p>
  <p style="font-size:14px;color:rgba(255,255,255,0.6);margin:0;">credits ready to use</p>
</div>

<p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 16px;">What's new in Carousel Studio this month:</p>
<div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:24px;">
  <p style="font-size:16px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;"><strong style="color:#BB9900;">Templates tab</strong> — Listicle, Storytelling, Clean Pro, Dark Fade, Raw and Split. Build carousels in a completely different style with one click.</p>
  <p style="font-size:16px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;"><strong style="color:#BB9900;">AI Caption Generator</strong> — generate a ready-to-post Instagram caption based on your carousel content. Works on both the Generate and Templates tab.</p>
  <p style="font-size:16px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;"><strong style="color:#BB9900;">CTA Cards</strong> — add a Comment, Follow, Save, Share or Like slide at the end of any template carousel, with fully editable text.</p>
  <p style="font-size:16px;color:#0a0a0a;margin:0;line-height:1.7;"><strong style="color:#BB9900;">Background images</strong> — upload your own photos directly into template slides with zoom and reposition controls.</p>
</div>

<div style="background:#0a0a0a;border-radius:12px;padding:28px;margin-bottom:24px;text-align:center;">
  <p style="font-size:17px;color:rgba(255,255,255,0.9);margin:0 0 16px;line-height:1.7;">You're on the free plan — <strong style="color:#BB9900;">60 credits/month</strong> with watermarked downloads.</p>
  <p style="font-size:15px;color:rgba(255,255,255,0.7);margin:0 0 20px;line-height:1.7;">Starter gives you <strong style="color:#BB9900;">200 credits/month</strong>, no watermark, your own affiliate link and recurring commission just for sharing it. Refer 5 people and it pays for itself.</p>
  <a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:800;text-decoration:none;display:inline-block;">Upgrade to Starter →</a>
</div>

<div style="text-align:center;margin:24px 0;">
  <a href="https://studio.buildwithtav.co" style="background:#0a0a0a;color:#BB9900;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:800;text-decoration:none;display:inline-block;border:2px solid #BB9900;">Start Creating →</a>
</div>

<p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Tav</p>
</div>
<p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p>
</div>
</body></html>`
  };
}

function emailDay2(firstName) {
  return {
    subject: "Instagram just confirmed what the data already showed",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
<div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div>
<div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;">
<p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Adam Mosseri — the head of Instagram — confirmed it publicly in 2025 and the numbers in 2026 have only made it clearer.</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;"><strong>Carousels are the highest-reach format on Instagram right now.</strong> Not Reels. Not single images. Carousels.</p>
<div style="background:#0a0a0a;border-radius:12px;padding:28px;margin-bottom:24px;">
<p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 16px;line-height:1.7;"><span style="color:#BB9900;font-weight:700;">3x</span> more reach than a single image post on average</p>
<p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 16px;line-height:1.7;"><span style="color:#BB9900;font-weight:700;">Higher saves</span> — Instagram's strongest signal that content is worth showing to more people</p>
<p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 16px;line-height:1.7;"><span style="color:#BB9900;font-weight:700;">More time on post</span> — swipes keep people on your content longer, which the algorithm rewards</p>
<p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0;line-height:1.7;"><span style="color:#BB9900;font-weight:700;">Reusable</span> — one carousel can be posted, saved, re-shared and discovered for months</p>
</div>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">The creators growing fastest on Instagram right now are not the ones posting the most. They're the ones posting carousels consistently.</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">You've got credits in your account. The fastest way to see what this does for your reach is to use them.</p>
<div style="text-align:center;margin:32px 0;"><a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">Generate Your First Carousel →</a></div>
<p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Tav</p>
</div>
<p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p>
</div>
</body></html>`
  };
}

function emailDay4(firstName) {
  return {
    subject: "Every paid plan comes with an affiliate licence built in",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
<div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div>
<div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;">
<p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Something most people don't realise when they sign up — every paid plan on Carousel Studio includes a full affiliate licence.</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">The moment you upgrade, you get a personal referral link. Share it. When someone signs up and pays — you earn recurring monthly commission for as long as they stay subscribed.</p>
<div style="background:#0a0a0a;border-radius:12px;padding:28px;margin-bottom:24px;">
<p style="font-size:15px;color:#BB9900;margin:0 0 16px;line-height:1.7;font-weight:700;">How it works:</p>
<p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 12px;line-height:1.7;"><span style="color:#BB9900;font-weight:700;">Starter ($20/month)</span> — earn 20%. Refer 5 people and your subscription pays for itself.</p>
<p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 12px;line-height:1.7;"><span style="color:#BB9900;font-weight:700;">Pro ($50/month)</span> — earn 30%. Refer 4 people and Pro pays for itself.</p>
<p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 12px;line-height:1.7;"><span style="color:#BB9900;font-weight:700;">Agency ($100/month)</span> — earn 40%.</p>
<p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0;line-height:1.7;"><span style="color:#BB9900;font-weight:700;">Tier 2 — 15%</span> on everyone your referrals refer. Every single month. Forever.</p>
</div>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">This isn't a bonus feature. It's included in every plan. The tool pays for content creation. The affiliate side turns that into income.</p>
<div style="text-align:center;margin:32px 0;"><a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">Upgrade and Get Your Link →</a></div>
<p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Tav</p>
</div>
<p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p>
</div>
</body></html>`
  };
}

function emailDay5(firstName) {
  return {
    subject: "Meet Frank — $440 a month. Then he made one phone call.",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
<div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div>
<div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;">
<p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Let me show you exactly how this works. Real numbers. No fluff.</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Meet Frank.</p>
<div style="background:#0a0a0a;border:2px solid #BB9900;border-radius:12px;padding:28px;margin-bottom:24px;">
<p style="font-size:13px;color:#BB9900;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Frank's situation</p>
<p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 8px;line-height:1.7;">Frank bought the Affiliate Licence — <strong style="color:#BB9900;">$297 once. No monthly fee. Ever.</strong></p>
<p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0;line-height:1.7;">He shared his link on social media. Built a small network of 10 people. That's it. That's all he did.</p>
</div>
<p style="font-size:15px;font-weight:700;color:#0a0a0a;margin:0 0 12px;">Here's what Frank earns every month:</p>
<div style="background:#f5f3ef;border-radius:10px;padding:20px 24px;margin-bottom:12px;">
<p style="font-size:13px;color:#7a7875;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Tier 1 — his 10 direct referrals</p>
<p style="font-size:15px;color:#0a0a0a;margin:0 0 6px;line-height:1.7;">10 people × $40/mo × 35% = <strong style="color:#BB9900;">$140/month</strong></p>
<p style="font-size:13px;color:#7a7875;margin:0;line-height:1.6;">Every payment they make, every month, as long as they stay subscribed.</p>
</div>
<div style="background:#f5f3ef;border-radius:10px;padding:20px 24px;margin-bottom:20px;">
<p style="font-size:13px;color:#7a7875;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Tier 2 — people Frank has never met</p>
<p style="font-size:15px;color:#0a0a0a;margin:0 0 6px;line-height:1.7;">Each of his 10 refers 5 more. That's 50 people. 50 × $40/mo × 15% = <strong style="color:#BB9900;">$300/month</strong></p>
<p style="font-size:13px;color:#7a7875;margin:0;line-height:1.6;">Frank has never spoken to them. They just pay every month and Frank gets 15% automatically.</p>
</div>
<div style="background:#0a0a0a;border-radius:12px;padding:24px;margin-bottom:28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
<div>
<p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0 0 4px;">Frank's baseline — every month</p>
<p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0;">$140 Tier 1 + $300 Tier 2</p>
</div>
<div style="text-align:right;">
<p style="font-family:Georgia,serif;font-size:42px;font-weight:900;color:#BB9900;margin:0;line-height:1;">$440</p>
<p style="font-size:12px;color:rgba(255,255,255,0.4);margin:4px 0 0;">every month — forever</p>
</div>
</div>
<p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 12px;">Then Frank made one phone call.</p>
<p style="font-size:15px;color:#0a0a0a;margin:0 0 20px;line-height:1.7;">He knew a content creator with 100k Instagram followers. Mentioned Carousel Studio. They tried it, loved it, posted about it once to their audience.</p>
<p style="font-size:15px;color:#0a0a0a;margin:0 0 20px;line-height:1.7;">Just 1% of their audience signed up. That's 1,000 people.</p>
<div style="background:#0a0a0a;border-radius:12px;padding:24px;margin-bottom:20px;">
<p style="font-size:13px;color:#BB9900;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">What that one referral added to Frank's monthly income</p>
<p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 10px;line-height:1.7;">1,000 people × $40/mo × 15% Tier 2 = <strong style="color:#BB9900;">$6,000/month extra</strong></p>
<p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0;line-height:1.6;">From one conversation. From 1% of one person's audience. People Frank has never spoken to, paying every single month.</p>
</div>
<div style="background:#0a0a0a;border:2px solid #BB9900;border-radius:12px;padding:24px;margin-bottom:28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
<div>
<p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0 0 4px;">Frank's new total — every month</p>
<p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0;">$440 baseline + $6,000 influencer Tier 2</p>
</div>
<div style="text-align:right;">
<p style="font-family:Georgia,serif;font-size:42px;font-weight:900;color:#BB9900;margin:0;line-height:1;">$6,440</p>
<p style="font-size:12px;color:rgba(255,255,255,0.4);margin:4px 0 0;">every month — from one phone call</p>
</div>
</div>
<p style="font-size:15px;color:#0a0a0a;margin:0 0 20px;line-height:1.7;">And it's not just influencers. What if one of Frank's referrals runs a marketing agency? They buy the White Label Licence, brand Carousel Studio as their own tool, sign up 500 clients. Frank referred one person. Here's what that adds:</p>
<div style="background:#f5f3ef;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
<p style="font-size:15px;color:#0a0a0a;margin:0 0 6px;line-height:1.7;">500 clients × $40/mo × 15% Tier 2 = <strong style="color:#BB9900;">$3,000/month</strong></p>
<p style="font-size:13px;color:#7a7875;margin:0;line-height:1.6;">From one referral. One agency. People using a tool they think belongs to the agency — and Frank earning 15% on every single one of them every month.</p>
</div>
<p style="font-size:15px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Frank paid $297 once. He recoups that in month one. After that — pure passive income. No cap. No limit.</p>
<div style="text-align:center;margin:32px 0;">
<a href="https://studio.buildwithtav.co/affiliate" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">See Frank's Full Breakdown →</a>
</div>
<p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Tav</p>
</div>
<p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p>
</div>
</body></html>`
  };
}

function emailDay7(firstName) {
  return {
    subject: "Last one from me — then I'll leave you to it",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
<div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div>
<div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;">
<p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Last email. I'll keep it straight.</p>
<p style="font-size:15px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">You signed up a week ago. If you've used Carousel Studio, you already know what it does. If you haven't — here's what you're sitting on:</p>
<div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:24px;">
<p style="font-size:15px;color:#0a0a0a;margin:0 0 10px;line-height:1.7;">— AI-generated carousels in 15–25 seconds, branded to you</p>
<p style="font-size:15px;color:#0a0a0a;margin:0 0 10px;line-height:1.7;">— The highest-reach format on Instagram right now</p>
<p style="font-size:15px;color:#0a0a0a;margin:0 0 10px;line-height:1.7;">— Built-in affiliate programme on every paid plan — earn recurring commission just by sharing your link</p>
<p style="font-size:15px;color:#0a0a0a;margin:0;line-height:1.7;">— Tier 2 commissions — earn on everyone your referrals refer too</p>
</div>
<p style="font-size:15px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Starter is $20/month. Refer 5 people and it pays for itself. That's the whole pitch.</p>
<p style="font-size:15px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">If it's not for you — no hard feelings. But if you've been sitting on the fence, this is the nudge.</p>
<div style="text-align:center;margin:32px 0;"><a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">See Plans and Upgrade →</a></div>
<p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Tav</p>
</div>
<p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p>
</div>
</body></html>`
  };
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const { data: users, error } = await supabase
      .from("users")
      .select("email, first_name, created_at, email_day2_sent, email_day4_sent, email_day5_sent, email_day7_sent, marketing_consent, plan, period_start, credits_used")
      .eq("plan", "free")
      .neq("marketing_consent", false);

    if (error) throw error;

    let day2Sent = 0, day4Sent = 0, day5Sent = 0, day7Sent = 0, creditsReset = 0;

    for (const user of users || []) {
      const daysSinceSignup = (now - new Date(user.created_at)) / (1000 * 60 * 60 * 24);
      const firstName = user.first_name || user.email.split("@")[0];

      // ── Monthly credit reset for free users ──────────────────────────────
      // Check if period_start is 30+ days ago (or never set)
      const periodStart = user.period_start ? new Date(user.period_start) : new Date(user.created_at);
      const daysSincePeriodStart = (now - periodStart) / (1000 * 60 * 60 * 24);

      if (daysSincePeriodStart >= 30) {
        await supabase.from("users").update({
          credits_used: 0,
          period_start: now.toISOString()
        }).eq("email", user.email);

        const { subject, html } = emailCreditsReset(firstName);
        await sendEmail(user.email, subject, html);
        creditsReset++;
      }

      // ── Nurture email sequence ────────────────────────────────────────────
      if (daysSinceSignup >= 2 && !user.email_day2_sent) {
        const { subject, html } = emailDay2(firstName);
        await sendEmail(user.email, subject, html);
        await supabase.from("users").update({ email_day2_sent: true }).eq("email", user.email);
        day2Sent++;
      }

      if (daysSinceSignup >= 4 && !user.email_day4_sent) {
        const { subject, html } = emailDay4(firstName);
        await sendEmail(user.email, subject, html);
        await supabase.from("users").update({ email_day4_sent: true }).eq("email", user.email);
        day4Sent++;
      }

      if (daysSinceSignup >= 5 && !user.email_day5_sent) {
        const { subject, html } = emailDay5(firstName);
        await sendEmail(user.email, subject, html);
        await supabase.from("users").update({ email_day5_sent: true }).eq("email", user.email);
        day5Sent++;
      }

      if (daysSinceSignup >= 7 && !user.email_day7_sent) {
        const { subject, html } = emailDay7(firstName);
        await sendEmail(user.email, subject, html);
        await supabase.from("users").update({ email_day7_sent: true }).eq("email", user.email);
        day7Sent++;
      }
    }

    return NextResponse.json({ success: true, creditsReset, day2Sent, day4Sent, day5Sent, day7Sent });
  } catch(e) {
    console.error("Email sequence cron error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
