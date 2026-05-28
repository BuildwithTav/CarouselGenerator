import { useState, useRef, useEffect, useCallback } from "react";

const FONTS = [
  { id:"montserrat", label:"Montserrat", headline:"Montserrat", body:"Montserrat" },
  { id:"playfair",   label:"Playfair",   headline:"Playfair Display", body:"Playfair Display" },
  { id:"poppins",    label:"Poppins",    headline:"Poppins", body:"Poppins" },
  { id:"inter",      label:"Inter",      headline:"Inter", body:"Inter" },
  { id:"oswald",     label:"Oswald",     headline:"Oswald", body:"Oswald" },
];

async function loadFonts() {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Playfair+Display:wght@700;900&family=Poppins:wght@700;800;900&family=Inter:wght@700;800;900&family=Oswald:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(link);
  await new Promise(r => setTimeout(r, 1500));
  await document.fonts.ready;
}

const SLIDE_THEMES = [
  { id:"dark-gold", label:"Dark Gold",  bg:"#0A0A0A", accent:"#C9A84C", text:"#FFFFFF", sub:"rgba(255,255,255,0.72)", dark:true },
  { id:"midnight",  label:"Midnight",   bg:"#0D1117", accent:"#7C9EFF", text:"#E8EAF2", sub:"rgba(232,234,242,0.72)", dark:true },
  { id:"noir",      label:"Noir",       bg:"#050505", accent:"#FFFFFF", text:"#FFFFFF", sub:"rgba(255,255,255,0.65)", dark:true },
  { id:"editorial", label:"Editorial",  bg:"#F8F6F2", accent:"#1A1A1A", text:"#0A0A0A", sub:"rgba(10,10,10,0.62)", dark:false },
  { id:"forest",    label:"Forest",     bg:"#111E11", accent:"#7DBE7D", text:"#E8F5E8", sub:"rgba(232,245,232,0.7)", dark:true },
  { id:"navy",      label:"Navy",       bg:"#0A1628", accent:"#E8C97A", text:"#F0EAD6", sub:"rgba(240,234,214,0.7)", dark:true },
  { id:"custom",    label:"Custom",     bg:"#0A0A0A", accent:"#C9A84C", text:"#FFFFFF", sub:"rgba(255,255,255,0.7)", dark:true },
];

