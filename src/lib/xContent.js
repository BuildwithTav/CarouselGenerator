import { ask, brandContext } from "./contentAi";

// The X content engine: a separate, lighter pipeline from the branded
// carousel system. It writes short, native-feeling X posts (text-only,
// single raw photo, or a 2-4 raw photo carousel) and deliberately skips the
// slide-template renderer entirely — the photo is attached to the post
// as-is, there's no headline/CTA overlay to build here.
//
// This brand's X account has a real enforcement history (one ban, several
// warnings, a pun video pulled down for being foot-suggestive even though it
// wasn't explicit) — so unlike a from-scratch account, "technically SFW"
// isn't a safe enough bar. The voice rules below are deliberately stricter
// than generic platform-safety advice: no foot-specific wordplay or jokes at
// all, ever, regardless of how mild. Feet stay visible in photos; they are
// never the punchline or the subject of the copy.

// Three jobs, one per daily post. Format mix per slot is weighted so the
// week averages out close to the brief's target (roughly 9 text / 7 single
// image / 5 carousel posts over 7 days, i.e. about 43% / 33% / 24%).
export const X_SLOTS = [
  {
    key: "personality",
    job: "Personality and relatability. A spontaneous-sounding thought or observation about cabin crew life, the kind of thing someone actually tweets without thinking too hard about it. Reach and replies, not a sales pitch.",
    formatWeights: { text: 0.65, single: 0.2, carousel: 0.15 },
  },
  {
    key: "visual",
    job: "Visual identity. Let a photo (or a short sequence of photos) do most of the work. The copy is short and never just describes what's in the photo — it adds a line, a feeling, a moment, not a caption under a picture.",
    formatWeights: { text: 0.05, single: 0.55, carousel: 0.4 },
  },
  {
    key: "conversation",
    job: "Conversation and engagement. A natural question or a statement people want to agree or disagree with. Not every conversation post is a question — mix genuine questions with opinions people react to.",
    formatWeights: { text: 0.55, single: 0.3, carousel: 0.15 },
  },
];

// Pillar 2 is deliberately reframed from the original "heels/feet/tights"
// brief: its primary expression is now real, positive, interesting feet
// facts told in a "did you know" tone, not jokes or wordplay about feet —
// see the file header for why. Lifestyle shots of heels/tights/tired feet
// after a shift still belong here as the visual side of the same pillar.
export const X_PILLARS = [
  { key: "cabin_crew_reality", label: "Cabin crew reality", weight: 25, guidance: "Highly relatable, specific observations about actually working as cabin crew: early reports, delays, crew-room moments, hotel life, body clock chaos, uniform problems, packing, crew terminology, food and drinks onboard." },
  { key: "feet_facts_lifestyle", label: "Feet facts / heels lifestyle", weight: 20, guidance: "Lean heavily into real, positive, genuinely interesting feet facts told in a credible 'did you know' tone (anatomy, circulation and swelling on long flights, foot care, shoe and heel history, pedicure trivia) — informative first, with a light, warm, occasionally suggestive-but-tasteful tone, never a joke or pun about feet. Alongside the facts, lifestyle shots of heels, tights, tired feet after a shift, switching into flats, hotel relaxation — shown, never joked about or called out with explicit words." },
  { key: "humour", label: "Humour", guidance: "Short, cabin-crew-specific jokes and relatable situations. Never a foot pun, never a joke where feet are the punchline. The humour comes from the job, not the body part.", weight: 15 },
  { key: "travel_aviation", label: "Travel and aviation", weight: 15, guidance: "Airports, aircraft, destinations, hotels, layovers, flying and travel observations." },
  { key: "conversation_opinion", label: "Conversation and opinion", weight: 15, guidance: "Posts built to trigger genuine replies and discussion: natural questions or statements people want to agree or disagree with, always rooted in cabin crew life or travel." },
  { key: "feminine_lifestyle", label: "Feminine lifestyle / behind the scenes", weight: 10, guidance: "Getting ready, outfits, beauty, coffee, hotel routine, relaxing, the contrast between work and off-duty, everyday moments." },
];

