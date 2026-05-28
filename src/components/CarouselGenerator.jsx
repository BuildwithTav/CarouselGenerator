import { useState, useRef, useEffect, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────

const GOLD = "#C9A84C";

const APP_THEMES = {
  dark: { bg: "#080808", surface: "#111111", surface2: "#191919", border: "#222222", text: "#F0EDE6", muted: "#555555", accent: "#C9A84C", accentText: "#000000", inputBg: "#141414" },
  light: { bg: "#F8F6F2", surface: "#FFFFFF", surface2: "#F0EDE8", border: "#E0DDD8", text: "#1A1A1A", muted: "#888880", accent: "#1A1A1A", accentText: "#FFFFFF", inputBg: "#FFFFFF" },
};

const SLIDE_THEMES = [
  { id: "dark-gold", label: "Dark Gold", preview: ["#0A0A0A", "#C9A84C"] },
  { id: "midnight", label: "Midnight Blue", preview: ["#0D1117", "#7C9EFF"] },
  { id: "editorial", label: "Editorial White", preview: ["#FAFAF8", "#0A0A0A"] },
  { id: "warm", label: "Warm Minimal", preview: ["#F5F0E8", "#C4622D"] },
  { id: "slate", label: "Slate", preview: ["#1E2330", "#E8D5B0"] },
  { id: "brand", label: "Brand Colour", preview: ["#0A0A0A", "#C9A84C"] },
];

const FONT_PAIRS = [
  { id: "georgia", label: "Georgia", headline: "Georgia, serif", body: "Georgia, serif" },
  { id: "helvetica", label: "Helvetica", headline: "'Helvetica Neue', Arial, sans-serif", body: "'Helvetica Neue', Arial, sans-serif" },
  { id: "palatino", label: "Palatino", headline: "Palatino, 'Book Antiqua', serif", body: "Palatino, serif" },
  { id: "impact", label: "Impact", headline: "'Arial Black', Impact, sans-serif", body: "Arial, sans-serif" },
  { id: "garamond", label: "Garamond", headline: "Garamond, 'Times New Roman', serif", body: "Garamond, serif" },
];

const IMAGE_TREATMENTS = [
  { id: "gradient", label: "Gradient Overlay", desc: "Full image, dark fade for readability" },
  { id: "dim", label: "Dimmed", desc: "Image behind content, reduced opacity" },
  { id: "split", label: "Split Layout", desc: "Image left, text right" },
  { id: "none", label: "Text Only", desc: "No image on this slide" },
];

const TONE_OPTIONS = [
  { id: "real", label: "Calm & Real", desc: "Honest, grounded, no hype" },
  { id: "bold", label: "Bold & Direct", desc: "Punchy, confident, no fluff" },
  { id: "educational", label: "Educational", desc: "Clear, informative, valuable" },
  { id: "inspirational", label: "Inspirational", desc: "Motivating, emotional" },
  { id: "provocative", label: "Provocative", desc: "Debate-starting, pattern-interrupt" },
];

const HOOK_STYLES = [
  { id: "stat", label: "Data-Led", desc: "Opens with a shocking stat" },
  { id: "question", label: "Question", desc: "Challenges assumptions" },
  { id: "statement", label: "Bold Statement", desc: "Takes a strong position" },
  { id: "story", label: "Story", desc: "Opens mid-scene" },
];

const GOALS = [
  { id: "grow", label: "Grow Audience" },
  { id: "sell", label: "Drive Sales" },
  { id: "trust", label: "Build Trust" },
  { id: "educate", label: "Educate" },
  { id: "engagement", label: "Drive Engagement" },
];

const BUSINESS_TYPES = [
  "Creator / Influencer", "Digital Marketer", "Coach / Consultant",
  "Local Business", "E-Commerce", "Corporate / B2B",
  "Fitness / Wellness", "Food & Hospitality", "Personal Page",
  "Agency", "SaaS / Tech", "Other",
];

const BRAND_QUESTIONS = [
  { key: "what", label: "What do you do or sell?", placeholder: "e.g. I help small businesses grow on Instagram through organic content" },
  { key: "who", label: "Who is your audience?", placeholder: "e.g. Small business owners aged 30-50 who feel overwhelmed by social media" },
  { key: "unique", label: "What makes you different?", placeholder: "e.g. I've grown 3 businesses from scratch with zero ad spend" },
  { key: "avoid", label: "What do you never want to sound like?", placeholder: "e.g. Salesy, fake guru, overpromising, generic motivational quotes" },
  { key: "cta", label: "What do you want people to do?", placeholder: "e.g. Visit my bio link, book a free call, DM me the word 'start'" },
];

const STORAGE_KEY = "cgv3_brand";

// ─── CANVAS UTILITIES ─────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxW, lh, align = "center") {
  const words = text.split(" ");
  let line = "", cy = y;
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + " ";
    if (ctx.measureText(test).width > maxW && n > 0) {
      ctx.fillText(line.trim(), x, cy);
      line = words[n] + " "; cy += lh;
    } else line = test;
  }
  ctx.fillText(line.trim(), x, cy);
  return cy;
}

function getSlideColors(theme, brandColor) {
  const map = {
    "dark-gold": { bg: "#0A0A0A", text: "#F0EDE6", accent: "#C9A84C", sub: "rgba(240,237,230,0.72)", isDark: true },
    "midnight":  { bg: "#0D1117", text: "#E8EAF0", accent: "#7C9EFF", sub: "rgba(232,234,240,0.68)", isDark: true },
    "editorial": { bg: "#FAFAF8", text: "#0A0A0A", accent: "#0A0A0A", sub: "rgba(10,10,10,0.62)", isDark: false },
    "warm":      { bg: "#F5F0E8", text: "#2C2218", accent: "#C4622D", sub: "rgba(44,34,24,0.62)", isDark: false },
    "slate":     { bg: "#1E2330", text: "#E8D5B0", accent: "#E8D5B0", sub: "rgba(232,213,176,0.68)", isDark: true },
    "brand":     { bg: "#0A0A0A", text: "#FFFFFF", accent: brandColor || "#C9A84C", sub: "rgba(255,255,255,0.7)", isDark: true },
  };
  return map[theme] || map["dark-gold"];
}

