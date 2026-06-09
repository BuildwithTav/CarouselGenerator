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

    if (userEmail) {
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("email", userEmail)
        .single();

      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      const isAdmin = user.is_admin;
      const isPro = user.plan === "pro";
      const isUnlimited = isAdmin || isPro;

      if (isPro && !isAdmin && user.credits_used >= 300) {
        return Response.json({ error: "fair_use_limit" }, { status: 429 });
      }

      if (!isUnlimited && user.credits_used >= user.credits_limit) {
        return Response.json({ error: "credits_exhausted" }, { status: 429 });
      }

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
