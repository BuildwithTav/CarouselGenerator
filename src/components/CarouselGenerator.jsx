import { useState, useRef, useEffect, useCallback } from "react";

// ─── FONTS ───────────────────────────────────────────────

const FONTS = [
  { id:"playfair",    label:"Playfair Display",   headline:"Playfair Display",    body:"Playfair Display" },
  { id:"montserrat",  label:"Montserrat",          headline:"Montserrat",          body:"Montserrat" },
  { id:"cormorant",   label:"Cormorant Garamond",  headline:"Cormorant Garamond",  body:"Cormorant Garamond" },
  { id:"jakarta",     label:"Plus Jakarta Sans",   headline:"Plus Jakarta Sans",   body:"Plus Jakarta Sans" },
  { id:"dm",          label:"DM Serif Display",    headline:"DM Serif Display",    body:"DM Serif Display" },
  { id:"bebas",       label:"Bebas Neue",          headline:"Bebas Neue",          body:"Plus Jakarta Sans" },
  { id:"inter",       label:"Inter",               headline:"Inter",               body:"Inter" },
  { id:"lato",        label:"Lato",                headline:"Lato",                body:"Lato" },
  { id:"oswald",      label:"Oswald",              headline:"Oswald",              body:"Lato" },
  { id:"baskerville", label:"Libre Baskerville",   headline:"Libre Baskerville",   body:"Libre Baskerville" },
  { id:"poppins",     label:"Poppins",             headline:"Poppins",             body:"Poppins" },
];

async function loadFonts() {
  const urls = [
    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Montserrat:wght@700;900&family=Cormorant+Garamond:wght@700&family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Serif+Display&family=Bebas+Neue&family=Inter:wght@700;800;900&family=Lato:wght@700;900&family=Oswald:wght@600;700&family=Libre+Baskerville:wght@700&family=Poppins:wght@700;800;900&display=swap"
  ];
  for (const url of urls) {
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = url;
    document.head.appendChild(link);
  }
  await new Promise(r => setTimeout(r, 1200));
  await document.fonts.ready;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  for (const f of FONTS) {
    ctx.font = `bold 40px "${f.headline}"`;
    ctx.fillText("Ag", 0, 40);
  }
}

// ─── THEME ───────────────────────────────────────────────

const APP_THEMES = {
  light: { bg:"#F7F5F1", surface:"#FFFFFF", surface2:"#EEECEA", border:"#E0DDD8", text:"#1A1A1A", muted:"#999", accent:"#1A1A1A", accentText:"#FFF", inputBg:"#FFF", tag:"#1A1A1A" },
  dark:  { bg:"#080808", surface:"#111", surface2:"#181818", border:"#222", text:"#F0EDE6", muted:"#555", accent:"#C9A84C", accentText:"#000", inputBg:"#111", tag:"#C9A84C" },
};

// ─── SLIDE THEMES ────────────────────────────────────────

const SLIDE_THEMES = [
  { id:"dark-gold",  label:"Dark Gold",     preview:["#0A0A0A","#C9A84C"], desc:"Dark with gold accents" },
  { id:"midnight",   label:"Midnight",      preview:["#0D1117","#7C9EFF"], desc:"Deep blue, cool accents" },
  { id:"editorial",  label:"Editorial",     preview:["#F8F6F2","#1A1A1A"], desc:"High contrast white" },
  { id:"warm",       label:"Warm Cream",    preview:["#F2EDE4","#8B4513"], desc:"Warm, organic feel" },
  { id:"slate",      label:"Slate",         preview:["#1C2333","#D4B896"], desc:"Cool dark, warm type" },
  { id:"noir",       label:"Noir",          preview:["#050505","#FFFFFF"], desc:"Pure black and white" },
  { id:"forest",     label:"Forest",        preview:["#1A2E1A","#7DBE7D"], desc:"Deep green, nature tone" },
  { id:"rose",       label:"Rose",          preview:["#FDF4F4","#C0636A"], desc:"Soft pink, lifestyle feel" },
  { id:"navy",       label:"Navy",          preview:["#0A1628","#E8C97A"], desc:"Deep navy, gold type" },
  { id:"custom",     label:"Custom",        preview:["#333","#C9A84C"], desc:"Pick your own colours" },
];

const FONT_OPTIONS = [
  { id:"playfair",    label:"Playfair",    sample:"Elegant Serif" },
  { id:"cormorant",   label:"Cormorant",   sample:"Luxury Serif" },
  { id:"dm",          label:"DM Serif",    sample:"Editorial Serif" },
  { id:"baskerville", label:"Baskerville", sample:"Classic Serif" },
  { id:"montserrat",  label:"Montserrat",  sample:"Clean Sans" },
  { id:"jakarta",     label:"Jakarta",     sample:"Modern Sans" },
  { id:"poppins",     label:"Poppins",     sample:"Social Media" },
  { id:"inter",       label:"Inter",       sample:"Plain & Neutral" },
  { id:"lato",        label:"Lato",        sample:"Friendly Plain" },
  { id:"oswald",      label:"Oswald",      sample:"Condensed Bold" },
  { id:"bebas",       label:"Bebas",       sample:"Impact Display" },
];

const IMAGE_TREATMENTS = [
  { id:"gradient", label:"Gradient",  desc:"Full image, dark fade" },
  { id:"dim",      label:"Dimmed",    desc:"Subtle bg texture" },
  { id:"split",    label:"Split",     desc:"Image left, text right" },
  { id:"none",     label:"Text Only", desc:"No image" },
];

