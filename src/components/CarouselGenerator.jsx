import { useState, useRef, useEffect, useCallback } from "react";

// ─── FONTS ───────────────────────────────────────────────

const FONTS = [
  { id:"playfair",    label:"Playfair",    headline:"Playfair Display",   body:"Playfair Display" },
  { id:"montserrat",  label:"Montserrat",  headline:"Montserrat",         body:"Montserrat" },
  { id:"cormorant",   label:"Cormorant",   headline:"Cormorant Garamond", body:"Cormorant Garamond" },
  { id:"jakarta",     label:"Jakarta",     headline:"Plus Jakarta Sans",  body:"Plus Jakarta Sans" },
  { id:"dm",          label:"DM Serif",    headline:"DM Serif Display",   body:"DM Serif Display" },
  { id:"bebas",       label:"Bebas",       headline:"Bebas Neue",         body:"Plus Jakarta Sans" },
  { id:"inter",       label:"Inter",       headline:"Inter",              body:"Inter" },
  { id:"lato",        label:"Lato",        headline:"Lato",               body:"Lato" },
  { id:"oswald",      label:"Oswald",      headline:"Oswald",             body:"Lato" },
  { id:"baskerville", label:"Baskerville", headline:"Libre Baskerville",  body:"Libre Baskerville" },
  { id:"poppins",     label:"Poppins",     headline:"Poppins",            body:"Poppins" },
];

async function loadFonts() {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Montserrat:wght@700;900&family=Cormorant+Garamond:wght@700&family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Serif+Display&family=Bebas+Neue&family=Inter:wght@700;800;900&family=Lato:wght@700;900&family=Oswald:wght@600;700&family=Libre+Baskerville:wght@700&family=Poppins:wght@700;800;900&display=swap";
  document.head.appendChild(link);
  await new Promise(r => setTimeout(r, 1400));
  await document.fonts.ready;
}

// ─── APP THEME ───────────────────────────────────────────

const APP_THEMES = {
  light: { bg:"#F7F5F1",surface:"#FFF",surface2:"#EEECEA",border:"#E0DDD8",text:"#1A1A1A",muted:"#999",accent:"#1A1A1A",accentText:"#FFF",inputBg:"#FFF" },
  dark:  { bg:"#080808",surface:"#111",surface2:"#181818",border:"#222",text:"#F0EDE6",muted:"#555",accent:"#C9A84C",accentText:"#000",inputBg:"#111" },
};

// ─── SLIDE THEMES ────────────────────────────────────────

const SLIDE_THEMES = [
  { id:"dark-gold", label:"Dark Gold",    preview:["#0A0A0A","#C9A84C"], desc:"Dark with gold accents" },
  { id:"midnight",  label:"Midnight",     preview:["#0D1117","#7C9EFF"], desc:"Deep blue, cool accents" },
  { id:"editorial", label:"Editorial",    preview:["#F8F6F2","#1A1A1A"], desc:"High contrast white" },
  { id:"warm",      label:"Warm Cream",   preview:["#F2EDE4","#8B4513"], desc:"Warm, organic feel" },
  { id:"slate",     label:"Slate",        preview:["#1C2333","#D4B896"], desc:"Cool dark, warm type" },
  { id:"noir",      label:"Noir",         preview:["#050505","#FFFFFF"], desc:"Pure black and white" },
  { id:"forest",    label:"Forest",       preview:["#1A2E1A","#7DBE7D"], desc:"Deep green" },
  { id:"rose",      label:"Rose",         preview:["#FDF4F4","#C0636A"], desc:"Soft pink lifestyle" },
  { id:"navy",      label:"Navy",         preview:["#0A1628","#E8C97A"], desc:"Deep navy, gold" },
  { id:"custom",    label:"Custom",       preview:["#333","#C9A84C"],    desc:"Pick your colours" },
];

const FONT_OPTIONS = [
  { id:"playfair",    sample:"Elegant Serif" },
  { id:"cormorant",   sample:"Luxury Serif" },
  { id:"dm",          sample:"Editorial" },
  { id:"baskerville", sample:"Classic Serif" },
  { id:"montserrat",  sample:"Clean Sans" },
  { id:"poppins",     sample:"Social Media" },
  { id:"jakarta",     sample:"Modern Sans" },
  { id:"inter",       sample:"Plain & Neutral" },
  { id:"lato",        sample:"Friendly" },
  { id:"oswald",      sample:"Condensed" },
  { id:"bebas",       sample:"Impact" },
];

const IMAGE_TREATMENTS = [
  { id:"gradient", label:"Gradient",  desc:"Full image, dark fade" },
  { id:"dim",      label:"Dimmed",    desc:"Subtle background" },
  { id:"split",    label:"Split",     desc:"Image left, text right" },
  { id:"none",     label:"Text Only", desc:"No image" },
];

const BUSINESS_TYPES = [
  { id:"creator",    label:"Creator / Influencer" },
  { id:"marketer",   label:"Digital Marketer" },
  { id:"coach",      label:"Coach / Consultant" },
  { id:"restaurant", label:"Restaurant / Café" },
  { id:"gym",        label:"Gym / Fitness Studio" },
  { id:"retail",     label:"Retail / Shop" },
  { id:"ecommerce",  label:"E-Commerce" },
  { id:"salon",      label:"Salon / Beauty" },
  { id:"corporate",  label:"Corporate / B2B" },
  { id:"personal",   label:"Personal Page" },
];

const BRAND_QUESTIONS = {
  creator:    [{key:"what",label:"What do you create content about?",ph:"e.g. Personal finance tips for people in their 30s"},{key:"who",label:"Who is your audience?",ph:"e.g. Young professionals feeling stuck in the rat race"},{key:"unique",label:"What makes your perspective unique?",ph:"e.g. I went from £0 to financial freedom by 35 — I share everything"},{key:"avoid",label:"What do you never want to sound like?",ph:"e.g. Fake guru, overpromising, generic motivation"},{key:"cta",label:"What do you want people to do?",ph:"e.g. Follow me, click my bio link, DM me"}],
  marketer:   [{key:"what",label:"What service do you offer?",ph:"e.g. I help small businesses get more clients through organic social"},{key:"who",label:"Who do you work with?",ph:"e.g. Small business owners overwhelmed by marketing"},{key:"unique",label:"What makes your approach different?",ph:"e.g. No paid ads — only organic strategies that work"},{key:"avoid",label:"What do you never want to sound like?",ph:"e.g. Salesy, corporate, full of jargon"},{key:"cta",label:"What do you want people to do?",ph:"e.g. Book a free discovery call"}],
  coach:      [{key:"what",label:"What do you coach or consult on?",ph:"e.g. I help burnt-out professionals find a career they love"},{key:"who",label:"Who are your clients?",ph:"e.g. High-achievers in their 30s-40s who feel unfulfilled"},{key:"unique",label:"What's your method or story?",ph:"e.g. I left a six-figure job at 38 — I know what it takes"},{key:"avoid",label:"What tone do you want to avoid?",ph:"e.g. Preachy, overly spiritual, or overly corporate"},{key:"cta",label:"What's your call to action?",ph:"e.g. Book a free clarity call"}],
  restaurant: [{key:"what",label:"What's your restaurant called and what do you serve?",ph:"e.g. Tavolino — authentic Italian in central Manchester"},{key:"who",label:"Who are your typical customers?",ph:"e.g. Date night couples, local families, Friday lunch crowd"},{key:"unique",label:"What makes dining with you special?",ph:"e.g. Everything made fresh daily, pasta imported from Naples"},{key:"avoid",label:"What tone doesn't suit your brand?",ph:"e.g. Overly formal, or too casual and cheap-feeling"},{key:"cta",label:"What do you want people to do?",ph:"e.g. Book a table, visit us this weekend"}],
  gym:        [{key:"what",label:"What's your gym called and what do you offer?",ph:"e.g. Iron House — strength and conditioning in Leeds"},{key:"who",label:"Who are your members?",ph:"e.g. Working adults who want real results without fads"},{key:"unique",label:"What makes your gym different?",ph:"e.g. No mirrors, no egos — hard work and real community"},{key:"avoid",label:"What do you never want to sound like?",ph:"e.g. Bootcamp bro culture, or corporate gym chain"},{key:"cta",label:"What do you want people to do?",ph:"e.g. Book a free trial class"}],
  retail:     [{key:"what",label:"What do you sell and where?",ph:"e.g. Independent bookshop in Bristol — new and secondhand"},{key:"who",label:"Who are your customers?",ph:"e.g. Local book lovers, students, gift buyers"},{key:"unique",label:"What makes your shop special?",ph:"e.g. Handpicked recommendations, community events"},{key:"avoid",label:"What tone doesn't fit?",ph:"e.g. Overly corporate, or too quirky and niche"},{key:"cta",label:"What do you want people to do?",ph:"e.g. Visit us in store, shop online"}],
  ecommerce:  [{key:"what",label:"What do you sell?",ph:"e.g. Sustainable activewear made from recycled materials"},{key:"who",label:"Who buys from you?",ph:"e.g. Women 25-40 who care about performance and ethics"},{key:"unique",label:"What makes your products different?",ph:"e.g. Carbon neutral, lasts 3x longer than fast fashion"},{key:"avoid",label:"What do you never want to sound like?",ph:"e.g. Preachy, greenwashing, or overly salesy"},{key:"cta",label:"What do you want people to do?",ph:"e.g. Shop the new collection"}],
  salon:      [{key:"what",label:"What's your salon and what do you specialise in?",ph:"e.g. Lumière — colour specialists in West London"},{key:"who",label:"Who are your clients?",ph:"e.g. Professional women who want quality and a relaxed experience"},{key:"unique",label:"What makes your salon stand out?",ph:"e.g. Low-damage techniques — healthy hair is our priority"},{key:"avoid",label:"What tone doesn't suit your brand?",ph:"e.g. Too girly and pink, or cold and clinical"},{key:"cta",label:"What do you want people to do?",ph:"e.g. Book online, DM us"}],
  corporate:  [{key:"what",label:"What does your company do?",ph:"e.g. We help mid-size businesses reduce costs through AI"},{key:"who",label:"Who are your clients?",ph:"e.g. Operations directors at companies with 50-500 employees"},{key:"unique",label:"What's your competitive edge?",ph:"e.g. We implement in 30 days, not 6 months"},{key:"avoid",label:"What tone do you want to avoid?",ph:"e.g. Overly technical, startup-buzzword heavy"},{key:"cta",label:"What do you want prospects to do?",ph:"e.g. Book a discovery call"}],
  personal:   [{key:"what",label:"What is your page about?",ph:"e.g. Documenting my journey moving from London to rural France"},{key:"who",label:"Who do you want to connect with?",ph:"e.g. People who dream of a slower, simpler life"},{key:"unique",label:"What's your story or angle?",ph:"e.g. I swapped a City salary for a farmhouse renovation"},{key:"avoid",label:"What do you never want to sound like?",ph:"e.g. Showing off, or too perfectly curated"},{key:"cta",label:"What do you want people to do?",ph:"e.g. Follow along, save this"}],
};

