import Anthropic from "@anthropic-ai/sdk";
import { themeOf, characterText } from "./brandTemplate";

const MODEL = "claude-opus-5";

let client;
function anthropic() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

// House rules that apply to every brand. Brand voice/CTA rules layer on top.
const HOUSE_RULES = `
Formatting rules (non-negotiable):
- Hashtags: maximum 5 per platform, always inside the caption text on its last line, never a separate block.
- Never promote or mention other social media accounts or handles.
- No disclaimers of any kind.
- Write for a real person reading on a phone: short lines, no fluff, no filler intros like "In this post".
- Match the brand voice exactly. If the brand's voice or CTA rules specify a sign-off, end the captions with it.
- If the idea names a specific thing (a product, an object, a place, a method), say that thing by name, plainly, at least once — in the hook or the first two slides, and in the opening line of the caption. Mood and atmosphere are the style, not a substitute for saying what the post is actually about. A reader who only sees slide 1 and the caption's first line should know exactly what this is.
- Never use an em dash (—) anywhere, in slides or captions. Use a comma, a full stop, or two short sentences instead.
- Write like a real person typed it on their phone, not like an AI. Never use AI-coded words or phrases: elevate, unlock, unleash, delve, dive in, game-changer, seamless, leverage, utilize, robust, cutting-edge, tapestry, landscape, boundless, revolutionize, embark, navigate, furthermore, moreover, in today's world, in conclusion, it's important to note, whether you're... or..., not just X but Y. If a line reads like marketing copy or a LinkedIn post, rewrite it plainer.
`;

const PLATFORM_COPY = `
Platform copy (each is its own field):
- "caption": the Instagram caption. Hook line first, then the value, then the call to action, then up to 5 hashtags on the last line.
- "tt_caption": the TikTok caption. PG, never sensual or suggestive in the wording — TikTok is stricter and the account has already been warned. Write it like an everyday, wholesome caption about daily life (a moment, a routine, a small observation) that only reads as anything more to people already following for that reason — the hidden meaning is in what's implied, never in the words themselves. Under 150 characters before the hashtags, then exactly 5 hashtags on the last line.
- "tw_caption": the X (Twitter) caption. A single short, punchy post — under 200 characters including the hashtags, since the hard limit is 280. No thread, one post only. Hashtags inline at the end, not a separate block.
- "hashtags": the 5 hashtags used, with the # symbol.
- "yt_title": a YouTube Shorts title under 70 characters.
- "yt_description": the YouTube description — 2 to 4 short lines, then the hashtags on the last line.
- "yt_tags": 8 to 12 YouTube keywords, plain words/phrases, no #.
- "yt_pinned_comment": one short pinned comment in the brand's voice that nudges engagement.
- "yt_category": the best-fit YouTube category name (e.g. "Education", "People & Blogs", "Entertainment", "Howto & Style").`;

export function brandContext(brand) {
  return `Brand: ${brand.name}
Voice & tone: ${brand.voice || "(not set — use a clear, direct, human tone)"}
What the content should include (cover all of it across posts): ${brand.pillars || "(not set)"}
CTA rules: ${brand.cta_rules || "(not set — end with a light, natural call to action)"}`;
}

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model returned no JSON");
  return JSON.parse(text.slice(start, end + 1));
}

// `imageUrls`, when given, puts the actual photo(s) in front of the model
// before the text prompt, so it writes about what's really in the shot
// instead of guessing blind — see xContent.js for why this matters.
export async function ask(system, user, maxTokens = 8000, imageUrls = []) {
  const content = imageUrls.length
    ? [...imageUrls.map((url) => ({ type: "image", source: { type: "url", url } })), { type: "text", text: user }]
    : user;
  const res = await anthropic().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    output_config: { effort: "medium" },
    system,
    messages: [{ role: "user", content }],
  });
  if (res.stop_reason === "refusal") {
    throw new Error("The model declined to write this. Try a different idea or soften the brief.");
  }
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  return extractJson(text);
}

