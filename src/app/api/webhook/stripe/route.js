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
      await fetch(`https://api.systeme.io/api/contacts/${existing.id}/tags`, {
        method: "POST",
        headers: { "X-API-Key": SYSTEME_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ tagName: tag })
      });
    }
  } catch(e) { console.error("Systeme tag error:", e); }
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
    const isStarter = priceId === process.env.STRIPE_STARTER_PRICE_ID;
    const isPro = priceId === process.env.STRIPE_PRO_PRICE_ID;
    const isTopup = priceId === process.env.STRIPE_TOPUP_PRICE_ID;
    const isBoost = priceId === process.env.STRIPE_BOOST_PRICE_ID;

    // Handle credit top-ups (one-time payments)
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

    // Handle subscriptions
    const plan = isPro ? "pro" : isStarter ? "starter" : "free";
    const credits_limit = isPro ? 999999 : isStarter ? 30 : 6;

    await supabase.from("users").upsert({
      email,
      plan,
      credits_limit,
      credits_used: 0,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      period_start: new Date().toISOString()
    }, { onConflict: "email" });

    const tag = isPro ? "carousel-studio-pro" : "carousel-studio-starter";
    await addTagToSysteme(email, tag);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const customerId = subscription.customer;

    const { data: users } = await supabase
      .from("users")
      .select("email")
      .eq("stripe_customer_id", customerId);

    if (users?.length) {
      await supabase.from("users").update({
        plan: "free",
        credits_limit: 6,
        credits_used: 0
      }).eq("stripe_customer_id", customerId);

      await addTagToSysteme(users[0].email, "carousel-studio-cancelled");
    }
  }

  return NextResponse.json({ received: true });
}
