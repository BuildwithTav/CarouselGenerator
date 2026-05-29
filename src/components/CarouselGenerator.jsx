"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const GOLD = "#C9A84C";
const STORAGE_KEY = "bwt_v9";

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
  { id:"dark",   label:"Dark",   desc:"Dark with subtle texture" },
  { id:"light",  label:"Light",  desc:"Clean light background" },
  { id:"custom", label:"Custom", desc:"Upload your own image" },
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
    accentColor, ratio
  } = opts;

  const accent = accentColor || GOLD;
  const isDark = bgMode !== "light";
  const slideBg = bgMode === "light" ? "#F5F3EF" : "#0A0A0A";
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
  const W = 1080, H = isPortrait ? 1920 : 1350; // 4:5 default, 9:16 portrait
  const layout = slide.layout || "standard";

  // Background for this slide
  const bgImageUrl = isCover ? coverImageUrl : (bgMode === "custom" ? templateBgUrl : null);

  const pillBg = bgImageUrl
    ? badgeArea === "light" ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.58)"
    : C.dark ? "rgba(0,0,0,0.62)" : "rgba(255,255,255,0.88)";
  const pillText = bgImageUrl || C.dark ? "#fff" : "#111";
  const pillSub = bgImageUrl || C.dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";

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

  // Badge bottom = top(88) + avatar(110) + padding(20) = ~218px. Content starts at 250px min.
  const BADGE_BOTTOM = 230;
  const topPad = isPortrait ? 400 : BADGE_BOTTOM + 40;
  const botPad = isPortrait ? 220 : 120;

  const base = `
    @import url('${gFonts}');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    html, body { width:${W}px; height:${H}px; overflow:hidden; background:${slideBg}; }
    .slide { width:${W}px; height:${H}px; overflow:hidden; background:${slideBg}; font-family:'${bodyFont}',sans-serif; position:relative; color:${C.text}; }
    .bg-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; }
    .bg-ov { position:absolute; inset:0; z-index:1; pointer-events:none; }
    .noise { position:absolute; inset:0; z-index:2; pointer-events:none; opacity:0.3;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
      background-repeat:repeat; }
    .bk { position:absolute; width:52px; height:52px; z-index:3; }
    .tl { top:44px; left:52px; border-top:2.5px solid ${C.accent}; border-left:2.5px solid ${C.accent}; opacity:0.4; }
    .tr { top:44px; right:52px; border-top:2.5px solid ${C.accent}; border-right:2.5px solid ${C.accent}; opacity:0.4; }
    .bl { bottom:44px; left:52px; border-bottom:2.5px solid ${C.accent}; border-left:2.5px solid ${C.accent}; opacity:0.4; }
    .br { bottom:44px; right:52px; border-bottom:2.5px solid ${C.accent}; border-right:2.5px solid ${C.accent}; opacity:0.4; }
    .fade { position:absolute; bottom:0; left:0; right:0; height:45%; z-index:3; pointer-events:none;
      background:linear-gradient(to bottom,transparent,rgba(0,0,0,0.65)); }
    .badge { position:absolute; top:80px; left:80px; z-index:10;
      display:inline-flex; align-items:center; gap:14px;
      background:${pillBg}; padding:10px 22px 10px 10px; border-radius:60px;
      backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); }
    .av { width:110px; height:110px; border-radius:50%; border:3px solid ${C.accent};
      overflow:hidden; flex-shrink:0; background:${C.dark?"#1a1a1a":"#ddd"};
      display:flex; align-items:center; justify-content:center; position:relative; }
    .av img { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:100%; height:100%; object-fit:cover; }
    .av-i { font-size:44px; font-weight:900; color:${C.accent}; font-family:'${hlFont}',sans-serif; }
    .bn { font-size:22px; font-weight:800; color:${pillText}; line-height:1.2; font-family:'${bodyFont}',sans-serif; }
    .bh { font-size:15px; color:${pillSub}; font-family:'${bodyFont}',sans-serif; }
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
  `;

  const layouts = {
    standard: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:${topPad}px 90px ${botPad}px; text-align:center; overflow:hidden; }
      .hl { font-size:${isPortrait?96:80}px; font-weight:900; line-height:1.08; letter-spacing:${hs.letterSpacing}; ${ts} font-family:'${hlFont}',sans-serif; flex-shrink:0; }
      .body { font-size:${isPortrait?32:28}px; line-height:1.65; color:${C.sub}; max-width:860px; margin-top:28px; ${ts2} font-family:'${bodyFont}',sans-serif; }
      .cta { margin-top:36px; border:1px solid ${C.accent}44; background:${C.accent}16; padding:22px 60px; border-radius:8px; font-size:${isPortrait?28:24}px; font-weight:800; color:${C.accent}; font-family:'${bodyFont}',sans-serif; width:100%; max-width:860px; text-align:center; flex-shrink:0; }
    `,
    statement: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:${topPad}px 70px ${botPad}px; text-align:center; overflow:hidden; }
      .hl { font-size:${isPortrait?116:98}px; font-weight:900; line-height:1.0; letter-spacing:${hs.id==="upper"?"2px":"-2px"}; ${ts} font-family:'${hlFont}',sans-serif; flex-shrink:0; }
      .body { font-size:${isPortrait?32:28}px; line-height:1.65; color:${C.sub}; max-width:800px; margin-top:28px; font-family:'${bodyFont}',sans-serif; }
    `,
    split: `
      .c { position:absolute; inset:0; z-index:5; overflow:hidden; }
      .split-top { position:absolute; top:${isPortrait?400:260}px; left:60px; right:60px; text-align:center; z-index:4; }
      .split-tag { display:inline-block; background:${C.accent}; color:${C.dark?"#000":"#fff"}; font-size:14px; font-weight:800; letter-spacing:2px; padding:8px 24px; border-radius:60px; font-family:'${bodyFont}',sans-serif; margin-bottom:16px; }
      .split-hl { font-size:${isPortrait?68:52}px; font-weight:900; line-height:1.06; letter-spacing:${hs.letterSpacing}; ${ts} font-family:'${hlFont}',sans-serif; color:${C.text}; }
      .split-panels { position:absolute; top:${isPortrait?660:490}px; left:0; right:0; bottom:60px; display:grid; grid-template-columns:1fr 1fr; z-index:3; }
      .panel { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px 44px; text-align:center; gap:12px; overflow:hidden; }
      .panel:first-child { background:${C.accent}10; border-right:1px solid ${C.accent}28; }
      .pl { font-size:${isPortrait?44:36}px; font-weight:900; font-family:'${hlFont}',sans-serif; line-height:1.1; color:${C.text}; }
      .pa { color:${C.accent}; }
      .ps { font-size:${isPortrait?24:20}px; color:${C.sub}; font-family:'${bodyFont}',sans-serif; line-height:1.4; }
      .vs { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:6; width:80px; height:80px; border-radius:50%; background:${C.bg}; border:1.5px solid ${C.accent}44; display:flex; align-items:center; justify-content:center; }
      .vt { font-size:26px; font-weight:900; color:${C.accent}; font-family:'${bodyFont}',sans-serif; }
    `,
    cards: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; padding:${topPad}px 72px ${botPad}px; overflow:hidden; }
      .hl { font-size:${isPortrait?82:64}px; font-weight:900; line-height:1.08; letter-spacing:${hs.letterSpacing}; ${ts} text-align:center; margin-bottom:4px; font-family:'${hlFont}',sans-serif; flex-shrink:0; }
      .cg { width:100%; display:flex; flex-direction:column; gap:${isPortrait?14:9}px; margin-top:20px; overflow:hidden; }
      .card { background:${C.dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)"}; border:1px solid ${C.accent}28; border-radius:10px; padding:${isPortrait?22:14}px 24px; display:flex; align-items:flex-start; gap:16px; flex-shrink:0; }
      .cn { font-size:${isPortrait?28:20}px; font-weight:900; color:${C.accent}; font-family:'${bodyFont}',sans-serif; flex-shrink:0; width:36px; line-height:1; }
      .ct { font-size:${isPortrait?25:19}px; color:${C.text}; font-family:'${bodyFont}',sans-serif; line-height:1.35; font-weight:600; }
      .cs { font-size:${isPortrait?20:16}px; color:${C.sub}; margin-top:2px; font-family:'${bodyFont}',sans-serif; }
    `,
    quote: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:${topPad}px 110px ${botPad+40}px; text-align:center; overflow:hidden; }
      .qm { font-size:260px; font-weight:900; color:${C.accent}20; line-height:0.65; font-family:'${hlFont}',sans-serif; margin-bottom:-20px; flex-shrink:0; }
      .hl { font-size:${isPortrait?96:84}px; font-weight:900; line-height:1.06; letter-spacing:${hs.letterSpacing}; ${ts} font-style:${hs.id==="serif"?"italic":"normal"}; font-family:'${hlFont}',sans-serif; }
      .body { font-size:${isPortrait?30:26}px; line-height:1.6; color:${C.sub}; max-width:760px; margin-top:28px; font-family:'${bodyFont}',sans-serif; }
    `,
    hero: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:${topPad+20}px 90px ${botPad+20}px; gap:24px; text-align:center; overflow:hidden; }
      .hi { width:${isPortrait?190:170}px; height:${isPortrait?190:170}px; border-radius:50%; border:1.5px solid ${C.accent}40; background:${C.accent}12; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .hs { font-size:${isPortrait?110:100}px; line-height:1; }
      .hl { font-size:${isPortrait?90:78}px; font-weight:900; line-height:1.06; letter-spacing:${hs.letterSpacing}; ${ts} font-family:'${hlFont}',sans-serif; }
      .body { font-size:${isPortrait?30:26}px; line-height:1.6; color:${C.sub}; max-width:820px; font-family:'${bodyFont}',sans-serif; }
      .cb { width:100%; max-width:860px; padding:${isPortrait?30:24}px 50px; border-radius:12px; font-size:${isPortrait?28:24}px; font-weight:800; font-family:'${bodyFont}',sans-serif; text-align:center; background:${C.accent}; color:${C.dark?"#000":"#fff"}; }
    `,
  };

  // Cover slide layout
  const coverPos = coverPosition || "centre";
  const coverLayouts = {
    top: `
      .cover-content { position:absolute; top:${isPortrait?300:220}px; left:70px; right:70px; z-index:5; }
    `,
    centre: `
      .cover-content { position:absolute; top:50%; left:70px; right:70px; transform:translateY(-50%); z-index:5; }
    `,
    bottom: `
      .cover-content { position:absolute; bottom:${isPortrait?280:200}px; left:70px; right:70px; z-index:5; }
    `,
  };

  function layoutHTML() {
    if (isCover) {
      const hl = accentHL(slide.headline||"");
      return `
        <div class="cover-content">
          ${slide.tag ? `<div style="margin-bottom:20px"><span class="tag">${esc(slide.tag.toUpperCase())}</span></div>` : ""}
          <div style="font-size:${isPortrait?110:90}px;font-weight:900;line-height:1.05;letter-spacing:${hs.letterSpacing};${ts}font-family:'${hlFont}',sans-serif;color:${C.text}">${hl}</div>
          ${slide.body ? `<div style="font-size:${isPortrait?32:26}px;line-height:1.6;color:${C.sub};margin-top:24px;font-family:'${bodyFont}',sans-serif;${ts2}">${esc(slide.body)}</div>` : ""}
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
        ${slide.icon_symbol?`<div class="hi"><span class="hs">${slide.icon_symbol}</span></div>`:""}
        ${tag}<div class="hl">${hl}</div>
        ${slide.body?divider+body:""}
        ${ctaText?`<div class="cb">${esc(ctaText)}</div>`:""}
      </div>`;
    }

    if (layout==="quote") {
      return `<div class="c">
        <div class="qm">"</div>
        ${tag}<div class="hl">${hl}</div>
        ${slide.body?divider+body:""}
      </div>`;
    }

    const cta = slide.cta ? `<div class="cta">${esc(slide.cta)}</div>` : "";
    return `<div class="c">${tag}<div class="hl">${hl}</div>${slide.body?divider+body:""}${cta}</div>`;
  }

  const hasBg = !!bgImageUrl;
  const overlayAlpha = (overlayDark||65)/100;
  const bgHtml = hasBg ? `
    <img class="bg-img" src="${bgImageUrl}" crossorigin="anonymous"/>
    <div class="bg-ov" style="background:linear-gradient(to bottom,rgba(0,0,0,${Math.min(overlayAlpha*0.92,0.88)}) 0%,rgba(0,0,0,${Math.min(overlayAlpha*0.42,0.5)}) 40%,rgba(0,0,0,${Math.min(overlayAlpha*0.95,0.92)}) 100%)"></div>` : "";

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
  ${C.dark||hasBg?'<div class="fade"></div>':""}
  <div class="badge">
    <div class="av">${avHtml}</div>
    <div>
      <div class="bn">${esc(name||"Your Brand")}${blueTick?` <span class="tick">✓</span>`:""}</div>
      <div class="bh">${esc(handle||"@yourhandle")}</div>
    </div>
  </div>
  ${showNums?`<div class="wm">${String(idx+1).padStart(2,"0")}</div><div class="cnt">${idx+1} / ${total}</div>`:""}
  ${layoutHTML()}
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
      <div style={{ position:"absolute", bottom:4, right:4, fontSize:10, color:"rgba(255,255,255,0.85)", background:"rgba(0,0,0,0.6)", padding:"2px 6px", borderRadius:4, fontWeight:700 }}>{idx+1}</div>
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

  // Nav
  const [nav, setNav] = useState("generate"); // generate | history | brand | visual

  // Brand (saved)
  const [profileUrl, setProfileUrl] = useState(S?.profileUrl||null);
  const [name, setName] = useState(S?.name||"");
  const [handle, setHandle] = useState(S?.handle||"");
  const [blueTick, setBlueTick] = useState(S?.blueTick??false);
  const [website, setWebsite] = useState(S?.website||"");
  const [showWebsite, setShowWebsite] = useState(S?.showWebsite??false);
  const [voiceProfile, setVoiceProfile] = useState(S?.voiceProfile||"");
  const [businessType, setBusinessType] = useState(S?.businessType||"marketer");
  const [otherType, setOtherType] = useState(S?.otherType||"");
  const [coverPhotos, setCoverPhotos] = useState(S?.coverPhotos||[]); // photo library
  const [activeCoverPhoto, setActiveCoverPhoto] = useState(S?.activeCoverPhoto||null);
  const [coverPosition, setCoverPosition] = useState(S?.coverPosition||"bottom");
  const [badgeArea, setBadgeArea] = useState(null);

  // Visual (saved)
  const [accentSwatch, setAccentSwatch] = useState(S?.accentSwatch||"gold");
  const [accentColor, setAccentColor] = useState(S?.accentColor||GOLD);
  const [fontId, setFontId] = useState(S?.fontId||"montserrat");
  const [headlineStyle, setHeadlineStyle] = useState(S?.headlineStyle||"bold");
  const [showNums, setShowNums] = useState(S?.showNums??true);
  const [bgMode, setBgMode] = useState(S?.bgMode||"dark");
  const [templateBgUrl, setTemplateBgUrl] = useState(S?.templateBgUrl||null);
  const [overlayDark, setOverlayDark] = useState(S?.overlayDark||65);

  // Generate
  const [topic, setTopic] = useState("");
  const [inspirationImg, setInspirationImg] = useState(null);
  const [ratio, setRatio] = useState(S?.ratio||"instagram"); // instagram (4:5) | portrait (9:16)
  const [slideCount, setSlideCount] = useState(6);
  const [err, setErr] = useState("");
  const [randomising, setRandomising] = useState(false);

  // App state
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

  const [quoteInputs, setQuoteInputs] = useState(["","","","",""]);
  const [quoteSignature, setQuoteSignature] = useState("");
  const [quoteFont, setQuoteFont] = useState("playfair");
  const [generatingQuotes, setGeneratingQuotes] = useState(false);
  const [quoteSlides, setQuoteSlides] = useState([]);
  const [downloadingQuotes, setDownloadingQuotes] = useState(false);
  const profileRef = useRef(null);
  const coverPhotoRef = useRef(null);
  const templateBgRef = useRef(null);
  const inspirationRef = useRef(null);

  useEffect(() => {
    saveS({profileUrl,name,handle,blueTick,website,showWebsite,voiceProfile,businessType,otherType,
           coverPhotos,activeCoverPhoto,coverPosition,accentSwatch,accentColor,fontId,headlineStyle,showNums,
           bgMode,templateBgUrl,overlayDark,ratio});
  }, [profileUrl,name,handle,blueTick,website,showWebsite,voiceProfile,businessType,otherType,
      coverPhotos,activeCoverPhoto,coverPosition,accentSwatch,accentColor,fontId,headlineStyle,showNums,
      bgMode,templateBgUrl,overlayDark,ratio]);

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
        const res = await fetch("/api/generate", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
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
    layout: s.layout||"standard",
    items: Array.isArray(s.items)?s.items:[],
    vs_label: s.vs_label||"VS",
    icon_symbol: s.icon_symbol||"◆",
    cta_items: Array.isArray(s.cta_items)?s.cta_items.map(c=>String(c)):[],
  });

  const buildPrompt = (topicStr, imgBase64) => {
    const btLabel = businessType==="other"?(otherType||"brand"):BUSINESS_TYPES.find(b=>b.id===businessType)?.label||"Digital Marketer";
    const voice = voiceProfile || `Write for a ${btLabel}. Direct, specific, speak to real problems. No hype.`;
    const inspiration = imgBase64 ? `\nINSPIRATION IMAGE: I've attached a screenshot of a carousel I like. Analyse the topic, hook angle and energy — then recreate it in my voice with fresh content. Don't copy, just match the quality and angle.` : "";
    return `You are creating an Instagram carousel for a ${btLabel}.
You are the copywriter AND creative director. Every slide must earn its place.

VOICE: ${voice}
TOPIC: "${topicStr}"${inspiration}
SLIDES: ${slideCount}

NARRATIVE ARC: hook → reality → insight → shift → advice → CTA

LAYOUT SYSTEM:
- "statement" — MASSIVE headline, almost no body. ALWAYS use for slide 1. Make it provocative. Must stop the scroll.
- "standard" — headline + body. Good for most slides.
- "split" — two panels with VS. ONLY for comparisons. Requires "items":[{"label":"...","sub":"..."},{"label":"...","sub":"..."}] and "vs_label".
- "cards" — numbered rows. For lists. Requires "items":[{"label":"...","sub":"..."}] — MUST include "label" field.
- "quote" — italic headline, big quote mark. For one powerful human truth. Max one per carousel.
- "hero" — icon + headline + single CTA. ALWAYS final slide. Add "icon_symbol" and "cta_items":["one CTA only"].

RULES:
- No two consecutive slides same layout
- Slide 1 always "statement"
- Final slide always "hero" with exactly one cta_items string
- Pick ONE accent word per headline — exact match — put in "accent_word"
- Tags: editorial and specific. NOT "HOOK", "SLIDE 1", "CTA"
- Headlines: max 8 words, punchy
- Body: 1-2 sentences max
- Only final slide gets cta. All others cta is null.
- No HTML, no cite tags, plain text only

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

      const d = await fetchWithRetry({ model:"claude-opus-4-7", max_tokens:3000, tools:[{type:"web_search_20250305",name:"web_search"}], messages });
      const raw = d.content?.find(b=>b.type==="text")?.text||"";
      const clean = raw.replace(/<cite[^>]*>/g,"").replace(/<\/cite>/g,"").replace(/<[^>]+>/g,"");
      const m = clean.match(/\[[\s\S]*\]/);
      if (!m) throw new Error("no json");
      const newSlides = JSON.parse(m[0]).map(sanitize);
      setSlides(newSlides); setActive(0); setView("preview");

      // Save to history
      const entry = { id: Date.now(), topic: t, slides: newSlides, date: new Date().toLocaleDateString() };
      const newHistory = [entry, ...history].slice(0, 10);
      setHistory(newHistory); saveHistory(newHistory);

    } catch { setErr("Generation failed — please try again."); setView("setup"); }
  };

  const randomiseTopic = async () => {
    setRandomising(true);
    const btLabel = businessType==="other"?(otherType||"brand"):BUSINESS_TYPES.find(b=>b.id===businessType)?.label||"Digital Marketer";
    try {
      const d = await fetchWithRetry({ model:"claude-opus-4-7", max_tokens:80, messages:[{ role:"user", content:`Give me ONE punchy Instagram carousel topic idea for a ${btLabel}. Voice profile: ${voiceProfile||"direct, honest, no hype"}. Return ONLY the topic, no explanation, no quotes, max 12 words.` }] });
      const idea = d.content?.find(b=>b.type==="text")?.text?.trim()||"";
      if (idea) setTopic(idea);
    } catch {}
    setRandomising(false);
  };

  const rewrite = async () => {
    if (!rewritePrompt.trim()) return; setRewriting(true);
    try {
      const d = await fetchWithRetry({ model:"claude-opus-4-7", max_tokens:600, messages:[{ role:"user", content:`Rewrite this carousel slide: "${rewritePrompt}"\n\nCurrent:\n${JSON.stringify(slides[active],null,2)}\n\nVoice: ${voiceProfile||"Direct, honest, specific."}\n\nReturn ONLY a JSON object with same structure. No markdown, no HTML.` }] });
      const raw = (d.content?.find(b=>b.type==="text")?.text||"").replace(/<[^>]+>/g,"");
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { const next=[...slides]; next[active]=sanitize(JSON.parse(m[0])); setSlides(next); setRewritePrompt(""); }
    } catch {}
    setRewriting(false);
  };

  const updateSlide = (k,v) => { const next=[...slides]; next[active]={...next[active],[k]:v}; setSlides(next); };

  const slideOpts = useCallback(() => ({
    fontId, headlineStyle, bgMode, templateBgUrl, overlayDark,
    coverImageUrl: activeCoverPhoto, coverPosition, badgeArea,
    profileUrl, name, handle, blueTick,
    websiteUrl: showWebsite?website:"",
    showNums, ratio, accentColor,
  }), [fontId,headlineStyle,bgMode,templateBgUrl,overlayDark,activeCoverPhoto,coverPosition,badgeArea,profileUrl,name,handle,blueTick,website,showWebsite,showNums,ratio,accentColor]);

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
    try {
      const d = await fetchWithRetry({ model:"claude-opus-4-7", max_tokens:400, messages:[{ role:"user", content:`Generate 5 short, powerful quotes for a ${btLabel}. Voice: ${voiceProfile||"direct, honest, real"}. Return ONLY a JSON array of 5 strings: ["quote1","quote2","quote3","quote4","quote5"]. No attribution, no author names, max 15 words each.` }] });
      const raw = (d.content?.find(b=>b.type==="text")?.text||"").replace(/<[^>]+>/g,"");
      const m = raw.match(/\[[\s\S]*\]/);
      if (m) {
        const quotes = JSON.parse(m[0]);
        setQuoteInputs(quotes.slice(0,5).concat(Array(5).fill("")).slice(0,5));
      }
    } catch {}
    setGeneratingQuotes(false);
  };

  const buildQuoteHTML = (quoteText, sig) => {
    const accent = accentColor || GOLD;
    const isDark = bgMode !== "light";
    const bg = bgMode === "light" ? "#F5F3EF" : "#0A0A0A";
    const textColor = isDark ? "#FFFFFF" : "#0A0A0A";
    const subColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)";
    const fontObj = FONTS.find(f => f.id === quoteFont) || FONTS[1];
    const font = fontObj.css;
    const W = 1080, H = 1350;
    const gFonts = `https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Poppins:wght@700;800;900&family=Inter:wght@700;800;900&family=Oswald:wght@600;700&family=Dancing+Script:wght@600;700&display=swap`;
    const avHtml = profileUrl ? `<img src="${profileUrl}" crossorigin="anonymous" style="width:100%;height:100%;object-fit:cover;"/>` : `<span style="font-size:32px;font-weight:900;color:${accent};font-family:'${font}',sans-serif;">${(name||"?")[0].toUpperCase()}</span>`;
    const signature = sig || quoteSignature || name || "";
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@import url('${gFonts}');
*{box-sizing:border-box;margin:0;padding:0;}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${bg};}
.slide{width:${W}px;height:${H}px;background:${bg};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:120px 100px;position:relative;font-family:'${font}',sans-serif;}
.bk{position:absolute;width:52px;height:52px;}
.tl{top:44px;left:52px;border-top:2.5px solid ${accent};border-left:2.5px solid ${accent};opacity:0.4;}
.tr{top:44px;right:52px;border-top:2.5px solid ${accent};border-right:2.5px solid ${accent};opacity:0.4;}
.bl{bottom:44px;left:52px;border-bottom:2.5px solid ${accent};border-left:2.5px solid ${accent};opacity:0.4;}
.br{bottom:44px;right:52px;border-bottom:2.5px solid ${accent};border-right:2.5px solid ${accent};opacity:0.4;}
.qm{font-size:200px;font-weight:900;color:${accent}22;line-height:0.7;font-family:'${font}',sans-serif;text-align:left;width:100%;margin-bottom:-30px;}
.quote{font-size:72px;font-weight:700;line-height:1.2;color:${textColor};font-style:italic;font-family:'${font}',sans-serif;text-align:center;margin-bottom:60px;}
.div{width:60px;height:1.5px;background:${accent};opacity:0.6;margin:0 auto 40px;}
.sig-wrap{display:flex;align-items:center;gap:16px;}
.av{width:70px;height:70px;border-radius:50%;border:2.5px solid ${accent};overflow:hidden;display:flex;align-items:center;justify-content:center;background:${isDark?"#1a1a1a":"#ddd"};flex-shrink:0;}
.sig{font-size:28px;font-weight:700;color:${subColor};font-family:'${font}',sans-serif;}
</style>
</head><body>
<div class="slide">
  <div class="bk tl"></div><div class="bk tr"></div>
  <div class="bk bl"></div><div class="bk br"></div>
  <div class="qm">"</div>
  <div class="quote">${(quoteText||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
  <div class="div"></div>
  <div class="sig-wrap">
    <div class="av">${avHtml}</div>
    ${signature?`<div class="sig">— ${signature.replace(/&/g,"&amp;")}</div>`:""}
  </div>
</div>
</body></html>`;
  };

  const downloadQuote = async (quoteText, i) => {
    const W = 1080, H = 1350;
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

  // UI constants
  const A = { bg:"#F5F3EF", surface:"#FFF", border:"#E8E5E0", text:"#0A0A0A", muted:"#8A8780", accentText:"#FFF", input:"#FFF" };
  const inp = { width:"100%", background:A.input, border:`1.5px solid ${A.border}`, borderRadius:10, padding:"11px 14px", color:A.text, fontSize:14, fontFamily:"inherit" };
  const lbl = { display:"block", fontSize:10, fontWeight:700, letterSpacing:3, textTransform:"uppercase", color:A.muted, marginBottom:7 };
  const tog = (on, set) => (
    <div onClick={()=>set(!on)} style={{width:44,height:24,borderRadius:12,background:on?A.text:A.border,position:"relative",cursor:"pointer",flexShrink:0,transition:"background 0.2s"}}>
      <div style={{position:"absolute",top:3,left:on?23:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
    </div>
  );

  const NAV_ITEMS = [["generate","Generate"],["quotes","Quotes"],["history","History"],["brand","Brand"],["visual","Visual"]];

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

      {/* NAV */}
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
            <button key={id} onClick={()=>{setNav(id);if(view==="preview"&&id!=="generate"){}}} style={{background:"none",border:"none",borderBottom:nav===id?`2px solid ${GOLD}`:"2px solid transparent",color:nav===id?A.text:A.muted,padding:"8px 16px",fontSize:13,fontWeight:nav===id?700:500,marginBottom:-1}}>
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

        {/* ── QUOTES ── */}
        {nav==="quotes"&&(
          <div style={{animation:"fadeUp 0.3s ease",maxWidth:640,margin:"0 auto"}}>
            <div style={{marginBottom:24}}>
              <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 6px"}}>Quote Pack</h2>
              <p style={{color:A.muted,fontSize:14,margin:0}}>Create up to 5 branded quote cards. Download individually or all at once.</p>
            </div>

            {/* Quote font */}
            <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:18,marginBottom:16}}>
              <label style={lbl}>Quote font</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {FONTS.map(f=>(
                  <button key={f.id} onClick={()=>setQuoteFont(f.id)} style={{background:quoteFont===f.id?A.text:A.bg,border:`1.5px solid ${quoteFont===f.id?GOLD:A.border}`,borderRadius:8,padding:"7px 14px"}}>
                    <span style={{fontFamily:`"${f.css}",serif`,fontSize:f.id==="dancing"?16:14,fontWeight:700,fontStyle:f.id==="dancing"?"italic":"normal",color:quoteFont===f.id?A.accentText:A.text}}>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Signature */}
            <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:18,marginBottom:16}}>
              <label style={lbl}>Signature <span style={{letterSpacing:0,fontWeight:400,fontSize:9,textTransform:"none"}}>(leave blank to use your brand name)</span></label>
              <input value={quoteSignature} onChange={e=>setQuoteSignature(e.target.value)} placeholder={name||"Your name"} style={inp}/>
            </div>

            {/* Quote inputs */}
            <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:18,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <label style={{...lbl,marginBottom:0}}>Your quotes</label>
                <button onClick={generateQuotes} disabled={generatingQuotes} style={{background:A.surface,border:`1.5px solid ${A.border}`,color:A.text,padding:"6px 14px",borderRadius:7,fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                  {generatingQuotes?<><Spin c={A.text}/>Generating...</>:"✦ Generate quotes"}
                </button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {quoteInputs.map((q,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10}}>
                    <span style={{fontSize:12,fontWeight:700,color:A.muted,paddingTop:12,width:20,flexShrink:0}}>{i+1}</span>
                    <textarea value={q} onChange={e=>{const next=[...quoteInputs];next[i]=e.target.value;setQuoteInputs(next);}} placeholder={`Quote ${i+1}...`} rows={2} style={{...inp,resize:"vertical",lineHeight:1.5,flex:1}}/>
                  </div>
                ))}
              </div>
            </div>

            </div>

            {quoteInputs.some(q=>q.trim()) ? (
              <div style={{marginBottom:20}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:A.muted,marginBottom:12}}>Preview</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
                  {quoteInputs.filter(q=>q.trim()).map((q,i)=>{
                    const W=1080,H=1350,scale=180/W;
                    const html=buildQuoteHTML(q);
                    return (
                      <div key={i} style={{position:"relative",width:180,height:H*scale,borderRadius:8,overflow:"hidden",border:`1.5px solid ${A.border}`,flexShrink:0}}>
                        <QuotePreview key={html} html={html} W={W} H={H} scale={scale}/>
                        <button onClick={()=>downloadQuote(q,i)} style={{position:"absolute",bottom:4,right:4,background:"rgba(0,0,0,0.7)",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 7px",borderRadius:4,border:"none"}}>↓</button>
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

            {/* Topic */}
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

            {/* Inspiration — secondary, tucked away */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:10,cursor:"pointer"}} onClick={()=>inspirationImg?setInspirationImg(null):inspirationRef.current?.click()}>
                <span style={{fontSize:16}}>📸</span>
                <div style={{flex:1}}>
                  <span style={{fontSize:13,fontWeight:600,color:A.text}}>Seen a carousel you like? </span>
                  <span style={{fontSize:12,color:A.muted}}>{inspirationImg?"Screenshot uploaded — click to remove":"Click here to upload a screenshot — I'll recreate it in your voice"}</span>
                </div>
                {inspirationImg
                  ? <img src={inspirationImg} style={{width:36,height:36,objectFit:"cover",borderRadius:4,border:`1px solid ${A.border}`}}/>
                  : <span style={{fontSize:11,fontWeight:700,color:A.muted,background:A.bg,padding:"4px 10px",borderRadius:6,flexShrink:0}}>Upload ↑</span>
                }
              </div>
              <input ref={inspirationRef} type="file" accept="image/*" onChange={e=>readFile(e,setInspirationImg)} style={{display:"none"}}/>
            </div>

            {/* Cover photo + format + slides */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
              <div>
                <label style={lbl}>Cover photo <span style={{letterSpacing:0,fontWeight:400,fontSize:9,textTransform:"none"}}>(optional)</span></label>
                <div>
                  {coverPhotos.length > 0 && (
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                      {/* No cover option */}
                      <div onClick={()=>setActiveCoverPhoto(null)} style={{width:48,height:48,borderRadius:6,border:`2px solid ${!activeCoverPhoto?A.text:A.border}`,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:A.bg}}>
                        <span style={{fontSize:9,fontWeight:700,color:!activeCoverPhoto?A.text:A.muted,textAlign:"center",lineHeight:1.2}}>None</span>
                      </div>
                      {coverPhotos.map((p,i)=>(
                        <div key={i} onClick={()=>{setActiveCoverPhoto(p);sampleImageBrightness(p).then(setBadgeArea);}} style={{width:48,height:48,borderRadius:6,overflow:"hidden",border:`2px solid ${activeCoverPhoto===p?A.text:A.border}`,cursor:"pointer",flexShrink:0}}>
                          <img src={p} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        </div>
                      ))}
                      <div onClick={()=>coverPhotoRef.current?.click()} style={{width:48,height:48,borderRadius:6,border:`1.5px dashed ${A.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:A.muted,fontSize:20,flexShrink:0}}>+</div>
                    </div>
                  )}
                  {coverPhotos.length === 0 && (
                    <div onClick={()=>coverPhotoRef.current?.click()} style={{border:`1.5px dashed ${A.border}`,borderRadius:9,padding:"12px",cursor:"pointer",textAlign:"center"}}>
                      <span style={{fontSize:12,color:A.muted}}>Upload from device or save photos in Brand settings</span>
                    </div>
                  )}
                  {activeCoverPhoto && <div style={{fontSize:11,color:A.muted,marginTop:4}}>✓ Cover selected — manage photos in Brand settings</div>}
                </div>
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
                    <button onClick={()=>setSlideCount(Math.min(12,slideCount+1))} style={{width:32,height:32,borderRadius:7,background:A.bg,border:`1.5px solid ${A.border}`,color:A.text,fontSize:16,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={()=>generate()} style={{width:"100%",padding:"15px",background:`linear-gradient(135deg,#1a1a1a,#0a0a0a)`,color:A.accentText,borderRadius:10,fontSize:15,fontWeight:800,border:`1px solid ${GOLD}33`,boxShadow:`0 0 0 1px ${GOLD}22`}}>
              Generate Carousel →
            </button>
            <p style={{textAlign:"center",color:A.muted,fontSize:11,marginTop:10}}>⌘ + Enter · ~15–25 seconds</p>
          </div>
        )}

        {/* ── HISTORY ── */}
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

        {/* ── BRAND ── */}
        {nav==="brand"&&(
          <div style={{animation:"fadeUp 0.3s ease",maxWidth:640}}>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 20px"}}>Brand</h2>
            <div style={{display:"flex",flexDirection:"column",gap:20}}>

              {/* Profile photo */}
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

              {/* Name/handle/tick/website */}
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

              {/* Business type */}
              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20}}>
                <label style={lbl}>I am a...</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {BUSINESS_TYPES.map(bt=>(
                    <button key={bt.id} onClick={()=>setBusinessType(bt.id)} style={{background:businessType===bt.id?A.text:A.bg,border:`1.5px solid ${businessType===bt.id?A.text:A.border}`,borderRadius:20,padding:"5px 14px",fontSize:12,color:businessType===bt.id?A.accentText:A.muted,fontWeight:businessType===bt.id?700:500}}>{bt.label}</button>
                  ))}
                </div>
                {businessType==="other"&&<input value={otherType} onChange={e=>setOtherType(e.target.value)} placeholder="e.g. Tattoo artist, PT..." style={{...inp,marginTop:10}}/>}
              </div>

              {/* Cover photos library */}
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

                {/* Cover position */}
                <label style={{...lbl,marginTop:14}}>Badge & hook position on cover</label>
                <div style={{display:"flex",gap:8}}>
                  {COVER_POSITIONS.map(p=>(
                    <button key={p.id} onClick={()=>setCoverPosition(p.id)} style={{flex:1,background:coverPosition===p.id?A.text:A.bg,border:`1.5px solid ${coverPosition===p.id?A.text:A.border}`,borderRadius:8,padding:"8px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <span style={{fontSize:11,fontWeight:700,color:coverPosition===p.id?A.accentText:A.text}}>{p.label}</span>
                      <span style={{fontSize:10,color:coverPosition===p.id?"rgba(255,255,255,0.6)":A.muted}}>{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice profile */}
              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20}}>
                <label style={lbl}>Voice profile <span style={{letterSpacing:0,fontWeight:400,fontSize:9,textTransform:"none"}}>(sent with every prompt)</span></label>
                <p style={{color:A.muted,fontSize:12,margin:"0 0 10px",lineHeight:1.6}}>Describe your tone, audience, what to avoid, CTA style. More specific = better output.</p>
                <textarea value={voiceProfile} onChange={e=>setVoiceProfile(e.target.value)} placeholder="e.g. Direct and honest. Short punchy sentences. Speak to people tired of the hype. Never overpromise. CTA is always soft — 'free preview in bio'." rows={5} style={{...inp,resize:"vertical",lineHeight:1.7}}/>
              </div>
            </div>
          </div>
        )}

        {/* ── VISUAL ── */}
        {nav==="visual"&&(
          <div style={{animation:"fadeUp 0.3s ease",maxWidth:640}}>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 20px"}}>Visual</h2>
            <div style={{display:"flex",flexDirection:"column",gap:20}}>

              {/* Headline style */}
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

              {/* Accent colour */}
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

              {/* Template background (slides 2+) */}
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
                        <input type="range" min={0} max={85} value={overlayDark} onChange={e=>setOverlayDark(+e.target.value)}/>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Font */}
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

              {/* Slide numbers */}
              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div><div style={{fontWeight:600,fontSize:13}}>Slide numbers</div><div style={{color:A.muted,fontSize:12}}>Watermark number on each slide</div></div>
                {tog(showNums,setShowNums)}
              </div>
            </div>
          </div>
        )}

        {/* ── GENERATING ── */}
        {view==="generating"&&(
          <div style={{textAlign:"center",padding:"100px 0",animation:"fadeUp 0.3s ease"}}>
            <div style={{width:44,height:44,borderRadius:"50%",border:`3px solid ${A.border}`,borderTop:`3px solid ${GOLD}`,animation:"spin 0.8s linear infinite",margin:"0 auto 22px"}}/>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:GOLD,marginBottom:8}}>Creating</div>
            <div style={{fontSize:22,fontWeight:800,marginBottom:6}}>Writing and designing {slideCount} slides</div>
            <div style={{color:A.muted,fontSize:14}}>"{lastTopic}"</div>
          </div>
        )}

        {/* ── PREVIEW ── */}
        {view==="preview"&&slides.length>0&&(
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

              {/* Editor */}
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
                    <label style={lbl}>Layout</label>
                    <select value={slides[active]?.layout||"standard"} onChange={e=>updateSlide("layout",e.target.value)} style={{...inp,height:42,cursor:"pointer"}}>
                      <option value="standard">Standard — headline + body</option>
                      <option value="statement">Statement — big bold claim</option>
                      <option value="split">Split — VS comparison</option>
                      <option value="cards">Cards — numbered list</option>
                      <option value="quote">Quote — powerful truth</option>
                      <option value="hero">Hero — final CTA slide</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Format</label>
                    <div style={{display:"flex",gap:6}}>
                      {[["instagram","4:5"],["portrait","9:16"]].map(([id,label])=>(
                        <button key={id} onClick={()=>setRatio(id)} style={{flex:1,background:ratio===id?A.text:A.bg,border:`1.5px solid ${ratio===id?A.text:A.border}`,color:ratio===id?A.accentText:A.muted,padding:"7px",borderRadius:7,fontSize:11,fontWeight:700}}>{label}</button>
                      ))}
                    </div>
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
