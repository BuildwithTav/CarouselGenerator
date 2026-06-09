import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const body = await req.json();
    const { model, max_tokens, messages, tools } = body;

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
