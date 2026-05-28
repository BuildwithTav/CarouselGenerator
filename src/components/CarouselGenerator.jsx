"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const GOLD = "#C9A84C";

const THEMES = [
  { id:"dark-gold", label:"Dark Gold",  bg:"#0A0A0A", accent:"#C9A84C", text:"#FFFFFF", sub:"rgba(255,255,255,0.72)", dark:true },
  { id:"midnight",  label:"Midnight",   bg:"#0D1117", accent:"#7C9EFF", text:"#E8EAF2", sub:"rgba(232,234,242,0.72)", dark:true },
  { id:"noir",      label:"Noir",       bg:"#050505", accent:"#FFFFFF", text:"#FFFFFF", sub:"rgba(255,255,255,0.65)", dark:true },
  { id:"editorial", label:"Editorial",  bg:"#F8F6F2", accent:"#1A1A1A", text:"#0A0A0A", sub:"rgba(10,10,10,0.62)", dark:false },
  { id:"forest",    label:"Forest",     bg:"#111E11", accent:"#7DBE7D", text:"#E8F5E8", sub:"rgba(232,245,232,0.7)", dark:true },
  { id:"navy",      label:"Navy",       bg:"#0A1628", accent:"#E8C97A", text:"#F0EAD6", sub:"rgba(240,234,214,0.7)", dark:true },
  { id:"custom",    label:"Custom",     bg:"#0A0A0A", accent:"#C9A84C", text:"#FFFFFF", sub:"rgba(255,255,255,0.7)", dark:true },
];

const FONTS = [
  { id:"montserrat", label:"Montserrat", css:"Montserrat" },
  { id:"playfair",   label:"Playfair",   css:"Playfair Display" },
  { id:"poppins",    label:"Poppins",    css:"Poppins" },
  { id:"inter",      label:"Inter",      css:"Inter" },
  { id:"oswald",     label:"Oswald",     css:"Oswald" },
];

