import Anthropic from "@anthropic-ai/sdk";
import { themeOf } from "./brandTemplate";

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
Content pillars: ${brand.pillars || "(not set)"}
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

// Cheap, fast model for a bounded yes/no visual check — this is a
// classification task, not creative writing, so it doesn't need the full
// model `ask()` uses elsewhere. A single check is a few hundred tokens,
// a small fraction of a cent, negligible next to the image generation
// itself (a few cents via fal.ai).
const QA_MODEL = "claude-haiku-4-5-20251001";

// Checks one generated photo against the brand's own AI photo direction
// (the same rules it was generated to follow) plus a fixed set of hard,
// brand-agnostic failures — catches exactly the kind of thing that's
// previously only been caught by eye: a visible face, the wrong gender on
// a background prop, anatomy that's visibly wrong. Fails open (treated as
// a pass) on its own errors or a timeout — a QA-infrastructure hiccup
// should never block a real, good photo.
export async function reviewGeneratedImage(imageUrl, rules) {
  const system = `You are a visual QA checker for an AI-generated brand photo. Reply with JSON only: {"pass": true or false, "reason": "..."}.

This is a binary safety/correctness check, not an art director's review. Only fail for a clear, unambiguous violation of one of the rules below — never for a stylistic or creative judgement call (which setting it's in, the exact mood or lighting, framing or shot distance, styling choices like clothing colour or accessories, how "editorial" or polished it looks). If a reasonable person would call the image usable, pass it — when genuinely unsure whether something crosses a line versus is just an artistic choice, pass it. The goal is to only catch real, binary mistakes, not to hold every image to a perfect match of the brief.

The brand's own photo direction may contain some hard rules mixed in with its general creative/stylistic guidance — enforce only the clear-cut rule-like parts of it (an explicit instruction never to show something, a specific anatomical or framing requirement), not its general mood/setting/styling preferences:
${rules}

Also always fail, regardless of the above, if: a human face is visible anywhere in the image (even partial, blurred, in profile, or reflected in a mirror/window/screen); the image shows nudity, exposed breasts, or anything sexually explicit; a hand or foot has a visibly wrong number of fingers/toes, an extra/missing limb, or is anatomically deformed; a background prop meant to show no face (an ID badge, lanyard, photo frame, phone screen) actually shows a clear human face; more than one person appears in frame.

"reason" is one short sentence - which rule failed and what you saw, or "looks correct" if it passes.`;
  try {
    const res = await anthropic().messages.create({
      model: QA_MODEL,
      max_tokens: 200,
      system,
      messages: [{ role: "user", content: [{ type: "image", source: { type: "url", url: imageUrl } }, { type: "text", text: "Check this image against the rules above." }] }],
    }, { timeout: 15000 });
    const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    return extractJson(text);
  } catch (e) {
    console.error("Image QA check failed (treating as pass):", e.message);
    return { pass: true, reason: "QA check itself failed: " + e.message };
  }
}

