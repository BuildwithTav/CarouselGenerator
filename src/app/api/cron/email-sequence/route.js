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
<div style="text-align:center;margin:32px 0;">
<a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">Generate Your First Carousel →</a>
</div>
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
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">That means the moment you upgrade, you get a personal referral link. Share it. When someone signs up and pays — you earn recurring monthly commission for as long as they stay subscribed.</p>
<div style="background:#0a0a0a;border-radius:12px;padding:28px;margin-bottom:24px;">
<p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 16px;line-height:1.7;font-weight:700;color:#BB9900;">How it works:</p>
<p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 12px;line-height:1.7;"><span style="color:#BB9900;font-weight:700;">Starter ($20/month)</span> — earn 20% on every referral. Refer 5 people and your subscription pays for itself every month.</p>
<p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 12px;line-height:1.7;"><span style="color:#BB9900;font-weight:700;">Pro ($50/month)</span> — earn 30%. Refer 4 people and Pro pays for itself.</p>
<p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 12px;line-height:1.7;"><span style="color:#BB9900;font-weight:700;">Agency ($100/month)</span> — earn 40%.</p>
<p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0;line-height:1.7;"><span style="color:#BB9900;font-weight:700;">Tier 2 — 15% on everyone your referrals refer.</span> So if someone you refer brings in 10 people — you earn 15% on all of them too. Every month.</p>
</div>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">This isn't a bonus feature. It's included in every plan. The tool pays for content creation. The affiliate side turns that into income.</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Most people in your position who post content regularly are sitting on an audience that would pay for this. Your link goes in your bio, your pinned comment, your carousel CTA. That's it.</p>
<div style="text-align:center;margin:32px 0;">
<a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">Upgrade and Get Your Link →</a>
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
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">You signed up a week ago. If you've used Carousel Studio, you already know what it does. If you haven't — here's what you're sitting on:</p>
<div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:24px;">
<p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;">— AI-generated carousels in 15–25 seconds, branded to you</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;">— The highest-reach format on Instagram right now</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;">— Built-in affiliate programme on every paid plan — earn recurring commission just by sharing your link</p>
<p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Tier 2 commissions — earn on everyone your referrals refer too</p>
</div>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Starter is $20/month. Refer 5 people and it pays for itself. That's the whole pitch.</p>
<p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">If it's not for you — no hard feelings. But if you've been sitting on the fence, this is the nudge.</p>
<div style="text-align:center;margin:32px 0;">
<a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">See Plans and Upgrade →</a>
</div>
<p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Tav</p>
</div>
<p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p>
</div>
</body></html>`
  };
}

export async function GET(req) {
  // Verify this is coming from Vercel cron
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Get all free users who haven't unsubscribed
    const { data: users, error } = await supabase
      .from("users")
      .select("email, first_name, created_at, email_day2_sent, email_day4_sent, email_day7_sent, marketing_consent, plan")
      .eq("plan", "free")
      .neq("marketing_consent", false);

    if (error) throw error;

    let day2Sent = 0, day4Sent = 0, day7Sent = 0;

    for (const user of users || []) {
      const daysSinceSignup = (now - new Date(user.created_at)) / (1000 * 60 * 60 * 24);
      const firstName = user.first_name || user.email.split("@")[0];

      // Day 2 email
      if (daysSinceSignup >= 2 && !user.email_day2_sent) {
        const { subject, html } = emailDay2(firstName);
        await sendEmail(user.email, subject, html);
        await supabase.from("users").update({ email_day2_sent: true }).eq("email", user.email);
        day2Sent++;
      }

      // Day 4 email
      if (daysSinceSignup >= 4 && !user.email_day4_sent) {
        const { subject, html } = emailDay4(firstName);
        await sendEmail(user.email, subject, html);
        await supabase.from("users").update({ email_day4_sent: true }).eq("email", user.email);
        day4Sent++;
      }

      // Day 7 email
      if (daysSinceSignup >= 7 && !user.email_day7_sent) {
        const { subject, html } = emailDay7(firstName);
        await sendEmail(user.email, subject, html);
        await supabase.from("users").update({ email_day7_sent: true }).eq("email", user.email);
        day7Sent++;
      }
    }

    return NextResponse.json({ success: true, day2Sent, day4Sent, day7Sent });
  } catch(e) {
    console.error("Email sequence cron error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
