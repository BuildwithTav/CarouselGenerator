import { buildTmplHTML, buildCtaHTML } from "./carouselTemplates.js";
import { buildSlideHTML } from "./slideTemplate.js";

export const TEMPLATES = [
  { id: "raw", label: "Raw", desc: "One of your photos across every slide, a line of text in a tight box. Authentic, minimal." },
  { id: "dark-fade", label: "Classic", desc: "A photo on every slide with a dark fade, bold headline and subline. AI photos by default." },
  { id: "clean-pro", label: "Clean Pro", desc: "Photo cover with a dark fade, then clean fact or story slides. AI cover by default." },
  { id: "bold", label: "Bold", desc: "Big headline on a solid colour. Text-led, no photos needed." },
];

// Where the photos come from when a post is created.
export const PHOTO_SOURCES = [
  ["ai", "AI photos"],
  ["library", "From library"],
  ["same", "One photo, every slide"],
];
export function defaultPhotoSource(template) {
  if (template === "raw") return "same";
  if (template === "dark-fade" || template === "clean-pro") return "ai";
  return "library";
}

export const TEMPLATE_FONTS = [
  ["bebasneue", "Bebas Neue (loud)"], ["inter", "Inter (clean)"], ["montserrat", "Montserrat"], ["poppins", "Poppins"],
  ["playfair", "Playfair Display (elegant)"], ["dancing", "Dancing Script (handwritten)"], ["pacifico", "Pacifico (casual script)"],
  ["cormorant", "Cormorant Garamond (luxury)"], ["oswald", "Oswald"], ["raleway", "Raleway"], ["quicksand", "Quicksand (soft)"],
];

export const CTA_TYPES = [["comment", "Comment"], ["follow", "Follow"], ["save", "Save"], ["share", "Share"], ["like", "Like"]];

const CTA_DEFAULT_KEYWORD = { comment: "GUIDE", follow: "FOLLOW", save: "SAVE", share: "SHARE", like: "LIKE" };
const CTA_DEFAULT_LINE1 = "If you want more like this";
const CTA_DEFAULT_LINE3 = { comment: "and I'll send it straight to your DMs", follow: "so you don't miss the next one", save: "so you can find this again", share: "with someone who needs to see it", like: "if this one landed" };

export const THEME_DEFAULTS = {
  template: "bold",
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

export function themeOf(brand) {
  const t = { ...THEME_DEFAULTS, ...(brand?.visual_theme || {}) };
  t.cta = { ...THEME_DEFAULTS.cta, ...(brand?.visual_theme?.cta || {}) };
  return t;
}

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

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
  if (tmpl === "bold") {
    return slides.map((s, i) => buildSlideHTML(s, i, total, theme, brand, i === 0 ? s.image_url || coverImageUrl || null : null));
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
    const slide = { ...s, image: s.image_url || (i === 0 ? coverImageUrl : null) || null };
    return buildTmplHTML(slide, i, total, tmpl, opts);
  });
}

// Which slides must carry a photo for the template to render properly.
export function slideNeedsImage(template, idx, slide) {
  if (slide?.isCta) return false;
  if (template === "raw" || template === "dark-fade") return true;
  return template === "clean-pro" && idx === 0;
}

// Which slides may carry a photo.
export function slideCanHaveImage(template, idx, slide) {
  if (slide?.isCta) return false;
  return template === "raw" || template === "dark-fade" || idx === 0;
}

// AI photo generation is offered for the photo-led templates that tell a
// story or carry facts (Classic, Clean Pro). Raw is your own photos.
export function templateAllowsAiImage(template) {
  return template === "clean-pro" || template === "dark-fade";
}

// The text on a slide, for photo prompts and captions.
export function slideText(s) {
  if (!s) return "";
  if (s.isCta) return "";
  return s.rawText || [s.headline, s.subline, s.bodyText || s.body, s.accentText].filter(Boolean).join(" — ");
}

// Sample slides for the live preview in the brand form. `imageUrl` is any
// https photo from the library (or null for the template's placeholder).
export function previewSlides(brand, imageUrl, profileUrl, template) {
  const cover = { headline: "Five things nobody tells you", subline: "Number three changes everything", rawText: "Golden hour.\nNowhere to be.", body: "", image_url: imageUrl };
  const body = { headline: "It starts small", bodyText: "One honest post a day beats a perfect one a month. Consistency compounds.", accentText: "Show up. Then show up again.", rawText: "Save this.\nYou'll want it later.", body: "One honest post a day beats a perfect one a month.", image_url: imageUrl };
  const cta = { isCta: true };
  return buildBrandSlides({ brand, slides: [cover, body, cta], profileUrl: profileUrl || null, coverImageUrl: imageUrl, template });
}
