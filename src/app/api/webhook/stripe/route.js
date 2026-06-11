import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const SYSTEME_API_KEY = process.env.SYSTEME_API_KEY;

async function addTagToSysteme(email, tag) {
  try {
    const check = await fetch(`https://api.systeme.io/api/contacts?email=${encodeURIComponent(email)}`, {
      headers: { "X-API-Key": SYSTEME_API_KEY, "Accept": "application/json" }
    });
    const checkData = await check.json();
    const existing = checkData?.items?.[0];
    if (existing) {
      // Get tag ID first
      const tagsRes = await fetch("https://api.systeme.io/api/tags?limit=100", {
        headers: { "X-API-Key": SYSTEME_API_KEY, "Accept": "application/json" }
      });
      const tagsData = await tagsRes.json();
      const tagObj = tagsData?.items?.find(t => t.name === tag);
      if (tagObj) {
        await fetch(`https://api.systeme.io/api/contacts/${existing.id}/tags`, {
          method: "POST",
          headers: { "X-API-Key": SYSTEME_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ tagId: tagObj.id })
        });
      }
    }
  } catch(e) { console.error("Systeme tag error:", e); }
}

// Commission rates by plan
function getCommissionRate(plan) {
  switch(plan) {
    case "agency": return 0.40;
    case "pro": return 0.30;
    case "starter": return 0.20;
    case "affiliate_licence": return 0.25;
    case "white_label": return 0.35;
    default: return 0;
  }
}