const TONES = [
  { id:"ai",          label:"Tav Decides",   desc:"Full creative control" },
  { id:"bold",        label:"Bold & Direct",  desc:"Punchy, confident" },
  { id:"calm",        label:"Calm & Real",    desc:"Honest, grounded" },
  { id:"educational", label:"Educational",    desc:"Clear, expert" },
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

const STORAGE_KEY = "bwt_v8";

// ─── HTML SLIDE BUILDER ───────────────────────────────────

function buildSlideHTML(slide, idx, total, opts) {
  const { theme, fontId, bgImageUrl, overlayDark, profileUrl,
          name, handle, blueTick, websiteUrl, showNums, customBg, customAccent, ratio } = opts;

  const themeObj = THEMES.find(t => t.id === theme) || THEMES[0];
  const C = theme === "custom"
    ? { ...themeObj, bg: customBg||"#0A0A0A", accent: customAccent||"#C9A84C" }
    : themeObj;

  const font = (FONTS.find(f => f.id === fontId) || FONTS[0]).css;
  const isPortrait = ratio === "portrait";
  const W = 1080, H = isPortrait ? 1920 : 1080;
  const layout = slide.layout || "standard";

  function escHtml(s) {
    return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function accentHL(text) {
    const aw = (slide.accent_word||"").trim();
    if (!aw || !text.includes(aw)) return escHtml(text);
    const i = text.indexOf(aw);
    return escHtml(text.slice(0,i)) + `<span style="color:${C.accent}">${escHtml(aw)}</span>` + escHtml(text.slice(i+aw.length));
  }

  const gFonts = `https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Playfair+Display:wght@700;900&family=Poppins:wght@700;800;900&family=Inter:wght@700;800;900&family=Oswald:wght@600;700&display=swap`;

  const ts = C.dark ? "text-shadow:0 2px 24px rgba(0,0,0,0.95);" : "";
  const ts2 = C.dark ? "text-shadow:0 1px 16px rgba(0,0,0,0.85);" : "";

  const base = `
    @import url('${gFonts}');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    html, body { width:${W}px; height:${H}px; overflow:hidden; background:${C.bg}; }
    .slide { width:${W}px; height:${H}px; overflow:hidden; background:${C.bg}; font-family:'${font}',sans-serif; position:relative; color:${C.text}; }
    .bg-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; }
    .bg-ov { position:absolute; inset:0; z-index:1; pointer-events:none; }
    .noise { position:absolute; inset:0; z-index:2; pointer-events:none; opacity:0.35;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
      background-repeat:repeat; }
    .bk { position:absolute; width:52px; height:52px; z-index:3; }
    .tl { top:44px; left:52px; border-top:2.5px solid ${C.accent}; border-left:2.5px solid ${C.accent}; opacity:0.4; }
    .tr { top:44px; right:52px; border-top:2.5px solid ${C.accent}; border-right:2.5px solid ${C.accent}; opacity:0.4; }
    .bl { bottom:44px; left:52px; border-bottom:2.5px solid ${C.accent}; border-left:2.5px solid ${C.accent}; opacity:0.4; }
    .br { bottom:44px; right:52px; border-bottom:2.5px solid ${C.accent}; border-right:2.5px solid ${C.accent}; opacity:0.4; }
    .fade { position:absolute; bottom:0; left:0; right:0; height:42%; z-index:3; pointer-events:none;
      background:linear-gradient(to bottom,transparent,rgba(0,0,0,0.58)); }
    .badge { position:absolute; top:64px; left:64px; z-index:10;
      display:flex; align-items:center; gap:14px;
      background:${C.dark?"rgba(0,0,0,0.6)":"rgba(255,255,255,0.85)"};
      padding:12px 22px 12px 12px; border-radius:60px; }
    .av { width:64px; height:64px; border-radius:50%; border:3px solid ${C.accent};
      overflow:hidden; flex-shrink:0; background:${C.dark?"#1a1a1a":"#ddd"};
      display:flex; align-items:center; justify-content:center; position:relative; }
    .av img { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
      width:100%; height:100%; object-fit:cover; }
    .av-i { font-size:26px; font-weight:900; color:${C.accent}; font-family:'${font}',sans-serif; }
    .bn { font-size:20px; font-weight:800; color:${C.dark?"#fff":"#111"}; line-height:1.2; font-family:'${font}',sans-serif; }
    .bh { font-size:14px; color:${C.dark?"rgba(255,255,255,0.52)":"rgba(0,0,0,0.45)"}; font-family:'${font}',sans-serif; }
    .tick { display:inline-flex; align-items:center; justify-content:center;
      width:18px; height:18px; background:#1D9BF0; border-radius:50%;
      font-size:10px; color:#fff; margin-left:5px; vertical-align:middle; }
    .wm { position:absolute; bottom:28px; right:38px; z-index:3;
      font-size:${Math.floor(H*0.2)}px; font-weight:900; line-height:1;
      color:${C.dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.035)"};
      font-family:'${font}',sans-serif; pointer-events:none; user-select:none; }
    .cnt { position:absolute; top:52px; right:60px; z-index:10;
      font-size:14px; font-weight:700; color:${C.accent}88; font-family:'${font}',sans-serif; }
    .site { position:absolute; bottom:${websiteUrl?28:10}px; left:0; right:0; text-align:center; z-index:10;
      font-size:17px; color:${C.dark?"rgba(255,255,255,0.28)":"rgba(0,0,0,0.25)"}; font-family:'${font}',sans-serif; }
    .brand { position:absolute; bottom:10px; left:0; right:0; text-align:center; z-index:10;
      font-size:12px; font-weight:700; letter-spacing:3px;
      color:${C.dark?"rgba(255,255,255,0.14)":"rgba(0,0,0,0.14)"}; font-family:'${font}',sans-serif; }
    .tag { display:inline-block; background:${C.accent}; color:${C.dark?"#000":"#fff"};
      font-size:14px; font-weight:800; letter-spacing:2px;
      padding:8px 24px; border-radius:60px; font-family:'${font}',sans-serif; }
    .div { width:80px; height:1.5px; background:${C.accent}; opacity:0.5; margin:0 auto; position:relative; }
    .div::after { content:''; position:absolute; top:-4px; left:50%;
      transform:translateX(-50%) rotate(45deg);
      width:10px; height:10px; background:${C.accent}; opacity:0.9; }
  `;

  const layouts = {
    standard: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:200px 90px 120px; text-align:center; gap:0; }
      .hl { font-size:88px; font-weight:900; line-height:1.08; ${ts} margin-bottom:32px; font-family:'${font}',sans-serif; }
      .body { font-size:30px; line-height:1.65; color:${C.sub}; max-width:860px; margin-top:32px; ${ts2} font-family:'${font}',sans-serif; }
      .cta { margin-top:44px; border:1px solid ${C.accent}44; background:${C.accent}16; padding:24px 60px; border-radius:8px; font-size:28px; font-weight:800; color:${C.accent}; font-family:'${font}',sans-serif; width:100%; max-width:860px; text-align:center; }
    `,
    statement: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:180px 70px 120px; text-align:center; gap:0; }
      .hl { font-size:112px; font-weight:900; line-height:1.0; ${ts} letter-spacing:-2px; margin-bottom:36px; font-family:'${font}',sans-serif; }
      .body { font-size:30px; line-height:1.65; color:${C.sub}; max-width:800px; margin-top:32px; font-family:'${font}',sans-serif; }
      .cta { margin-top:44px; border:1px solid ${C.accent}44; background:${C.accent}16; padding:24px 60px; border-radius:8px; font-size:28px; font-weight:800; color:${C.accent}; font-family:'${font}',sans-serif; }
    `,
    split: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; padding:160px 0 100px; }
      .panels { display:grid; grid-template-columns:1fr 1fr; flex:1; position:relative; }
      .panel { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 64px; text-align:center; gap:16px; }
      .panel:first-child { background:${C.accent}10; border-right:1px solid ${C.accent}28; }
      .pl { font-size:44px; font-weight:900; font-family:'${font}',sans-serif; line-height:1.1; }
      .ps { font-size:26px; color:${C.sub}; font-family:'${font}',sans-serif; line-height:1.5; }
      .vs { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:6;
        width:100px; height:100px; border-radius:50%; background:${C.bg};
        border:1.5px solid ${C.accent}44; display:flex; align-items:center; justify-content:center; }
      .vt { font-size:30px; font-weight:900; color:${C.accent}; font-family:'${font}',sans-serif; }
      .sb { padding:36px 90px 0; text-align:center; }
      .hl { font-size:72px; font-weight:900; line-height:1.08; ${ts} font-family:'${font}',sans-serif; }
      .body { font-size:28px; line-height:1.6; color:${C.sub}; margin-top:20px; font-family:'${font}',sans-serif; }
    `,
    cards: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; padding:200px 80px 100px; }
      .hl { font-size:80px; font-weight:900; line-height:1.1; ${ts} text-align:center; margin-bottom:12px; font-family:'${font}',sans-serif; }
      .cg { width:100%; display:flex; flex-direction:column; gap:16px; margin-top:32px; }
      .card { background:${C.dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)"}; border:1px solid ${C.accent}28; border-radius:14px; padding:26px 34px; display:flex; align-items:flex-start; gap:22px; }
      .cn { font-size:32px; font-weight:900; color:${C.accent}; font-family:'${font}',sans-serif; flex-shrink:0; width:46px; line-height:1; }
      .ct { font-size:27px; color:${C.text}; font-family:'${font}',sans-serif; line-height:1.45; font-weight:600; }
      .cs { font-size:22px; color:${C.sub}; margin-top:4px; font-family:'${font}',sans-serif; }
    `,
    quote: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:200px 110px 160px; text-align:center; gap:0; }
      .qm { font-size:300px; font-weight:900; color:${C.accent}20; line-height:0.65; font-family:'${font}',sans-serif; margin-bottom:-20px; }
      .hl { font-size:96px; font-weight:900; line-height:1.06; ${ts} font-style:italic; letter-spacing:-1px; margin-bottom:36px; font-family:'${font}',sans-serif; }
      .body { font-size:30px; line-height:1.6; color:${C.sub}; max-width:760px; margin-top:32px; font-family:'${font}',sans-serif; }
    `,
    hero: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:200px 90px 160px; gap:30px; text-align:center; }
      .hi { width:220px; height:220px; border-radius:50%; border:1.5px solid ${C.accent}40; background:${C.accent}12; display:flex; align-items:center; justify-content:center; margin-bottom:8px; }
      .hs { font-size:130px; line-height:1; }
      .hl { font-size:92px; font-weight:900; line-height:1.06; ${ts} font-family:'${font}',sans-serif; }
      .body { font-size:30px; line-height:1.65; color:${C.sub}; max-width:820px; font-family:'${font}',sans-serif; }
      .cs { width:100%; max-width:860px; display:flex; flex-direction:column; gap:14px; margin-top:8px; }
      .cb { padding:28px 50px; border-radius:12px; font-size:28px; font-weight:800; font-family:'${font}',sans-serif; text-align:center; }
      .cp { background:${C.accent}; color:${C.dark?"#000":"#fff"}; }
      .cx { border:1.5px solid ${C.accent}50; color:${C.accent}; background:${C.accent}14; }
    `,
  };

  function layoutHTML() {
    const hl = accentHL(slide.headline||"");
    const tag = slide.tag ? `<div style="margin-bottom:28px"><span class="tag">${escHtml(slide.tag.toUpperCase())}</span></div>` : "";
    const divider = `<div class="div" style="margin:28px auto"></div>`;
    const body = slide.body ? `<div class="body">${escHtml(slide.body)}</div>` : "";

    if (layout==="split" && slide.items?.length >= 2) {
      const [a,b] = slide.items;
      return `<div class="c">
        <div class="panels" style="position:relative">
          <div class="panel"><div class="pl" style="color:${C.accent}">${escHtml(a.label||"")}</div>${a.sub?`<div class="ps">${escHtml(a.sub)}</div>`:""}</div>
          <div class="vs"><div class="vt">${escHtml(slide.vs_label||"VS")}</div></div>
          <div class="panel"><div class="pl" style="opacity:0.75">${escHtml(b.label||"")}</div>${b.sub?`<div class="ps">${escHtml(b.sub)}</div>`:""}</div>
        </div>
        <div class="sb">${tag}<div class="hl">${hl}</div>${slide.body?divider+body:""}</div>
      </div>`;
    }

    if (layout==="cards" && slide.items?.length) {
      return `<div class="c">
        ${tag}<div class="hl">${hl}</div>
        <div class="cg">${slide.items.map((it,i)=>`
          <div class="card">
            <div class="cn">${String(i+1).padStart(2,"0")}</div>
            <div><div class="ct">${escHtml(it.label||it.text||"")}</div>${it.sub?`<div class="cs">${escHtml(it.sub)}</div>`:""}</div>
          </div>`).join("")}
        </div>
      </div>`;
    }

    if (layout==="hero") {
      const ctaItems = slide.cta_items?.length ? slide.cta_items : slide.cta ? [slide.cta] : [];
      return `<div class="c">
        ${slide.icon_symbol?`<div class="hi"><span class="hs">${slide.icon_symbol}</span></div>`:""}
        ${tag}<div class="hl">${hl}</div>
        ${slide.body?divider+body:""}
        ${ctaItems.length?`<div class="cs">${ctaItems.map((c,i)=>`<div class="cb ${i===0?"cp":"cx"}">${escHtml(c)}</div>`).join("")}</div>`:""}
      </div>`;
    }

    if (layout==="quote") {
      return `<div class="c">
        <div class="qm">"</div>
        ${tag}<div class="hl">${hl}</div>
        ${slide.body?divider+body:""}
      </div>`;
    }

    // standard + statement
    const cta = slide.cta ? `<div class="cta">${escHtml(slide.cta)}</div>` : "";
    return `<div class="c">${tag}<div class="hl">${hl}</div>${slide.body?divider+body:""}${cta}</div>`;
  }

  const bgHtml = bgImageUrl ? `
    <img class="bg-img" src="${bgImageUrl}" crossorigin="anonymous"/>
    <div class="bg-ov" style="background:linear-gradient(to bottom,rgba(0,0,0,${Math.min((overlayDark||65)/100*0.92,0.88)}) 0%,rgba(0,0,0,${Math.min((overlayDark||65)/100*0.42,0.5)}) 40%,rgba(0,0,0,${Math.min((overlayDark||65)/100*0.95,0.92)}) 100%)"></div>` : "";

  const avHtml = profileUrl
    ? `<img src="${profileUrl}" crossorigin="anonymous"/>`
    : `<div class="av-i">${escHtml((name||"?")[0].toUpperCase())}</div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>${base}${layouts[layout]||layouts.standard}</style>
</head><body>
<div class="slide">
  ${bgHtml}
  ${C.dark?'<div class="noise"></div>':""}
  <div class="bk tl"></div><div class="bk tr"></div>
  <div class="bk bl"></div><div class="bk br"></div>
  ${C.dark?'<div class="fade"></div>':""}
  <div class="badge">
    <div class="av">${avHtml}</div>
    <div>
      <div class="bn">${escHtml(name||"Your Brand")}${blueTick?` <span class="tick">✓</span>`:""}</div>
      <div class="bh">${escHtml(handle||"@yourhandle")}</div>
    </div>
  </div>
  ${showNums?`<div class="wm">${String(idx+1).padStart(2,"0")}</div><div class="cnt">${idx+1} / ${total}</div>`:""}
  ${layoutHTML()}
  ${websiteUrl?`<div class="site">${escHtml(websiteUrl)}</div>`:""}
  <div class="brand">BUILD WITH TAV</div>
</div>
</body></html>`;
}

