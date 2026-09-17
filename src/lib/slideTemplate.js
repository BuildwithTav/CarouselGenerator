export const SLIDE_W = 1080;
export const SLIDE_H = 1350;

export const SLIDE_FONTS = [
  { id: "Montserrat", label: "Montserrat (bold, clean)" },
  { id: "Inter", label: "Inter (modern)" },
  { id: "Poppins", label: "Poppins (friendly)" },
  { id: "Playfair Display", label: "Playfair Display (elegant)" },
  { id: "Oswald", label: "Oswald (condensed, punchy)" },
  { id: "Bebas Neue", label: "Bebas Neue (loud)" },
  { id: "Cormorant Garamond", label: "Cormorant Garamond (luxury)" },
];

export const DEFAULT_THEME = {
  bg: "#0a0a0a",
  accent: "#C9A84C",
  text: "#ffffff",
  font: "Montserrat",
  handle: "",
  platforms: ["instagram", "tiktok", "youtube"],
};

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fontHref(font) {
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, "+")}:wght@400;600;700;800;900&display=swap`;
}

// Scale headline size down as it gets longer so it always fits the card.
function headlineSize(text, isCover) {
  const len = (text || "").length;
  if (isCover) return len <= 24 ? 104 : len <= 40 ? 88 : len <= 60 ? 74 : 62;
  return len <= 24 ? 78 : len <= 40 ? 66 : len <= 60 ? 56 : 48;
}

export function buildSlideHTML(slide, idx, total, themeIn, brand, coverImageUrl) {
  const theme = { ...DEFAULT_THEME, ...(themeIn || {}) };
  const isCover = idx === 0;
  const isCta = idx === total - 1;
  const headline = slide?.headline || "";
  const body = slide?.body || "";
  const handle = theme.handle || "";
  const useImage = isCover && coverImageUrl;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="${fontHref(theme.font)}">
<style>
  html,body{margin:0;padding:0;width:${SLIDE_W}px;height:${SLIDE_H}px;overflow:hidden;background:${theme.bg};}
  .slide{position:relative;width:${SLIDE_W}px;height:${SLIDE_H}px;background:${theme.bg};color:${theme.text};font-family:'${theme.font}',sans-serif;display:flex;flex-direction:column;justify-content:${isCover ? "flex-end" : "center"};padding:96px 88px 120px;box-sizing:border-box;}
  .bg{position:absolute;inset:0;background:url("${esc(coverImageUrl || "")}") center/cover no-repeat;}
  .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.55) 55%,rgba(0,0,0,0.88) 100%);}
  .bar{position:absolute;top:0;left:0;width:100%;height:14px;background:${theme.accent};}
  .kicker{position:relative;font-size:26px;font-weight:700;letter-spacing:6px;text-transform:uppercase;color:${theme.accent};margin-bottom:34px;}
  .hl{position:relative;font-weight:900;line-height:1.06;letter-spacing:-1.5px;margin:0;white-space:pre-wrap;}
  .rule{position:relative;width:120px;height:8px;background:${theme.accent};margin:44px 0 40px;border-radius:4px;}
  .body{position:relative;font-size:38px;line-height:1.45;font-weight:500;opacity:0.94;white-space:pre-wrap;max-width:880px;}
  .cta{position:relative;display:inline-block;margin-top:52px;padding:26px 54px;border-radius:14px;background:${theme.accent};color:${theme.bg};font-size:34px;font-weight:800;letter-spacing:0.5px;}
  .foot{position:absolute;left:88px;right:88px;bottom:56px;display:flex;justify-content:space-between;align-items:center;font-size:26px;font-weight:600;opacity:0.85;}
  .foot .handle{color:${theme.accent};}
  .swipe{font-size:26px;font-weight:700;color:${theme.accent};margin-top:48px;position:relative;letter-spacing:2px;text-transform:uppercase;}
</style></head>
<body><div class="slide">
  ${useImage ? `<div class="bg"></div><div class="shade"></div>` : `<div class="bar"></div>`}
  ${isCover ? "" : `<div class="kicker">${isCta ? esc(brand?.name || "") : `${idx + 1} / ${total}`}</div>`}
  <h1 class="hl" style="font-size:${headlineSize(headline, isCover)}px">${esc(headline)}</h1>
  ${body ? `<div class="rule"></div><div class="body">${esc(body)}</div>` : ""}
  ${isCover ? `<div class="swipe">Swipe &rarr;</div>` : ""}
  ${isCta && brand?.cta_rules ? "" : ""}
  <div class="foot"><span class="handle">${esc(handle || brand?.name || "")}</span><span>${isCover ? "" : `${idx + 1}/${total}`}</span></div>
</div></body></html>`;
}
