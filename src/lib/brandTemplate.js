import { buildTmplHTML, buildCtaHTML } from "./carouselTemplates.js";
import { buildElegantHTML, buildElegantCtaHTML } from "./elegantTemplate.js";
import { buildHealthcodeHTML, buildHealthcodeCtaHTML } from "./healthcodeTemplate.js";

// Every brand gets its own bespoke template built for its actual visual
// identity (Elegant for Sky High Soles, HealthCode for HealthCode
// Performance) — the earlier generic one-size-fits-all templates (Raw,
// Classic, Clean Pro, Bold) were removed once neither brand's default
// pointed at them any more. carouselTemplates.js/slideTemplate.js still
// exist and are still imported below — they're shared with Carousel
// Studio, the customer-facing product, so they're left in place — but
// nothing in this dashboard can select or generate those four any more.
// One template per brand, not a shared pick-list — Sky High Soles always
// renders with its own template, HealthCode Performance with its own. A new
// brand gets a new bespoke template built for it (a code change), not a
// choice between these two, so nothing in the dashboard offers switching
// between them.
export const TEMPLATES = [
  { id: "elegant", label: "Sky High Soles Template", desc: "Full photo always shown in full, soft vignette, italic headline, quiet seductive flow. AI photos by default." },
  { id: "healthcode", label: "HealthCode Template", desc: "Full photo always shown in full, teal branded wash, bold white shadowed headline. AI photos by default." },
];

// Where the photos come from when a post is created.
export const PHOTO_SOURCES = [
  ["ai", "AI photos"],
  ["library", "From library"],
  ["same", "One photo, every slide"],
];
export function defaultPhotoSource(template) {
  return "ai";
}

export const CTA_TYPES = [["comment", "Comment"], ["follow", "Follow"], ["save", "Save"], ["share", "Share"], ["like", "Like"]];

const CTA_DEFAULT_KEYWORD = { comment: "GUIDE", follow: "FOLLOW", save: "SAVE", share: "SHARE", like: "LIKE" };
const CTA_DEFAULT_LINE1 = "If you want more like this";
const CTA_DEFAULT_LINE3 = { comment: "and I'll send it straight to your DMs", follow: "so you don't miss the next one", save: "so you can find this again", share: "with someone who needs to see it", like: "if this one landed" };

export const THEME_DEFAULTS = {
  template: "elegant",
  // bold
  bg: "#0a0a0a", accent: "#C9A84C", text: "#ffffff", font: "Montserrat", handle: "",
  // raw / clean-pro (Carousel Studio option names)
  tmplFont: "bebasneue", fontSize: 46, rawBox: "white", rawPos: "bottom", tmplBg: "dark", effect: "none",
  primary: "#ffffff", secondary: "#ffffff",
  name: "", profile_media_id: null, showTick: false, showCounter: false,
  cta: { type: "follow", keyword: "", line1: "", line3: "", bg: "dark" },
  ai_style: "",
  platforms: ["instagram", "tiktok", "youtube"],
};

