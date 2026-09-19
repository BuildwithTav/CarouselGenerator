import Anthropic from "@anthropic-ai/sdk";

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
- "tt_caption": the TikTok caption. Shorter and punchier than Instagram (under 150 characters before the hashtags), then exactly 5 hashtags on the last line.
- "hashtags": the 5 hashtags used, with the # symbol.
- "yt_title": a YouTube Shorts title under 70 characters.
- "yt_description": the YouTube description — 2 to 4 short lines, then the hashtags on the last line.
- "yt_tags": 8 to 12 YouTube keywords, plain words/phrases, no #.
- "yt_pinned_comment": one short pinned comment in the brand's voice that nudges engagement.
- "yt_category": the best-fit YouTube category name (e.g. "Education", "People & Blogs", "Entertainment", "Howto & Style").`;

function brandContext(brand) {
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

async function ask(system, user, maxTokens = 8000) {
  const res = await anthropic().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    output_config: { effort: "medium" },
    system,
    messages: [{ role: "user", content: user }],
  });
  if (res.stop_reason === "refusal") {
    throw new Error("The model declined to write this. Try a different idea or soften the brief.");
  }
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  return extractJson(text);
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

// The psychology every carousel follows, whatever the template. Slide 1 and
// slide 2 are both hooks — most scroll-away happens right after slide 1, so
// slide 2 has to earn the next swipe on its own, not just explain slide 1.
const CAROUSEL_PSYCHOLOGY = (n) => `Carousel psychology — follow this shape across the ${n} content slides, whatever their exact wording:
1. Slide 1, the hook: a pattern interrupt — a bold claim, a surprising number, or a curiosity gap the headline alone can't answer. No setup, no context. It has to stop a thumb mid-scroll in under a second.
2. Slide 2, the second hook: most people who stop on slide 1 still leave before slide 3 — this slide's only job is to earn the next swipe, not to explain slide 1. Open a second, sharper loop: a reason, a stake, a "here's the thing" turn, or a tease of what's coming. Never a recap of slide 1.
3. Slides 3 to ${n - 1}, the build: one idea per slide — a fact, a step, a moment, a detail — each one raising the stakes or specificity, each one leaving something unresolved the next slide answers.
4. Slide ${n}, the payoff: the single most concrete, most memorable line in the carousel — the one worth screenshotting. People remember the hook and the payoff most, so it has to land harder than anything before it.`;

const ctaBrief = (ctaType = "follow") => `The CTA slide: {"isCta": true, "line1": "...", "line3": "..."}. The slide already shows one big action word ("${ctaType.toUpperCase()}"), so keep it restrained:
- "line1": max 5 words, a calm lead-in above the action word (e.g. "Want more like this?").
- "line3": max 8 words, one reason or one detail below it. Only ever the one action (${ctaType}) — never list other actions like "like, share, save, comment".`;

const SLIDE_BRIEF = {
  bold: (n) => `"slides": exactly ${n} content slides, then the CTA slide.
Each content slide: {"headline": "...", "body": "..."}. Slide 1: headline only (body empty), the hook. Slides 2-${n}: a headline under 9 words plus one or two tight sentences (under 40 words).
${CAROUSEL_PSYCHOLOGY(n)}`,
  raw: (n) => `"slides": exactly ${n} content slides, then the CTA slide.
Each content slide: {"rawText": "..."}. This template shows the brand's own photo full-bleed with the text in a small box, so words are minimal:
- Slide 1: 3 to 7 words, no explanation.
- Slides 2-${n}: one or two short lines each (max 12 words total). Use a line break ("\n") between the two lines.
- Never describe the photo. Speak to the viewer. Write mood and sensation, not instructions — this is a tease, not a tutorial. Unless the brand's voice explicitly asks for how-to steps, avoid literal instructional phrasing ("soak, buff, dry") in favour of what it feels like, sounds like, looks like.
${CAROUSEL_PSYCHOLOGY(n)}`,
  "dark-fade": (n) => `"slides": exactly ${n} content slides, then the CTA slide.