// ─── PREVIEW ─────────────────────────────────────────────

function SlidePreview({ slide, idx, total, opts, onClick, isActive }) {
  const ref = useRef(null);
  const isPortrait = opts.ratio === "portrait";
  const W = 1080, H = isPortrait ? 1920 : 1080;
  const scale = 320 / W;
  const ph = H * scale;

  useEffect(() => {
    const iframe = ref.current; if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open(); doc.write(buildSlideHTML(slide,idx,total,opts)); doc.close();
  }, [JSON.stringify({slide,opts,idx,total})]);

  return (
    <div onClick={onClick} title={slide.tag||`Slide ${idx+1}`} style={{ cursor:"pointer", borderRadius:8, overflow:"hidden", border:`2px solid ${isActive?"#0A0A0A":"transparent"}`, transition:"border-color 0.15s", position:"relative", width:320, height:ph, flexShrink:0 }}>
      <iframe ref={ref} style={{ width:W, height:H, border:"none", transform:`scale(${scale})`, transformOrigin:"top left", pointerEvents:"none", display:"block" }} sandbox="allow-same-origin" title={`slide-${idx+1}`}/>
      <div style={{ position:"absolute", bottom:4, right:4, fontSize:10, color:"rgba(255,255,255,0.85)", background:"rgba(0,0,0,0.6)", padding:"2px 6px", borderRadius:4, fontWeight:700 }}>{idx+1}</div>
    </div>
  );
}

