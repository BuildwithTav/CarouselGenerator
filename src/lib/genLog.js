import { supabaseAdmin } from "./dashboard";

// Every failed generation is written to generation_log with its raw error,
// so a failure can be diagnosed from the database afterwards instead of
// only living in a browser alert or in Vercel's logs.
export async function logGenerationError(brandId, source, slot, error) {
  try {
    await supabaseAdmin().from("generation_log").insert({ brand_id: brandId || null, source, slot: slot || null, error: String(error || "unknown error").slice(0, 2000) });
  } catch (e) {
    console.error("Couldn't write generation_log:", e.message);
  }
}

// Plain-English version of the errors that actually happen, shown in the
// dashboard alongside the raw message. null = no known explanation.
export function explainError(message) {
  const m = String(message || "");
  if (/fal/i.test(m) && /locked|top_?up|balance|insufficient|exhausted|billing/i.test(m)) return "Your fal.ai balance has run out. Top up at fal.ai (Billing), then generate again.";
  if (/fal/i.test(m) && /\b401\b|unauthori[sz]ed|invalid key/i.test(m)) return "fal.ai rejected the API key (FAL_API_KEY in Vercel).";
  if (/credit balance is too low/i.test(m)) return "Your Anthropic API credit has run out. Top up at console.anthropic.com, then generate again.";
  if (/blank\/blocked/i.test(m)) return "The image model's safety filter blocked the photo on both tries.";
  if (/declined to write/i.test(m)) return "Claude refused to write this one.";
  if (/took too long|timed out/i.test(m)) return "The image took too long to come back.";
  if (/overloaded|529|rate.?limit|\b429\b/i.test(m)) return "The AI service was busy. Try again in a minute.";
  return null;
}

export function friendlyError(message) {
  const plain = explainError(message);
  return plain ? `${plain} [${String(message).slice(0, 300)}]` : String(message);
}
