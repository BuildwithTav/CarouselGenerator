import { useState, useRef, useEffect, useCallback } from "react";

const GOLD = "#C9A84C";
const DARK = "#0D0D0D";
const SURFACE = "#141414";
const SURFACE2 = "#1C1C1C";
const BORDER = "#2A2A2A";
const TEXT = "#F0EDE6";
const MUTED = "#6B6B6B";

const DEFAULT_VOICE = `Write in first person. Be direct and honest.
Use short punchy sentences. No fluff, no filler.
Speak to real pain — money, time, frustration, feeling stuck.
Never say "anyone can do this" or overpromise results.
Use real numbers and stats where possible.
Position as someone learning and sharing, not a guru.
CTA style: "See how → bio" or "Free preview → bio". Never DM CTAs.
Sign off: — [Your name]`;

const STYLE_PRESETS = [
  { id: "auto", label: "AI Decides", desc: "AI picks the best style for your theme" },
  { id: "dark-gold", label: "Dark & Gold", desc: "Black background, gold accents, bracket corners" },
  { id: "cinematic", label: "Cinematic", desc: "Deep dark, dramatic typography, minimal chrome" },
  { id: "raw", label: "Raw & Real", desc: "Gritty texture, high contrast, editorial feel" },
  { id: "clean", label: "Clean Modern", desc: "White space, sharp type, confident simplicity" },
];

const IMAGE_MODE_OPTIONS = [
  { id: "cover-only", label: "Cover Only", desc: "Image on slide 1, plain on the rest" },
  { id: "all-slides", label: "All Slides", desc: "Image as subtle bg on every slide" },
  { id: "none", label: "No Image", desc: "Plain background throughout" },
];

function Spinner() {
  return (
    <div style={{
      width: 20, height: 20, borderRadius: "50%",
      border: `2px solid ${BORDER}`,
      borderTop: `2px solid ${GOLD}`,
      animation: "spin 0.8s linear infinite",
      display: "inline-block"
    }} />
  );
}

// ─── CANVAS DRAWING ───────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY;
}