// AI photo direction, hard-coded per brand slug rather than stored in
// visual_theme.ai_style — this project's Supabase has repeatedly failed to
// write long text into that jsonb field (timeouts on the UPDATE, not on
// SELECT, cause unknown), and this is content-safety-relevant text that
// needs to change reliably via a normal code push, not a flaky DB write.
// Set here, it overrides whatever's stored in the database for that brand;
// BrandsTab's "AI photo direction" field becomes read-only when a brand has
// one of these.
const BRAND_AI_STYLE = {
  "sky-high-soles": "She is always the same woman (her exact look is in the character description that comes with this direction): slim and slender, with long blonde hair. Whenever any of her hair is in frame it is that long blonde hair, and her legs are always slim. Her face is never in the photo. Every framing keeps her head fully outside the frame, using one of these: her own point of view looking down at her legs and feet; the top edge of the frame cutting across her waist or hips, showing her legs and feet; a close-up of just her feet and ankles; or shot from directly behind, where the back of her blonde head is the only part of her head in view. State the framing as where the top edge of the frame falls (\"the top of the frame cuts across her hips\"), never as \"from the chin down\" or \"face out of frame\": a chin-level crop leaves her face one step away and the image model often draws it in. Never a side or front view of her upper body, and never a pulled-back shot of her whole figure. Describe only the parts of her that are inside the frame: in a legs-and-feet shot, describe her legs and feet, not her hair or her as \"a blonde woman\", because naming her whole figure makes the model draw all of her. The feet are always the clear focus, sharp and well lit, in a simple relaxed position where each whole foot reads clearly: side profile, top-down, or soles toward the camera. Feet side by side, crossed at the ankle, or one resting on the other, never tangled, bent awkwardly or overlapping. Both feet are a true mirrored left and right pair with five toes each, natural toe lengths, smooth soft skin and neat toenails. When a shoe is on, the foot sits fully inside it: heel in the heel cup, toes in the toe box, weight on the sole. What is on her feet varies by scene: sheer tan/nude tights with her uniform, black court heels or black flats, a shoe being slipped off, one on and one off, or bare feet. If the text says bare feet, show bare feet. Tights are always sheer tan/nude, never black or patterned. Whenever she's in her work uniform, her shoes are always black (black patent court heels or plain black flats), never navy, nude or any other colour, and her tights are always sheer tan, never black. Name the colour in every prompt: \"black patent court heels\", \"sheer tan tights\". Her work uniform is a fitted navy pencil skirt, a white blouse, sheer tan/nude tights and black patent court heels with a mid heel. Setting: only real cabin crew life places: on the aircraft (cabin aisle, jump seat, galley, crew rest), the crew room, the airport (gate, lounge, terminal floor), her own home (getting ready at the mirror, bed, sofa, bath), a pedicure chair, and only occasionally a hotel room or a pool. Most photos are at work or at home; a hotel is the exception, not the default. If the moment in the text happens anywhere else (a crew bus, a taxi, a car, a train, a gym, a street, a shop), show the moment just before or after it in one of those places instead: a crew bus moment becomes kicking her heels off on her own sofa at home. Vary setting and shot distance across posts: some tight close-ups on the feet, some pulled back to her legs and lower body. Mood is elegant and sensual, like a luxury hosiery campaign: warm low light and soft shadows shaping her legs, slow graceful poses (pointed toes, an arched foot, legs crossed at the knee, a heel dangling from her toes, slipping a shoe off), the sheen of sheer tights catching the light. Sensual through light, pose and styling, never explicit, never flat or clinical. Tasteful, never explicit: always fully clothed above the waist, never nudity, a bare chest, lingerie or underwear. Her own hands are a woman's: slender and manicured. A partner may appear only as a man's hand, at most up to the wrist or forearm, entering from the edge of the frame and resting on her leg or foot, clearly someone else's hand. Anything that could carry a photo of a person (an ID badge, a lanyard card, a photo frame, a phone screen) is face-down, angled away, or left out.",
};

// The one fixed woman behind every Sky High Soles photo. This used to be
// written fresh by Claude for every batch, so "slim and blonde" came out
// differently each time (and sometimes not at all). Fixed here, it's the
// same words in every prompt, and it's what the reference shots in the X
// tab's "Her look" panel are generated from. Split into parts so a prompt
// can describe only what's actually in frame (see BRAND_AI_STYLE above).
const BRAND_CHARACTER = {
  "sky-high-soles": {
    who: "a slim, slender woman in her late twenties",
    hair: "long, straight, light platinum-blonde hair",
    skin: "fair, lightly sun-kissed skin",
    legs: "long slim legs with slender calves and fine ankles",
    feet: "slim, elegant feet with a high arch, smooth soft skin, naturally graduated toes and neatly trimmed toenails painted a glossy soft nude-pink",
    hands: "slim feminine hands with a classic French manicure",
  },
};

export function characterOf(brand) {
  return BRAND_CHARACTER[brand?.slug] || null;
}

// The whole character as one description, or "" for a brand without one.
export function characterText(brand) {
  const c = characterOf(brand);
  return c ? `${c.who} with ${c.hair}, ${c.skin}, ${c.legs}, ${c.hands}, and ${c.feet}` : "";
}

