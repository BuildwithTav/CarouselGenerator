"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const GOLD = "#C9A84C";
const STORAGE_KEY = "bwt_v11";

const ACCENT_SWATCHES = [
  { id:"gold",    label:"Gold",    hex:"#C9A84C" },
  { id:"blue",    label:"Blue",    hex:"#4A9EFF" },
  { id:"green",   label:"Green",   hex:"#4CAF82" },
  { id:"purple",  label:"Purple",  hex:"#9B59B6" },
  { id:"red",     label:"Red",     hex:"#E74C3C" },
  { id:"coral",   label:"Coral",   hex:"#FF6B6B" },
  { id:"white",   label:"White",   hex:"#FFFFFF" },
  { id:"custom",  label:"Custom",  hex:null },
];

const FONTS = [
  { id:"montserrat", label:"Montserrat",    css:"Montserrat" },
  { id:"playfair",   label:"Playfair",      css:"Playfair Display" },
  { id:"poppins",    label:"Poppins",       css:"Poppins" },
  { id:"inter",      label:"Inter",         css:"Inter" },
  { id:"oswald",     label:"Oswald",        css:"Oswald" },
  { id:"dancing",    label:"Dancing Script", css:"Dancing Script" },
];

const HEADLINE_STYLES = [
  { id:"bold",      label:"Bold",      desc:"Mixed case, max impact",   transform:"none",       letterSpacing:"-1px" },
  { id:"upper",     label:"Uppercase", desc:"All caps, high energy",    transform:"uppercase",  letterSpacing:"1px"  },
  { id:"serif",     label:"Serif",     desc:"Elegant, authoritative",   transform:"none",       letterSpacing:"-0.5px", forceFont:"Playfair Display" },
  { id:"minimal",   label:"Minimal",   desc:"Clean, understated",       transform:"none",       letterSpacing:"0px"  },
];

const BUSINESS_TYPES = [
  { id:"marketer",   label:"Digital Marketer" },
  { id:"creator",    label:"Creator / Influencer" },
  { id:"coach",      label:"Coach / Consultant" },
  { id:"business",   label:"Business" },
  { id:"restaurant", label:"Restaurant / Café" },
  { id:"personal",   label:"Personal Page" },
  { id:"other",      label:"Other" },
];

const BG_MODES = [
  { id:"dark",   label:"Dark",   desc:"Dark background" },
  { id:"light",  label:"Light",  desc:"Light background" },
  { id:"colour", label:"Colour", desc:"Pick any colour" },
  { id:"custom", label:"Image",  desc:"Upload your own image" },
];

const COVER_POSITIONS = [
  { id:"top",    label:"Top",    desc:"Hook in upper third" },
  { id:"centre", label:"Centre", desc:"Hook centred" },
  { id:"bottom", label:"Bottom", desc:"Hook in lower third" },
];

// ─── HELPERS ─────────────────────────────────────────────

function loadS() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null"); } catch { return null; } }
function saveS(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }
function loadHistory() { try { return JSON.parse(localStorage.getItem("bwt_history")||"[]"); } catch { return []; } }
function saveHistory(h) { try { localStorage.setItem("bwt_history", JSON.stringify(h.slice(0,10))); } catch {} }
function Spin({c="#fff"}) { return <div style={{width:14,height:14,borderRadius:"50%",border:`2px solid rgba(255,255,255,0.15)`,borderTop:`2px solid ${c}`,animation:"spin 0.7s linear infinite",flexShrink:0}}/>; }

async function sampleImageBrightness(imageUrl) {
  if (!imageUrl) return null;
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 300; canvas.height = 200;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, img.width * 0.35, img.height * 0.25, 0, 0, 300, 200);
        const data = ctx.getImageData(0, 0, 300, 200).data;
        let total = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          total += (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114);
          count++;
        }
        resolve((total / count) < 128 ? "dark" : "light");
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

// ─── SLIDE HTML BUILDER ───────────────────────────────────

function buildSlideHTML(slide, idx, total, opts, isCover = false) {
  const {
    fontId, headlineStyle, bgMode, templateBgUrl, overlayDark,
    coverImageUrl, coverPosition, badgeArea,
    profileUrl, name, handle, blueTick, websiteUrl, showNums,
    accentColor, ratio, coverImgPos, templateImgPos, bgColour,
  } = opts;
  const coverPos2 = coverImgPos || {x:50,y:50};
  const templatePos = templateImgPos || {x:50,y:50};

  const accent = accentColor || GOLD;
  const isDark = bgMode !== "light";
  const slideBg = bgMode === "light" ? "#F5F3EF" : bgMode === "colour" ? (opts.bgColour||"#1a1a2e") : "#0A0A0A";
  const C = {
    bg: slideBg,
    accent,
    text: isDark ? "#FFFFFF" : "#0A0A0A",
    sub: isDark ? "rgba(255,255,255,0.72)" : "rgba(10,10,10,0.62)",
    dark: isDark,
  };

  const hs = HEADLINE_STYLES.find(h => h.id === headlineStyle) || HEADLINE_STYLES[0];
  const baseFontObj = FONTS.find(f => f.id === fontId) || FONTS[0];
  const hlFont = hs.forceFont || baseFontObj.css;
  const bodyFont = baseFontObj.css;

  const isPortrait = ratio === "portrait";
  const W = 1080, H = isPortrait ? 1920 : 1350;
  const layout = slide.layout || "standard";

  const bgImageUrl = isCover ? coverImageUrl : (bgMode === "custom" ? templateBgUrl : null);

  const pillBg = bgImageUrl
    ? badgeArea === "light" ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.58)"
    : C.dark ? "rgba(0,0,0,0.62)" : "rgba(255,255,255,0.88)";
  const pillText = bgImageUrl || C.dark ? "#fff" : "#111";
  const pillSub = bgImageUrl || C.dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
  const badgeTextColor = C.dark || bgImageUrl ? "#FFFFFF" : "#0A0A0A";
  const badgeSubColor = C.dark || bgImageUrl ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)";
  const badgeTextShadow = bgImageUrl ? "text-shadow:0 1px 6px rgba(0,0,0,0.8);" : "";

  function esc(s) { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

  function accentHL(text) {
    const aw = (slide.accent_word||"").trim();
    if (!aw || !text.includes(aw)) {
      const t = hs.transform === "uppercase" ? (text||"").toUpperCase() : (text||"");
      return esc(t);
    }
    const i = text.indexOf(aw);
    const before = hs.transform === "uppercase" ? text.slice(0,i).toUpperCase() : text.slice(0,i);
    const accent = hs.transform === "uppercase" ? aw.toUpperCase() : aw;
    const after = hs.transform === "uppercase" ? text.slice(i+aw.length).toUpperCase() : text.slice(i+aw.length);
    return `${esc(before)}<span style="color:${C.accent}">${esc(accent)}</span>${esc(after)}`;
  }

  const gFonts = `https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Poppins:wght@700;800;900&family=Inter:wght@700;800;900&family=Oswald:wght@600;700&family=Dancing+Script:wght@600;700&display=swap`;
  const ts = C.dark || bgImageUrl ? "text-shadow:0 2px 28px rgba(0,0,0,0.95);" : "";
  const ts2 = C.dark || bgImageUrl ? "text-shadow:0 1px 16px rgba(0,0,0,0.85);" : "";

  const BADGE_BOTTOM = 230;
  const topPad = isPortrait ? 300 : 270;
  const botPad = isPortrait ? 300 : 270;

  const base = `
    @import url('${gFonts}');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    html, body { width:${W}px; height:${H}px; overflow:hidden; background:${slideBg}; }
    .slide { width:${W}px; height:${H}px; overflow:hidden; background:${slideBg}; font-family:'${bodyFont}',sans-serif; position:relative; color:${C.text}; box-shadow:inset 0 0 0 3px ${C.dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}; }
    .bg-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; object-position:${isCover?`${coverPos2.x}% ${coverPos2.y}%`:`${templatePos.x}% ${templatePos.y}%`}; }
    .bg-ov { position:absolute; inset:0; z-index:1; pointer-events:none; }
    .noise { position:absolute; inset:0; z-index:2; pointer-events:none; opacity:0.3;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
      background-repeat:repeat; }
    .bk { position:absolute; width:52px; height:52px; z-index:3; }
    .tl { top:44px; left:52px; border-top:2.5px solid ${C.accent}; border-left:2.5px solid ${C.accent}; opacity:${C.dark?0.4:0.7}; }
    .tr { top:44px; right:52px; border-top:2.5px solid ${C.accent}; border-right:2.5px solid ${C.accent}; opacity:${C.dark?0.4:0.7}; }
    .bl { bottom:44px; left:52px; border-bottom:2.5px solid ${C.accent}; border-left:2.5px solid ${C.accent}; opacity:${C.dark?0.4:0.7}; }
    .br { bottom:44px; right:52px; border-bottom:2.5px solid ${C.accent}; border-right:2.5px solid ${C.accent}; opacity:${C.dark?0.4:0.7}; }
    .fade { position:absolute; bottom:0; left:0; right:0; height:45%; z-index:3; pointer-events:none;
      background:linear-gradient(to bottom,transparent,rgba(0,0,0,0.65)); }
    .badge { position:absolute; top:158px; left:80px; z-index:10;
      display:inline-flex; align-items:center; gap:14px;
      background:transparent; padding:10px 0; }
    .av { width:110px; height:110px; border-radius:50%; border:3px solid ${C.accent};
      overflow:hidden; flex-shrink:0; background:${C.dark?"#1a1a1a":"#ddd"};
      display:flex; align-items:center; justify-content:center; position:relative; }
    .av img { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:100%; height:100%; object-fit:cover; }
    .av-i { font-size:44px; font-weight:900; color:${C.accent}; font-family:'${hlFont}',sans-serif; }
    .bn { font-size:22px; font-weight:800; color:${badgeTextColor}; line-height:1.2; font-family:'${bodyFont}',sans-serif; ${badgeTextShadow} }
    .bh { font-size:15px; color:${badgeSubColor}; font-family:'${bodyFont}',sans-serif; ${badgeTextShadow} }
    .tick { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; background:#1D9BF0; border-radius:50%; font-size:10px; color:#fff; margin-left:5px; vertical-align:middle; }
    .wm { position:absolute; bottom:28px; right:38px; z-index:3;
      font-size:${Math.floor(H*0.18)}px; font-weight:900; line-height:1;
      color:${C.dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.035)"};
      font-family:'${hlFont}',sans-serif; pointer-events:none; user-select:none; }
    .cnt { position:absolute; top:52px; right:60px; z-index:10;
      font-size:14px; font-weight:700; color:${C.accent}88; font-family:'${bodyFont}',sans-serif; }
    .site { position:absolute; bottom:28px; left:0; right:0; text-align:center; z-index:10;
      font-size:17px; color:${C.dark?"rgba(255,255,255,0.28)":"rgba(0,0,0,0.25)"}; font-family:'${bodyFont}',sans-serif; }
    .tag { display:inline-block; background:${C.accent}; color:${C.dark?"#000":"#fff"};
      font-size:14px; font-weight:800; letter-spacing:2px;
      padding:8px 24px; border-radius:60px; font-family:'${bodyFont}',sans-serif; }
    .div { width:80px; height:1.5px; background:${C.accent}; opacity:0.5; margin:0 auto; position:relative; }
    .div::after { content:''; position:absolute; top:-4px; left:50%;
      transform:translateX(-50%) rotate(45deg); width:10px; height:10px; background:${C.accent}; opacity:0.9; }
    .deco { position:absolute; bottom:${isPortrait?140:100}px; left:0; right:0; display:flex; align-items:center; justify-content:center; gap:16px; pointer-events:none; z-index:2; opacity:0.25; }
    .deco-line { height:1px; width:${isPortrait?120:80}px; background:${C.accent}; }
    .deco-diamond { width:6px; height:6px; background:${C.accent}; transform:rotate(45deg); flex-shrink:0; }
  `;

  const layouts = {
    standard: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:${topPad}px 90px ${botPad}px; text-align:center; overflow:hidden; }
      .hl { font-size:${isPortrait?60:52}px; font-weight:800; line-height:1.15; letter-spacing:${hs.letterSpacing}; ${ts} font-family:'${hlFont}',sans-serif; flex-shrink:0; }
      .body { font-size:${isPortrait?32:28}px; line-height:1.65; color:${C.sub}; max-width:860px; margin-top:28px; ${ts2} font-family:'${bodyFont}',sans-serif; }
      .cta { margin-top:36px; border:1px solid ${C.accent}44; background:${C.accent}16; padding:22px 60px; border-radius:8px; font-size:${isPortrait?28:24}px; font-weight:800; color:${C.accent}; font-family:'${bodyFont}',sans-serif; width:100%; max-width:860px; text-align:center; flex-shrink:0; }
    `,
    statement: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:${topPad}px 90px ${botPad}px; text-align:center; overflow:hidden; }
      .hl { font-size:${isPortrait?72:60}px; font-weight:800; line-height:1.1; letter-spacing:${hs.id==="upper"?"2px":"-2px"}; ${ts} font-family:'${hlFont}',sans-serif; flex-shrink:0; }
      .body { font-size:${isPortrait?32:28}px; line-height:1.65; color:${C.sub}; max-width:800px; margin-top:28px; font-family:'${bodyFont}',sans-serif; }
    `,
    split: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:${topPad}px 90px ${botPad}px; overflow:hidden; }
      .split-top { width:100%; text-align:center; z-index:4; margin-bottom:${isPortrait?24:16}px; flex-shrink:0; }
      .split-tag { display:inline-block; background:${C.accent}; color:${C.dark?"#000":"#fff"}; font-size:14px; font-weight:800; letter-spacing:2px; padding:8px 24px; border-radius:60px; font-family:'${bodyFont}',sans-serif; margin-bottom:16px; }
      .split-hl { font-size:${isPortrait?52:42}px; font-weight:800; line-height:1.15; letter-spacing:${hs.letterSpacing}; ${ts} font-family:'${hlFont}',sans-serif; color:${C.text}; }
      .split-panels { width:100%; display:grid; grid-template-columns:1fr 1fr; z-index:3; flex:1; }
      .panel { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px 44px; text-align:center; gap:12px; overflow:hidden; }
      .panel:first-child { background:${C.accent}10; border-right:1px solid ${C.accent}28; }
      .pl { font-size:${isPortrait?44:36}px; font-weight:900; font-family:'${hlFont}',sans-serif; line-height:1.1; color:${C.text}; }
      .pa { color:${C.accent}; }
      .ps { font-size:${isPortrait?24:20}px; color:${C.sub}; font-family:'${bodyFont}',sans-serif; line-height:1.4; }
      .vs { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:6; width:80px; height:80px; border-radius:50%; background:${C.bg}; border:1.5px solid ${C.accent}44; display:flex; align-items:center; justify-content:center; }
      .vt { font-size:26px; font-weight:900; color:${C.accent}; font-family:'${bodyFont}',sans-serif; }
    `,
    cards: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:${topPad}px 90px ${botPad}px; overflow:hidden; }
      .hl { font-size:${isPortrait?56:46}px; font-weight:800; line-height:1.15; letter-spacing:${hs.letterSpacing}; ${ts} text-align:center; margin-bottom:4px; font-family:'${hlFont}',sans-serif; flex-shrink:0; }
      .cg { width:100%; display:flex; flex-direction:column; gap:${isPortrait?14:9}px; margin-top:20px; overflow:hidden; }
      .card { background:${C.dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)"}; border:1px solid ${C.accent}28; border-radius:10px; padding:${isPortrait?22:14}px 24px; display:flex; align-items:flex-start; gap:16px; flex-shrink:0; }
      .cn { font-size:${isPortrait?28:20}px; font-weight:900; color:${C.accent}; font-family:'${bodyFont}',sans-serif; flex-shrink:0; width:36px; line-height:1; }
      .ct { font-size:${isPortrait?25:19}px; color:${C.text}; font-family:'${bodyFont}',sans-serif; line-height:1.35; font-weight:600; }
      .cs { font-size:${isPortrait?20:16}px; color:${C.sub}; margin-top:2px; font-family:'${bodyFont}',sans-serif; }
    `,
    quote: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:${topPad}px 90px ${botPad}px; text-align:center; overflow:hidden; }

      .hl { font-size:${isPortrait?58:48}px; font-weight:800; line-height:1.15; letter-spacing:${hs.letterSpacing}; ${ts} font-style:italic; font-family:'${hlFont}',sans-serif; }
      .body { font-size:${isPortrait?30:26}px; line-height:1.6; color:${C.sub}; max-width:760px; margin-top:28px; font-family:'${bodyFont}',sans-serif; }
    `,
    hero: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:${topPad}px 90px ${botPad}px; gap:24px; text-align:center; overflow:hidden; }

      .hl { font-size:${isPortrait?58:48}px; font-weight:800; line-height:1.15; letter-spacing:${hs.letterSpacing}; ${ts} font-family:'${hlFont}',sans-serif; }
      .body { font-size:${isPortrait?30:26}px; line-height:1.6; color:${C.sub}; max-width:820px; font-family:'${bodyFont}',sans-serif; }
      .cb { width:100%; max-width:860px; padding:${isPortrait?30:24}px 50px; border-radius:12px; font-size:${isPortrait?28:24}px; font-weight:800; font-family:'${bodyFont}',sans-serif; text-align:center; background:${C.accent}; color:${C.dark?"#000":"#fff"}; }
    `,
  };

  const coverPos = coverPosition || "centre";

  const coverBadgeHTML = `
    <div style="display:inline-flex;align-items:center;gap:14px;background:${pillBg};padding:10px 22px 10px 10px;border-radius:60px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);margin-bottom:24px;">
      <div style="width:80px;height:80px;border-radius:50%;border:3px solid ${C.accent};overflow:hidden;flex-shrink:0;background:${C.dark?"#1a1a1a":"#ddd"};display:flex;align-items:center;justify-content:center;position:relative;">
        ${profileUrl?`<img src="${profileUrl}" crossorigin="anonymous" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100%;height:100%;object-fit:cover;"/>`:`<span style="font-size:32px;font-weight:900;color:${C.accent};font-family:'${hlFont}',sans-serif;">${esc((name||"?")[0].toUpperCase())}</span>`}
      </div>
      <div>
        <div style="font-size:20px;font-weight:800;color:${pillText};line-height:1.2;font-family:'${bodyFont}',sans-serif;">${esc(name||"Your Brand")}${blueTick?` <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:#1D9BF0;border-radius:50%;font-size:10px;color:#fff;margin-left:5px;">✓</span>`:""}</div>
        <div style="font-size:15px;color:${pillSub};font-family:'${bodyFont}',sans-serif;">${esc(handle||"@yourhandle")}</div>
      </div>
    </div>`;

  const coverLayouts = {
    top: `
      .cover-content { position:absolute; top:${isPortrait?200:120}px; left:70px; right:70px; z-index:5; display:flex; flex-direction:column; align-items:center; text-align:center; }
    `,
    centre: `
      .cover-content { position:absolute; top:50%; left:70px; right:70px; transform:translateY(-50%); z-index:5; display:flex; flex-direction:column; align-items:center; text-align:center; }
    `,
    bottom: `
      .cover-content { position:absolute; bottom:${isPortrait?200:120}px; left:70px; right:70px; z-index:5; display:flex; flex-direction:column; align-items:center; text-align:center; }
    `,
  };

  function layoutHTML() {
    if (isCover) {
      const hl = accentHL(slide.headline||"");
      const isCentre = coverPos === "centre";
      return `
        <div class="cover-content">
          ${coverBadgeHTML}
          ${slide.tag ? `<div style="margin-bottom:20px"><span class="tag">${esc(slide.tag.toUpperCase())}</span></div>` : ""}
          <div style="font-size:${isPortrait?80:66}px;font-weight:800;line-height:1.1;letter-spacing:${hs.letterSpacing};${ts}font-family:'${hlFont}',sans-serif;color:${C.text};${isCentre?"text-align:center;":""}width:100%;">${hl}</div>
          ${slide.body ? `<div style="font-size:${isPortrait?32:26}px;line-height:1.6;color:${C.sub};margin-top:24px;font-family:'${bodyFont}',sans-serif;${ts2}${isCentre?"text-align:center;":""}">${esc(slide.body)}</div>` : ""}
        </div>`;
    }

    const hl = accentHL(slide.headline||"");
    const tag = slide.tag ? `<div style="margin-bottom:28px"><span class="tag">${esc(slide.tag.toUpperCase())}</span></div>` : "";
    const divider = `<div class="div" style="margin:28px auto"></div>`;
    const body = slide.body ? `<div class="body">${esc(slide.body)}</div>` : "";

    if (layout==="split" && slide.items?.length >= 2) {
      const [a,b] = slide.items;
      return `<div class="c">
        <div class="split-top">
          ${slide.tag ? `<div style="margin-bottom:16px"><span class="split-tag">${esc(slide.tag.toUpperCase())}</span></div>` : ""}
          <div class="split-hl">${hl}</div>
        </div>
        <div class="split-panels" style="position:relative">
          <div class="panel"><div class="pl pa">${esc(a.label||"")}</div>${a.sub?`<div class="ps">${esc(a.sub)}</div>`:""}</div>
          <div class="vs"><div class="vt">${esc(slide.vs_label||"VS")}</div></div>
          <div class="panel"><div class="pl" style="opacity:0.75">${esc(b.label||"")}</div>${b.sub?`<div class="ps">${esc(b.sub)}</div>`:""}</div>
        </div>
      </div>`;
    }

    if (layout==="cards" && slide.items?.length) {
      return `<div class="c">
        ${tag}<div class="hl">${hl}</div>
        <div class="cg">${slide.items.map((it,i)=>`
          <div class="card">
            <div class="cn">${String(i+1).padStart(2,"0")}</div>
            <div><div class="ct">${esc(it.label||it.text||it.title||it.point||it.content||Object.values(it).find(v=>typeof v==="string"&&v.length>2)||"")}</div>${(it.sub||it.description||it.body)?`<div class="cs">${esc(it.sub||it.description||it.body)}</div>`:""}</div>
          </div>`).join("")}
        </div>
      </div>`;
    }

    if (layout==="hero") {
      const ctaText = slide.cta_items?.[0] || slide.cta || "";
      return `<div class="c">
        ${tag}<div class="hl">${hl}</div>
        ${slide.body?divider+body:""}
        ${ctaText?`<div class="cb">${esc(ctaText)}</div>`:""}
      </div>`;
    }

    if (layout==="quote") {
      return `<div class="c">
        ${tag}<div class="hl">${hl}</div>
        ${slide.body?divider+body:""}
      </div>`;
    }

    const cta = slide.cta ? `<div class="cta">${esc(slide.cta)}</div>` : "";
    return `<div class="c">${tag}<div class="hl">${hl}</div>${slide.body?divider+body:""}${cta}</div>`;
  }

  const hasBg = !!bgImageUrl;
  const overlayAlpha = (overlayDark||65)/100;
  const coverOverlayAlpha = isCover ? Math.max(overlayAlpha, 0.55) : overlayAlpha;
  const bgHtml = hasBg ? `
    <img class="bg-img" src="${bgImageUrl}" crossorigin="anonymous"/>
    <div class="bg-ov" style="background:linear-gradient(to bottom,rgba(0,0,0,${Math.min((isCover?coverOverlayAlpha:overlayAlpha)*0.92,0.92)}) 0%,rgba(0,0,0,${Math.min((isCover?coverOverlayAlpha:overlayAlpha)*0.42,0.55)}) 40%,rgba(0,0,0,${Math.min((isCover?coverOverlayAlpha:overlayAlpha)*0.95,0.92)}) 100%)"></div>` : "";

  const avHtml = profileUrl
    ? `<img src="${profileUrl}" crossorigin="anonymous"/>`
    : `<div class="av-i">${esc((name||"?")[0].toUpperCase())}</div>`;

  const coverStyle = isCover ? coverLayouts[coverPos] || coverLayouts.centre : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>${base}${isCover ? coverStyle : (layouts[layout]||layouts.standard)}</style>
</head><body>
<div class="slide">
  ${bgHtml}
  ${C.dark||hasBg?'<div class="noise"></div>':""}
  <div class="bk tl"></div><div class="bk tr"></div>
  <div class="bk bl"></div><div class="bk br"></div>
  ${C.dark||hasBg||bgMode==="colour"?'<div class="fade"></div>':""}
  ${isCover ? "" : `<div class="badge">
    <div class="av">${avHtml}</div>
    <div>
      <div class="bn">${esc(name||"Your Brand")}${blueTick?` <span class="tick">✓</span>`:""}</div>
      <div class="bh">${esc(handle||"@yourhandle")}</div>
    </div>
  </div>`}
  ${showNums===true?`<div class="wm">${String(idx+1).padStart(2,"0")}</div><div class="cnt">${idx+1} / ${total}</div>`:""}
  ${layoutHTML()}
  ${isCover?'':`<div class="deco"><div class="deco-line"></div><div class="deco-diamond"></div><div class="deco-line"></div></div>`}
  ${websiteUrl?`<div class="site">${esc(websiteUrl)}</div>`:""}
</div>
</body></html>`;
}