const TONES = [
  { id:"ai",          label:"Tav Decides",    desc:"Full creative control" },
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

const STORAGE_KEY = "bwt_v5";

// ─── CANVAS ──────────────────────────────────────────────
function wrapText(ctx, text, maxW) {
  if (!text) return [];
  const words = text.split(" "); const lines = []; let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function drawSlide(ctx, W, H, slide, idx, total, opts) {
  const { theme, fontId, bgImg, overlayDark, profileImg,
          name, handle, blueTick, websiteUrl, showNums, customBg, customAccent } = opts;

  const themeObj = SLIDE_THEMES.find(t => t.id === theme) || SLIDE_THEMES[0];
  const C = theme === "custom"
    ? { ...themeObj, bg: customBg || "#0A0A0A", accent: customAccent || "#C9A84C" }
    : themeObj;

  const font = FONTS.find(f => f.id === fontId) || FONTS[0];
  const HF = `"${font.headline}"`;
  const BF = `"${font.body}"`;

  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

  if (bgImg) {
    const sc = Math.max(W / bgImg.width, H / bgImg.height);
    ctx.drawImage(bgImg, (W - bgImg.width * sc) / 2, (H - bgImg.height * sc) / 2, bgImg.width * sc, bgImg.height * sc);
    const d = Math.min((overlayDark || 65) / 100, 0.88);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgba(0,0,0,${d * 0.95})`); g.addColorStop(0.4, `rgba(0,0,0,${d * 0.5})`); g.addColorStop(1, `rgba(0,0,0,${d * 0.98})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  if (C.dark) {
    ctx.save(); ctx.globalAlpha = 0.022;
    for (let i = 0; i < 7000; i++) { const v = Math.random() > 0.5 ? 255 : 0; ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1); }
    ctx.restore();
  }

  const b = 52;
  ctx.save(); ctx.strokeStyle = C.accent; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.4;
  [[b,44,44,44,44,b],[W-b,44,W-44,44,W-44,b],[b,H-44,44,H-44,44,H-b],[W-b,H-44,W-44,H-44,W-44,H-b]]
    .forEach(([x1,y1,x2,y2,x3,y3]) => { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.stroke(); });
  ctx.restore();

  if (C.dark) {
    const fade = ctx.createLinearGradient(0, H * 0.6, 0, H);
    fade.addColorStop(0, "rgba(0,0,0,0)"); fade.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = fade; ctx.fillRect(0, H * 0.6, W, H * 0.4);
  }

  // Profile badge
  const avR = 42, avX = 96, avY = 110;
  ctx.fillStyle = C.dark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.82)";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(avX - avR - 10, avY - avR - 10, avR * 2 + 240, avR * 2 + 20, avR + 10);
  else ctx.rect(avX - avR - 10, avY - avR - 10, avR * 2 + 240, avR * 2 + 20);
  ctx.fill();
  ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(avX, avY, avR + 4, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(avX, avY, avR, 0, Math.PI * 2); ctx.clip();
  if (profileImg) {
    const sc = Math.max(avR * 2 / profileImg.width, avR * 2 / profileImg.height);
    ctx.drawImage(profileImg, avX - avR - (profileImg.width * sc - avR * 2) / 2, avY - avR - (profileImg.height * sc - avR * 2) / 2, profileImg.width * sc, profileImg.height * sc);
  } else {
    ctx.fillStyle = C.dark ? "#222" : "#ddd"; ctx.fillRect(avX - avR, avY - avR, avR * 2, avR * 2);
    ctx.fillStyle = C.accent; ctx.font = `bold ${Math.floor(avR * 0.65)}px ${HF}`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText((name || "?")[0].toUpperCase(), avX, avY); ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
  const nx = avX + avR + 14;
  ctx.font = `bold 27px ${HF}`; ctx.textAlign = "left"; ctx.fillStyle = C.dark ? "#fff" : "#111";
  ctx.fillText(name || "Your Brand", nx, avY - 3);
  if (blueTick) {
    ctx.save(); ctx.font = `bold 27px ${HF}`;
    const nw = ctx.measureText(name || "Your Brand").width; ctx.restore();
    const tx = nx + nw + 8, ty = avY - 25;
    ctx.fillStyle = "#1D9BF0"; ctx.beginPath(); ctx.arc(tx + 12, ty + 12, 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(tx + 4, ty + 12); ctx.lineTo(tx + 10, ty + 18); ctx.lineTo(tx + 20, ty + 6); ctx.stroke();
  }
  ctx.font = `20px ${BF}`; ctx.fillStyle = C.dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
  ctx.fillText(handle || "@yourhandle", nx, avY + 20);

  if (showNums) {
    ctx.save();
    ctx.font = `bold ${Math.floor(H * 0.24)}px ${HF}`; ctx.fillStyle = C.dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";
    ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText(String(idx + 1).padStart(2, "0"), W - 40, H - 38);
    ctx.textBaseline = "alphabetic"; ctx.font = `600 15px ${BF}`; ctx.fillStyle = `${C.accent}88`;
    ctx.fillText(`${idx + 1} / ${total}`, W - 62, 60); ctx.restore();
  }

  const cx = W / 2;
  const contentTop = avY + avR + 52;
  const contentBot = H - (websiteUrl ? 76 : 48);
  let curY = contentTop;

  // Tag
  if (slide.tag && slide.tag.trim()) {
    ctx.font = `700 19px ${BF}`; ctx.textAlign = "center";
    const tagText = slide.tag.toUpperCase();
    const tw = ctx.measureText(tagText).width + 36;
    ctx.fillStyle = C.accent;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx - tw / 2, curY, tw, 32, 16); else ctx.rect(cx - tw / 2, curY, tw, 32);
    ctx.fill(); ctx.fillStyle = C.dark ? "#000" : "#fff"; ctx.fillText(tagText, cx, curY + 22); curY += 48;
  }

  // Headline
  const hl = slide.headline || "";
  const hSize = hl.length > 55 ? 54 : hl.length > 40 ? 62 : hl.length > 28 ? 72 : hl.length > 18 ? 82 : 92;
  ctx.font = `bold ${hSize}px ${HF}`; ctx.textAlign = "center";
  const hlLines = wrapText(ctx, hl, W - 160);
  let hlY = curY + hSize;
  for (const line of hlLines) {
    ctx.fillStyle = C.dark ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.07)";
    ctx.fillText(line, cx + 2, hlY + 2);
    const aw = (slide.accent_word || "").trim();
    if (aw && line.includes(aw)) {
      const before = line.substring(0, line.indexOf(aw));
      const after = line.substring(line.indexOf(aw) + aw.length);
      const totalW = ctx.measureText(line).width; const startX = cx - totalW / 2;
      ctx.textAlign = "left";
      ctx.fillStyle = C.text; ctx.fillText(before, startX, hlY);
      ctx.fillStyle = C.accent; ctx.fillText(aw, startX + ctx.measureText(before).width, hlY);
      ctx.fillStyle = C.text; ctx.fillText(after, startX + ctx.measureText(before).width + ctx.measureText(aw).width, hlY);
      ctx.textAlign = "center";
    } else { ctx.fillStyle = C.text; ctx.fillText(line, cx, hlY); }
    hlY += hSize * 1.22;
  }
  curY = hlY - hSize * 0.1;

  // Divider
  const divY = curY + 22;
  ctx.save(); ctx.strokeStyle = C.accent; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.45;
  ctx.beginPath(); ctx.moveTo(cx - 55, divY); ctx.lineTo(cx + 55, divY); ctx.stroke();
  ctx.globalAlpha = 0.9; ctx.fillStyle = C.accent;
  ctx.save(); ctx.translate(cx, divY); ctx.rotate(Math.PI / 4); ctx.fillRect(-4, -4, 8, 8); ctx.restore();
  ctx.restore(); curY = divY + 40;

  // Body
  if (slide.body && slide.body.trim()) {
    ctx.font = `29px ${BF}`; ctx.textAlign = "center";
    for (const line of wrapText(ctx, slide.body, W - 200)) {
      ctx.fillStyle = C.dark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.05)"; ctx.fillText(line, cx + 1, curY + 2);
      ctx.fillStyle = C.sub; ctx.fillText(line, cx, curY); curY += 46;
    }
  }

  // CTA
  if (slide.cta && slide.cta.trim()) {
    const ctaLines = wrapText(ctx, slide.cta, W - 160);
    const lineH = 42; const totalH = ctaLines.length * lineH + 24;
    const ctaY = contentBot - totalH - 16;
    ctx.fillStyle = C.accent; ctx.globalAlpha = 0.13;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(80, ctaY - 12, W - 160, totalH, 8); else ctx.rect(80, ctaY - 12, W - 160, totalH);
    ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = C.accent; ctx.lineWidth = 1; ctx.globalAlpha = 0.3;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(80, ctaY - 12, W - 160, totalH, 8); else ctx.rect(80, ctaY - 12, W - 160, totalH);
    ctx.stroke(); ctx.globalAlpha = 1;
    ctx.font = `bold 28px ${HF}`; ctx.textAlign = "center"; ctx.fillStyle = C.accent;
    let cy = ctaY + lineH / 2;
    for (const line of ctaLines) { ctx.fillText(line, cx, cy); cy += lineH; }
  }

  if (websiteUrl && websiteUrl.trim()) {
    ctx.font = `18px ${BF}`; ctx.textAlign = "center";
    ctx.fillStyle = C.dark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.25)";
    ctx.fillText(websiteUrl.trim(), cx, H - 34);
  }

  ctx.font = `700 16px ${BF}`; ctx.textAlign = "center";
  ctx.fillStyle = C.dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)";
  ctx.fillText("BUILD WITH TAV", cx, H - 14);
}

