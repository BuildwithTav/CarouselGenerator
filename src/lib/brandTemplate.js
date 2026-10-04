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

export function themeOf(brand) {
  const t = { ...THEME_DEFAULTS, ...(brand?.visual_theme || {}) };
  t.cta = { ...THEME_DEFAULTS.cta, ...(brand?.visual_theme?.cta || {}) };
  return t;
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