// ─── PREVIEW ─────────────────────────────────────────────

function SlidePreview({ slide, idx, total, opts, onClick, isActive, isCover }) {
  const ref = useRef(null);
  const isPortrait = opts.ratio === "portrait";
  const W = 1080, H = isPortrait ? 1920 : 1350;
  const previewW = isPortrait ? 180 : 280;
  const scale = previewW / W;
  const previewH = H * scale;
  const html = buildSlideHTML(slide, idx, total, opts, isCover);

  useEffect(() => {
    const iframe = ref.current; if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open(); doc.write(html); doc.close();
  }, [html]);

  return (
    <div onClick={onClick} title={slide.tag||`Slide ${idx+1}`} style={{ cursor:"pointer", borderRadius:8, overflow:"hidden", border:`2px solid ${isActive?"#0A0A0A":"transparent"}`, transition:"border-color 0.15s", position:"relative", width:previewW, height:previewH, flexShrink:0 }}>
      <iframe ref={ref} style={{ width:W, height:H, border:"none", transform:`scale(${scale})`, transformOrigin:"top left", pointerEvents:"none", display:"block" }} sandbox="allow-same-origin" title={`slide-${idx+1}`}/>

    </div>
  );
}

// ─── DOWNLOAD ────────────────────────────────────────────

