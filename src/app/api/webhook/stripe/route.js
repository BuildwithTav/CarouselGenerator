import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details?.email;
    if (!email) return NextResponse.json({ received: true });

    // Retrieve full session with line items expanded
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items"]
    });

    const priceId = fullSession.line_items?.data?.[0]?.price?.id;
    const isStarter = priceId === process.env.STRIPE_STARTER_PRICE_ID;
    const isPro = priceId === process.env.STRIPE_PRO_PRICE_ID;
    const plan = isPro ? "pro" : isStarter ? "starter" : "free";
    const credits_limit = isPro ? 999999 : isStarter ? 30 : 3;

    await supabase.from("users").upsert({
      email,
      plan,
      credits_limit,
      credits_used: 0,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      period_start: new Date().toISOString()
    }, { onConflict: "email" });
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
        credits_limit: 3,
        credits_used: 0
      }).eq("stripe_customer_id", customerId);
    }
  }

  return NextResponse.json({ received: true });
}