export function themeOf(brand) {
  const t = { ...THEME_DEFAULTS, ...(brand?.visual_theme || {}) };
  t.cta = { ...THEME_DEFAULTS.cta, ...(brand?.visual_theme?.cta || {}) };
  if (BRAND_AI_STYLE[brand?.slug]) t.ai_style = BRAND_AI_STYLE[brand.slug];
  return t;
}

export function aiStyleLocked(brand) {
  return !!BRAND_AI_STYLE[brand?.slug];
}

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

// Client-side mirror of src/lib/dashboard.js's itemPlatforms() — kept here
// (not imported from dashboard.js, which pulls in @supabase/supabase-js and
// is server-only) so the dashboard's X and Carousels tabs can both filter a
// list of items by which platforms they're actually destined for, without
// an extra round-trip. Same precedence: the item's own override first, else
// the brand's platforms, else the default new-brand set.
export function itemPlatforms(item, brand) {
  const p = item?.platforms;
  if (Array.isArray(p) && p.length) return p;
  const bp = brand?.visual_theme?.platforms;
  return Array.isArray(bp) && bp.length ? bp : THEME_DEFAULTS.platforms;
}

// The template a content item renders with: its own choice, else the brand's default.
export function itemTemplate(item, brand) {
  const t = item?.template;
  return TEMPLATE_IDS.includes(t) ? t : themeOf(brand).template;
}

export function ctaCopy(theme) {
  const c = theme.cta || {};
  const type = c.type || "follow";
  return {
    type,
    keyword: c.keyword || CTA_DEFAULT_KEYWORD[type],
    line1: c.line1 || CTA_DEFAULT_LINE1,
    line2: c.line2 || "",
    line3: c.line3 || CTA_DEFAULT_LINE3[type],
    bg: c.bg || "dark",
  };
}

export function templateOpts(brand, theme, profileUrl) {
  return {
    effect: theme.effect || "none",
    font: theme.tmplFont,
    fontSize: theme.fontSize,
    primary: theme.primary,
    secondary: theme.secondary,
    accentLine: theme.accent,
    showCounter: !!theme.showCounter,
    showWebsite: false,
    bg: theme.tmplBg,
    fontStyle: "",
    rawBox: theme.rawBox,
    rawPos: theme.rawPos,
    listicleNum: 6,
    profUrl: profileUrl || "",
    nm: theme.name || brand?.name || "",
    hdl: theme.handle || "",
    showTick: !!theme.showTick,
    isFree: false,
    userWebsite: "",
  };
}