Each slide: {"headline": "... max 7 words, short and bold", "subline": "one full sentence, up to about 22 words — give the reader something real: a detail, a feeling, a reason to keep going, not just a caption under a photo"}. Every slide sits on its own full-bleed photo with the text at the bottom.
Write mood and sensation, not instructions — this is a tease, not a tutorial. Unless the brand's voice explicitly asks for how-to steps, avoid literal instructional phrasing ("soak, buff, dry", "warm it in hands") in favour of what it feels like, sounds like, looks like — a slow reveal, not a recipe. The subline is where the actual substance of the slide lives — make it worth reading, not decoration under the headline.
${CAROUSEL_PSYCHOLOGY(n)}`,
  "clean-pro": (n) => `"slides": exactly ${n} content slides, then the CTA slide.
Slide 1 is the cover: {"headline": "... max 10 words, short and bold", "subline": "one full sentence, up to about 22 words — real substance, not decoration"}.
Slides 2-${n}: {"headline": "... max 8 words", "bodyText": "... max 25 words, the fact or insight", "accentText": "... max 10 words, the punchline"}.
${CAROUSEL_PSYCHOLOGY(n)}`,
};

function normalizeSlides(out, template, n) {
  const raw = Array.isArray(out.slides) ? out.slides : [];
  const content = raw.filter((s) => s && !s.isCta).slice(0, n).map((s) => {
    if (template === "raw") return { rawText: String(s.rawText || s.headline || "").trim() };
    if (template === "dark-fade") return { headline: String(s.headline || "").trim(), subline: String(s.subline || s.body || s.bodyText || "").trim() };
    if (template === "clean-pro") return { headline: String(s.headline || "").trim(), subline: String(s.subline || "").trim(), bodyText: String(s.bodyText || s.body || "").trim(), accentText: String(s.accentText || "").trim() };
    return { headline: String(s.headline || "").trim(), body: String(s.body || s.bodyText || "").trim() };
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
  return {
    caption: withTags(out.caption),
    tt_caption: withTags(out.tt_caption || out.caption),
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
  const brief = (SLIDE_BRIEF[template] || SLIDE_BRIEF.bold)(n);
  const CTA_BRIEF = ctaBrief(ctaType);
  const system = `You write complete social content packages (carousel slides + per-platform captions) for a brand. Reply with JSON only: {"slides": [...], "caption": "...", "tt_caption": "...", "hashtags": [...], "yt_title": "...", "yt_description": "...", "yt_tags": [...], "yt_pinned_comment": "...", "yt_category": "..."}\n${HOUSE_RULES}`;
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
  const brief = (SLIDE_BRIEF[template] || SLIDE_BRIEF.bold)(n);
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
  const system = `You write social captions and YouTube metadata for a brand. Reply with JSON only: {"caption": "...", "tt_caption": "...", "hashtags": [...], "yt_title": "...", "yt_description": "...", "yt_tags": [...], "yt_pinned_comment": "...", "yt_category": "..."}\n${HOUSE_RULES}`;
  const slidesText = (item.slides || []).filter((s) => !s.isCta).map((s, i) => `${i + 1}. ${s.rawText || [s.headline, s.subline, s.bodyText || s.body, s.accentText].filter(Boolean).join(" — ")}`).join("\n");
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
// drifting between different feet, skin tones or hands.
export async function lockModelDescription(brand) {
  const system = `You write a short, consistent model description for a photo series. Reply with JSON only: {"model": "..."}.
Describe one specific woman in 30-60 words: skin tone, foot shape and size impression, nail colour and finish, and — since hands may appear touching or massaging the feet in some shots — her hands too: slender, feminine, manicured, no rings or tattoos unless told otherwise. This description gets reused, word for word, in the prompt for every photo in the series, so be concrete and repeatable, not vague.`;
  const user = `${brandContext(brand)}