const TONE_OPTIONS = [
  { id:"ai",            label:"Tav Decides",   desc:"Best tone for your topic" },
  { id:"real",          label:"Calm & Real",   desc:"Honest, grounded" },
  { id:"bold",          label:"Bold & Direct", desc:"Punchy, confident" },
  { id:"educational",   label:"Educational",   desc:"Clear, informative" },
  { id:"inspirational", label:"Inspirational", desc:"Motivating" },
  { id:"provocative",   label:"Provocative",   desc:"Pattern-interrupt" },
];

const HOOK_STYLES = [
  { id:"ai",        label:"Tav Decides",   desc:"Best hook for your topic" },
  { id:"stat",      label:"Data-Led",      desc:"Shocking stat or number" },
  { id:"question",  label:"Question",      desc:"Challenges assumptions" },
  { id:"statement", label:"Bold Statement",desc:"Strong position" },
  { id:"story",     label:"Story",         desc:"Opens mid-scene" },
];

const GOALS = [
  { id:"ai",         label:"Tav Decides" },
  { id:"grow",       label:"Grow Audience" },
  { id:"sell",       label:"Drive Sales" },
  { id:"trust",      label:"Build Trust" },
  { id:"educate",    label:"Educate" },
  { id:"engagement", label:"Engagement" },
];

const STORAGE_KEY = "bwt_cg_v2";

// ─── CANVAS: COLOUR SYSTEM ───────────────────────────────

function getColors(theme, customBg, customAccent) {
  const map = {
    "dark-gold": { bg:"#0A0A0A", text:"#F0EDE6", accent:"#C9A84C", sub:"rgba(240,237,230,0.78)", dark:true },
    "midnight":  { bg:"#0D1117", text:"#E8EAF2", accent:"#7C9EFF", sub:"rgba(232,234,242,0.75)", dark:true },
    "editorial": { bg:"#F8F6F2", text:"#0A0A0A", accent:"#0A0A0A", sub:"rgba(10,10,10,0.65)", dark:false },
    "warm":      { bg:"#F2EDE4", text:"#2A1F14", accent:"#8B4513", sub:"rgba(42,31,20,0.68)", dark:false },
    "slate":     { bg:"#1C2333", text:"#E8D5B0", accent:"#D4B896", sub:"rgba(232,213,176,0.72)", dark:true },
    "noir":      { bg:"#050505", text:"#FFFFFF", accent:"#FFFFFF", sub:"rgba(255,255,255,0.72)", dark:true },
    "forest":    { bg:"#1A2E1A", text:"#E8F5E8", accent:"#7DBE7D", sub:"rgba(232,245,232,0.75)", dark:true },
    "rose":      { bg:"#FDF4F4", text:"#2D1A1A", accent:"#C0636A", sub:"rgba(45,26,26,0.65)", dark:false },
    "navy":      { bg:"#0A1628", text:"#F0EAD6", accent:"#E8C97A", sub:"rgba(240,234,214,0.75)", dark:true },
    "custom":    { bg:customBg||"#0A0A0A", text:"#FFFFFF", accent:customAccent||"#C9A84C", sub:"rgba(255,255,255,0.75)", dark:true },
  };
  return map[theme] || map["dark-gold"];
}

// ─── CANVAS: UTILITIES ───────────────────────────────────