function weightedPick(items, weightKey = "weight") {
  const total = items.reduce((s, i) => s + i[weightKey], 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item[weightKey];
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

export function pickPillar() {
  return weightedPick(X_PILLARS);
}

// Returns "text" | "single" | "carousel", and for carousel, how many photos (2-4).
export function pickFormat(slot) {
  const r = Math.random();
  const w = slot.formatWeights;
  const format = r < w.text ? "text" : r < w.text + w.single ? "single" : "carousel";
  const photoCount = format === "single" ? 1 : format === "carousel" ? 2 + Math.floor(Math.random() * 3) : 0;
  return { format, photoCount };
}

const BANNED_PHRASES = `There's something about..., It's not just X, it's Y, Because sometimes..., A little reminder..., POV: when..., Tell me you're X without telling me..., Who else can relate?, Can we talk about..., Just another day..., Nothing beats..., If you know, you know`;

const VOICE_RULES = `You write as a real woman who actually works cabin crew, posting on her own X account. Personality: playful, feminine, confident, slightly cheeky, observational, occasionally sarcastic, conversational, relatable, never desperate for engagement. British English, natural punctuation, sentence fragments are fine. Occasional emojis from this set only, used sparingly, never in every post: ✈️ 👠 😮‍💨 😂 🛫 ☕️ 🖤.

Never sound like an automated account, a content farm, or an AI. Never use these phrases or anything that reads like them: ${BANNED_PHRASES}. If a line reads like marketing copy, a LinkedIn post, or a listicle, rewrite it plainer.

Length: most posts are short, 5 to 30 words. Conversational posts can run 30 to 70 words. Never pad a short, punchy thought into a longer one just to fill space.

Hashtags: none, by default. Only use one if there's a genuine specific reason, and never more than one.

Never beg for engagement: no "like if you agree", "retweet if", "follow me for more", "drop a [emoji]", "comment YES", "tag someone", "let's get this to X likes". A genuine, natural question is fine. Never mention OnlyFans, never link to the website, never ask people to visit the profile — this is organic growth content, not a sales post.

For a single-image or carousel post, never just describe what's visible in the photo ("here's my feet after a long shift"). The copy adds a feeling, a moment, a number, a punchline the photo doesn't already say. Let the image do the work.

Absolute rule, not a style preference: no wordplay, puns, or jokes about feet, toes, or soles, however mild. Never use the words "feet pics", "fetish", "worship", "soles", or "toes" as the subject of a joke. This account has already been banned once and warned multiple times for content that read as sexual or suggestive, including a pun that was never explicit in its wording. Feet can appear in photos and in genuine, factual, positive context (see the feet-facts pillar) but are never the punchline, never the explicit subject of a joke, and never described in explicit or crude language.`;

// `recentPosts` is a short list of recent captions (already posted or
// queued) for this brand, used purely to stop the model repeating a hook,
// joke, question, or structure it's already used in roughly the last month.
export async function generateXPost(brand, { slot, pillar, format, recentPosts = [], imageUrls = [] }) {
  const system = `You write one X (Twitter) post for a brand's account. Reply with JSON only: {"text": "..."}.
${VOICE_RULES}`;

  const formatBrief =
    format === "text"
      ? "This post is text-only, no image. The words alone have to carry it."
      : format === "single"
      ? "This post has one photo attached, shown to you above — look at what's actually in it (setting, pose, props, mood) before writing. 3 to 25 words. Never a caption that just describes the photo, but it has to genuinely fit this specific shot, not be a generic line that could sit under any photo."
      : "This post has 2 to 4 photos attached, shown to you above in order — look at what's actually in each one. Write one short line of copy for the whole set that fits the actual sequence shown (not an invented progression), not per-photo captions.";

  const recentBlock = recentPosts.length
    ? `Recent posts from this account (do not repeat their hook, joke, question, topic angle, or sentence structure — the execution must be noticeably different even if the broad topic recurs):\n${recentPosts.map((p) => `- ${p}`).join("\n")}`
    : "No recent post history yet.";

  const user = `${brandContext(brand)}

Today's post job: ${slot.job}
Content pillar: ${pillar.label}. ${pillar.guidance}
${formatBrief}

${recentBlock}

Before answering, check: does this sound like a real person, not an automated account? Is it clearly different from the recent posts above? Is the language natural, not AI-coded? If this is a visual post, does the copy add something the photo doesn't already say? If this touches feet at all, is it handled through genuine lifestyle or fact framing, with zero wordplay or joking?

Write the post.`;

  const out = await ask(system, user, 600, imageUrls);
  return { text: String(out.text || "").trim().slice(0, 280) };
}
