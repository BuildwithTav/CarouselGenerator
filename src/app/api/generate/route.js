import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { model, max_tokens, messages, tools, userEmail } = body;

    // If email provided, check and increment credits
    if (userEmail) {
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("email", userEmail)
        .single();

      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      // Check if admin or pro with fair use
      const isAdmin = user.is_admin;
      const isPro = user.plan === "pro";
      const isUnlimited = isAdmin || isPro;

      // Check fair use cap for pro (500/month)
      if (isPro && !isAdmin && user.credits_used >= 500) {
        return Response.json({ error: "fair_use_limit" }, { status: 429 });
      }

      // Check credit limit for free and starter
      if (!isUnlimited && user.credits_used >= user.credits_limit) {
        return Response.json({ error: "credits_exhausted" }, { status: 429 });
      }

      // Increment credits used
      await supabase
        .from("users")
        .update({ credits_used: user.credits_used + 1 })
        .eq("email", userEmail);
    }

    const params = {
      model: model || "claude-sonnet-4-6",
      max_tokens: max_tokens || 1000,
      messages,
    };
    if (tools) params.tools = tools;

    const response = await client.messages.create(params);
    return Response.json(response);

  } catch (err) {
    console.error("API route error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