// ─── DOWNLOAD ────────────────────────────────────────────

async function downloadSlideAsPNG(slide, idx, total, opts, filename) {
  const isPortrait = opts.ratio === "portrait";
  const W = 1080, H = isPortrait ? 1920 : 1080;
  const html = buildSlideHTML(slide, idx, total, opts);
  const res = await fetch("/api/screenshot", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ html, width:W, height:H }),
  });
  if (!res.ok) throw new Error(`Screenshot failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = filename; a.href = url; a.click();
  URL.revokeObjectURL(url);
}

// ─── STORAGE / HELPERS ────────────────────────────────────

function loadS() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null"); } catch { return null; } }
function saveS(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }
function Spin({c="#fff"}) { return <div style={{width:14,height:14,borderRadius:"50%",border:`2px solid rgba(255,255,255,0.15)`,borderTop:`2px solid ${c}`,animation:"spin 0.7s linear infinite",flexShrink:0}}/>; }

// ─── APP ─────────────────────────────────────────────────

export default function App() {
  const S = loadS();
  const [tab, setTab] = useState("generate");
  const [profileUrl, setProfileUrl] = useState(S?.profileUrl||null);
  const [name, setName] = useState(S?.name||"");
  const [handle, setHandle] = useState(S?.handle||"");
  const [blueTick, setBlueTick] = useState(S?.blueTick??false);
  const [website, setWebsite] = useState(S?.website||"");
  const [showWebsite, setShowWebsite] = useState(S?.showWebsite??false);
  const [voiceProfile, setVoiceProfile] = useState(S?.voiceProfile||"");
  const [businessType, setBusinessType] = useState(S?.businessType||"");
  const [otherType, setOtherType] = useState(S?.otherType||"");
  const [theme, setTheme] = useState(S?.theme||"dark-gold");
  const [fontId, setFontId] = useState(S?.fontId||"montserrat");
  const [showNums, setShowNums] = useState(S?.showNums??true);
  const [customBg, setCustomBg] = useState(S?.customBg||"#0A0A0A");
  const [customAccent, setCustomAccent] = useState(S?.customAccent||"#C9A84C");
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("ai");
  const [slideCount, setSlideCount] = useState(6);
  const [coverImage, setCoverImage] = useState(null);
  const [imageMode, setImageMode] = useState("cover");
  const [overlayDark, setOverlayDark] = useState(65);
  const [ratio, setRatio] = useState("square");
  const [err, setErr] = useState("");
  const [view, setView] = useState("setup");
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);
  const [rewritePrompt, setRewritePrompt] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [lastTopic, setLastTopic] = useState("");
  const [lastTone, setLastTone] = useState("ai");

  const profileRef = useRef(null);
  const coverRef = useRef(null);

  useEffect(() => { saveS({profileUrl,name,handle,blueTick,website,showWebsite,voiceProfile,businessType,otherType,theme,fontId,showNums,customBg,customAccent}); }, [profileUrl,name,handle,blueTick,website,showWebsite,voiceProfile,businessType,otherType,theme,fontId,showNums,customBg,customAccent]);

  const readFile = (e,cb) => { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>cb(ev.target.result); r.readAsDataURL(f); };

  const fetchWithRetry = async (body, tries=4) => {
    for (let i=0;i<=tries;i++) {
      try {
        const res = await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
        if(!res.ok) throw new Error(`${res.status}`);
        return await res.json();
      } catch(e) { if(i===tries)throw e; await new Promise(r=>setTimeout(r,2000+i*1000)); }
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

  const buildPrompt = (topicStr, toneStr) => {
    const toneLabel = TONES.find(t=>t.id===toneStr)?.label||"Tav Decides";
    const toneDesc = TONES.find(t=>t.id===toneStr)?.desc||"";
    const btLabel = businessType==="other"?(otherType||"brand"):BUSINESS_TYPES.find(b=>b.id===businessType)?.label||"";
    const voice = voiceProfile||(btLabel?`Write for a ${btLabel}. Direct, specific, speak to real problems. No hype.`:"Direct and honest. Short punchy sentences. Real problems. No hype, no fluff.");
    return `You are creating an Instagram carousel${btLabel?` for a ${btLabel}`:""}.
You are BOTH the copywriter AND the visual creative director. Make every slide earn its place.

VOICE: ${voice}
TOPIC: "${topicStr}"${keywords?`\nKEY THEMES: ${keywords}`:""}
TONE: ${toneLabel}${toneDesc?` — ${toneDesc}`:""}
SLIDES: ${slideCount}

NARRATIVE ARC: hook → reality → insight → shift → advice → CTA

LAYOUT SYSTEM — pick the right layout for each slide:
- "statement" — MASSIVE headline, almost no body. For bold provocative claims. Very large type. Use for SLIDE 1 (the hook) — make it feel almost wrong to scroll past.
- "standard" — headline + body. Good for most slides.
- "split" — two panels side by side with VS. ONLY when comparing two distinct things. Requires "items" array: [{label,sub},{label,sub}]. Add "vs_label".
- "cards" — numbered rows. For listing 3-5 specific points. Requires "items" array: [{label,text or sub}].
- "quote" — giant quote mark, italic. For a single powerful human truth. No more than one per carousel.
- "hero" — icon + big headline + CTA buttons. ALWAYS use for the final slide. Add "icon_symbol" (one unicode char: ✦ ◆ ★ ✺ ⬡) and "cta_items" array of 1-2 strings.

RULES:
- No two consecutive slides use the same layout
- Slide 1 is ALWAYS "statement" — provocative, specific, makes them stop
- Final slide is ALWAYS "hero"
- Pick ONE word from each headline for "accent_word" — must appear exactly in the headline
- Slide titles: editorial, specific — NOT "HOOK", "SLIDE 1", "CTA", "INTRO"
- Headlines: max 8 words, punchy
- Body: 1-2 sentences, every word earns its place
- Only final slide gets cta. All others cta is null.
- No HTML, no cite tags, plain text only

Return ONLY valid JSON array:
[{"tag":"LABEL","headline":"text","body":"text","accent_word":"word","layout":"type","items":[],"vs_label":"VS","icon_symbol":"◆","cta_items":[],"cta":null}]`;
  };

  const generate = async (topicOverride, toneOverride) => {
    const t=topicOverride||topic, tn=toneOverride||tone;
    if(!t.trim()){setErr("Please add a topic first.");return;}
    setErr(""); setView("generating"); setLastTopic(t); setLastTone(tn);
    try {
      const d = await fetchWithRetry({model:"claude-opus-4-7",max_tokens:3000,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:buildPrompt(t,tn)}]});
      const raw = d.content?.find(b=>b.type==="text")?.text||"";
      const clean = raw.replace(/<cite[^>]*>/g,"").replace(/<\/cite>/g,"").replace(/<[^>]+>/g,"");
      const m = clean.match(/\[[\s\S]*\]/);
      if(!m) throw new Error("no json");
      setSlides(JSON.parse(m[0]).map(sanitize)); setActive(0); setView("preview");
    } catch { setErr("Generation failed — please try again."); setView("setup"); }
  };

  const regenerate = () => generate(lastTopic, lastTone);

  const rewrite = async () => {
    if(!rewritePrompt.trim())return; setRewriting(true);
    try {
      const d = await fetchWithRetry({model:"claude-opus-4-7",max_tokens:600,messages:[{role:"user",content:`Rewrite this carousel slide: "${rewritePrompt}"\n\nCurrent:\n${JSON.stringify(slides[active],null,2)}\n\nVoice: ${voiceProfile||"Direct, honest, specific."}\n\nReturn ONLY a JSON object with same structure. No markdown, no HTML.`}]});
      const raw=(d.content?.find(b=>b.type==="text")?.text||"").replace(/<[^>]+>/g,"");
      const m=raw.match(/\{[\s\S]*\}/);
      if(m){const next=[...slides];next[active]=sanitize(JSON.parse(m[0]));setSlides(next);setRewritePrompt("");}
    } catch {}
    setRewriting(false);
  };

  const updateSlide = (k,v) => { const next=[...slides]; next[active]={...next[active],[k]:v}; setSlides(next); };

  const slideOpts = useCallback(i => ({
    theme, fontId, showNums, name, handle, blueTick,
    websiteUrl: showWebsite?website:"", ratio, overlayDark, customBg, customAccent, profileUrl,
    bgImageUrl: coverImage?(imageMode==="all"?coverImage:(i===0?coverImage:null)):null,
  }), [theme,fontId,showNums,name,handle,blueTick,website,showWebsite,ratio,overlayDark,customBg,customAccent,profileUrl,coverImage,imageMode]);

  const downloadOne = async i => {
    setDownloading(true);
    try {
      await downloadSlideAsPNG(slides[i],i,slides.length,slideOpts(i),`slide-${i+1}.png`);
      setDownloadDone(true); setTimeout(()=>setDownloadDone(false),2000);
    } catch(e) { console.error(e); alert("Download failed. Please try again."); }
    setDownloading(false);
  };

  const downloadAll = async () => {
    setDownloadingAll(true);
    for(let i=0;i<slides.length;i++) {
      try { await downloadSlideAsPNG(slides[i],i,slides.length,slideOpts(i),`slide-${i+1}.png`); await new Promise(r=>setTimeout(r,600)); }
      catch(e) { console.error(e); }
    }
    setDownloadingAll(false);
    setDownloadDone(true); setTimeout(()=>setDownloadDone(false),2500);
  };

  // ── UI ──
  const A = {bg:"#F5F3EF",surface:"#FFF",border:"#E8E5E0",text:"#0A0A0A",muted:"#8A8780",accentText:"#FFF",input:"#FFF"};
  const inp = {width:"100%",background:A.input,border:`1.5px solid ${A.border}`,borderRadius:10,padding:"11px 14px",color:A.text,fontSize:14,fontFamily:"inherit"};
  const lbl = {display:"block",fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:A.muted,marginBottom:7};
  const tog = (on,set) => (
    <div onClick={()=>set(!on)} style={{width:44,height:24,borderRadius:12,background:on?A.text:A.border,position:"relative",cursor:"pointer",flexShrink:0,transition:"background 0.2s"}}>
      <div style={{position:"absolute",top:3,left:on?23:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:A.bg,color:A.text,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(0.8);opacity:0}50%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
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
          <div style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,#1a1a1a 0%,#2a2a2a 100%)`,border:`1.5px solid ${GOLD}44`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{color:GOLD,fontSize:12,fontWeight:900}}>C</span>
          </div>
          <span style={{fontSize:13,fontWeight:800,color:A.text,letterSpacing:-0.3}}>Carousel Studio</span>
          <span style={{fontSize:11,color:A.muted,fontWeight:500}}>by <span style={{color:GOLD,fontWeight:700}}>Build with Tav</span></span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {view==="preview"&&<>
            <button onClick={regenerate} style={{background:"transparent",border:`1.5px solid ${A.border}`,color:A.muted,padding:"5px 14px",borderRadius:7,fontSize:12,fontWeight:600}}>↺ Regenerate</button>
            <button onClick={()=>{setView("setup");setSlides([]);}} style={{background:"transparent",border:`1.5px solid ${A.border}`,color:A.muted,padding:"5px 14px",borderRadius:7,fontSize:12,fontWeight:600}}>← New</button>
          </>}
          <button onClick={()=>{localStorage.removeItem(STORAGE_KEY);window.location.reload();}} style={{background:"transparent",border:`1.5px solid ${A.border}`,color:A.muted,padding:"5px 14px",borderRadius:7,fontSize:12}}>Reset</button>
        </div>
      </nav>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"28px 24px"}}>

        {/* SETUP */}
        {view==="setup"&&(
          <div style={{animation:"fadeUp 0.3s ease"}}>
            <div style={{marginBottom:20,maxWidth:560}}>
              <h1 style={{fontSize:28,fontWeight:800,lineHeight:1.2,margin:"0 0 8px",letterSpacing:-0.8}}>Turn a topic into a carousel that converts.</h1>
              <p style={{color:A.muted,fontSize:14,lineHeight:1.6,margin:0}}>Write your topic. Claude handles strategy, copy, and design — in your voice.</p>
            </div>

            <div style={{background:A.surface,borderRadius:16,border:`1.5px solid ${A.border}`,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>
              {/* Tabs */}
              <div style={{display:"flex",borderBottom:`1px solid ${A.border}`,background:A.bg}}>
                {[["generate","Generate"],["brand","Brand"],["visual","Visual"]].map(([id,label])=>(
                  <button key={id} onClick={()=>setTab(id)} style={{background:"none",border:"none",borderBottom:tab===id?`2px solid ${GOLD}`:"2px solid transparent",color:tab===id?A.text:A.muted,padding:"12px 20px",fontSize:12,fontWeight:tab===id?700:500,marginBottom:-1,letterSpacing:0.3,textTransform:"uppercase"}}>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{padding:26}}>

                {/* GENERATE TAB */}
                {tab==="generate"&&(
                  <div style={{display:"flex",flexDirection:"column",gap:20}}>
                    <div>
                      <label style={lbl}>I am a...</label>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {BUSINESS_TYPES.map(bt=>(
                          <button key={bt.id} onClick={()=>setBusinessType(bt.id)} style={{background:businessType===bt.id?A.text:A.bg,border:`1.5px solid ${businessType===bt.id?A.text:A.border}`,borderRadius:20,padding:"5px 14px",fontSize:12,color:businessType===bt.id?A.accentText:A.muted,fontWeight:businessType===bt.id?700:500}}>
                            {bt.label}
                          </button>
                        ))}
                      </div>
                      {businessType==="other"&&<input value={otherType} onChange={e=>setOtherType(e.target.value)} placeholder="e.g. Tattoo artist, PT, wedding photographer..." style={{...inp,marginTop:10,fontSize:13}}/>}
                    </div>

                    <div>
                      <label style={lbl}>What's this carousel about? *</label>
                      <input value={topic} onChange={e=>{setTopic(e.target.value);if(err)setErr("");}}
                        placeholder={businessType==="marketer"?"e.g. Why your content gets views but zero clients":businessType==="creator"?"e.g. Why most creators burn out before they make money":businessType==="coach"?"e.g. The real reason high achievers still feel stuck":businessType==="restaurant"?"e.g. Why our Sunday roast sells out every week":"e.g. Why most businesses fail on social media in year one"}
                        style={{...inp,fontSize:15,fontWeight:500,borderColor:err?"#c0392b":A.border}}
                        onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)generate();}}/>
                      {err&&<p style={{color:"#c0392b",fontSize:12,margin:"6px 0 0",fontWeight:600}}>⚠ {err}</p>}
                    </div>

                    <div>
                      <label style={lbl}>Themes / keywords <span style={{letterSpacing:0,fontWeight:400,fontSize:9}}>(optional)</span></label>
                      <input value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="e.g. key themes, angles, or words you want included" style={inp}/>
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                      <div>
                        <label style={lbl}>Tone</label>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          {TONES.map(t=>(
                            <button key={t.id} onClick={()=>setTone(t.id)} style={{background:tone===t.id?A.text:A.bg,border:`1.5px solid ${tone===t.id?A.text:A.border}`,borderRadius:8,padding:"8px 13px",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <span style={{fontSize:12,fontWeight:700,color:tone===t.id?A.accentText:A.text}}>{t.label}</span>
                              <span style={{fontSize:11,color:tone===t.id?"rgba(255,255,255,0.5)":A.muted}}>{t.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{display:"flex",flexDirection:"column",gap:18}}>
                        <div>
                          <label style={lbl}>Slides</label>
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <button onClick={()=>setSlideCount(Math.max(3,slideCount-1))} style={{width:34,height:34,borderRadius:8,background:A.bg,border:`1.5px solid ${A.border}`,color:A.text,fontSize:18,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                            <span style={{fontSize:26,fontWeight:800,minWidth:28,textAlign:"center"}}>{slideCount}</span>
                            <button onClick={()=>setSlideCount(Math.min(12,slideCount+1))} style={{width:34,height:34,borderRadius:8,background:A.bg,border:`1.5px solid ${A.border}`,color:A.text,fontSize:18,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                          </div>
                        </div>
                        <div>
                          <label style={lbl}>Format</label>
                          <div style={{display:"flex",gap:5}}>
                            {[["square","Square 1:1"],["portrait","Stories 9:16"]].map(([id,label])=>(
                              <button key={id} onClick={()=>setRatio(id)} style={{flex:1,background:ratio===id?A.text:A.bg,border:`1.5px solid ${ratio===id?A.text:A.border}`,color:ratio===id?A.accentText:A.muted,padding:"7px",borderRadius:7,fontSize:11,fontWeight:700}}>{label}</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label style={lbl}>Image <span style={{letterSpacing:0,fontWeight:400,fontSize:9}}>(optional)</span></label>
                          <div onClick={()=>coverRef.current?.click()} style={{background:A.bg,border:`1.5px dashed ${coverImage?A.text:A.border}`,borderRadius:9,padding:"10px",cursor:"pointer",textAlign:"center"}}>
                            <span style={{fontSize:12,fontWeight:600,color:coverImage?A.text:A.muted}}>{coverImage?"✓ Image ready":"Upload image"}</span>
                          </div>
                          <input ref={coverRef} type="file" accept="image/*" onChange={e=>readFile(e,setCoverImage)} style={{display:"none"}}/>
                          {coverImage&&<>
                            <div style={{display:"flex",gap:5,marginTop:7}}>
                              {[["cover","Cover only"],["all","All slides"]].map(([id,label])=>(
                                <button key={id} onClick={()=>setImageMode(id)} style={{flex:1,background:imageMode===id?A.text:A.bg,border:`1.5px solid ${imageMode===id?A.text:A.border}`,color:imageMode===id?A.accentText:A.muted,padding:"6px",borderRadius:7,fontSize:11,fontWeight:700}}>{label}</button>
                              ))}
                            </div>
                            <div style={{marginTop:8}}><label style={lbl}>Overlay — {overlayDark}%</label><input type="range" min={20} max={85} value={overlayDark} onChange={e=>setOverlayDark(+e.target.value)}/></div>
                          </>}
                        </div>
                      </div>
                    </div>

                    <button onClick={()=>generate()} style={{width:"100%",padding:"14px",background:`linear-gradient(135deg,#1a1a1a,#0a0a0a)`,color:A.accentText,borderRadius:10,fontSize:15,fontWeight:800,border:`1px solid ${GOLD}33`,marginTop:4,boxShadow:`0 0 0 1px ${GOLD}22`}}>
                      Generate Carousel →
                    </button>
                    <p style={{textAlign:"center",color:A.muted,fontSize:11,margin:"-8px 0 0"}}>⌘ + Enter · ~15–25 seconds</p>
                  </div>
                )}

                {/* BRAND TAB */}
                {tab==="brand"&&(
                  <div style={{display:"flex",flexDirection:"column",gap:20}}>
                    <div>
                      <label style={lbl}>Profile photo</label>
                      <div style={{display:"flex",alignItems:"center",gap:14}}>
                        <div onClick={()=>profileRef.current?.click()} style={{width:64,height:64,borderRadius:"50%",border:`2px solid ${A.border}`,overflow:"hidden",background:A.bg,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                          {profileUrl?<img src={profileUrl} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{color:A.muted,fontSize:20}}>+</span>}
                        </div>
                        <div onClick={()=>profileRef.current?.click()} style={{flex:1,background:A.bg,border:`1.5px dashed ${A.border}`,borderRadius:9,padding:12,cursor:"pointer",textAlign:"center"}}>
                          <span style={{color:A.muted,fontSize:13}}>{profileUrl?"Click to change photo":"Upload square photo for best results"}</span>
                        </div>
                        <input ref={profileRef} type="file" accept="image/*" onChange={e=>readFile(e,setProfileUrl)} style={{display:"none"}}/>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      <div><label style={lbl}>Display name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name or brand" style={inp}/></div>
                      <div><label style={lbl}>Handle</label><input value={handle} onChange={e=>setHandle(e.target.value)} placeholder="@yourhandle" style={inp}/></div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:14,padding:16,background:A.bg,borderRadius:10}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div><div style={{fontWeight:600,fontSize:13}}>Blue tick</div><div style={{color:A.muted,fontSize:12}}>Verified badge on slides</div></div>
                        {tog(blueTick,setBlueTick)}
                      </div>
                      <div style={{borderTop:`1px solid ${A.border}`,paddingTop:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div><div style={{fontWeight:600,fontSize:13}}>Website on slides</div><div style={{color:A.muted,fontSize:12}}>Show URL at bottom</div></div>
                        {tog(showWebsite,setShowWebsite)}
                      </div>
                      {showWebsite&&<input value={website} onChange={e=>setWebsite(e.target.value)} placeholder="www.yoursite.co" style={inp}/>}
                    </div>
                    <div>
                      <label style={lbl}>Voice profile <span style={{letterSpacing:0,fontWeight:400,fontSize:9}}>(sent with every prompt)</span></label>
                      <p style={{color:A.muted,fontSize:13,margin:"0 0 10px",lineHeight:1.6}}>Describe your tone, audience, what to avoid, and CTA style. More specific = better output.</p>
                      <textarea value={voiceProfile} onChange={e=>setVoiceProfile(e.target.value)} placeholder="e.g. Write in a direct, honest tone. Speak to people tired of the hype. Short punchy sentences. Never overpromise. CTA is always soft — 'free preview in bio'." rows={5} style={{...inp,resize:"vertical",lineHeight:1.7}}/>
                    </div>
                  </div>
                )}

                {/* VISUAL TAB */}
                {tab==="visual"&&(
                  <div style={{display:"flex",flexDirection:"column",gap:20}}>
                    <div>
                      <label style={lbl}>Colour theme</label>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
                        {THEMES.map(t=>(
                          <button key={t.id} onClick={()=>setTheme(t.id)} style={{background:theme===t.id?A.text:A.bg,border:`1.5px solid ${theme===t.id?GOLD:A.border}`,borderRadius:10,padding:"10px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                            <div style={{display:"flex",gap:3}}>
                              <div style={{width:16,height:16,borderRadius:4,background:t.id==="custom"?customBg:t.bg,border:"1px solid rgba(0,0,0,0.1)"}}/>
                              <div style={{width:16,height:16,borderRadius:4,background:t.id==="custom"?customAccent:t.accent}}/>
                            </div>
                            <span style={{fontSize:10,fontWeight:700,color:theme===t.id?A.accentText:A.text}}>{t.label}</span>
                          </button>
                        ))}
                      </div>
                      {theme==="custom"&&(
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12,padding:14,background:A.bg,borderRadius:10}}>
                          <div><label style={lbl}>Background</label><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="color" value={customBg} onChange={e=>setCustomBg(e.target.value)} style={{width:34,height:34,borderRadius:6,border:`1px solid ${A.border}`,cursor:"pointer",padding:2}}/><input value={customBg} onChange={e=>setCustomBg(e.target.value)} style={{...inp,flex:1,fontSize:12}}/></div></div>
                          <div><label style={lbl}>Accent</label><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="color" value={customAccent} onChange={e=>setCustomAccent(e.target.value)} style={{width:34,height:34,borderRadius:6,border:`1px solid ${A.border}`,cursor:"pointer",padding:2}}/><input value={customAccent} onChange={e=>setCustomAccent(e.target.value)} style={{...inp,flex:1,fontSize:12}}/></div></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={lbl}>Font</label>
                      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                        {FONTS.map(f=>(
                          <button key={f.id} onClick={()=>setFontId(f.id)} style={{background:fontId===f.id?A.text:A.bg,border:`1.5px solid ${fontId===f.id?GOLD:A.border}`,borderRadius:8,padding:"7px 14px"}}>
                            <span style={{fontFamily:`"${f.css}",serif`,fontSize:14,fontWeight:700,color:fontId===f.id?A.accentText:A.text}}>{f.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:16,background:A.bg,borderRadius:10}}>
                      <div><div style={{fontWeight:600,fontSize:13}}>Slide numbers</div><div style={{color:A.muted,fontSize:12}}>Watermark number on each slide</div></div>
                      {tog(showNums,setShowNums)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GENERATING */}
        {view==="generating"&&(
          <div style={{textAlign:"center",padding:"100px 0",animation:"fadeUp 0.3s ease"}}>
            <div style={{width:44,height:44,borderRadius:"50%",border:`3px solid ${A.border}`,borderTop:`3px solid ${GOLD}`,animation:"spin 0.8s linear infinite",margin:"0 auto 22px"}}/>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:GOLD,marginBottom:8}}>Creating</div>
            <div style={{fontSize:22,fontWeight:800,marginBottom:6}}>Writing and designing {slideCount} slides</div>
            <div style={{color:A.muted,fontSize:14}}>"{lastTopic}" · Making layout decisions, writing copy…</div>
          </div>
        )}

        {/* PREVIEW */}
        {view==="preview"&&slides.length>0&&(
          <div style={{animation:"fadeUp 0.3s ease"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:28,alignItems:"start"}}>
              <div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
                  {slides.map((slide,i)=>(
                    <SlidePreview key={`${i}-${theme}-${fontId}-${JSON.stringify(slide)}`} slide={slide} idx={i} total={slides.length} opts={slideOpts(i)} onClick={()=>setActive(i)} isActive={active===i}/>
                  ))}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>downloadOne(active)} disabled={downloading} style={{flex:1,background:A.surface,border:`1.5px solid ${A.border}`,color:A.text,padding:"10px",borderRadius:9,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    {downloading?<><Spin c={A.text}/>Processing...</>:downloadDone?`✓ Downloaded`:`↓ Slide ${active+1}`}
                  </button>
                  <button onClick={downloadAll} disabled={downloadingAll} style={{flex:2,background:`linear-gradient(135deg,#1a1a1a,#0a0a0a)`,color:A.accentText,padding:"10px",borderRadius:9,fontSize:13,fontWeight:800,border:`1px solid ${GOLD}33`,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {downloadingAll?<><Spin/>Downloading...</>:downloadDone?`✓ All Downloaded`:`↓ Download All ${slides.length}`}
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
                    <label style={lbl}>Layout <span style={{letterSpacing:0,fontWeight:400,fontSize:9}}>(auto-set by AI)</span></label>
                    <select value={slides[active]?.layout||"standard"} onChange={e=>updateSlide("layout",e.target.value)} style={{...inp,height:42}}>
                      {["standard","statement","split","cards","quote","hero"].map(l=><option key={l} value={l}>{l}</option>)}
                    </select>
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
        <span style={{color:A.muted,fontSize:12}}>
          <a href="https://www.buildwithtav.co" target="_blank" rel="noopener noreferrer" style={{color:GOLD,fontWeight:700,textDecoration:"none"}}>Build with Tav</a>
          {" · "}
          <a href="https://www.buildwithtav.co" target="_blank" rel="noopener noreferrer" style={{color:A.muted,textDecoration:"none"}}>buildwithtav.co</a>
        </span>
      </footer>
    </div>
  );
}