function SlideCanvas({ slide, idx, total, opts }) {
  const ref = useRef(null);
  const key = JSON.stringify({ slide, theme: opts.theme, fontId: opts.fontId, showNums: opts.showNums, name: opts.name, handle: opts.handle, blueTick: opts.blueTick, websiteUrl: opts.websiteUrl, ratio: opts.ratio, hasBg: !!opts.bgImageUrl, hasProfile: !!opts.profileDataUrl, overlayDark: opts.overlayDark, customBg: opts.customBg, customAccent: opts.customAccent });
  useEffect(() => {
    const canvas = ref.current; if (!canvas || !slide) return;
    const isP = opts.ratio === "portrait"; const W = 1080, H = isP ? 1920 : 1080;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const load = src => new Promise(r => { if (!src) return r(null); const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
    Promise.all([load(opts.bgImageUrl), load(opts.profileDataUrl)]).then(([bgImg, profileImg]) => {
      try { drawSlide(ctx, W, H, slide, idx, total, { ...opts, bgImg, profileImg }); }
      catch(e) { console.error("render error:", e); ctx.fillStyle="#0A0A0A"; ctx.fillRect(0,0,W,H); ctx.fillStyle="#fff"; ctx.font=`bold 60px sans-serif`; ctx.textAlign="center"; ctx.fillText(slide.headline||"",W/2,H/2); }
    });
  }, [key]);
  const isP = opts.ratio === "portrait";
  return <canvas ref={ref} style={{ width: "100%", aspectRatio: isP ? "9/16" : "1/1", display: "block", borderRadius: 8 }} />;
}

function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; } }
function save(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }
function Spinner({ c = "#fff" }) { return <div style={{ width: 15, height: 15, borderRadius: "50%", border: `2px solid rgba(255,255,255,0.2)`, borderTop: `2px solid ${c}`, animation: "spin 0.7s linear infinite", flexShrink: 0 }} />; }