async function logCommissions(subscriberEmail, stripePaymentId, plan, saleAmount) {
  try {
    // Find who referred this subscriber
    const { data: referral } = await supabase
      .from("referrals")
      .select("affiliate_id")
      .eq("referred_email", subscriberEmail)
      .single();

    if (!referral?.affiliate_id) return;

    // Find Tier 1 affiliate
    const { data: tier1Affiliate } = await supabase
      .from("users")
      .select("affiliate_id, plan, affiliate_active, affiliate_parent_id")
      .eq("affiliate_id", referral.affiliate_id)
      .single();

    if (!tier1Affiliate || !tier1Affiliate.affiliate_active) return;

    const tier1Rate = getCommissionRate(tier1Affiliate.plan);
    const tier1Amount = saleAmount * tier1Rate;

    // Check for duplicate
    const { data: existing } = await supabase
      .from("commissions")
      .select("id")
      .eq("stripe_payment_id", stripePaymentId + "_t1")
      .single();

    if (!existing) {
      await supabase.from("commissions").insert({
        affiliate_id: tier1Affiliate.affiliate_id,
        subscriber_email: subscriberEmail,
        stripe_payment_id: stripePaymentId + "_t1",
        plan,
        sale_amount: saleAmount,
        commission_rate: tier1Rate * 100,
        commission_amount: tier1Amount,
        tier: 1,
        status: "pending",
        earned_at: new Date().toISOString(),
        payable_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Tier 2 — 8% to parent of Tier 1
    if (tier1Affiliate.affiliate_parent_id) {
      const { data: tier2Affiliate } = await supabase
        .from("users")
        .select("affiliate_id, affiliate_active")
        .eq("affiliate_id", tier1Affiliate.affiliate_parent_id)
        .single();

      if (tier2Affiliate?.affiliate_active) {
        const tier2Rate = 0.08;
        const tier2Amount = saleAmount * tier2Rate;

        const { data: existing2 } = await supabase
          .from("commissions")
          .select("id")
          .eq("stripe_payment_id", stripePaymentId + "_t2")
          .single();

        if (!existing2) {
          await supabase.from("commissions").insert({
            affiliate_id: tier2Affiliate.affiliate_id,
            subscriber_email: subscriberEmail,
            stripe_payment_id: stripePaymentId + "_t2",
            plan,
            sale_amount: saleAmount,
            commission_rate: tier2Rate * 100,
            commission_amount: tier2Amount,
            tier: 2,
            status: "pending",
            earned_at: new Date().toISOString(),
            payable_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }
    }
  } catch(e) {
    console.error("Commission logging error:", e);
  }
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

    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items"]
    });

    const priceId = fullSession.line_items?.data?.[0]?.price?.id;
    const affiliateRef = session.metadata?.affiliate_ref || null;

    const isStarter = priceId === process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID;
    const isPro = priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
    const isAgency = priceId === process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID;
    const isAffiliateLicence = priceId === process.env.NEXT_PUBLIC_STRIPE_AFFILIATE_PRICE_ID;
    const isWhiteLabel = priceId === process.env.NEXT_PUBLIC_STRIPE_WHITELABEL_PRICE_ID;
    const isTopup = priceId === process.env.NEXT_PUBLIC_STRIPE_TOPUP_PRICE_ID;
    const isBoost = priceId === process.env.NEXT_PUBLIC_STRIPE_BOOST_PRICE_ID;

    // Handle credit top-ups
    if (isTopup || isBoost) {
      const creditsToAdd = isTopup ? 15 : 30;
      const { data: user } = await supabase
        .from("users")
        .select("bonus_credits")
        .eq("email", email)
        .single();
      await supabase.from("users").upsert({
        email,
        bonus_credits: (user?.bonus_credits || 0) + creditsToAdd
      }, { onConflict: "email" });
      await addTagToSysteme(email, "carousel-studio-credits");
      return NextResponse.json({ received: true });
    }

    // Handle one-off licences
    if (isAffiliateLicence || isWhiteLabel) {
      const licenceType = isAffiliateLicence ? "affiliate_licence" : "white_label";
      const credits_limit = isAffiliateLicence ? 15 : 80;
      const saleAmount = isAffiliateLicence ? 297 : 497;

      // Record licence purchase
      await supabase.from("licence_purchases").insert({
        email,
        licence_type: licenceType,
        stripe_payment_id: session.payment_intent || session.id,
        amount: saleAmount,
        status: "active"
      });

      // Update user plan and activate affiliate
      await supabase.from("users").upsert({
        email,
        plan: licenceType,
        credits_limit,
        credits_used: 0,
        affiliate_active: true,
        affiliate_tier: licenceType,
        period_start: new Date().toISOString()
      }, { onConflict: "email" });

      // If referred via affiliate link, log referral
      if (affiliateRef) {
        const { data: existing } = await supabase
          .from("referrals")
          .select("id")
          .eq("referred_email", email)
          .single();

        if (!existing) {
          await supabase.from("referrals").insert({
            referred_email: email,
            affiliate_id: affiliateRef
          });
        }

        // Log commission for licence purchase
        await logCommissions(email, session.payment_intent || session.id, licenceType, saleAmount);
      }

      const tag = isWhiteLabel ? "carousel-studio-whitelabel" : "carousel-studio-affiliate-licence";
      await addTagToSysteme(email, tag);
      return NextResponse.json({ received: true });
    }

    // Handle subscriptions
    const plan = isAgency ? "agency" : isPro ? "pro" : isStarter ? "starter" : "free";
    const credits_limit = isAgency ? 300 : isPro ? 80 : isStarter ? 20 : 6;
    const saleAmount = isAgency ? 100 : isPro ? 50 : isStarter ? 20 : 0;

    await supabase.from("users").upsert({
      email,
      plan,
      credits_limit,
      credits_used: 0,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      period_start: new Date().toISOString(),
      affiliate_active: plan !== "free",
      affiliate_tier: plan
    }, { onConflict: "email" });

    // If referred via affiliate link, log referral
    if (affiliateRef) {
      const { data: existing } = await supabase
        .from("referrals")
        .select("id")
        .eq("referred_email", email)
        .single();

      if (!existing) {
        await supabase.from("referrals").insert({
          referred_email: email,
          affiliate_id: affiliateRef
        });
      }
    }

    // Log commissions on subscription payment
    if (saleAmount > 0) {
      await logCommissions(email, session.id, plan, saleAmount);
    }

    const tag = isAgency ? "carousel-studio-agency" : isPro ? "carousel-studio-pro" : "carousel-studio-starter";
    await addTagToSysteme(email, tag);
  }

  // Handle recurring subscription payments (rebills)
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    if (invoice.billing_reason === "subscription_create") return NextResponse.json({ received: true }); // Already handled above

    const customerId = invoice.customer;
    const { data: user } = await supabase
      .from("users")
      .select("email, plan")
      .eq("stripe_customer_id", customerId)
      .single();

    if (user) {
      const saleAmount = user.plan === "agency" ? 100 : user.plan === "pro" ? 50 : user.plan === "starter" ? 20 : 0;
      if (saleAmount > 0) {
        await logCommissions(user.email, invoice.id, user.plan, saleAmount);
      }

      // Reset credits on rebill
      await supabase.from("users").update({
        credits_used: 0,
        period_start: new Date().toISOString()
      }).eq("stripe_customer_id", customerId);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const { data: users } = await supabase
      .from("users")
      .select("email, affiliate_id")
      .eq("stripe_customer_id", customerId);

    if (users?.length) {
      await supabase.from("users").update({
        plan: "free",
        credits_limit: 6,
        credits_used: 0,
        affiliate_active: false,
        affiliate_tier: "none"
      }).eq("stripe_customer_id", customerId);

      await addTagToSysteme(users[0].email, "carousel-studio-cancelled");
    }
  }

  return NextResponse.json({ received: true });
}
