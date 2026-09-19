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

const SLIDE_BRIEF = {
  bold: (n) => `"slides": exactly ${n} content slides, then the CTA slide.
Each content slide: {"headline": "...", "body": "..."}. Slide 1 is the hook: a headline only (body empty) that stops the scroll. Slides 2-${n} each carry one idea: a headline under 9 words plus one or two tight sentences (under 40 words).
Carousel structure: hook → the problem or a curiosity gap → value beats, one per slide → a payoff or "save this" beat.`,
  raw: (n) => `"slides": exactly ${n} content slides, then the CTA slide.
Each content slide: {"rawText": "..."}. This template shows the brand's own photo full-bleed with the text in a small box, so words are minimal:
- Slide 1 is the scroll-stopper: 3 to 7 words, teasing, no explanation.
- Slides 2-${n}: one or two short lines each (max 12 words total). Use a line break ("\\n") between the two lines. Build tension or delight slide by slide — a tease, a detail, a mood, a payoff.
- Never describe the photo. Speak to the viewer.`,
  "dark-fade": (n) => `"slides": exactly ${n} content slides, then the CTA slide.
Each slide: {"headline": "... max 7 words", "subline": "... max 12 words"}. Every slide sits on its own full-bleed photo with the text at the bottom, so headlines are short, bold statements.
- Slide 1 is the hook: the headline stops the scroll, the subline opens a curiosity gap.
- Slides 2-${n}: one idea each — a fact, a moment, a feeling, a tease — headline as the statement, subline as the detail or payoff.
Carousel structure: hook → build → reveal → the takeaway.`,
  "clean-pro": (n) => `"slides": exactly ${n} content slides, then the CTA slide.
Slide 1 is the cover: {"headline": "... max 10 words", "subline": "... max 12 words"} — the attention-grabbing hook, the subline opens a curiosity gap.
Slides 2-${n}: {"headline": "... max 8 words", "bodyText": "... max 25 words, the fact or insight", "accentText": "... max 10 words, the punchline"}.
Carousel structure: hook → the surprising fact → why it matters → more facts, one per slide → the takeaway.`,
};

const ctaBrief = (ctaType = "follow") => `The CTA slide: {"isCta": true, "line1": "...", "line3": "..."}. The slide already shows one big action word ("${ctaType.toUpperCase()}"), so keep it restrained:
- "line1": max 5 words, a calm lead-in above the action word (e.g. "Want more like this?").
- "line3": max 8 words, one reason or one detail below it. Only ever the one action (${ctaType}) — never list other actions like "like, share, save, comment".`;

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

// Turns a slide's text + brand into a photographer's brief for the image model.
// `direction` is the brand's own photo direction (subject, look, what to avoid).
export async function imagePrompt(brand, { slideText, idea, style, direction, textZone = "bottom" }) {
  const system = `You write prompts for a photorealistic image generator. Reply with JSON only: {"prompt": "...", "negative": "..."}.
Write the prompt as a real photographer's shot brief for a natural, believable photograph — not a render. Include, in this order: the single subject and its exact pose/framing; the setting; the light (soft window light, golden hour, overcast daylight — never studio-perfect); camera and lens (e.g. "shot on a Sony A7 IV, 50mm f/2, shallow depth of field"); natural skin texture and true-to-life colour; a calm, uncluttered composition with one subject only. 70-120 words. Never include text, logos, watermarks, captions or hands holding signs. Keep it tasteful and non-explicit.
Anatomy is the priority: if feet or hands appear, say "one pair of feet, exactly five toes on each foot, natural toe lengths, real skin creases and slight asymmetry, correct arches, heels and ankles in proportion". Prefer simple angles that models get right (soles-up from the front, side profile with arched foot, top-down on a sheet, feet crossed at the ankles) over twisted or overlapping poses. One pair of feet only, never several people.
Leave the ${textZone} quarter of the frame quiet (plain sheet, floor, sky) because text will sit there.
Match the photo to the slide's text so it belongs on that slide.`;
  const user = `${brandContext(brand)}
${direction ? `Brand photo direction (always follow this): ${direction}\n` : ""}Post idea: ${idea || "(none)"}
This slide's text: ${slideText || "(cover)"}
Look: ${style === "candid" ? "candid, natural, phone-camera realism" : "polished editorial, magazine quality, still natural"}

Write the image prompt for this slide.`;
  const out = await ask(system, user, 1500);
  return { prompt: String(out.prompt || "").trim(), negative: String(out.negative || "").trim() };
}
