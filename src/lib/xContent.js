import { ask, brandContext, generatePackage } from "./contentAi";

// The X content engine: a separate, lighter pipeline from the branded
// carousel system. Three native formats skip the slide-template renderer
// entirely (text-only, single AI photo, 2-4 photo carousel — the photo is
// attached to the post as-is, no headline/CTA overlay); a fourth format
// hands off to the real branded carousel system for a proper multi-slide
// post, capped at 4 slides to match X's own image-per-post limit.
//
// This brand's X account has a real enforcement history (one ban, several
// warnings, a pun video pulled down for being foot-suggestive even though it
// wasn't explicit) — so unlike a from-scratch account, "technically SFW"
// isn't a safe enough bar. The voice rules below are deliberately stricter
// than generic platform-safety advice: no foot-specific wordplay or jokes at
// all, ever, regardless of how mild. Feet stay visible in photos; they are
// never the punchline or the subject of the copy.

// Three jobs, one per daily post. Carousel and branded-carousel formats are
// deliberately gone from this mix (Tav's call: quality and reliability over
// variety — a multi-photo post multiplies both the generation time, that
// was pushing slots past their budget, and the fal.ai spend, for a format
// this account wasn't using anyway). Every slot is now just text or exactly
// one photo; each slot's old carousel/branded_carousel weight is folded
// straight into "single".
export const X_SLOTS = [
  {
    key: "personality",
    job: "Personality and relatability. A spontaneous-sounding thought or observation about cabin crew life, the kind of thing someone actually tweets without thinking too hard about it. Reach and replies, not a sales pitch.",
    formatWeights: { text: 0.65, single: 0.35 },
  },
  {
    key: "visual",
    job: "Visual identity. Let the photo do most of the work. The copy is short and never just describes what's in the photo — it adds a line, a feeling, a moment, not a caption under a picture.",
    formatWeights: { text: 0.05, single: 0.95 },
  },
  {
    key: "conversation",
    job: "Conversation and engagement. Mostly a statement, opinion, or relatable moment people want to agree or disagree with — a genuine question is the minority case here, not the default, and most other slots should basically never end on one.",
    formatWeights: { text: 0.55, single: 0.45 },
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

// Returns "text" | "single" — only ever text or exactly one photo. Ignores
// any carousel/branded_carousel weight a slot might still carry, so that
// format can't come back by way of a stray config value.
export function pickFormat(slot) {
  const w = slot.formatWeights;
  const items = [
    { key: "text", weight: w.text },
    { key: "single", weight: w.single },
  ];
  const format = weightedPick(items, "weight").key;
  const photoCount = format === "single" ? 1 : 0;
  return { format, photoCount };
}

const BANNED_PHRASES = `There's something about..., It's not just X, it's Y, Because sometimes..., A little reminder..., POV: when..., Tell me you're X without telling me..., Who else can relate?, Can we talk about..., Just another day..., Nothing beats..., If you know, you know`;

const VOICE_RULES = `You write as a real woman who actually works cabin crew, posting on her own X account. She's 30, confident, having a good time with her life, and this is just her talking, not a brand account. Personality: playful, feminine, confident, slightly cheeky, observational, occasionally sarcastic, conversational, relatable, never desperate for engagement — and genuinely flirty: a sensual, alluring undertone that invites rather than announces, the same quiet seductiveness this brand already writes with elsewhere (think "a slow reveal", not a hard sell). British English, natural punctuation, sentence fragments are fine. Occasional emojis from this set only, used sparingly, never in every post: ✈️ 👠 😮‍💨 😂 🛫 ☕️ 🖤.

Never use an em dash or en dash (—, –) anywhere, for any reason — use a comma, full stop, or just start a new sentence instead. Never use jargon, business-speak, or a word an ordinary 30-year-old wouldn't actually say out loud (no "elevate", "curated", "journey", "vibe check", "era" as a noun, "main character", or anything that sounds like a brand strategist wrote it). Plain, everyday words only.

Never sound like an automated account, a content farm, or an AI. Never use these phrases or anything that reads like them: ${BANNED_PHRASES}. If a line reads like marketing copy, a LinkedIn post, or a listicle, rewrite it plainer. Watch especially for a vague, poetic, slightly melancholy closing line tacked onto an otherwise normal post ("...and so am I, apparently", "...just like that", "...funny how that works") — that specific pattern reads as AI-generated. If a post needs a punchline, make it a real, specific, concrete one, not a wistful one-liner.

Never write a line that could be misread or land wrong, and never force a joke that isn't actually funny, shoehorned in because the post "needs" one — if there's no genuinely funny angle, don't make one up.

Length: short and sweet, always. Most posts are 5 to 20 words. Conversational posts can run a little longer but 35 words is a hard ceiling, not a target to aim for — when in doubt, cut it shorter, never pad a short punchy thought out to fill space. This has to leave room for hashtags too (they count toward the same post), so write the line itself tight enough that adding them doesn't cut anything off. A post that reads as rambling or runs long is a failure here, full stop.

Hashtags: every post carries 2 to 5, placed inside the post text itself (never as a separate trailing block, never generic filler like #love or #instagood). Pick ones genuinely tied to this specific post's actual content — the pillar, the moment, the job it's doing. Treat zero hashtags as something to actively avoid, not a neutral default; only skip them if you genuinely cannot find any that fit this exact post.

Never beg for engagement: no "like if you agree", "retweet if", "follow me for more", "drop a [emoji]", "comment YES", "tag someone", "let's get this to X likes". Never mention OnlyFans, never link to the website, never ask people to visit the profile — this is organic growth content, not a sales post.

Don't default to ending a post on a question. A question is the exception, not the structure every post reaches for, most posts should be a flat statement, an observation, or a sensual little moment described plainly, full stop at the end. Only reach for a genuine question occasionally, and even then only when the conversation slot's job actually calls for one.

For a single-image or carousel post, never just describe what's visible in the photo ("here's my feet after a long shift"). The copy adds a feeling, a moment, a number, a punchline the photo doesn't already say. Let the image do the work.

Lean into suggestive and seductive, genuinely — a real physical, sensory moment, not just a mood word dropped in. Think specific detail: the heat, the relief of slipping out of a hot shoe on a break, the stretch after a long shift, bare feet on cool tile after being in heels for hours, the exact feeling of a moment like that. That specificity is what makes it land as alluring instead of generic. This is a tone, not a licence: still fully clothed above the waist always, nothing explicit, no crude language, nothing beyond what the brand's existing boudoir-style editorial photography already does. Absolute rule, not a style preference, and unrelated to the above: no wordplay, puns, or jokes about feet, toes, or soles, however mild. Never use the words "feet pics", "fetish", "worship", "soles", or "toes" as the subject of a joke. This account has already been banned once and warned multiple times for content that read as sexual or suggestive, including a pun that was never explicit in its wording. Feet can appear in photos and in genuine, factual, positive context (see the feet-facts pillar) but are never the punchline, never the explicit subject of a joke, and never described in explicit or crude language. Suggestive and sensory is encouraged; a foot-specific joke or pun is not, ever — those are different things and this distinction matters. To be direct about what that actually means: say "feet", "legs", "tights", "heels" plainly when that's genuinely what the post is about — don't dance around the words with vague euphemisms. The rule above is specifically about turning them into a joke or pun, not about avoiding naming them. Mentioning them directly, including sensually, is exactly what this account is for.`;

// `recentPosts` is a short list of recent captions (already posted or
// queued) for this brand, used purely to stop the model repeating a hook,
// joke, question, or structure it's already used in roughly the last month.
//
// If the model ever runs over X's 280-char limit despite the length rules
// in VOICE_RULES, cut at the last whole word rather than slicing mid-string
// — a blind slice(0, 280) is exactly how a post ended mid-word ("...on a
// sho") and read as obviously broken rather than just a bit long.
function clampTweet(text) {
  if (text.length <= 280) return text;
  const cut = text.slice(0, 280);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
}

// Text-first, not photo-first: for "single"/"carousel" this writes the post
// AND a precise description of what each attached photo must show, in one
// call — the caller then generates a photo FROM that description (see
// imageGen.js), so a line like "slipped into the bath out of my tights"
// gets a photo that actually shows that, not a vaguely-matching stock shot.
export async function generateXPost(brand, { slot, pillar, format, recentPosts = [] }) {
  const needsPhotos = format === "single" || format === "carousel";

  const system = `You write one X (Twitter) post for a brand's account. Reply with JSON only: ${needsPhotos ? `{"text": "...", "scenes": ["...", ...]}` : `{"text": "..."}`}.
${VOICE_RULES}
${needsPhotos ? `\nYou are also directing the photo(s) that go with this post — they don't exist yet, you're describing exactly what to generate. For each photo, write one vivid, concrete scene description (setting, pose, specific action, props — enough detail that a photographer could shoot exactly this): a precise physical scene, not a mood or a vibe. The post's words and the scene(s) must describe the same real moment — if the text says something specific happened ("slipped into the bath out of my tights"), the scene has to show exactly that, tights included. Always fully clothed above the waist, nothing explicit, no visible face (consistent with this brand's existing photo direction).` : ""}`;

  const formatBrief =
    format === "text"
      ? "This post is text-only, no image. The words alone have to carry it."
      : format === "single"
      ? "This post gets one photo, generated to match. \"scenes\" is an array with exactly one entry. 3 to 25 words of post text — never a caption that just describes the photo, but it has to genuinely depict the same moment as the scene you describe, not a generic line."
      : "This post gets 2 to 4 photos, generated to match, in a short sequence that tells a tiny story or shows real progression (e.g. getting ready, then heels, then aircraft, then shoes off). \"scenes\" is an array with one entry per photo, in order. Write one short line of post text for the whole set, not per-photo captions.";

  const recentBlock = recentPosts.length
    ? `Recent posts from this account (do not repeat their hook, joke, question, topic angle, or sentence structure — the execution must be noticeably different even if the broad topic recurs):\n${recentPosts.map((p) => `- ${p}`).join("\n")}`
    : "No recent post history yet.";

  const user = `${brandContext(brand)}

Today's post job: ${slot.job}
Content pillar: ${pillar.label}. ${pillar.guidance}
${formatBrief}

${recentBlock}

Before answering, check every one of these — this has to be a 10/10, not a rough draft: Is it short — genuinely short, not just under some technical limit? Does it have 2-5 hashtags that actually fit this specific post (and only skip them if truly nothing does)? Is it flirty, suggestive and alluring, not flat or purely observational? Does it sound like a real person, not an automated account? Is it clearly different from the recent posts above? Is the language natural, not AI-coded, no em dashes, no jargon? Does it end on a statement rather than defaulting to a question? ${needsPhotos ? "Does each scene describe the exact same moment the text is about, specifically enough to actually shoot?" : ""} If this touches feet at all, is it handled through genuine lifestyle or fact framing, with zero wordplay or joking?

Write the post${needsPhotos ? " and its scene description(s)" : ""}.`;

  const out = await ask(system, user, 800);
  const text = clampTweet(String(out.text || "").trim());
  const scenes = needsPhotos ? (Array.isArray(out.scenes) ? out.scenes.map((s) => String(s || "").trim()).filter(Boolean) : []) : [];
  return { text, scenes };
}

// Hands off to the real branded carousel system (same one Instagram content
// uses) for a short, proper multi-slide post — capped at 4 slides to match
// X's own image-per-post limit. Reuses generatePackage as-is rather than
// forking its slide-writing logic; the X pillar only seeds the one-line idea
// it's built from, the slides themselves are written in the brand's own
// template voice (SLIDE_BRIEF), not the X voice rules above.
export async function generateBrandedCarouselIdea(brand, { pillar, recentPosts = [] }) {
  const system = `You write a one-line content idea for a short branded carousel post. Reply with JSON only: {"idea": "..."}.`;
  const recentBlock = recentPosts.length
    ? `Avoid repeating the topic or angle of these recent posts:\n${recentPosts.slice(0, 10).map((p) => `- ${p}`).join("\n")}`
    : "";
  const user = `${brandContext(brand)}
Content pillar: ${pillar.label}. ${pillar.guidance}
${recentBlock}
Write one specific, concrete content idea for a short carousel (3 content slides plus a closing slide) on this pillar.`;
  const out = await ask(system, user, 300);
  return String(out.idea || pillar.label).trim();
}

export { generatePackage };