// ─── BUSINESS TYPES ──────────────────────────────────────

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
  creator:    [
    { key:"what",   label:"What do you create content about?", ph:"e.g. Personal finance tips for people in their 30s" },
    { key:"who",    label:"Who is your audience?", ph:"e.g. Young professionals feeling stuck in the rat race" },
    { key:"unique", label:"What makes your perspective unique?", ph:"e.g. I went from £0 to financial freedom by 35 — I share everything" },
    { key:"avoid",  label:"What do you never want to sound like?", ph:"e.g. Fake guru, overpromising, generic motivation" },
    { key:"cta",    label:"What do you want people to do?", ph:"e.g. Follow me, click my bio link, DM me 'start'" },
  ],
  marketer:   [
    { key:"what",   label:"What service do you offer?", ph:"e.g. I help small businesses get more clients through organic social media" },
    { key:"who",    label:"Who do you work with?", ph:"e.g. Small business owners who are overwhelmed by marketing" },
    { key:"unique", label:"What makes your approach different?", ph:"e.g. No paid ads — I only use organic strategies that actually work" },
    { key:"avoid",  label:"What do you never want to sound like?", ph:"e.g. Salesy, corporate, full of jargon" },
    { key:"cta",    label:"What do you want people to do?", ph:"e.g. Book a free discovery call, visit my website" },
  ],
  coach:      [
    { key:"what",   label:"What do you coach or consult on?", ph:"e.g. I help burnt-out professionals find a career they actually love" },
    { key:"who",    label:"Who are your clients?", ph:"e.g. High-achievers in their 30s-40s who feel unfulfilled despite success" },
    { key:"unique", label:"What's your method or story?", ph:"e.g. I left a six-figure job at 38 — I know exactly what it takes" },
    { key:"avoid",  label:"What tone do you want to avoid?", ph:"e.g. Preachy, overly spiritual, or overly corporate" },
    { key:"cta",    label:"What's your call to action?", ph:"e.g. Book a free clarity call, download my free guide" },
  ],
  restaurant: [
    { key:"what",   label:"What's your restaurant called and what do you serve?", ph:"e.g. Tavolino — authentic Italian in central Manchester" },
    { key:"who",    label:"Who are your typical customers?", ph:"e.g. Date night couples, local families, Friday lunch crowd" },
    { key:"unique", label:"What makes dining with you special?", ph:"e.g. Everything is made fresh daily, we import our pasta from Naples" },
    { key:"avoid",  label:"What tone doesn't suit your brand?", ph:"e.g. Overly formal, or too casual and cheap-feeling" },
    { key:"cta",    label:"What do you want people to do?", ph:"e.g. Book a table, visit us this weekend, order via our website" },
  ],
  gym:        [
    { key:"what",   label:"What's your gym or studio called and what do you offer?", ph:"e.g. Iron House — strength and conditioning gym in Leeds" },
    { key:"who",    label:"Who are your members?", ph:"e.g. Working adults who want real results without fads" },
    { key:"unique", label:"What makes your gym different?", ph:"e.g. No mirrors, no egos — just hard work and a real community" },
    { key:"avoid",  label:"What do you never want to sound like?", ph:"e.g. Bootcamp bro culture, or corporate gym chain vibes" },
    { key:"cta",    label:"What do you want people to do?", ph:"e.g. Book a free trial class, visit us, DM for membership" },
  ],
  retail:     [
    { key:"what",   label:"What do you sell and where?", ph:"e.g. Independent bookshop in Bristol — new and secondhand books" },
    { key:"who",    label:"Who are your customers?", ph:"e.g. Local book lovers, students, gift buyers" },
    { key:"unique", label:"What makes your shop special?", ph:"e.g. Handpicked recommendations, community events, cosy atmosphere" },
    { key:"avoid",  label:"What tone doesn't fit you?", ph:"e.g. Overly corporate, or too quirky and niche" },
    { key:"cta",    label:"What do you want people to do?", ph:"e.g. Visit us in store, shop online, follow for new arrivals" },
  ],
  ecommerce:  [
    { key:"what",   label:"What do you sell?", ph:"e.g. Sustainable activewear made from recycled materials" },
    { key:"who",    label:"Who buys from you?", ph:"e.g. Women 25-40 who care about both performance and ethics" },
    { key:"unique", label:"What makes your products different?", ph:"e.g. Every item is carbon neutral and lasts 3x longer than fast fashion" },
    { key:"avoid",  label:"What do you never want to sound like?", ph:"e.g. Preachy, greenwashing, or overly salesy" },
    { key:"cta",    label:"What do you want people to do?", ph:"e.g. Shop the new collection, use code SOCIAL for 15% off" },
  ],
  salon:      [
    { key:"what",   label:"What's your salon called and what do you specialise in?", ph:"e.g. Lumière — colour specialists in West London" },
    { key:"who",    label:"Who are your clients?", ph:"e.g. Professional women who want quality results and a relaxed experience" },
    { key:"unique", label:"What makes your salon stand out?", ph:"e.g. We use only low-damage techniques — healthy hair is our priority" },
    { key:"avoid",  label:"What tone doesn't suit your brand?", ph:"e.g. Too girly and pink, or cold and clinical" },
    { key:"cta",    label:"What do you want people to do?", ph:"e.g. Book online, DM us, call to check availability" },
  ],
  corporate:  [
    { key:"what",   label:"What does your company do?", ph:"e.g. We help mid-size businesses reduce operational costs through AI" },
    { key:"who",    label:"Who are your clients?", ph:"e.g. Operations directors and CFOs at companies with 50-500 employees" },
    { key:"unique", label:"What's your competitive edge?", ph:"e.g. We implement in 30 days, not 6 months — no disruption" },
    { key:"avoid",  label:"What tone do you want to avoid?", ph:"e.g. Overly technical, startup-buzzword heavy, or too casual" },
    { key:"cta",    label:"What do you want prospects to do?", ph:"e.g. Book a discovery call, download our case study" },
  ],
  personal:   [
    { key:"what",   label:"What is your page about?", ph:"e.g. Documenting my journey moving from London to rural France" },
    { key:"who",    label:"Who do you want to connect with?", ph:"e.g. People who dream of a slower, simpler life" },
    { key:"unique", label:"What's your story or angle?", ph:"e.g. I swapped a City salary for a farmhouse renovation — and I have no regrets" },
    { key:"avoid",  label:"What do you never want to sound like?", ph:"e.g. Showing off, or too perfectly curated" },
    { key:"cta",    label:"What do you want people to do?", ph:"e.g. Follow along, save this, share with someone who needs it" },
  ],
  other:      [
    { key:"what",   label:"What do you do or offer?", ph:"e.g. Describe what your brand, business or page is about" },
    { key:"who",    label:"Who is your audience?", ph:"e.g. Who are you trying to reach?" },
    { key:"unique", label:"What makes you different?", ph:"e.g. What's your angle, story or unique selling point?" },
    { key:"avoid",  label:"What do you never want to sound like?", ph:"e.g. Any tone or style that doesn't fit your brand" },
    { key:"cta",    label:"What do you want people to do?", ph:"e.g. What action should people take after seeing your content?" },
  ],
};

const TONE_OPTIONS = [
  { id:"ai",           label:"Tav Decides",   desc:"Best tone for your topic" },
  { id:"real",         label:"Calm & Real",   desc:"Honest, grounded" },
  { id:"bold",         label:"Bold & Direct", desc:"Punchy, confident" },
  { id:"educational",  label:"Educational",   desc:"Clear, informative" },
  { id:"inspirational",label:"Inspirational", desc:"Motivating" },
  { id:"provocative",  label:"Provocative",   desc:"Pattern-interrupt" },
];

const HOOK_STYLES = [
  { id:"ai",        label:"Tav Decides",    desc:"Best hook for your topic" },
  { id:"stat",      label:"Data-Led",       desc:"Shocking stat or number" },
  { id:"question",  label:"Question",       desc:"Challenges assumptions" },
  { id:"statement", label:"Bold Statement", desc:"Strong position" },
  { id:"story",     label:"Story",          desc:"Opens mid-scene" },
];

const GOALS = [
  { id:"ai",         label:"Tav Decides" },
  { id:"grow",       label:"Grow Audience" },
  { id:"sell",       label:"Drive Sales" },
  { id:"trust",      label:"Build Trust" },
  { id:"educate",    label:"Educate" },
  { id:"engagement", label:"Engagement" },
];

const STORAGE_KEY = "bwt_cg_v1";

// ─── CANVAS UTILS ─────────────────────────────────────────

function getColors(theme, customBg, customAccent) {
  const map = {
    "dark-gold": { bg:"#0A0A0A", text:"#F0EDE6", accent:"#C9A84C", sub:"rgba(240,237,230,0.7)", dark:true },
    "midnight":  { bg:"#0D1117", text:"#E8EAF2", accent:"#7C9EFF", sub:"rgba(232,234,242,0.65)", dark:true },
    "editorial": { bg:"#F8F6F2", text:"#0A0A0A", accent:"#0A0A0A", sub:"rgba(10,10,10,0.58)", dark:false },
    "warm":      { bg:"#F2EDE4", text:"#2A1F14", accent:"#8B4513", sub:"rgba(42,31,20,0.6)", dark:false },
    "slate":     { bg:"#1C2333", text:"#E8D5B0", accent:"#D4B896", sub:"rgba(232,213,176,0.65)", dark:true },
    "noir":      { bg:"#050505", text:"#FFFFFF", accent:"#FFFFFF", sub:"rgba(255,255,255,0.65)", dark:true },
    "forest":    { bg:"#1A2E1A", text:"#E8F5E8", accent:"#7DBE7D", sub:"rgba(232,245,232,0.68)", dark:true },
    "rose":      { bg:"#FDF4F4", text:"#2D1A1A", accent:"#C0636A", sub:"rgba(45,26,26,0.58)", dark:false },
    "navy":      { bg:"#0A1628", text:"#F0EAD6", accent:"#E8C97A", sub:"rgba(240,234,214,0.68)", dark:true },
    "custom":    { bg:customBg||"#0A0A0A", text:"#FFFFFF", accent:customAccent||"#C9A84C", sub:"rgba(255,255,255,0.7)", dark:true },
  };
  return map[theme] || map["dark-gold"];
}