// Per-million-token prices (input, output) used to log what each visual
// pipeline call cost, so QA thresholds can be tuned against real spend.
const PRICE_PER_MTOK = { "claude-opus-5-5": [4, 20], "claude-opus-5": [5, 25], "claude-opus-4-8": [5, 25] };

export function claudeCostUsd(model, usage) {
  const [inP, outP] = PRICE_PER_MTOK[model] || PRICE_PER_MTOK["claude-opus-5-5"];
  const input = (usage?.input_tokens || 0) + (usage?.cache_creation_input_tokens || 0) + (usage?.cache_read_input_tokens || 0);
  return (input * inP + (usage?.output_tokens || 0) * outP) / 1e6;
}

// Same as ask(), but returns the usage and cost alongside the JSON and lets
// the caller pick the model. Used by the visual pipeline (visualPipeline.js).
// A safety decline on the requested model is retried server-side on a
// fallback model ("default" routing); if this SDK/API combination rejects
// that parameter, the call is repeated once without it.
export async function askDetailed(system, user, { maxTokens = 8000, imageUrls = [], model = "claude-opus-5-5", effort = "medium" } = {}) {
  const content = imageUrls.length
    ? [...imageUrls.map((url) => ({ type: "image", source: { type: "url", url } })), { type: "text", text: user }]
    : user;
  const body = { model, max_tokens: maxTokens, output_config: { effort }, system, messages: [{ role: "user", content }] };
  let res;
  try {
    res = await anthropic().messages.create({ ...body, fallbacks: "default" }, { headers: { "anthropic-beta": "server-side-fallback-2026-07-01" } });
  } catch (e) {
    if (e instanceof Anthropic.BadRequestError && /fallback/i.test(e.message || "")) res = await anthropic().messages.create(body);
    else throw e;
  }
  const usedModel = res.model || model;
  const cost = claudeCostUsd(usedModel, res.usage);
  if (res.stop_reason === "refusal") {
    const err = new Error("The model declined this request");
    err.refusal = true;
    err.costUsd = cost;
    throw err;
  }
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  return { json: extractJson(text), usage: res.usage, model: usedModel, costUsd: cost };
}

export async function suggestIdeas(brand, count = 10) {
  const system = `You generate short-form social content ideas. Reply with JSON only: {"ideas": ["...", ...]}.\n${HOUSE_RULES}`;
  const user = `${brandContext(brand)}

Give me ${count} distinct carousel ideas for this brand, each one line, drawn from what the content should include. Each idea should be specific enough to build a carousel from, and written in the brand's voice. Vary the angles: myths, mistakes, how-tos, hot takes, stories, lists, teases.`;
  const out = await ask(system, user, 3000);
  return (out.ideas || []).map((s) => String(s).trim()).filter(Boolean);
}

// ── Slide briefs per template ────────────────────────────────────────────
// Every template gets a CTA slide last: {"isCta": true, "line1": "...", "line3": "..."}
// line1 sits above the big keyword, line3 below it.

// Named, proven hook shapes — without these the model defaults to generic
// "bold claim" phrasing that doesn't actually stop a scroll. Pick whichever
// fits the idea; don't use the same one every time.
const HOOK_PATTERNS = `Hook patterns for slide 1 — pick whichever genuinely fits this idea, vary which one gets used across different posts:
- Curiosity gap: state an outcome without the mechanism ("This one swap fixed my 3pm crash") — the reader has to keep going to find out how.
- Contrarian claim: challenge something the reader currently believes is true or healthy ("Your 'healthy' breakfast is a sugar bomb").
- Credibility borrow: reference a real kind of expert, professional, or finding without inventing a fake specific study or name ("A cardiologist told me to stop doing this").
- Specific number: a precise, surprising number beats a vague one ("3 grams a day" beats "a little of this").
- Personal stakes: a real consequence, not just a tip ("This is what stopped my dad's blood pressure meds").
Never open with a question, a greeting, or "Did you know" — those are the generic default and they don't stop a scroll.`;