// slides: stored slide objects (with an `image_url` already resolved to a
// signed URL where the slide has one). Returns one full HTML document per slide.
export function buildBrandSlides({ brand, slides, profileUrl, coverImageUrl, ctaOverride, template }) {
  const theme = themeOf(brand);
  const tmpl = TEMPLATE_IDS.includes(template) ? template : theme.template;
  const total = slides.length;
  if (tmpl === "elegant") {
    const cta = { ...ctaCopy(theme), ...(ctaOverride || {}) };
    const eOpts = { name: theme.name || brand?.name || "", handle: theme.handle || "", profUrl: profileUrl || "" };
    return slides.map((s, i) => {
      if (s.isCta) {
        // No slide of its own carries a photo for the CTA, so it keeps the
        // last content slide's image rather than showing a blank frame.
        const line1 = (theme.cta?.line1 || "").trim() || s.line1 || cta.line1;
        const line3 = (theme.cta?.line3 || "").trim() || s.line3 || cta.line3;
        const prevImage = slides[i - 1]?.image_url || coverImageUrl || null;
        return buildElegantCtaHTML(eOpts, cta.type, cta.keyword, line1, line3, prevImage);
      }
      const image = s.image_url || (i === 0 ? coverImageUrl : null) || null;
      return buildElegantHTML({ ...s, image }, i, total, eOpts);
    });
  }
  if (tmpl === "healthcode") {
    const cta = { ...ctaCopy(theme), ...(ctaOverride || {}) };
    const hOpts = { name: theme.name || brand?.name || "", handle: theme.handle || "", profUrl: profileUrl || "", accent: theme.accent };
    return slides.map((s, i) => {
      if (s.isCta) {
        // No slide of its own carries a photo for the CTA, so it keeps the
        // last content slide's image rather than showing a blank frame.
        const line1 = (theme.cta?.line1 || "").trim() || s.line1 || cta.line1;
        const line3 = (theme.cta?.line3 || "").trim() || s.line3 || cta.line3;
        const prevImage = slides[i - 1]?.image_url || coverImageUrl || null;
        return buildHealthcodeCtaHTML(hOpts, cta.type, cta.keyword, line1, line3, prevImage);
      }
      const image = s.image_url || (i === 0 ? coverImageUrl : null) || null;
      return buildHealthcodeHTML({ ...s, image }, i, total, hOpts);
    });
  }
  const opts = templateOpts(brand, theme, profileUrl);
  const cta = { ...ctaCopy(theme), ...(ctaOverride || {}) };
  return slides.map((s, i) => {
    if (s.isCta) {
      // The brand's own CTA lines win when set; the AI's lines only fill blanks.
      const line1 = (theme.cta?.line1 || "").trim() || s.line1 || cta.line1;
      const line3 = (theme.cta?.line3 || "").trim() || s.line3 || cta.line3;
      return buildCtaHTML(opts, cta.type, cta.keyword, line1, s.line2 || cta.line2, line3, cta.bg, opts.nm, opts.hdl, opts.profUrl, opts.showTick, opts.font, total, opts.showCounter);
    }
    // The dashboard's photos have no manual crop/position UI (unlike Carousel
    // Studio's own editor), so always show the whole photo rather than
    // cover-cropping it — losing part of the actual subject to a fixed-shape
    // crop isn't acceptable when there's no way to fix it afterward. The
    // card's background is already black, so any letterboxing is invisible.
    const slide = { ...s, image: s.image_url || (i === 0 ? coverImageUrl : null) || null, imageFit: "contain" };
    return buildTmplHTML(slide, i, total, tmpl, opts);
  });
}

// Which slides must carry a photo for the template to render properly.
export function slideNeedsImage(template, idx, slide) {
  if (slide?.isCta) return false;
  if (template === "raw" || template === "dark-fade" || template === "elegant" || template === "healthcode") return true;
  return template === "clean-pro" && idx === 0;
}

// Which slides may carry a photo.
export function slideCanHaveImage(template, idx, slide) {
  if (slide?.isCta) return false;
  return template === "raw" || template === "dark-fade" || template === "elegant" || template === "healthcode" || idx === 0;
}

// AI photo generation is offered for the photo-led templates that tell a
// story or carry facts (Classic, Clean Pro, Elegant, HealthCode). Raw is your own photos.
export function templateAllowsAiImage(template) {
  return template === "clean-pro" || template === "dark-fade" || template === "elegant" || template === "healthcode";
}

// The text on a slide, for photo prompts and captions.
export function slideText(s) {
  if (!s) return "";
  if (s.isCta) return "";
  return s.rawText || [s.kicker, s.headline, s.detail, s.subline, s.bodyText || s.body, s.accentText].filter(Boolean).join(" — ");
}

// Sample slides for the live preview in the brand form. `imageUrl` is any
// https photo from the library (or null for the template's placeholder).
export function previewSlides(brand, imageUrl, profileUrl, template) {
  const cover = { headline: "Five things nobody tells you", subline: "Number three changes everything", rawText: "Golden hour.\nNowhere to be.", body: "", kicker: "The Story", detail: "Number three changes everything.", image_url: imageUrl };
  const body = { headline: "It starts small", bodyText: "One honest post a day beats a perfect one a month. Consistency compounds.", accentText: "Show up. Then show up again.", rawText: "Save this.\nYou'll want it later.", body: "One honest post a day beats a perfect one a month.", kicker: "The Detail", detail: "One honest post a day beats a perfect one a month.", image_url: imageUrl };
  const cta = { isCta: true };
  return buildBrandSlides({ brand, slides: [cover, body, cta], profileUrl: profileUrl || null, coverImageUrl: imageUrl, template });
}