${brand?.visual_theme?.ai_style ? `Brand photo direction (make this description consistent with it): ${brand.visual_theme.ai_style}\n` : ""}
Write the one-model description for this photo series.`;
  const out = await ask(system, user, 500);
  return String(out.model || "").trim();
}

// Turns a slide's text + brand into a photographer's brief for the image model.
// `direction` is the brand's own photo direction (subject, look, what to avoid).
// `modelNote` is a locked description (from lockModelDescription) reused across
// every photo in the same carousel so the same person appears in every shot.
export async function imagePrompt(brand, { slideText, idea, style, direction, textZone = "bottom", modelNote }) {
  const system = `You write prompts for a photorealistic image generator. Reply with JSON only: {"prompt": "...", "negative": "..."}.
Write the prompt as a real photographer's shot brief for a natural, believable photograph — not a render. Include, in this order: the single subject and its exact pose/framing; the setting; the light (soft, warm, intimate — low window light, candlelight, a single warm lamp, golden hour — never flat or studio-bright); camera and lens (e.g. "shot on a Sony A7 IV, 50mm f/1.8, shallow depth of field"); natural skin texture and true-to-life colour; a calm, uncluttered composition with one subject only. 70-120 words. Never include text, logos, watermarks, captions or hands holding signs.
The mood is sensual and alluring: soft shadows, a slow, intimate feel, confident and inviting posing — think boudoir-style editorial photography, not a clinical product shot. Tasteful, not explicit: bare feet and legs, nothing beyond that.
This brand posts several times a day, so both the setting AND the framing must vary — never default to the same tight close-up in the same bedroom every time. Read what the slide is actually about and place it somewhere that fits: getting ready in front of a mirror, a bath or poolside, curled up on a sofa, fresh out of heels after a night out, bare feet on cool tile or warm sand, a pedicure chair, a car seat, silk sheets, a balcony at dusk — whatever the content calls for. Vary props, light and location; keep only the mood and the anatomy rules constant.
Vary the shot distance too, across the set of photos this brand posts: some tight macro close-ups on the feet alone, but plenty pulled back further — the legs, the whole lower body, or the person seated or standing in the scene with the feet just part of a bigger, still-sensual picture. Don't make every single photo a foot-only crop; let the distance match the moment.
The photo must show literally what the slide's text describes happening — if it names an action (pouring, a drop landing, oil spreading, a thumb pressing in), that exact action is the subject of the shot, not just a mood that evokes it.
Anatomy is the priority whenever the feet are close enough to show detail: exactly five toes on each foot, natural toe lengths, real skin creases and slight asymmetry, correct arches, heels and ankles in proportion. Prefer simple angles that models get right (soles-up from the front, side profile with arched foot, top-down on a sheet, feet crossed at the ankles) over twisted or overlapping poses. One person in frame only, never several.
If a hand appears in the frame — applying, pouring, massaging, holding, pressing — it is always a woman's hand: slender fingers, feminine manicured nails, smooth skin, no masculine knuckles, wrist or forearm hair. Never a man's hand, arm or any other person in the shot.
Framing is critical: the whole subject — every toe, the arch, the heel — must sit inside the TOP HALF of the frame. The bottom half is where a dark gradient and headline text get overlaid afterwards, so anything placed there gets visually covered or lost. Compose the shot high in the frame, with open, quiet space (plain sheet, floor, sky — nothing important) filling the bottom half.
The "negative" field always includes, word for word: "extra toes, missing toes, six toes, fused toes, extra fingers, missing fingers, deformed feet, deformed hands, mutated anatomy, malformed limbs, extra limbs, blurry, distorted proportions, watermark, text, logo" — plus anything else specific to this shot worth excluding.`;
  const user = `${brandContext(brand)}
${modelNote ? `This exact woman appears in every photo of this series — keep her consistent: ${modelNote}\n` : ""}${direction ? `Brand photo direction (always follow this): ${direction}\n` : ""}Post idea: ${idea || "(none)"}
This slide's text — depict this exact moment: ${slideText || "(cover)"}
Look: ${style === "candid" ? "candid, natural, phone-camera realism" : "polished editorial, magazine quality, still natural"}

Write the image prompt for this slide.`;
  const out = await ask(system, user, 1500);
  return { prompt: String(out.prompt || "").trim(), negative: String(out.negative || "").trim() };
}