// The psychology every carousel follows, whatever the template. Slide 1 and
// slide 2 are both hooks — most scroll-away happens right after slide 1, so
// slide 2 has to earn the next swipe on its own, not just explain slide 1.
const CAROUSEL_PSYCHOLOGY = (n) => `Carousel psychology — follow this shape across the ${n} content slides, whatever their exact wording:
1. Slide 1, the hook: a pattern interrupt — a bold claim, a surprising number, or a curiosity gap the headline alone can't answer. No setup, no context. It has to stop a thumb mid-scroll in under a second.
${HOOK_PATTERNS}
2. Slide 2, the second hook: most people who stop on slide 1 still leave before slide 3 — this slide's only job is to earn the next swipe, not to explain slide 1. Open a second, sharper loop: a reason, a stake, a "here's the thing" turn, or a tease of what's coming. Never a recap of slide 1.
3. Slides 3 to ${n - 1}, the build: one idea per slide — a fact, a step, a moment, a detail — each one raising the stakes or specificity, each one leaving something unresolved the next slide answers.
4. Slide ${n}, the payoff: the single most concrete, most memorable line in the carousel — the one worth screenshotting. People remember the hook and the payoff most, so it has to land harder than anything before it.
Before finalizing, check your own work: would slide 1 alone stop a thumb mid-scroll in under a second, with zero context needed? Does slide 2 open a genuinely different loop rather than restate slide 1 in other words? If either is weak or generic, rewrite it before answering — don't ship the first draft if it reads like an AI's first guess.`;

const ctaBrief = (ctaType = "follow") => `The CTA slide: {"isCta": true, "line1": "...", "line3": "..."}. The slide already shows one big action word ("${ctaType.toUpperCase()}"), so keep it restrained:
- "line1": max 5 words, a calm lead-in above the action word (e.g. "Want more like this?").
- "line3": max 8 words, one reason or one detail below it. Only ever the one action (${ctaType}) — never list other actions like "like, share, save, comment".`;

const SLIDE_BRIEF = {
  elegant: (n) => `"slides": exactly ${n} content slides, then the CTA slide.
Each slide: {"kicker": "... 2-4 words, all caps eyebrow label that sets the scene", "headline": "... one short line, max 9 words, the actual line of the story", "detail": "one full sentence, up to about 20 words — the substance the reader stays for"}. Every slide sits on its own full-bleed photo with a soft vignette and an italic serif headline.
Voice: quiet, elegant, seductive, a slow reveal — like a short story, not a tutorial or a sales pitch. Write mood and sensation, not instructions. Unless the brand's voice explicitly asks for how-to steps, never use literal instructional phrasing.
${CAROUSEL_PSYCHOLOGY(n)}`,
  healthcode: (n) => `"slides": exactly ${n} content slides, then the CTA slide.
Each slide: {"kicker": "... 2-4 words, all caps eyebrow label naming the specific topic (e.g. FASTING WINDOW, PROTEIN TIMING, KNEE HEALTH)", "headline": "... one short line, max 9 words, the actual claim or fact", "detail": "one full sentence, up to about 20 words — the mechanism, the number, or the reason it's true"}. Every slide sits on its own full-bleed photo.
This is an informative, advice-style carousel, not a vibes-only tease: hook, hook, then the supporting information that actually delivers on what the hook promised. Pick ONE specific claim for the whole post, name it in slide 1's headline, and make every slide from 2 onward build on that exact same claim: why it's true, what actually matters instead, the concrete number, what to do about it. Never introduce a second, unrelated fact or number that doesn't connect back to slide 1's claim, and never contradict an earlier slide later in the same carousel — a reader should be able to follow one continuous argument from slide 1 to the payoff, not a string of disconnected facts that happen to share a broad topic.
Voice: direct, evidence-led, motivational without hype — a coach explaining the real reason behind something, not a wellness influencer. Concrete numbers and mechanisms beat vague encouragement. The topic can be anything in health/fitness/nutrition (fasting, keto, calorie comparisons, training, recovery) — treat each post as its own subject, don't force a single recurring theme across different posts.
${CAROUSEL_PSYCHOLOGY(n)}
Note: for this advice-style template, slide 2's "second hook" should still be about the exact same claim as slide 1, for example a sharper detail, a stat, or the mechanism behind it, not a new unrelated angle. Staying on one coherent argument matters more than novelty per slide.`,
};