async function downloadSlideAsPNG(slide, idx, total, opts, filename, isCover) {
  const isPortrait = opts.ratio === "portrait";
  const W = 1080, H = isPortrait ? 1920 : 1350;
  const html = buildSlideHTML(slide, idx, total, opts, isCover);
  const iframe = document.createElement("iframe");
  iframe.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${W}px;height:${H}px;border:none;`;
  document.body.appendChild(iframe);
  return new Promise((resolve, reject) => {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    doc.open(); doc.write(html); doc.close();
    setTimeout(async () => {
      try {
        const win = iframe.contentWindow;
        await new Promise(r => {
          const s = doc.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
          s.onload = r; s.onerror = r; doc.head.appendChild(s); setTimeout(r, 4000);
        });
        if (!win.html2canvas) throw new Error("html2canvas not loaded");
        const el = doc.querySelector(".slide") || doc.body;
        const canvas = await win.html2canvas(el, { useCORS:true, allowTaint:true, scale:1, width:W, height:H, windowWidth:W, windowHeight:H, backgroundColor:null, logging:false });
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = filename;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          document.body.removeChild(iframe); resolve();
        }, "image/png", 1.0);
      } catch(e) { document.body.removeChild(iframe); reject(e); }
    }, 2500);
  });
}

function QuotePreview({ html, W, H, scale }) {
  const ref = useRef(null);
  useEffect(() => {
    const iframe = ref.current; if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open(); doc.write(html); doc.close();
  }, [html]);
  return <iframe ref={ref} style={{ width:W, height:H, border:"none", transform:`scale(${scale})`, transformOrigin:"top left", pointerEvents:"none", display:"block" }} sandbox="allow-same-origin"/>;
}

// ─── APP ─────────────────────────────────────────────────

export default function App() {
  const S = loadS();

  const [nav, setNav] = useState("generate");

  const [profileUrl, setProfileUrl] = useState(S?.profileUrl||null);
  const [name, setName] = useState(S?.name||"");
  const [handle, setHandle] = useState(S?.handle||"");
  const [blueTick, setBlueTick] = useState(S?.blueTick??false);
  const [website, setWebsite] = useState(S?.website||"");
  const [showWebsite, setShowWebsite] = useState(S?.showWebsite??false);
  const [voiceProfile, setVoiceProfile] = useState(S?.voiceProfile||"");
  const [businessType, setBusinessType] = useState(S?.businessType||"marketer");
  const [otherType, setOtherType] = useState(S?.otherType||"");
  const [coverPhotos, setCoverPhotos] = useState(S?.coverPhotos||[]);
  const [activeCoverPhoto, setActiveCoverPhoto] = useState(S?.activeCoverPhoto||null);
  const [coverPosition, setCoverPosition] = useState(S?.coverPosition||"bottom");
  const [badgeArea, setBadgeArea] = useState(null);

  const [accentSwatch, setAccentSwatch] = useState(S?.accentSwatch||"gold");
  const [accentColor, setAccentColor] = useState(S?.accentColor||GOLD);
  const [fontId, setFontId] = useState(S?.fontId||"montserrat");
  const [headlineStyle, setHeadlineStyle] = useState(S?.headlineStyle||"bold");
  const [showNums, setShowNums] = useState(S?.showNums??false);
  const [bgMode, setBgMode] = useState(S?.bgMode||"dark");
  const [templateBgUrl, setTemplateBgUrl] = useState(S?.templateBgUrl||null);
  const [overlayDark, setOverlayDark] = useState(S?.overlayDark||65);

  const [topic, setTopic] = useState("");
  const [inspirationImg, setInspirationImg] = useState(null);
  const [ratio, setRatio] = useState(S?.ratio||"instagram");
  const [bgColour, setBgColour] = useState(S?.bgColour||"#1a1a2e");
  const [slideCount, setSlideCount] = useState(6);
  const [err, setErr] = useState("");
  const [randomising, setRandomising] = useState(false);

  const [view, setView] = useState("setup");
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);
  const [rewritePrompt, setRewritePrompt] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [lastTopic, setLastTopic] = useState("");
  const [history, setHistory] = useState(loadHistory());

  const [quoteInputs, setQuoteInputs] = useState(["","",""]);
  const [quoteSignature, setQuoteSignature] = useState("");
  const [quoteFont, setQuoteFont] = useState("playfair");
  const [quoteSigFont, setQuoteSigFont] = useState("dancing");
  const [quoteBgMode, setQuoteBgMode] = useState("dark");
  const [quoteBgCustomUrl, setQuoteBgCustomUrl] = useState(null);
  const [quoteOverlay, setQuoteOverlay] = useState(0);
  const [quoteTemplate, setQuoteTemplate] = useState("classic");
  const [luxuryLabel, setLuxuryLabel] = useState("wisdom");
  const [showHandle, setShowHandle] = useState(true);
  const [quoteFormat, setQuoteFormat] = useState("instagram");
  const [generatingQuotes, setGeneratingQuotes] = useState(false);
  const [quoteSlides, setQuoteSlides] = useState([]);
  const [downloadingQuotes, setDownloadingQuotes] = useState(false);
  const [slideOverlays, setSlideOverlays] = useState({});
  const [coverImgPos, setCoverImgPos] = useState({x:50,y:50});
  const [templateImgPos, setTemplateImgPos] = useState({x:50,y:50});
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);
  const profileRef = useRef(null);
  const coverDragRef = useRef(null);
  const templateDragRef = useRef(null);
  const coverPhotoRef = useRef(null);
  const templateBgRef = useRef(null);
  const inspirationRef = useRef(null);
  const quoteBgRef = useRef(null);

  useEffect(() => {
    saveS({profileUrl,name,handle,blueTick,website,showWebsite,voiceProfile,businessType,otherType,
           coverPhotos,activeCoverPhoto,coverPosition,accentSwatch,accentColor,fontId,headlineStyle,showNums,
           bgMode,templateBgUrl,overlayDark,ratio,bgColour});
  }, [profileUrl,name,handle,blueTick,website,showWebsite,voiceProfile,businessType,otherType,
      coverPhotos,activeCoverPhoto,coverPosition,accentSwatch,accentColor,fontId,headlineStyle,showNums,
      bgMode,templateBgUrl,overlayDark,ratio,bgColour]);

  const readFile = (e, cb) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => cb(ev.target.result);
    r.readAsDataURL(f);
  };

  const addCoverPhoto = (url) => {
    const next = [url, ...coverPhotos].slice(0, 8);
    setCoverPhotos(next);
    setActiveCoverPhoto(url);
    sampleImageBrightness(url).then(setBadgeArea);
  };

  const fetchWithRetry = async (body, tries=4) => {
    for (let i=0; i<=tries; i++) {
      try {
        const res = await fetch("/api/generate", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`${res.status}`);
        return await res.json();
      } catch(e) { if(i===tries) throw e; await new Promise(r=>setTimeout(r, 2000+i*1000)); }
    }
  };

  const sanitize = s => ({
    tag: (s.tag||"").replace(/<[^>]+>/g,"").trim(),
    headline: (s.headline||"").replace(/<[^>]+>/g,"").trim(),
    body: (s.body||"").replace(/<[^>]+>/g,"").trim(),
    accent_word: (s.accent_word||"").replace(/<[^>]+>/g,"").trim(),
    cta: (s.cta||"").replace(/<[^>]+>/g,"").trim()||null,
    layout: s.layout === "hero" ? "hero" : s.layout === "statement" ? "statement" : "standard",
    items: Array.isArray(s.items)?s.items:[],
    vs_label: s.vs_label||"VS",
    icon_symbol: s.icon_symbol||"◆",
    cta_items: Array.isArray(s.cta_items)?s.cta_items.map(c=>String(c)):[],
  });

  const buildPrompt = (topicStr, imgBase64) => {
    const btLabel = businessType==="other"?(otherType||"brand"):BUSINESS_TYPES.find(b=>b.id===businessType)?.label||"Digital Marketer";
    const voice = voiceProfile || `Write for a ${btLabel}. Direct, specific, speak to real problems. No hype.`;
    const inspiration = imgBase64 ? `\nINSPIRATION IMAGE: I've attached a screenshot of a carousel I like. Analyse the topic, hook angle and energy — then recreate it in my voice with fresh content. Don't copy, just match the quality and angle.` : "";
    const styles = [
      "myth-busting: challenge a common belief head-on, use data or logic to flip it",
      "story-driven: open with a relatable scenario, build tension, then resolve with insight",
      "contrarian: take the position most people disagree with and defend it with evidence",
      "data-driven: lead with a surprising stat or number on every slide, back every claim",
      "step-by-step: practical, sequential, each slide one concrete action",
      "empathetic: speak directly to the frustration, validate it, then reframe it",
    ];
    const style = styles[Math.floor(Math.random()*styles.length)];
    return `You are creating an Instagram carousel for a ${btLabel}.
You are the copywriter AND creative director. Every slide must earn its place.

VOICE: ${voice}
TOPIC: "${topicStr}"${inspiration}
SLIDES: ${slideCount}
NARRATIVE STYLE: ${style}

NARRATIVE ARC: hook → reality → insight → shift → advice → CTA

LAYOUT SYSTEM:
- "statement" — Bold headline, no body. ALWAYS use for slide 1. Make it provocative. Stop the scroll.
- "standard" — headline + body. Use for ALL middle slides. Body is where the value lives.
- "hero" — headline + body + CTA. ALWAYS final slide. Add "cta_items":["one CTA only"].

DO NOT use "split" or "cards" layouts. Write lists and comparisons as body text instead.

RULES:
- No two consecutive slides same layout
- Slide 1 always "statement"
- Final slide always "hero" with exactly one cta_items string
- Pick ONE accent word per headline — exact match — put in "accent_word"
- Tags: editorial and specific. NOT "HOOK", "SLIDE 1", "CTA"
- Headlines: max 10 words. A clear statement, question, or insight. Think subheading not billboard.
- Body: REQUIRED on every slide except hero. 1-2 sentences MAX. One sharp insight, specific stat, or actionable point. Make them think "I didn't know that" or "I'll try that." No fluff.
- Final slide (hero) CTA: MUST have body text (1-2 sentences reinforcing why they should act — e.g. "If this changed how you see your budget, there's more where that came from." or "Most people scroll past. The ones who save it are the ones who act on it."). Then cta_items with ONE of: "Follow for more like this", "Save this so you can come back to it", "Share this with someone who needs to hear it", "Comment below — does this match your experience?", "Follow if this made you think differently". Never invent a download, product, or link.
- No two consecutive slides same layout
- Only final slide gets cta. All others cta is null.
- No HTML, no cite tags, plain text only
- NO invented statistics or fabricated data. If using a stat, only use well-known established facts. Otherwise frame as principle or observation.

Return ONLY valid JSON array:
[{"tag":"LABEL","headline":"text","body":"text","accent_word":"word","layout":"type","items":[],"vs_label":"VS","icon_symbol":"◆","cta_items":[],"cta":null}]`;
  };

  const generate = async (topicOverride) => {
    const t = topicOverride || topic;
    if (!t.trim()) { setErr("Add a topic first."); return; }
    setErr(""); setView("generating"); setLastTopic(t);

    try {
      const messages = [{
        role: "user",
        content: inspirationImg
          ? [
              { type:"image", source:{ type:"base64", media_type:"image/jpeg", data: inspirationImg.split(",")[1] }},
              { type:"text", text: buildPrompt(t, inspirationImg) }
            ]
          : buildPrompt(t, null)
      }];

      const d = await fetchWithRetry({ model:"claude-sonnet-4-6", max_tokens:3000, messages });
      const raw = d.content?.find(b=>b.type==="text")?.text||"";
      const clean = raw.replace(/<cite[^>]*>/g,"").replace(/<\/cite>/g,"").replace(/<[^>]+>/g,"");
      const m = clean.match(/\[[\s\S]*\]/);
      if (!m) throw new Error("no json");
      const parsed = JSON.parse(m[0]).map(sanitize);
      const newSlides = parsed.map((s, i) => ({
        ...s,
        layout: i === 0 ? "statement" : i === parsed.length - 1 ? "hero" : "standard"
      }));
      setSlides(newSlides); setActive(0); setView("preview");

      const entry = { id: Date.now(), topic: t, slides: newSlides, date: new Date().toLocaleDateString() };
      const newHistory = [entry, ...history].slice(0, 10);
      setHistory(newHistory); saveHistory(newHistory);

    } catch { setErr("Generation failed — please try again."); setView("setup"); }
  };

  const randomiseTopic = async () => {
    setRandomising(true);
    const btLabel = businessType==="other"?(otherType||"brand"):BUSINESS_TYPES.find(b=>b.id===businessType)?.label||"Digital Marketer";
    try {
      const angles = ["a surprising myth to bust","a counterintuitive truth most people get wrong","a specific mistake that costs people money or time","a data point that would shock most people","a common belief that is completely backwards","a simple shift that changes everything","something everyone does that quietly holds them back","a question nobody is asking but should be"];
      const angle = angles[Math.floor(Math.random()*angles.length)];
      const d = await fetchWithRetry({ model:"claude-sonnet-4-6", max_tokens:80, messages:[{ role:"user", content:`You are a creative director for social media. Give me ONE punchy Instagram carousel topic for a ${btLabel} — specifically about ${angle}. Voice: ${voiceProfile||"direct, honest, no hype"}. Make it specific, not generic. Return ONLY the topic, no explanation, no quotes, max 12 words.` }] });
      const idea = d.content?.find(b=>b.type==="text")?.text?.trim()||"";
      if (idea) setTopic(idea);
    } catch {}
    setRandomising(false);
  };

  const rewrite = async () => {
    if (!rewritePrompt.trim()) return; setRewriting(true);
    try {
      const d = await fetchWithRetry({ model:"claude-sonnet-4-6", max_tokens:600, messages:[{ role:"user", content:`Rewrite this carousel slide: "${rewritePrompt}"\n\nCurrent:\n${JSON.stringify(slides[active],null,2)}\n\nVoice: ${voiceProfile||"Direct, honest, specific."}\n\nReturn ONLY a JSON object with same structure. No markdown, no HTML.` }] });
      const raw = (d.content?.find(b=>b.type==="text")?.text||"").replace(/<[^>]+>/g,"");
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { const next=[...slides]; next[active]=sanitize(JSON.parse(m[0])); setSlides(next); setRewritePrompt(""); }
    } catch {}
    setRewriting(false);
  };

  const updateSlide = (k,v) => { const next=[...slides]; next[active]={...next[active],[k]:v}; setSlides(next); };

  const handleDrag = (e, setter, containerRef) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setter({x: Math.round(x), y: Math.round(y)});
  };

  const slideOpts = useCallback(() => ({
    fontId, headlineStyle, bgMode, templateBgUrl, overlayDark,
    coverImageUrl: activeCoverPhoto, coverPosition, badgeArea,
    profileUrl, name, handle, blueTick,
    websiteUrl: showWebsite?website:"",
    showNums, ratio, accentColor, bgColour,
    coverImgPos, templateImgPos,
  }), [fontId,headlineStyle,bgMode,templateBgUrl,overlayDark,activeCoverPhoto,coverPosition,badgeArea,profileUrl,name,handle,blueTick,website,showWebsite,showNums,ratio,accentColor,coverImgPos,templateImgPos,bgColour]);

  const downloadOne = async (i) => {
    setDownloading(true);
    try {
      await downloadSlideAsPNG(slides[i], i, slides.length, slideOpts(), `slide-${i+1}.png`, i===0);
      setDownloadDone(true); setTimeout(()=>setDownloadDone(false), 2000);
    } catch(e) { console.error(e); alert("Download failed — try again."); }
    setDownloading(false);
  };

  const downloadAll = async () => {
    setDownloadingAll(true);
    for (let i=0; i<slides.length; i++) {
      try { await downloadSlideAsPNG(slides[i], i, slides.length, slideOpts(), `slide-${i+1}.png`, i===0); await new Promise(r=>setTimeout(r,600)); }
      catch(e) { console.error(e); }
    }
    setDownloadingAll(false); setDownloadDone(true); setTimeout(()=>setDownloadDone(false), 2500);
  };

  const generateQuotes = async () => {
    setGeneratingQuotes(true);
    const btLabel = businessType==="other"?(otherType||"brand"):BUSINESS_TYPES.find(b=>b.id===businessType)?.label||"Digital Marketer";
    const emptyCount = quoteInputs.filter(q=>!q.trim()).length;
    const needed = emptyCount || 3;
    try {
      const d = await fetchWithRetry({ model:"claude-sonnet-4-6", max_tokens:400, messages:[{ role:"user", content:`Generate ${needed} short, powerful quotes for a ${btLabel}. Voice: ${voiceProfile||"direct, honest, real"}. Return ONLY a JSON array of ${needed} strings. No attribution, no author names, max 15 words each.` }] });
      const raw = (d.content?.find(b=>b.type==="text")?.text||"").replace(/<[^>]+>/g,"");
      const m = raw.match(/\[[\s\S]*\]/);
      if (m) {
        const generated = JSON.parse(m[0]);
        const next = [...quoteInputs];
        let gi = 0;
        for (let i=0; i<next.length && gi<generated.length; i++) {
          if (!next[i].trim()) { next[i] = generated[gi++]; }
        }
        setQuoteInputs(next);
      }
    } catch {}
    setGeneratingQuotes(false);
  };

  const buildQuoteHTML = (quoteText, sig) => {
    const accent = accentColor || GOLD;
    const isDark = quoteBgMode !== "light";
    const hasBgImg = quoteBgMode === "custom" && quoteBgCustomUrl;
    const bg = isDark ? "#0d0b08" : "#F8F4EE";
    const textColor = hasBgImg ? "#FFFFFF" : (isDark ? "#F5EDE0" : "#1a1208");
    const subColor = hasBgImg ? "rgba(255,255,255,0.85)" : (isDark ? "rgba(245,237,224,0.7)" : "rgba(26,18,8,0.55)");
    const textShadow = hasBgImg ? "text-shadow:0 2px 24px rgba(0,0,0,0.95),0 1px 8px rgba(0,0,0,0.8);" : "";
    const fontObj = FONTS.find(f => f.id === quoteFont) || FONTS[1];
    const sigFontObj = FONTS.find(f => f.id === quoteSigFont) || FONTS[5];
    const font = fontObj.css;
    const sigFont = sigFontObj.css;
    const isPortrait = quoteFormat === "portrait";
    const W = 1080, H = isPortrait ? 1920 : 1350;
    const gFonts = `https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Poppins:wght@400;700;800;900&family=Inter:wght@400;700;800;900&family=Oswald:wght@600;700&family=Dancing+Script:wght@400;600;700&display=swap`;
    const signature = sig || quoteSignature || name || "";
    const esc = s => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const escapedQuote = esc(quoteText||"").replace(/\n/g,"<br/>");
    const handleStr = handle ? (handle.startsWith("@")?handle:"@"+handle) : "";
    const tmpl = hasBgImg ? "custom" : (quoteTemplate || "classic");
    const luxAccent = isDark ? "#C9A84C" : "#8B6914";

    const s = isPortrait ? 1.4 : 1;
    const brd = Math.round(28*s);
    const brd2 = Math.round(44*s);
    const cornerSz = Math.round(90*s);
    const dotSz = Math.round(18*s);
    const sigSz = Math.round(44*s);
    const quoteSz = Math.round(68*s);
    const handleBottom = Math.round(55*s);
    const padX = Math.round(120*s);
    const padTop = Math.round(180*s);
    const padBottom = Math.round(200*s);

    const frameBorder = Math.round(54*s);
    const classicHTML = `
      <div style="position:absolute;inset:0;border:${frameBorder}px solid ${accent};z-index:3;pointer-events:none;"></div>
      <div style="position:absolute;top:${frameBorder+Math.round(12*s)}px;left:${frameBorder+Math.round(12*s)}px;width:${cornerSz}px;height:${cornerSz}px;border-top:${Math.round(4*s)}px solid ${accent};border-left:${Math.round(4*s)}px solid ${accent};z-index:4;pointer-events:none;opacity:0.55;"></div>
      <div style="position:absolute;top:${frameBorder+Math.round(12*s)}px;right:${frameBorder+Math.round(12*s)}px;width:${cornerSz}px;height:${cornerSz}px;border-top:${Math.round(4*s)}px solid ${accent};border-right:${Math.round(4*s)}px solid ${accent};z-index:4;pointer-events:none;opacity:0.55;"></div>
      <div style="position:absolute;bottom:${frameBorder+Math.round(12*s)}px;left:${frameBorder+Math.round(12*s)}px;width:${cornerSz}px;height:${cornerSz}px;border-bottom:${Math.round(4*s)}px solid ${accent};border-left:${Math.round(4*s)}px solid ${accent};z-index:4;pointer-events:none;opacity:0.55;"></div>
      <div style="position:absolute;bottom:${frameBorder+Math.round(12*s)}px;right:${frameBorder+Math.round(12*s)}px;width:${cornerSz}px;height:${cornerSz}px;border-bottom:${Math.round(4*s)}px solid ${accent};border-right:${Math.round(4*s)}px solid ${accent};z-index:4;pointer-events:none;opacity:0.55;"></div>`;
    const classicDivider = `
      <div style="display:flex;align-items:center;gap:${Math.round(28*s)}px;width:75%;justify-content:center;margin-bottom:${Math.round(52*s)}px;">
        <div style="flex:1;height:${Math.round(2.5*s)}px;background:${accent};opacity:0.7;"></div>
        <div style="width:${Math.round(22*s)}px;height:${Math.round(22*s)}px;background:${accent};transform:rotate(45deg);"></div>
        <div style="flex:1;height:${Math.round(2.5*s)}px;background:${accent};opacity:0.7;"></div>
      </div>`;
    const classicHandle = showHandle&&handleStr ? `
      <div style="position:absolute;bottom:${Math.round(100*s)}px;left:0;right:0;text-align:center;z-index:6;">
        <span style="color:${subColor};font-size:${Math.round(24*s)}px;font-family:'${sigFont}',cursive,serif;letter-spacing:${Math.round(3*s)}px;opacity:0.7;">${esc(handleStr)}</span>
      </div>` : "";

    const luxuryHTML = `
      <div style="position:absolute;inset:0;opacity:0.05;background-image:repeating-linear-gradient(45deg,${luxAccent} 0px,${luxAccent} 1px,transparent 1px,transparent ${Math.round(16*s)}px),repeating-linear-gradient(-45deg,${luxAccent} 0px,${luxAccent} 1px,transparent 1px,transparent ${Math.round(16*s)}px);pointer-events:none;z-index:1;"></div>
      <div style="position:absolute;inset:${brd}px;border:${Math.round(3*s)}px solid ${luxAccent};opacity:0.8;border-radius:${Math.round(4*s)}px;pointer-events:none;z-index:2;"></div>
      <div style="position:absolute;inset:${brd2}px;border:${Math.round(1.5*s)}px solid ${luxAccent};opacity:0.25;border-radius:${Math.round(3*s)}px;pointer-events:none;z-index:2;"></div>
      <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;" viewBox="0 0 ${W} ${H}" fill="none">
        <path d="M${brd} ${brd} L${brd+cornerSz} ${brd} M${brd} ${brd} L${brd} ${brd+cornerSz}" stroke="${luxAccent}" stroke-width="${Math.round(5*s)}" opacity="0.9"/>
        <path d="M${brd} ${brd} Q${brd+cornerSz*0.7} ${brd+cornerSz*0.7} ${brd+cornerSz*1.1} ${brd+cornerSz*0.5}" stroke="${luxAccent}" stroke-width="${Math.round(2*s)}" opacity="0.4" stroke-linecap="round"/>
        <path d="M${brd} ${brd} Q${brd+cornerSz*0.5} ${brd+cornerSz*1.1} ${brd+cornerSz*0.5} ${brd+cornerSz*1.4}" stroke="${luxAccent}" stroke-width="${Math.round(2*s)}" opacity="0.4" stroke-linecap="round"/>
        <circle cx="${brd}" cy="${brd}" r="${Math.round(10*s)}" fill="${luxAccent}" opacity="0.95"/>
        <circle cx="${brd+cornerSz}" cy="${brd}" r="${Math.round(6*s)}" fill="${luxAccent}" opacity="0.6"/>
        <circle cx="${brd}" cy="${brd+cornerSz}" r="${Math.round(6*s)}" fill="${luxAccent}" opacity="0.6"/>
        <path d="M${W-brd} ${brd} L${W-brd-cornerSz} ${brd} M${W-brd} ${brd} L${W-brd} ${brd+cornerSz}" stroke="${luxAccent}" stroke-width="${Math.round(5*s)}" opacity="0.9"/>
        <path d="M${W-brd} ${brd} Q${W-brd-cornerSz*0.7} ${brd+cornerSz*0.7} ${W-brd-cornerSz*1.1} ${brd+cornerSz*0.5}" stroke="${luxAccent}" stroke-width="${Math.round(2*s)}" opacity="0.4" stroke-linecap="round"/>
        <circle cx="${W-brd}" cy="${brd}" r="${Math.round(10*s)}" fill="${luxAccent}" opacity="0.95"/>
        <circle cx="${W-brd-cornerSz}" cy="${brd}" r="${Math.round(6*s)}" fill="${luxAccent}" opacity="0.6"/>
        <circle cx="${W-brd}" cy="${brd+cornerSz}" r="${Math.round(6*s)}" fill="${luxAccent}" opacity="0.6"/>
        <path d="M${brd} ${H-brd} L${brd+cornerSz} ${H-brd} M${brd} ${H-brd} L${brd} ${H-brd-cornerSz}" stroke="${luxAccent}" stroke-width="${Math.round(5*s)}" opacity="0.9"/>
        <path d="M${brd} ${H-brd} Q${brd+cornerSz*0.7} ${H-brd-cornerSz*0.7} ${brd+cornerSz*1.1} ${H-brd-cornerSz*0.5}" stroke="${luxAccent}" stroke-width="${Math.round(2*s)}" opacity="0.4" stroke-linecap="round"/>
        <circle cx="${brd}" cy="${H-brd}" r="${Math.round(10*s)}" fill="${luxAccent}" opacity="0.95"/>
        <circle cx="${brd+cornerSz}" cy="${H-brd}" r="${Math.round(6*s)}" fill="${luxAccent}" opacity="0.6"/>
        <circle cx="${brd}" cy="${H-brd-cornerSz}" r="${Math.round(6*s)}" fill="${luxAccent}" opacity="0.6"/>
        <path d="M${W-brd} ${H-brd} L${W-brd-cornerSz} ${H-brd} M${W-brd} ${H-brd} L${W-brd} ${H-brd-cornerSz}" stroke="${luxAccent}" stroke-width="${Math.round(5*s)}" opacity="0.9"/>
        <path d="M${W-brd} ${H-brd} Q${W-brd-cornerSz*0.7} ${H-brd-cornerSz*0.7} ${W-brd-cornerSz*1.1} ${H-brd-cornerSz*0.5}" stroke="${luxAccent}" stroke-width="${Math.round(2*s)}" opacity="0.4" stroke-linecap="round"/>
        <circle cx="${W-brd}" cy="${H-brd}" r="${Math.round(10*s)}" fill="${luxAccent}" opacity="0.95"/>
        <circle cx="${W-brd-cornerSz}" cy="${H-brd}" r="${Math.round(6*s)}" fill="${luxAccent}" opacity="0.6"/>
        <circle cx="${W-brd}" cy="${H-brd-cornerSz}" r="${Math.round(6*s)}" fill="${luxAccent}" opacity="0.6"/>
        <line x1="${W*0.3}" y1="${brd}" x2="${W*0.42}" y2="${brd}" stroke="${luxAccent}" stroke-width="${Math.round(2.5*s)}" opacity="0.7"/>
        <polygon points="${W/2},${brd-Math.round(10*s)} ${W/2+Math.round(10*s)},${brd} ${W/2},${brd+Math.round(10*s)} ${W/2-Math.round(10*s)},${brd}" fill="${luxAccent}" opacity="0.95"/>
        <line x1="${W*0.58}" y1="${brd}" x2="${W*0.7}" y2="${brd}" stroke="${luxAccent}" stroke-width="${Math.round(2.5*s)}" opacity="0.7"/>
        <circle cx="${W*0.42}" cy="${brd}" r="${Math.round(6*s)}" fill="${luxAccent}" opacity="0.7"/>
        <circle cx="${W*0.58}" cy="${brd}" r="${Math.round(6*s)}" fill="${luxAccent}" opacity="0.7"/>
        <line x1="${W*0.3}" y1="${H-brd}" x2="${W*0.42}" y2="${H-brd}" stroke="${luxAccent}" stroke-width="${Math.round(2.5*s)}" opacity="0.7"/>
        <polygon points="${W/2},${H-brd-Math.round(10*s)} ${W/2+Math.round(10*s)},${H-brd} ${W/2},${H-brd+Math.round(10*s)} ${W/2-Math.round(10*s)},${H-brd}" fill="${luxAccent}" opacity="0.95"/>
        <line x1="${W*0.58}" y1="${H-brd}" x2="${W*0.7}" y2="${H-brd}" stroke="${luxAccent}" stroke-width="${Math.round(2.5*s)}" opacity="0.7"/>
        <circle cx="${W*0.42}" cy="${H-brd}" r="${Math.round(6*s)}" fill="${luxAccent}" opacity="0.7"/>
        <circle cx="${W*0.58}" cy="${H-brd}" r="${Math.round(6*s)}" fill="${luxAccent}" opacity="0.7"/>
      </svg>`;
    const luxuryDivider = `
      <div style="display:flex;align-items:center;gap:${Math.round(14*s)}px;justify-content:center;margin-bottom:${Math.round(52*s)}px;">
        <div style="width:${Math.round(60*s)}px;height:${Math.round(2*s)}px;background:${luxAccent};opacity:0.7;"></div>
        <div style="width:${Math.round(10*s)}px;height:${Math.round(10*s)}px;background:${luxAccent};transform:rotate(45deg);opacity:0.85;"></div>
        <div style="width:${Math.round(30*s)}px;height:${Math.round(2*s)}px;background:${luxAccent};opacity:0.5;"></div>
        <div style="width:${Math.round(16*s)}px;height:${Math.round(16*s)}px;background:${luxAccent};transform:rotate(45deg);"></div>
        <div style="width:${Math.round(30*s)}px;height:${Math.round(2*s)}px;background:${luxAccent};opacity:0.5;"></div>
        <div style="width:${Math.round(10*s)}px;height:${Math.round(10*s)}px;background:${luxAccent};transform:rotate(45deg);opacity:0.85;"></div>
        <div style="width:${Math.round(60*s)}px;height:${Math.round(2*s)}px;background:${luxAccent};opacity:0.7;"></div>
      </div>`;
    const luxuryHandle = showHandle&&handleStr ? `
      <div style="position:absolute;bottom:${Math.round(100*s)}px;left:0;right:0;text-align:center;z-index:6;">
        <span style="color:${luxAccent};font-size:${Math.round(24*s)}px;font-family:'${sigFont}',cursive,serif;letter-spacing:${Math.round(4*s)}px;opacity:0.65;">${esc(handleStr)}</span>
      </div>` : "";

    const femBg = isDark ? "#0e0c0c" : "#FAF6F2";
    const femAccent = accent;
    const femText = isDark ? "#f5ede8" : "#3a2520";
    const femSub = isDark ? `rgba(${isDark?"245,237,232":"58,37,32"},0.7)` : "rgba(58,37,32,0.6)";
    const leafColor = isDark ? accent : "#b08878";
    const leafFill = isDark ? "#2a2010" : "#e8b4a8";

    const femBorder = Math.round(100*s);
    const feminineHTML = `
      <div style="position:absolute;inset:${femBorder}px ${femBorder}px ${Math.round(120*s)}px;border:${Math.round(2*s)}px solid ${femAccent};opacity:0.55;border-radius:${Math.round(4*s)}px;pointer-events:none;z-index:2;"></div>
      <div style="position:absolute;inset:${femBorder+Math.round(12*s)}px ${femBorder+Math.round(12*s)}px ${Math.round(130*s)}px;border:${Math.round(1*s)}px solid ${femAccent};opacity:0.18;border-radius:${Math.round(3*s)}px;pointer-events:none;z-index:2;"></div>
      <div style="position:absolute;top:${femBorder}px;left:50%;transform:translateX(-50%);width:${Math.round(180*s)}px;height:${Math.round(4*s)}px;background:${femAccent};z-index:4;pointer-events:none;opacity:0.7;"></div>
      <div style="position:absolute;bottom:${Math.round(120*s)}px;left:50%;transform:translateX(-50%);width:${Math.round(180*s)}px;height:${Math.round(4*s)}px;background:${femAccent};z-index:4;pointer-events:none;opacity:0.5;"></div>
      <div style="position:absolute;top:${Math.round(femBorder-9*s)}px;left:${Math.round(femBorder-9*s)}px;width:${Math.round(18*s)}px;height:${Math.round(18*s)}px;background:${femAccent};transform:rotate(45deg);z-index:5;pointer-events:none;opacity:0.85;"></div>
      <div style="position:absolute;top:${Math.round(femBorder-9*s)}px;right:${Math.round(femBorder-9*s)}px;width:${Math.round(18*s)}px;height:${Math.round(18*s)}px;background:${femAccent};transform:rotate(45deg);z-index:5;pointer-events:none;opacity:0.85;"></div>
      <div style="position:absolute;bottom:${Math.round(120-9*s)}px;left:${Math.round(femBorder-9*s)}px;width:${Math.round(18*s)}px;height:${Math.round(18*s)}px;background:${femAccent};transform:rotate(45deg);z-index:5;pointer-events:none;opacity:0.7;"></div>
      <div style="position:absolute;bottom:${Math.round(120-9*s)}px;right:${Math.round(femBorder-9*s)}px;width:${Math.round(18*s)}px;height:${Math.round(18*s)}px;background:${femAccent};transform:rotate(45deg);z-index:5;pointer-events:none;opacity:0.7;"></div>
      <svg style="position:absolute;top:0;left:0;width:48%;height:48%;pointer-events:none;z-index:1;opacity:${isDark?0.65:0.75};" viewBox="0 0 120 140" fill="none">
        <path d="M0 0 Q22 12 32 34 Q42 56 20 64" stroke="${leafColor}" stroke-width="${Math.round(2.5*s)}" stroke-linecap="round" opacity="0.55"/>
        <path d="M4 0 Q26 22 36 48" stroke="${leafColor}" stroke-width="${Math.round(1.5*s)}" stroke-linecap="round" opacity="0.4"/>
        <ellipse cx="18" cy="22" rx="22" ry="11" transform="rotate(-40 18 22)" fill="${leafFill}" opacity="${isDark?0.7:0.45}"/>
        <ellipse cx="18" cy="22" rx="22" ry="11" transform="rotate(-40 18 22)" fill="none" stroke="${leafColor}" stroke-width="0.8" opacity="${isDark?0.5:0.3}"/>
        <ellipse cx="8" cy="40" rx="20" ry="10" transform="rotate(-62 8 40)" fill="${leafFill}" opacity="${isDark?0.6:0.38}"/>
        <ellipse cx="32" cy="16" rx="18" ry="9" transform="rotate(-22 32 16)" fill="${leafFill}" opacity="${isDark?0.55:0.35}"/>
        <ellipse cx="22" cy="56" rx="24" ry="12" transform="rotate(-52 22 56)" fill="${leafFill}" opacity="${isDark?0.5:0.3}"/>
        <path d="M44 4 Q60 16 54 38 Q48 54 32 58" stroke="${leafColor}" stroke-width="${Math.round(1.5*s)}" stroke-linecap="round" opacity="0.35"/>
        <circle cx="28" cy="4" r="${Math.round(4*s)}" fill="${leafColor}" opacity="0.55"/>
        <circle cx="34" cy="2" r="${Math.round(3*s)}" fill="${leafColor}" opacity="0.45"/>
        <circle cx="22" cy="3" r="${Math.round(3*s)}" fill="${leafColor}" opacity="0.4"/>
        <line x1="28" y1="4" x2="28" y2="16" stroke="${leafColor}" stroke-width="1.2" opacity="0.4"/>
        <line x1="34" y1="2" x2="32" y2="14" stroke="${leafColor}" stroke-width="1.2" opacity="0.35"/>
        <line x1="22" y1="3" x2="24" y2="14" stroke="${leafColor}" stroke-width="1.2" opacity="0.35"/>
      </svg>
      <svg style="position:absolute;bottom:0;right:0;width:50%;height:46%;pointer-events:none;z-index:1;opacity:${isDark?0.6:0.7};" viewBox="0 0 130 120" fill="none">
        <path d="M130 120 Q108 98 86 93 Q64 88 60 66" stroke="${leafColor}" stroke-width="${Math.round(2.5*s)}" stroke-linecap="round" opacity="0.55"/>
        <ellipse cx="108" cy="110" rx="24" ry="11" transform="rotate(42 108 110)" fill="${leafFill}" opacity="${isDark?0.7:0.45}"/>
        <ellipse cx="108" cy="110" rx="24" ry="11" transform="rotate(42 108 110)" fill="none" stroke="${leafColor}" stroke-width="0.8" opacity="${isDark?0.45:0.28}"/>
        <ellipse cx="120" cy="96" rx="22" ry="10" transform="rotate(22 120 96)" fill="${leafFill}" opacity="${isDark?0.62:0.4}"/>
        <ellipse cx="88" cy="102" rx="26" ry="12" transform="rotate(56 88 102)" fill="${leafFill}" opacity="${isDark?0.55:0.35}"/>
        <ellipse cx="74" cy="90" rx="22" ry="10" transform="rotate(38 74 90)" fill="${leafFill}" opacity="${isDark?0.48:0.3}"/>
        <circle cx="112" cy="118" r="${Math.round(4*s)}" fill="${leafColor}" opacity="0.55"/>
        <circle cx="120" cy="114" r="${Math.round(3*s)}" fill="${leafColor}" opacity="0.45"/>
        <circle cx="106" cy="116" r="${Math.round(3*s)}" fill="${leafColor}" opacity="0.4"/>
        <line x1="112" y1="118" x2="112" y2="106" stroke="${leafColor}" stroke-width="1.2" opacity="0.4"/>
        <line x1="120" y1="114" x2="117" y2="102" stroke="${leafColor}" stroke-width="1.2" opacity="0.35"/>
      </svg>
      <div style="position:absolute;top:${Math.round(femBorder+20*s)}px;left:50%;transform:translateX(-50%);width:${Math.round(W*0.65)}px;height:${Math.round((H-femBorder*2-Math.round(140*s))*0.85)}px;border:${Math.round(1.5*s)}px solid ${femAccent};border-radius:${Math.round(W*0.33)}px ${Math.round(W*0.33)}px 38% 38% / 42% 42% 28% 28%;pointer-events:none;z-index:2;opacity:0.45;"></div>`;
    const feminineDivider = `
      <div style="display:flex;align-items:center;gap:${Math.round(16*s)}px;justify-content:center;margin-bottom:${Math.round(52*s)}px;">
        <div style="width:${Math.round(70*s)}px;height:${Math.round(1.5*s)}px;background:${femAccent};opacity:0.5;"></div>
        <svg width="${Math.round(28*s)}" height="${Math.round(24*s)}" viewBox="0 0 28 24" fill="${femAccent}" opacity="0.85"><path d="M14 23C14 23 1 14 1 7A6.5 6.5 0 0114 4 6.5 6.5 0 0127 7C27 14 14 23 14 23Z"/></svg>
        <div style="width:${Math.round(70*s)}px;height:${Math.round(1.5*s)}px;background:${femAccent};opacity:0.5;"></div>
      </div>`;
    const feminineHandle = showHandle&&handleStr ? `
      <div style="position:absolute;bottom:${Math.round(150*s)}px;left:0;right:0;text-align:center;z-index:10;">
        <span style="color:${femAccent};font-size:${Math.round(24*s)}px;font-family:'${sigFont}',cursive,serif;letter-spacing:${Math.round(2*s)}px;opacity:0.65;">${esc(handleStr)}</span>
      </div>` : "";

    const rawTextC = isDark ? "#FFFFFF" : "#0A0A0A";
    const rawHTML = `
      <div style="position:absolute;top:${Math.round(24*s)}px;left:${Math.round(24*s)}px;right:${Math.round(24*s)}px;height:${Math.round(18*s)}px;background:${rawTextC};z-index:3;pointer-events:none;border-radius:${Math.round(2*s)}px;"></div>
      <div style="position:absolute;bottom:${Math.round(90*s)}px;left:${Math.round(24*s)}px;right:${Math.round(24*s)}px;height:${Math.round(6*s)}px;background:${rawTextC};opacity:0.5;z-index:3;pointer-events:none;border-radius:${Math.round(2*s)}px;"></div>
      <div style="position:absolute;top:${Math.round(68*s)}px;left:${Math.round(24*s)}px;bottom:${Math.round(120*s)}px;width:${Math.round(10*s)}px;background:${accent};z-index:3;pointer-events:none;"></div>`;
    const rawDivider = `
      <div style="width:100%;height:${Math.round(2*s)}px;background:${rawTextC};opacity:0.12;margin-bottom:${Math.round(52*s)}px;"></div>`;
    const rawLabel = `
      <div style="margin-bottom:${Math.round(32*s)}px;width:100%;padding-left:${Math.round(20*s)}px;">
        <span style="font-size:${Math.round(22*s)}px;letter-spacing:${Math.round(10*s)}px;text-transform:uppercase;font-family:'${font}',sans-serif;font-weight:700;color:${rawTextC};opacity:0.4;">Truth</span>
      </div>`;
    const rawHandle = showHandle&&handleStr ? `
      <div style="position:absolute;bottom:${Math.round(100*s)}px;left:${Math.round(60*s)}px;z-index:6;">
        <span style="color:${rawTextC};font-size:${Math.round(22*s)}px;font-family:'${sigFont}',cursive,serif;opacity:0.4;letter-spacing:${Math.round(2*s)}px;">${esc(handleStr)}</span>
      </div>` : "";

    const customDivider = `
      <div style="width:${Math.round(100*s)}px;height:${Math.round(2*s)}px;background:${accent};margin:0 auto ${Math.round(52*s)}px;opacity:0.7;"></div>`;

    const contentPadX = tmpl === "feminine" ? Math.round(140*s) : padX;
    const contentPadTop = tmpl === "feminine" ? Math.round(220*s) : padTop;
    const contentPadBottom = tmpl === "feminine" ? Math.round(240*s) : padBottom;
    const isLeft = tmpl === "raw" && !hasBgImg;
    const tExtras = { classic: classicHTML, luxury: luxuryHTML, feminine: feminineHTML, raw: rawHTML, custom: "" }[tmpl] || "";
    const tDivider = { classic: classicDivider, luxury: luxuryDivider, feminine: feminineDivider, raw: rawDivider, custom: customDivider }[tmpl] || customDivider;
    const tHandle = { classic: classicHandle, luxury: luxuryHandle, feminine: feminineHandle, raw: rawHandle, custom: "" }[tmpl] || (showHandle&&handleStr?`<div style="position:absolute;bottom:${handleBottom}px;left:0;right:0;text-align:center;z-index:6;"><span style="color:${accent};font-size:${Math.round(26*s)}px;font-family:'${sigFont}',cursive,serif;letter-spacing:2px;opacity:0.75;">${esc(handleStr)}</span></div>`:"");
    const cardBg = tmpl === "feminine" ? femBg : bg;
    const cardTextColor = tmpl === "feminine" ? femText : textColor;
    const cardSubColor = tmpl === "feminine" ? (isDark?"rgba(245,237,232,0.7)":"rgba(58,37,32,0.6)") : subColor;

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@import url('${gFonts}');
*{box-sizing:border-box;margin:0;padding:0;}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${hasBgImg?"#000":cardBg};}
.slide{width:${W}px;height:${H}px;background:${hasBgImg?"transparent":cardBg};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${contentPadTop}px ${contentPadX}px ${contentPadBottom}px;position:relative;}
.bg-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;}
.bg-ov{position:absolute;inset:0;z-index:1;background:rgba(0,0,0,${(quoteOverlay||0)/100});}
.content{position:relative;z-index:5;width:100%;display:flex;flex-direction:column;align-items:${isLeft?"flex-start":"center"};text-align:${isLeft?"left":"center"};}
.quote{font-size:${quoteSz}px;font-weight:700;line-height:1.32;color:${cardTextColor};font-style:italic;font-family:'${font}',serif;text-align:${isLeft?"left":"center"};margin-bottom:${Math.round(60*s)}px;${textShadow}}
.sig{font-size:${sigSz}px;font-weight:600;color:${cardSubColor};font-family:'${sigFont}',cursive,serif;${textShadow}text-align:${isLeft?"left":"center"};width:100%;}
</style>
</head><body>
<div class="slide">
  ${hasBgImg?`<img class="bg-img" src="${quoteBgCustomUrl}" crossorigin="anonymous"/><div class="bg-ov"></div>`:""}
  ${tExtras}
  <div class="content">
    ${tmpl==="raw"?rawLabel:""}
    <div class="quote">&#8220;${escapedQuote}&#8221;</div>
    ${tDivider}
    ${signature?`<div class="sig">${esc(signature)}</div>`:""}
  </div>
  ${tHandle}
</div>
</body></html>`;
  };

  const downloadQuote = async (quoteText, i) => {
    const isPortrait = quoteFormat === "portrait";
    const W = 1080, H = isPortrait ? 1920 : 1350;
    const html = buildQuoteHTML(quoteText);
    const iframe = document.createElement("iframe");
    iframe.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${W}px;height:${H}px;border:none;`;
    document.body.appendChild(iframe);
    return new Promise((resolve, reject) => {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      doc.open(); doc.write(html); doc.close();
      setTimeout(async () => {
        try {
          const win = iframe.contentWindow;
          await new Promise(r => { const s=doc.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"; s.onload=r; s.onerror=r; doc.head.appendChild(s); setTimeout(r,4000); });
          if (!win.html2canvas) throw new Error("no h2c");
          const canvas = await win.html2canvas(doc.querySelector(".slide")||doc.body, {useCORS:true,allowTaint:true,scale:1,width:W,height:H,windowWidth:W,windowHeight:H,backgroundColor:null,logging:false});
          canvas.toBlob(blob => { const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`quote-${i+1}.png`; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(()=>URL.revokeObjectURL(url),1000); document.body.removeChild(iframe); resolve(); }, "image/png", 1.0);
        } catch(e) { document.body.removeChild(iframe); reject(e); }
      }, 2000);
    });
  };

  const downloadAllQuotes = async () => {
    setDownloadingQuotes(true);
    const filled = quoteInputs.filter(q => q.trim());
    for (let i=0; i<filled.length; i++) {
      try { await downloadQuote(filled[i], i); await new Promise(r=>setTimeout(r,600)); }
      catch(e) { console.error(e); }
    }
    setDownloadingQuotes(false);
  };

  const A = { bg:"#F5F3EF", surface:"#FFF", border:"#E8E5E0", text:"#0A0A0A", muted:"#8A8780", accentText:"#FFF", input:"#FFF" };
  const inp = { width:"100%", background:A.input, border:`1.5px solid ${A.border}`, borderRadius:10, padding:"11px 14px", color:A.text, fontSize:14, fontFamily:"inherit" };
  const lbl = { display:"block", fontSize:10, fontWeight:700, letterSpacing:3, textTransform:"uppercase", color:A.muted, marginBottom:7 };
  const tog = (on, set) => (
    <div onClick={()=>set(!on)} style={{width:44,height:24,borderRadius:12,background:on?A.text:A.border,position:"relative",cursor:"pointer",flexShrink:0,transition:"background 0.2s"}}>
      <div style={{position:"absolute",top:3,left:on?23:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
    </div>
  );

  const NAV_ITEMS = [["generate","Generate"],["quotes","Quotes"],["brand","Brand"],["visual","Visual"],["history","History"]];

  return (
    <div style={{minHeight:"100vh",background:A.bg,color:A.text,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Dancing+Script:wght@600;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}input,textarea,select{outline:none!important;font-family:inherit}
        button{cursor:pointer;font-family:inherit;border:none;transition:all 0.15s}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${A.border};border-radius:2px}
        input[type=range]{-webkit-appearance:none;height:3px;border-radius:2px;background:${A.border};width:100%}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${A.text};cursor:pointer}
        ::placeholder{color:${A.muted};opacity:0.65}
      `}</style>

      <nav style={{borderBottom:`1px solid ${A.border}`,padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,position:"sticky",top:0,background:`${A.bg}EE`,backdropFilter:"blur(20px)",zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,#1a1a1a,#2a2a2a)`,border:`1.5px solid ${GOLD}44`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{color:GOLD,fontSize:12,fontWeight:900}}>C</span>
          </div>
          <span style={{fontSize:13,fontWeight:800,letterSpacing:-0.3}}>Carousel Studio</span>
          <span style={{fontSize:11,color:A.muted}}>by <span style={{color:GOLD,fontWeight:700}}>Build with Tav</span></span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:2}}>
          {NAV_ITEMS.map(([id,label])=>(
            <button key={id} onClick={()=>setNav(id)} style={{background:"none",border:"none",borderBottom:nav===id?`2px solid ${GOLD}`:"2px solid transparent",color:nav===id?A.text:A.muted,padding:"0 14px",fontSize:13,fontWeight:nav===id?700:500,height:56,display:"flex",alignItems:"center",cursor:"pointer",flexShrink:0}}>
              {label}
            </button>
          ))}
          {view==="preview"&&<>
            <button onClick={()=>generate(lastTopic)} style={{background:"transparent",border:`1.5px solid ${A.border}`,color:A.muted,padding:"5px 12px",borderRadius:7,fontSize:12,fontWeight:600,marginLeft:8}}>↺ Regenerate</button>
            <button onClick={()=>{setView("setup");setSlides([]);setNav("generate");}} style={{background:"transparent",border:`1.5px solid ${A.border}`,color:A.muted,padding:"5px 12px",borderRadius:7,fontSize:12,fontWeight:600}}>← New</button>
          </>}
          <button onClick={()=>{localStorage.removeItem(STORAGE_KEY);localStorage.removeItem("bwt_history");window.location.reload();}} style={{background:"transparent",border:`1.5px solid ${A.border}`,color:A.muted,padding:"5px 12px",borderRadius:7,fontSize:12,marginLeft:4}}>Reset</button>
        </div>
      </nav>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"28px 24px"}}>

        {nav==="quotes"&&(
          <div style={{animation:"fadeUp 0.3s ease",maxWidth:640,margin:"0 auto"}}>
            <div style={{marginBottom:24}}>
              <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 6px"}}>Quote Cards</h2>
              <p style={{color:A.muted,fontSize:14,margin:0}}>Create up to 5 branded quote cards. Accent colour pulls from Brand settings.</p>
            </div>

            <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:18,marginBottom:16,display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <label style={lbl}>Format</label>
                <div style={{display:"flex",gap:8}}>
                  {[["instagram","Instagram 4:5"],["portrait","Stories 9:16"]].map(([id,label])=>(
                    <button key={id} onClick={()=>setQuoteFormat(id)} style={{flex:1,background:quoteFormat===id?A.text:A.bg,border:`1.5px solid ${quoteFormat===id?A.text:A.border}`,color:quoteFormat===id?A.accentText:A.muted,padding:"7px",borderRadius:7,fontSize:11,fontWeight:700}}>{label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>Background</label>
                <div style={{display:"flex",gap:8,marginBottom:quoteBgMode==="custom"?14:0}}>
                  {[["dark","Dark"],["light","Light"],["custom","Custom"]].map(([id,label])=>(
                    <button key={id} onClick={()=>setQuoteBgMode(id)} style={{flex:1,background:quoteBgMode===id?A.text:A.bg,border:`1.5px solid ${quoteBgMode===id?A.text:A.border}`,color:quoteBgMode===id?A.accentText:A.muted,padding:"7px",borderRadius:7,fontSize:11,fontWeight:700}}>{label}</button>
                  ))}
                </div>
                {quoteBgMode==="custom"&&(
                  <div>
                    <div onClick={()=>quoteBgRef.current?.click()} style={{background:A.bg,border:`1.5px dashed ${quoteBgCustomUrl?A.text:A.border}`,borderRadius:9,padding:"10px",cursor:"pointer",textAlign:"center",marginBottom:10}}>
                      <span style={{fontSize:12,fontWeight:600,color:quoteBgCustomUrl?A.text:A.muted}}>{quoteBgCustomUrl?"✓ Background uploaded — click to change":"Upload your background image"}</span>
                    </div>
                    <p style={{color:A.muted,fontSize:11,margin:"0 0 12px",lineHeight:1.6}}>
                      Safe zone: keep important elements within 80px from all edges.<br/>
                      Recommended: <strong>{quoteFormat==="portrait"?"1080×1920px":"1080×1350px"}</strong>
                    </p>
                    <div style={{marginBottom:12}}>
                      <label style={lbl}>Overlay darkness — {quoteOverlay}% <span style={{letterSpacing:0,fontWeight:400,fontSize:9,textTransform:"none"}}>(0% = no overlay)</span></label>
                      <input type="range" min={0} max={80} value={quoteOverlay} onChange={e=>setQuoteOverlay(+e.target.value)}/>
                    </div>
                    <input ref={quoteBgRef} type="file" accept="image/*" onChange={e=>readFile(e,setQuoteBgCustomUrl)} style={{display:"none"}}/>
                    {quoteBgCustomUrl&&(()=>{
                      const isP = quoteFormat==="portrait";
                      const W=1080,H=isP?1920:1350,scale=280/W;
                      const html=buildQuoteHTML("Your quote will appear here");
                      return (
                        <div>
                          <label style={{...lbl,marginBottom:8}}>Preview — check safe zone</label>
                          <div style={{width:280,height:H*scale,borderRadius:10,overflow:"hidden",border:`1.5px solid ${A.border}`}}>
                            <QuotePreview html={html} W={W} H={H} scale={scale}/>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {(()=>{
              const isP = quoteFormat==="portrait";
              const W=1080,H=isP?1920:1350,scale=260/W;
              const html=buildQuoteHTML("Your quote will appear here");
              return (
                <div style={{marginBottom:16}}>
                  <label style={{...lbl,marginBottom:8}}>Live preview</label>
                  <div style={{width:260,height:H*scale,borderRadius:10,overflow:"hidden",border:`1.5px solid ${A.border}`,margin:"0 auto"}}>
                    <QuotePreview key={html} html={html} W={W} H={H} scale={scale}/>
                  </div>
                </div>
              );
            })()}

            <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:18,marginBottom:16,display:"flex",flexDirection:"column",gap:16}}>

              <div>
                <label style={lbl}>Template</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:quoteTemplate==="luxury"?10:0}}>
                  {[["classic","Classic","Corners + diamond"],["luxury","Notebook","Grid texture, clean lines"],["feminine","Feminine","Swirl flourishes"],["raw","Raw","Stark, left-aligned"]].map(([id,label,desc])=>(
                    <button key={id} onClick={()=>setQuoteTemplate(id)} style={{background:quoteTemplate===id?A.text:A.bg,border:`1.5px solid ${quoteTemplate===id?GOLD:A.border}`,borderRadius:8,padding:"8px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                      <span style={{fontSize:12,fontWeight:700,color:quoteTemplate===id?A.accentText:A.text}}>{label}</span>
                      <span style={{fontSize:9,color:quoteTemplate===id?"rgba(255,255,255,0.6)":A.muted,textAlign:"center"}}>{desc}</span>
                    </button>
                  ))}
                </div>
                {quoteTemplate==="luxury"&&(
                  <div>
                    <label style={{...lbl,marginBottom:6}}>Label word <span style={{letterSpacing:0,fontWeight:400,fontSize:9,textTransform:"none"}}>(shown above quote)</span></label>
                    <input value={luxuryLabel} onChange={e=>setLuxuryLabel(e.target.value)} placeholder="wisdom" style={inp}/>
                  </div>
                )}
              </div>

              <div>
                <label style={lbl}>Quote font</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {FONTS.map(f=>(
                    <button key={f.id} onClick={()=>setQuoteFont(f.id)} style={{background:quoteFont===f.id?A.text:"none",border:`1.5px solid ${quoteFont===f.id?A.text:A.border}`,borderRadius:20,padding:"4px 12px"}}>
                      <span style={{fontFamily:`"${f.css}",serif`,fontSize:12,fontWeight:600,fontStyle:"italic",color:quoteFont===f.id?A.accentText:A.muted}}>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Signature font</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {FONTS.map(f=>(
                    <button key={f.id} onClick={()=>setQuoteSigFont(f.id)} style={{background:quoteSigFont===f.id?A.text:"none",border:`1.5px solid ${quoteSigFont===f.id?A.text:A.border}`,borderRadius:20,padding:"4px 12px"}}>
                      <span style={{fontFamily:`"${f.css}",serif`,fontSize:12,fontWeight:600,color:quoteSigFont===f.id?A.accentText:A.muted}}>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>Signature <span style={{letterSpacing:0,fontWeight:400,fontSize:9,textTransform:"none"}}>(leave blank to use brand name)</span></label>
                <input value={quoteSignature} onChange={e=>setQuoteSignature(e.target.value)} placeholder={name||"Your name"} style={inp}/>
              </div>

              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>Show handle</div>
                  <div style={{color:A.muted,fontSize:12}}>{handle?(handle.startsWith("@")?handle:"@"+handle):"Set handle in Brand settings"}</div>
                </div>
                {tog(showHandle,setShowHandle)}
              </div>
            </div>

            <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:18,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                <label style={{...lbl,marginBottom:0}}>Your quotes</label>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setQuoteInputs(["","",""])} style={{background:"none",border:`1.5px solid ${A.border}`,color:A.muted,padding:"5px 10px",borderRadius:7,fontSize:11,fontWeight:600}}>Clear all</button>
                  <button onClick={generateQuotes} disabled={generatingQuotes} style={{background:A.surface,border:`1.5px solid ${A.border}`,color:A.text,padding:"5px 12px",borderRadius:7,fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
                    {generatingQuotes?<><Spin c={A.text}/>Generating...</>:"✦ Generate"}
                  </button>
                </div>
              </div>
              <p style={{color:A.muted,fontSize:12,margin:"0 0 14px",lineHeight:1.5}}>Enter your favourite quotes, or hit Generate to fill empty slots based on your brand.</p>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {quoteInputs.map((q,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10}}>
                    <span style={{fontSize:12,fontWeight:700,color:A.muted,paddingTop:12,width:20,flexShrink:0}}>{i+1}</span>
                    <textarea value={q} onChange={e=>{const next=[...quoteInputs];next[i]=e.target.value;setQuoteInputs(next);}} placeholder={`Quote ${i+1}...`} rows={2} style={{...inp,resize:"vertical",lineHeight:1.5,flex:1}}/>
                  </div>
                ))}
              </div>
            </div>

            {quoteInputs.some(q=>q.trim()) ? (
              <div style={{marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:A.muted}}>Preview</div>
                  <div style={{display:"flex",gap:4,alignItems:"center"}}>
                    <span style={{fontSize:10,color:A.muted,marginRight:4}}>Font:</span>
                    {FONTS.map(f=>(
                      <button key={f.id} onClick={()=>setQuoteFont(f.id)} style={{background:quoteFont===f.id?A.text:"none",border:`1px solid ${quoteFont===f.id?A.text:A.border}`,borderRadius:12,padding:"2px 8px"}}>
                        <span style={{fontFamily:`"${f.css}",serif`,fontSize:10,fontStyle:"italic",color:quoteFont===f.id?A.accentText:A.muted}}>{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
                  {quoteInputs.filter(q=>q.trim()).map((q,i)=>{
                    const isP=quoteFormat==="portrait";
                    const W=1080,H=isP?1920:1350,scale=180/W;
                    const html=buildQuoteHTML(q);
                    return (
                      <div key={i} style={{width:180,height:H*scale,borderRadius:8,overflow:"hidden",border:`1.5px solid ${A.border}`,flexShrink:0}}>
                        <QuotePreview key={html} html={html} W={W} H={H} scale={scale}/>
                      </div>
                    );
                  })}
                </div>
                <button onClick={downloadAllQuotes} disabled={downloadingQuotes} style={{width:"100%",padding:"13px",background:`linear-gradient(135deg,#1a1a1a,#0a0a0a)`,color:A.accentText,borderRadius:10,fontSize:14,fontWeight:800,border:`1px solid ${GOLD}33`,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {downloadingQuotes?<><Spin/>Downloading...</>:`↓ Download All ${quoteInputs.filter(q=>q.trim()).length} Quote Cards`}
                </button>
              </div>
            ) : (
              <button disabled style={{width:"100%",padding:"13px",background:A.border,color:A.muted,borderRadius:10,fontSize:14,fontWeight:800,border:"none"}}>
                Add quotes above to create cards
              </button>
            )}
          </div>
        )}

        {nav==="generate"&&view==="setup"&&(
          <div style={{animation:"fadeUp 0.3s ease",maxWidth:640,margin:"0 auto"}}>
            <div style={{marginBottom:24}}>
              <h1 style={{fontSize:28,fontWeight:800,lineHeight:1.2,margin:"0 0 8px",letterSpacing:-0.8}}>What's today's carousel about?</h1>
              <p style={{color:A.muted,fontSize:14,margin:0}}>One topic. I handle the strategy, layouts, and copy.</p>
            </div>

            <div style={{marginBottom:16}}>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <input value={topic} onChange={e=>{setTopic(e.target.value);if(err)setErr("");}}
                  placeholder="e.g. Why your content gets views but zero clients"
                  style={{...inp,fontSize:15,fontWeight:500,flex:1,borderColor:err?"#c0392b":A.border}}
                  onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)generate();}}/>
                <button onClick={randomiseTopic} disabled={randomising} title="Randomise topic" style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:10,padding:"0 16px",fontSize:18,color:A.muted,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",width:48}}>
                  {randomising?<Spin c={A.muted}/>:"🎲"}
                </button>
              </div>
              {err&&<p style={{color:"#c0392b",fontSize:12,margin:"4px 0 0",fontWeight:600}}>⚠ {err}</p>}
            </div>

            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:A.surface,border:`1.5px solid ${inspirationImg?GOLD:A.border}`,borderRadius:10,cursor:"pointer"}} onClick={()=>{if(inspirationImg){setInspirationImg(null);if(topic==="Recreating from uploaded screenshot...")setTopic("");}else{inspirationRef.current?.click();}}}>
                <span style={{fontSize:16}}>📸</span>
                <div style={{flex:1}}>
                  <span style={{fontSize:13,fontWeight:600,color:A.text}}>Seen a carousel you like? </span>
                  {inspirationImg
                    ? <span style={{fontSize:12,color:GOLD,fontWeight:500}}>Screenshot uploaded — topic box overridden. Click to remove.</span>
                    : <span style={{fontSize:12,color:A.muted}}>Upload a screenshot — I'll recreate it in your voice, ignoring the topic box</span>
                  }
                </div>
                {inspirationImg
                  ? <img src={inspirationImg} style={{width:36,height:36,objectFit:"cover",borderRadius:4,border:`1px solid ${GOLD}`}}/>
                  : <span style={{fontSize:11,fontWeight:700,color:A.muted,background:A.bg,padding:"4px 10px",borderRadius:6,flexShrink:0}}>Upload ↑</span>
                }
              </div>
              <input ref={inspirationRef} type="file" accept="image/*" onChange={e=>readFile(e,url=>{setInspirationImg(url);setTopic("Recreating from uploaded screenshot...");setErr("");}) } style={{display:"none"}}/>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
              <div>
                <label style={lbl}>Cover photo <span style={{letterSpacing:0,fontWeight:400,fontSize:9,textTransform:"none"}}>(optional)</span></label>
                {activeCoverPhoto&&(()=>{
                  const previewW=280, scale=previewW/1080;
                  return (
                    <div>
                      <label style={{...lbl,marginBottom:8}}>Cover preview</label>
                      <div style={{width:previewW,height:Math.round(1350*scale),borderRadius:10,overflow:"hidden",border:`1.5px solid ${A.border}`}}>
                        <SlidePreview slide={{headline:"Your hook headline goes here",accent_word:"hook",tag:"THE HOOK",body:"",layout:"statement",items:[],vs_label:"VS",icon_symbol:"◆",cta_items:[],cta:null}} idx={0} total={1} opts={{...slideOpts(),ratio:"instagram"}} onClick={()=>{}} isActive={false} isCover={true}/>
                      </div>
                    </div>
                  );
                })()}
                <input ref={coverPhotoRef} type="file" accept="image/*" onChange={e=>readFile(e,addCoverPhoto)} style={{display:"none"}}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div>
                  <label style={lbl}>Format</label>
                  <div style={{display:"flex",gap:6}}>
                    {[["instagram","Instagram 4:5"],["portrait","Stories 9:16"]].map(([id,label])=>(
                      <button key={id} onClick={()=>setRatio(id)} style={{flex:1,background:ratio===id?A.text:A.bg,border:`1.5px solid ${ratio===id?A.text:A.border}`,color:ratio===id?A.accentText:A.muted,padding:"7px 4px",borderRadius:7,fontSize:11,fontWeight:700}}>{label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Slides</label>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <button onClick={()=>setSlideCount(Math.max(3,slideCount-1))} style={{width:32,height:32,borderRadius:7,background:A.bg,border:`1.5px solid ${A.border}`,color:A.text,fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                    <span style={{fontSize:22,fontWeight:800,minWidth:24,textAlign:"center"}}>{slideCount}</span>
                    <button onClick={()=>setSlideCount(Math.min(8,slideCount+1))} style={{width:32,height:32,borderRadius:7,background:A.bg,border:`1.5px solid ${A.border}`,color:A.text,fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={()=>generate()} style={{width:"100%",padding:"15px",background:`linear-gradient(135deg,#1a1a1a,#0a0a0a)`,color:A.accentText,borderRadius:10,fontSize:15,fontWeight:800,border:`1px solid ${GOLD}33`,boxShadow:`0 0 0 1px ${GOLD}22`}}>
              Generate Carousel →
            </button>
            <p style={{textAlign:"center",color:A.muted,fontSize:11,marginTop:10}}>⌘ + Enter · ~15–25 seconds</p>
            <button onClick={()=>{
              const mock=[
                {tag:"THE HOOK",headline:"Most ad budgets don't fail. They leak.",body:"Small, invisible losses across targeting, creative, and timing quietly drain campaigns that look fine on the surface.",accent_word:"leak",layout:"statement",items:[],vs_label:"VS",icon_symbol:"◆",cta_items:[],cta:null},
                {tag:"THE REAL NUMBERS",headline:"76% of ad spend never reaches the right audience.",body:"Studies show most digital budgets are lost to mismatched targeting and poor bidding. Most accounts are optimising for the wrong signal from day one.",accent_word:"76%",layout:"standard",items:[],vs_label:"VS",icon_symbol:"◆",cta_items:[],cta:null},
                {tag:"THE PATTERN",headline:"Optimising bad creative just wastes money faster.",body:"A/B testing headlines on a weak offer doesn't fix the real problem. Creative is the variable most marketers over-invest in.",accent_word:"faster",layout:"standard",items:[],vs_label:"VS",icon_symbol:"◆",cta_items:[],cta:null},
                {tag:"THE UNCOMFORTABLE TRUTH",headline:"Spending less per click isn't the goal.",body:"Low CPM with low intent means every conversion costs more anyway. The metric that matters is cost per actual customer.",accent_word:"goal",layout:"standard",items:[],vs_label:"VS",icon_symbol:"◆",cta_items:[],cta:null},
                {tag:"THE BODY CAUSE",headline:"Bad targeting isn\'t the problem. Bad decisions before targeting are.",body:"Most budgets are wasted at the strategy layer — wrong objective, wrong funnel stage, wrong offer — before a single dollar is spent.",accent_word:"before",layout:"quote",items:[],vs_label:"VS",icon_symbol:"◆",cta_items:[],cta:null},
                {tag:"SMARTER SPEND",headline:"Better allocation beats bigger budgets.",body:"If this changed how you see your ad spend, there's more where that came from. Save this so you can come back to it.",accent_word:"allocation",layout:"hero",items:[],vs_label:"VS",icon_symbol:"◆",cta_items:["Save this so you can come back to it"],cta:null},
              ];
              setSlides(mock);setActive(0);setView("preview");setLastTopic("Mock preview");
            }} style={{width:"100%",padding:"11px",background:"transparent",color:A.muted,borderRadius:10,fontSize:13,fontWeight:600,border:`1.5px solid ${A.border}`,marginTop:8}}>
              Preview Layout (no API)
            </button>
          </div>
        )}

        {nav==="history"&&(
          <div style={{animation:"fadeUp 0.3s ease"}}>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 20px"}}>History</h2>
            {history.length===0
              ? <div style={{textAlign:"center",padding:"60px 0",color:A.muted}}>No carousels yet. Generate your first one.</div>
              : <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {history.map(entry=>(
                    <div key={entry.id} style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:"18px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{entry.topic}</div>
                        <div style={{color:A.muted,fontSize:12}}>{entry.slides.length} slides · {entry.date}</div>
                      </div>
                      <button onClick={()=>{setSlides(entry.slides);setActive(0);setView("preview");setLastTopic(entry.topic);setNav("generate");}} style={{background:A.text,color:A.accentText,padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:700,flexShrink:0}}>
                        Load →
                      </button>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {nav==="brand"&&(
          <div style={{animation:"fadeUp 0.3s ease",maxWidth:640}}>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 20px"}}>Brand</h2>
            <div style={{display:"flex",flexDirection:"column",gap:20}}>

              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20}}>
                <label style={lbl}>Profile photo</label>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div onClick={()=>profileRef.current?.click()} style={{width:64,height:64,borderRadius:"50%",border:`2px solid ${A.border}`,overflow:"hidden",background:A.bg,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                    {profileUrl?<img src={profileUrl} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{color:A.muted,fontSize:20}}>+</span>}
                  </div>
                  <div onClick={()=>profileRef.current?.click()} style={{flex:1,background:A.bg,border:`1.5px dashed ${A.border}`,borderRadius:9,padding:12,cursor:"pointer",textAlign:"center"}}>
                    <span style={{color:A.muted,fontSize:13}}>{profileUrl?"Click to change":"Upload square photo"}</span>
                  </div>
                  <input ref={profileRef} type="file" accept="image/*" onChange={e=>readFile(e,setProfileUrl)} style={{display:"none"}}/>
                </div>
              </div>

              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20,display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div><label style={lbl}>Display name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name or brand" style={inp}/></div>
                  <div><label style={lbl}>Handle</label><input value={handle} onChange={e=>setHandle(e.target.value)} placeholder="@yourhandle" style={inp}/></div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div><div style={{fontWeight:600,fontSize:13}}>Blue tick</div><div style={{color:A.muted,fontSize:12}}>Verified badge on slides</div></div>
                    {tog(blueTick,setBlueTick)}
                  </div>
                  <div style={{borderTop:`1px solid ${A.border}`,paddingTop:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div><div style={{fontWeight:600,fontSize:13}}>Website on slides</div><div style={{color:A.muted,fontSize:12}}>Show URL at bottom</div></div>
                    {tog(showWebsite,setShowWebsite)}
                  </div>
                  {showWebsite&&<input value={website} onChange={e=>setWebsite(e.target.value)} placeholder="www.yoursite.co" style={inp}/>}
                </div>
              </div>

              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20}}>
                <label style={lbl}>I am a...</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {BUSINESS_TYPES.map(bt=>(
                    <button key={bt.id} onClick={()=>setBusinessType(bt.id)} style={{background:businessType===bt.id?A.text:A.bg,border:`1.5px solid ${businessType===bt.id?A.text:A.border}`,borderRadius:20,padding:"5px 14px",fontSize:12,color:businessType===bt.id?A.accentText:A.muted,fontWeight:businessType===bt.id?700:500}}>{bt.label}</button>
                  ))}
                </div>
                {businessType==="other"&&<input value={otherType} onChange={e=>setOtherType(e.target.value)} placeholder="e.g. Tattoo artist, PT..." style={{...inp,marginTop:10}}/>}
              </div>

              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20}}>
                <label style={lbl}>Cover photo library</label>
                <p style={{color:A.muted,fontSize:12,margin:"0 0 12px",lineHeight:1.6}}>Save up to 8 photos. Pick one per generation. Used on cover slide only.</p>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                  {coverPhotos.map((p,i)=>(
                    <div key={i} style={{position:"relative"}}>
                      <div onClick={()=>{setActiveCoverPhoto(p);sampleImageBrightness(p).then(setBadgeArea);}} style={{width:72,height:72,borderRadius:8,overflow:"hidden",border:`2px solid ${activeCoverPhoto===p?GOLD:A.border}`,cursor:"pointer"}}>
                        <img src={p} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      </div>
                      <button onClick={()=>{const next=coverPhotos.filter((_,j)=>j!==i);setCoverPhotos(next);if(activeCoverPhoto===p)setActiveCoverPhoto(next[0]||null);}} style={{position:"absolute",top:-6,right:-6,width:18,height:18,borderRadius:"50%",background:"#c0392b",color:"#fff",fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>×</button>
                    </div>
                  ))}
                  {coverPhotos.length < 8 && (
                    <div onClick={()=>coverPhotoRef.current?.click()} style={{width:72,height:72,borderRadius:8,border:`1.5px dashed ${A.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:A.muted,fontSize:28}}>+</div>
                  )}
                </div>
                <input ref={coverPhotoRef} type="file" accept="image/*" onChange={e=>readFile(e,addCoverPhoto)} style={{display:"none"}}/>

                <label style={{...lbl,marginTop:14}}>Badge & hook position on cover</label>
                <div style={{display:"flex",gap:8,marginBottom:14}}>
                  {COVER_POSITIONS.map(p=>(
                    <button key={p.id} onClick={()=>setCoverPosition(p.id)} style={{flex:1,background:coverPosition===p.id?A.text:A.bg,border:`1.5px solid ${coverPosition===p.id?A.text:A.border}`,borderRadius:8,padding:"8px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <span style={{fontSize:11,fontWeight:700,color:coverPosition===p.id?A.accentText:A.text}}>{p.label}</span>
                      <span style={{fontSize:10,color:coverPosition===p.id?"rgba(255,255,255,0.6)":A.muted}}>{p.desc}</span>
                    </button>
                  ))}
                </div>

                {activeCoverPhoto&&(()=>{
                  const coverSlide = {headline:"Your hook headline goes here",accent_word:"hook",tag:"THE HOOK",body:"",layout:"statement",items:[],vs_label:"VS",icon_symbol:"◆",cta_items:[],cta:null};
                  return (
                    <div>
                      <label style={{...lbl,marginBottom:8}}>Cover preview</label>
                      <div style={{width:280,height:280*(1350/1080),borderRadius:10,overflow:"hidden",border:`1.5px solid ${A.border}`}}>
                        <SlidePreview slide={coverSlide} idx={0} total={1} opts={{...slideOpts(),ratio:"instagram"}} onClick={()=>{}} isActive={false} isCover={true}/>
                      </div>
                      <p style={{color:A.muted,fontSize:11,marginTop:8}}>Switch position above to see how badge and headline sit on your photo.</p>
                    </div>
                  );
                })()}
              </div>

              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20}}>
                <label style={lbl}>Voice profile <span style={{letterSpacing:0,fontWeight:400,fontSize:9,textTransform:"none"}}>(sent with every prompt)</span></label>
                <p style={{color:A.muted,fontSize:12,margin:"0 0 10px",lineHeight:1.6}}>Describe your tone, audience, what to avoid, CTA style. More specific = better output.</p>
                <textarea value={voiceProfile} onChange={e=>setVoiceProfile(e.target.value)} placeholder="e.g. Direct and honest. Short punchy sentences. Speak to people tired of the hype. Never overpromise. CTA is always soft — 'free preview in bio'." rows={5} style={{...inp,resize:"vertical",lineHeight:1.7}}/>
              </div>
            </div>
          </div>
        )}

        {nav==="visual"&&(
          <div style={{animation:"fadeUp 0.3s ease",maxWidth:640}}>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 20px"}}>Visual</h2>
            <div style={{display:"flex",flexDirection:"column",gap:20}}>

              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20}}>
                <label style={lbl}>Headline style</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {HEADLINE_STYLES.map(hs=>(
                    <button key={hs.id} onClick={()=>setHeadlineStyle(hs.id)} style={{background:headlineStyle===hs.id?A.text:A.bg,border:`1.5px solid ${headlineStyle===hs.id?GOLD:A.border}`,borderRadius:10,padding:"14px 12px",textAlign:"left"}}>
                      <div style={{fontSize:18,fontWeight:900,letterSpacing:hs.letterSpacing,textTransform:hs.transform,fontFamily:hs.forceFont?`'${hs.forceFont}',serif`:"inherit",color:headlineStyle===hs.id?A.accentText:A.text,marginBottom:4}}>
                        Headline
                      </div>
                      <div style={{fontSize:11,fontWeight:700,color:headlineStyle===hs.id?A.accentText:A.text,marginBottom:2}}>{hs.label}</div>
                      <div style={{fontSize:10,color:headlineStyle===hs.id?"rgba(255,255,255,0.6)":A.muted}}>{hs.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20}}>
                <label style={lbl}>Brand accent colour</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:accentSwatch==="custom"?14:0}}>
                  {ACCENT_SWATCHES.map(sw=>(
                    <button key={sw.id} onClick={()=>{setAccentSwatch(sw.id);if(sw.hex)setAccentColor(sw.hex);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,background:"none",border:"none",padding:4}}>
                      <div style={{width:36,height:36,borderRadius:"50%",background:sw.hex||(accentSwatch==="custom"?accentColor:"#C9A84C"),border:`3px solid ${accentSwatch===sw.id?A.text:"transparent"}`,boxShadow:accentSwatch===sw.id?`0 0 0 1px ${A.text}`:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {sw.id==="custom"&&<span style={{fontSize:14}}>+</span>}
                      </div>
                      <span style={{fontSize:9,fontWeight:600,color:accentSwatch===sw.id?A.text:A.muted,textTransform:"uppercase",letterSpacing:1}}>{sw.label}</span>
                    </button>
                  ))}
                </div>
                {accentSwatch==="custom"&&(
                  <div style={{display:"flex",gap:10,alignItems:"center",marginTop:4}}>
                    <input type="color" value={accentColor} onChange={e=>setAccentColor(e.target.value)} style={{width:40,height:40,borderRadius:8,border:`1px solid ${A.border}`,cursor:"pointer",padding:2}}/>
                    <input value={accentColor} onChange={e=>setAccentColor(e.target.value)} placeholder="#C9A84C" style={{...inp,flex:1,fontSize:13}}/>
                  </div>
                )}
              </div>

              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20}}>
                <label style={lbl}>Slide background (slides 2 onwards)</label>
                <div style={{display:"flex",gap:8,marginBottom:bgMode==="custom"?14:0}}>
                  {BG_MODES.map(m=>(
                    <button key={m.id} onClick={()=>setBgMode(m.id)} style={{flex:1,background:bgMode===m.id?A.text:A.bg,border:`1.5px solid ${bgMode===m.id?A.text:A.border}`,borderRadius:8,padding:"10px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <span style={{fontSize:12,fontWeight:700,color:bgMode===m.id?A.accentText:A.text}}>{m.label}</span>
                      <span style={{fontSize:10,color:bgMode===m.id?"rgba(255,255,255,0.6)":A.muted}}>{m.desc}</span>
                    </button>
                  ))}
                </div>
                {bgMode==="colour"&&(
                  <div style={{marginTop:12}}>
                    <label style={lbl}>Pick a colour</label>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <input type="color" value={bgColour} onChange={e=>setBgColour(e.target.value)} style={{width:48,height:48,borderRadius:8,border:`1px solid ${A.border}`,cursor:"pointer",padding:2}}/>
                      <input value={bgColour} onChange={e=>setBgColour(e.target.value)} placeholder="#1a1a2e" style={{...inp,flex:1,fontSize:13}}/>
                    </div>
                  </div>
                )}
                {bgMode==="custom"&&(
                  <div>
                    <div onClick={()=>templateBgRef.current?.click()} style={{background:A.bg,border:`1.5px dashed ${templateBgUrl?A.text:A.border}`,borderRadius:9,padding:"12px",cursor:"pointer",textAlign:"center",marginBottom:8}}>
                      <span style={{fontSize:12,fontWeight:600,color:templateBgUrl?A.text:A.muted}}>{templateBgUrl?"✓ Template image set — click to change":"Upload template background image"}</span>
                    </div>
                    <p style={{color:A.muted,fontSize:11,margin:0,lineHeight:1.6}}>Safe zone: keep important elements within 80px from each edge. Recommended size: 1080×1350px.</p>
                    <input ref={templateBgRef} type="file" accept="image/*" onChange={e=>readFile(e,setTemplateBgUrl)} style={{display:"none"}}/>
                    {templateBgUrl&&(
                      <div style={{marginTop:12}}>
                        <label style={lbl}>Overlay — {overlayDark}%</label>
                        <input type="range" min={0} max={85} value={overlayDark} onChange={e=>setOverlayDark(+e.target.value)} style={{marginBottom:14}}/>
                        <label style={{...lbl,marginBottom:6}}>Reposition background <span style={{letterSpacing:0,fontWeight:400,fontSize:9,textTransform:"none"}}>(drag)</span></label>
                        <div
                          ref={templateDragRef}
                          onMouseDown={()=>setIsDraggingTemplate(true)}
                          onMouseMove={e=>{if(isDraggingTemplate)handleDrag(e,setTemplateImgPos,templateDragRef);}}
                          onMouseUp={()=>setIsDraggingTemplate(false)}
                          onMouseLeave={()=>setIsDraggingTemplate(false)}
                          style={{width:"100%",height:140,borderRadius:10,overflow:"hidden",cursor:"crosshair",border:`1.5px solid ${A.border}`,position:"relative",userSelect:"none",marginBottom:8}}
                        >
                          <img src={templateBgUrl} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:`${templateImgPos.x}% ${templateImgPos.y}%`,pointerEvents:"none"}}/>
                          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:16,height:16,borderRadius:"50%",border:"2px solid #fff",background:"rgba(0,0,0,0.4)",pointerEvents:"none"}}/>
                        </div>
                        <label style={{...lbl,marginBottom:8}}>Preview — check safe zone</label>
                        <div style={{width:280,height:280*(1350/1080),borderRadius:10,overflow:"hidden",border:`1.5px solid ${A.border}`}}>
                          <SlidePreview slide={{headline:"Your headline goes here",accent_word:"headline",tag:"SLIDE TITLE",body:"Supporting text appears here.",layout:"standard",items:[],vs_label:"VS",icon_symbol:"◆",cta_items:[],cta:null}} idx={1} total={6} opts={slideOpts()} onClick={()=>{}} isActive={false} isCover={false}/>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20}}>
                <label style={lbl}>Body font</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                  {FONTS.map(f=>(
                    <button key={f.id} onClick={()=>setFontId(f.id)} style={{background:fontId===f.id?A.text:A.bg,border:`1.5px solid ${fontId===f.id?GOLD:A.border}`,borderRadius:8,padding:"7px 14px"}}>
                      <span style={{fontFamily:`"${f.css}",serif`,fontSize:14,fontWeight:700,color:fontId===f.id?A.accentText:A.text}}>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div><div style={{fontWeight:600,fontSize:13}}>Slide numbers</div><div style={{color:A.muted,fontSize:12}}>Watermark number on each slide</div></div>
                {tog(showNums,setShowNums)}
              </div>

            </div>
          </div>
        )}

        {nav==="generate"&&view==="generating"&&(
          <div style={{textAlign:"center",padding:"100px 0",animation:"fadeUp 0.3s ease"}}>
            <div style={{width:44,height:44,borderRadius:"50%",border:`3px solid ${A.border}`,borderTop:`3px solid ${GOLD}`,animation:"spin 0.8s linear infinite",margin:"0 auto 22px"}}/>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:GOLD,marginBottom:8}}>Creating</div>
            <div style={{fontSize:22,fontWeight:800,marginBottom:6}}>Writing and designing {slideCount} slides</div>
            <div style={{color:A.muted,fontSize:14}}>"{lastTopic}"</div>
          </div>
        )}

        {nav==="generate"&&view==="preview"&&slides.length>0&&(
          <div style={{animation:"fadeUp 0.3s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
              <span style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:A.muted}}>Format:</span>
              {[["instagram","Instagram 4:5"],["portrait","Stories 9:16"]].map(([id,label])=>(
                <button key={id} onClick={()=>setRatio(id)} style={{background:ratio===id?A.text:A.surface,border:`1.5px solid ${ratio===id?A.text:A.border}`,color:ratio===id?A.accentText:A.muted,padding:"5px 14px",borderRadius:7,fontSize:12,fontWeight:700}}>{label}</button>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:28,alignItems:"start"}}>
              <div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
                  {slides.map((slide,i)=>(
                    <SlidePreview key={i} slide={slide} idx={i} total={slides.length} opts={slideOpts()} onClick={()=>setActive(i)} isActive={active===i} isCover={i===0}/>
                  ))}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>downloadOne(active)} disabled={downloading} style={{flex:1,background:A.surface,border:`1.5px solid ${A.border}`,color:A.text,padding:"10px",borderRadius:9,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    {downloading?<><Spin c={A.text}/>Processing...</>:downloadDone?"✓ Downloaded":`↓ Slide ${active+1}`}
                  </button>
                  <button onClick={downloadAll} disabled={downloadingAll} style={{flex:2,background:`linear-gradient(135deg,#1a1a1a,#0a0a0a)`,color:A.accentText,padding:"10px",borderRadius:9,fontSize:13,fontWeight:800,border:`1px solid ${GOLD}33`,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {downloadingAll?<><Spin/>Downloading...</>:downloadDone?"✓ All Downloaded":`↓ Download All ${slides.length}`}
                  </button>
                </div>
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:A.muted}}>Edit Slide {active+1}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {slides.map((s,i)=>(
                    <button key={i} onClick={()=>setActive(i)} title={s.tag||`Slide ${i+1}`} style={{width:27,height:27,borderRadius:6,background:active===i?A.text:A.surface,border:`1.5px solid ${active===i?GOLD:A.border}`,color:active===i?A.accentText:A.muted,fontSize:12,fontWeight:700}}>{i+1}</button>
                  ))}
                </div>
                <div style={{background:A.surface,borderRadius:12,border:`1.5px solid ${A.border}`,padding:18,display:"flex",flexDirection:"column",gap:13}}>
                  <div><label style={lbl}>Slide Title</label><input value={slides[active]?.tag||""} onChange={e=>updateSlide("tag",e.target.value)} style={inp}/></div>
                  <div><label style={lbl}>Headline</label><textarea value={slides[active]?.headline||""} onChange={e=>updateSlide("headline",e.target.value)} rows={2} style={{...inp,resize:"vertical",lineHeight:1.5}}/></div>
                  <div><label style={lbl}>Accent word <span style={{letterSpacing:0,fontWeight:400,fontSize:9}}>(renders in colour)</span></label><input value={slides[active]?.accent_word||""} onChange={e=>updateSlide("accent_word",e.target.value)} placeholder="exact word from headline" style={inp}/></div>
                  <div><label style={lbl}>Body</label><textarea value={slides[active]?.body||""} onChange={e=>updateSlide("body",e.target.value)} rows={3} style={{...inp,resize:"vertical",lineHeight:1.6}}/></div>
                  <div>
                    <label style={lbl}>CTA <span style={{letterSpacing:0,fontWeight:400,fontSize:9}}>(leave blank to hide)</span></label>
                    <input
                      value={slides[active]?.layout==="hero"?(slides[active]?.cta_items?.[0]||""):(slides[active]?.cta||"")}
                      onChange={e=>{
                        const v=e.target.value||null;
                        if(slides[active]?.layout==="hero") updateSlide("cta_items",v?[v]:[]);
                        else updateSlide("cta",v);
                      }}
                      placeholder="e.g. Free preview → bio"
                      style={inp}
                    />
                  </div>

                  <div>
                    <label style={lbl}>Format</label>
                    <div style={{display:"flex",gap:6}}>
                      {[["instagram","4:5"],["portrait","9:16"]].map(([id,label])=>(
                        <button key={id} onClick={()=>setRatio(id)} style={{flex:1,background:ratio===id?A.text:A.bg,border:`1.5px solid ${ratio===id?A.text:A.border}`,color:ratio===id?A.accentText:A.muted,padding:"7px",borderRadius:7,fontSize:11,fontWeight:700}}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Gradient strength — {slideOverlays[active]??overlayDark}%</label>
                    <input type="range" min={0} max={85} value={slideOverlays[active]??overlayDark} onChange={e=>setSlideOverlays(prev=>({...prev,[active]:+e.target.value}))}/>
                  </div>
                </div>
                <div style={{background:A.surface,borderRadius:12,border:`1.5px solid ${A.border}`,padding:18}}>
                  <label style={lbl}>AI Rewrite</label>
                  <textarea value={rewritePrompt} onChange={e=>setRewritePrompt(e.target.value)} placeholder={`"Make this punchier"\n"Add a specific stat"\n"Change to a split comparing X vs Y"`} rows={3} style={{...inp,resize:"vertical",lineHeight:1.5,marginBottom:10}}/>
                  <button onClick={rewrite} disabled={rewriting||!rewritePrompt.trim()} style={{width:"100%",background:rewritePrompt.trim()?A.text:A.border,color:rewritePrompt.trim()?A.accentText:A.muted,padding:"9px",borderRadius:8,fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {rewriting?<><Spin/>Rewriting...</>:"Rewrite This Slide →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer style={{borderTop:`1px solid ${A.border}`,padding:"14px 32px",textAlign:"center",marginTop:60}}>
        <a href="https://www.buildwithtav.co" target="_blank" rel="noopener noreferrer" style={{color:GOLD,fontWeight:700,textDecoration:"none",fontSize:12}}>Build with Tav</a>
        <span style={{color:A.muted,fontSize:12}}> · buildwithtav.co</span>
      </footer>
    </div>
  );
}
