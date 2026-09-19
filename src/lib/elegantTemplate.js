// A native, photo-led "Elegant" template built for brands that need a
// quiet, seductive story flow rather than a bold headline card: full photo
// always shown in full (object-fit:contain, never cropped), a soft
// localized vignette instead of a hard gradient bar, italic serif headline.
//
// Dashboard-only — not used by Carousel Studio's customer-facing renderer
// (carouselTemplates.js), so this can evolve freely without any risk to
// paying Studio customers.
//
// The vignette is a fixed dark wash, not brightness-adaptive: the wash
// itself darkens whatever photo sits behind the text, so it stays legible
// on a dark or light photo alike, with no canvas/CORS dependency to fail
// silently on a real photo in production.

const W = 1080, H = 1350;
const GOLD = "#C9A84C";
const GFONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,600&family=Montserrat:wght@400;600&display=swap";

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const BASE_CSS = `<style>
  .adaptive{color:#fff;}
  .wash{background:radial-gradient(ellipse 900px 750px at var(--wash-x,0%) var(--wash-y,100%),rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.8) 30%,rgba(0,0,0,0.5) 55%,rgba(0,0,0,0.1) 75%,rgba(0,0,0,0) 88%);}
  .kicker,.detail,.handle,.cta-line1,.cta-line3{text-shadow:0 2px 14px rgba(0,0,0,0.6);}
  .headline,.cta-word{text-shadow:0 2px 18px rgba(0,0,0,0.55);}
</style>`;

function badgeBlock(name, profUrl) {
  return `<div style="position:absolute;top:96px;left:44px;z-index:5;display:flex;align-items:center;gap:12px;">
    <div style="width:46px;height:46px;border-radius:50%;overflow:hidden;border:1.5px solid rgba(255,255,255,0.7);background:#4a6a9a;flex-shrink:0;">${profUrl ? `<img src="${profUrl}" style="width:100%;height:100%;object-fit:cover;"/>` : ""}</div>
    ${name ? `<div class="handle adaptive" style="font-family:Montserrat,sans-serif;font-size:20px;font-weight:600;letter-spacing:0.5px;">${esc(name)}</div>` : ""}
  </div>`;
}

// slide: {image, kicker, headline, detail}. opts: {name, handle, profUrl}.
export function buildElegantHTML(slide, idx, total, opts) {
  const { name = "", handle = "", profUrl = "" } = opts || {};
  const image = slide?.image || "";
  const kicker = slide?.kicker || "";
  const line = slide?.headline || "";
  const detail = slide?.detail || "";
  const counter = `<div class="handle adaptive" style="position:absolute;top:96px;right:44px;z-index:5;font-family:Montserrat,sans-serif;font-size:16px;font-weight:600;opacity:0.75;letter-spacing:1px;">${idx + 1} / ${total}</div>`;
  const textBlock = `<div class="adaptive" style="position:absolute;left:64px;right:220px;bottom:190px;z-index:5;">
    ${kicker ? `<div class="kicker" style="font-family:Montserrat,sans-serif;font-size:15px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${GOLD};margin-bottom:14px;">${esc(kicker)}</div>` : ""}
    <div style="width:56px;height:2px;background:${GOLD};margin-bottom:18px;"></div>
    <div class="headline" style="font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:600;font-size:58px;line-height:1.22;margin-bottom:${detail ? "16px" : "0"};">${esc(line)}</div>
    ${detail ? `<div class="detail" style="font-family:Montserrat,sans-serif;font-size:19px;font-weight:400;line-height:1.5;opacity:0.88;max-width:520px;">${esc(detail)}</div>` : ""}
    ${handle ? `<div class="handle" style="font-family:Montserrat,sans-serif;font-size:15px;font-weight:600;opacity:0.55;margin-top:22px;letter-spacing:1px;">${esc(handle)}</div>` : ""}
  </div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${GFONTS}">${BASE_CSS}</head>
  <body style="margin:0;">
  <div style="position:relative;width:${W}px;height:${H}px;background:#0a0a0a;overflow:hidden;">
    <div style="position:absolute;inset:0;z-index:0;display:flex;align-items:center;justify-content:center;">
      ${image ? `<img src="${image}" style="width:100%;height:100%;object-fit:contain;display:block;"/>` : ""}
    </div>
    <div class="wash" style="position:absolute;inset:0;z-index:1;--wash-x:0%;--wash-y:100%;"></div>
    ${badgeBlock(name, profUrl)}${counter}${textBlock}
  </div>
  </body></html>`;
}

// The CTA slide keeps the same photo as the last content slide (reused,
// never re-uploaded), with a small localized glow just behind the words —
// the photo stays visible through the rest of the frame.
export function buildElegantCtaHTML(opts, ctaType, keyword, line1, line3, image) {
  const textBlock = `<div class="adaptive" style="position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);z-index:5;text-align:center;">
    <div class="cta-line1" style="font-family:Montserrat,sans-serif;font-size:18px;font-weight:600;margin-bottom:14px;">${esc(line1)}</div>
    <div class="cta-word" style="font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:600;font-size:88px;color:${GOLD};letter-spacing:2px;margin-bottom:16px;">${esc(keyword)}</div>
    <div style="width:70px;height:2px;background:${GOLD};margin:0 auto 16px;"></div>
    <div class="cta-line3" style="font-family:Montserrat,sans-serif;font-size:17px;font-weight:400;max-width:640px;margin:0 auto;">${esc(line3)}</div>
  </div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${GFONTS}">${BASE_CSS}
  <style>.wash-cta{background:radial-gradient(ellipse 620px 460px at 50% 50%,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.5) 45%,rgba(0,0,0,0.1) 72%,rgba(0,0,0,0) 85%);}</style>
  </head>
  <body style="margin:0;">
  <div style="position:relative;width:${W}px;height:${H}px;background:#0a0a0a;overflow:hidden;">
    <div style="position:absolute;inset:0;z-index:0;display:flex;align-items:center;justify-content:center;">
      ${image ? `<img src="${image}" style="width:100%;height:100%;object-fit:contain;display:block;filter:saturate(0.85);"/>` : ""}
    </div>
    <div class="wash-cta" style="position:absolute;inset:0;z-index:1;"></div>
    ${textBlock}
  </div>
  </body></html>`;
}