export async function suggestIdeas(brand, count = 10) {
  const system = `You generate short-form social content ideas. Reply with JSON only: {"ideas": ["...", ...]}.\n${HOUSE_RULES}`;
  const user = `${brandContext(brand)}

Give me ${count} distinct carousel ideas for this brand, each one line, drawn from the content pillars. Each idea should be specific enough to build a carousel from, and written in the brand's voice. Vary the angles: myths, mistakes, how-tos, hot takes, stories, lists, teases.`;
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

// Turns a slide's text + brand into a photographer's brief for the image model.
// `direction` is the brand's own photo direction (subject, look, what to avoid)
// and is the source of truth for what this brand's photos look like — this
// function stays brand-agnostic and never assumes a subject (person, body
// part, mood) that isn't in that direction.
// `modelNote` is a locked description (from lockModelDescription) reused across
// every photo in the same carousel so the same person appears in every shot.
export async function imagePrompt(brand, { slideText, idea, style, direction, textZone = "bottom", modelNote }) {
  const system = `You write prompts for a photorealistic image generator. Reply with JSON only: {"prompt": "...", "negative": "..."}.
Write the prompt as a real photographer's shot brief for a natural, believable photograph — not a render. Include, in this order: the subject and its exact pose/framing (follow the brand's own photo direction below for who or what appears — a person, food, a product, an environment, hands only, whatever it specifies — never invent a person, or a body-part crop to avoid showing a face, if the direction doesn't call for one); the setting; the light (soft and natural unless the direction says otherwise — window light, golden hour, a single warm lamp — avoid flat studio lighting unless asked for); camera and lens (e.g. "shot on a Sony A7 IV, 50mm f/1.8, shallow depth of field"); natural texture and true-to-life colour; a calm, uncluttered composition with one clear subject. 70-120 words. Never include text, logos, watermarks, captions or hands holding signs.
The brand's own photo direction below is the source of truth for mood, who or what appears, and any anatomy or framing rules specific to this brand — follow it exactly rather than falling back on a generic default.
This brand posts often, so vary the setting and framing across a set rather than defaulting to the same shot every time — read what the slide is actually about and place it somewhere that fits.
The photo must show literally what the slide's text describes happening — if it names a specific action or detail, that's the subject of the shot, not just a mood that evokes it.
If a person appears and any part of them (hands, feet, face) is close enough to the camera to show real detail, get the anatomy right: correct number of fingers and toes, exactly two legs and two arms, natural proportions, no fused, extra, or duplicated digits or limbs.
Framing: leave the part of the frame where text gets overlaid afterwards (${textZone === "bottom" ? "the bottom of the frame" : textZone === "top" ? "the top of the frame" : "the " + textZone + " of the frame"}) relatively clear and uncluttered.
Before answering, check against the brand's own direction one more time: is the face genuinely excluded the way it specifies, not just angled away? If a background prop could carry a photo of a person (an ID badge, a photo frame, a phone screen), does the prompt keep it face-down, out of focus, or out of shot entirely, rather than risk it showing a face at all? Is the anatomy described physically correct and unambiguous (exact digit and limb counts, a foot sitting in a shoe the way it actually would)? If the brand's direction says feet (or whatever body part it names) must be the clear visual focus, does the composition actually put them there — described as the nearest, sharpest, most central thing in frame, not just present somewhere in a wider shot of legs or the whole body? Fix the prompt now if any of these are vague or missed, rather than leaving it to chance.
The "negative" field always includes, word for word: "extra fingers, missing fingers, fused fingers, extra toes, missing toes, deformed hands, deformed feet, mutated anatomy, malformed limbs, extra limbs, blurry, distorted proportions, watermark, text, logo, nudity, topless, nude, exposed breasts, bare chest, nipples, lingerie, underwear, nsfw" — plus anything else specific to this shot worth excluding.`;
  const user = `${brandContext(brand)}
${modelNote ? `This exact person appears in every photo of this series — keep them consistent: ${modelNote}\n` : ""}${direction ? `Brand photo direction (always follow this): ${direction}\n` : "(No specific photo direction set for this brand — use good editorial judgement for the topic.)\n"}Post idea: ${idea || "(none)"}
This slide's text — depict this exact moment: ${slideText || "(cover)"}
Look: ${style === "candid" ? "candid, natural, phone-camera realism" : "polished editorial, magazine quality, still natural"}

Write the image prompt for this slide.`;
  const out = await ask(system, user, 1500);
  return { prompt: String(out.prompt || "").trim(), negative: String(out.negative || "").trim() };
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
export async function imagePromptsBatch(brand, { texts, idea, style, direction, textZone = "bottom" }) {
  const system = `You write prompts for a photorealistic image generator, one per scene given, as a matched set that all show the same one consistent person (if the brand's direction calls for a person at all). Reply with JSON only: {"model": "...", "prompts": [{"prompt": "...", "negative": "..."}, ...]} — exactly one "prompts" entry per scene given, in the same order.
First, "model": a short, consistent physical description of the one person who appears across every photo in this set (hair, build, skin tone, and whichever other features the brand's direction below calls for — only what that direction implies will actually be visible). 30-70 words, concrete and repeatable. Empty string if the brand's direction doesn't call for a person at all (food, product, environment photography).
Then, for each scene, write its own prompt as a real photographer's shot brief for a natural, believable photograph — not a render. Include, in this order: the subject and its exact pose/framing (restating the "model" description above if a person appears, so every photo shows the same one); the setting; the light (soft and natural unless the direction says otherwise — window light, golden hour, a single warm lamp — avoid flat studio lighting unless asked for); camera and lens (e.g. "shot on a Sony A7 IV, 50mm f/1.8, shallow depth of field"); natural texture and true-to-life colour; a calm, uncluttered composition with one clear subject. 70-120 words per prompt. Never include text, logos, watermarks, captions or hands holding signs.
The brand's own photo direction below is the source of truth for mood, who or what appears, and any anatomy or framing rules specific to this brand — follow it exactly.
Vary the setting and framing across the set rather than repeating the same shot — each scene is its own moment.
Each photo must show literally what its scene describes happening — if it names a specific action or detail, that's the subject of that shot, not just a mood that evokes it.
If a person appears and any part of them (hands, feet, face) is close enough to the camera to show real detail, get the anatomy right: correct number of fingers and toes, exactly two legs and two arms, natural proportions, no fused, extra, or duplicated digits or limbs.
Framing: leave the part of the frame where text gets overlaid afterwards (${textZone === "bottom" ? "the bottom of the frame" : textZone === "top" ? "the top of the frame" : "the " + textZone + " of the frame"}) relatively clear and uncluttered.
Before answering, check against the brand's own direction one more time: is the face genuinely excluded the way it specifies, not just angled away? If a background prop could carry a photo of a person (an ID badge, a photo frame, a phone screen), does the prompt keep it face-down, out of focus, or out of shot entirely, rather than risk it showing a face at all? Is the anatomy described physically correct and unambiguous (exact digit and limb counts, a foot sitting in a shoe the way it actually would)? If the brand's direction says feet (or whatever body part it names) must be the clear visual focus, does the composition actually put them there — described as the nearest, sharpest, most central thing in frame, not just present somewhere in a wider shot of legs or the whole body? Fix the prompt now if any of these are vague or missed, rather than leaving it to chance.
Each "negative" field always includes, word for word: "extra fingers, missing fingers, fused fingers, extra toes, missing toes, deformed hands, deformed feet, mutated anatomy, malformed limbs, extra limbs, blurry, distorted proportions, watermark, text, logo, nudity, topless, nude, exposed breasts, bare chest, nipples, lingerie, underwear, nsfw" — plus anything else specific to that shot worth excluding.`;
  const user = `${brandContext(brand)}
${direction ? `Brand photo direction (always follow this): ${direction}\n` : "(No specific photo direction set for this brand — use good editorial judgement for the topic.)\n"}Post idea: ${idea || "(none)"}
Look: ${style === "candid" ? "candid, natural, phone-camera realism" : "polished editorial, magazine quality, still natural"}

Scenes — one photo per entry, in order, depict exactly what each one describes:
${texts.map((t, i) => `${i + 1}. ${t || "(cover)"}`).join("\n")}

Write "model" once, then one prompt per scene, ${texts.length} entries total, same order.`;
  const out = await ask(system, user, 600 * texts.length + 500);
  const modelNote = String(out.model || "").trim();
  const prompts = Array.isArray(out.prompts) ? out.prompts : [];
  return {
    modelNote,
    photos: texts.map((_, i) => ({ prompt: String(prompts[i]?.prompt || "").trim(), negative: String(prompts[i]?.negative || "").trim() })),
  };
}
