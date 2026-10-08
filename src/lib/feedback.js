import { supabaseAdmin } from "./dashboard";

// How many of the latest rejection reasons go to the AI on every post and
// photo it writes. Older ones drop off, so a fixed problem stops being
// repeated at it forever.
export const FEEDBACK_LIMIT = 12;

// The latest "why I rejected this" entries from the X tab, as one line
// each ("Face showing: her full face was in the shot"). Never throws: a
// failed lookup just means generating without them.
export async function recentFeedback(brandId, limit = FEEDBACK_LIMIT) {
  try {
    const { data } = await supabaseAdmin()
      .from("content_feedback")
      .select("reasons, note")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data || []).map((r) => [(r.reasons || []).join(", "), r.note].filter(Boolean).join(": ")).filter(Boolean);
  } catch (e) {
    console.error("Couldn't load feedback:", e.message);
    return [];
  }
}