function noise(ctx, W, H, a=0.025) {
  ctx.save(); ctx.globalAlpha=a;
  for (let i=0;i<9000;i++) {
    const v=Math.random()>0.5?255:0;
    ctx.fillStyle=`rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random()*W,Math.random()*H,1,1);
  }
  ctx.restore();
}

function wrapLines(ctx, text, maxW) {
  const words=text.split(" "); const lines=[]; let line="";
  for (const w of words) {
    const t=line?line+" "+w:w;
    if (ctx.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t;
  }
  if(line)lines.push(line); return lines;
}

function textWithShadow(ctx, text, x, y, color, shadowColor, blur=14, offsetY=2) {
  ctx.save();
  ctx.shadowColor=shadowColor; ctx.shadowBlur=blur; ctx.shadowOffsetY=offsetY;
  ctx.fillStyle=color; ctx.fillText(text,x,y);
  // Double-draw for stronger shadow
  ctx.fillText(text,x,y);
  ctx.restore();
}

// ─── CANVAS: DESIGN VARIATION SYSTEM ────────────────────
// Each theme has multiple layout variations — randomised per-generation seed

function getDesignVariant(seed, theme) {
  const v = seed % 3; // 3 variants per theme
  return v;
}

function drawThemeElements(ctx, W, H, C, theme, variant) {
  const acc = C.accent;

  if (theme==="dark-gold") {
    // Always: vignette + noise
    const vig=ctx.createRadialGradient(W/2,H/2,W*0.2,W/2,H/2,W*0.82);
    vig.addColorStop(0,"rgba(0,0,0,0)"); vig.addColorStop(1,"rgba(0,0,0,0.55)");
    ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);
    noise(ctx,W,H,0.025);
    if (variant===0) {
      // Corner brackets — all 4
      const b=58; ctx.strokeStyle=acc; ctx.lineWidth=2.5;
      [[b,46,46,46,46,b],[W-b,46,W-46,46,W-46,b],[b,H-46,46,H-46,46,H-b],[W-b,H-46,W-46,H-46,W-46,H-b]]
        .forEach(([x1,y1,x2,y2,x3,y3])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.stroke();});
    } else if (variant===1) {
      // Side accent lines
      ctx.strokeStyle=acc; ctx.lineWidth=1.5; ctx.globalAlpha=0.35;
      ctx.beginPath(); ctx.moveTo(48,100); ctx.lineTo(48,H-100); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W-48,100); ctx.lineTo(W-48,H-100); ctx.stroke();
      ctx.globalAlpha=1;
      // Top + bottom rules
      ctx.lineWidth=1; ctx.globalAlpha=0.25;
      ctx.beginPath(); ctx.moveTo(80,48); ctx.lineTo(W-80,48); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(80,H-48); ctx.lineTo(W-80,H-48); ctx.stroke();
      ctx.globalAlpha=1;
    } else {
      // Diagonal accent line top-right
      ctx.strokeStyle=acc; ctx.lineWidth=1; ctx.globalAlpha=0.2;
      ctx.beginPath(); ctx.moveTo(W-200,0); ctx.lineTo(W,200); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W-300,0); ctx.lineTo(W,300); ctx.stroke();
      ctx.globalAlpha=1;
      // Bottom rule
      ctx.lineWidth=2; ctx.globalAlpha=0.4;
      ctx.beginPath(); ctx.moveTo(60,H-56); ctx.lineTo(W-60,H-56); ctx.stroke();
      ctx.globalAlpha=1;
    }
    // Always: gold top wash
    const tg=ctx.createLinearGradient(0,0,0,H*0.35);
    tg.addColorStop(0,"rgba(201,168,76,0.07)"); tg.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=tg; ctx.fillRect(0,0,W,H*0.35);
  }

  if (theme==="midnight") {
    noise(ctx,W,H,0.018);
    // Blue glow
    const gl=ctx.createRadialGradient(W*0.72,H*0.15,0,W*0.72,H*0.15,W*0.65);
    gl.addColorStop(0,"rgba(124,158,255,0.15)"); gl.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=gl; ctx.fillRect(0,0,W,H);
    // Stars
    ctx.save(); ctx.globalAlpha=0.6;
    for(let i=0;i<60;i++){const sx=Math.random()*W,sy=Math.random()*H*0.5,sr=Math.random()*1.5+0.2;ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${Math.random()*0.5+0.2})`;ctx.fill();}
    ctx.restore();
    if (variant===1) {
      // Horizontal lines
      ctx.strokeStyle=acc; ctx.lineWidth=0.5; ctx.globalAlpha=0.15;
      for(let y=200;y<H-100;y+=60){ctx.beginPath();ctx.moveTo(60,y);ctx.lineTo(W-60,y);ctx.stroke();}
      ctx.globalAlpha=1;
    }
    const bg2=ctx.createLinearGradient(0,H*0.6,0,H);
    bg2.addColorStop(0,"rgba(13,17,23,0)"); bg2.addColorStop(1,"rgba(13,17,23,0.7)");
    ctx.fillStyle=bg2; ctx.fillRect(0,H*0.6,W,H*0.4);
  }

  if (theme==="editorial") {
    if (variant===0) {
      ctx.fillStyle=acc; ctx.fillRect(60,54,120,3);
      ctx.globalAlpha=0.15; ctx.fillStyle=acc; ctx.fillRect(60,H-54,W-120,1); ctx.globalAlpha=1;
    } else if (variant===1) {
      // Full width top bar
      ctx.fillStyle=acc; ctx.fillRect(0,0,W,8);
      ctx.globalAlpha=0.12; ctx.fillStyle=acc; ctx.fillRect(0,H-8,W,8); ctx.globalAlpha=1;
    } else {
      // Left accent bar
      ctx.fillStyle=acc; ctx.fillRect(0,0,8,H);
      ctx.globalAlpha=0.15; ctx.fillRect(W-8,0,8,H); ctx.globalAlpha=1;
    }
    // Dot grid — always subtle
    ctx.save(); ctx.globalAlpha=0.035;
    for(let x=80;x<W-80;x+=44)for(let y=220;y<H-100;y+=44){ctx.fillStyle="#000";ctx.beginPath();ctx.arc(x,y,1.3,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }

  if (theme==="warm") {
    noise(ctx,W,H,0.014);
    const wg=ctx.createLinearGradient(0,0,W,H);
    wg.addColorStop(0,"rgba(210,160,100,0.08)"); wg.addColorStop(1,"rgba(139,69,19,0.03)");
    ctx.fillStyle=wg; ctx.fillRect(0,0,W,H);
    if (variant!==2) {
      ctx.globalAlpha=0.18; ctx.fillStyle=acc; ctx.fillRect(54,140,2.5,H-280); ctx.globalAlpha=1;
    }
    if (variant===2) {
      ctx.strokeStyle=acc; ctx.lineWidth=1; ctx.globalAlpha=0.2;
      ctx.beginPath(); ctx.moveTo(60,60); ctx.lineTo(W-60,60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(60,H-60); ctx.lineTo(W-60,H-60); ctx.stroke();
      ctx.globalAlpha=1;
    }
  }

  if (theme==="slate") {
    noise(ctx,W,H,0.018);
    const sg=ctx.createRadialGradient(W*0.15,H*0.1,0,W*0.15,H*0.1,W*0.85);
    sg.addColorStop(0,"rgba(212,184,150,0.12)"); sg.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=sg; ctx.fillRect(0,0,W,H);
    const sbg=ctx.createLinearGradient(0,H*0.62,0,H);
    sbg.addColorStop(0,"rgba(28,35,51,0)"); sbg.addColorStop(1,"rgba(28,35,51,0.65)");
    ctx.fillStyle=sbg; ctx.fillRect(0,H*0.62,W,H*0.38);
    if (variant===0) {
      ctx.strokeStyle=acc; ctx.lineWidth=1.5; ctx.globalAlpha=0.2;
      ctx.beginPath(); ctx.moveTo(54,100); ctx.lineTo(54,H-100); ctx.stroke();
      ctx.globalAlpha=1;
    }
  }

  if (theme==="noir") {
    noise(ctx,W,H,0.04);
    if (variant===0) {
      ctx.strokeStyle="rgba(255,255,255,0.08)"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(60,H-88); ctx.lineTo(W-60,H-88); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(60,88); ctx.lineTo(W-60,88); ctx.stroke();
    } else if (variant===1) {
      // Grid lines
      ctx.strokeStyle="rgba(255,255,255,0.04)"; ctx.lineWidth=1;
      for(let x=150;x<W;x+=150){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(let y=150;y<H;y+=150){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    } else {
      // Large circle
      ctx.strokeStyle="rgba(255,255,255,0.05)"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(W/2,H/2,W*0.42,0,Math.PI*2); ctx.stroke();
    }
  }

  if (theme==="forest") {
    noise(ctx,W,H,0.02);
    const fg=ctx.createRadialGradient(W*0.8,H*0.12,0,W*0.8,H*0.12,W*0.72);
    fg.addColorStop(0,"rgba(125,190,125,0.14)"); fg.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=fg; ctx.fillRect(0,0,W,H);
    const fbg=ctx.createLinearGradient(0,H*0.58,0,H);
    fbg.addColorStop(0,"rgba(26,46,26,0)"); fbg.addColorStop(1,"rgba(26,46,26,0.72)");
    ctx.fillStyle=fbg; ctx.fillRect(0,H*0.58,W,H*0.42);
    ctx.globalAlpha=0.15; ctx.fillStyle=acc; ctx.fillRect(54,140,2,H-280); ctx.globalAlpha=1;
  }

  if (theme==="rose") {
    noise(ctx,W,H,0.01);
    const rg=ctx.createLinearGradient(0,0,W,H);
    rg.addColorStop(0,"rgba(220,140,145,0.1)"); rg.addColorStop(1,"rgba(192,99,106,0.04)");
    ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
    if (variant===0) {
      ctx.fillStyle=acc; ctx.globalAlpha=0.35; ctx.fillRect(60,56,100,2.5); ctx.globalAlpha=1;
    } else if (variant===1) {
      ctx.fillStyle=acc; ctx.globalAlpha=0.35; ctx.fillRect(0,0,W,6); ctx.globalAlpha=1;
    }
    const rbg=ctx.createLinearGradient(0,H*0.72,0,H);
    rbg.addColorStop(0,"rgba(242,228,228,0)"); rbg.addColorStop(1,"rgba(242,228,228,0.3)");
    ctx.fillStyle=rbg; ctx.fillRect(0,H*0.72,W,H*0.28);
  }

  if (theme==="navy") {
    noise(ctx,W,H,0.022);
    const ng=ctx.createRadialGradient(W*0.18,H*0.08,0,W*0.18,H*0.08,W*0.8);
    ng.addColorStop(0,"rgba(232,201,122,0.12)"); ng.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=ng; ctx.fillRect(0,0,W,H);
    if (variant===0) {
      const b=56; ctx.strokeStyle=acc; ctx.lineWidth=2; ctx.globalAlpha=0.35;
      [[b,44,44,44,44,b],[W-b,44,W-44,44,W-44,b],[b,H-44,44,H-44,44,H-b],[W-b,H-44,W-44,H-44,W-44,H-b]]
        .forEach(([x1,y1,x2,y2,x3,y3])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.stroke();});
      ctx.globalAlpha=1;
    }
    const nbg=ctx.createLinearGradient(0,H*0.62,0,H);
    nbg.addColorStop(0,"rgba(10,22,40,0)"); nbg.addColorStop(1,"rgba(10,22,40,0.65)");
    ctx.fillStyle=nbg; ctx.fillRect(0,H*0.62,W,H*0.38);
  }

  if (theme==="custom") {
    noise(ctx,W,H,0.02);
    const cvg=ctx.createRadialGradient(W/2,H/2,W*0.25,W/2,H/2,W*0.78);
    cvg.addColorStop(0,"rgba(0,0,0,0)"); cvg.addColorStop(1,"rgba(0,0,0,0.42)");
    ctx.fillStyle=cvg; ctx.fillRect(0,0,W,H);
  }
}

// ─── MAIN DRAW FUNCTION ───────────────────────────────────

function drawSlide(ctx, W, H, slide, idx, total, opts) {
  const {theme,fontId,bgImg,treatment,imgOpacity,overlayDark,showNums,
         profileImg,name,handle,blueTick,websiteUrl,customBg,customAccent,designSeed} = opts;
  const C = getColors(theme,customBg,customAccent);
  const F = FONTS.find(f=>f.id===fontId)||FONTS[0];
  const HF = `"${F.headline}"`;
  const BF = `"${F.body}"`;
  const variant = getDesignVariant((designSeed||0)+idx, theme);
  const SHADOW = C.dark ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.18)";

  // ── BASE ──
  ctx.fillStyle=C.bg; ctx.fillRect(0,0,W,H);

  // ── IMAGE ──
  if (bgImg && treatment!=="none") {
    if (treatment==="split") {
      const iw=Math.floor(W*0.42);
      ctx.save(); ctx.beginPath(); ctx.rect(0,0,iw,H); ctx.clip();
      const sc=Math.max(iw/bgImg.width,H/bgImg.height);
      ctx.drawImage(bgImg,(iw-bgImg.width*sc)/2,(H-bgImg.height*sc)/2,bgImg.width*sc,bgImg.height*sc);
      ctx.restore(); ctx.save();
      const eg=ctx.createLinearGradient(iw-180,0,iw,0);
      eg.addColorStop(0,"rgba(0,0,0,0)"); eg.addColorStop(1,C.bg);
      ctx.fillStyle=eg; ctx.fillRect(iw-180,0,180,H); ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = treatment==="dim" ? imgOpacity/100 : 1;
      const sc=Math.max(W/bgImg.width,H/bgImg.height);
      ctx.drawImage(bgImg,(W-bgImg.width*sc)/2,(H-bgImg.height*sc)/2,bgImg.width*sc,bgImg.height*sc);
      ctx.restore();
      if (treatment==="gradient") {
        // Smart gradient — readable text guaranteed
        const d = Math.min(overlayDark/100, 0.82);
        const g = ctx.createLinearGradient(0,0,0,H);
        g.addColorStop(0,`rgba(0,0,0,${d*0.88})`);
        g.addColorStop(0.35,`rgba(0,0,0,${d*0.38})`);
        g.addColorStop(0.65,`rgba(0,0,0,${d*0.38})`);
        g.addColorStop(1,`rgba(0,0,0,${d*0.92})`);
        ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      }
    }
  }

  // ── THEME DESIGN ELEMENTS ──
  drawThemeElements(ctx,W,H,C,theme,variant);

  // ── PROFILE BADGE — top left, properly inset ──
  const avR=48, avX=86, avY=100;

  // Backdrop pill behind entire badge for guaranteed readability
  const badgePadH=24, badgePadV=20;
  const badgeX=avX-avR-badgePadH;
  const badgeY=avY-avR-badgePadV;
  const badgeW=avR*2+200+badgePadH*2; // estimate — wider than needed
  const badgeH2=avR*2+badgePadV*2;
  ctx.save();
  ctx.fillStyle=C.dark?"rgba(0,0,0,0.52)":"rgba(255,255,255,0.62)";
  ctx.filter="blur(18px)";
  ctx.fillRect(badgeX,badgeY,badgeW,badgeH2);
  ctx.filter="none";
  ctx.restore();

  // Avatar circle
  ctx.save();
  // Drop shadow on avatar
  ctx.shadowColor="rgba(0,0,0,0.65)"; ctx.shadowBlur=20; ctx.shadowOffsetY=3;
  // Draw shadow circle first
  ctx.beginPath(); ctx.arc(avX,avY,avR+4,0,Math.PI*2);
  ctx.fillStyle=C.accent; ctx.fill();
  ctx.restore();

  // Clip and draw avatar image
  ctx.save();
  ctx.beginPath(); ctx.arc(avX,avY,avR,0,Math.PI*2); ctx.clip();
  if (profileImg) {
    const sc=Math.max(avR*2/profileImg.width,avR*2/profileImg.height);
    ctx.drawImage(profileImg,avX-avR-(profileImg.width*sc-avR*2)/2,avY-avR-(profileImg.height*sc-avR*2)/2,profileImg.width*sc,profileImg.height*sc);
  } else {
    ctx.fillStyle=C.accent; ctx.fillRect(avX-avR,avY-avR,avR*2,avR*2);
    ctx.fillStyle=C.dark?"rgba(0,0,0,0.7)":"rgba(255,255,255,0.9)";
    ctx.font=`bold ${avR*0.8}px ${HF}`; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText((name||"?")[0].toUpperCase(),avX,avY);
    ctx.textBaseline="alphabetic";
  }
  ctx.restore();

  // Avatar ring
  ctx.save();
  ctx.shadowColor="rgba(0,0,0,0.4)"; ctx.shadowBlur=8;
  ctx.strokeStyle=C.accent; ctx.lineWidth=3;
  ctx.beginPath(); ctx.arc(avX,avY,avR+3,0,Math.PI*2); ctx.stroke();
  ctx.restore();

  // Name text
  const nx=avX+avR+16;
  const nameColor=C.dark?"#FFFFFF":"#111111";
  const handleColor=C.dark?"rgba(255,255,255,0.6)":"rgba(0,0,0,0.5)";
  ctx.save();
  ctx.shadowColor=C.dark?"rgba(0,0,0,0.9)":"rgba(0,0,0,0.2)"; ctx.shadowBlur=16; ctx.shadowOffsetY=1;
  ctx.fillStyle=nameColor; ctx.font=`bold 29px ${HF}`; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  ctx.fillText(name||"Your Brand",nx,avY-4);
  ctx.restore();

  // Blue tick
  if (blueTick) {
    ctx.save(); ctx.font=`bold 29px ${HF}`;
    const nw=ctx.measureText(name||"Your Brand").width;
    ctx.restore();
    const tx=nx+nw+10, ty=avY-28;
    ctx.save();
    ctx.shadowColor="rgba(0,0,0,0.4)"; ctx.shadowBlur=6;
    ctx.fillStyle="#1D9BF0"; ctx.beginPath(); ctx.arc(tx+13,ty+13,13,0,Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle="#fff"; ctx.lineWidth=2.2; ctx.lineCap="round"; ctx.lineJoin="round";
    ctx.beginPath(); ctx.moveTo(tx+5,ty+13); ctx.lineTo(tx+11,ty+19); ctx.lineTo(tx+21,ty+7); ctx.stroke();
  }

  // Handle
  ctx.save();
  ctx.shadowColor=C.dark?"rgba(0,0,0,0.8)":"rgba(0,0,0,0.15)"; ctx.shadowBlur=10;
  ctx.fillStyle=handleColor; ctx.font=`22px ${BF}`; ctx.textAlign="left";
  ctx.fillText(handle||"@yourhandle",nx,avY+20);
  ctx.restore();

  // ── SLIDE NUMBER — editorial watermark ──
  if (showNums) {
    ctx.save();
    const numStr=String(idx+1).padStart(2,"0");
    // Large ghosted watermark
    ctx.font=`bold ${Math.floor(H*0.26)}px ${HF}`;
    ctx.fillStyle=C.dark?"rgba(255,255,255,0.035)":"rgba(0,0,0,0.035)";
    ctx.textAlign="right"; ctx.textBaseline="bottom";
    ctx.fillText(numStr,W-44,H-36);
    ctx.textBaseline="alphabetic";
    // Small readable counter
    ctx.font=`600 17px ${BF}`;
    ctx.fillStyle=`${C.accent}AA`;
    ctx.textAlign="right";
    ctx.fillText(`${idx+1} / ${total}`,W-64,68);
    ctx.restore();
  }

  // ── CONTENT — smart vertical centering ──
  const cx=W/2;
  const hasWebsite=!!(websiteUrl&&websiteUrl.trim());
  const hasCTA=!!(slide.cta&&slide.cta.trim());
  const hasTitle=!!(slide.tag&&slide.tag.trim());

  // Calculate total content block height
  const titleH = hasTitle ? 52 : 0;
  const hl=slide.headline||"";
  const hSize=hl.length>55?52:hl.length>42?62:hl.length>30?72:hl.length>18?84:94;
  ctx.font=`bold ${hSize}px ${HF}`;
  const hlLines=wrapLines(ctx,hl,W-160);
  const hlBlockH=hlLines.length*hSize*1.25;
  const divH=70;
  const bodyLineH=52;
  ctx.font=`31px ${BF}`;
  const bLines=slide.body?wrapLines(ctx,slide.body,W-210):[];
  const bodyBlockH=bLines.length*bodyLineH;
  const totalH=titleH+hlBlockH+divH+bodyBlockH;

  // Zone: below badge, above CTA/footer
  const topZ=avY+avR+60;
  const botZ=H-(hasCTA?160:0)-(hasWebsite?60:0)-60;
  const zoneH=botZ-topZ;
  const blockTop=topZ+Math.max(0,(zoneH-totalH)/2);

  let curY=blockTop;

  // Slide title pill
  if (hasTitle) {
    ctx.save();
    ctx.font=`700 20px ${BF}`;
    const tw=ctx.measureText(slide.tag.toUpperCase()).width+40;
    // Pill
    ctx.fillStyle=C.dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.07)";
    ctx.beginPath();
    if(ctx.roundRect)ctx.roundRect(cx-tw/2,curY,tw,32,16);
    else ctx.rect(cx-tw/2,curY,tw,32);
    ctx.fill();
    ctx.fillStyle=C.accent;
    ctx.textAlign="center"; ctx.textBaseline="alphabetic";
    ctx.fillText(slide.tag.toUpperCase(),cx,curY+22);
    ctx.restore();
    curY+=titleH;
  }

  // Headline — with strong text shadow for readability on any background
  ctx.font=`bold ${hSize}px ${HF}`;
  ctx.textAlign="center";
  const hlShadow=C.dark?"rgba(0,0,0,0.95)":"rgba(0,0,0,0.12)";
  let hlY=curY+hSize;
  for(const line of hlLines) {
    ctx.save();
    ctx.shadowColor=hlShadow; ctx.shadowBlur=C.dark?20:10; ctx.shadowOffsetY=2;
    // Draw 3 times for maximum legibility
    ctx.fillStyle=C.text; ctx.fillText(line,cx,hlY);
    ctx.fillText(line,cx,hlY);
    ctx.fillText(line,cx,hlY);
    ctx.restore();
    hlY+=hSize*1.25;
  }
  curY=hlY-hSize*1.25+hSize*0.15;

  // Divider
  const divY=curY+28;
  ctx.save();
  if (theme==="editorial"||theme==="rose") {
    ctx.strokeStyle=C.accent; ctx.lineWidth=1; ctx.globalAlpha=0.5;
    ctx.beginPath(); ctx.moveTo(cx-95,divY); ctx.lineTo(cx-8,divY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+8,divY); ctx.lineTo(cx+95,divY); ctx.stroke();
    ctx.globalAlpha=1; ctx.fillStyle=C.accent;
    ctx.fillRect(cx-7,divY-7,14,14);
  } else if (theme==="noir") {
    ctx.strokeStyle=C.accent; ctx.lineWidth=1.5; ctx.globalAlpha=0.4;
    ctx.beginPath(); ctx.moveTo(cx-82,divY); ctx.lineTo(cx+82,divY); ctx.stroke();
    ctx.globalAlpha=1; ctx.fillStyle=C.accent;
    ctx.beginPath(); ctx.arc(cx,divY,5.5,0,Math.PI*2); ctx.fill();
  } else {
    ctx.strokeStyle=C.accent; ctx.lineWidth=1.5; ctx.globalAlpha=0.38;
    ctx.beginPath(); ctx.moveTo(cx-70,divY); ctx.lineTo(cx+70,divY); ctx.stroke();
    ctx.globalAlpha=0.8; ctx.fillStyle=C.accent;
    ctx.beginPath(); ctx.arc(cx-78,divY,3.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+78,divY,3.5,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
  }
  ctx.restore();
  curY=divY+42;

  // Body text — with shadow
  if (bLines.length>0) {
    ctx.font=`31px ${BF}`; ctx.textAlign="center";
    for(const line of bLines) {
      ctx.save();
      ctx.shadowColor=C.dark?"rgba(0,0,0,0.85)":"rgba(0,0,0,0.1)"; ctx.shadowBlur=12; ctx.shadowOffsetY=1;
      ctx.fillStyle=C.sub; ctx.fillText(line,cx,curY);
      ctx.fillText(line,cx,curY); // double for strength
      ctx.restore();
      curY+=bodyLineH;
    }
  }

  // CTA — pinned near bottom
  if (hasCTA) {
    const ctaY=H-(hasWebsite?148:98);
    ctx.save();
    ctx.font=`bold 31px ${HF}`;
    const ctaW=ctx.measureText(slide.cta).width;
    // Pill bg
    ctx.globalAlpha=0.14; ctx.fillStyle=C.accent;
    ctx.beginPath();
    if(ctx.roundRect)ctx.roundRect(cx-ctaW/2-30,ctaY-38,ctaW+60,54,27);
    else ctx.rect(cx-ctaW/2-30,ctaY-38,ctaW+60,54);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.shadowColor=C.dark?"rgba(0,0,0,0.8)":"rgba(0,0,0,0.2)"; ctx.shadowBlur=12;
    ctx.fillStyle=C.accent; ctx.textAlign="center"; ctx.fillText(slide.cta,cx,ctaY);
    ctx.fillText(slide.cta,cx,ctaY);
    ctx.restore();
  }

  // Website footer
  if (hasWebsite) {
    ctx.save();
    ctx.shadowColor=C.dark?"rgba(0,0,0,0.7)":"rgba(0,0,0,0.12)"; ctx.shadowBlur=8;
    ctx.fillStyle=C.dark?"rgba(255,255,255,0.32)":"rgba(0,0,0,0.28)";
    ctx.font=`20px ${BF}`; ctx.textAlign="center";
    ctx.fillText(websiteUrl.trim(),cx,H-34);
    ctx.restore();
  }
}

// ─── SLIDE CANVAS COMPONENT ───────────────────────────────

function SlideCanvas({slide,idx,total,opts}) {
  const ref=useRef(null);
  const optsKey=JSON.stringify({...opts,bgImageUrl:opts.bgImageUrl?"[img]":null,profileDataUrl:opts.profileDataUrl?"[img]":null});
  useEffect(()=>{
    const canvas=ref.current; if(!canvas||!slide)return;
    const isP=opts.ratio==="portrait"; const W=1080,H=isP?1920:1080;
    canvas.width=W; canvas.height=H;
    const ctx=canvas.getContext("2d");
    const load=src=>new Promise(r=>{if(!src)return r(null);const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src;});
    Promise.all([load(opts.bgImageUrl),load(opts.profileDataUrl)]).then(([bgImg,profileImg])=>{
      drawSlide(ctx,W,H,slide,idx,total,{...opts,bgImg,profileImg});
    });
  },[slide,idx,total,optsKey]);
  const isP=opts.ratio==="portrait";
  return <canvas ref={ref} style={{width:"100%",aspectRatio:isP?"9/16":"1/1",display:"block",borderRadius:6}} />;
}

// ─── STORAGE ─────────────────────────────────────────────

function loadData(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");}catch{return null;}}
function saveData(d){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(d));}catch{}}

// ─── UI HELPERS ──────────────────────────────────────────

function Spin({c="#1A1A1A"}){return <div style={{width:16,height:16,borderRadius:"50%",border:"2px solid rgba(0,0,0,0.1)",borderTop:`2px solid ${c}`,animation:"spin 0.7s linear infinite",display:"inline-block",flexShrink:0}} />;}
function Toggle({on,set,T}){return <div onClick={()=>set(!on)} style={{width:42,height:22,borderRadius:11,background:on?T.accent:T.border,position:"relative",cursor:"pointer",flexShrink:0,transition:"background 0.2s"}}><div style={{position:"absolute",top:2,left:on?22:2,width:18,height:18,borderRadius:"50%",background:on?T.accentText:"#999",transition:"left 0.2s"}} /></div>;}

// ─── MAIN APP ─────────────────────────────────────────────

export default function App() {
  const S=loadData();
  const [appTheme,setAppTheme]=useState(S?.appTheme||"light");
  const T=APP_THEMES[appTheme];

  const [businessType,setBusinessType]=useState(S?.businessType||"");
  const [brandAnswers,setBrandAnswers]=useState(S?.brandAnswers||{});
  const [voiceProfile,setVoiceProfile]=useState(S?.voiceProfile||"");
  const [genVoice,setGenVoice]=useState(false);

  const [profileDataUrl,setProfileDataUrl]=useState(S?.profileDataUrl||null);
  const [displayName,setDisplayName]=useState(S?.displayName||"");
  const [handle,setHandle]=useState(S?.handle||"");
  const [blueTick,setBlueTick]=useState(S?.blueTick??false);
  const [websiteUrl,setWebsiteUrl]=useState(S?.websiteUrl||"");
  const [showWebsite,setShowWebsite]=useState(S?.showWebsite??false);

  const [slideTheme,setSlideTheme]=useState(S?.slideTheme||"dark-gold");
  const [fontId,setFontId]=useState(S?.fontId||"playfair");
  const [showNums,setShowNums]=useState(S?.showNums??true);
  const [treatment,setTreatment]=useState(S?.treatment||"gradient");
  const [imgOpacity,setImgOpacity]=useState(S?.imgOpacity||30);
  const [overlayDark,setOverlayDark]=useState(S?.overlayDark||65);
  const [customBg,setCustomBg]=useState(S?.customBg||"#0A0A0A");
  const [customAccent,setCustomAccent]=useState(S?.customAccent||"#C9A84C");

  const [topic,setTopic]=useState("");
  const [keyThemes,setKeyThemes]=useState("");
  const [angle,setAngle]=useState("");
  const [goal,setGoal]=useState("ai");
  const [tone,setTone]=useState("ai");
  const [hookStyle,setHookStyle]=useState("ai");
  const [slideCount,setSlideCount]=useState(7);

  const [coverImage,setCoverImage]=useState(null);
  const [imageForAll,setImageForAll]=useState(false);
  const [designSeed,setDesignSeed]=useState(Math.floor(Math.random()*100));

  const [step,setStep]=useState("setup");
  const [tab,setTab]=useState("content");
  const [editing,setEditing]=useState([]);
  const [active,setActive]=useState(0);
  const [ratio,setRatio]=useState("square");
  const [slidePrompt,setSlidePrompt]=useState("");
  const [regenLoading,setRegenLoading]=useState(false);
  const [dlAll,setDlAll]=useState(false);
  const [err,setErr]=useState("");
  const [fontsLoaded,setFontsLoaded]=useState(false);

  const profileRef=useRef(null);
  const coverRef=useRef(null);

  useEffect(()=>{loadFonts().then(()=>setFontsLoaded(true));},[]);
  useEffect(()=>{saveData({appTheme,businessType,brandAnswers,voiceProfile,profileDataUrl,displayName,handle,blueTick,websiteUrl,showWebsite,slideTheme,fontId,showNums,treatment,imgOpacity,overlayDark,customBg,customAccent});},[appTheme,businessType,brandAnswers,voiceProfile,profileDataUrl,displayName,handle,blueTick,websiteUrl,showWebsite,slideTheme,fontId,showNums,treatment,imgOpacity,overlayDark,customBg,customAccent]);

  const handleImg=(e,set)=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>set(ev.target.result);r.readAsDataURL(f);};

  const buildVoice=async()=>{
    setGenVoice(true);
    const bType=BUSINESS_TYPES.find(b=>b.id===businessType)?.label||"brand";
    const questions=BRAND_QUESTIONS[businessType]||BRAND_QUESTIONS.creator;
    const qa=questions.map(q=>`${q.label}\n${brandAnswers[q.key]||"Not provided"}`).join("\n\n");
    try {
      const res=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-opus-4-7",max_tokens:600,
          messages:[{role:"user",content:`Write a concise AI voice profile (under 180 words) for a ${bType} carousel generator. Based on:\n\n${qa}\n\nStart "Write in a tone that..." Be specific and practical.`}]})});
      const d=await res.json();
      setVoiceProfile(d.content?.find(b=>b.type==="text")?.text||"");
    } catch {setVoiceProfile("Write directly and honestly. Short punchy sentences. Speak to real problems. Never overpromise.");}
    setGenVoice(false);
  };

  const generate=async()=>{
    if(!topic.trim()){setErr("Add a topic first.");return;}
    setErr(""); setStep("generating");
    const newSeed=Math.floor(Math.random()*1000);
    setDesignSeed(newSeed);
    const bType=BUSINESS_TYPES.find(b=>b.id===businessType)?.label||"";
    const isAI=tone==="ai"&&hookStyle==="ai"&&goal==="ai";
    const tL=tone==="ai"?"choose the single best tone for this specific topic and audience":TONE_OPTIONS.find(t=>t.id===tone)?.label;
    const hL=hookStyle==="ai"?"choose the single most scroll-stopping hook style for this topic":HOOK_STYLES.find(h=>h.id===hookStyle)?.label;
    const gL=goal==="ai"?"infer the best goal from the topic and business type":GOALS.find(g=>g.id===goal)?.label;
    const extras=[bType&&`Business type: ${bType}`,keyThemes&&`Include these themes/words: ${keyThemes}`,angle&&`Angle: ${angle}`].filter(Boolean).join("\n");

    const prompt=`You are a world-class social media carousel copywriter. Your slides are known for being specific, readable, and genuinely stopping people mid-scroll.

BRAND VOICE:
${voiceProfile||"Direct, honest, no filler. Short punchy sentences. Real specific insights. No generic statements."}

TOPIC: "${topic}"
${extras}
GOAL: ${gL}
TONE: ${tL}
HOOK APPROACH: ${hL}

Generate exactly ${slideCount} carousel slides. Absolute rules:
1. NEVER include <cite>, HTML tags, or any markup in your output — clean text only
2. NEVER write structural words like HOOK, CTA, INTRO in visible content
3. First slide MUST be hyper-specific — real stats, real numbers, real scenarios that feel personal
4. Every slide must have genuine insight — no vague advice, no "many people struggle with..."
5. Headlines: max 8 words, punchy and specific. Think front page of a newspaper.
6. Body: 1-2 sentences MAX. Tight. Every word earns its place.
7. Last slide only: include a soft, non-pushy CTA
8. Use web search to verify any stats before including them
9. Match language and examples to the business type — a restaurant post sounds nothing like a B2B post
10. Slide titles (tag field): short, editorial label — max 3 words, no generic words like "SLIDE" or "INFO"

Return ONLY a valid JSON array. No markdown. No explanation. No preamble:
[{"tag":"EDITORIAL LABEL","headline":"punchy specific headline","body":"1-2 tight sentences","cta":null}]

Last slide cta should be a string, all others must be null.`;

    try {
      const res=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-opus-4-7",max_tokens:2000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:prompt}]})});
      const d=await res.json();
      const raw=d.content?.find(b=>b.type==="text")?.text||"";
      const clean=raw.replace(/<cite[^>]*>/g,"").replace(/<\/cite>/g,"").replace(/<[^>]+>/g,"");
      const m=clean.match(/\[[\s\S]*\]/);
      if(!m)throw new Error("no json");
      const parsed=JSON.parse(m[0]);
      const sanitize=s=>({
        ...s,
        tag:(s.tag||"").replace(/<[^>]+>/g,"").trim(),
        headline:(s.headline||"").replace(/<[^>]+>/g,"").trim(),
        body:(s.body||"").replace(/<[^>]+>/g,"").trim(),
        cta:(s.cta||"").replace(/<[^>]+>/g,"").trim()||null,
      });
      setEditing(parsed.map(sanitize)); setActive(0); setStep("preview");
    } catch {setErr("Generation failed. Please try again.");setStep("setup");}
  };

  const regenSlide=async()=>{
    if(!slidePrompt.trim())return; setRegenLoading(true);
    const cur=editing[active];
    try {
      const res=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-opus-4-7",max_tokens:500,
          messages:[{role:"user",content:`Rewrite this carousel slide: "${slidePrompt}"\n\nCurrent:\n${JSON.stringify(cur)}\n\nVoice: ${voiceProfile||"Direct, honest, specific."}\n\nReturn ONLY JSON {tag,headline,body,cta?}. No HTML, no cite tags, no markdown.`}]})});
      const d=await res.json();
      const raw=(d.content?.find(b=>b.type==="text")?.text||"").replace(/<[^>]+>/g,"");
      const m=raw.match(/\{[\s\S]*\}/);
      if(m){const u=JSON.parse(m[0]);const n=[...editing];n[active]={...n[active],...u,cta:u.cta||null};setEditing(n);setSlidePrompt("");}
    } catch {}
    setRegenLoading(false);
  };

  const updateSlide=(i,k,v)=>{const n=[...editing];n[i]={...n[i],[k]:v};setEditing(n);};
  const dlSlide=useCallback(i=>{const cs=document.querySelectorAll("canvas");if(!cs[i])return;const a=document.createElement("a");a.download=`slide-${i+1}.png`;a.href=cs[i].toDataURL("image/png");a.click();},[]);
  const dlAllSlides=useCallback(async()=>{setDlAll(true);const cs=document.querySelectorAll("canvas");for(let i=0;i<cs.length;i++){await new Promise(r=>setTimeout(r,300));const a=document.createElement("a");a.download=`slide-${i+1}.png`;a.href=cs[i].toDataURL("image/png");a.click();}setDlAll(false);},[]);

  const canvasOpts=useCallback((i)=>({
    theme:slideTheme,fontId,
    bgImageUrl:imageForAll?coverImage:(i===0?coverImage:null),
    treatment,imgOpacity,overlayDark,showNums,
    profileDataUrl,name:displayName,handle,blueTick,
    websiteUrl:showWebsite?websiteUrl:"",ratio,customBg,customAccent,designSeed,
  }),[slideTheme,fontId,coverImage,imageForAll,treatment,imgOpacity,overlayDark,showNums,profileDataUrl,displayName,handle,blueTick,websiteUrl,showWebsite,ratio,customBg,customAccent,designSeed]);

  // Styles
  const inp={width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"11px 14px",color:T.text,fontSize:14,fontFamily:"inherit"};
  const lbl={display:"block",color:T.muted,fontSize:10,letterSpacing:2.5,marginBottom:6,textTransform:"uppercase",fontWeight:700};
  const chip=(on,sm)=>({background:on?`${T.accent}14`:T.surface2,border:`1px solid ${on?T.accent:T.border}`,borderRadius:7,padding:sm?"7px 11px":"10px 12px",cursor:"pointer",textAlign:"left",color:T.text,fontFamily:"inherit",transition:"all 0.14s"});
  const questions=BRAND_QUESTIONS[businessType]||null;

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",paddingBottom:80}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}input,textarea{outline:none!important;font-family:inherit}
        button{cursor:pointer;font-family:inherit;transition:all 0.14s}button:hover{opacity:0.8}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
        input[type=range]{-webkit-appearance:none;height:3px;border-radius:2px;background:${T.border};width:100%}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;background:${T.accent};cursor:pointer}
        a{color:inherit;text-decoration:none}
      `}</style>

      {/* HEADER */}
      <div style={{borderBottom:`1px solid ${T.border}`,padding:"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:`${T.bg}F4`,backdropFilter:"blur(16px)",zIndex:100}}>
        <div style={{display:"flex",alignItems:"baseline",gap:10}}>
          <span style={{fontSize:14,fontWeight:800,color:T.accent,letterSpacing:-0.3}}>Build with Tav</span>
          <span style={{color:T.border}}>|</span>
          <span style={{fontSize:13,fontWeight:600,color:T.muted}}>Carousel Generator</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {step==="preview"&&<button onClick={()=>{setStep("setup");setEditing([]);}} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.muted,padding:"6px 13px",borderRadius:6,fontSize:12,fontWeight:600}}>← New</button>}
          <button onClick={()=>{localStorage.removeItem(STORAGE_KEY);window.location.reload();}} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.muted,padding:"6px 13px",borderRadius:6,fontSize:12,fontWeight:600}}>Switch Brand</button>
          <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:10,borderLeft:`1px solid ${T.border}`}}>
            <span style={{fontSize:13,color:T.muted}}>☀</span>
            <Toggle on={appTheme==="dark"} set={v=>setAppTheme(v?"dark":"light")} T={T} />
            <span style={{fontSize:13,color:T.muted}}>☾</span>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1080,margin:"0 auto",padding:"26px 20px"}}>

        {/* SETUP */}
        {step==="setup"&&(
          <div style={{animation:"fi 0.35s ease"}}>
            <div style={{display:"flex",gap:0,marginBottom:26,borderBottom:`1px solid ${T.border}`}}>
              {[["content","Content"],["visual","Visual"],["identity","Brand Identity"],["profile","Profile"]].map(([id,label])=>(
                <button key={id} onClick={()=>setTab(id)} style={{background:"none",border:"none",color:tab===id?T.text:T.muted,fontSize:12,fontWeight:tab===id?700:500,padding:"10px 18px",borderBottom:tab===id?`2px solid ${T.accent}`:"2px solid transparent",marginBottom:-1,letterSpacing:0.3,textTransform:"uppercase"}}>
                  {label}
                </button>
              ))}
            </div>

            {/* CONTENT TAB */}
            {tab==="content"&&(
              <div style={{display:"flex",flexDirection:"column",gap:20}}>
                <div>
                  <label style={lbl}>I am a...</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {BUSINESS_TYPES.map(bt=>(
                      <button key={bt.id} onClick={()=>{setBusinessType(bt.id);setBrandAnswers({});}} style={{background:businessType===bt.id?T.accent:T.surface2,border:`1px solid ${businessType===bt.id?T.accent:T.border}`,borderRadius:20,padding:"6px 14px",fontSize:12,color:businessType===bt.id?T.accentText:T.muted,fontWeight:businessType===bt.id?700:500}}>
                        {bt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={lbl}>Topic *</label>
                  <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder={
                    businessType==="restaurant"?"e.g. 5 reasons our Sunday roast sells out every week":
                    businessType==="gym"?"e.g. Why most people quit the gym within 6 weeks":
                    businessType==="coach"?"e.g. The real reason high achievers still feel empty":
                    businessType==="marketer"?"e.g. Why most brands waste 80% of their content budget":
                    businessType==="creator"?"e.g. Why most creators never make money from their content":
                    businessType==="retail"?"e.g. 5 things our best-selling product does differently":
                    businessType==="ecommerce"?"e.g. Why customers keep coming back (it's not price)":
                    businessType==="salon"?"e.g. The biggest hair mistakes we see every single week":
                    businessType==="corporate"?"e.g. Why most digital transformations fail in year one":
                    businessType==="personal"?"e.g. What I gave up to finally start living on my terms":
                    "e.g. Why most businesses fail on social media in year one"
                  } style={{...inp,fontSize:15,padding:"13px 15px"}} />
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div>
                    <label style={lbl}>Key themes / words <span style={{letterSpacing:0,fontSize:9,fontWeight:500}}>(optional)</span></label>
                    <input value={keyThemes} onChange={e=>setKeyThemes(e.target.value)} placeholder={
                      businessType==="restaurant"?"e.g. seasonal, locally sourced, Sunday roast":
                      businessType==="gym"?"e.g. strength, real results, community":
                      businessType==="coach"?"e.g. burnout, career change, high performance":
                      businessType==="marketer"?"e.g. organic growth, ROI, content strategy":
                      businessType==="creator"?"e.g. monetisation, audience growth, niche":
                      businessType==="retail"?"e.g. new arrivals, handmade, local":
                      businessType==="ecommerce"?"e.g. new collection, sustainability, delivery":
                      businessType==="salon"?"e.g. balayage, colour correction, healthy hair":
                      businessType==="corporate"?"e.g. efficiency, AI, cost reduction":
                      businessType==="personal"?"e.g. lifestyle, mindset, slow living":
                      "e.g. 2026 stats, UK market, cost of living"
                    } style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Specific angle <span style={{letterSpacing:0,fontSize:9,fontWeight:500}}>(optional)</span></label>
                    <input value={angle} onChange={e=>setAngle(e.target.value)} placeholder={
                      businessType==="restaurant"?"e.g. focus on the story behind the dish":
                      businessType==="gym"?"e.g. keep it real — no transformation promises":
                      businessType==="coach"?"e.g. lean into the emotional side, not strategy":
                      businessType==="marketer"?"e.g. make it data-led, back every claim with a number":
                      businessType==="creator"?"e.g. talk from personal experience, not theory":
                      businessType==="retail"?"e.g. focus on the people behind the product":
                      businessType==="ecommerce"?"e.g. lead with the problem the product solves":
                      businessType==="salon"?"e.g. position as expert advice, not a sales pitch":
                      businessType==="corporate"?"e.g. jargon-free, speak to the decision maker":
                      businessType==="personal"?"e.g. be vulnerable — share the hard parts":
                      "e.g. focus on the emotional side, not just tactics"
                    } style={inp} />
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                  <div>
                    <label style={lbl}>Goal</label>
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      {GOALS.map(g=><button key={g.id} onClick={()=>setGoal(g.id)} style={{...chip(goal===g.id,true),fontSize:12,fontWeight:goal===g.id?700:500,color:goal===g.id?T.accent:T.muted}}>{g.label}</button>)}
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Tone</label>
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      {TONE_OPTIONS.map(t=>(
                        <button key={t.id} onClick={()=>setTone(t.id)} style={{...chip(tone===t.id,true),textAlign:"left"}}>
                          <div style={{fontSize:12,fontWeight:700,color:tone===t.id?T.accent:T.text}}>{t.label}</div>
                          <div style={{fontSize:10,color:T.muted,marginTop:1}}>{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Hook Style</label>
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      {HOOK_STYLES.map(h=>(
                        <button key={h.id} onClick={()=>setHookStyle(h.id)} style={{...chip(hookStyle===h.id,true),textAlign:"left"}}>
                          <div style={{fontSize:12,fontWeight:700,color:hookStyle===h.id?T.accent:T.text}}>{h.label}</div>
                          <div style={{fontSize:10,color:T.muted,marginTop:1}}>{h.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{display:"flex",alignItems:"flex-start",gap:20}}>
                  <div>
                    <label style={lbl}>Slides</label>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <button onClick={()=>setSlideCount(Math.max(3,slideCount-1))} style={{width:32,height:32,borderRadius:6,background:T.surface2,border:`1px solid ${T.border}`,color:T.text,fontSize:18,fontWeight:700}}>−</button>
                      <span style={{fontSize:24,fontWeight:800,color:T.accent,minWidth:24,textAlign:"center"}}>{slideCount}</span>
                      <button onClick={()=>setSlideCount(Math.min(15,slideCount+1))} style={{width:32,height:32,borderRadius:6,background:T.surface2,border:`1px solid ${T.border}`,color:T.text,fontSize:18,fontWeight:700}}>+</button>
                    </div>
                  </div>
                  <div style={{flex:1}}>
                    <label style={lbl}>Image <span style={{letterSpacing:0,fontSize:9,fontWeight:500}}>(optional)</span></label>
                    <div onClick={()=>coverRef.current?.click()} style={{background:T.surface2,border:`1px dashed ${coverImage?T.accent:T.border}`,borderRadius:8,padding:"10px 14px",cursor:"pointer",textAlign:"center",marginBottom:coverImage?8:0}}>
                      <span style={{color:coverImage?T.accent:T.muted,fontSize:13,fontWeight:600}}>{coverImage?"✓ Image loaded — click to change":"Upload image"}</span>
                    </div>
                    <input ref={coverRef} type="file" accept="image/*" onChange={e=>handleImg(e,setCoverImage)} style={{display:"none"}} />
                    {coverImage&&(
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>setImageForAll(false)} style={{flex:1,background:!imageForAll?T.accent:T.surface2,border:`1px solid ${!imageForAll?T.accent:T.border}`,color:!imageForAll?T.accentText:T.muted,padding:"6px",borderRadius:6,fontSize:11,fontWeight:700}}>Cover only</button>
                        <button onClick={()=>setImageForAll(true)} style={{flex:1,background:imageForAll?T.accent:T.surface2,border:`1px solid ${imageForAll?T.accent:T.border}`,color:imageForAll?T.accentText:T.muted,padding:"6px",borderRadius:6,fontSize:11,fontWeight:700}}>All slides</button>
                      </div>
                    )}
                  </div>
                </div>

                {err&&<div style={{color:"#D94F4F",fontSize:13,padding:"10px 14px",background:"rgba(217,79,79,0.08)",borderRadius:8,border:"1px solid rgba(217,79,79,0.2)",fontWeight:500}}>{err}</div>}

                <button onClick={generate} disabled={!topic.trim()} style={{background:topic.trim()?T.accent:T.surface2,color:topic.trim()?T.accentText:T.muted,border:"none",borderRadius:10,padding:"14px 40px",fontSize:15,fontWeight:800,width:"100%",letterSpacing:0.3}}>
                  Generate Carousel →
                </button>
              </div>
            )}

            {/* VISUAL TAB */}
            {tab==="visual"&&(
              <div style={{display:"flex",flexDirection:"column",gap:22}}>
                <div>
                  <label style={lbl}>Slide Theme</label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:7}}>
                    {SLIDE_THEMES.map(st=>(
                      <button key={st.id} onClick={()=>setSlideTheme(st.id)} style={{...chip(slideTheme===st.id),display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"10px 8px",textAlign:"center"}}>
                        <div style={{display:"flex",gap:3}}>
                          <div style={{width:14,height:14,borderRadius:3,background:st.id==="custom"?customBg:st.preview[0],border:"1px solid rgba(0,0,0,0.15)"}} />
                          <div style={{width:14,height:14,borderRadius:3,background:st.id==="custom"?customAccent:st.preview[1]}} />
                        </div>
                        <div style={{fontSize:11,fontWeight:700,color:slideTheme===st.id?T.accent:T.text,lineHeight:1.2}}>{st.label}</div>
                      </button>
                    ))}
                  </div>
                  {slideTheme==="custom"&&(
                    <div style={{display:"flex",gap:14,marginTop:10,padding:"14px",background:T.surface2,borderRadius:8,border:`1px solid ${T.border}`}}>
                      <div style={{flex:1}}>
                        <label style={{...lbl,marginBottom:8}}>Background</label>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <input type="color" value={customBg} onChange={e=>setCustomBg(e.target.value)} style={{width:36,height:36,borderRadius:6,border:`1px solid ${T.border}`,cursor:"pointer",padding:2}} />
                          <input value={customBg} onChange={e=>setCustomBg(e.target.value)} style={{...inp,maxWidth:120,fontSize:12}} />
                        </div>
                      </div>
                      <div style={{flex:1}}>
                        <label style={{...lbl,marginBottom:8}}>Accent</label>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <input type="color" value={customAccent} onChange={e=>setCustomAccent(e.target.value)} style={{width:36,height:36,borderRadius:6,border:`1px solid ${T.border}`,cursor:"pointer",padding:2}} />
                          <input value={customAccent} onChange={e=>setCustomAccent(e.target.value)} style={{...inp,maxWidth:120,fontSize:12}} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label style={lbl}>Font</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {FONT_OPTIONS.map(f=>(
                      <button key={f.id} onClick={()=>setFontId(f.id)} style={{background:fontId===f.id?`${T.accent}14`:T.surface2,border:`1px solid ${fontId===f.id?T.accent:T.border}`,borderRadius:6,padding:"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:7,transition:"all 0.14s"}}>
                        <span style={{fontFamily:`"${FONTS.find(x=>x.id===f.id)?.headline}",serif`,fontSize:13,fontWeight:700,color:fontId===f.id?T.accent:T.text}}>{f.id==="playfair"?"Playfair":f.id==="cormorant"?"Cormorant":f.id==="dm"?"DM Serif":f.id==="baskerville"?"Baskerville":f.id==="montserrat"?"Montserrat":f.id==="poppins"?"Poppins":f.id==="jakarta"?"Jakarta":f.id==="inter"?"Inter":f.id==="lato"?"Lato":f.id==="oswald"?"Oswald":"Bebas"}</span>
                        <span style={{fontSize:10,color:T.muted}}>{f.sample}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={lbl}>Image Treatment</label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                    {IMAGE_TREATMENTS.map(it=>(
                      <button key={it.id} onClick={()=>setTreatment(it.id)} style={{...chip(treatment===it.id),textAlign:"center",padding:"10px 8px"}}>
                        <div style={{fontSize:12,fontWeight:700,color:treatment===it.id?T.accent:T.text,marginBottom:2}}>{it.label}</div>
                        <div style={{fontSize:10,color:T.muted,lineHeight:1.3}}>{it.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {treatment==="dim"&&<div><label style={lbl}>Image opacity — {imgOpacity}%</label><input type="range" min={5} max={55} value={imgOpacity} onChange={e=>setImgOpacity(+e.target.value)} /></div>}
                {treatment==="gradient"&&<div><label style={lbl}>Overlay darkness — {overlayDark}%</label><input type="range" min={20} max={80} value={overlayDark} onChange={e=>setOverlayDark(+e.target.value)} /></div>}

                <div onClick={()=>setShowNums(!showNums)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"11px 14px",cursor:"pointer"}}>
                  <div><div style={{fontWeight:700,fontSize:13}}>Slide Numbers</div><div style={{color:T.muted,fontSize:11,marginTop:2}}>Show editorial watermark numbers on each slide</div></div>
                  <Toggle on={showNums} set={setShowNums} T={T} />
                </div>
              </div>
            )}

            {/* IDENTITY TAB */}
            {tab==="identity"&&(
              <div style={{display:"flex",flexDirection:"column",gap:18}}>
                {!businessType?(
                  <div style={{textAlign:"center",padding:"40px 0",color:T.muted}}>
                    <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>Select your business type first</div>
                    <div style={{fontSize:13}}>Go to Content tab → choose what you are</div>
                  </div>
                ):(
                  <>
                    <div style={{color:T.muted,fontSize:13,lineHeight:1.7}}>Answer these and we'll build your AI voice profile — what the AI reads before writing every slide.</div>
                    {questions&&questions.map(q=>(
                      <div key={q.key}>
                        <label style={{...lbl,color:T.muted,letterSpacing:0.5,fontSize:11,textTransform:"none",fontWeight:600}}>{q.label}</label>
                        <textarea value={brandAnswers[q.key]||""} onChange={e=>setBrandAnswers(p=>({...p,[q.key]:e.target.value}))} placeholder={q.ph} rows={2} style={{...inp,resize:"vertical",lineHeight:1.6}} />
                      </div>
                    ))}
                    <button onClick={buildVoice} disabled={genVoice} style={{background:T.accent,border:"none",color:T.accentText,padding:"11px 22px",borderRadius:8,fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:10,width:"fit-content"}}>
                      {genVoice?<><Spin c={T.accentText}/>Building...</>:"Build My Voice Profile →"}
                    </button>
                    {voiceProfile&&(
                      <div>
                        <label style={lbl}>Your voice profile</label>
                        <textarea value={voiceProfile} onChange={e=>setVoiceProfile(e.target.value)} rows={7} style={{...inp,resize:"vertical",lineHeight:1.7}} />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* PROFILE TAB */}
            {tab==="profile"&&(
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div onClick={()=>profileRef.current?.click()} style={{width:68,height:68,borderRadius:"50%",border:`2px solid ${T.accent}`,overflow:"hidden",background:T.surface2,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                    {profileDataUrl?<img src={profileDataUrl} style={{width:"100%",height:"100%",objectFit:"cover"}} />:<span style={{color:T.accent,fontSize:20,fontWeight:700}}>+</span>}
                  </div>
                  <div onClick={()=>profileRef.current?.click()} style={{flex:1,background:T.surface2,border:`1px dashed ${T.border}`,borderRadius:8,padding:13,cursor:"pointer",textAlign:"center"}}>
                    <div style={{color:T.muted,fontSize:13,fontWeight:500}}>{profileDataUrl?"Click to change photo":"Upload profile photo (square works best)"}</div>
                  </div>
                  <input ref={profileRef} type="file" accept="image/*" onChange={e=>handleImg(e,setProfileDataUrl)} style={{display:"none"}} />
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div><label style={lbl}>Display Name</label><input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name or brand" style={inp} /></div>
                  <div><label style={lbl}>Handle</label><input value={handle} onChange={e=>setHandle(e.target.value)} placeholder="@yourhandle" style={inp} /></div>
                </div>
                <div onClick={()=>setBlueTick(!blueTick)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"11px 14px",cursor:"pointer"}}>
                  <div><div style={{fontWeight:700,fontSize:13}}>Blue Tick</div><div style={{color:T.muted,fontSize:11,marginTop:2}}>Show verified badge on slides</div></div>
                  <Toggle on={blueTick} set={setBlueTick} T={T} />
                </div>
                <div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:showWebsite?10:0}}>
                    <div onClick={()=>setShowWebsite(!showWebsite)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",flex:1,cursor:"pointer"}}>
                      <div><div style={{fontWeight:700,fontSize:13}}>Website on Slides</div><div style={{color:T.muted,fontSize:11,marginTop:2}}>Show your URL at bottom of every slide</div></div>
                      <Toggle on={showWebsite} set={setShowWebsite} T={T} />
                    </div>
                  </div>
                  {showWebsite&&<input value={websiteUrl} onChange={e=>setWebsiteUrl(e.target.value)} placeholder="e.g. www.buildwithtav.co" style={inp} />}
                </div>
                {/* Preview */}
                <div style={{background:"#0a0a0a",borderRadius:10,border:`1px solid ${T.border}`,padding:"14px 18px",display:"flex",alignItems:"center",gap:13,marginTop:4}}>
                  <div style={{width:44,height:44,borderRadius:"50%",border:"2px solid #C9A84C",overflow:"hidden",background:"#1a1a1a",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {profileDataUrl?<img src={profileDataUrl} style={{width:"100%",height:"100%",objectFit:"cover"}} />:<span style={{color:"#C9A84C",fontSize:16,fontWeight:700}}>?</span>}
                  </div>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontWeight:700,fontSize:14,color:"#fff"}}>{displayName||"Your Name"}</span>
                      {blueTick&&<div style={{width:16,height:16,borderRadius:"50%",background:"#1D9BF0",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:9,fontWeight:700}}>✓</span></div>}
                    </div>
                    <div style={{color:"#555",fontSize:11,marginTop:2}}>{handle||"@yourhandle"}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* GENERATING */}
        {step==="generating"&&(
          <div style={{textAlign:"center",padding:"90px 0",animation:"fi 0.35s ease"}}>
            <div style={{marginBottom:18}}><Spin c={T.accent} /></div>
            <div style={{color:T.accent,fontSize:9,letterSpacing:4,marginBottom:8,textTransform:"uppercase",fontWeight:700}}>Researching & Writing</div>
            <div style={{fontSize:19,fontWeight:800,marginBottom:6}}>Building your carousel</div>
            <div style={{color:T.muted,fontSize:13}}>Pulling real data, crafting {slideCount} slides in your voice...</div>
          </div>
        )}

        {/* PREVIEW */}
        {step==="preview"&&editing.length>0&&(
          <div style={{animation:"fi 0.35s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
              <span style={{color:T.muted,fontSize:12,fontWeight:600}}>Format:</span>
              {[["square","Square 1:1"],["portrait","Stories 9:16"]].map(([id,label])=>(
                <button key={id} onClick={()=>setRatio(id)} style={{background:ratio===id?T.accent:T.surface2,border:`1px solid ${ratio===id?T.accent:T.border}`,color:ratio===id?T.accentText:T.muted,padding:"5px 13px",borderRadius:6,fontSize:12,fontWeight:700}}>{label}</button>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:24}}>
              {/* Slide grid */}
              <div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                  {editing.map((slide,i)=>(
                    <div key={i} onClick={()=>setActive(i)} style={{aspectRatio:ratio==="portrait"?"9/16":"1/1",borderRadius:8,overflow:"hidden",cursor:"pointer",border:`2px solid ${active===i?T.accent:"transparent"}`,transition:"border-color 0.15s",position:"relative"}}>
                      {fontsLoaded&&<SlideCanvas slide={slide} idx={i} total={editing.length} opts={canvasOpts(i)} />}
                      <div style={{position:"absolute",bottom:4,right:4,fontSize:10,color:"rgba(255,255,255,0.7)",background:"rgba(0,0,0,0.55)",padding:"1px 5px",borderRadius:3,fontWeight:600}}>{i+1}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>dlSlide(active)} style={{flex:1,background:T.surface2,border:`1px solid ${T.border}`,color:T.text,padding:"10px",borderRadius:8,fontSize:13,fontWeight:600}}>↓ Slide {active+1}</button>
                  <button onClick={dlAllSlides} disabled={dlAll} style={{flex:2,background:T.accent,border:"none",color:T.accentText,padding:"10px",borderRadius:8,fontSize:13,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {dlAll?<><Spin c={T.accentText}/>Downloading...</>:`↓ Download All ${editing.length}`}
                  </button>
                </div>
              </div>

              {/* Editor */}
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div style={{color:T.muted,fontSize:9,letterSpacing:2.5,textTransform:"uppercase",fontWeight:700}}>Edit Slide {active+1}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {editing.map((_,i)=>(
                    <button key={i} onClick={()=>setActive(i)} style={{width:26,height:26,borderRadius:5,background:active===i?T.accent:T.surface2,border:`1px solid ${active===i?T.accent:T.border}`,color:active===i?T.accentText:T.muted,fontSize:11,fontWeight:700}}>{i+1}</button>
                  ))}
                </div>

                <div><label style={lbl}>Slide Title</label><input value={editing[active]?.tag||""} onChange={e=>updateSlide(active,"tag",e.target.value)} style={inp} /></div>
                <div><label style={lbl}>Headline</label><textarea value={editing[active]?.headline||""} onChange={e=>updateSlide(active,"headline",e.target.value)} rows={3} style={{...inp,resize:"vertical",lineHeight:1.5}} /></div>
                <div><label style={lbl}>Body</label><textarea value={editing[active]?.body||""} onChange={e=>updateSlide(active,"body",e.target.value)} rows={3} style={{...inp,resize:"vertical",lineHeight:1.6}} /></div>
                <div><label style={lbl}>CTA <span style={{color:T.muted,letterSpacing:0,fontSize:9,fontWeight:500}}>(last slide)</span></label><input value={editing[active]?.cta||""} onChange={e=>updateSlide(active,"cta",e.target.value||null)} placeholder="e.g. Free preview → bio" style={inp} /></div>

                {treatment==="dim"&&<div><label style={lbl}>Opacity — {imgOpacity}%</label><input type="range" min={5} max={55} value={imgOpacity} onChange={e=>setImgOpacity(+e.target.value)} /></div>}
                {treatment==="gradient"&&<div><label style={lbl}>Overlay — {overlayDark}%</label><input type="range" min={20} max={80} value={overlayDark} onChange={e=>setOverlayDark(+e.target.value)} /></div>}

                <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12}}>
                  <label style={lbl}>AI Rewrite</label>
                  <textarea value={slidePrompt} onChange={e=>setSlidePrompt(e.target.value)} placeholder={`"More aggressive"\n"Add a UK housing stat"\n"Warmer and more personal"`} rows={3} style={{...inp,resize:"vertical",lineHeight:1.5,marginBottom:8}} />
                  <button onClick={regenSlide} disabled={regenLoading||!slidePrompt.trim()} style={{background:slidePrompt.trim()?T.accent:T.surface2,border:"none",color:slidePrompt.trim()?T.accentText:T.muted,padding:"9px",borderRadius:7,fontWeight:700,fontSize:13,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {regenLoading?<><Spin c={T.accentText}/>Rewriting...</>:"Rewrite This Slide →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{borderTop:`1px solid ${T.border}`,padding:"14px 28px",textAlign:"center",marginTop:40}}>
        <span style={{color:T.muted,fontSize:12}}>
          Created by <a href="https://www.buildwithtav.co" target="_blank" rel="noopener noreferrer" style={{color:T.accent,fontWeight:700}}>Build with Tav</a> · <a href="https://www.buildwithtav.co" target="_blank" rel="noopener noreferrer" style={{color:T.muted}}>buildwithtav.co</a>
        </span>
      </div>
    </div>
  );
}