function noise(ctx, W, H, a=0.03) {
  ctx.save(); ctx.globalAlpha=a;
  for (let i=0;i<10000;i++) {
    const v=Math.random()>0.5?255:0;
    ctx.fillStyle=`rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random()*W,Math.random()*H,1,1);
  }
  ctx.restore();
}

function wrap(ctx, text, maxW) {
  const words=text.split(" "); const lines=[]; let line="";
  for (const w of words) {
    const t=line?line+" "+w:w;
    if (ctx.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t;
  }
  if(line)lines.push(line); return lines;
}

function drawSlide(ctx, W, H, slide, idx, total, opts) {
  const {theme,fontId,bgImg,treatment,imgOpacity,overlayDark,showNums,profileImg,name,handle,blueTick,websiteUrl,customBg,customAccent} = opts;
  const C=getColors(theme,customBg,customAccent);
  const F=FONTS.find(f=>f.id===fontId)||FONTS[0];
  const HF=`"${F.headline}"`;
  const BF=`"${F.body}"`;

  // Base background
  ctx.fillStyle=C.bg; ctx.fillRect(0,0,W,H);

  // Background image
  if (bgImg&&treatment!=="none") {
    if (treatment==="split") {
      const iw=Math.floor(W*0.42);
      ctx.save(); ctx.beginPath(); ctx.rect(0,0,iw,H); ctx.clip();
      const sc=Math.max(iw/bgImg.width,H/bgImg.height);
      ctx.drawImage(bgImg,(iw-bgImg.width*sc)/2,(H-bgImg.height*sc)/2,bgImg.width*sc,bgImg.height*sc);
      ctx.restore(); ctx.save();
      const eg=ctx.createLinearGradient(iw-160,0,iw,0);
      eg.addColorStop(0,"rgba(0,0,0,0)"); eg.addColorStop(1,C.bg);
      ctx.fillStyle=eg; ctx.fillRect(iw-160,0,160,H); ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha=treatment==="dim"?imgOpacity/100:1;
      const sc=Math.max(W/bgImg.width,H/bgImg.height);
      ctx.drawImage(bgImg,(W-bgImg.width*sc)/2,(H-bgImg.height*sc)/2,bgImg.width*sc,bgImg.height*sc);
      ctx.restore();
      if (treatment==="gradient") {
        const d=overlayDark/100;
        const g=ctx.createLinearGradient(0,0,0,H);
        g.addColorStop(0,`rgba(0,0,0,${d*0.92})`); g.addColorStop(0.4,`rgba(0,0,0,${d*0.44})`); g.addColorStop(1,`rgba(0,0,0,${d*0.97})`);
        ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      }
    }
  }

  // ── THEME DESIGN ELEMENTS ──
  if (theme==="dark-gold") {
    const vig=ctx.createRadialGradient(W/2,H/2,W*0.25,W/2,H/2,W*0.78);
    vig.addColorStop(0,"rgba(0,0,0,0)"); vig.addColorStop(1,"rgba(0,0,0,0.5)");
    ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);
    noise(ctx,W,H,0.026);
    const b=56; ctx.strokeStyle=C.accent; ctx.lineWidth=2.5;
    [[b,44,44,44,44,b],[W-b,44,W-44,44,W-44,b],[b,H-44,44,H-44,44,H-b],[W-b,H-44,W-44,H-44,W-44,H-b]]
      .forEach(([x1,y1,x2,y2,x3,y3])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.stroke();});
    const tg=ctx.createLinearGradient(0,0,0,H*0.4);
    tg.addColorStop(0,"rgba(201,168,76,0.06)"); tg.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=tg; ctx.fillRect(0,0,W,H*0.4);
  }
  if (theme==="midnight") {
    noise(ctx,W,H,0.02);
    const gl=ctx.createRadialGradient(W*0.75,H*0.18,0,W*0.75,H*0.18,W*0.62);
    gl.addColorStop(0,"rgba(124,158,255,0.13)"); gl.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=gl; ctx.fillRect(0,0,W,H);
    ctx.save(); ctx.globalAlpha=0.55;
    for(let i=0;i<55;i++){const sx=Math.random()*W,sy=Math.random()*H*0.48,sr=Math.random()*1.6+0.2;ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${Math.random()*0.5+0.2})`;ctx.fill();}
    ctx.restore();
    const bg2=ctx.createLinearGradient(0,H*0.62,0,H);
    bg2.addColorStop(0,"rgba(13,17,23,0)"); bg2.addColorStop(1,"rgba(13,17,23,0.65)");
    ctx.fillStyle=bg2; ctx.fillRect(0,H*0.62,W,H*0.38);
  }
  if (theme==="editorial") {
    ctx.fillStyle=C.accent; ctx.fillRect(60,56,100,2.5);
    ctx.save(); ctx.globalAlpha=0.18; ctx.fillStyle=C.accent; ctx.fillRect(60,H-56,W-120,1); ctx.restore();
    ctx.save(); ctx.globalAlpha=0.035;
    for(let x=80;x<W-80;x+=44)for(let y=200;y<H-100;y+=44){ctx.fillStyle="#000";ctx.beginPath();ctx.arc(x,y,1.4,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  if (theme==="warm") {
    noise(ctx,W,H,0.016);
    const wg=ctx.createLinearGradient(0,0,W,H);
    wg.addColorStop(0,"rgba(210,160,100,0.07)"); wg.addColorStop(1,"rgba(139,69,19,0.03)");
    ctx.fillStyle=wg; ctx.fillRect(0,0,W,H);
    ctx.save(); ctx.globalAlpha=0.2; ctx.fillStyle=C.accent; ctx.fillRect(52,130,2.5,H-260); ctx.restore();
  }
  if (theme==="slate") {
    noise(ctx,W,H,0.02);
    const sg=ctx.createRadialGradient(W*0.18,0,0,W*0.18,0,W*0.8);
    sg.addColorStop(0,"rgba(212,184,150,0.1)"); sg.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=sg; ctx.fillRect(0,0,W,H);
    const sbg=ctx.createLinearGradient(0,H*0.65,0,H);
    sbg.addColorStop(0,"rgba(28,35,51,0)"); sbg.addColorStop(1,"rgba(28,35,51,0.62)");
    ctx.fillStyle=sbg; ctx.fillRect(0,H*0.65,W,H*0.35);
  }
  if (theme==="noir") {
    noise(ctx,W,H,0.038);
    ctx.save(); ctx.strokeStyle="rgba(255,255,255,0.1)"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(60,H-90); ctx.lineTo(W-60,H-90); ctx.stroke(); ctx.restore();
  }
  if (theme==="forest") {
    noise(ctx,W,H,0.022);
    const fg=ctx.createRadialGradient(W*0.8,H*0.15,0,W*0.8,H*0.15,W*0.7);
    fg.addColorStop(0,"rgba(125,190,125,0.12)"); fg.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=fg; ctx.fillRect(0,0,W,H);
    const fbg=ctx.createLinearGradient(0,H*0.6,0,H);
    fbg.addColorStop(0,"rgba(26,46,26,0)"); fbg.addColorStop(1,"rgba(26,46,26,0.7)");
    ctx.fillStyle=fbg; ctx.fillRect(0,H*0.6,W,H*0.4);
    // Side accent
    ctx.save(); ctx.globalAlpha=0.18; ctx.fillStyle=C.accent; ctx.fillRect(52,130,2,H-260); ctx.restore();
  }
  if (theme==="rose") {
    noise(ctx,W,H,0.012);
    const rg=ctx.createLinearGradient(0,0,W,H);
    rg.addColorStop(0,"rgba(220,140,145,0.08)"); rg.addColorStop(1,"rgba(192,99,106,0.04)");
    ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
    // Decorative top rule
    ctx.fillStyle=C.accent; ctx.globalAlpha=0.4; ctx.fillRect(60,56,90,2); ctx.globalAlpha=1;
    // Soft bottom fade
    const rbg=ctx.createLinearGradient(0,H*0.75,0,H);
    rbg.addColorStop(0,"rgba(242,228,228,0)"); rbg.addColorStop(1,"rgba(242,228,228,0.35)");
    ctx.fillStyle=rbg; ctx.fillRect(0,H*0.75,W,H*0.25);
  }
  if (theme==="navy") {
    noise(ctx,W,H,0.024);
    const ng=ctx.createRadialGradient(W*0.2,H*0.1,0,W*0.2,H*0.1,W*0.75);
    ng.addColorStop(0,"rgba(232,201,122,0.1)"); ng.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=ng; ctx.fillRect(0,0,W,H);
    // Corner brackets — navy edition
    const b=56; ctx.strokeStyle=C.accent; ctx.lineWidth=2; ctx.globalAlpha=0.45;
    [[b,44,44,44,44,b],[W-b,44,W-44,44,W-44,b],[b,H-44,44,H-44,44,H-b],[W-b,H-44,W-44,H-44,W-44,H-b]]
      .forEach(([x1,y1,x2,y2,x3,y3])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.stroke();});
    ctx.globalAlpha=1;
    const nbg=ctx.createLinearGradient(0,H*0.65,0,H);
    nbg.addColorStop(0,"rgba(10,22,40,0)"); nbg.addColorStop(1,"rgba(10,22,40,0.6)");
    ctx.fillStyle=nbg; ctx.fillRect(0,H*0.65,W,H*0.35);
  }
  if (theme==="custom") {
    // Minimal: subtle vignette + noise
    noise(ctx,W,H,0.022);
    const cvg=ctx.createRadialGradient(W/2,H/2,W*0.28,W/2,H/2,W*0.75);
    cvg.addColorStop(0,"rgba(0,0,0,0)"); cvg.addColorStop(1,"rgba(0,0,0,0.38)");
    ctx.fillStyle=cvg; ctx.fillRect(0,0,W,H);
  }

  // ── PROFILE BADGE — inset from edges with shadow ──
  const avR=46, avPad=80, avY=avPad+avR+20, avX=avPad+avR;

  // Shadow behind entire badge area — adapts to light/dark theme
  ctx.save();
  ctx.shadowColor=C.dark?"rgba(0,0,0,0.7)":"rgba(0,0,0,0.22)";
  ctx.shadowBlur=C.dark?28:18;
  ctx.shadowOffsetX=0; ctx.shadowOffsetY=C.dark?4:3;

  // Avatar clip + draw
  ctx.beginPath(); ctx.arc(avX,avY,avR,0,Math.PI*2); ctx.clip();
  if (profileImg) {
    const sc=Math.max(avR*2/profileImg.width,avR*2/profileImg.height);
    ctx.drawImage(profileImg,avX-avR-(profileImg.width*sc-avR*2)/2,avY-avR-(profileImg.height*sc-avR*2)/2,profileImg.width*sc,profileImg.height*sc);
  } else {
    ctx.fillStyle=C.accent; ctx.fillRect(avX-avR,avY-avR,avR*2,avR*2);
    ctx.restore(); ctx.save();
    ctx.fillStyle=C.dark?"#000":"#fff"; ctx.font=`bold ${avR}px ${HF}`;
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText((name||"?")[0].toUpperCase(),avX,avY);
    ctx.textBaseline="alphabetic";
  }
  ctx.restore();

  // Avatar ring
  ctx.save();
  ctx.shadowColor=C.dark?"rgba(0,0,0,0.5)":"rgba(0,0,0,0.15)";
  ctx.shadowBlur=12;
  ctx.strokeStyle=C.accent; ctx.lineWidth=3;
  ctx.beginPath(); ctx.arc(avX,avY,avR+3.5,0,Math.PI*2); ctx.stroke();
  ctx.restore();

  // Name — with text shadow for contrast on any background
  const nx=avX+avR+18;
  ctx.save();
  ctx.shadowColor=C.dark?"rgba(0,0,0,0.8)":"rgba(0,0,0,0.25)";
  ctx.shadowBlur=C.dark?12:8; ctx.shadowOffsetY=1;
  ctx.fillStyle=C.dark?"#FFFFFF":"#111111";
  ctx.font=`bold 30px ${HF}`; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  ctx.fillText(name||"Your Brand",nx,avY-5);
  ctx.restore();

  // Blue tick
  if (blueTick) {
    const nw=ctx.measureText(name||"Your Brand").width;
    ctx.save(); ctx.font=`bold 30px ${HF}`;
    const nw2=ctx.measureText(name||"Your Brand").width;
    ctx.restore();
    const tx=nx+nw2+10, ty=avY-27;
    ctx.fillStyle="#1D9BF0"; ctx.beginPath(); ctx.arc(tx+14,ty+14,14,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#fff"; ctx.lineWidth=2.5; ctx.lineCap="round"; ctx.lineJoin="round";
    ctx.beginPath(); ctx.moveTo(tx+6,ty+14); ctx.lineTo(tx+12,ty+20); ctx.lineTo(tx+22,ty+8); ctx.stroke();
  }

  // Handle — with shadow
  ctx.save();
  ctx.shadowColor=C.dark?"rgba(0,0,0,0.7)":"rgba(0,0,0,0.2)";
  ctx.shadowBlur=8;
  ctx.fillStyle=C.dark?"rgba(255,255,255,0.52)":"rgba(0,0,0,0.45)";
  ctx.font=`23px ${BF}`; ctx.textAlign="left";
  ctx.fillText(handle||"@yourhandle",nx,avY+22);
  ctx.restore();

  // Slide number — large editorial watermark in bottom right corner
  if (showNums) {
    ctx.save();
    const numStr = String(idx+1).padStart(2,"0");
    const numSize = Math.floor(H * 0.28);
    ctx.font=`bold ${numSize}px ${HF}`;
    ctx.fillStyle=C.dark?`rgba(255,255,255,0.04)`:`rgba(0,0,0,0.04)`;
    ctx.textAlign="right";
    ctx.textBaseline="bottom";
    ctx.fillText(numStr, W-50, H-40);
    ctx.textBaseline="alphabetic";
    // Small clean counter top right
    ctx.font=`500 18px ${BF}`;
    ctx.fillStyle=`${C.accent}99`;
    ctx.textAlign="right";
    ctx.fillText(`${idx+1} / ${total}`, W-68, 72);
    ctx.restore();
  }

  // ── MAIN CONTENT — smart vertical layout ──
  const cx = W/2;
  const hasWebsite = websiteUrl&&websiteUrl.trim();
  const hasCTA = slide.cta&&slide.cta.trim();

  // Calculate all content heights first
  const hl = slide.headline||"";
  const hSize = hl.length>55?54:hl.length>42?63:hl.length>30?74:hl.length>18?86:96;
  ctx.font=`bold ${hSize}px ${HF}`;
  const hlLines = wrap(ctx,hl,W-150);
  const hlH = hlLines.length*hSize*1.22;

  const bodySize = 32;
  ctx.font=`${bodySize}px ${BF}`;
  const bLines = slide.body ? wrap(ctx,slide.body,W-200) : [];
  const bodyH = bLines.length*50;

  const divH = 42+32; // divider gap above + space below
  const ctaH = hasCTA ? 80 : 0;
  const websiteH = hasWebsite ? 50 : 0;
  const totalContentH = hlH + divH + bodyH + ctaH;

  // Content zone: from below badge to above website footer
  const topBound = avY+avR+50;
  const botBound = H - (hasWebsite?80:50) - (hasCTA?0:0);
  const zoneH = botBound - topBound;

  // Centre the entire block vertically in the zone
  const blockStart = topBound + (zoneH - totalContentH) / 2;
  const safeStart = Math.max(topBound, blockStart);

  // Draw headline
  let hlY = safeStart + hSize;
  ctx.fillStyle=C.text; ctx.textAlign="center";
  ctx.font=`bold ${hSize}px ${HF}`;

  // Slide title — small label above headline
  if (slide.tag&&slide.tag.trim()) {
    const titleY = hlY - hSize - 28;
    ctx.save();
    ctx.font=`600 22px ${BF}`;
    const titleW=ctx.measureText(slide.tag.toUpperCase()).width+36;
    // Pill background
    ctx.fillStyle=C.dark?`rgba(255,255,255,0.09)`:`rgba(0,0,0,0.07)`;
    if(ctx.roundRect){ctx.roundRect(cx-titleW/2,titleY-20,titleW,34,17);}
    else{ctx.rect(cx-titleW/2,titleY-20,titleW,34);}
    ctx.fill();
    ctx.fillStyle=C.accent;
    ctx.textAlign="center";
    ctx.fillText(slide.tag.toUpperCase(),cx,titleY+4);
    ctx.restore();
    hlY = hlY - 10;
  }
  for(const line of hlLines){ctx.fillText(line,cx,hlY);hlY+=hSize*1.22;}
  const afterHL = hlY - hSize*1.22 + hSize*0.2;

  // Divider
  const divY = afterHL+36;
  ctx.save();
  if (theme==="editorial"||theme==="rose") {
    ctx.strokeStyle=C.accent; ctx.lineWidth=1; ctx.globalAlpha=0.5;
    ctx.beginPath(); ctx.moveTo(cx-92,divY); ctx.lineTo(cx-10,divY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+10,divY); ctx.lineTo(cx+92,divY); ctx.stroke();
    ctx.globalAlpha=1; ctx.fillStyle=C.accent;
    ctx.fillRect(cx-8,divY-6,16,12);
  } else if (theme==="noir") {
    ctx.strokeStyle=C.accent; ctx.lineWidth=1.5; ctx.globalAlpha=0.45;
    ctx.beginPath(); ctx.moveTo(cx-80,divY); ctx.lineTo(cx+80,divY); ctx.stroke();
    ctx.globalAlpha=1; ctx.fillStyle=C.accent;
    ctx.beginPath(); ctx.arc(cx,divY,5,0,Math.PI*2); ctx.fill();
  } else {
    ctx.strokeStyle=C.accent; ctx.lineWidth=1.5; ctx.globalAlpha=0.36;
    ctx.beginPath(); ctx.moveTo(cx-68,divY); ctx.lineTo(cx+68,divY); ctx.stroke();
    ctx.globalAlpha=0.75; ctx.fillStyle=C.accent;
    ctx.beginPath(); ctx.arc(cx-76,divY,3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+76,divY,3,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
  }
  ctx.restore();

  // Body text
  if (bLines.length>0) {
    ctx.fillStyle=C.sub; ctx.font=`${bodySize}px ${BF}`; ctx.textAlign="center";
    let by=divY+52;
    for(const line of bLines){ctx.fillText(line,cx,by);by+=50;}
  }

  // CTA — pinned to bottom zone
  if (hasCTA) {
    const ctaY=H-(hasWebsite?145:100);
    ctx.font=`bold 33px ${HF}`;
    const ctaW=ctx.measureText(slide.cta).width;
    ctx.save(); ctx.globalAlpha=0.13; ctx.fillStyle=C.accent;
    ctx.beginPath();
    if(ctx.roundRect){ctx.roundRect(cx-ctaW/2-28,ctaY-38,ctaW+56,54,27);}
    else{ctx.rect(cx-ctaW/2-28,ctaY-38,ctaW+56,54);}
    ctx.fill(); ctx.restore();
    ctx.save();
    ctx.shadowColor="rgba(0,0,0,0.3)"; ctx.shadowBlur=8;
    ctx.fillStyle=C.accent; ctx.textAlign="center"; ctx.fillText(slide.cta,cx,ctaY);
    ctx.restore();
  }

  // Website footer — pinned to very bottom
  if (hasWebsite) {
    const wy=H-36;
    ctx.save();
    ctx.shadowColor=C.dark?"rgba(0,0,0,0.6)":"rgba(0,0,0,0.15)"; ctx.shadowBlur=6;
    ctx.fillStyle=C.dark?"rgba(255,255,255,0.3)":"rgba(0,0,0,0.25)";
    ctx.font=`21px ${BF}`; ctx.textAlign="center";
    ctx.fillText(websiteUrl.trim(),cx,wy);
    ctx.restore();
  }
}

// ─── SLIDE CANVAS ─────────────────────────────────────────

function SlideCanvas({slide,idx,total,opts}) {
  const ref=useRef(null);
  const key=JSON.stringify({slide,idx,total,theme:opts.theme,fontId:opts.fontId,bgImageUrl:opts.bgImageUrl,treatment:opts.treatment,imgOpacity:opts.imgOpacity,overlayDark:opts.overlayDark,showNums:opts.showNums,name:opts.name,handle:opts.handle,blueTick:opts.blueTick,websiteUrl:opts.websiteUrl,ratio:opts.ratio});
  useEffect(()=>{
    const canvas=ref.current; if(!canvas||!slide)return;
    const isP=opts.ratio==="portrait"; const W=1080,H=isP?1920:1080;
    canvas.width=W; canvas.height=H;
    const ctx=canvas.getContext("2d");
    const load=src=>new Promise(r=>{if(!src)return r(null);const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src;});
    Promise.all([load(opts.bgImageUrl),load(opts.profileDataUrl)]).then(([bgImg,profileImg])=>{
      drawSlide(ctx,W,H,slide,idx,total,{...opts,bgImg,profileImg});
    });
  },[key]);
  const isP=opts.ratio==="portrait";
  return <canvas ref={ref} style={{width:"100%",aspectRatio:isP?"9/16":"1/1",display:"block",borderRadius:6}} />;
}

// ─── HELPERS ─────────────────────────────────────────────

function loadData(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");}catch{return null;}}
function saveData(d){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(d));}catch{}}
function Spin({c="#1A1A1A"}){return <div style={{width:16,height:16,borderRadius:"50%",border:`2px solid rgba(0,0,0,0.1)`,borderTop:`2px solid ${c}`,animation:"spin 0.7s linear infinite",display:"inline-block",flexShrink:0}} />;}
function Toggle({on,set,T}){return <div onClick={()=>set(!on)} style={{width:42,height:22,borderRadius:11,background:on?T.accent:T.border,position:"relative",cursor:"pointer",flexShrink:0,transition:"background 0.2s"}}><div style={{position:"absolute",top:2,left:on?22:2,width:18,height:18,borderRadius:"50%",background:on?T.accentText:"#999",transition:"left 0.2s"}} /></div>;}

// ─── MAIN ─────────────────────────────────────────────────

export default function App() {
  const S=loadData();
  const [appTheme,setAppTheme]=useState(S?.appTheme||"light");
  const T=APP_THEMES[appTheme];

  // Brand identity
  const [businessType,setBusinessType]=useState(S?.businessType||"");
  const [brandAnswers,setBrandAnswers]=useState(S?.brandAnswers||{});
  const [voiceProfile,setVoiceProfile]=useState(S?.voiceProfile||"");
  const [genVoice,setGenVoice]=useState(false);

  // Profile
  const [profileDataUrl,setProfileDataUrl]=useState(S?.profileDataUrl||null);
  const [displayName,setDisplayName]=useState(S?.displayName||"");
  const [handle,setHandle]=useState(S?.handle||"");
  const [blueTick,setBlueTick]=useState(S?.blueTick??false);
  const [websiteUrl,setWebsiteUrl]=useState(S?.websiteUrl||"");
  const [showWebsite,setShowWebsite]=useState(S?.showWebsite??false);

  // Visual
  const [slideTheme,setSlideTheme]=useState(S?.slideTheme||"dark-gold");
  const [fontId,setFontId]=useState(S?.fontId||"playfair");
  const [showNums,setShowNums]=useState(S?.showNums??true);
  const [treatment,setTreatment]=useState(S?.treatment||"gradient");
  const [imgOpacity,setImgOpacity]=useState(S?.imgOpacity||28);
  const [overlayDark,setOverlayDark]=useState(S?.overlayDark||65);
  const [customBg,setCustomBg]=useState(S?.customBg||"#0A0A0A");
  const [customAccent,setCustomAccent]=useState(S?.customAccent||"#C9A84C");

  // Content
  const [topic,setTopic]=useState("");
  const [keyThemes,setKeyThemes]=useState("");
  const [angle,setAngle]=useState("");
  const [goal,setGoal]=useState("ai");
  const [tone,setTone]=useState("ai");
  const [hookStyle,setHookStyle]=useState("ai");
  const [slideCount,setSlideCount]=useState(7);

  // Images
  const [coverImage,setCoverImage]=useState(null);
  const [slideImages,setSlideImages]=useState({});

  // App state
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

  useEffect(()=>{
    saveData({appTheme,businessType,brandAnswers,voiceProfile,profileDataUrl,displayName,handle,blueTick,websiteUrl,showWebsite,slideTheme,fontId,showNums,treatment,imgOpacity,overlayDark});
  },[appTheme,businessType,brandAnswers,voiceProfile,profileDataUrl,displayName,handle,blueTick,websiteUrl,showWebsite,slideTheme,fontId,showNums,treatment,imgOpacity,overlayDark]);

  const handleImg=(e,set)=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>set(ev.target.result);r.readAsDataURL(f);};
  const handleSlideImg=(i,e)=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setSlideImages(p=>({...p,[i]:ev.target.result}));r.readAsDataURL(f);};

  const buildVoice=async()=>{
    setGenVoice(true);
    const bType=BUSINESS_TYPES.find(b=>b.id===businessType)?.label||"brand";
    const questions=BRAND_QUESTIONS[businessType]||BRAND_QUESTIONS.other;
    const qa=questions.map(q=>`${q.label}\n${brandAnswers[q.key]||"Not provided"}`).join("\n\n");
    try {
      const res=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-opus-4-7",max_tokens:600,
          messages:[{role:"user",content:`Write a concise AI voice profile (under 180 words) for a ${bType} social media carousel generator. Based on:\n\n${qa}\n\nStart with "Write in a tone that..." Be specific and practical, not generic. Cover: tone, audience, what to avoid, CTA style.`}]})});
      const d=await res.json();
      setVoiceProfile(d.content?.find(b=>b.type==="text")?.text||"");
    } catch {setVoiceProfile("Write directly and honestly. Short punchy sentences. Speak to real problems. Never overpromise.");}
    setGenVoice(false);
  };

  const generate=async()=>{
    if(!topic.trim()){setErr("Add a topic first.");return;}
    setErr(""); setStep("generating");
    const bType=BUSINESS_TYPES.find(b=>b.id===businessType)?.label||"";
    const tL=tone==="ai"?"whatever tone best fits this topic and audience":TONE_OPTIONS.find(t=>t.id===tone)?.label||"direct";
    const hL=hookStyle==="ai"?"whatever hook style will most stop someone scrolling — use your judgement":HOOK_STYLES.find(h=>h.id===hookStyle)?.label||"compelling";
    const gL=goal==="ai"?"infer the best goal from context":GOALS.find(g=>g.id===goal)?.label||"engage";
    const extras=[bType&&`Business/creator type: ${bType}`,keyThemes&&`Key themes or words to include: ${keyThemes}`,angle&&`Specific angle: ${angle}`].filter(Boolean).join("\n");
    const prompt=`You are an expert social media carousel writer creating content for ${bType||"a brand"}.

BRAND VOICE: ${voiceProfile||"Direct, honest, no filler. Short sentences. Real specific insights, not generic advice."}
GOAL: ${gL}
TONE: ${tL}
HOOK APPROACH: ${hL}
TOPIC: "${topic}"
${extras}

Generate exactly ${slideCount} carousel slides. Critical rules:
- NEVER write structural labels like HOOK, CTA, INTRO into the content — internal use only
- First slide: use a ${hL} that is HIGHLY SPECIFIC and scroll-stopping — real numbers, real scenarios
- Value slides: each must be genuinely insightful — use real stats and data where relevant
- Headlines: max 8 words, specific not vague, no clichés
- Body: 1-2 tight sentences ONLY, no padding
- Last slide: soft CTA, never pushy or salesy
- Match the tone and language to the business type — a restaurant post sounds different to a business coach post

Return ONLY valid JSON array. No markdown. No explanation:
[{"tag":"SHORT LABEL UPPERCASE","headline":"specific max 8 words","body":"1-2 sentences","cta":"last slide only or null"}]`;

    try {
      const res=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-opus-4-7",max_tokens:2000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:prompt}]})});
      const d=await res.json();
      const raw=d.content?.find(b=>b.type==="text")?.text||"";
      const m=raw.match(/\[[\s\S]*\]/);
      if(!m)throw new Error("no json");
      // Strip any <cite> tags that leaked in from web search
      const clean=m[0].replace(/<cite[^>]*>|<\/cite>/g,"").replace(/<[^>]+>/g,"");
      const parsed=JSON.parse(clean);
      // Clean each slide's text fields
      const sanitize=s=>({
        ...s,
        headline:(s.headline||"").replace(/<[^>]+>/g,"").trim(),
        body:(s.body||"").replace(/<[^>]+>/g,"").trim(),
        tag:(s.tag||"").replace(/<[^>]+>/g,"").trim(),
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
        body:JSON.stringify({model:"claude-opus-4-7",max_tokens:400,
          messages:[{role:"user",content:`Rewrite this carousel slide following this instruction: "${slidePrompt}"\n\nCurrent slide:\n${JSON.stringify(cur)}\n\nBrand voice: ${voiceProfile||"Direct, honest, specific."}\n\nReturn ONLY a JSON object {tag,headline,body,cta?}. No markdown.`}]})});
      const d=await res.json();
      const raw=d.content?.find(b=>b.type==="text")?.text||"";
      const m=raw.match(/\{[\s\S]*\}/);
      if(m){const u=JSON.parse(m[0]);const n=[...editing];n[active]={...n[active],...u};setEditing(n);setSlidePrompt("");}
    } catch {}
    setRegenLoading(false);
  };

  const updateSlide=(i,k,v)=>{const n=[...editing];n[i]={...n[i],[k]:v};setEditing(n);};
  const dlSlide=useCallback(i=>{const cs=document.querySelectorAll("canvas");if(!cs[i])return;const a=document.createElement("a");a.download=`slide-${i+1}.png`;a.href=cs[i].toDataURL("image/png");a.click();},[]);
  const dlAllSlides=useCallback(async()=>{setDlAll(true);const cs=document.querySelectorAll("canvas");for(let i=0;i<cs.length;i++){await new Promise(r=>setTimeout(r,300));const a=document.createElement("a");a.download=`slide-${i+1}.png`;a.href=cs[i].toDataURL("image/png");a.click();}setDlAll(false);},[]);

  const canvasOpts=useCallback((i)=>({
    theme:slideTheme,fontId,bgImageUrl:slideImages[i]||coverImage,
    treatment,imgOpacity,overlayDark,showNums,
    profileDataUrl,name:displayName,handle,blueTick,
    websiteUrl:showWebsite?websiteUrl:"",ratio,
    customBg,customAccent,
  }),[slideTheme,fontId,slideImages,coverImage,treatment,imgOpacity,overlayDark,showNums,profileDataUrl,displayName,handle,blueTick,websiteUrl,showWebsite,ratio,customBg,customAccent]);

  // Styles
  const inp={width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"11px 14px",color:T.text,fontSize:14,fontFamily:"inherit"};
  const lbl={display:"block",color:T.muted,fontSize:10,letterSpacing:2.5,marginBottom:6,textTransform:"uppercase",fontWeight:700};
  const chip=(on,sm)=>({background:on?`${T.accent}15`:T.surface2,border:`1px solid ${on?T.accent:T.border}`,borderRadius:7,padding:sm?"7px 11px":"10px 12px",cursor:"pointer",textAlign:"left",color:T.text,fontFamily:"inherit",transition:"all 0.14s"});

  const questions=BRAND_QUESTIONS[businessType]||null;

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",paddingBottom:80}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}input,textarea,select{outline:none!important;font-family:inherit}
        button{cursor:pointer;font-family:inherit;transition:all 0.14s}button:hover{opacity:0.8}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
        input[type=range]{-webkit-appearance:none;height:3px;border-radius:2px;background:${T.border};width:100%}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;background:${T.accent};cursor:pointer}
        a{color:inherit;text-decoration:none}a:hover{opacity:0.7}
      `}</style>

      {/* HEADER */}
      <div style={{borderBottom:`1px solid ${T.border}`,padding:"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:`${T.bg}F4`,backdropFilter:"blur(16px)",zIndex:100}}>
        <div style={{display:"flex",alignItems:"baseline",gap:10}}>
          <span style={{fontSize:13,fontWeight:800,color:T.accent,letterSpacing:-0.3}}>Build with Tav</span>
          <span style={{fontSize:12,color:T.border}}>|</span>
          <span style={{fontSize:13,fontWeight:600,color:T.muted}}>Carousel Generator</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {step==="preview"&&<button onClick={()=>{setStep("setup");setEditing([]);}} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.muted,padding:"6px 13px",borderRadius:6,fontSize:12,fontWeight:600}}>← New</button>}
          <button onClick={()=>{localStorage.removeItem(STORAGE_KEY);window.location.reload();}} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.muted,padding:"6px 13px",borderRadius:6,fontSize:12,fontWeight:600}}>Switch Brand</button>
          <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:10,borderLeft:`1px solid ${T.border}`}}>
            <span style={{fontSize:13}}>☀</span>
            <Toggle on={appTheme==="dark"} set={v=>setAppTheme(v?"dark":"light")} T={T} />
            <span style={{fontSize:13}}>☾</span>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1060,margin:"0 auto",padding:"26px 20px"}}>

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

            {/* CONTENT */}
            {tab==="content"&&(
              <div style={{display:"flex",flexDirection:"column",gap:20}}>

                {/* Business type — top of content */}
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

                {/* Topic */}
                <div>
                  <label style={lbl}>Topic *</label>
                  <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder={
                    businessType==="restaurant"?"e.g. 5 reasons our Sunday roast sells out every week":
                    businessType==="gym"?"e.g. Why most people quit the gym within 6 weeks":
                    businessType==="coach"?"e.g. The real reason high achievers still feel empty":
                    businessType==="marketer"?"e.g. Why most brands waste 80% of their content budget":
                    businessType==="creator"?"e.g. Why most creators never make money from their content":
                    businessType==="retail"?"e.g. 5 things our best-selling product does differently":
                    businessType==="ecommerce"?"e.g. Why customers keep coming back to us (it's not price)":
                    businessType==="salon"?"e.g. The biggest hair mistakes we see every single week":
                    businessType==="corporate"?"e.g. Why most digital transformations fail in year one":
                    businessType==="personal"?"e.g. What I gave up to finally start living on my terms":
                    "e.g. Why most businesses fail on social media in year one"
                  } style={{...inp,fontSize:15,padding:"13px 15px"}} />
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div>
                    <label style={lbl}>Key themes or words <span style={{letterSpacing:0,fontSize:9,fontWeight:500}}>(optional)</span></label>
                    <input value={keyThemes} onChange={e=>setKeyThemes(e.target.value)} placeholder={
                      businessType==="restaurant"?"e.g. seasonal menu, locally sourced, Sunday roast":
                      businessType==="gym"?"e.g. strength training, real results, community":
                      businessType==="coach"?"e.g. burnout, career change, high performance":
                      businessType==="marketer"?"e.g. organic growth, ROI, content strategy":
                      businessType==="creator"?"e.g. monetisation, audience growth, niche":
                      businessType==="retail"?"e.g. new arrivals, handmade, local brand":
                      businessType==="ecommerce"?"e.g. new collection, sustainability, free delivery":
                      businessType==="salon"?"e.g. balayage, colour correction, healthy hair":
                      businessType==="corporate"?"e.g. efficiency, AI, cost reduction":
                      businessType==="personal"?"e.g. lifestyle, mindset, slow living":
                      "e.g. 2026 stats, UK market, cost of living"
                    } style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Specific angle <span style={{letterSpacing:0,fontSize:9,fontWeight:500}}>(optional)</span></label>
                    <input value={angle} onChange={e=>setAngle(e.target.value)} placeholder={
                      businessType==="restaurant"?"e.g. focus on the story behind the dish, not just the food":
                      businessType==="gym"?"e.g. keep it real — no before and after, no transformation promises":
                      businessType==="coach"?"e.g. lean into the emotional side, not the strategy":
                      businessType==="marketer"?"e.g. make it data-led, back every claim with a number":
                      businessType==="creator"?"e.g. talk from personal experience, not theory":
                      businessType==="retail"?"e.g. focus on the people behind the product":
                      businessType==="ecommerce"?"e.g. lead with the problem the product solves":
                      businessType==="salon"?"e.g. position as expert advice, not a sales pitch":
                      businessType==="corporate"?"e.g. keep it jargon-free, speak to the decision maker":
                      businessType==="personal"?"e.g. be vulnerable — share the hard parts, not just the wins":
                      "e.g. focus on the emotional side, not just the tactics"
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
                    <label style={lbl}>Cover image <span style={{letterSpacing:0,fontSize:9,fontWeight:500}}>(optional)</span></label>
                    <div onClick={()=>coverRef.current?.click()} style={{background:T.surface2,border:`1px dashed ${coverImage?T.accent:T.border}`,borderRadius:8,padding:"10px 14px",cursor:"pointer",textAlign:"center"}}>
                      <span style={{color:coverImage?T.accent:T.muted,fontSize:13,fontWeight:600}}>{coverImage?"✓ Image loaded — click to change":"Upload cover image"}</span>
                    </div>
                    <input ref={coverRef} type="file" accept="image/*" onChange={e=>handleImg(e,setCoverImage)} style={{display:"none"}} />
                  </div>
                </div>

                {err&&<div style={{color:"#D94F4F",fontSize:13,padding:"10px 14px",background:"rgba(217,79,79,0.08)",borderRadius:8,border:"1px solid rgba(217,79,79,0.2)",fontWeight:500}}>{err}</div>}

                <button onClick={generate} disabled={!topic.trim()} style={{background:topic.trim()?T.accent:T.surface2,color:topic.trim()?T.accentText:T.muted,border:"none",borderRadius:10,padding:"14px 40px",fontSize:15,fontWeight:800,width:"100%",letterSpacing:0.3}}>
                  Generate Carousel →
                </button>
              </div>
            )}

            {/* VISUAL */}
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
                    <div style={{display:"flex",gap:14,marginTop:12,padding:"14px",background:T.surface2,borderRadius:8,border:`1px solid ${T.border}`}}>
                      <div style={{flex:1}}>
                        <label style={{...lbl,marginBottom:8}}>Background colour</label>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <input type="color" value={customBg} onChange={e=>setCustomBg(e.target.value)} style={{width:36,height:36,borderRadius:6,border:`1px solid ${T.border}`,cursor:"pointer",padding:2}} />
                          <input value={customBg} onChange={e=>setCustomBg(e.target.value)} style={{...inp,maxWidth:110,fontSize:12}} />
                        </div>
                      </div>
                      <div style={{flex:1}}>
                        <label style={{...lbl,marginBottom:8}}>Accent colour</label>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <input type="color" value={customAccent} onChange={e=>setCustomAccent(e.target.value)} style={{width:36,height:36,borderRadius:6,border:`1px solid ${T.border}`,cursor:"pointer",padding:2}} />
                          <input value={customAccent} onChange={e=>setCustomAccent(e.target.value)} style={{...inp,maxWidth:110,fontSize:12}} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label style={lbl}>Font</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {FONT_OPTIONS.map(f=>(
                      <button key={f.id} onClick={()=>setFontId(f.id)} style={{background:fontId===f.id?`${T.accent}15`:T.surface2,border:`1px solid ${fontId===f.id?T.accent:T.border}`,borderRadius:6,padding:"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:7,transition:"all 0.14s"}}>
                        <span style={{fontFamily:`"${FONTS.find(x=>x.id===f.id)?.headline}",serif`,fontSize:13,fontWeight:700,color:fontId===f.id?T.accent:T.text}}>{f.label}</span>
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
                {treatment==="gradient"&&<div><label style={lbl}>Overlay darkness — {overlayDark}%</label><input type="range" min={30} max={95} value={overlayDark} onChange={e=>setOverlayDark(+e.target.value)} /></div>}

                <div onClick={()=>setShowNums(!showNums)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"11px 14px",cursor:"pointer"}}>
                  <div><div style={{fontWeight:700,fontSize:13}}>Slide Numbers</div><div style={{color:T.muted,fontSize:11,marginTop:2}}>Show 1/7, 2/7 etc on each slide</div></div>
                  <Toggle on={showNums} set={setShowNums} T={T} />
                </div>
              </div>
            )}

            {/* IDENTITY */}
            {tab==="identity"&&(
              <div style={{display:"flex",flexDirection:"column",gap:18}}>
                {!businessType?(
                  <div style={{textAlign:"center",padding:"40px 0",color:T.muted}}>
                    <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>Select your business type first</div>
                    <div style={{fontSize:13}}>Go to the Content tab and choose what you are — your questions will appear here.</div>
                  </div>
                ):(
                  <>
                    <div style={{color:T.muted,fontSize:13,lineHeight:1.7}}>Answer these questions and we'll generate a voice profile the AI reads before writing every slide. The more specific you are, the better the output.</div>
                    {questions&&questions.map(q=>(
                      <div key={q.key}>
                        <label style={{...lbl,color:T.muted,letterSpacing:0.5,fontSize:11,textTransform:"none",fontWeight:600}}>{q.label}</label>
                        <textarea value={brandAnswers[q.key]||""} onChange={e=>setBrandAnswers(p=>({...p,[q.key]:e.target.value}))} placeholder={q.ph} rows={2} style={{...inp,resize:"vertical",lineHeight:1.6}} />
                      </div>
                    ))}
                    <button onClick={buildVoice} disabled={genVoice} style={{background:T.accent,border:"none",color:T.accentText,padding:"11px 22px",borderRadius:8,fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:10,width:"fit-content"}}>
                      {genVoice?<><Spin c={T.accentText}/>Building your voice...</>:"Build My Voice Profile →"}
                    </button>
                    {voiceProfile&&(
                      <div>
                        <label style={lbl}>Your voice profile <span style={{letterSpacing:0,fontSize:9,fontWeight:500}}>(edit if needed)</span></label>
                        <textarea value={voiceProfile} onChange={e=>setVoiceProfile(e.target.value)} rows={7} style={{...inp,resize:"vertical",lineHeight:1.7}} />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* PROFILE */}
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
                  <div><label style={lbl}>Display Name</label><input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name or brand name" style={inp} /></div>
                  <div><label style={lbl}>Handle</label><input value={handle} onChange={e=>setHandle(e.target.value)} placeholder="@yourhandle" style={inp} /></div>
                </div>

                <div onClick={()=>setBlueTick(!blueTick)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"11px 14px",cursor:"pointer"}}>
                  <div><div style={{fontWeight:700,fontSize:13}}>Blue Tick</div><div style={{color:T.muted,fontSize:11,marginTop:2}}>Show verified badge on slides</div></div>
                  <Toggle on={blueTick} set={setBlueTick} T={T} />
                </div>

                <div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:13}}>Website Footer on Slides</div>
                      <div style={{color:T.muted,fontSize:11,marginTop:2}}>Show your website URL at the bottom of every slide</div>
                    </div>
                    <Toggle on={showWebsite} set={setShowWebsite} T={T} />
                  </div>
                  {showWebsite&&<input value={websiteUrl} onChange={e=>setWebsiteUrl(e.target.value)} placeholder="e.g. www.buildwithtav.co or @yourhandle" style={inp} />}
                </div>

                {/* Preview */}
                <div style={{background:appTheme==="light"?"#111":"#111",borderRadius:10,border:`1px solid ${T.border}`,padding:"16px 18px",display:"flex",alignItems:"center",gap:13,marginTop:4}}>
                  <div style={{width:46,height:46,borderRadius:"50%",border:"2px solid #C9A84C",overflow:"hidden",background:"#1a1a1a",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {profileDataUrl?<img src={profileDataUrl} style={{width:"100%",height:"100%",objectFit:"cover"}} />:<span style={{color:"#C9A84C",fontSize:16,fontWeight:700}}>?</span>}
                  </div>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontWeight:700,fontSize:14,color:"#fff"}}>{displayName||"Your Name"}</span>
                      {blueTick&&<div style={{width:16,height:16,borderRadius:"50%",background:"#1D9BF0",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:9,fontWeight:700}}>✓</span></div>}
                    </div>
                    <div style={{color:"#555",fontSize:11,marginTop:2}}>{handle||"@yourhandle"}</div>
                    {showWebsite&&websiteUrl&&<div style={{color:"#444",fontSize:10,marginTop:3}}>{websiteUrl}</div>}
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
            <div style={{color:T.accent,fontSize:9,letterSpacing:4,marginBottom:8,textTransform:"uppercase",fontWeight:700}}>Working on it</div>
            <div style={{fontSize:19,fontWeight:800,marginBottom:6}}>Researching & writing your carousel</div>
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

            <div style={{display:"grid",gridTemplateColumns:"1fr 330px",gap:22}}>
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
                {active===editing.length-1&&<div><label style={lbl}>CTA</label><input value={editing[active]?.cta||""} onChange={e=>updateSlide(active,"cta",e.target.value)} placeholder="e.g. Free preview → bio" style={inp} /></div>}

                <div>
                  <label style={lbl}>Image</label>
                  <div onClick={()=>{const i2=document.createElement("input");i2.type="file";i2.accept="image/*";i2.onchange=e=>handleSlideImg(0,e);i2.click();}} style={{background:T.surface2,border:`1px dashed ${slideImages[0]?T.accent:T.border}`,borderRadius:8,padding:"9px",cursor:"pointer",textAlign:"center",marginBottom:8}}>
                    <span style={{color:slideImages[0]?T.accent:T.muted,fontSize:12,fontWeight:600}}>{slideImages[0]?"✓ Image loaded — click to change":"Upload image"}</span>
                  </div>
                  {slideImages[0]&&(
                    <div style={{display:"flex",gap:6}}>
                      {[["cover","Cover only"],["all","All slides"]].map(([id,label])=>(
                        <button key={id} onClick={()=>{
                          if(id==="all"){const imgs={};editing.forEach((_,i)=>imgs[i]=slideImages[0]);setSlideImages(imgs);}
                          else{setSlideImages({0:slideImages[0]});}
                        }} style={{flex:1,background:T.surface2,border:`1px solid ${T.border}`,color:T.muted,padding:"6px",borderRadius:6,fontSize:11,fontWeight:600}}>{label}</button>
                      ))}
                    </div>
                  )}
                </div>

                {treatment==="dim"&&<div><label style={lbl}>Opacity — {imgOpacity}%</label><input type="range" min={5} max={55} value={imgOpacity} onChange={e=>setImgOpacity(+e.target.value)} /></div>}
                {treatment==="gradient"&&<div><label style={lbl}>Overlay — {overlayDark}%</label><input type="range" min={30} max={95} value={overlayDark} onChange={e=>setOverlayDark(+e.target.value)} /></div>}

                <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12}}>
                  <label style={lbl}>AI Rewrite</label>
                  <textarea value={slidePrompt} onChange={e=>setSlidePrompt(e.target.value)} placeholder={`"More aggressive"\n"Add a stat about UK rents"\n"Warmer tone"`} rows={3} style={{...inp,resize:"vertical",lineHeight:1.5,marginBottom:8}} />
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
      <div style={{borderTop:`1px solid ${T.border}`,padding:"16px 28px",textAlign:"center",marginTop:40}}>
        <span style={{color:T.muted,fontSize:12}}>
          Created by <a href="https://www.buildwithtav.co" target="_blank" rel="noopener noreferrer" style={{color:T.accent,fontWeight:700}}>Build with Tav</a> · <a href="https://www.buildwithtav.co" target="_blank" rel="noopener noreferrer" style={{color:T.muted}}>buildwithtav.co</a>
        </span>
      </div>
    </div>
  );
}
