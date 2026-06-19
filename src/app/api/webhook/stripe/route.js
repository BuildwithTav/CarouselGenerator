import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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

async function sendEmail(to, subject, html) {
  try {
    const { data: profile } = await supabase.from("users").select("marketing_consent").eq("email", to).single();
    if (profile && profile.marketing_consent === false) return;
    const htmlWithFooter = html.replace("</body>", unsubscribeFooter(to) + "</body>");
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html: htmlWithFooter })
    });
  } catch(e) { console.error("Resend error:", e); }
}

function emailPaymentConfirmed(firstName, planName, planPrice, isSinglePayment) {
  const billingText = isSinglePayment
    ? `one-time payment of <strong>$${planPrice}</strong>`
    : `<strong>$${planPrice}/month</strong> — your Stripe receipt has the full details`;
  return {
    subject: `Payment confirmed — welcome to Carousel Studio ${planName}`,
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:40px 24px;"><div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div><div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;"><p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Payment confirmed. You're now on <strong style="color:#BB9900;">Carousel Studio ${planName}</strong> — ${billingText}.</p><div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:24px;"><p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;"><strong style="color:#BB9900;">1.</strong> Go to <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;font-weight:700;">studio.buildwithtav.co</a></p><p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;"><strong style="color:#BB9900;">2.</strong> Enter the email address you used at checkout</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;"><strong style="color:#BB9900;">3.</strong> Enter the code we send you — your plan will be active immediately</p><p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;"><strong style="color:#BB9900;">4.</strong> Head to the <strong>Brand tab</strong> and spend 2 minutes setting up your profile</p></div><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">Once you're set up, I'll send you a separate email with your personal affiliate link and everything you need to start earning commission.</p><div style="text-align:center;margin:32px 0;"><a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">Access Carousel Studio →</a></div><p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">If you need help, use the Help tab inside the app.<br><br>— Tav</p></div><p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p></div></body></html>`
  };
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

function emailUpgradeConfirmed(firstName, planName, planPrice, commissionRate) {
  return {
    subject: `You're now on ${planName} — here's what changed`,
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:40px 24px;"><div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div><div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;"><p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hi ${firstName},</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">You're now on <strong style="color:#BB9900;">Carousel Studio ${planName}</strong> — $${planPrice}/month.</p><div style="background:#f5f3ef;border-radius:10px;padding:24px;margin-bottom:24px;"><p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;font-weight:700;">What's changed:</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;">— Your credits have been updated to reflect your new plan</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 12px;line-height:1.7;">— Your affiliate commission rate is now <strong style="color:#BB9900;">${commissionRate}%</strong></p><p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Your affiliate link stays the same</p></div><div style="text-align:center;margin:32px 0;"><a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">Go to Carousel Studio →</a></div><p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Tav</p></div><p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p></div></body></html>`
  };
}

async function addTagToSysteme(email, tag) {
  try {
    const tagsRes = await fetch("https://api.systeme.io/api/tags?limit=100", {
      headers: { "X-API-Key": SYSTEME_API_KEY, "Accept": "application/json" }
    });
    const tagsData = await tagsRes.json();
    let tagObj = tagsData?.items?.find(t => t.name === tag);
    if (!tagObj) {
      const create = await fetch("https://api.systeme.io/api/tags", {
        method: "POST",
        headers: { "X-API-Key": SYSTEME_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ name: tag })
      });
      tagObj = await create.json();
    }
    if (!tagObj?.id) return;

    const check = await fetch(`https://api.systeme.io/api/contacts?email=${encodeURIComponent(email)}`, {
      headers: { "X-API-Key": SYSTEME_API_KEY, "Accept": "application/json" }
    });
    const checkData = await check.json();
    let contactId = checkData?.items?.[0]?.id;

    if (!contactId) {
      const createContact = await fetch("https://api.systeme.io/api/contacts", {
        method: "POST",
        headers: { "X-API-Key": SYSTEME_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const createdContact = await createContact.json();
      contactId = createdContact?.id;
    }

    if (contactId) {
      await fetch(`https://api.systeme.io/api/contacts/${contactId}/tags`, {
        method: "POST",
        headers: { "X-API-Key": SYSTEME_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ tagId: tagObj.id })
      });
    }
  } catch(e) { console.error("Systeme tag error:", e); }
}

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

function emailCommissionEarned(firstName, amount, planName) {
  return {
    subject: "💰 You just earned a commission",
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#f5f3ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:40px 24px;"><div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:900;color:#0a0a0a;font-family:Georgia,serif;">Carousel Studio</span><span style="font-size:13px;color:#BB9900;font-weight:700;margin-left:8px;">by BuildWithTav</span></div><div style="background:#ffffff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;"><p style="font-size:17px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">Hey ${firstName},</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">A referral just upgraded to <strong>${planName}</strong> via your Carousel Studio link.</p><div style="background:#0a0a0a;border-radius:12px;padding:28px;margin-bottom:24px;text-align:center;"><p style="font-size:48px;font-weight:900;color:#BB9900;margin:0 0 4px;font-family:Georgia,serif;">$${amount}</p><p style="font-size:14px;color:rgba(255,255,255,0.6);margin:0;">commission earned</p></div><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">As long as they stay subscribed, that commission <strong style="color:#BB9900;">repeats every month</strong>. You've just earned a lifetime monthly commission based on their continued subscription.</p><p style="font-size:17px;color:#0a0a0a;margin:0 0 24px;line-height:1.7;">On top of that, you also earn commission on <strong>everyone they refer</strong> too — so every person you bring in could bring in more.</p><div style="background:#f5f3ef;border-radius:10px;padding:20px;margin-bottom:24px;"><p style="font-size:14px;color:#7a7875;margin:0;line-height:1.6;">This commission is pending for 30 days, then moves to available for withdrawal. Results may vary based on referral retention.</p></div><div style="text-align:center;margin:32px 0;"><a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:16px 36px;border-radius:10px;font-size:17px;font-weight:800;text-decoration:none;display:inline-block;">View Your Dashboard →</a></div><p style="font-size:17px;color:#0a0a0a;margin:0;line-height:1.7;">— Tav</p></div><p style="font-size:13px;color:#7a7875;text-align:center;margin-top:24px;">Carousel Studio · <a href="https://studio.buildwithtav.co" style="color:#BB9900;text-decoration:none;">studio.buildwithtav.co</a></p></div></body></html>`
  };
}

async function getEffectiveRate(affiliateId, currentPlan) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const firstDay = `${year}-${month}-01`;
  const { data: snapshots } = await supabase
    .from("monthly_rate_snapshots")
    .select("snapshot_type, commission_rate")
    .eq("affiliate_id", affiliateId)
    .gte("snapshot_date", firstDay)
    .order("snapshot_date", { ascending: true });
  if (!snapshots || snapshots.length === 0) return getPlanRate(currentPlan);
  const startSnap = snapshots.find(s => s.snapshot_type === "month_start");
  const endSnap = snapshots.find(s => s.snapshot_type === "month_end");
  if (startSnap && endSnap) return Math.min(startSnap.commission_rate, endSnap.commission_rate);
  return startSnap ? startSnap.commission_rate : getPlanRate(currentPlan);
}

async function logCommissions(subscriberEmail, stripePaymentId, plan, saleAmount) {
  try {
    const { data: user } = await supabase.from("users").select("affiliate_ref").eq("email", subscriberEmail).single();
    if (!user?.affiliate_ref) return;

    const { data: tier1Affiliate } = await supabase
      .from("users")
      .select("affiliate_id, plan, affiliate_active, affiliate_parent_id")
      .eq("affiliate_id", user.affiliate_ref)
      .single();

    if (!tier1Affiliate || !tier1Affiliate.affiliate_active) return;

    const tier1Rate = await getEffectiveRate(tier1Affiliate.affiliate_id, tier1Affiliate.plan);
    const tier1Amount = saleAmount * tier1Rate;

    const { data: existing } = await supabase.from("commissions").select("id").eq("stripe_payment_id", stripePaymentId + "_t1").single();
    if (!existing) {
      await supabase.from("commissions").insert({
        affiliate_id: tier1Affiliate.affiliate_id,
        subscriber_email: subscriberEmail,
        stripe_payment_id: stripePaymentId + "_t1",
        plan, sale_amount: saleAmount,
        commission_rate: tier1Rate * 100,
        commission_amount: tier1Amount,
        tier: 1, status: "pending",
        earned_at: new Date().toISOString(),
        payable_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      // Notify tier 1 affiliate
      try {
        const { data: affUser } = await supabase.from("users").select("email, first_name").eq("affiliate_id", tier1Affiliate.affiliate_id).single();
        if (affUser?.email) {
          const { subject, html } = emailCommissionEarned(affUser.first_name || "there", tier1Amount.toFixed(2), getPlanLabel(plan));
          await sendEmail(affUser.email, subject, html);
        }
      } catch {}
    }

    if (tier1Affiliate.affiliate_parent_id) {
      const { data: tier2Affiliate } = await supabase
        .from("users")
        .select("affiliate_id, affiliate_active")
        .eq("affiliate_id", tier1Affiliate.affiliate_parent_id)
        .single();

      if (tier2Affiliate?.affiliate_active) {
        const tier2Amount = saleAmount * 0.15;
        const { data: existing2 } = await supabase.from("commissions").select("id").eq("stripe_payment_id", stripePaymentId + "_t2").single();
        if (!existing2) {
          await supabase.from("commissions").insert({
            affiliate_id: tier2Affiliate.affiliate_id,
            subscriber_email: subscriberEmail,
            stripe_payment_id: stripePaymentId + "_t2",
            plan, sale_amount: saleAmount,
            commission_rate: 15,
            commission_amount: tier2Amount,
            tier: 2, status: "pending",
            earned_at: new Date().toISOString(),
            payable_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
          // Notify tier 2 affiliate
          try {
            const { data: aff2User } = await supabase.from("users").select("email, first_name").eq("affiliate_id", tier2Affiliate.affiliate_id).single();
            if (aff2User?.email) {
              const { subject, html } = emailCommissionEarned(aff2User.first_name || "there", tier2Amount.toFixed(2), getPlanLabel(plan));
              await sendEmail(aff2User.email, subject, html);
            }
          } catch {}
        }
      }
    }
  } catch(e) { console.error("Commission logging error:", e); }
}

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details?.email;
    if (!email) return NextResponse.json({ received: true });

    const firstName = session.customer_details?.name?.split(" ")[0] || email.split("@")[0];

    const fullSession = await stripe.checkout.sessions.retrieve(session.id, { expand: ["line_items"] });
    const priceId = fullSession.line_items?.data?.[0]?.price?.id;
    const affiliateRef = session.metadata?.affiliate_ref || null;

    const isStarter = priceId === process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID;
    const isPro = priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
    const isAgency = priceId === process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID;
    const isAffiliateLicence = priceId === process.env.NEXT_PUBLIC_STRIPE_AFFILIATE_PRICE_ID;
    const isWhiteLabel = priceId === process.env.NEXT_PUBLIC_STRIPE_WHITELABEL_PRICE_ID;
    const isTopup = priceId === process.env.NEXT_PUBLIC_STRIPE_TOPUP_PRICE_ID;
    const isBoost = priceId === process.env.NEXT_PUBLIC_STRIPE_BOOST_PRICE_ID;

    if (isTopup || isBoost) {
      const creditsToAdd = isTopup ? 150 : 300;
      const { data: user } = await supabase.from("users").select("bonus_credits").eq("email", email).single();
      await supabase.from("users").upsert({ email, bonus_credits: (user?.bonus_credits || 0) + creditsToAdd }, { onConflict: "email" });
      await addTagToSysteme(email, "carousel-studio-credits");
      return NextResponse.json({ received: true });
    }

    if (affiliateRef) {
      await supabase.from("pending_affiliate_refs").upsert({ email, affiliate_ref: affiliateRef }, { onConflict: "email" });
    }

    if (isAffiliateLicence || isWhiteLabel) {
      const licenceType = isAffiliateLicence ? "affiliate_licence" : "white_label";
      // ✅ FIXED: was 15/80, now 150/800
      const credits_limit = isAffiliateLicence ? 150 : 800;
      const saleAmount = isAffiliateLicence ? 297 : 497;
      const planLabel = getPlanLabel(licenceType);

      await supabase.from("users").upsert({
        email, plan: licenceType, credits_limit, credits_used: 0,
        affiliate_active: true, affiliate_tier: licenceType,
        period_start: new Date().toISOString()
      }, { onConflict: "email" });

      await logCommissions(email, session.payment_intent || session.id, licenceType, saleAmount);

      const { subject, html } = emailPaymentConfirmed(firstName, planLabel, saleAmount, true);
      await sendEmail(email, subject, html);

      const tag = isWhiteLabel ? "carousel-studio-whitelabel" : "carousel-studio-affiliate-licence";
      await addTagToSysteme(email, tag);
      return NextResponse.json({ received: true });
    }

    const plan = isAgency ? "agency" : isPro ? "pro" : isStarter ? "starter" : "free";
    // ✅ FIXED: was 300/80/20/6, now 3000/800/200/60
    const credits_limit = isAgency ? 3000 : isPro ? 800 : isStarter ? 200 : 60;
    const saleAmount = isAgency ? 100 : isPro ? 50 : isStarter ? 20 : 0;
    const planLabel = getPlanLabel(plan);

    const { data: existingUser } = await supabase.from("users").select("plan, first_name").eq("email", email).single();
    const isUpgrade = existingUser && existingUser.plan !== "free" && existingUser.plan !== plan;
    const resolvedFirstName = existingUser?.first_name || firstName;

    await supabase.from("users").upsert({
      email, plan, credits_limit, credits_used: 0,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      period_start: new Date().toISOString(),
      affiliate_active: plan !== "free",
      affiliate_tier: plan
    }, { onConflict: "email" });

    if (saleAmount > 0) {
      await logCommissions(email, session.id, plan, saleAmount);
      if (isUpgrade) {
        const commissionRate = getPlanRate(plan) * 100;
        const { subject, html } = emailUpgradeConfirmed(resolvedFirstName, planLabel, saleAmount, commissionRate);
        await sendEmail(email, subject, html);
      } else {
        const { subject, html } = emailPaymentConfirmed(resolvedFirstName, planLabel, saleAmount, false);
        await sendEmail(email, subject, html);
      }
    }

    const tag = isAgency ? "carousel-studio-agency" : isPro ? "carousel-studio-pro" : "carousel-studio-starter";
    await addTagToSysteme(email, tag);
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    if (invoice.billing_reason === "subscription_create") return NextResponse.json({ received: true });
    const customerId = invoice.customer;
    const { data: user } = await supabase.from("users").select("email, plan").eq("stripe_customer_id", customerId).single();
    if (user) {
      const saleAmount = user.plan === "agency" ? 100 : user.plan === "pro" ? 50 : user.plan === "starter" ? 20 : 0;
      if (saleAmount > 0) await logCommissions(user.email, invoice.id, user.plan, saleAmount);
      await supabase.from("users").update({ credits_used: 0, period_start: new Date().toISOString() }).eq("stripe_customer_id", customerId);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const { data: users } = await supabase.from("users").select("email").eq("stripe_customer_id", customerId);
    if (users?.length) {
      await supabase.from("users").update({
        plan: "free", credits_limit: 60, credits_used: 0,
        affiliate_active: false, affiliate_tier: "none"
      }).eq("stripe_customer_id", customerId);
      await addTagToSysteme(users[0].email, "carousel-studio-cancelled");
    }
  }

  return NextResponse.json({ received: true });
}
