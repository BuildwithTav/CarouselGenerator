"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Script from "next/script";

// ─── THEMES ──────────────────────────────────────────────
const THEMES = [
  { id:"dark-gold", label:"Dark Gold",  bg:"#0A0A0A", accent:"#C9A84C", text:"#FFFFFF", sub:"rgba(255,255,255,0.7)", dark:true },
  { id:"midnight",  label:"Midnight",   bg:"#0D1117", accent:"#7C9EFF", text:"#E8EAF2", sub:"rgba(232,234,242,0.7)", dark:true },
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

const STORAGE_KEY = "bwt_v6";

// ─── SLIDE HTML RENDERER ─────────────────────────────────
// Generates styled HTML for each slide — full creative control

function slideStyles(C, fontCss, W=1080) {
  const fs = W / 1080; // scale factor
  return `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Playfair+Display:wght@700;900&family=Poppins:wght@700;800;900&family=Inter:wght@700;800;900&family=Oswald:wght@600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .slide {
      width: ${W}px; height: ${W}px;
      background: ${C.bg};
      font-family: '${fontCss}', sans-serif;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .slide.portrait { height: ${W * 16/9}px; }
    .noise {
      position: absolute; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
      pointer-events: none; opacity: 0.5;
    }
    .bracket { position: absolute; width: 52px; height: 52px; }
    .bracket-tl { top: 44px; left: 52px; border-top: 2.5px solid ${C.accent}; border-left: 2.5px solid ${C.accent}; opacity: 0.4; }
    .bracket-tr { top: 44px; right: 52px; border-top: 2.5px solid ${C.accent}; border-right: 2.5px solid ${C.accent}; opacity: 0.4; }
    .bracket-bl { bottom: 44px; left: 52px; border-bottom: 2.5px solid ${C.accent}; border-left: 2.5px solid ${C.accent}; opacity: 0.4; }
    .bracket-br { bottom: 44px; right: 52px; border-bottom: 2.5px solid ${C.accent}; border-right: 2.5px solid ${C.accent}; opacity: 0.4; }
    .fade-bottom {
      position: absolute; bottom: 0; left: 0; right: 0; height: 40%;
      background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.55));
      pointer-events: none;
    }
    .badge {
      position: absolute; top: 60px; left: 60px;
      display: flex; align-items: center; gap: 12px;
      background: ${C.dark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.8)'};
      padding: 10px 18px 10px 10px;
      border-radius: 50px;
    }
    .avatar {
      width: 58px; height: 58px; border-radius: 50%;
      border: 3px solid ${C.accent};
      object-fit: cover; flex-shrink: 0;
      background: ${C.dark ? '#222' : '#ddd'};
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .avatar-init {
      font-size: 22px; font-weight: 800; color: ${C.accent};
      font-family: '${fontCss}', sans-serif;
    }
    .badge-name { font-size: 18px; font-weight: 800; color: ${C.dark ? '#fff' : '#111'}; line-height: 1.1; font-family: '${fontCss}', sans-serif; }
    .badge-handle { font-size: 13px; color: ${C.dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'}; font-family: '${fontCss}', sans-serif; }
    .tick { display: inline-block; width: 16px; height: 16px; background: #1D9BF0; border-radius: 50%; text-align: center; line-height: 16px; font-size: 9px; color: white; margin-left: 4px; }
    .watermark {
      position: absolute; bottom: 30px; right: 40px;
      font-size: 220px; font-weight: 900; line-height: 1;
      color: ${C.dark ? 'rgba(255,255,255,0.032)' : 'rgba(0,0,0,0.035)'};
      font-family: '${fontCss}', sans-serif;
      user-select: none; pointer-events: none;
    }
    .counter {
      position: absolute; top: 52px; right: 60px;
      font-size: 13px; font-weight: 700;
      color: ${C.accent}88;
      font-family: '${fontCss}', sans-serif;
    }
    .content {
      width: 100%; padding: 0 80px;
      display: flex; flex-direction: column; align-items: center;
      gap: 0; text-align: center; position: relative; z-index: 2;
    }
    .tag {
      background: ${C.accent}; color: ${C.dark ? '#000' : '#fff'};
      font-size: 13px; font-weight: 800; letter-spacing: 2px;
      padding: 7px 20px; border-radius: 50px;
      margin-bottom: 28px; font-family: '${fontCss}', sans-serif;
      display: inline-block;
    }
    .headline {
      font-size: 88px; font-weight: 900; line-height: 1.08;
      color: ${C.text}; margin-bottom: 0;
      font-family: '${fontCss}', sans-serif;
      text-shadow: ${C.dark ? '0 2px 20px rgba(0,0,0,0.8)' : 'none'};
    }
    .headline .accent { color: ${C.accent}; }
    .divider {
      width: 80px; height: 1px; background: ${C.accent}; opacity: 0.5;
      margin: 28px auto; position: relative;
    }
    .divider::after {
      content: ''; position: absolute;
      top: -4px; left: 50%; transform: translateX(-50%) rotate(45deg);
      width: 9px; height: 9px; background: ${C.accent}; opacity: 0.9;
    }
    .body {
      font-size: 28px; line-height: 1.6;
      color: ${C.sub}; max-width: 820px;
      font-family: '${fontCss}', sans-serif;
      text-shadow: ${C.dark ? '0 1px 12px rgba(0,0,0,0.7)' : 'none'};
    }
    .cta-box {
      margin-top: 40px;
      border: 1px solid ${C.accent}55;
      background: ${C.accent}18;
      padding: 22px 50px; border-radius: 8px;
      font-size: 26px; font-weight: 800;
      color: ${C.accent}; font-family: '${fontCss}', sans-serif;
      width: 100%; max-width: 860px; text-align: center;
    }
    .website {
      position: absolute; bottom: 30px; left: 0; right: 0;
      text-align: center; font-size: 16px;
      color: ${C.dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.25)'};
      font-family: '${fontCss}', sans-serif;
    }
    .brand-name {
      position: absolute; bottom: 12px; left: 0; right: 0;
      text-align: center; font-size: 12px; font-weight: 700; letter-spacing: 3px;
      color: ${C.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
      font-family: '${fontCss}', sans-serif;
    }
    .bg-img {
      position: absolute; inset: 0;
      object-fit: cover; width: 100%; height: 100%;
    }
    .bg-overlay {
      position: absolute; inset: 0;
      pointer-events: none;
    }
  `;
}

function renderAccent(headline, accentWord, accentColor) {
  if (!accentWord || !headline.includes(accentWord)) return headline;
  const idx = headline.indexOf(accentWord);
  const before = headline.substring(0, idx);
  const after = headline.substring(idx + accentWord.length);
  return `${before}<span class="accent">${accentWord}</span>${after}`;
}

function buildSlideHTML(slide, idx, total, opts) {
  const { theme, fontId, bgImageUrl, overlayDark, profileUrl, name, handle, blueTick, websiteUrl, showNums, customBg, customAccent, ratio } = opts;
  const themeObj = THEMES.find(t => t.id === theme) || THEMES[0];
  const C = theme === "custom" ? { ...themeObj, bg: customBg || "#0A0A0A", accent: customAccent || "#C9A84C" } : themeObj;
  const fontObj = FONTS.find(f => f.id === fontId) || FONTS[0];
  const isPortrait = ratio === "portrait";
  const W = 1080;

  const headlineHtml = renderAccent(slide.headline || "", slide.accent_word || "", C.accent);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${slideStyles(C, fontObj.css, W)}</style>
</head>
<body style="margin:0;padding:0;background:${C.bg}">
<div class="slide${isPortrait ? ' portrait' : ''}" id="slide">
  ${C.dark ? '<div class="noise"></div>' : ''}
  <div class="bracket bracket-tl"></div>
  <div class="bracket bracket-tr"></div>
  <div class="bracket bracket-bl"></div>
  <div class="bracket bracket-br"></div>
  ${C.dark ? '<div class="fade-bottom"></div>' : ''}

  ${bgImageUrl ? `
    <img class="bg-img" src="${bgImageUrl}" crossorigin="anonymous" />
    <div class="bg-overlay" style="background: linear-gradient(to bottom, rgba(0,0,0,${Math.min((overlayDark||65)/100*0.95,0.9)}) 0%, rgba(0,0,0,${Math.min((overlayDark||65)/100*0.45,0.55)}) 40%, rgba(0,0,0,${Math.min((overlayDark||65)/100*0.98,0.95)}) 100%)"></div>
  ` : ''}

  <div class="badge">
    <div class="avatar">
      ${profileUrl
        ? `<img src="${profileUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" crossorigin="anonymous" />`
        : `<span class="avatar-init">${(name||"?")[0].toUpperCase()}</span>`
      }
    </div>
    <div>
      <div class="badge-name">${name || "Your Brand"}${blueTick ? ' <span class="tick">✓</span>' : ''}</div>
      <div class="badge-handle">${handle || "@yourhandle"}</div>
    </div>
  </div>

  ${showNums ? `
    <div class="watermark">${String(idx+1).padStart(2,"0")}</div>
    <div class="counter">${idx+1} / ${total}</div>
  ` : ''}

  <div class="content">
    ${slide.tag ? `<div class="tag">${slide.tag.toUpperCase()}</div>` : ''}
    <div class="headline">${headlineHtml}</div>
    ${slide.body ? `<div class="divider"></div><div class="body">${slide.body}</div>` : ''}
    ${slide.cta ? `<div class="cta-box">${slide.cta}</div>` : ''}
  </div>

  ${websiteUrl ? `<div class="website">${websiteUrl}</div>` : ''}
  <div class="brand-name">BUILD WITH TAV</div>
</div>
</body>
</html>`;
}

// ─── STORAGE ─────────────────────────────────────────────
function loadS() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null"); } catch { return null; } }
function saveS(d) { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(d)); } catch {} }
function Spin({c="#fff"}) { return <div style={{width:15,height:15,borderRadius:"50%",border:`2px solid rgba(255,255,255,0.2)`,borderTop:`2px solid ${c}`,animation:"spin 0.7s linear infinite",flexShrink:0}}/>; }

// ─── SLIDE PREVIEW ───────────────────────────────────────
function SlidePreview({ slide, idx, total, opts, onClick, isActive }) {
  const iframeRef = useRef(null);
  const html = buildSlideHTML(slide, idx, total, opts);
  const isPortrait = opts.ratio === "portrait";
  const iH = isPortrait ? 1920 : 1080;
  const scale = 1 / 3.375;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open(); doc.write(html); doc.close();
  }, [html]);

  return (
    <div onClick={onClick} style={{ cursor:"pointer", borderRadius:8, overflow:"hidden", border:`2px solid ${isActive?"#0A0A0A":"transparent"}`, transition:"border-color 0.15s", position:"relative", aspectRatio: isPortrait?"9/16":"1/1" }}>
      <iframe
        ref={iframeRef}
        style={{ width:1080, height:iH, border:"none", transform:`scale(${scale})`, transformOrigin:"top left", pointerEvents:"none", display:"block" }}
        sandbox="allow-same-origin"
        title={`slide-${idx+1}`}
      />
      <div style={{ position:"absolute", bottom:4, right:4, fontSize:10, color:"rgba(255,255,255,0.85)", background:"rgba(0,0,0,0.6)", padding:"2px 6px", borderRadius:4, fontWeight:700 }}>{idx+1}</div>
    </div>
  );
}

// ─── DOWNLOAD ENGINE ─────────────────────────────────────
async function downloadSlideAsPNG(slide, idx, total, opts, filename) {
  const isPortrait = opts.ratio === "portrait";
  const W = 1080, H = isPortrait ? 1920 : 1080;
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${W}px;height:${H}px;border:none;`;
    document.body.appendChild(iframe);

    const html = buildSlideHTML(slide, idx, total, opts);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    doc.open(); doc.write(html); doc.close();

    setTimeout(async () => {
      try {
        const win = iframe.contentWindow;
        if (!win.html2canvas) {
          const script = doc.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
          doc.head.appendChild(script);
          await new Promise(r => { script.onload = r; setTimeout(r, 3000); });
        }
        const el = doc.getElementById("slide");
        const canvas = await win.html2canvas(el, {
          useCORS: true,
          allowTaint: false,
          scale: 1,
          width: W,
          height: H,
          backgroundColor: null,
          logging: false,
        });
        const a = document.createElement("a");
        a.download = filename;
        a.href = canvas.toDataURL("image/png", 1.0);
        a.click();
        document.body.removeChild(iframe);
        resolve();
      } catch(e) {
        document.body.removeChild(iframe);
        reject(e);
      }
    }, 1500);
  });
}