function normalizeSlides(out, template, n) {
  const raw = Array.isArray(out.slides) ? out.slides : [];
  const content = raw.filter((s) => s && !s.isCta).slice(0, n).map((s) => {
    return { kicker: String(s.kicker || "").trim(), headline: String(s.headline || "").trim(), detail: String(s.detail || "").trim() };
  });
  const cta = raw.find((s) => s && s.isCta) || {};
  const clip = (t, words) => String(t || "").trim().split(/\s+/).filter(Boolean).slice(0, words).join(" ");
  content.push({ isCta: true, line1: clip(cta.line1, 6), line3: clip(cta.line3, 9) });
  return content;
}

function normalizeCopy(out) {
  const hashtags = (Array.isArray(out.hashtags) ? out.hashtags : [])
    .map((h) => String(h).trim()).filter(Boolean)
    .map((h) => (h.startsWith("#") ? h : "#" + h.replace(/^#+/, "")))
    .slice(0, 5);
  const withTags = (text) => {
    let t = String(text || "").trim();
    if (hashtags.length && !hashtags.every((h) => t.includes(h))) t = t.replace(/\n?(#[^\n]*)$/m, "").trim() + "\n\n" + hashtags.join(" ");
    return t;
  };
  // X's hard limit is 280 characters total, hashtags included — unlike the
  // other captions this one gets truncated to actually fit the platform.
  const tagStr = hashtags.join(" ");
  const withTagsClipped = (text, maxLen) => {
    const body = String(text || "").trim().replace(/\n?(#[^\n]*)$/m, "").trim();
    const suffix = tagStr ? " " + tagStr : "";
    const bodyMax = Math.max(0, maxLen - suffix.length);
    const clippedBody = body.length > bodyMax ? body.slice(0, Math.max(0, bodyMax - 1)).trim() + "…" : body;
    return (clippedBody + suffix).trim();
  };
  return {
    caption: withTags(out.caption),
    tt_caption: withTags(out.tt_caption || out.caption),
    tw_caption: withTagsClipped(out.tw_caption || out.caption, 280),
    yt_description: withTags(out.yt_description || out.caption),
    hashtags,
    yt_title: String(out.yt_title || "").trim().slice(0, 100),
    yt_tags: (Array.isArray(out.yt_tags) ? out.yt_tags : []).map((t) => String(t).replace(/^#/, "").trim()).filter(Boolean).slice(0, 15),
    yt_pinned_comment: String(out.yt_pinned_comment || "").trim(),
    yt_category: String(out.yt_category || "").trim(),
  };
}

export async function generatePackage(brand, { idea, pillar, slideCount = 7, template = "bold", ctaType = "follow" }) {
  const n = Math.max(2, slideCount - 1); // last slide is the CTA
  const brief = (SLIDE_BRIEF[template] || SLIDE_BRIEF.elegant)(n);
  const CTA_BRIEF = ctaBrief(ctaType);
  const system = `You write complete social content packages (carousel slides + per-platform captions) for a brand. Reply with JSON only: {"slides": [...], "caption": "...", "tt_caption": "...", "tw_caption": "...", "hashtags": [...], "yt_title": "...", "yt_description": "...", "yt_tags": [...], "yt_pinned_comment": "...", "yt_category": "..."}\n${HOUSE_RULES}`;
  const user = `${brandContext(brand)}
${pillar ? `Pillar for this piece: ${pillar}\n` : ""}
Idea: ${idea}

Produce:
1. ${brief}
${CTA_BRIEF}
2. ${PLATFORM_COPY}`;
  const out = await ask(system, user);
  return { slides: normalizeSlides(out, template, n), ...normalizeCopy(out) };
}

export async function regenerateSlides(brand, item, template = "bold", ctaType = "follow") {
  const existing = Array.isArray(item.slides) ? item.slides.filter((s) => !s.isCta) : [];
  const n = existing.length || 6;
  const brief = (SLIDE_BRIEF[template] || SLIDE_BRIEF.elegant)(n);
  const CTA_BRIEF = ctaBrief(ctaType);
  const system = `You write carousel slide copy for a brand. Reply with JSON only: {"slides": [...]}.\n${HOUSE_RULES}`;
  const user = `${brandContext(brand)}

Idea: ${item.idea}
${item.caption ? `The Instagram caption already written for this piece (keep the slides consistent with it):\n${item.caption}\n` : ""}
Write a fresh version, noticeably different from a generic first draft: sharper hook, tighter lines.
${brief}
${CTA_BRIEF}`;
  const out = await ask(system, user, 4000);
  const slides = normalizeSlides(out, template, n);
  // keep the photos already attached to each slide position
  return slides.map((s, i) => ({ ...s, image_media_id: existing[i]?.image_media_id || null, image_path: existing[i]?.image_path || null }));
}

export async function regenerateCopy(brand, item) {
  const system = `You write social captions and YouTube metadata for a brand. Reply with JSON only: {"caption": "...", "tt_caption": "...", "tw_caption": "...", "hashtags": [...], "yt_title": "...", "yt_description": "...", "yt_tags": [...], "yt_pinned_comment": "...", "yt_category": "..."}\n${HOUSE_RULES}`;
  const slidesText = (item.slides || []).filter((s) => !s.isCta).map((s, i) => `${i + 1}. ${s.rawText || [s.kicker, s.headline, s.subline, s.detail, s.bodyText || s.body, s.accentText].filter(Boolean).join(" — ")}`).join("\n");
  const user = `${brandContext(brand)}

Idea: ${item.idea}
The carousel slides for this piece:
${slidesText}

Write fresh platform copy.
${PLATFORM_COPY}`;
  const out = await ask(system, user, 4000);
  return normalizeCopy(out);
}

// A short, locked physical description of the one model used across a
// carousel's AI photos, so every slide shows a consistent person instead of
// drifting between different faces, builds or skin tones.
//
// This is brand-agnostic on purpose: whether a person appears at all, how
// much of them is shown, and any anatomy focus (feet, hands, face) all come
// from the brand's own ai_style direction, never assumed here. Every brand
// shares this codepath, so nothing brand-specific belongs in the system
// prompt itself — it goes in that brand's own ai_style field instead.
export async function lockModelDescription(brand) {
  // A brand with a fixed character (brandTemplate.js) always gets those
  // exact words, never a freshly written description.
  const fixed = characterText(brand);
  if (fixed) return fixed;
  // themeOf(brand), not brand.visual_theme directly — a brand's ai_style can
  // be hard-coded in brandTemplate.js (BRAND_AI_STYLE) rather than stored in
  // the database, and reading the raw column here meant that override was
  // silently invisible to this one function even though every other caller
  // of ai_style saw it correctly, which is exactly why "slim, blonde" wasn't
  // showing up: this is what actually fixes the model's hair/build/skin
  // tone for the series, and it was working from an empty direction.
  const aiStyle = themeOf(brand).ai_style;
  const system = `You write a short, consistent physical description of the one person who appears across a photo series, so every photo shows the same person instead of drifting between different faces, builds or skin tones. Reply with JSON only: {"model": "..."}.
Follow the brand's photo direction below for whether a person appears at all, and if so how much of them is shown (full figure, face included or not, hands only, feet only, etc). Describe only what that direction implies will actually be visible: hair, build, skin tone, and whichever specific features it calls for. 30-70 words. This gets reused word for word in every photo's prompt, so be concrete and repeatable, not vague.
If the brand's photo direction doesn't call for a person at all (e.g. it's food, product or environment photography), reply with an empty string for "model".`;
  const user = `${brandContext(brand)}
${aiStyle ? `Brand photo direction: ${aiStyle}\n` : "(No specific photo direction set for this brand — use good editorial judgement for the topic, and don't invent a recurring person unless the topic clearly calls for one.)\n"}
Write the one-person description for this photo series, or leave it empty if the direction doesn't call for a person.`;
  const out = await ask(system, user, 500);
  return String(out.model || "").trim();
}

// Shared rules for writing a Nano Banana Pro prompt. That model has no
// negative-prompt field: it reads every word as something to draw, and
// Google's own guidance is to describe only what you want. This pipeline
// used to append "Avoid: ... nudity, topless, nude, exposed breasts,
// nipples, lingerie, underwear, nsfw" to every prompt — for a sensual brand
// that both primed the model toward exactly those things and tripped its
// safety filter. So: positive description only, exclusions handled through
// framing and styling.
const PROMPT_RULES = (textZone, style) => {
  const candid = style === "candid";
  const look = candid
    ? `the light (real available light with natural shadows — daylight, aircraft cabin lights, a bedside lamp); the camera ("shot on an iPhone, slightly wide lens, everything in focus, casual phone snapshot"); real skin and fabric texture, true-to-life colour, a real background that stays secondary to the subject.
The look is an authentic candid phone photo of a real moment, the kind someone actually posts on Instagram — never a studio shoot, never glossy or retouched.`
    : `the light (warm, low and directional — golden hour through a window, a warm lamp, soft evening cabin lighting — with soft shadows that shape her legs); camera and lens (e.g. "shot on a Sony A7 IV, 85mm f/1.8, shallow depth of field, creamy background blur"); real skin and fabric texture, a rich warm colour grade.
The look is a luxury hosiery campaign: elegant, sensual through light, pose and styling, magazine quality, still natural. Never flat overhead light, never a plain stock-photo look.`;
  return `You write prompts for Nano Banana Pro, a photorealistic image model.
Write each prompt as one natural-language shot brief, 60-110 words. In this order: the framing first (what the camera sees and exactly where the edges of the frame fall); then the subject and exact pose inside that frame; the setting; ${look}
The prompt is purely visual. Never put the post's words, a caption, a quote, a question or any other lettering into it: this model renders quoted text straight into the image.
Word it like the brief for a luxury hosiery or shoe campaign: elegant and visual. The feeling comes from the light, the pose and the styling (warm low light, soft shadows shaping the legs, a slow graceful pose, the sheen of tights catching the light), described in concrete visual terms. Words like sexy, seductive, erotic, fetish or desire never go in the prompt; elegant, graceful, soft and intimate light are fine.
Describe only what IS in the photo, phrased positively. The model has no negative prompt and treats every word as something to include, so never write "no X", "without X", "avoid", or lists of things to exclude, and never mention nudity, explicit content, hidden faces, or anatomy mistakes — naming them puts them in the picture and can trip the model's safety filter.
Handle every exclusion through framing and styling instead: if the brand keeps the face out of shot, say where the top edge of the frame falls ("the top of the frame cuts across her hips") or that it's her own point of view looking down, and describe only the parts of the person that are inside that frame; if clothing matters, say exactly what she's wearing.
State the focal point plainly (e.g. "her feet in the foreground, sharp and central"). One main subject, one clear action — simple scenes come out anatomically cleaner than busy ones.
The photo shows literally what the text describes happening, within the brand's photo direction.${textZone ? `
Keep the ${textZone} of the frame calm and uncluttered (text gets overlaid there).` : ""}`;
};

// The fixed person (from brandTemplate.js's BRAND_CHARACTER) or a locked
// description passed in, plus the reasons recent photos were rejected in
// the X tab — both go to Claude as it writes the prompt, never straight to
// the image model, so they get turned into positive framing and styling.
function personBlock(character) {
  return character ? `This exact person appears in every photo, always the same: ${character}. Use these exact words for whichever of these features are inside the frame, and leave out the ones that aren't (in a legs-and-feet shot, her legs, skin and feet, not her hair).\n` : "";
}

export function feedbackBlock(feedback) {
  return feedback?.length
    ? `Recent photos and posts for this brand were rejected for these reasons. Get every one of them right this time:\n${feedback.map((f) => `- ${f}`).join("\n")}\n`
    : "";
}

// One per slide, in order, so a carousel's photos don't all come out as the
// same composition — each slide's prompt is written on its own, and without
// this every slide of a story about one moment got the identical shot.
export const SHOT_VARIETY = [
  "a pulled-back shot of her legs and lower body in the setting, the place clearly readable",
  "a tight close-up on her feet and ankles, the detail of this exact moment",
  "her own point of view looking down at her legs and feet",
  "a low angle at floor level from the side, her feet sharp in the foreground and the setting softly blurred behind",
  "a detail shot of one foot and the shoe or tights: a heel half off, the sheen of the tights, her fingers at her ankle",
  "shot from directly behind, the back of her blonde hair, her back and her legs",
];

// Turns a slide's text + brand into a photographer's brief for the image model.
// `direction` is the brand's own photo direction (subject, look, what to avoid)
// and is the source of truth for what this brand's photos look like — this
// function stays brand-agnostic and never assumes a subject (person, body
// part, mood) that isn't in that direction.
// `modelNote` is a locked description (from lockModelDescription) reused across
// every photo in the same carousel so the same person appears in every shot.
export async function imagePrompt(brand, { slideText, idea, style, direction, textZone = "bottom", modelNote, feedback = [], shot }) {
  const system = `${PROMPT_RULES(textZone, style)}
Reply with JSON only: {"prompt": "..."}.`;
  const user = `${brandContext(brand)}
${personBlock(characterText(brand) || modelNote)}${feedbackBlock(feedback)}${direction ? `Brand photo direction (translate into positive framing/styling choices): ${direction}\n` : "(No specific photo direction set for this brand — use good editorial judgement for the topic.)\n"}Post idea: ${idea || "(none)"}
Depict this exact moment: ${slideText || "(cover)"}
${shot ? `Shot type for this photo (other photos in the set use different ones, so follow this): ${shot}\n` : ""}
Write the image prompt.`;
  const out = await ask(system, user, 1000);
  return { prompt: String(out.prompt || "").trim(), negative: "" };
}

// Same job as lockModelDescription() + imagePrompt() combined, for a whole
// multi-photo set in one call instead of one call per photo plus a separate
// model-locking call up front. A 4-photo X post was previously 1 call to
// lock the model, then 4 more (one per photo) — 5 sequential-ish Claude
// round-trips feeding into a slot that only has ~50s total to finish writing
// the post, locking the model, generating every prompt, and generating every
// image. This cuts that to exactly 1 call, same consistency guarantee (one
// model description, reused word for word in every prompt), while the N
// actual image generations afterward still run fully in parallel.
export async function imagePromptsBatch(brand, { texts, idea, style, direction, textZone = "bottom", feedback = [] }) {
  const character = characterText(brand);
  const system = `${PROMPT_RULES(textZone, style)}
You're writing one prompt per scene given, as a matched set showing the same one consistent person (if the brand's direction calls for a person at all). Give every photo in the set a different shot (framing, distance and angle), so no two look alike. ${character ? `That person is fixed (described below), so "model" is just an empty string.` : `First, "model": a 30-70 word physical description of that person (hair, build, skin tone — only what will actually be visible), restated in every prompt so each photo shows the same person; empty string if no person appears.`}
Reply with JSON only: {"model": "...", "prompts": [{"prompt": "..."}, ...]} — exactly one entry per scene, same order.`;
  const user = `${brandContext(brand)}
${personBlock(character)}${feedbackBlock(feedback)}${direction ? `Brand photo direction (translate into positive framing/styling choices): ${direction}\n` : "(No specific photo direction set for this brand — use good editorial judgement for the topic.)\n"}Post idea: ${idea || "(none)"}

Scenes — one photo per entry, in order, depict exactly what each one describes:
${texts.map((t, i) => `${i + 1}. ${t || "(cover)"}`).join("\n")}

Write "model" once, then one prompt per scene, ${texts.length} entries total, same order.`;
  const out = await ask(system, user, 600 * texts.length + 500);
  const modelNote = character || String(out.model || "").trim();
  const prompts = Array.isArray(out.prompts) ? out.prompts : [];
  return {
    modelNote,
    photos: texts.map((_, i) => ({ prompt: String(prompts[i]?.prompt || "").trim(), negative: "" })),
  };
}
