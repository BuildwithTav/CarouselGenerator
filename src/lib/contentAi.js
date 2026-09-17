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
- Hashtags: maximum 5, always inside the caption at the end, never a separate block.
- Never promote or mention other social media accounts or handles in the caption.
- No disclaimers of any kind in captions.
- Write for a real person reading on a phone: short lines, no fluff, no filler intros like "In this post".
- Match the brand voice exactly. If the brand's voice or CTA rules specify a sign-off, end the caption with it.
- Slides: the first slide is the hook (a headline only, must stop the scroll). Middle slides each carry one idea: a short headline plus one or two tight sentences of body. The final slide is the call to action, following the brand's CTA rules.
- Keep every slide headline under 9 words and every body under 40 words so it fits on a 1080x1350 card.
`;

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

Give me ${count} distinct carousel ideas for this brand, each one line, drawn from the content pillars. Each idea should be specific enough to build a 7-slide carousel from, and written in the brand's voice. Vary the angles: myths, mistakes, how-tos, hot takes, stories, lists.`;
  const out = await ask(system, user, 3000);
  return (out.ideas || []).map((s) => String(s).trim()).filter(Boolean);
}

const PACKAGE_SHAPE = `{
  "slides": [{"headline": "...", "body": "..."}],
  "caption": "...",
  "hashtags": ["#one", "#two"],
  "yt_title": "...",
  "yt_tags": ["tag one", "tag two"],
  "yt_pinned_comment": "...",
  "yt_category": "..."
}`;

export async function generatePackage(brand, { idea, pillar, slideCount = 7 }) {
  const system = `You write complete social content packages (carousel slides + captions) for a brand. Reply with JSON only, exactly this shape:\n${PACKAGE_SHAPE}\n${HOUSE_RULES}`;
  const user = `${brandContext(brand)}
${pillar ? `Pillar for this piece: ${pillar}\n` : ""}
Idea: ${idea}

Produce:
1. "slides": exactly ${slideCount} slides. Slide 1 = hook headline only (body empty). Slides 2-${slideCount - 1} = headline + body. Slide ${slideCount} = the CTA (headline + short body).
2. "caption": one caption used on Instagram, TikTok and as the YouTube description. Hook line first, then the value, then the CTA, then the hashtags on the last line (max 5).
3. "hashtags": the same max-5 hashtags used in the caption, with the # symbol.
4. "yt_title": a YouTube Shorts title under 70 characters.
5. "yt_tags": 8-12 YouTube tags (plain words/phrases, no #).
6. "yt_pinned_comment": one short pinned comment that nudges engagement in the brand's voice.
7. "yt_category": the best-fit YouTube category name (e.g. "Education", "People & Blogs", "Entertainment", "Howto & Style").`;
  const out = await ask(system, user);
  return normalizePackage(out, slideCount);
}

export async function regenerateSlides(brand, item) {
  const count = Array.isArray(item.slides) && item.slides.length ? item.slides.length : 7;
  const system = `You write carousel slide copy for a brand. Reply with JSON only: {"slides": [{"headline": "...", "body": "..."}]}.\n${HOUSE_RULES}`;
  const user = `${brandContext(brand)}

Idea: ${item.idea}
${item.caption ? `The caption already written for this piece (keep the slides consistent with it):\n${item.caption}\n` : ""}
Write exactly ${count} slides. Slide 1 = hook headline only. Slides 2-${count - 1} = headline + body. Slide ${count} = CTA. Make this version noticeably different from a generic first draft: sharper hook, tighter body copy.`;
  const out = await ask(system, user, 4000);
  return normalizePackage({ slides: out.slides }, count).slides;
}

export async function regenerateCopy(brand, item) {
  const system = `You write social captions and YouTube metadata for a brand. Reply with JSON only, exactly this shape:\n${PACKAGE_SHAPE.replace('"slides": [{"headline": "...", "body": "..."}],\n  ', "")}\n${HOUSE_RULES}`;
  const slidesText = (item.slides || []).map((s, i) => `${i + 1}. ${s.headline}${s.body ? " — " + s.body : ""}`).join("\n");
  const user = `${brandContext(brand)}

Idea: ${item.idea}
The carousel slides for this piece:
${slidesText}

Write a fresh caption (hook first, value, CTA, then max 5 hashtags on the last line), the matching "hashtags" array, a YouTube Shorts title under 70 characters, 8-12 YouTube tags, a pinned comment, and the best-fit YouTube category.`;
  const out = await ask(system, user, 4000);
  const norm = normalizePackage({ slides: item.slides, ...out }, (item.slides || []).length || 7);
  delete norm.slides;
  return norm;
}

function normalizePackage(out, slideCount) {
  const slides = (Array.isArray(out.slides) ? out.slides : [])
    .slice(0, slideCount)
    .map((s) => ({ headline: String(s?.headline || "").trim(), body: String(s?.body || "").trim() }));
  const hashtags = (Array.isArray(out.hashtags) ? out.hashtags : [])
    .map((h) => String(h).trim())
    .filter(Boolean)
    .map((h) => (h.startsWith("#") ? h : "#" + h.replace(/^#+/, "")))
    .slice(0, 5);
  let caption = String(out.caption || "").trim();
  if (hashtags.length && !hashtags.every((h) => caption.includes(h))) {
    caption = caption.replace(/\n?#[^\n]*$/m, "").trim() + "\n\n" + hashtags.join(" ");
  }
  return {
    slides,
    caption,
    hashtags,
    yt_title: String(out.yt_title || "").trim().slice(0, 100),
    yt_tags: (Array.isArray(out.yt_tags) ? out.yt_tags : []).map((t) => String(t).replace(/^#/, "").trim()).filter(Boolean).slice(0, 15),
    yt_pinned_comment: String(out.yt_pinned_comment || "").trim(),
    yt_category: String(out.yt_category || "").trim(),
  };
}