export default function App() {
  const S = load();
  const [tab, setTab] = useState("generate");

  // Brand
  const [profileUrl, setProfileUrl] = useState(S?.profileUrl || null);
  const [name, setName] = useState(S?.name || "");
  const [handle, setHandle] = useState(S?.handle || "");
  const [blueTick, setBlueTick] = useState(S?.blueTick ?? false);
  const [website, setWebsite] = useState(S?.website || "");
  const [showWebsite, setShowWebsite] = useState(S?.showWebsite ?? false);
  const [voiceProfile, setVoiceProfile] = useState(S?.voiceProfile || "");
  const [businessType, setBusinessType] = useState(S?.businessType || "");
  const [otherType, setOtherType] = useState(S?.otherType || "");
  const [buildingVoice, setBuildingVoice] = useState(false);

  // Visual
  const [theme, setTheme] = useState(S?.theme || "dark-gold");
  const [fontId, setFontId] = useState(S?.fontId || "montserrat");
  const [showNums, setShowNums] = useState(S?.showNums ?? true);
  const [customBg, setCustomBg] = useState(S?.customBg || "#0A0A0A");
  const [customAccent, setCustomAccent] = useState(S?.customAccent || "#C9A84C");

  // Per generation
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("ai");
  const [slideCount, setSlideCount] = useState(6);
  const [coverImage, setCoverImage] = useState(null);
  const [imageMode, setImageMode] = useState("cover");
  const [overlayDark, setOverlayDark] = useState(65);
  const [err, setErr] = useState("");

  // App state
  const [view, setView] = useState("setup");
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);
  const [ratio, setRatio] = useState("square");
  const [rewritePrompt, setRewritePrompt] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [lastTopic, setLastTopic] = useState("");
  const [lastTone, setLastTone] = useState("ai");

  const profileRef = useRef(null);
  const coverRef = useRef(null);

  useEffect(() => { loadFonts().then(() => setFontsReady(true)); }, []);
  useEffect(() => { save({ profileUrl, name, handle, blueTick, website, showWebsite, voiceProfile, businessType, otherType, theme, fontId, showNums, customBg, customAccent }); }, [profileUrl, name, handle, blueTick, website, showWebsite, voiceProfile, businessType, otherType, theme, fontId, showNums, customBg, customAccent]);

  const readFile = (e, cb) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => cb(ev.target.result); r.readAsDataURL(f); };

  const fetchWithRetry = async (body, tries = 4) => {
    for (let i = 0; i <= tries; i++) {
      try {
        const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error(`${res.status}`);
        return await res.json();
      } catch (e) { if (i === tries) throw e; await new Promise(r => setTimeout(r, 2000 + i * 1000)); }
    }
  };

  const buildVoice = async () => {
    if (!businessType) return;
    setBuildingVoice(true);
    const btLabel = businessType === "other" ? (otherType || "brand") : BUSINESS_TYPES.find(b => b.id === businessType)?.label || "brand";
    try {
      const d = await fetchWithRetry({ model: "claude-opus-4-7", max_tokens: 400, messages: [{ role: "user", content: `Write a short voice profile (max 120 words) for a ${btLabel} Instagram carousel generator. Start with "Write in a tone that...". Cover: tone, audience, what to avoid, CTA style.` }] });
      setVoiceProfile(d.content?.find(b => b.type === "text")?.text || "");
    } catch {}
    setBuildingVoice(false);
  };

  const sanitizeSlide = s => ({
    tag: (s.tag || "").replace(/<[^>]+>/g, "").trim(),
    headline: (s.headline || "").replace(/<[^>]+>/g, "").trim(),
    body: (s.body || "").replace(/<[^>]+>/g, "").trim(),
    accent_word: (s.accent_word || "").replace(/<[^>]+>/g, "").trim(),
    cta: (s.cta || "").replace(/<[^>]+>/g, "").trim() || null,
  });

  const buildPrompt = (topicStr, toneStr) => {
    const toneLabel = TONES.find(t => t.id === toneStr)?.label || "Tav Decides";
    const toneDesc = TONES.find(t => t.id === toneStr)?.desc || "";
    const btLabel = businessType === "other" ? (otherType || "brand") : BUSINESS_TYPES.find(b => b.id === businessType)?.label || "";
    const voiceSection = voiceProfile
      ? voiceProfile
      : btLabel
        ? `Write for a ${btLabel}. Be direct and specific. Speak to real problems the audience faces. No hype, no filler.`
        : "Direct and honest. Short punchy sentences. Speak to real problems. No hype, no fluff.";
    return `You are creating an Instagram carousel${btLabel ? ` for a ${btLabel}` : ""}.

You are the copywriter and creative director. Make each slide stop someone mid-scroll.

VOICE:
${voiceSection}

TOPIC: "${topicStr}"${keywords ? `\nKEY THEMES / KEYWORDS: ${keywords}` : ""}
TONE: ${toneLabel}${toneDesc ? ` — ${toneDesc}` : ""}
SLIDES: ${slideCount}

Write a carousel with a clear narrative arc: hook → reality → insight → advice → CTA.

For each slide, pick ONE word from the headline to highlight in accent colour — put it in "accent_word" exactly as it appears in the headline.

Slide titles (tag): short, editorial, like a magazine header. Not "HOOK" or "SLIDE 1".
Headlines: max 8 words, punchy and specific.
Body: 1-2 sentences max. Every word earns its place.
Last slide only gets a cta. All others: cta is null.
No HTML tags, no cite tags, plain text only.

Return ONLY valid JSON array:
[{"tag":"LABEL","headline":"headline","body":"body","accent_word":"word","cta":null}]`;
  };

  const generate = async (topicOverride, toneOverride) => {
    const t = topicOverride || topic;
    const tn = toneOverride || tone;
    if (!t.trim()) { setErr("Please add a topic first."); return; }
    setErr(""); setView("generating"); setLastTopic(t); setLastTone(tn);
    try {
      const d = await fetchWithRetry({ model: "claude-opus-4-7", max_tokens: 2500, tools: [{ type: "web_search_20250305", name: "web_search" }], messages: [{ role: "user", content: buildPrompt(t, tn) }] });
      const raw = d.content?.find(b => b.type === "text")?.text || "";
      const clean = raw.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, "").replace(/<[^>]+>/g, "");
      const m = clean.match(/\[[\s\S]*\]/);
      if (!m) throw new Error("no json");
      setSlides(JSON.parse(m[0]).map(sanitizeSlide)); setActive(0); setView("preview");
    } catch { setErr("Generation failed — please try again."); setView("setup"); }
  };

  const regenerate = () => generate(lastTopic, lastTone);

  const rewrite = async () => {
    if (!rewritePrompt.trim()) return; setRewriting(true);
    try {
      const d = await fetchWithRetry({ model: "claude-opus-4-7", max_tokens: 500, messages: [{ role: "user", content: `Rewrite this slide: "${rewritePrompt}"\n\nCurrent:\n${JSON.stringify(slides[active], null, 2)}\n\nVoice: ${voiceProfile || "Direct, honest, specific."}\n\nReturn ONLY a JSON object. No markdown, no HTML.` }] });
      const raw = (d.content?.find(b => b.type === "text")?.text || "").replace(/<[^>]+>/g, "");
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { const next = [...slides]; next[active] = sanitizeSlide(JSON.parse(m[0])); setSlides(next); setRewritePrompt(""); }
    } catch {}
    setRewriting(false);
  };

  const updateSlide = (k, v) => { const next = [...slides]; next[active] = { ...next[active], [k]: v }; setSlides(next); };
  const downloadSlide = useCallback(i => { const cs = document.querySelectorAll("canvas"); if (!cs[i]) return; const a = document.createElement("a"); a.download = `slide-${i + 1}.png`; a.href = cs[i].toDataURL("image/png"); a.click(); }, []);
  const downloadAll = useCallback(async () => { setDownloading(true); const cs = document.querySelectorAll("canvas"); for (let i = 0; i < cs.length; i++) { await new Promise(r => setTimeout(r, 300)); const a = document.createElement("a"); a.download = `slide-${i + 1}.png`; a.href = cs[i].toDataURL("image/png"); a.click(); } setDownloading(false); }, []);
  const canvasOpts = useCallback(i => ({ theme, fontId, showNums, name, handle, blueTick, websiteUrl: showWebsite ? website : "", ratio, overlayDark, customBg, customAccent, bgImageUrl: coverImage ? (imageMode === "all" ? coverImage : i === 0 ? coverImage : null) : null, profileDataUrl: profileUrl }), [theme, fontId, showNums, name, handle, blueTick, website, showWebsite, ratio, overlayDark, customBg, customAccent, coverImage, imageMode, profileUrl]);

  const A = { bg: "#F5F3EF", surface: "#FFF", border: "#E8E5E0", text: "#0A0A0A", muted: "#8A8780", accentText: "#FFF", input: "#FFF" };
  const inp = { width: "100%", background: A.input, border: `1.5px solid ${A.border}`, borderRadius: 10, padding: "11px 14px", color: A.text, fontSize: 14, fontFamily: "inherit" };
  const lbl = { display: "block", fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: A.muted, marginBottom: 7 };
  const tog = (on, set) => <div onClick={() => set(!on)} style={{ width: 44, height: 24, borderRadius: 12, background: on ? A.text : A.border, position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}><div style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} /></div>;

  const TABS = [["generate","Generate"],["brand","Brand"],["visual","Visual"]];

  return (
    <div style={{ minHeight: "100vh", background: A.bg, color: A.text, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        * { box-sizing: border-box } input, textarea { outline: none !important; font-family: inherit }
        button { cursor: pointer; font-family: inherit; border: none; transition: all 0.15s }
        ::-webkit-scrollbar { width: 4px } ::-webkit-scrollbar-thumb { background: ${A.border}; border-radius: 2px }
        input[type=range] { -webkit-appearance:none; height:3px; border-radius:2px; background:${A.border}; width:100% }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; border-radius:50%; background:${A.text}; cursor:pointer }
        ::placeholder { color: ${A.muted}; opacity: 0.65 }
      `}</style>

      {/* NAV */}
      <nav style={{ borderBottom: `1px solid ${A.border}`, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, background: `${A.bg}EE`, backdropFilter: "blur(20px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: A.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>C</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: A.text }}>Carousel Studio</span>
          <span style={{ fontSize: 11, color: A.muted }}>by Build with Tav</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {view === "preview" && <>
            <button onClick={regenerate} style={{ background: "transparent", border: `1.5px solid ${A.border}`, color: A.muted, padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600 }}>↺ Regenerate</button>
            <button onClick={() => { setView("setup"); setSlides([]); }} style={{ background: "transparent", border: `1.5px solid ${A.border}`, color: A.muted, padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600 }}>← New</button>
          </>}
          <button onClick={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }} style={{ background: "transparent", border: `1.5px solid ${A.border}`, color: A.muted, padding: "5px 12px", borderRadius: 7, fontSize: 12 }}>Reset</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {/* SETUP */}
        {view === "setup" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ marginBottom: 22, maxWidth: 560 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, margin: "0 0 8px", letterSpacing: -0.8 }}>Turn a topic into a carousel that converts.</h1>
              <p style={{ color: A.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>Write your topic. Claude handles the strategy, copy, and design — in your voice.</p>
            </div>

            <div style={{ background: A.surface, borderRadius: 16, border: `1.5px solid ${A.border}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              {/* TABS */}
              <div style={{ display: "flex", borderBottom: `1px solid ${A.border}`, background: A.bg }}>
                {TABS.map(([id, label]) => (
                  <button key={id} onClick={() => setTab(id)} style={{ background: "none", border: "none", borderBottom: tab === id ? `2px solid ${A.text}` : "2px solid transparent", color: tab === id ? A.text : A.muted, padding: "12px 20px", fontSize: 12, fontWeight: tab === id ? 700 : 500, marginBottom: -1, letterSpacing: 0.3, textTransform: "uppercase" }}>{label}</button>
                ))}
              </div>

              <div style={{ padding: 26 }}>

                {/* GENERATE TAB */}
                {tab === "generate" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                    {/* Business type */}
                    <div>
                      <label style={lbl}>I am a...</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {BUSINESS_TYPES.map(bt => (
                          <button key={bt.id} onClick={() => setBusinessType(bt.id)} style={{ background: businessType === bt.id ? A.text : A.bg, border: `1.5px solid ${businessType === bt.id ? A.text : A.border}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, color: businessType === bt.id ? A.accentText : A.muted, fontWeight: businessType === bt.id ? 700 : 500 }}>{bt.label}</button>
                        ))}
                      </div>
                      {businessType === "other" && (
                        <input value={otherType} onChange={e => setOtherType(e.target.value)} placeholder="e.g. Tattoo artist, wedding photographer, PT..." style={{ ...inp, marginTop: 10, fontSize: 13 }} />
                      )}
                    </div>

                    {/* Topic */}
                    <div>
                      <label style={lbl}>What's this carousel about? *</label>
                      <input value={topic} onChange={e => { setTopic(e.target.value); if (err) setErr(""); }}
                        placeholder={
                          businessType === "marketer"   ? "e.g. Why your content gets views but zero clients" :
                          businessType === "creator"    ? "e.g. Why most creators burn out before they make money" :
                          businessType === "coach"      ? "e.g. The real reason high achievers still feel stuck" :
                          businessType === "business"   ? "e.g. Why most businesses fail on social media in year one" :
                          businessType === "restaurant" ? "e.g. Why our Sunday roast sells out every single week" :
                          businessType === "personal"   ? "e.g. What I gave up to finally start living on my terms" :
                          businessType === "other"      ? "e.g. What makes what I do genuinely different" :
                          "e.g. Why most businesses fail on social media in year one"
                        }
                        style={{ ...inp, fontSize: 15, fontWeight: 500, borderColor: err ? "#c0392b" : A.border }}
                        onKeyDown={e => { if (e.key === "Enter" && e.metaKey) generate(); }} />
                      {err && <p style={{ color: "#c0392b", fontSize: 12, margin: "6px 0 0", fontWeight: 600 }}>⚠ {err}</p>}
                    </div>

                    {/* Keywords */}
                    <div>
                      <label style={lbl}>Themes / keywords <span style={{ letterSpacing: 0, fontWeight: 400, fontSize: 9 }}>(optional — helps Claude focus)</span></label>
                      <input value={keywords} onChange={e => setKeywords(e.target.value)}
                        placeholder={
                          businessType === "marketer"   ? "e.g. organic growth, 2026 algorithm, content strategy" :
                          businessType === "creator"    ? "e.g. monetisation, audience trust, niche down" :
                          businessType === "coach"      ? "e.g. burnout, identity, high performance" :
                          businessType === "restaurant" ? "e.g. locally sourced, seasonal menu, story behind dish" :
                          businessType === "personal"   ? "e.g. mindset, lifestyle change, real talk" :
                          "e.g. key words, themes, angles you want included"
                        }
                        style={inp} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                      {/* Tone */}
                      <div>
                        <label style={lbl}>Tone</label>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {TONES.map(t => (
                            <button key={t.id} onClick={() => setTone(t.id)} style={{ background: tone === t.id ? A.text : A.bg, border: `1.5px solid ${tone === t.id ? A.text : A.border}`, borderRadius: 8, padding: "8px 13px", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: tone === t.id ? A.accentText : A.text }}>{t.label}</span>
                              <span style={{ fontSize: 11, color: tone === t.id ? "rgba(255,255,255,0.5)" : A.muted }}>{t.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Slides + image */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        <div>
                          <label style={lbl}>Slides</label>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <button onClick={() => setSlideCount(Math.max(3, slideCount - 1))} style={{ width: 34, height: 34, borderRadius: 8, background: A.bg, border: `1.5px solid ${A.border}`, color: A.text, fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                            <span style={{ fontSize: 26, fontWeight: 800, minWidth: 28, textAlign: "center" }}>{slideCount}</span>
                            <button onClick={() => setSlideCount(Math.min(12, slideCount + 1))} style={{ width: 34, height: 34, borderRadius: 8, background: A.bg, border: `1.5px solid ${A.border}`, color: A.text, fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                          </div>
                        </div>
                        <div>
                          <label style={lbl}>Image <span style={{ letterSpacing: 0, fontWeight: 400, fontSize: 9 }}>(optional)</span></label>
                          <div onClick={() => coverRef.current?.click()} style={{ background: A.bg, border: `1.5px dashed ${coverImage ? A.text : A.border}`, borderRadius: 9, padding: "10px", cursor: "pointer", textAlign: "center" }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: coverImage ? A.text : A.muted }}>{coverImage ? "✓ Image ready — click to change" : "Upload image"}</span>
                          </div>
                          <input ref={coverRef} type="file" accept="image/*" onChange={e => readFile(e, setCoverImage)} style={{ display: "none" }} />
                          {coverImage && <>
                            <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
                              {[["cover","Cover only"],["all","All slides"]].map(([id,label]) => (
                                <button key={id} onClick={() => setImageMode(id)} style={{ flex:1, background:imageMode===id?A.text:A.bg, border:`1.5px solid ${imageMode===id?A.text:A.border}`, color:imageMode===id?A.accentText:A.muted, padding:"6px", borderRadius:7, fontSize:11, fontWeight:700 }}>{label}</button>
                              ))}
                            </div>
                            <div style={{ marginTop: 8 }}>
                              <label style={lbl}>Overlay — {overlayDark}%</label>
                              <input type="range" min={20} max={85} value={overlayDark} onChange={e => setOverlayDark(+e.target.value)} />
                            </div>
                          </>}
                        </div>
                      </div>
                    </div>

                    <button onClick={() => generate()} style={{ width: "100%", padding: "14px", background: A.text, color: A.accentText, borderRadius: 10, fontSize: 15, fontWeight: 800, border: "none", marginTop: 4 }}>
                      Generate Carousel →
                    </button>
                    <p style={{ textAlign: "center", color: A.muted, fontSize: 11, margin: "-8px 0 0" }}>⌘ + Enter · ~15 seconds</p>
                  </div>
                )}

                {/* BRAND TAB */}
                {tab === "brand" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* Photo */}
                    <div>
                      <label style={lbl}>Profile photo</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div onClick={() => profileRef.current?.click()} style={{ width: 64, height: 64, borderRadius: "50%", border: `2px solid ${A.border}`, overflow: "hidden", background: A.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                          {profileUrl ? <img src={profileUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: A.muted, fontSize: 20 }}>+</span>}
                        </div>
                        <div onClick={() => profileRef.current?.click()} style={{ flex: 1, background: A.bg, border: `1.5px dashed ${A.border}`, borderRadius: 9, padding: 12, cursor: "pointer", textAlign: "center" }}>
                          <span style={{ color: A.muted, fontSize: 13 }}>{profileUrl ? "Click to change" : "Upload square photo"}</span>
                        </div>
                        <input ref={profileRef} type="file" accept="image/*" onChange={e => readFile(e, setProfileUrl)} style={{ display: "none" }} />
                      </div>
                    </div>

                    {/* Name / handle */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div><label style={lbl}>Display name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Your name or brand" style={inp} /></div>
                      <div><label style={lbl}>Handle</label><input value={handle} onChange={e => setHandle(e.target.value)} placeholder="@yourhandle" style={inp} /></div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 16, background: A.bg, borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div><div style={{ fontWeight: 600, fontSize: 13 }}>Blue tick</div><div style={{ color: A.muted, fontSize: 12 }}>Verified badge on slides</div></div>
                        {tog(blueTick, setBlueTick)}
                      </div>
                      <div style={{ borderTop: `1px solid ${A.border}`, paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div><div style={{ fontWeight: 600, fontSize: 13 }}>Website on slides</div><div style={{ color: A.muted, fontSize: 12 }}>Show URL at bottom of every slide</div></div>
                        {tog(showWebsite, setShowWebsite)}
                      </div>
                      {showWebsite && <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="www.buildwithtav.co" style={inp} />}
                    </div>

                    {/* Voice profile */}
                    <div>
                      <label style={lbl}>Voice profile <span style={{letterSpacing:0,fontWeight:400,fontSize:9}}>(optional — the more specific, the better)</span></label>
                      <p style={{ color: A.muted, fontSize: 13, margin: "0 0 12px", lineHeight: 1.6 }}>Describe your tone, audience, what to avoid, and your CTA style. This gets sent with every prompt.</p>
                      <textarea value={voiceProfile} onChange={e => setVoiceProfile(e.target.value)} placeholder="e.g. Write in a direct, honest tone that speaks to real people tired of the hype. Short punchy sentences. Never overpromise. Speak to people who want a second income without fake promises. CTA is always soft — 'free preview in bio'." rows={5} style={{ ...inp, resize: "vertical", lineHeight: 1.7 }} />
                    </div>
                  </div>
                )}

                {/* VISUAL TAB */}
                {tab === "visual" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                      <label style={lbl}>Colour theme</label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7 }}>
                        {SLIDE_THEMES.map(t => (
                          <button key={t.id} onClick={() => setTheme(t.id)} style={{ background: theme === t.id ? A.text : A.bg, border: `1.5px solid ${theme === t.id ? A.text : A.border}`, borderRadius: 10, padding: "10px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                            <div style={{ display: "flex", gap: 3 }}>
                              <div style={{ width: 16, height: 16, borderRadius: 4, background: t.id === "custom" ? customBg : t.bg, border: "1px solid rgba(0,0,0,0.1)" }} />
                              <div style={{ width: 16, height: 16, borderRadius: 4, background: t.id === "custom" ? customAccent : t.accent }} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: theme === t.id ? A.accentText : A.text }}>{t.label}</span>
                          </button>
                        ))}
                      </div>
                      {theme === "custom" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12, padding: 14, background: A.bg, borderRadius: 10 }}>
                          <div>
                            <label style={lbl}>Background</label>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <input type="color" value={customBg} onChange={e => setCustomBg(e.target.value)} style={{ width: 34, height: 34, borderRadius: 6, border: `1px solid ${A.border}`, cursor: "pointer", padding: 2 }} />
                              <input value={customBg} onChange={e => setCustomBg(e.target.value)} style={{ ...inp, flex: 1, fontSize: 12 }} />
                            </div>
                          </div>
                          <div>
                            <label style={lbl}>Accent</label>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <input type="color" value={customAccent} onChange={e => setCustomAccent(e.target.value)} style={{ width: 34, height: 34, borderRadius: 6, border: `1px solid ${A.border}`, cursor: "pointer", padding: 2 }} />
                              <input value={customAccent} onChange={e => setCustomAccent(e.target.value)} style={{ ...inp, flex: 1, fontSize: 12 }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={lbl}>Font</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {FONTS.map(f => (
                          <button key={f.id} onClick={() => setFontId(f.id)} style={{ background: fontId === f.id ? A.text : A.bg, border: `1.5px solid ${fontId === f.id ? A.text : A.border}`, borderRadius: 8, padding: "7px 14px" }}>
                            <span style={{ fontFamily: `"${f.headline}", serif`, fontSize: 14, fontWeight: 700, color: fontId === f.id ? A.accentText : A.text }}>{f.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, background: A.bg, borderRadius: 10 }}>
                      <div><div style={{ fontWeight: 600, fontSize: 13 }}>Slide numbers</div><div style={{ color: A.muted, fontSize: 12 }}>Watermark numbers on each slide</div></div>
                      {tog(showNums, setShowNums)}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* GENERATING */}
        {view === "generating" && (
          <div style={{ textAlign: "center", padding: "100px 0", animation: "fadeUp 0.3s ease" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid ${A.border}`, borderTop: `3px solid ${A.text}`, animation: "spin 0.8s linear infinite", margin: "0 auto 22px" }} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: A.muted, marginBottom: 8 }}>Creating</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Writing and designing {slideCount} slides</div>
            <div style={{ color: A.muted, fontSize: 14 }}>Researching, writing, making creative decisions…</div>
          </div>
        )}

        {/* PREVIEW */}
        {view === "preview" && slides.length > 0 && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <span style={{ color: A.muted, fontSize: 12, fontWeight: 600, marginRight: 4 }}>Format:</span>
              {[["square","Square 1:1"],["portrait","Stories 9:16"]].map(([id,label]) => (
                <button key={id} onClick={() => setRatio(id)} style={{ background: ratio===id?A.text:"transparent", border:`1.5px solid ${ratio===id?A.text:A.border}`, color:ratio===id?A.accentText:A.muted, padding:"5px 13px", borderRadius:7, fontSize:12, fontWeight:700 }}>{label}</button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
                  {slides.map((slide, i) => (
                    <div key={i} onClick={() => setActive(i)} style={{ aspectRatio: ratio==="portrait"?"9/16":"1/1", borderRadius:9, overflow:"hidden", cursor:"pointer", border:`2px solid ${active===i?A.text:"transparent"}`, transition:"border-color 0.15s", position:"relative" }}>
                      {fontsReady && <SlideCanvas slide={slide} idx={i} total={slides.length} opts={canvasOpts(i)} />}
                      <div style={{ position:"absolute", bottom:4, right:4, fontSize:10, color:"rgba(255,255,255,0.8)", background:"rgba(0,0,0,0.6)", padding:"2px 6px", borderRadius:4, fontWeight:700 }}>{i+1}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => downloadSlide(active)} style={{ flex:1, background:A.surface, border:`1.5px solid ${A.border}`, color:A.text, padding:"10px", borderRadius:9, fontSize:13, fontWeight:600 }}>↓ Slide {active+1}</button>
                  <button onClick={downloadAll} disabled={downloading} style={{ flex:2, background:A.text, color:A.accentText, padding:"10px", borderRadius:9, fontSize:13, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    {downloading?<><Spinner/>Downloading...</>:`↓ Download All ${slides.length}`}
                  </button>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:3, textTransform:"uppercase", color:A.muted }}>Edit Slide {active+1}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {slides.map((_,i) => (
                    <button key={i} onClick={() => setActive(i)} style={{ width:27, height:27, borderRadius:6, background:active===i?A.text:A.surface, border:`1.5px solid ${active===i?A.text:A.border}`, color:active===i?A.accentText:A.muted, fontSize:12, fontWeight:700 }}>{i+1}</button>
                  ))}
                </div>
                <div style={{ background:A.surface, borderRadius:12, border:`1.5px solid ${A.border}`, padding:18, display:"flex", flexDirection:"column", gap:13 }}>
                  <div><label style={lbl}>Slide Title</label><input value={slides[active]?.tag||""} onChange={e=>updateSlide("tag",e.target.value)} style={inp}/></div>
                  <div><label style={lbl}>Headline</label><textarea value={slides[active]?.headline||""} onChange={e=>updateSlide("headline",e.target.value)} rows={3} style={{...inp,resize:"vertical",lineHeight:1.5}}/></div>
                  <div><label style={lbl}>Accent word <span style={{letterSpacing:0,fontWeight:400,fontSize:9}}>(renders in colour)</span></label><input value={slides[active]?.accent_word||""} onChange={e=>updateSlide("accent_word",e.target.value)} placeholder="exact word from headline" style={inp}/></div>
                  <div><label style={lbl}>Body</label><textarea value={slides[active]?.body||""} onChange={e=>updateSlide("body",e.target.value)} rows={3} style={{...inp,resize:"vertical",lineHeight:1.6}}/></div>
                  <div><label style={lbl}>CTA <span style={{letterSpacing:0,fontWeight:400,fontSize:9}}>(leave blank to hide)</span></label><input value={slides[active]?.cta||""} onChange={e=>updateSlide("cta",e.target.value||null)} placeholder="e.g. Free preview → bio" style={inp}/></div>
                </div>
                <div style={{ background:A.surface, borderRadius:12, border:`1.5px solid ${A.border}`, padding:18 }}>
                  <label style={lbl}>AI Rewrite</label>
                  <textarea value={rewritePrompt} onChange={e=>setRewritePrompt(e.target.value)} placeholder={`"Make this punchier"\n"Add a specific stat"\n"Rewrite as a bold statement"`} rows={3} style={{...inp,resize:"vertical",lineHeight:1.5,marginBottom:10}}/>
                  <button onClick={rewrite} disabled={rewriting||!rewritePrompt.trim()} style={{ width:"100%", background:rewritePrompt.trim()?A.text:A.border, color:rewritePrompt.trim()?A.accentText:A.muted, padding:"9px", borderRadius:8, fontWeight:700, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    {rewriting?<><Spinner/>Rewriting...</>:"Rewrite This Slide →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer style={{ borderTop:`1px solid ${A.border}`, padding:"14px 32px", textAlign:"center", marginTop:60 }}>
        <span style={{ color:A.muted, fontSize:12 }}>
          <a href="https://www.buildwithtav.co" target="_blank" rel="noopener noreferrer" style={{ color:A.text, fontWeight:700, textDecoration:"none" }}>Build with Tav</a>
          {" · "}
          <a href="https://www.buildwithtav.co" target="_blank" rel="noopener noreferrer" style={{ color:A.muted, textDecoration:"none" }}>buildwithtav.co</a>
        </span>
      </footer>
    </div>
  );
}
