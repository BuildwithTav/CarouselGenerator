// A native, photo-led template built for HealthCode Performance: full photo
// always shown in full (object-fit:contain, never cropped), a branded
// teal-black wash anchored where the text sits rather than a full-width
// band, bold white headline with a heavy shadow for legibility on any
// photo, teal accent/kicker/badge to match the channel's existing YouTube
// thumbnail branding.
//
// Dashboard-only — not used by Carousel Studio's customer-facing renderer
// (carouselTemplates.js), so this can evolve freely without any risk to
// paying Studio customers.
//
// The wash is a fixed radial gradient anchored bottom-left (not
// brightness-adaptive, not full-width): it only darkens the area directly
// behind the text, so the photo stays visible everywhere else — the same
// lesson learned building Sky High Soles' Elegant template, where a
// full-width wash covered too much of the photo.

const W = 1080, H = 1350;
const ACCENT_DEFAULT = "#1AADA6";
const WASH_DARK = "#061c1b";
const GFONTS = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap";

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function baseCss() {
  return `<style>
  .txt{color:#fff;text-shadow:2px 2px 0 rgba(0,0,0,0.9),0 0 20px rgba(0,0,0,0.75),-1px -1px 0 rgba(0,0,0,0.9),1px -1px 0 rgba(0,0,0,0.9),-1px 1px 0 rgba(0,0,0,0.9),1px 1px 0 rgba(0,0,0,0.9);}
  .wash{background:radial-gradient(ellipse 950px 780px at 0% 100%,rgba(6,28,27,0.94) 0%,rgba(7,35,34,0.82) 30%,rgba(8,45,43,0.5) 55%,rgba(9,50,48,0.12) 75%,rgba(10,61,59,0) 88%);}
</style>`;
}

function badgeBlock(name, profUrl, accent) {
  return `<div style="position:absolute;top:96px;left:44px;z-index:5;display:flex;align-items:center;gap:12px;">
    <div style="width:52px;height:52px;border-radius:50%;overflow:hidden;border:2px solid #fff;flex-shrink:0;background:${accent};">${profUrl ? `<img src="${profUrl}" style="width:100%;height:100%;object-fit:cover;"/>` : ""}</div>
    ${name ? `<div class="txt" style="font-family:Poppins,sans-serif;font-size:22px;font-weight:700;letter-spacing:0.3px;">${esc(name)}</div>` : ""}
  </div>`;
}

// slide: {image, kicker, headline, detail}. opts: {name, handle, profUrl, accent}.
export function buildHealthcodeHTML(slide, idx, total, opts) {
  const { name = "", profUrl = "", accent = ACCENT_DEFAULT } = opts || {};
  const image = slide?.image || "";
  const kicker = slide?.kicker || "";
  const headline = slide?.headline || "";
  const detail = slide?.detail || "";
  const counter = `<div class="txt" style="position:absolute;top:96px;right:44px;z-index:5;font-family:Poppins,sans-serif;font-size:18px;font-weight:700;opacity:0.85;">${idx + 1} / ${total}</div>`;
  const textBlock = `<div style="position:absolute;left:56px;right:56px;bottom:150px;z-index:5;">
    ${kicker ? `<div class="txt" style="font-family:Poppins,sans-serif;font-size:16px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${accent};margin-bottom:16px;text-shadow:0 2px 8px rgba(0,0,0,0.8);">${esc(kicker)}</div>` : ""}
    <div style="width:64px;height:5px;background:${accent};margin-bottom:20px;border-radius:3px;"></div>
    <div class="txt" style="font-family:Poppins,sans-serif;font-weight:800;font-size:64px;line-height:1.12;margin-bottom:${detail ? "18px" : "0"};">${esc(headline)}</div>
    ${detail ? `<div class="txt" style="font-family:Poppins,sans-serif;font-size:22px;font-weight:400;line-height:1.5;opacity:0.95;max-width:560px;">${esc(detail)}</div>` : ""}
  </div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${GFONTS}">${baseCss()}</head>
  <body style="margin:0;">
  <div style="position:relative;width:${W}px;height:${H}px;background:#0a0a0a;overflow:hidden;">
    <div style="position:absolute;inset:0;z-index:0;display:flex;align-items:center;justify-content:center;">
      ${image ? `<img src="${image}" style="width:100%;height:100%;object-fit:contain;display:block;"/>` : ""}
    </div>
    <div class="wash" style="position:absolute;inset:0;z-index:1;"></div>
    ${badgeBlock(name, profUrl, accent)}${counter}${textBlock}
  </div>
  </body></html>`;
}

// The CTA slide keeps the same photo as the last content slide (reused,
// never re-uploaded), with a small tight glow just behind the words — the
// photo stays visible through the rest of the frame.
export function buildHealthcodeCtaHTML(opts, ctaType, keyword, line1, line3, image) {
  const accent = opts?.accent || ACCENT_DEFAULT;
  const textBlock = `<div style="position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);z-index:5;text-align:center;">
    <div class="txt" style="font-family:Poppins,sans-serif;font-size:20px;font-weight:700;margin-bottom:16px;">${esc(line1)}</div>
    <div class="txt" style="font-family:Poppins,sans-serif;font-weight:800;font-size:80px;color:${accent};letter-spacing:1px;margin-bottom:18px;text-shadow:2px 2px 0 rgba(0,0,0,0.9),0 0 24px rgba(0,0,0,0.8);">${esc(keyword)}</div>
    <div style="width:80px;height:5px;background:${accent};margin:0 auto 18px;border-radius:3px;"></div>
    <div class="txt" style="font-family:Poppins,sans-serif;font-size:19px;font-weight:400;max-width:640px;margin:0 auto;">${esc(line3)}</div>
  </div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${GFONTS}">${baseCss()}
  <style>.wash-cta{background:radial-gradient(ellipse 650px 480px at 50% 50%,rgba(6,28,27,0.92) 0%,rgba(6,28,27,0.5) 35%,rgba(7,35,34,0.08) 55%,rgba(7,35,34,0) 65%);}</style>
  </head>
  <body style="margin:0;">
  <div style="position:relative;width:${W}px;height:${H}px;background:#0a0a0a;overflow:hidden;">
    <div style="position:absolute;inset:0;z-index:0;display:flex;align-items:center;justify-content:center;">
      ${image ? `<img src="${image}" style="width:100%;height:100%;object-fit:contain;display:block;"/>` : ""}
    </div>
    <div class="wash-cta" style="position:absolute;inset:0;z-index:1;"></div>
    ${textBlock}
  </div>
  </body></html>`;
}