// ─── APP ─────────────────────────────────────────────────
export default function App() {
  const S = loadS();
  const [tab, setTab] = useState("generate");

  // Brand (saved)
  const [profileUrl, setProfileUrl] = useState(S?.profileUrl||null);
  const [name, setName] = useState(S?.name||"");
  const [handle, setHandle] = useState(S?.handle||"");
  const [blueTick, setBlueTick] = useState(S?.blueTick??false);
  const [website, setWebsite] = useState(S?.website||"");
  const [showWebsite, setShowWebsite] = useState(S?.showWebsite??false);
  const [voiceProfile, setVoiceProfile] = useState(S?.voiceProfile||"");
  const [businessType, setBusinessType] = useState(S?.businessType||"");
  const [otherType, setOtherType] = useState(S?.otherType||"");

  // Visual (saved)
  const [theme, setTheme] = useState(S?.theme||"dark-gold");
  const [fontId, setFontId] = useState(S?.fontId||"montserrat");
  const [showNums, setShowNums] = useState(S?.showNums??true);
  const [customBg, setCustomBg] = useState(S?.customBg||"#0A0A0A");
  const [customAccent, setCustomAccent] = useState(S?.customAccent||"#C9A84C");

  // Per generation
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("ai");
  const [slideCount, setSlideCount] = useState(6);
  const [coverImage, setCoverImage] = useState(null);
  const [imageMode, setImageMode] = useState("cover");
  const [overlayDark, setOverlayDark] = useState(65);
  const [ratio, setRatio] = useState("square");
  const [err, setErr] = useState("");

  // App state
  const [view, setView] = useState("setup");
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);
  const [rewritePrompt, setRewritePrompt] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [lastTopic, setLastTopic] = useState("");
  const [lastTone, setLastTone] = useState("ai");
  const [html2canvasReady, setHtml2canvasReady] = useState(false);

  const profileRef = useRef(null);
  const coverRef = useRef(null);

  useEffect(() => { saveS({ profileUrl,name,handle,blueTick,website,showWebsite,voiceProfile,businessType,otherType,theme,fontId,showNums,customBg,customAccent }); }, [profileUrl,name,handle,blueTick,website,showWebsite,voiceProfile,businessType,otherType,theme,fontId,showNums,customBg,customAccent]);

  const readFile = (e,cb) => { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>cb(ev.target.result); r.readAsDataURL(f); };

  const fetchWithRetry = async (body, tries=4) => {
    for (let i=0; i<=tries; i++) {
      try {
        const res = await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
        if (!res.ok) throw new Error(`${res.status}`);
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
  });

  const buildPrompt = (topicStr, toneStr) => {
    const toneLabel = TONES.find(t=>t.id===toneStr)?.label||"Tav Decides";
    const toneDesc = TONES.find(t=>t.id===toneStr)?.desc||"";
    const btLabel = businessType==="other"?(otherType||"brand"):BUSINESS_TYPES.find(b=>b.id===businessType)?.label||"";
    const voice = voiceProfile || (btLabel ? `Write for a ${btLabel}. Direct, specific, speak to real problems the audience faces. No hype, no filler.` : "Direct and honest. Short punchy sentences. Speak to real problems. No hype, no fluff.");
    return `You are creating an Instagram carousel${btLabel?` for a ${btLabel}`:""}.

You are the copywriter and creative director. Make every slide genuinely stop someone mid-scroll.

VOICE:
${voice}

TOPIC: "${topicStr}"${keywords?`\nKEY THEMES / KEYWORDS: ${keywords}`:""}
TONE: ${toneLabel}${toneDesc?` — ${toneDesc}`:""}
SLIDES: ${slideCount}

Write a carousel with a clear narrative arc: hook → reality → insight → shift → advice → CTA.

Rules:
- Pick ONE word from each headline to render in the brand accent colour — put it in "accent_word" exactly as it appears
- Slide titles (tag): short, editorial, interesting — like a magazine section header. NOT "HOOK" or "SLIDE 1"
- Headlines: max 8 words, punchy and specific — no vague phrases
- Body: 1-2 sentences max, every word earns its place
- Last slide only gets a cta string — soft, specific, non-pushy. All others cta is null
- No HTML tags, no cite tags, clean plain text only
- Max 1-2 stats across the whole carousel — balance with insight, human truth, advice

Return ONLY a valid JSON array, nothing else:
[{"tag":"LABEL","headline":"headline here","body":"body here","accent_word":"word","cta":null}]`;
  };

  const generate = async (topicOverride, toneOverride) => {
    const t = topicOverride||topic;
    const tn = toneOverride||tone;
    if (!t.trim()) { setErr("Please add a topic first."); return; }
    setErr(""); setView("generating"); setLastTopic(t); setLastTone(tn);
    try {
      const d = await fetchWithRetry({model:"claude-opus-4-7",max_tokens:2500,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:buildPrompt(t,tn)}]});
      const raw = d.content?.find(b=>b.type==="text")?.text||"";
      const clean = raw.replace(/<cite[^>]*>/g,"").replace(/<\/cite>/g,"").replace(/<[^>]+>/g,"");
      const m = clean.match(/\[[\s\S]*\]/);
      if (!m) throw new Error("no json");
      setSlides(JSON.parse(m[0]).map(sanitize)); setActive(0); setView("preview");
    } catch { setErr("Generation failed — please try again."); setView("setup"); }
  };

  const regenerate = () => generate(lastTopic, lastTone);

  const rewrite = async () => {
    if (!rewritePrompt.trim()) return; setRewriting(true);
    try {
      const d = await fetchWithRetry({model:"claude-opus-4-7",max_tokens:500,messages:[{role:"user",content:`Rewrite this carousel slide: "${rewritePrompt}"\n\nCurrent:\n${JSON.stringify(slides[active],null,2)}\n\nVoice: ${voiceProfile||"Direct, honest, specific."}\n\nReturn ONLY a JSON object. No markdown, no HTML.`}]});
      const raw = (d.content?.find(b=>b.type==="text")?.text||"").replace(/<[^>]+>/g,"");
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { const next=[...slides]; next[active]=sanitize(JSON.parse(m[0])); setSlides(next); setRewritePrompt(""); }
    } catch {}
    setRewriting(false);
  };

  const updateSlide = (k,v) => { const next=[...slides]; next[active]={...next[active],[k]:v}; setSlides(next); };

  const canvasOpts = useCallback(() => ({
    theme, fontId, showNums, name, handle, blueTick,
    websiteUrl: showWebsite?website:"",
    ratio, overlayDark, customBg, customAccent,
    profileUrl,
  }), [theme,fontId,showNums,name,handle,blueTick,website,showWebsite,ratio,overlayDark,customBg,customAccent,profileUrl]);

  const slideOpts = useCallback((i) => ({
    ...canvasOpts(),
    bgImageUrl: coverImage?(imageMode==="all"?coverImage:(i===0?coverImage:null)):null,
  }), [canvasOpts,coverImage,imageMode]);

  const downloadOne = async (idx) => {
    setDownloading(true);
    try {
      await downloadSlideAsPNG(slides[idx], idx, slides.length, slideOpts(idx), `slide-${idx+1}.png`);
    } catch(e) { console.error(e); }
    setDownloading(false);
  };

  const downloadAll = async () => {
    setDownloadingAll(true);
    for (let i=0; i<slides.length; i++) {
      try {
        await downloadSlideAsPNG(slides[i], i, slides.length, slideOpts(i), `slide-${i+1}.png`);
        await new Promise(r=>setTimeout(r,800));
      } catch(e) { console.error(e); }
    }
    setDownloadingAll(false);
  };

  // UI
  const A = { bg:"#F5F3EF", surface:"#FFF", border:"#E8E5E0", text:"#0A0A0A", muted:"#8A8780", accentText:"#FFF", input:"#FFF" };
  const inp = { width:"100%", background:A.input, border:`1.5px solid ${A.border}`, borderRadius:10, padding:"11px 14px", color:A.text, fontSize:14, fontFamily:"inherit" };
  const lbl = { display:"block", fontSize:10, fontWeight:700, letterSpacing:3, textTransform:"uppercase", color:A.muted, marginBottom:7 };
  const tog = (on,set) => <div onClick={()=>set(!on)} style={{width:44,height:24,borderRadius:12,background:on?A.text:A.border,position:"relative",cursor:"pointer",flexShrink:0,transition:"background 0.2s"}}><div style={{position:"absolute",top:3,left:on?23:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/></div>;
  const TABS = [["generate","Generate"],["brand","Brand"],["visual","Visual"]];

  return (
    <div style={{minHeight:"100vh",background:A.bg,color:A.text,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
        strategy="afterInteractive"
        onLoad={() => setHtml2canvasReady(true)}
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}input,textarea{outline:none!important;font-family:inherit}
        button{cursor:pointer;font-family:inherit;border:none;transition:all 0.15s}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${A.border};border-radius:2px}
        input[type=range]{-webkit-appearance:none;height:3px;border-radius:2px;background:${A.border};width:100%}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${A.text};cursor:pointer}
        ::placeholder{color:${A.muted};opacity:0.65}
        iframe{display:block}
      `}</style>

      {/* NAV */}
      <nav style={{borderBottom:`1px solid ${A.border}`,padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,position:"sticky",top:0,background:`${A.bg}EE`,backdropFilter:"blur(20px)",zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:26,height:26,borderRadius:6,background:A.text,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{color:"#fff",fontSize:11,fontWeight:800}}>C</span>
          </div>
          <span style={{fontSize:13,fontWeight:800}}>Carousel Studio</span>
          <span style={{fontSize:11,color:A.muted}}>by Build with Tav</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {view==="preview"&&<>
            <button onClick={regenerate} style={{background:"transparent",border:`1.5px solid ${A.border}`,color:A.muted,padding:"5px 12px",borderRadius:7,fontSize:12,fontWeight:600}}>↺ Regenerate</button>
            <button onClick={()=>{setView("setup");setSlides([]);}} style={{background:"transparent",border:`1.5px solid ${A.border}`,color:A.muted,padding:"5px 12px",borderRadius:7,fontSize:12,fontWeight:600}}>← New</button>
          </>}
          <button onClick={()=>{localStorage.removeItem(STORAGE_KEY);window.location.reload();}} style={{background:"transparent",border:`1.5px solid ${A.border}`,color:A.muted,padding:"5px 12px",borderRadius:7,fontSize:12}}>Reset</button>
        </div>
      </nav>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 24px"}}>

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
                {TABS.map(([id,label])=>(
                  <button key={id} onClick={()=>setTab(id)} style={{background:"none",border:"none",borderBottom:tab===id?`2px solid ${A.text}`:"2px solid transparent",color:tab===id?A.text:A.muted,padding:"12px 20px",fontSize:12,fontWeight:tab===id?700:500,marginBottom:-1,letterSpacing:0.3,textTransform:"uppercase"}}>{label}</button>
                ))}
              </div>

              <div style={{padding:26}}>

                {/* GENERATE */}
                {tab==="generate"&&(
                  <div style={{display:"flex",flexDirection:"column",gap:20}}>
                    {/* Business type */}
                    <div>
                      <label style={lbl}>I am a...</label>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {BUSINESS_TYPES.map(bt=>(
                          <button key={bt.id} onClick={()=>setBusinessType(bt.id)} style={{background:businessType===bt.id?A.text:A.bg,border:`1.5px solid ${businessType===bt.id?A.text:A.border}`,borderRadius:20,padding:"5px 14px",fontSize:12,color:businessType===bt.id?A.accentText:A.muted,fontWeight:businessType===bt.id?700:500}}>{bt.label}</button>
                        ))}
                      </div>
                      {businessType==="other"&&<input value={otherType} onChange={e=>setOtherType(e.target.value)} placeholder="e.g. Tattoo artist, wedding photographer..." style={{...inp,marginTop:10,fontSize:13}}/>}
                    </div>
                    {/* Topic */}
                    <div>
                      <label style={lbl}>What's this carousel about? *</label>
                      <input value={topic} onChange={e=>{setTopic(e.target.value);if(err)setErr("");}}
                        placeholder={
                          businessType==="marketer"?"e.g. Why your content gets views but zero clients":
                          businessType==="creator"?"e.g. Why most creators burn out before they make money":
                          businessType==="coach"?"e.g. The real reason high achievers still feel stuck":
                          businessType==="business"?"e.g. Why most businesses fail on social media in year one":
                          businessType==="restaurant"?"e.g. Why our Sunday roast sells out every single week":
                          businessType==="personal"?"e.g. What I gave up to finally start living on my terms":
                          businessType==="other"?"e.g. What makes what I do genuinely different":
                          "e.g. Why most businesses fail on social media in year one"
                        }
                        style={{...inp,fontSize:15,fontWeight:500,borderColor:err?"#c0392b":A.border}}
                        onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)generate();}}/>
                      {err&&<p style={{color:"#c0392b",fontSize:12,margin:"6px 0 0",fontWeight:600}}>⚠ {err}</p>}
                    </div>
                    {/* Keywords */}
                    <div>
                      <label style={lbl}>Themes / keywords <span style={{letterSpacing:0,fontWeight:400,fontSize:9}}>(optional)</span></label>
                      <input value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="e.g. key themes, angles, or words you want included" style={inp}/>
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                      {/* Tone */}
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
                      {/* Slides + image */}
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
                          <label style={lbl}>Image <span style={{letterSpacing:0,fontWeight:400,fontSize:9}}>(optional)</span></label>
                          <div onClick={()=>coverRef.current?.click()} style={{background:A.bg,border:`1.5px dashed ${coverImage?A.text:A.border}`,borderRadius:9,padding:"10px",cursor:"pointer",textAlign:"center"}}>
                            <span style={{fontSize:12,fontWeight:600,color:coverImage?A.text:A.muted}}>{coverImage?"✓ Image ready — click to change":"Upload image"}</span>
                          </div>
                          <input ref={coverRef} type="file" accept="image/*" onChange={e=>readFile(e,setCoverImage)} style={{display:"none"}}/>
                          {coverImage&&<>
                            <div style={{display:"flex",gap:5,marginTop:7}}>
                              {[["cover","Cover only"],["all","All slides"]].map(([id,label])=>(
                                <button key={id} onClick={()=>setImageMode(id)} style={{flex:1,background:imageMode===id?A.text:A.bg,border:`1.5px solid ${imageMode===id?A.text:A.border}`,color:imageMode===id?A.accentText:A.muted,padding:"6px",borderRadius:7,fontSize:11,fontWeight:700}}>{label}</button>
                              ))}
                            </div>
                            <div style={{marginTop:8}}>
                              <label style={lbl}>Overlay — {overlayDark}%</label>
                              <input type="range" min={20} max={85} value={overlayDark} onChange={e=>setOverlayDark(+e.target.value)}/>
                            </div>
                          </>}
                        </div>
                        <div>
                          <label style={lbl}>Format</label>
                          <div style={{display:"flex",gap:5}}>
                            {[["square","Square 1:1"],["portrait","Stories 9:16"]].map(([id,label])=>(
                              <button key={id} onClick={()=>setRatio(id)} style={{flex:1,background:ratio===id?A.text:A.bg,border:`1.5px solid ${ratio===id?A.text:A.border}`,color:ratio===id?A.accentText:A.muted,padding:"7px",borderRadius:7,fontSize:11,fontWeight:700}}>{label}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button onClick={()=>generate()} style={{width:"100%",padding:"14px",background:A.text,color:A.accentText,borderRadius:10,fontSize:15,fontWeight:800,border:"none",marginTop:4}}>
                      Generate Carousel →
                    </button>
                    <p style={{textAlign:"center",color:A.muted,fontSize:11,margin:"-8px 0 0"}}>⌘ + Enter · ~15–25 seconds</p>
                  </div>
                )}

                {/* BRAND */}
                {tab==="brand"&&(
                  <div style={{display:"flex",flexDirection:"column",gap:20}}>
                    <div>
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
                      <label style={lbl}>Voice profile <span style={{letterSpacing:0,fontWeight:400,fontSize:9}}>(gets sent with every prompt)</span></label>
                      <p style={{color:A.muted,fontSize:13,margin:"0 0 10px",lineHeight:1.6}}>Describe your tone, audience, what to avoid, and CTA style. The more specific, the better the output.</p>
                      <textarea value={voiceProfile} onChange={e=>setVoiceProfile(e.target.value)} placeholder="e.g. Write in a direct, honest tone. Speak to people tired of the hype. Short punchy sentences. Never overpromise. CTA is always soft — 'free preview in bio'." rows={5} style={{...inp,resize:"vertical",lineHeight:1.7}}/>
                    </div>
                  </div>
                )}

                {/* VISUAL */}
                {tab==="visual"&&(
                  <div style={{display:"flex",flexDirection:"column",gap:20}}>
                    <div>
                      <label style={lbl}>Colour theme</label>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
                        {THEMES.map(t=>(
                          <button key={t.id} onClick={()=>setTheme(t.id)} style={{background:theme===t.id?A.text:A.bg,border:`1.5px solid ${theme===t.id?A.text:A.border}`,borderRadius:10,padding:"10px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
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
                          <div>
                            <label style={lbl}>Background</label>
                            <div style={{display:"flex",gap:8,alignItems:"center"}}>
                              <input type="color" value={customBg} onChange={e=>setCustomBg(e.target.value)} style={{width:34,height:34,borderRadius:6,border:`1px solid ${A.border}`,cursor:"pointer",padding:2}}/>
                              <input value={customBg} onChange={e=>setCustomBg(e.target.value)} style={{...inp,flex:1,fontSize:12}}/>
                            </div>
                          </div>
                          <div>
                            <label style={lbl}>Accent</label>
                            <div style={{display:"flex",gap:8,alignItems:"center"}}>
                              <input type="color" value={customAccent} onChange={e=>setCustomAccent(e.target.value)} style={{width:34,height:34,borderRadius:6,border:`1px solid ${A.border}`,cursor:"pointer",padding:2}}/>
                              <input value={customAccent} onChange={e=>setCustomAccent(e.target.value)} style={{...inp,flex:1,fontSize:12}}/>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={lbl}>Font</label>
                      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                        {FONTS.map(f=>(
                          <button key={f.id} onClick={()=>setFontId(f.id)} style={{background:fontId===f.id?A.text:A.bg,border:`1.5px solid ${fontId===f.id?A.text:A.border}`,borderRadius:8,padding:"7px 14px"}}>
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
            <div style={{width:44,height:44,borderRadius:"50%",border:`3px solid ${A.border}`,borderTop:`3px solid ${A.text}`,animation:"spin 0.8s linear infinite",margin:"0 auto 22px"}}/>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:A.muted,marginBottom:8}}>Creating</div>
            <div style={{fontSize:22,fontWeight:800,marginBottom:6}}>Writing and designing {slideCount} slides</div>
            <div style={{color:A.muted,fontSize:14}}>Researching, writing, making creative decisions…</div>
          </div>
        )}

        {/* PREVIEW */}
        {view==="preview"&&slides.length>0&&(
          <div style={{animation:"fadeUp 0.3s ease"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:24}}>
              {/* Slides grid */}
              <div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
                  {slides.map((slide,i)=>(
                    <SlidePreview
                      key={`${i}-${JSON.stringify(slideOpts(i))}-${JSON.stringify(slide)}`}
                      slide={slide} idx={i} total={slides.length}
                      opts={slideOpts(i)}
                      onClick={()=>setActive(i)}
                      isActive={active===i}
                    />
                  ))}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>downloadOne(active)} disabled={downloading} style={{flex:1,background:A.surface,border:`1.5px solid ${A.border}`,color:A.text,padding:"10px",borderRadius:9,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    {downloading?<><Spin c={A.text}/>Processing...</>:`↓ Slide ${active+1}`}
                  </button>
                  <button onClick={downloadAll} disabled={downloadingAll} style={{flex:2,background:A.text,color:A.accentText,padding:"10px",borderRadius:9,fontSize:13,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {downloadingAll?<><Spin/>Downloading...</>:`↓ Download All ${slides.length}`}
                  </button>
                </div>
                {!html2canvasReady&&<p style={{color:A.muted,fontSize:11,textAlign:"center",marginTop:8}}>Download library loading… wait a moment before downloading.</p>}
              </div>

              {/* Editor */}
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:A.muted}}>Edit Slide {active+1}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {slides.map((_,i)=>(
                    <button key={i} onClick={()=>setActive(i)} style={{width:27,height:27,borderRadius:6,background:active===i?A.text:A.surface,border:`1.5px solid ${active===i?A.text:A.border}`,color:active===i?A.accentText:A.muted,fontSize:12,fontWeight:700}}>{i+1}</button>
                  ))}
                </div>
                <div style={{background:A.surface,borderRadius:12,border:`1.5px solid ${A.border}`,padding:18,display:"flex",flexDirection:"column",gap:13}}>
                  <div><label style={lbl}>Slide Title</label><input value={slides[active]?.tag||""} onChange={e=>updateSlide("tag",e.target.value)} style={inp}/></div>
                  <div><label style={lbl}>Headline</label><textarea value={slides[active]?.headline||""} onChange={e=>updateSlide("headline",e.target.value)} rows={3} style={{...inp,resize:"vertical",lineHeight:1.5}}/></div>
                  <div><label style={lbl}>Accent word <span style={{letterSpacing:0,fontWeight:400,fontSize:9}}>(renders in colour)</span></label><input value={slides[active]?.accent_word||""} onChange={e=>updateSlide("accent_word",e.target.value)} placeholder="exact word from headline" style={inp}/></div>
                  <div><label style={lbl}>Body</label><textarea value={slides[active]?.body||""} onChange={e=>updateSlide("body",e.target.value)} rows={3} style={{...inp,resize:"vertical",lineHeight:1.6}}/></div>
                  <div><label style={lbl}>CTA <span style={{letterSpacing:0,fontWeight:400,fontSize:9}}>(leave blank to hide)</span></label><input value={slides[active]?.cta||""} onChange={e=>updateSlide("cta",e.target.value||null)} placeholder="e.g. Free preview → bio" style={inp}/></div>
                </div>
                <div style={{background:A.surface,borderRadius:12,border:`1.5px solid ${A.border}`,padding:18}}>
                  <label style={lbl}>AI Rewrite</label>
                  <textarea value={rewritePrompt} onChange={e=>setRewritePrompt(e.target.value)} placeholder={`"Make this punchier"\n"Add a specific stat"\n"Rewrite as a bold statement"`} rows={3} style={{...inp,resize:"vertical",lineHeight:1.5,marginBottom:10}}/>
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
          <a href="https://www.buildwithtav.co" target="_blank" rel="noopener noreferrer" style={{color:A.text,fontWeight:700,textDecoration:"none"}}>Build with Tav</a>
          {" · "}
          <a href="https://www.buildwithtav.co" target="_blank" rel="noopener noreferrer" style={{color:A.muted,textDecoration:"none"}}>buildwithtav.co</a>
        </span>
      </footer>
    </div>
  );
}