// ─── DRAW SLIDE ───────────────────────────────────────────

function drawSlide(ctx, W, H, slide, idx, total, opts) {
  const { slideTheme, fontId, brandColor, bgImg, treatment, imgOpacity, overlayDark,
          showNums, showTags, profileImg, name, handle, blueTick, ratio } = opts;
  const C = getSlideColors(slideTheme, brandColor);
  const font = FONT_PAIRS.find(f => f.id === fontId) || FONT_PAIRS[0];
  const isSplit = treatment === "split" && bgImg;
  const isPortrait = ratio === "portrait";

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Image rendering
  if (bgImg && treatment !== "none") {
    if (isSplit) {
      const iw = W * 0.44;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, iw, H); ctx.clip();
      const sc = Math.max(iw / bgImg.width, H / bgImg.height);
      ctx.drawImage(bgImg, (iw - bgImg.width * sc) / 2, (H - bgImg.height * sc) / 2, bgImg.width * sc, bgImg.height * sc);
      const fg = ctx.createLinearGradient(iw - 100, 0, iw, 0);
      fg.addColorStop(0, "rgba(0,0,0,0)"); fg.addColorStop(1, C.bg);
      ctx.fillStyle = fg; ctx.fillRect(iw - 100, 0, 100, H);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = treatment === "dim" ? imgOpacity / 100 : 1;
      const sc = Math.max(W / bgImg.width, H / bgImg.height);
      ctx.drawImage(bgImg, (W - bgImg.width * sc) / 2, (H - bgImg.height * sc) / 2, bgImg.width * sc, bgImg.height * sc);
      ctx.restore();
      if (treatment === "gradient") {
        const d = overlayDark / 100;
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, `rgba(0,0,0,${d * 0.92})`);
        g.addColorStop(0.45, `rgba(0,0,0,${d * 0.45})`);
        g.addColorStop(1, `rgba(0,0,0,${d * 0.96})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
    }
  }

  // Theme overlays
  if (slideTheme === "dark-gold") {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(201,168,76,0.04)"); g.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const b = 52; ctx.strokeStyle = C.accent; ctx.lineWidth = 2.5;
    [[b,42,42,42,42,b],[W-b,42,W-42,42,W-42,b],[b,H-42,42,H-42,42,H-b],[W-b,H-42,W-42,H-42,W-42,H-b]]
      .forEach(([x1,y1,x2,y2,x3,y3]) => { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.stroke(); });
  }
  if (slideTheme === "midnight") {
    const g = ctx.createRadialGradient(W*0.75,H*0.25,0,W*0.75,H*0.25,W*0.65);
    g.addColorStop(0,"rgba(124,158,255,0.1)"); g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  }
  if ((slideTheme === "editorial" || slideTheme === "warm") && treatment === "none") {
    ctx.fillStyle = C.accent; ctx.fillRect(60, 70, 90, 3);
  }

  // Content area
  const cx = isSplit ? W * 0.48 + (W * 0.52) / 2 : W / 2;
  const cw = isSplit ? W * 0.52 - 80 : W - 140;
  const textAlign = "center";

  // Top gradient for readability
  if (!isSplit) {
    const tg = ctx.createLinearGradient(0, 0, 0, 220);
    tg.addColorStop(0, "rgba(0,0,0,0.7)"); tg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = tg; ctx.fillRect(0, 0, W, 220);
  }

  // Profile badge
  const avR = isPortrait ? 48 : 44;
  const avX = isSplit ? W * 0.48 + 60 : 68;
  const avY = 70;
  ctx.save();
  ctx.beginPath(); ctx.arc(avX, avY, avR, 0, Math.PI * 2); ctx.clip();
  if (profileImg) {
    const sc = Math.max(avR*2/profileImg.width, avR*2/profileImg.height);
    ctx.drawImage(profileImg, avX-avR-(profileImg.width*sc-avR*2)/2, avY-avR-(profileImg.height*sc-avR*2)/2, profileImg.width*sc, profileImg.height*sc);
  } else {
    ctx.fillStyle = C.accent; ctx.fillRect(avX-avR, avY-avR, avR*2, avR*2);
    ctx.restore(); ctx.save();
    ctx.fillStyle = C.isDark ? "#000" : "#fff";
    ctx.font = `bold ${avR}px ${font.headline}`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText((name||"?")[0].toUpperCase(), avX, avY);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
  ctx.strokeStyle = C.accent; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(avX, avY, avR+3, 0, Math.PI*2); ctx.stroke();

  const nx = avX + avR + 16;
  ctx.fillStyle = "#FFFFFF"; ctx.font = `bold 30px ${font.headline}`;
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillText(name || "Your Brand", nx, avY - 6);
  if (blueTick) {
    const nw = ctx.measureText(name||"Your Brand").width;
    const tx = nx+nw+10, ty = avY-28;
    ctx.fillStyle = "#1D9BF0"; ctx.beginPath(); ctx.arc(tx+14,ty+14,14,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#fff"; ctx.lineWidth=2.5; ctx.lineCap="round"; ctx.lineJoin="round";
    ctx.beginPath(); ctx.moveTo(tx+6,ty+14); ctx.lineTo(tx+12,ty+20); ctx.lineTo(tx+22,ty+8); ctx.stroke();
  }
  ctx.fillStyle="rgba(255,255,255,0.52)"; ctx.font=`23px ${font.body}`;
  ctx.fillText(handle||"@yourhandle", nx, avY+22);

  if (showNums) {
    ctx.fillStyle=`${C.accent}AA`; ctx.font=`bold 21px ${font.body}`;
    ctx.textAlign="right"; ctx.fillText(`${idx+1} / ${total}`, W-52, 48);
  }

  // Tag pill (visible only if showTags)
  const tagBottom = 180;
  if (showTags && slide.tag) {
    ctx.font = `bold 26px ${font.headline}`;
    const tw = ctx.measureText(slide.tag.toUpperCase()).width + 44;
    ctx.fillStyle = C.accent;
    roundRect(ctx, cx - tw/2, tagBottom - 26, tw, 48, 6); ctx.fill();
    ctx.fillStyle = C.isDark ? "#000" : "#fff";
    ctx.textAlign = "center";
    ctx.fillText(slide.tag.toUpperCase(), cx, tagBottom + 8);
  }

  // Main content — centred in lower portion
  const contentTop = showTags && slide.tag ? tagBottom + 40 : 185;
  const contentBottom = slide.cta ? H - 130 : H - 70;
  const midY = contentTop + (contentBottom - contentTop) * 0.4;

  const hl = slide.headline || "";
  const hSize = hl.length > 55 ? 54 : hl.length > 40 ? 62 : hl.length > 28 ? 72 : hl.length > 18 ? 82 : 92;
  ctx.font = `bold ${hSize}px ${font.headline}`;
  ctx.fillStyle = C.text; ctx.textAlign = textAlign;
  const lines = Math.ceil(hl.length / 18);
  const headStartY = midY - (lines * hSize * 1.28) / 2;
  const lastHY = wrapText(ctx, hl, cx, headStartY, cw, hSize * 1.28);

  const divY = lastHY + 46;
  ctx.strokeStyle = C.accent; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.38;
  ctx.beginPath(); ctx.moveTo(cx-65, divY); ctx.lineTo(cx+65, divY); ctx.stroke();
  ctx.globalAlpha = 1;

  if (slide.body) {
    ctx.fillStyle = C.sub; ctx.font = `32px ${font.body}`; ctx.textAlign = textAlign;
    wrapText(ctx, slide.body, cx, divY + 52, cw - 40, 50);
  }

  if (slide.cta) {
    const cy2 = H - 90;
    ctx.fillStyle = C.accent; ctx.font = `bold 33px ${font.headline}`; ctx.textAlign = "center";
    ctx.fillText(slide.cta, W/2, cy2);
    const cw2 = ctx.measureText(slide.cta).width;
    ctx.strokeStyle = C.accent; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.moveTo(W/2-cw2/2, cy2+8); ctx.lineTo(W/2+cw2/2, cy2+8); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ─── SLIDE CANVAS COMPONENT ───────────────────────────────

function SlideCanvas({ slide, idx, total, opts }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas || !slide) return;
    const isPortrait = opts.ratio === "portrait";
    const W = 1080, H = isPortrait ? 1920 : 1080;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const load = src => new Promise(r => { if (!src) return r(null); const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
    Promise.all([load(opts.bgImageUrl), load(opts.profileDataUrl)]).then(([bgImg, profileImg]) => {
      drawSlide(ctx, W, H, slide, idx, total, { ...opts, bgImg, profileImg });
    });
  }, [slide, idx, total, opts]);
  const isPortrait = opts.ratio === "portrait";
  return <canvas ref={ref} style={{ width: "100%", aspectRatio: isPortrait ? "9/16" : "1/1", display: "block", borderRadius: 6 }} />;
}

// ─── STORAGE ─────────────────────────────────────────────

function loadSaved() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; } }
function saveData(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }

// ─── SPINNER ─────────────────────────────────────────────

function Spin({ c = "#C9A84C" }) {
  return <div style={{ width:18,height:18,borderRadius:"50%",border:`2px solid rgba(255,255,255,0.1)`,borderTop:`2px solid ${c}`,animation:"spin 0.7s linear infinite",display:"inline-block",flexShrink:0 }} />;
}

// ─── TOGGLE ──────────────────────────────────────────────

function Toggle({ on, onChange, accent, accentText, border }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width:46,height:25,borderRadius:13,background:on?accent:border,position:"relative",cursor:"pointer",flexShrink:0,transition:"background 0.2s" }}>
      <div style={{ position:"absolute",top:2.5,left:on?23:2.5,width:20,height:20,borderRadius:"50%",background:on?accentText:"#666",transition:"left 0.2s" }} />
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────

export default function App() {
  const saved = useRef(loadSaved());
  const S = saved.current;

  // App theme
  const [appThemeId, setAppThemeId] = useState(S?.appThemeId || "dark");
  const T = APP_THEMES[appThemeId];

  // Brand identity
  const [brandAnswers, setBrandAnswers] = useState(S?.brandAnswers || {});
  const [businessType, setBusinessType] = useState(S?.businessType || "");
  const [voiceProfile, setVoiceProfile] = useState(S?.voiceProfile || "");
  const [generatingVoice, setGeneratingVoice] = useState(false);

  // Profile
  const [profileDataUrl, setProfileDataUrl] = useState(S?.profileDataUrl || null);
  const [displayName, setDisplayName] = useState(S?.displayName || "");
  const [handle, setHandle] = useState(S?.handle || "");
  const [showBlueTick, setShowBlueTick] = useState(S?.showBlueTick ?? false);
  const [brandColor, setBrandColor] = useState(S?.brandColor || "#C9A84C");

  // Visual
  const [slideTheme, setSlideTheme] = useState(S?.slideTheme || "dark-gold");
  const [fontId, setFontId] = useState(S?.fontId || "georgia");
  const [showNums, setShowNums] = useState(S?.showNums ?? true);
  const [showTags, setShowTags] = useState(S?.showTags ?? false);
  const [treatment, setTreatment] = useState(S?.treatment || "gradient");
  const [imgOpacity, setImgOpacity] = useState(S?.imgOpacity || 28);
  const [overlayDark, setOverlayDark] = useState(S?.overlayDark || 65);

  // Content
  const [topic, setTopic] = useState("");
  const [keyThemes, setKeyThemes] = useState("");
  const [angle, setAngle] = useState("");
  const [goal, setGoal] = useState("grow");
  const [tone, setTone] = useState("real");
  const [hookStyle, setHookStyle] = useState("stat");
  const [slideCount, setSlideCount] = useState(7);
  const [includeEmoji, setIncludeEmoji] = useState(false);
  const [readingLevel, setReadingLevel] = useState("casual");

  // Images
  const [coverImage, setCoverImage] = useState(null);
  const [slideImages, setSlideImages] = useState({});

  // Generation
  const [appStep, setAppStep] = useState("setup");
  const [activeTab, setActiveTab] = useState("content");
  const [slides, setSlides] = useState([]);
  const [editing, setEditing] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [ratio, setRatio] = useState("square");
  const [slidePrompt, setSlidePrompt] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);
  const [dlAll, setDlAll] = useState(false);
  const [error, setError] = useState("");

  const profileRef = useRef(null);
  const coverRef = useRef(null);
  const slideImgRefs = useRef({});

  // Save on change
  useEffect(() => {
    saveData({ appThemeId, brandAnswers, businessType, voiceProfile, profileDataUrl, displayName, handle, showBlueTick, brandColor, slideTheme, fontId, showNums, showTags, treatment, imgOpacity, overlayDark });
  }, [appThemeId, brandAnswers, businessType, voiceProfile, profileDataUrl, displayName, handle, showBlueTick, brandColor, slideTheme, fontId, showNums, showTags, treatment, imgOpacity, overlayDark]);

  const handleImg = (e, setter) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setter(ev.target.result); r.readAsDataURL(f); };
  const handleSlideImg = (i, e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setSlideImages(p => ({ ...p, [i]: ev.target.result })); r.readAsDataURL(f); };

  const generateVoice = async () => {
    setGeneratingVoice(true);
    const qa = BRAND_QUESTIONS.map(q => `${q.label}\n${brandAnswers[q.key] || "Not provided"}`).join("\n\n");
    try {
      const res = await fetch("/api/generate", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-opus-4-7", max_tokens:600,
          messages:[{ role:"user", content:`Based on these answers about a ${businessType || "brand"}, write a concise AI voice profile (under 180 words) for a carousel generator. Write as instructions: "Write in a tone that..." Be specific.\n\n${qa}` }] }) });
      const d = await res.json();
      setVoiceProfile(d.content?.find(b=>b.type==="text")?.text || "");
    } catch { setVoiceProfile("Write directly and honestly. Speak to real problems. Keep sentences short. Never overpromise."); }
    setGeneratingVoice(false);
  };

  const generate = async () => {
    if (!topic.trim()) { setError("Add a topic first."); return; }
    setError(""); setAppStep("generating");
    const toneLabel = TONE_OPTIONS.find(t=>t.id===tone)?.label||"direct";
    const hookLabel = HOOK_STYLES.find(h=>h.id===hookStyle)?.label||"bold";
    const goalLabel = GOALS.find(g=>g.id===goal)?.label||"grow";
    const extras = [keyThemes && `Key themes/words to include: ${keyThemes}`, angle && `Specific angle: ${angle}`, includeEmoji && "Use relevant emojis sparingly in body copy.", readingLevel === "professional" && "Use professional language and vocabulary."].filter(Boolean).join("\n");
    const prompt = `You are an expert social media content strategist.

BRAND VOICE:
${voiceProfile || "Direct, honest, short sentences. No hype. Speak to real problems."}

GOAL: ${goalLabel}
TONE: ${toneLabel}
HOOK STYLE: ${hookLabel} — the first slide MUST use a ${hookLabel.toLowerCase()} approach
TOPIC: "${topic}"
${extras}

Generate exactly ${slideCount} carousel slides. Critical rules:
- NEVER write structural labels like HOOK, CTA, INTRO into content — these are internal only
- Hook: use a ${hookLabel.toLowerCase()} that is SPECIFIC and scroll-stopping. Real numbers, real scenarios.
- Value slides: each must teach or reveal something specific. Use real data where possible.
- Headlines: max 8 words. Pattern-interrupt style. Specific not vague.
- Body: 1-2 tight sentences. No padding. No "many people" — say who specifically.
- Last slide: soft CTA only.

Return ONLY a valid JSON array. Each object:
{"tag":"SHORT LABEL UPPERCASE","headline":"specific headline max 8 words","body":"1-2 tight sentences","cta":"only on last slide"}

No markdown. No explanation. Array only.`;
    try {
      const res = await fetch("/api/generate", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-opus-4-7", max_tokens:2000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:prompt}] }) });
      const d = await res.json();
      const raw = d.content?.find(b=>b.type==="text")?.text||"";
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("no json");
      const parsed = JSON.parse(match[0]);
      setSlides(parsed); setEditing(JSON.parse(JSON.stringify(parsed)));
      setActiveSlide(0); setAppStep("preview");
    } catch { setError("Generation failed. Please try again."); setAppStep("setup"); }
  };

  const regenSlide = async () => {
    if (!slidePrompt.trim()) return;
    setRegenLoading(true);
    const cur = editing[activeSlide];
    try {
      const res = await fetch("/api/generate", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-opus-4-7", max_tokens:400,
          messages:[{role:"user",content:`Rewrite this carousel slide: "${slidePrompt}"\n\nCurrent:\nTag:${cur.tag}\nHeadline:${cur.headline}\nBody:${cur.body}${cur.cta?"\nCTA:"+cur.cta:""}\n\nVoice:${voiceProfile||"Direct, honest."}\n\nReturn ONLY a JSON object with tag,headline,body,cta(optional). No markdown.`}] }) });
      const d = await res.json();
      const raw = d.content?.find(b=>b.type==="text")?.text||"";
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) { const u = JSON.parse(match[0]); const n=[...editing]; n[activeSlide]={...n[activeSlide],...u}; setEditing(n); setSlidePrompt(""); }
    } catch {}
    setRegenLoading(false);
  };

  const updateSlide = (i,k,v) => { const n=[...editing]; n[i]={...n[i],[k]:v}; setEditing(n); };

  const dlSlide = useCallback(i => {
    const c = document.querySelectorAll("canvas")[i]; if (!c) return;
    const a = document.createElement("a"); a.download=`slide-${i+1}.png`; a.href=c.toDataURL("image/png"); a.click();
  }, []);

  const dlAllSlides = useCallback(async () => {
    setDlAll(true);
    const cs = document.querySelectorAll("canvas");
    for (let i=0;i<cs.length;i++) { await new Promise(r=>setTimeout(r,320)); const a=document.createElement("a"); a.download=`slide-${i+1}.png`; a.href=cs[i].toDataURL("image/png"); a.click(); }
    setDlAll(false);
  }, []);

  const resetBrand = () => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); };

  // Shared canvas opts
  const canvasOpts = useCallback((i) => ({
    slideTheme, fontId, brandColor, bgImageUrl: slideImages[i] || coverImage,
    treatment, imgOpacity, overlayDark, showNums, showTags,
    profileDataUrl, name: displayName, handle, blueTick: showBlueTick, ratio,
  }), [slideTheme,fontId,brandColor,slideImages,coverImage,treatment,imgOpacity,overlayDark,showNums,showTags,profileDataUrl,displayName,handle,showBlueTick,ratio]);

  // Styles
  const inp = { width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"12px 15px",color:T.text,fontSize:14,fontFamily:"Georgia,serif",outline:"none" };
  const lbl = { display:"block",color:T.accent,fontSize:10,letterSpacing:3,marginBottom:7,textTransform:"uppercase",fontWeight:"bold" };
  const chip = (active) => ({ background:active?"rgba(201,168,76,0.12)":T.surface2,border:`1px solid ${active?T.accent:T.border}`,borderRadius:8,padding:"10px 13px",cursor:"pointer",textAlign:"left",color:T.text,fontFamily:"Georgia,serif",transition:"all 0.15s" });

  return (
    <div style={{ minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"Georgia,serif",paddingBottom:80 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box}input,textarea{outline:none!important}button{cursor:pointer;transition:opacity 0.15s}button:hover{opacity:0.83}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:${T.border};width:100%}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${T.accent};cursor:pointer}`}</style>

      {/* HEADER */}
      <div style={{ borderBottom:`1px solid ${T.border}`,padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:`${T.bg}EE`,backdropFilter:"blur(14px)",zIndex:100 }}>
        <div>
          <div style={{ color:T.accent,fontSize:10,letterSpacing:4,marginBottom:2,textTransform:"uppercase" }}>AI Carousel Generator</div>
          <div style={{ fontSize:17,fontWeight:"bold" }}>Create · Edit · Download</div>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          {appStep==="preview" && <button onClick={()=>{setAppStep("setup");setSlides([]);setEditing([]);}} style={{ background:"transparent",border:`1px solid ${T.border}`,color:T.muted,padding:"7px 14px",borderRadius:6,fontSize:12,fontFamily:"Georgia,serif" }}>← New</button>}
          <button onClick={resetBrand} style={{ background:"transparent",border:`1px solid ${T.border}`,color:T.muted,padding:"7px 14px",borderRadius:6,fontSize:12,fontFamily:"Georgia,serif" }}>Switch Brand</button>
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <span style={{ fontSize:11,color:T.muted }}>Dark</span>
            <Toggle on={appThemeId==="light"} onChange={v=>setAppThemeId(v?"light":"dark")} accent={T.accent} accentText={T.accentText} border={T.border} />
            <span style={{ fontSize:11,color:T.muted }}>Light</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1120,margin:"0 auto",padding:"28px 20px" }}>

        {/* ── SETUP ── */}
        {appStep==="setup" && (
          <div style={{ animation:"fi 0.4s ease" }}>
            {/* Tabs */}
            <div style={{ display:"flex",gap:0,marginBottom:28,borderBottom:`1px solid ${T.border}` }}>
              {[["content","Content"],["visual","Visual Style"],["identity","Brand Identity"],["profile","Profile"]].map(([id,label])=>(
                <button key={id} onClick={()=>setActiveTab(id)} style={{ background:"none",border:"none",color:activeTab===id?T.accent:T.muted,fontSize:12,fontFamily:"Georgia,serif",padding:"10px 18px",borderBottom:activeTab===id?`2px solid ${T.accent}`:"2px solid transparent",marginBottom:-1,letterSpacing:1,textTransform:"uppercase" }}>{label}</button>
              ))}
            </div>

            {/* CONTENT */}
            {activeTab==="content" && (
              <div style={{ display:"flex",flexDirection:"column",gap:22 }}>
                <div>
                  <label style={lbl}>Topic *</label>
                  <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Why most small businesses fail on social media" style={{ ...inp,fontSize:15 }} />
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
                  <div>
                    <label style={lbl}>Key Themes or Words <span style={{ color:T.muted,letterSpacing:0,fontSize:9 }}>(optional)</span></label>
                    <input value={keyThemes} onChange={e=>setKeyThemes(e.target.value)} placeholder="e.g. cash flow, mindset, UK market, 2025 stats" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Specific Angle <span style={{ color:T.muted,letterSpacing:0,fontSize:9 }}>(optional)</span></label>
                    <input value={angle} onChange={e=>setAngle(e.target.value)} placeholder="e.g. focus on the emotional side, not the tactics" style={inp} />
                  </div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
                  <div>
                    <label style={lbl}>Goal</label>
                    <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
                      {GOALS.map(g=><button key={g.id} onClick={()=>setGoal(g.id)} style={{ ...chip(goal===g.id),padding:"9px 13px",fontSize:13,color:goal===g.id?T.accent:T.muted }}>{g.label}</button>)}
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Number of Slides</label>
                    <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
                      <button onClick={()=>setSlideCount(Math.max(3,slideCount-1))} style={{ width:36,height:36,borderRadius:6,background:T.surface2,border:`1px solid ${T.border}`,color:T.text,fontSize:18,fontFamily:"Georgia,serif" }}>−</button>
                      <span style={{ fontSize:28,fontWeight:"bold",color:T.accent,minWidth:28,textAlign:"center" }}>{slideCount}</span>
                      <button onClick={()=>setSlideCount(Math.min(15,slideCount+1))} style={{ width:36,height:36,borderRadius:6,background:T.surface2,border:`1px solid ${T.border}`,color:T.text,fontSize:18,fontFamily:"Georgia,serif" }}>+</button>
                    </div>
                    <label style={lbl}>Cover Image <span style={{ color:T.muted,letterSpacing:0,fontSize:9 }}>(optional)</span></label>
                    <div onClick={()=>coverRef.current?.click()} style={{ background:T.surface2,border:`1px dashed ${coverImage?T.accent:T.border}`,borderRadius:8,padding:"12px",cursor:"pointer",textAlign:"center" }}>
                      <div style={{ color:coverImage?T.accent:T.muted,fontSize:13 }}>{coverImage?"✓ Image loaded — click to change":"Upload cover image"}</div>
                    </div>
                    <input ref={coverRef} type="file" accept="image/*" onChange={e=>handleImg(e,setCoverImage)} style={{ display:"none" }} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Tone</label>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:7 }}>
                    {TONE_OPTIONS.map(t=>(
                      <button key={t.id} onClick={()=>setTone(t.id)} style={chip(tone===t.id)}>
                        <div style={{ fontWeight:"bold",fontSize:12,marginBottom:2,color:tone===t.id?T.accent:T.text }}>{t.label}</div>
                        <div style={{ fontSize:10,color:T.muted,lineHeight:1.3 }}>{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Hook Style</label>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:7 }}>
                    {HOOK_STYLES.map(h=>(
                      <button key={h.id} onClick={()=>setHookStyle(h.id)} style={chip(hookStyle===h.id)}>
                        <div style={{ fontWeight:"bold",fontSize:12,marginBottom:2,color:hookStyle===h.id?T.accent:T.text }}>{h.label}</div>
                        <div style={{ fontSize:10,color:T.muted,lineHeight:1.3 }}>{h.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex",gap:14 }}>
                  <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"12px 15px",cursor:"pointer" }} onClick={()=>setIncludeEmoji(!includeEmoji)}>
                    <div><div style={{ fontWeight:"bold",fontSize:13 }}>Include Emoji</div><div style={{ color:T.muted,fontSize:11,marginTop:2 }}>Add relevant emoji to body copy</div></div>
                    <Toggle on={includeEmoji} onChange={setIncludeEmoji} accent={T.accent} accentText={T.accentText} border={T.border} />
                  </div>
                  <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"12px 15px" }}>
                    <div><div style={{ fontWeight:"bold",fontSize:13 }}>Reading Level</div></div>
                    <div style={{ display:"flex",gap:6 }}>
                      {["casual","professional"].map(r=>(
                        <button key={r} onClick={()=>setReadingLevel(r)} style={{ background:readingLevel===r?T.accent:T.surface,border:`1px solid ${readingLevel===r?T.accent:T.border}`,color:readingLevel===r?T.accentText:T.muted,padding:"5px 12px",borderRadius:6,fontSize:12,fontFamily:"Georgia,serif",textTransform:"capitalize" }}>{r}</button>
                      ))}
                    </div>
                  </div>
                </div>
                {error && <div style={{ color:"#E05252",fontSize:13,padding:"11px 15px",background:"rgba(224,82,82,0.08)",borderRadius:8,border:"1px solid rgba(224,82,82,0.2)" }}>{error}</div>}
                <button onClick={generate} disabled={!topic.trim()} style={{ background:topic.trim()?T.accent:T.surface2,color:topic.trim()?T.accentText:T.muted,border:"none",borderRadius:10,padding:"15px 40px",fontSize:15,fontWeight:"bold",fontFamily:"Georgia,serif",width:"100%",letterSpacing:1 }}>
                  Generate Carousel →
                </button>
              </div>
            )}

            {/* VISUAL */}
            {activeTab==="visual" && (
              <div style={{ display:"flex",flexDirection:"column",gap:24 }}>
                <div>
                  <label style={lbl}>Slide Theme</label>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:8 }}>
                    {SLIDE_THEMES.map(st=>(
                      <button key={st.id} onClick={()=>setSlideTheme(st.id)} style={{ ...chip(slideTheme===st.id),display:"flex",alignItems:"center",gap:10 }}>
                        <div style={{ display:"flex",gap:3,flexShrink:0 }}>
                          <div style={{ width:16,height:16,borderRadius:3,background:st.preview[0],border:"1px solid rgba(255,255,255,0.1)" }} />
                          <div style={{ width:16,height:16,borderRadius:3,background:st.preview[1] }} />
                        </div>
                        <span style={{ fontSize:12,fontWeight:"bold",color:slideTheme===st.id?T.accent:T.text }}>{st.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Font</label>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:8 }}>
                    {FONT_PAIRS.map(fp=>(
                      <button key={fp.id} onClick={()=>setFontId(fp.id)} style={chip(fontId===fp.id)}>
                        <div style={{ fontFamily:fp.headline,fontWeight:"bold",fontSize:14,marginBottom:2,color:fontId===fp.id?T.accent:T.text }}>{fp.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                {slideTheme==="brand" && (
                  <div>
                    <label style={lbl}>Brand Colour</label>
                    <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                      <input type="color" value={brandColor} onChange={e=>setBrandColor(e.target.value)} style={{ width:46,height:46,borderRadius:8,border:"none",cursor:"pointer" }} />
                      <input value={brandColor} onChange={e=>setBrandColor(e.target.value)} style={{ ...inp,maxWidth:140 }} />
                    </div>
                  </div>
                )}
                <div>
                  <label style={lbl}>Image Treatment</label>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:8 }}>
                    {IMAGE_TREATMENTS.map(it=>(
                      <button key={it.id} onClick={()=>setTreatment(it.id)} style={chip(treatment===it.id)}>
                        <div style={{ fontWeight:"bold",fontSize:12,marginBottom:2,color:treatment===it.id?T.accent:T.text }}>{it.label}</div>
                        <div style={{ fontSize:10,color:T.muted,lineHeight:1.3 }}>{it.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                {treatment==="dim" && <div><label style={lbl}>Image Opacity — {imgOpacity}%</label><input type="range" min={5} max={55} value={imgOpacity} onChange={e=>setImgOpacity(+e.target.value)} /></div>}
                {treatment==="gradient" && <div><label style={lbl}>Overlay Darkness — {overlayDark}%</label><input type="range" min={30} max={95} value={overlayDark} onChange={e=>setOverlayDark(+e.target.value)} /></div>}
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {[["showNums",showNums,setShowNums,"Slide Numbers","Show 1/7, 2/7 etc"],["showTags",showTags,setShowTags,"Tag Labels","Show HOOK, THE SHIFT etc on slides"]].map(([k,val,set,label,desc])=>(
                    <div key={k} onClick={()=>set(!val)} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"12px 15px",cursor:"pointer" }}>
                      <div><div style={{ fontWeight:"bold",fontSize:13 }}>{label}</div><div style={{ color:T.muted,fontSize:11,marginTop:2 }}>{desc}</div></div>
                      <Toggle on={val} onChange={set} accent={T.accent} accentText={T.accentText} border={T.border} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BRAND IDENTITY */}
            {activeTab==="identity" && (
              <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
                <div style={{ color:T.muted,fontSize:13,lineHeight:1.7 }}>Answer these questions and we'll build your AI voice profile. The more specific you are, the better the output.</div>
                <div>
                  <label style={lbl}>Business / Creator Type</label>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
                    {BUSINESS_TYPES.map(bt=>(
                      <button key={bt} onClick={()=>setBusinessType(bt)} style={{ background:businessType===bt?T.accent:T.surface2,border:`1px solid ${businessType===bt?T.accent:T.border}`,borderRadius:20,padding:"6px 14px",fontSize:12,color:businessType===bt?T.accentText:T.muted,fontFamily:"Georgia,serif" }}>{bt}</button>
                    ))}
                  </div>
                </div>
                {BRAND_QUESTIONS.map(q=>(
                  <div key={q.key}>
                    <label style={{ ...lbl,letterSpacing:1,fontSize:11,color:T.muted,textTransform:"none",fontWeight:"normal" }}>{q.label}</label>
                    <textarea value={brandAnswers[q.key]||""} onChange={e=>setBrandAnswers(p=>({...p,[q.key]:e.target.value}))} placeholder={q.placeholder} rows={2} style={{ ...inp,resize:"vertical",lineHeight:1.6 }} />
                  </div>
                ))}
                <button onClick={generateVoice} disabled={generatingVoice} style={{ background:T.accent,border:"none",color:T.accentText,padding:"12px 28px",borderRadius:8,fontWeight:"bold",fontFamily:"Georgia,serif",fontSize:14,display:"flex",alignItems:"center",gap:10,width:"fit-content" }}>
                  {generatingVoice?<><Spin c={T.accentText}/>Building your voice...</>:"Build My Voice Profile →"}
                </button>
                {voiceProfile && (
                  <div>
                    <label style={lbl}>Your Voice Profile <span style={{ color:T.muted,letterSpacing:0,fontSize:9 }}>(edit if needed)</span></label>
                    <textarea value={voiceProfile} onChange={e=>setVoiceProfile(e.target.value)} rows={8} style={{ ...inp,resize:"vertical",lineHeight:1.7 }} />
                  </div>
                )}
              </div>
            )}

            {/* PROFILE */}
            {activeTab==="profile" && (
              <div style={{ display:"flex",flexDirection:"column",gap:18 }}>
                <div style={{ display:"flex",alignItems:"center",gap:16 }}>
                  <div onClick={()=>profileRef.current?.click()} style={{ width:76,height:76,borderRadius:"50%",border:`2px solid ${T.accent}`,overflow:"hidden",background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0 }}>
                    {profileDataUrl?<img src={profileDataUrl} style={{ width:"100%",height:"100%",objectFit:"cover" }} />:<span style={{ color:T.accent,fontSize:22 }}>+</span>}
                  </div>
                  <div onClick={()=>profileRef.current?.click()} style={{ flex:1,background:T.surface2,border:`1px dashed ${T.border}`,borderRadius:8,padding:14,cursor:"pointer",textAlign:"center" }}>
                    <div style={{ color:T.muted,fontSize:13 }}>{profileDataUrl?"Click to change photo":"Upload profile photo"}</div>
                  </div>
                  <input ref={profileRef} type="file" accept="image/*" onChange={e=>handleImg(e,setProfileDataUrl)} style={{ display:"none" }} />
                </div>
                <div><label style={lbl}>Display Name</label><input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name or brand" style={inp} /></div>
                <div><label style={lbl}>Handle</label><input value={handle} onChange={e=>setHandle(e.target.value)} placeholder="@yourhandle" style={inp} /></div>
                <div><label style={lbl}>Brand Colour</label>
                  <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                    <input type="color" value={brandColor} onChange={e=>setBrandColor(e.target.value)} style={{ width:46,height:46,borderRadius:8,border:"none",cursor:"pointer" }} />
                    <input value={brandColor} onChange={e=>setBrandColor(e.target.value)} style={{ ...inp,maxWidth:140 }} />
                  </div>
                </div>
                <div onClick={()=>setShowBlueTick(!showBlueTick)} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"12px 15px",cursor:"pointer" }}>
                  <div><div style={{ fontWeight:"bold",fontSize:13 }}>Blue Tick</div><div style={{ color:T.muted,fontSize:11,marginTop:2 }}>Show verified badge on slides</div></div>
                  <Toggle on={showBlueTick} onChange={setShowBlueTick} accent={T.accent} accentText={T.accentText} border={T.border} />
                </div>
                {/* Preview */}
                <div style={{ background:"#080808",borderRadius:10,border:`1px solid ${T.border}`,padding:"16px 20px",display:"flex",alignItems:"center",gap:14 }}>
                  <div style={{ width:52,height:52,borderRadius:"50%",border:`2px solid ${T.accent}`,overflow:"hidden",background:"#1a1a1a",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    {profileDataUrl?<img src={profileDataUrl} style={{ width:"100%",height:"100%",objectFit:"cover" }} />:<span style={{ color:T.accent,fontSize:18 }}>?</span>}
                  </div>
                  <div>
                    <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                      <span style={{ fontWeight:"bold",fontSize:15,color:"#fff" }}>{displayName||"Your Name"}</span>
                      {showBlueTick&&<div style={{ width:18,height:18,borderRadius:"50%",background:"#1D9BF0",display:"flex",alignItems:"center",justifyContent:"center" }}><span style={{ color:"#fff",fontSize:10 }}>✓</span></div>}
                    </div>
                    <div style={{ color:"#555",fontSize:12,marginTop:2 }}>{handle||"@yourhandle"}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── GENERATING ── */}
        {appStep==="generating" && (
          <div style={{ textAlign:"center",padding:"100px 0",animation:"fi 0.4s ease" }}>
            <div style={{ marginBottom:22 }}><Spin c={T.accent} /></div>
            <div style={{ color:T.accent,fontSize:10,letterSpacing:4,marginBottom:10,textTransform:"uppercase" }}>Working on it</div>
            <div style={{ fontSize:21,fontWeight:"bold",marginBottom:8 }}>Researching & writing your carousel</div>
            <div style={{ color:T.muted,fontSize:13 }}>Pulling real data, writing {slideCount} slides in your voice...</div>
          </div>
        )}

        {/* ── PREVIEW ── */}
        {appStep==="preview" && editing.length>0 && (
          <div style={{ animation:"fi 0.4s ease" }}>
            {/* Ratio toggle */}
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20 }}>
              <span style={{ color:T.muted,fontSize:12 }}>Format:</span>
              {[["square","Square 1:1"],["portrait","Stories 9:16"]].map(([id,label])=>(
                <button key={id} onClick={()=>setRatio(id)} style={{ background:ratio===id?T.accent:T.surface2,border:`1px solid ${ratio===id?T.accent:T.border}`,color:ratio===id?T.accentText:T.muted,padding:"6px 14px",borderRadius:6,fontSize:12,fontFamily:"Georgia,serif" }}>{label}</button>
              ))}
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 360px",gap:24 }}>
              {/* Slide grid */}
              <div>
                <div style={{ display:"grid",gridTemplateColumns:ratio==="portrait"?"repeat(3,1fr)":"repeat(3,1fr)",gap:8,marginBottom:14 }}>
                  {editing.map((slide,i)=>(
                    <div key={i} onClick={()=>setActiveSlide(i)} style={{ aspectRatio:ratio==="portrait"?"9/16":"1/1",borderRadius:8,overflow:"hidden",cursor:"pointer",border:`2px solid ${activeSlide===i?T.accent:"transparent"}`,transition:"border-color 0.2s",position:"relative" }}>
                      <SlideCanvas slide={slide} idx={i} total={editing.length} opts={canvasOpts(i)} />
                      <div style={{ position:"absolute",bottom:4,right:4,fontSize:10,color:"rgba(255,255,255,0.6)",background:"rgba(0,0,0,0.6)",padding:"1px 5px",borderRadius:3 }}>{i+1}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex",gap:8 }}>
                  <button onClick={()=>dlSlide(activeSlide)} style={{ flex:1,background:T.surface2,border:`1px solid ${T.border}`,color:T.text,padding:"11px",borderRadius:8,fontSize:13,fontFamily:"Georgia,serif" }}>↓ Slide {activeSlide+1}</button>
                  <button onClick={dlAllSlides} disabled={dlAll} style={{ flex:2,background:T.accent,border:"none",color:T.accentText,padding:"11px",borderRadius:8,fontSize:14,fontWeight:"bold",fontFamily:"Georgia,serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                    {dlAll?<><Spin c={T.accentText}/>Downloading...</>:`↓ Download All ${editing.length}`}
                  </button>
                </div>
              </div>

              {/* Editor */}
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                <div style={{ color:T.accent,fontSize:10,letterSpacing:3,textTransform:"uppercase" }}>Edit Slide {activeSlide+1}</div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
                  {editing.map((_,i)=>(
                    <button key={i} onClick={()=>setActiveSlide(i)} style={{ width:28,height:28,borderRadius:5,background:activeSlide===i?T.accent:T.surface2,border:`1px solid ${activeSlide===i?T.accent:T.border}`,color:activeSlide===i?T.accentText:T.muted,fontSize:11,fontWeight:"bold",fontFamily:"Georgia,serif" }}>{i+1}</button>
                  ))}
                </div>
                <div><label style={lbl}>Tag</label><input value={editing[activeSlide]?.tag||""} onChange={e=>updateSlide(activeSlide,"tag",e.target.value)} style={inp} /></div>
                <div><label style={lbl}>Headline</label><textarea value={editing[activeSlide]?.headline||""} onChange={e=>updateSlide(activeSlide,"headline",e.target.value)} rows={3} style={{ ...inp,resize:"vertical",lineHeight:1.5 }} /></div>
                <div><label style={lbl}>Body</label><textarea value={editing[activeSlide]?.body||""} onChange={e=>updateSlide(activeSlide,"body",e.target.value)} rows={3} style={{ ...inp,resize:"vertical",lineHeight:1.6 }} /></div>
                {activeSlide===editing.length-1&&<div><label style={lbl}>CTA</label><input value={editing[activeSlide]?.cta||""} onChange={e=>updateSlide(activeSlide,"cta",e.target.value)} placeholder="Free preview → bio" style={inp} /></div>}

                {/* Per-slide image */}
                <div>
                  <label style={lbl}>Slide Image</label>
                  <div onClick={()=>{ const inp2=document.createElement("input"); inp2.type="file"; inp2.accept="image/*"; inp2.onchange=e=>handleSlideImg(activeSlide,e); inp2.click(); }} style={{ background:T.surface2,border:`1px dashed ${slideImages[activeSlide]?T.accent:T.border}`,borderRadius:8,padding:"11px",cursor:"pointer",textAlign:"center" }}>
                    <div style={{ color:slideImages[activeSlide]?T.accent:T.muted,fontSize:12 }}>{slideImages[activeSlide]?"✓ Image set — click to change":"Upload image for this slide"}</div>
                  </div>
                </div>

                {/* Sliders */}
                {treatment==="dim"&&<div><label style={lbl}>Opacity — {imgOpacity}%</label><input type="range" min={5} max={55} value={imgOpacity} onChange={e=>setImgOpacity(+e.target.value)} /></div>}
                {treatment==="gradient"&&<div><label style={lbl}>Overlay — {overlayDark}%</label><input type="range" min={30} max={95} value={overlayDark} onChange={e=>setOverlayDark(+e.target.value)} /></div>}

                {/* AI rewrite */}
                <div style={{ borderTop:`1px solid ${T.border}`,paddingTop:14 }}>
                  <label style={lbl}>AI Rewrite</label>
                  <textarea value={slidePrompt} onChange={e=>setSlidePrompt(e.target.value)} placeholder={`"Make this more aggressive"\n"Add a UK housing stat"\n"Rewrite in a warmer tone"`} rows={3} style={{ ...inp,resize:"vertical",lineHeight:1.5,marginBottom:8 }} />
                  <button onClick={regenSlide} disabled={regenLoading||!slidePrompt.trim()} style={{ background:slidePrompt.trim()?T.accent:T.surface2,border:"none",color:slidePrompt.trim()?T.accentText:T.muted,padding:"10px",borderRadius:8,fontWeight:"bold",fontFamily:"Georgia,serif",fontSize:13,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                    {regenLoading?<><Spin c={T.accentText}/>Rewriting...</>:"Rewrite This Slide →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