function drawProfileBadgeTop(ctx, W, profileImg, displayName, handle, showBlueTick) {
  const avatarR = 48;
  const avatarX = 80;
  const avatarCY = 80;
  const padTop = 28;

  // Dark strip at top
  const grad = ctx.createLinearGradient(0, 0, 0, avatarCY * 2 + padTop);
  grad.addColorStop(0, "rgba(0,0,0,0.85)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, avatarCY * 2 + padTop);

  const cy = avatarCY + padTop;

  // Avatar clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, cy, avatarR, 0, Math.PI * 2);
  ctx.clip();
  if (profileImg) {
    const size = avatarR * 2;
    const scale = Math.max(size / profileImg.width, size / profileImg.height);
    const sw = profileImg.width * scale, sh = profileImg.height * scale;
    ctx.drawImage(profileImg, avatarX - avatarR - (sw - size) / 2, cy - avatarR - (sh - size) / 2, sw, sh);
  } else {
    ctx.fillStyle = GOLD;
    ctx.fillRect(avatarX - avatarR, cy - avatarR, avatarR * 2, avatarR * 2);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = DARK;
    ctx.font = `bold ${avatarR}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((displayName || "?")[0].toUpperCase(), avatarX, cy);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  // Gold ring
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(avatarX, cy, avatarR + 3, 0, Math.PI * 2);
  ctx.stroke();

  // Name
  const textX = avatarX + avatarR + 18;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 36px Georgia, serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(displayName || "Your Name", textX, cy - 6);

  // Blue tick
  if (showBlueTick) {
    const nw = ctx.measureText(displayName || "Your Name").width;
    const tx = textX + nw + 10;
    const ty = cy - 30;
    ctx.fillStyle = "#1D9BF0";
    ctx.beginPath();
    ctx.arc(tx + 15, ty + 15, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(tx + 7, ty + 15);
    ctx.lineTo(tx + 13, ty + 21);
    ctx.lineTo(tx + 23, ty + 9);
    ctx.stroke();
  }

  // Handle
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "26px Georgia, serif";
  ctx.fillText(handle || "@yourhandle", textX, cy + 26);
}

function drawContent(ctx, W, H, slide, index, total, style, showBg, bgImg, profileImg, displayName, handle, showBlueTick, showSlideNumbers) {
  const isDark = style !== "clean";
  const gold = GOLD;
  const white = isDark ? "#F0EDE6" : "#0D0D0D";
  const mutedColor = isDark ? "#888" : "#555";

  // Base bg
  ctx.fillStyle = isDark ? DARK : "#F5F2EC";
  ctx.fillRect(0, 0, W, H);

  // Background image
  if (showBg && bgImg) {
    ctx.save();
    ctx.globalAlpha = style === "raw" ? 0.22 : style === "cinematic" ? 0.28 : 0.14;
    const scale = Math.max(W / bgImg.width, H / bgImg.height);
    const sw = bgImg.width * scale, sh = bgImg.height * scale;
    ctx.drawImage(bgImg, (W - sw) / 2, (H - sh) / 2, sw, sh);
    ctx.restore();
  }

  // Style overlays
  if (style === "dark-gold" || style === "auto") {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "rgba(201,168,76,0.05)");
    grad.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    const b = 60, t = 3;
    ctx.strokeStyle = gold; ctx.lineWidth = t;
    ctx.beginPath(); ctx.moveTo(b, 50); ctx.lineTo(50, 50); ctx.lineTo(50, b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W-b, 50); ctx.lineTo(W-50, 50); ctx.lineTo(W-50, b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(b, H-50); ctx.lineTo(50, H-50); ctx.lineTo(50, H-b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W-b, H-50); ctx.lineTo(W-50, H-50); ctx.lineTo(W-50, H-b); ctx.stroke();
  }

  if (style === "cinematic") {
    const vig = ctx.createRadialGradient(W/2, H/2, W*0.3, W/2, H/2, W*0.8);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  }

  if (style === "raw") {
    ctx.save(); ctx.globalAlpha = 0.025;
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? "#fff" : "#000";
      ctx.fillRect(Math.random()*W, Math.random()*H, 1, 1);
    }
    ctx.restore();
    ctx.strokeStyle = gold; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(60, 200); ctx.lineTo(60, H-120); ctx.stroke();
  }

  if (style === "clean") {
    ctx.fillStyle = gold; ctx.fillRect(80, 200, 120, 4);
  }

  // Profile badge at TOP
  drawProfileBadgeTop(ctx, W, profileImg, displayName, handle, showBlueTick);

  // Tag pill — below profile
  const tagY = 230;
  if (slide.tag) {
    ctx.font = "bold 28px Georgia, serif";
    const tagW = ctx.measureText(slide.tag.toUpperCase()).width + 48;
    ctx.fillStyle = gold;
    roundRect(ctx, W/2 - tagW/2, tagY - 26, tagW, 50, 6);
    ctx.fill();
    ctx.fillStyle = DARK; ctx.textAlign = "center";
    ctx.font = "bold 24px Georgia, serif";
    ctx.fillText(slide.tag.toUpperCase(), W/2, tagY + 8);
  }

  // Slide counter — small, top right
  if (showSlideNumbers) {
    ctx.fillStyle = "rgba(201,168,76,0.7)";
    ctx.font = "bold 22px Georgia, serif";
    ctx.textAlign = "right";
    ctx.fillText(`${index + 1}/${total}`, W - 60, 70);
  }

  // Headline
  const headlineY = slide.tag ? 330 : 300;
  ctx.fillStyle = white; ctx.textAlign = "center";
  const hSize = slide.headline.length > 45 ? 62 : slide.headline.length > 30 ? 72 : 84;
  ctx.font = `bold ${hSize}px Georgia, serif`;
  const lastHeadlineY = wrapText(ctx, slide.headline, W/2, headlineY, W - 140, hSize * 1.3);

  // Divider
  const divY = lastHeadlineY + 50;
  ctx.strokeStyle = gold; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.35;
  ctx.beginPath(); ctx.moveTo(W/2 - 80, divY); ctx.lineTo(W/2 + 80, divY); ctx.stroke();
  ctx.globalAlpha = 1;

  // Body
  if (slide.body) {
    ctx.fillStyle = isDark ? "rgba(240,237,230,0.8)" : "rgba(13,13,13,0.72)";
    ctx.textAlign = "center";
    ctx.font = `${style === "cinematic" ? "italic " : ""}34px Georgia, serif`;
    wrapText(ctx, slide.body, W/2, divY + 56, W - 180, 52);
  }

  // CTA
  if (slide.cta) {
    ctx.fillStyle = gold;
    ctx.font = "bold 36px Georgia, serif";
    ctx.textAlign = "center";
    const ctaY = H - 110;
    ctx.fillText(slide.cta, W/2, ctaY);
    ctx.strokeStyle = gold; ctx.lineWidth = 2; ctx.globalAlpha = 0.45;
    const ctaW = ctx.measureText(slide.cta).width;
    ctx.beginPath(); ctx.moveTo(W/2-ctaW/2, ctaY+8); ctx.lineTo(W/2+ctaW/2, ctaY+8); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Nav dots — bottom
  const dotsY = H - 40;
  for (let i = 0; i < total; i++) {
    ctx.beginPath();
    ctx.arc(W/2 + (i-(total-1)/2)*26, dotsY, i===index ? 7 : 4, 0, Math.PI*2);
    ctx.fillStyle = i===index ? gold : mutedColor;
    ctx.fill();
  }
}

// ─── SLIDE CANVAS ─────────────────────────────────────────

function SlideCanvas({ slide, index, total, imageDataUrl, imageMode, profileDataUrl, displayName, handle, showBlueTick, style, showSlideNumbers }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !slide) return;
    const ctx = canvas.getContext("2d");
    const W = 1080, H = 1080;
    canvas.width = W; canvas.height = H;
    const showBg = imageMode === "all-slides" || (imageMode === "cover-only" && index === 0);
    const loadImg = (src) => new Promise(res => {
      if (!src) return res(null);
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });
    Promise.all([
      showBg && imageDataUrl ? loadImg(imageDataUrl) : Promise.resolve(null),
      profileDataUrl ? loadImg(profileDataUrl) : Promise.resolve(null),
    ]).then(([bgImg, profileImg]) => {
      drawContent(ctx, W, H, slide, index, total, style, showBg, bgImg, profileImg, displayName, handle, showBlueTick, showSlideNumbers);
    });
  }, [slide, imageDataUrl, imageMode, profileDataUrl, displayName, handle, showBlueTick, style, index, total, showSlideNumbers]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", borderRadius: 4 }} />;
}

// ─── MAIN APP ─────────────────────────────────────────────

export default function CarouselGenerator() {
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [styleDirection, setStyleDirection] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("auto");
  const [slideCount, setSlideCount] = useState(7);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [imageMode, setImageMode] = useState("cover-only");
  const [profileDataUrl, setProfileDataUrl] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [showBlueTick, setShowBlueTick] = useState(false);
  const [voiceProfile, setVoiceProfile] = useState(DEFAULT_VOICE);
  const [slides, setSlides] = useState([]);
  const [editingSlides, setEditingSlides] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("setup");
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSlideNumbers, setShowSlideNumbers] = useState(true);
  const bgInputRef = useRef(null);
  const profileInputRef = useRef(null);

  const resolvedStyle = selectedStyle === "auto" ? "dark-gold" : selectedStyle;

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => type === "bg" ? setImageDataUrl(ev.target.result) : setProfileDataUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const generateCarousel = async () => {
    if (!topic.trim()) { setError("Add a topic first."); return; }
    setError(""); setIsGenerating(true); setStep(2);

    const styleHint = styleDirection ? `Visual/tone direction: "${styleDirection}". ` : "";

    const prompt = `You are a carousel content generator. Your job is to write specific, punchy, real content — not generic motivational waffle.

VOICE PROFILE:
${voiceProfile}

${styleHint}

Topic: "${topic}"

IMPORTANT RULES:
- Use real, specific facts, stats, or data points where relevant to the topic. If you know current statistics, use them.
- Avoid vague statements like "many people struggle" — say something specific instead.
- Each headline must be a pattern interrupt — something that stops the scroll.
- Body copy must be 1-2 sentences max. Tight. No padding.
- Write like a real person, not a content creator template.
- The hook slide must be so specific it feels personal to the reader.

Generate exactly ${slideCount} slides:
- Slide 1: HOOK — most provocative, specific, stop-scroll headline
- Slides 2-${slideCount - 2}: Value slides — mix of REALITY, TRUTH [n], THE SHIFT, FACT [n] — use real data/stats
- Slide ${slideCount - 1}: Build to CTA — emotional or logical bridge
- Slide ${slideCount}: CTA — soft sell only

Return ONLY a valid JSON array with these fields per slide:
- tag: 1-3 words uppercase (e.g. "HOOK", "TRUTH 1", "THE SHIFT", "FACT 2", "CTA")
- headline: max 8 words, punchy and specific
- body: 1-2 sentences, no filler
- cta: string only on LAST slide (e.g. "Free preview → bio")

No markdown. No explanation. JSON array only.`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-opus-4-7",
          max_tokens: 2000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const textBlock = data.content?.find(b => b.type === "text");
      const raw = textBlock?.text || "";
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON found");
      const parsed = JSON.parse(jsonMatch[0]);
      setSlides(parsed);
      setEditingSlides(JSON.parse(JSON.stringify(parsed)));
      setActiveSlide(0);
      setStep(3);
    } catch (e) {
      setError("Generation failed. Check your connection and try again.");
      setStep(1);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSlide = (idx, field, value) => {
    const updated = [...editingSlides];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditingSlides(updated);
  };

  const downloadSlide = useCallback((idx) => {
    const canvases = document.querySelectorAll("canvas");
    if (!canvases[idx]) return;
    const link = document.createElement("a");
    link.download = `carousel-slide-${idx + 1}.png`;
    link.href = canvases[idx].toDataURL("image/png");
    link.click();
  }, []);

  const downloadAll = useCallback(async () => {
    setDownloadingAll(true);
    const canvases = document.querySelectorAll("canvas");
    for (let i = 0; i < canvases.length; i++) {
      await new Promise(r => setTimeout(r, 350));
      const link = document.createElement("a");
      link.download = `carousel-slide-${i + 1}.png`;
      link.href = canvases[i].toDataURL("image/png");
      link.click();
    }
    setDownloadingAll(false);
  }, []);

  const reset = () => {
    setStep(1); setSlides([]); setEditingSlides([]); setActiveSlide(0);
    setTopic(""); setStyleDirection(""); setSelectedStyle("auto");
    setSlideCount(7); setError("");
  };

  const inputStyle = {
    width: "100%", background: SURFACE, border: `1px solid ${BORDER}`,
    borderRadius: 8, padding: "14px 18px", color: TEXT,
    fontSize: 15, fontFamily: "Georgia, serif",
  };
  const labelStyle = {
    display: "block", color: GOLD, fontSize: 11,
    letterSpacing: 3, marginBottom: 10, textTransform: "uppercase",
  };

  return (
    <div style={{ minHeight: "100vh", background: DARK, color: TEXT, fontFamily: "Georgia, serif", paddingBottom: 80 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::selection { background: rgba(201,168,76,0.3); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        input, textarea { outline: none !important; }
        button { transition: opacity 0.15s; }
        button:hover { opacity: 0.85; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${BORDER}`, padding: "22px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, background: "rgba(13,13,13,0.96)",
        backdropFilter: "blur(12px)", zIndex: 100,
      }}>
        <div>
          <div style={{ color: GOLD, fontSize: 11, letterSpacing: 4, marginBottom: 3, textTransform: "uppercase" }}>AI Carousel Generator</div>
          <div style={{ fontSize: 19, fontWeight: "bold" }}>Create. Edit. Download.</div>
        </div>
        {step === 3 && (
          <button onClick={reset} style={{
            background: "transparent", border: `1px solid ${BORDER}`,
            color: MUTED, padding: "8px 20px", borderRadius: 6,
            cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif",
          }}>← New Carousel</button>
        )}
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 36, borderBottom: `1px solid ${BORDER}` }}>
              {["setup", "profile", "voice"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  background: "none", border: "none",
                  color: activeTab === tab ? GOLD : MUTED,
                  fontSize: 13, fontFamily: "Georgia, serif",
                  padding: "12px 22px", cursor: "pointer",
                  borderBottom: activeTab === tab ? `2px solid ${GOLD}` : "2px solid transparent",
                  marginBottom: -1, letterSpacing: 1, textTransform: "uppercase",
                }}>
                  {tab === "setup" ? "Setup" : tab === "profile" ? "Profile Badge" : "Voice & Tone"}
                </button>
              ))}
            </div>

            {/* SETUP TAB */}
            {activeTab === "setup" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <div>
                  <label style={labelStyle}>Topic / Theme</label>
                  <input value={topic} onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. Why the 9-5 is becoming impossible to survive on"
                    style={{ ...inputStyle, fontSize: 16 }} />
                </div>
                <div>
                  <label style={labelStyle}>Style Direction <span style={{ color: MUTED, fontSize: 10 }}>(optional)</span></label>
                  <input value={styleDirection} onChange={e => setStyleDirection(e.target.value)}
                    placeholder="e.g. dark and cinematic, documentary feel, heavy contrast"
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Visual Style</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 8 }}>
                    {STYLE_PRESETS.map(s => (
                      <button key={s.id} onClick={() => setSelectedStyle(s.id)} style={{
                        background: selectedStyle === s.id ? "rgba(201,168,76,0.1)" : SURFACE,
                        border: `1px solid ${selectedStyle === s.id ? GOLD : BORDER}`,
                        borderRadius: 8, padding: "13px 14px", cursor: "pointer",
                        textAlign: "left", color: TEXT, fontFamily: "Georgia, serif",
                      }}>
                        <div style={{ fontWeight: "bold", fontSize: 13, marginBottom: 4, color: selectedStyle === s.id ? GOLD : TEXT }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div>
                    <label style={labelStyle}>Number of Slides</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <button onClick={() => setSlideCount(Math.max(3, slideCount - 1))} style={{
                        width: 42, height: 42, borderRadius: 8, background: SURFACE,
                        border: `1px solid ${BORDER}`, color: TEXT, fontSize: 22, cursor: "pointer", fontFamily: "Georgia, serif",
                      }}>−</button>
                      <span style={{ fontSize: 30, fontWeight: "bold", color: GOLD, minWidth: 36, textAlign: "center" }}>{slideCount}</span>
                      <button onClick={() => setSlideCount(Math.min(15, slideCount + 1))} style={{
                        width: 42, height: 42, borderRadius: 8, background: SURFACE,
                        border: `1px solid ${BORDER}`, color: TEXT, fontSize: 22, cursor: "pointer", fontFamily: "Georgia, serif",
                      }}>+</button>
                    </div>
                    <div style={{ color: MUTED, fontSize: 11, marginTop: 6 }}>3 – 15 slides</div>
                  </div>
                  <div>
                    <label style={labelStyle}>Background Image <span style={{ color: MUTED, fontSize: 10 }}>(optional)</span></label>
                    <div onClick={() => bgInputRef.current?.click()} style={{
                      background: SURFACE, border: `1px dashed ${imageDataUrl ? GOLD : BORDER}`,
                      borderRadius: 8, padding: "14px", cursor: "pointer",
                      textAlign: "center", height: 78, display: "flex",
                      alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 3,
                    }}>
                      {imageDataUrl
                        ? <><div style={{ color: GOLD, fontSize: 13 }}>✓ Image loaded</div><div style={{ color: MUTED, fontSize: 11 }}>Click to change</div></>
                        : <><div style={{ color: MUTED, fontSize: 13 }}>Upload image</div><div style={{ color: MUTED, fontSize: 11 }}>JPG, PNG, WebP</div></>}
                    </div>
                    <input ref={bgInputRef} type="file" accept="image/*" onChange={e => handleImageUpload(e, "bg")} style={{ display: "none" }} />
                  </div>
                </div>
                {/* Slide numbers toggle */}
                <div onClick={() => setShowSlideNumbers(!showSlideNumbers)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 18px", background: SURFACE, borderRadius: 8,
                  border: `1px solid ${BORDER}`, cursor: "pointer",
                }}>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 2 }}>Show Slide Numbers</div>
                    <div style={{ color: MUTED, fontSize: 12 }}>Display 1/7, 2/7 etc. on each slide</div>
                  </div>
                  <div style={{
                    width: 48, height: 26, borderRadius: 13,
                    background: showSlideNumbers ? GOLD : BORDER,
                    position: "relative", flexShrink: 0, transition: "background 0.2s",
                  }}>
                    <div style={{
                      position: "absolute", top: 3,
                      left: showSlideNumbers ? 24 : 3,
                      width: 20, height: 20, borderRadius: "50%",
                      background: showSlideNumbers ? DARK : "#555",
                      transition: "left 0.2s",
                    }} />
                  </div>
                </div>

                {imageDataUrl && (                  <div>
                    <label style={labelStyle}>Image Placement</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {IMAGE_MODE_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => setImageMode(opt.id)} style={{
                          flex: 1, minWidth: 140,
                          background: imageMode === opt.id ? "rgba(201,168,76,0.1)" : SURFACE,
                          border: `1px solid ${imageMode === opt.id ? GOLD : BORDER}`,
                          borderRadius: 8, padding: "12px 14px", cursor: "pointer",
                          textAlign: "left", color: TEXT, fontFamily: "Georgia, serif",
                        }}>
                          <div style={{ fontWeight: "bold", fontSize: 13, color: imageMode === opt.id ? GOLD : TEXT, marginBottom: 3 }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: MUTED }}>{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {error && (
                  <div style={{ color: "#E05252", fontSize: 14, padding: "12px 16px", background: "rgba(224,82,82,0.08)", borderRadius: 8, border: "1px solid rgba(224,82,82,0.2)" }}>
                    {error}
                  </div>
                )}
                <button onClick={generateCarousel} disabled={!topic.trim()} style={{
                  background: topic.trim() ? GOLD : SURFACE2, color: topic.trim() ? DARK : MUTED,
                  border: "none", borderRadius: 10, padding: "18px 40px",
                  fontSize: 16, fontWeight: "bold", fontFamily: "Georgia, serif",
                  cursor: topic.trim() ? "pointer" : "not-allowed", letterSpacing: 1, width: "100%",
                }}>
                  Generate Carousel →
                </button>
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn 0.3s ease" }}>
                <div style={{ color: MUTED, fontSize: 14, lineHeight: 1.7 }}>
                  Your profile badge appears at the top of every slide. Upload your photo, set your name and handle.
                </div>
                <div>
                  <label style={labelStyle}>Profile Picture</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: "50%",
                      border: `2px solid ${GOLD}`, overflow: "hidden",
                      background: "rgba(201,168,76,0.1)", display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {profileDataUrl
                        ? <img src={profileDataUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ color: GOLD, fontSize: 28, fontWeight: "bold" }}>?</span>}
                    </div>
                    <div onClick={() => profileInputRef.current?.click()} style={{
                      flex: 1, background: SURFACE, border: `1px dashed ${profileDataUrl ? GOLD : BORDER}`,
                      borderRadius: 8, padding: "16px", cursor: "pointer",
                      textAlign: "center", height: 80, display: "flex",
                      alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4,
                    }}>
                      {profileDataUrl
                        ? <><div style={{ color: GOLD, fontSize: 13 }}>✓ Photo uploaded</div><div style={{ color: MUTED, fontSize: 11 }}>Click to change</div></>
                        : <><div style={{ color: MUTED, fontSize: 13 }}>Upload profile photo</div><div style={{ color: MUTED, fontSize: 11 }}>Square image works best</div></>}
                    </div>
                    <input ref={profileInputRef} type="file" accept="image/*" onChange={e => handleImageUpload(e, "profile")} style={{ display: "none" }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Display Name</label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name or brand name" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Handle</label>
                  <input value={handle} onChange={e => setHandle(e.target.value)}
                    placeholder="@yourhandle" style={inputStyle} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: SURFACE, borderRadius: 8, border: `1px solid ${BORDER}` }}>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 3 }}>Blue Tick</div>
                    <div style={{ color: MUTED, fontSize: 12 }}>Show verified badge next to your name</div>
                  </div>
                  <div onClick={() => setShowBlueTick(!showBlueTick)} style={{
                    width: 48, height: 26, borderRadius: 13,
                    background: showBlueTick ? GOLD : BORDER,
                    cursor: "pointer", position: "relative", flexShrink: 0,
                  }}>
                    <div style={{
                      position: "absolute", top: 3,
                      left: showBlueTick ? 24 : 3,
                      width: 20, height: 20, borderRadius: "50%",
                      background: showBlueTick ? DARK : "#555",
                      transition: "left 0.2s",
                    }} />
                  </div>
                </div>
                {/* Preview */}
                <div>
                  <label style={labelStyle}>Preview</label>
                  <div style={{ background: "#0a0a0a", borderRadius: 10, border: `1px solid ${BORDER}`, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", border: `2px solid ${GOLD}`, overflow: "hidden", background: "rgba(201,168,76,0.1)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {profileDataUrl ? <img src={profileDataUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: GOLD, fontSize: 22, fontWeight: "bold" }}>?</span>}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: "bold", fontSize: 16 }}>{displayName || "Your Name"}</span>
                        {showBlueTick && <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1D9BF0", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 11 }}>✓</span></div>}
                      </div>
                      <div style={{ color: MUTED, fontSize: 13, marginTop: 3 }}>{handle || "@yourhandle"}</div>
                    </div>
                  </div>
                </div>
                <button onClick={() => setActiveTab("setup")} style={{ background: GOLD, border: "none", color: DARK, padding: "14px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: "bold", fontFamily: "Georgia, serif" }}>← Back to Setup</button>
              </div>
            )}

            {/* VOICE TAB */}
            {activeTab === "voice" && (
              <div style={{ animation: "fadeIn 0.3s ease" }}>
                <div style={{ color: MUTED, fontSize: 14, marginBottom: 18, lineHeight: 1.7 }}>
                  The AI reads this before writing every slide. Be specific — your tone, your niche, your audience, real examples from your life. The more you give it, the more it sounds like you.
                </div>
                <textarea value={voiceProfile} onChange={e => setVoiceProfile(e.target.value)} rows={18} style={{
                  width: "100%", background: SURFACE, border: `1px solid ${BORDER}`,
                  borderRadius: 8, padding: "20px", color: TEXT, fontSize: 14,
                  fontFamily: "Georgia, serif", lineHeight: 1.8, resize: "vertical",
                }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                  <button onClick={() => setVoiceProfile(DEFAULT_VOICE)} style={{ background: "transparent", border: `1px solid ${BORDER}`, color: MUTED, padding: "8px 18px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "Georgia, serif" }}>Reset</button>
                  <button onClick={() => setActiveTab("setup")} style={{ background: GOLD, border: "none", color: DARK, padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: "bold", fontFamily: "Georgia, serif" }}>← Back to Setup</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: GENERATING ── */}
        {step === 2 && (
          <div style={{ textAlign: "center", padding: "100px 0", animation: "fadeIn 0.4s ease" }}>
            <div style={{ marginBottom: 24 }}><Spinner /></div>
            <div style={{ color: GOLD, fontSize: 11, letterSpacing: 4, marginBottom: 12, textTransform: "uppercase" }}>Working on it</div>
            <div style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>Researching & writing your carousel</div>
            <div style={{ color: MUTED, fontSize: 14 }}>Pulling real data, writing {slideCount} slides in your voice...</div>
          </div>
        )}

        {/* ── STEP 3: PREVIEW + EDIT ── */}
        {step === 3 && editingSlides.length > 0 && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

              {/* Left — slide previews */}
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                  {editingSlides.map((slide, i) => (
                    <div key={i} onClick={() => setActiveSlide(i)} style={{
                      aspectRatio: "1", borderRadius: 8, overflow: "hidden",
                      cursor: "pointer", border: `2px solid ${activeSlide === i ? GOLD : "transparent"}`,
                      transition: "border-color 0.2s", position: "relative",
                    }}>
                      <SlideCanvas
                        slide={slide} index={i} total={editingSlides.length}
                        imageDataUrl={imageDataUrl} imageMode={imageMode}
                        profileDataUrl={profileDataUrl} displayName={displayName}
                        handle={handle} showBlueTick={showBlueTick}
                        style={resolvedStyle} showSlideNumbers={showSlideNumbers}
                      />
                      <div style={{ position: "absolute", bottom: 4, right: 5, fontSize: 10, color: "rgba(255,255,255,0.5)", background: "rgba(0,0,0,0.6)", padding: "1px 5px", borderRadius: 3 }}>{i + 1}</div>
                    </div>
                  ))}
                </div>
                {/* Downloads */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button onClick={() => downloadSlide(activeSlide)} style={{
                    background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT,
                    padding: "12px 20px", borderRadius: 10, cursor: "pointer",
                    fontSize: 14, fontFamily: "Georgia, serif", width: "100%",
                  }}>↓ Download Slide {activeSlide + 1}</button>
                  <button onClick={downloadAll} disabled={downloadingAll} style={{
                    background: GOLD, border: "none", color: DARK, padding: "14px 20px",
                    borderRadius: 10, cursor: downloadingAll ? "wait" : "pointer",
                    fontSize: 15, fontWeight: "bold", fontFamily: "Georgia, serif", width: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  }}>
                    {downloadingAll ? <><Spinner /> Downloading...</> : `↓ Download All ${editingSlides.length} Slides`}
                  </button>
                </div>
              </div>

              {/* Right — editor */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div style={{ color: GOLD, fontSize: 11, letterSpacing: 3, marginBottom: 16, textTransform: "uppercase" }}>
                  Edit Slide {activeSlide + 1}
                </div>

                {/* Slide nav */}
                <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                  {editingSlides.map((_, i) => (
                    <button key={i} onClick={() => setActiveSlide(i)} style={{
                      width: 32, height: 32, borderRadius: 6,
                      background: activeSlide === i ? GOLD : SURFACE,
                      border: `1px solid ${activeSlide === i ? GOLD : BORDER}`,
                      color: activeSlide === i ? DARK : MUTED,
                      fontSize: 13, fontWeight: "bold", cursor: "pointer",
                      fontFamily: "Georgia, serif",
                    }}>{i + 1}</button>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 10 }}>Tag Label</label>
                    <input
                      value={editingSlides[activeSlide]?.tag || ""}
                      onChange={e => updateSlide(activeSlide, "tag", e.target.value)}
                      style={{ ...inputStyle, fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 10 }}>Headline</label>
                    <textarea
                      value={editingSlides[activeSlide]?.headline || ""}
                      onChange={e => updateSlide(activeSlide, "headline", e.target.value)}
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 10 }}>Body Copy</label>
                    <textarea
                      value={editingSlides[activeSlide]?.body || ""}
                      onChange={e => updateSlide(activeSlide, "body", e.target.value)}
                      rows={4}
                      style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                    />
                  </div>
                  {activeSlide === editingSlides.length - 1 && (
                    <div>
                      <label style={{ ...labelStyle, fontSize: 10 }}>CTA Text</label>
                      <input
                        value={editingSlides[activeSlide]?.cta || ""}
                        onChange={e => updateSlide(activeSlide, "cta", e.target.value)}
                        placeholder="Free preview → bio"
                        style={{ ...inputStyle, fontSize: 13 }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 24, padding: "16px", background: SURFACE, borderRadius: 8, border: `1px solid ${BORDER}` }}>
                  <div style={{ color: MUTED, fontSize: 12, lineHeight: 1.6 }}>
                    Edit any field above — the slide preview updates instantly on the left.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
