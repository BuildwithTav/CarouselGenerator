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
  { id:"poppins",     label:"Poppins",     headline:"Poppins",            body:"Poppins" },
  { id:"oswald",      label:"Oswald",      headline:"Oswald",             body:"Lato" },
];

async function loadFonts() {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Montserrat:wght@700;900&family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Serif+Display:ital@0;1&family=Bebas+Neue&family=Inter:wght@700;800;900&family=Poppins:wght@700;800;900&family=Oswald:wght@600;700&family=Lato:wght@400;700&display=swap";
  document.head.appendChild(link);
  await new Promise(r => setTimeout(r, 1500));
  await document.fonts.ready;
}

// ─── APP THEME ───────────────────────────────────────────

const APP_THEMES = {
  light: { bg:"#F7F5F1",surface:"#FFF",surface2:"#EEECEA",border:"#E0DDD8",text:"#1A1A1A",muted:"#999",accent:"#1A1A1A",accentText:"#FFF",inputBg:"#FFF" },
  dark:  { bg:"#080808",surface:"#111",surface2:"#181818",border:"#222",text:"#F0EDE6",muted:"#555",accent:"#C9A84C",accentText:"#000",inputBg:"#111" },
};

// ─── SLIDE COLOUR THEMES ─────────────────────────────────

const SLIDE_THEMES = [
  { id:"dark-gold", label:"Dark Gold",   preview:["#0A0A0A","#C9A84C"] },
  { id:"midnight",  label:"Midnight",    preview:["#0D1117","#7C9EFF"] },
  { id:"editorial", label:"Editorial",   preview:["#F8F6F2","#1A1A1A"] },
  { id:"warm",      label:"Warm Cream",  preview:["#F2EDE4","#8B4513"] },
  { id:"noir",      label:"Noir",        preview:["#050505","#FFFFFF"] },
  { id:"forest",    label:"Forest",      preview:["#1A2E1A","#7DBE7D"] },
  { id:"navy",      label:"Navy Gold",   preview:["#0A1628","#E8C97A"] },
  { id:"custom",    label:"Custom",      preview:["#333","#C9A84C"] },
];

function getColors(theme, customBg, customAccent) {
  const map = {
    "dark-gold": { bg:"#0A0A0A", text:"#FFFFFF", accent:"#C9A84C", sub:"rgba(255,255,255,0.72)", dark:true },
    "midnight":  { bg:"#0D1117", text:"#E8EAF2", accent:"#7C9EFF", sub:"rgba(232,234,242,0.72)", dark:true },
    "editorial": { bg:"#F8F6F2", text:"#0A0A0A", accent:"#0A0A0A", sub:"rgba(10,10,10,0.62)", dark:false },
    "warm":      { bg:"#F2EDE4", text:"#2A1F14", accent:"#8B4513", sub:"rgba(42,31,20,0.65)", dark:false },
    "noir":      { bg:"#050505", text:"#FFFFFF", accent:"#FFFFFF", sub:"rgba(255,255,255,0.68)", dark:true },
    "forest":    { bg:"#1A2E1A", text:"#E8F5E8", accent:"#7DBE7D", sub:"rgba(232,245,232,0.72)", dark:true },
    "navy":      { bg:"#0A1628", text:"#F0EAD6", accent:"#E8C97A", sub:"rgba(240,234,214,0.72)", dark:true },
    "custom":    { bg:customBg||"#0A0A0A", text:"#FFFFFF", accent:customAccent||"#C9A84C", sub:"rgba(255,255,255,0.72)", dark:true },
  };
  return map[theme] || map["dark-gold"];
}

// ─── BUSINESS TYPES ──────────────────────────────────────

const BUSINESS_TYPES = [
  { id:"creator",    label:"Creator / Influencer" },
  { id:"marketer",   label:"Digital Marketer" },
  { id:"coach",      label:"Coach / Consultant" },
  { id:"restaurant", label:"Restaurant / Café" },
  { id:"gym",        label:"Gym / Fitness" },
  { id:"retail",     label:"Retail / Shop" },
  { id:"ecommerce",  label:"E-Commerce" },
  { id:"salon",      label:"Salon / Beauty" },
  { id:"corporate",  label:"Corporate / B2B" },
  { id:"personal",   label:"Personal Page" },
];

const BRAND_QUESTIONS = {
  creator:    [{key:"what",label:"What do you create content about?",ph:"e.g. Personal finance for people in their 30s"},{key:"who",label:"Who is your audience?",ph:"e.g. Young professionals feeling stuck in the rat race"},{key:"unique",label:"What makes you different?",ph:"e.g. I went from £0 to financial freedom by 35 — I share everything"},{key:"avoid",label:"What do you never want to sound like?",ph:"e.g. Fake guru, overpromising, generic motivation"},{key:"cta",label:"What do you want people to do?",ph:"e.g. Follow me, click my bio link"}],
  marketer:   [{key:"what",label:"What service do you offer?",ph:"e.g. I help small businesses get more clients through organic social"},{key:"who",label:"Who do you work with?",ph:"e.g. Small business owners overwhelmed by marketing"},{key:"unique",label:"What makes your approach different?",ph:"e.g. No paid ads — only organic strategies that work"},{key:"avoid",label:"What do you never want to sound like?",ph:"e.g. Salesy, corporate, full of jargon"},{key:"cta",label:"What do you want people to do?",ph:"e.g. Book a free discovery call"}],
  coach:      [{key:"what",label:"What do you coach on?",ph:"e.g. I help burnt-out professionals find a career they love"},{key:"who",label:"Who are your clients?",ph:"e.g. High-achievers in their 30s-40s who feel unfulfilled"},{key:"unique",label:"What's your method or story?",ph:"e.g. I left a six-figure job at 38 — I know what it takes"},{key:"avoid",label:"What tone do you want to avoid?",ph:"e.g. Preachy, overly spiritual"},{key:"cta",label:"What's your call to action?",ph:"e.g. Book a free clarity call"}],
  restaurant: [{key:"what",label:"What's your restaurant and what do you serve?",ph:"e.g. Tavolino — authentic Italian in central Manchester"},{key:"who",label:"Who are your typical customers?",ph:"e.g. Date night couples, local families"},{key:"unique",label:"What makes dining with you special?",ph:"e.g. Everything made fresh daily, pasta imported from Naples"},{key:"avoid",label:"What tone doesn't suit your brand?",ph:"e.g. Overly formal"},{key:"cta",label:"What do you want people to do?",ph:"e.g. Book a table"}],
  gym:        [{key:"what",label:"What's your gym and what do you offer?",ph:"e.g. Iron House — strength and conditioning in Leeds"},{key:"who",label:"Who are your members?",ph:"e.g. Working adults who want real results"},{key:"unique",label:"What makes your gym different?",ph:"e.g. No mirrors, no egos — hard work and real community"},{key:"avoid",label:"What do you never want to sound like?",ph:"e.g. Bootcamp bro culture"},{key:"cta",label:"What do you want people to do?",ph:"e.g. Book a free trial"}],
  retail:     [{key:"what",label:"What do you sell?",ph:"e.g. Independent bookshop in Bristol"},{key:"who",label:"Who are your customers?",ph:"e.g. Local book lovers, students"},{key:"unique",label:"What makes your shop special?",ph:"e.g. Handpicked recommendations, community events"},{key:"avoid",label:"What tone doesn't fit?",ph:"e.g. Overly corporate"},{key:"cta",label:"What do you want people to do?",ph:"e.g. Visit us in store"}],
  ecommerce:  [{key:"what",label:"What do you sell?",ph:"e.g. Sustainable activewear from recycled materials"},{key:"who",label:"Who buys from you?",ph:"e.g. Women 25-40 who care about performance and ethics"},{key:"unique",label:"What makes your products different?",ph:"e.g. Carbon neutral, lasts 3x longer"},{key:"avoid",label:"What do you never want to sound like?",ph:"e.g. Greenwashing, overly salesy"},{key:"cta",label:"What do you want people to do?",ph:"e.g. Shop the new collection"}],
  salon:      [{key:"what",label:"What's your salon and what do you specialise in?",ph:"e.g. Lumière — colour specialists in West London"},{key:"who",label:"Who are your clients?",ph:"e.g. Professional women who want quality"},{key:"unique",label:"What makes your salon stand out?",ph:"e.g. Low-damage techniques — healthy hair first"},{key:"avoid",label:"What tone doesn't suit?",ph:"e.g. Too girly and pink"},{key:"cta",label:"What do you want people to do?",ph:"e.g. Book online"}],
  corporate:  [{key:"what",label:"What does your company do?",ph:"e.g. We help businesses reduce costs through AI"},{key:"who",label:"Who are your clients?",ph:"e.g. Operations directors at companies with 50-500 employees"},{key:"unique",label:"What's your edge?",ph:"e.g. We implement in 30 days, not 6 months"},{key:"avoid",label:"What tone to avoid?",ph:"e.g. Overly technical, buzzword heavy"},{key:"cta",label:"What do you want prospects to do?",ph:"e.g. Book a discovery call"}],
  personal:   [{key:"what",label:"What is your page about?",ph:"e.g. Documenting my move from London to rural France"},{key:"who",label:"Who do you want to connect with?",ph:"e.g. People who dream of a slower life"},{key:"unique",label:"What's your story?",ph:"e.g. I swapped a City salary for a farmhouse renovation"},{key:"avoid",label:"What do you never want to sound like?",ph:"e.g. Showing off"},{key:"cta",label:"What do you want people to do?",ph:"e.g. Follow along"}],
};

const STORAGE_KEY = "bwt_cg_v3";

// ─── CANVAS DRAWING ──────────────────────────────────────
// Flexible renderer — executes layout decisions made by the AI

function getFont(fontId) {
  return FONTS.find(f=>f.id===fontId)||FONTS[0];
}

function wrapLines(ctx, text, maxW) {
  if (!text) return [];
  const words = text.split(" "); const lines = []; let line = "";
  for (const w of words) {
    const t = line ? line+" "+w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function drawText(ctx, text, x, y, color, shadowDark=true) {
  if (!text) return;
  // Manual shadow — works regardless of clip state
  ctx.fillStyle = shadowDark ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.08)";
  ctx.fillText(text, x+2, y+2);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawNoise(ctx, W, H, alpha=0.025) {
  ctx.save(); ctx.globalAlpha = alpha;
  for (let i=0; i<8000; i++) {
    const v = Math.random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random()*W, Math.random()*H, 1, 1);
  }
  ctx.restore();
}

function drawBrackets(ctx, W, H, color, opacity=0.5) {
  ctx.save(); ctx.strokeStyle=color; ctx.lineWidth=2.5; ctx.globalAlpha=opacity;
  const b=52;
  [[b,44,44,44,44,b],[W-b,44,W-44,44,W-44,b],[b,H-44,44,H-44,44,H-b],[W-b,H-44,W-44,H-44,W-44,H-b]]
    .forEach(([x1,y1,x2,y2,x3,y3])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.stroke();});
  ctx.restore();
}

function drawProfileBadge(ctx, W, profileImg, name, handle, blueTick, C, HF, BF, badgeY=72) {
  const avR = 44, avX = 96;
  const avCY = badgeY + avR;

  // Solid pill backdrop — no shadow needed
  const bpX = avX - avR - 12;
  const bpW = avR*2 + 260;
  const bpH = avR*2 + 24;
  ctx.fillStyle = C.dark ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.8)";
  ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(bpX, avCY-avR-12, bpW, bpH, avR+12);
  else ctx.rect(bpX, avCY-avR-12, bpW, bpH);
  ctx.fill();

  // Accent ring behind avatar
  ctx.fillStyle = C.accent;
  ctx.beginPath(); ctx.arc(avX, avCY, avR+4, 0, Math.PI*2); ctx.fill();

  // Avatar
  ctx.save();
  ctx.beginPath(); ctx.arc(avX, avCY, avR, 0, Math.PI*2); ctx.clip();
  if (profileImg) {
    const sc = Math.max(avR*2/profileImg.width, avR*2/profileImg.height);
    ctx.drawImage(profileImg, avX-avR-(profileImg.width*sc-avR*2)/2, avCY-avR-(profileImg.height*sc-avR*2)/2, profileImg.width*sc, profileImg.height*sc);
  } else {
    ctx.fillStyle = C.dark ? "#1c1c1c" : "#ddd";
    ctx.fillRect(avX-avR, avCY-avR, avR*2, avR*2);
    ctx.fillStyle = C.accent;
    ctx.font = `bold ${Math.floor(avR*0.7)}px ${HF}`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText((name||"?")[0].toUpperCase(), avX, avCY);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  // Text
  const nx = avX + avR + 14;
  const nameColor = C.dark ? "#FFFFFF" : "#111111";

  ctx.font = `bold 28px ${HF}`; ctx.textAlign = "left";
  ctx.fillStyle = nameColor;
  ctx.fillText(name||"Your Brand", nx, avCY-4);

  if (blueTick) {
    const nw = ctx.measureText(name||"Your Brand").width;
    const tx = nx+nw+8, ty = avCY-26;
    ctx.fillStyle = "#1D9BF0";
    ctx.beginPath(); ctx.arc(tx+13,ty+13,13,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#fff"; ctx.lineWidth=2.2; ctx.lineCap="round"; ctx.lineJoin="round";
    ctx.beginPath(); ctx.moveTo(tx+5,ty+13); ctx.lineTo(tx+11,ty+19); ctx.lineTo(tx+21,ty+7); ctx.stroke();
  }

  ctx.font = `21px ${BF}`; ctx.textAlign = "left";
  ctx.fillStyle = C.dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
  ctx.fillText(handle||"@yourhandle", nx, avCY+20);
}

// ─── LAYOUT RENDERERS ────────────────────────────────────

function renderStandard(ctx, W, H, slide, C, F) {
  const HF=`"${F.headline}"`, BF=`"${F.body}"`;
  const cx=W/2;
  const contentTop = 240;
  const contentBot = slide.cta ? H-160 : H-80;
  const zone = contentBot - contentTop;

  // Tag
  let y = contentTop;
  if (slide.tag) {
    ctx.font = `700 22px ${BF}`;
    const tw = ctx.measureText(slide.tag.toUpperCase()).width + 44;
    ctx.fillStyle = C.accent;
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(cx-tw/2, y, tw, 36, 18);
    else ctx.rect(cx-tw/2, y, tw, 36);
    ctx.fill();
    ctx.fillStyle = C.dark ? "#000" : "#fff";
    ctx.textAlign = "center"; ctx.fillText(slide.tag.toUpperCase(), cx, y+25);
    y += 54;
  }

  // Headline
  const hl = slide.headline||"";
  const hSize = hl.length>50?56:hl.length>35?66:hl.length>22?78:90;
  ctx.font = `bold ${hSize}px ${HF}`;
  const hlLines = wrapLines(ctx, hl, W-160);
  let hlY = y + hSize;

  // If accent_word provided, split headline rendering
  for (const line of hlLines) {
    if (slide.accent_word && line.includes(slide.accent_word)) {
      const parts = line.split(slide.accent_word);
      const p1w = ctx.measureText(parts[0]).width;
      const acw = ctx.measureText(slide.accent_word).width;
      const totalW = ctx.measureText(line).width;
      const startX = cx - totalW/2;
      drawText(ctx, parts[0], startX, hlY, C.text, C.dark);
      ctx.fillStyle = C.accent; ctx.fillText(slide.accent_word, startX+p1w, hlY);
      if(parts[1]) drawText(ctx, parts[1], startX+p1w+acw, hlY, C.text, C.dark);
    } else {
      drawText(ctx, line, cx, hlY, C.text, C.dark);
    }
    hlY += hSize*1.25;
  }
  y = hlY - hSize*0.1;

  // Divider
  ctx.strokeStyle=C.accent; ctx.lineWidth=1.5; ctx.globalAlpha=0.4;
  ctx.beginPath(); ctx.moveTo(cx-60,y+20); ctx.lineTo(cx+60,y+20); ctx.stroke();
  // Diamond
  ctx.globalAlpha=0.8; ctx.fillStyle=C.accent;
  ctx.save(); ctx.translate(cx,y+20); ctx.rotate(Math.PI/4);
  ctx.fillRect(-5,-5,10,10); ctx.restore();
  ctx.globalAlpha=1;
  y += 52;

  // Body
  if (slide.body) {
    ctx.font = `30px ${BF}`; ctx.textAlign="center";
    const bLines = wrapLines(ctx, slide.body, W-200);
    for (const line of bLines) {
      ctx.fillStyle = C.dark?"rgba(0,0,0,0.7)":"rgba(0,0,0,0.06)";
      ctx.fillText(line, cx+1, y+2);
      ctx.fillStyle = C.sub; ctx.fillText(line, cx, y);
      y += 48;
    }
  }

  // CTA
  if (slide.cta) {
    const ctaY = H-110;
    ctx.font = `bold 30px ${HF}`; ctx.textAlign="center";
    const ctaLines = wrapLines(ctx, slide.cta, W-120);
    const lineH = 44;
    const totalCtaH = ctaLines.length * lineH;
    // Background bar
    ctx.fillStyle=C.accent; ctx.globalAlpha=0.12;
    ctx.fillRect(60, ctaY-50, W-120, totalCtaH+30);
    ctx.globalAlpha=1;
    // Border
    ctx.strokeStyle=C.accent; ctx.lineWidth=1; ctx.globalAlpha=0.3;
    ctx.strokeRect(60, ctaY-50, W-120, totalCtaH+30);
    ctx.globalAlpha=1;
    let cy2 = ctaY - totalCtaH/2 + lineH/2;
    for (const line of ctaLines) {
      ctx.fillStyle=C.accent; ctx.fillText(line, cx, cy2);
      cy2 += lineH;
    }
  }
}

function renderCards(ctx, W, H, slide, C, F) {
  const HF=`"${F.headline}"`, BF=`"${F.body}"`;
  const cx=W/2;

  // Tag
  if (slide.tag) {
    ctx.font=`700 22px ${BF}`; ctx.textAlign="center";
    const tw=ctx.measureText(slide.tag.toUpperCase()).width+44;
    ctx.fillStyle=C.accent;
    ctx.beginPath(); if(ctx.roundRect)ctx.roundRect(cx-tw/2,80,tw,36,18); else ctx.rect(cx-tw/2,80,tw,36); ctx.fill();
    ctx.fillStyle=C.dark?"#000":"#fff"; ctx.fillText(slide.tag.toUpperCase(),cx,105);
  }

  // Headline
  const hl=slide.headline||"";
  const hSize=hl.length>40?60:hl.length>25?72:84;
  ctx.font=`bold ${hSize}px ${HF}`; ctx.textAlign="center";
  const hlLines=wrapLines(ctx,hl,W-140);
  let hlY=160+hSize;
  for(const line of hlLines){
    if(slide.accent_word&&line.includes(slide.accent_word)){
      const parts=line.split(slide.accent_word);
      const tw2=ctx.measureText(line).width;
      const sx=cx-tw2/2;
      const p1w=ctx.measureText(parts[0]).width;
      ctx.fillStyle=C.text; ctx.fillText(parts[0],sx,hlY);
      ctx.fillStyle=C.accent; ctx.fillText(slide.accent_word,sx+p1w,hlY);
      if(parts[1]){ctx.fillStyle=C.text;ctx.fillText(parts[1],sx+p1w+ctx.measureText(slide.accent_word).width,hlY);}
    } else {
      drawText(ctx,line,cx,hlY,C.text,C.dark);
    }
    hlY+=hSize*1.2;
  }

  // Divider
  ctx.strokeStyle=C.accent; ctx.lineWidth=1.5; ctx.globalAlpha=0.4;
  ctx.beginPath(); ctx.moveTo(cx-50,hlY); ctx.lineTo(cx+50,hlY); ctx.stroke();
  ctx.globalAlpha=1;

  // Cards from items array
  const items = slide.items || [];
  const cardPad=20, cardX=70, cardW=W-140;
  const startY = hlY+36;
  const cardH = Math.min(100, Math.floor((H-startY-140)/Math.max(items.length,1)));

  items.forEach((item, i) => {
    const cy=startY+i*(cardH+12);
    // Card bg
    ctx.fillStyle=C.dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)";
    ctx.beginPath(); if(ctx.roundRect)ctx.roundRect(cardX,cy,cardW,cardH,12); else ctx.rect(cardX,cy,cardW,cardH); ctx.fill();
    ctx.strokeStyle=C.accent; ctx.lineWidth=0.5; ctx.globalAlpha=0.2;
    ctx.beginPath(); if(ctx.roundRect)ctx.roundRect(cardX,cy,cardW,cardH,12); else ctx.rect(cardX,cy,cardW,cardH); ctx.stroke();
    ctx.globalAlpha=1;
    // Label
    if(item.label){
      ctx.font=`bold 24px ${BF}`; ctx.textAlign="left";
      ctx.fillStyle=C.accent; ctx.fillText(item.label,cardX+cardPad,cy+32);
    }
    // Text
    if(item.text){
      ctx.font=`22px ${BF}`; ctx.textAlign="left";
      ctx.fillStyle=C.sub; ctx.fillText(item.text,cardX+cardPad,cy+(item.label?58:40));
    }
  });
}

function renderSplit(ctx, W, H, slide, C, F) {
  const HF=`"${F.headline}"`, BF=`"${F.body}"`;
  const items=slide.items||[];
  const half=W/2;

  if(items.length>=2){
    // Left panel
    ctx.fillStyle=C.dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)";
    ctx.fillRect(0,0,half,H);

    [0,1].forEach(side=>{
      const item=items[side];
      const panelX=side===0?0:half;
      const panelCX=panelX+half/2;

      // Item header
      if(item.label){
        ctx.font=`bold 38px ${HF}`; ctx.textAlign="center";
        ctx.fillStyle=side===0?C.accent:"rgba(255,255,255,0.85)";
        const llines=wrapLines(ctx,item.label,half-60);
        let ly=180;
        llines.forEach(l=>{ctx.fillText(l,panelCX,ly);ly+=48;});
      }
      if(item.sub){
        ctx.font=`26px ${BF}`; ctx.textAlign="center";
        ctx.fillStyle=C.sub;
        const slines=wrapLines(ctx,item.sub,half-80);
        let sy=item.label?260:200;
        slines.forEach(l=>{ctx.fillText(l,panelCX,sy);sy+=36;});
      }
    });

    // VS / divider in center
    ctx.fillStyle=C.bg;
    ctx.beginPath(); ctx.arc(half,H/2,48,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=C.accent; ctx.lineWidth=1.5; ctx.globalAlpha=0.4;
    ctx.beginPath(); ctx.arc(half,H/2,48,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=1;
    ctx.font=`bold 32px ${HF}`; ctx.textAlign="center"; ctx.fillStyle=C.accent;
    ctx.fillText(slide.vs_label||"VS", half, H/2+12);
  }

  // Headline at bottom
  const hl=slide.headline||"";
  ctx.font=`bold 68px ${HF}`; ctx.textAlign="center";
  const hlLines=wrapLines(ctx,hl,W-120);
  let hlY=H*0.7;
  hlLines.forEach(l=>{
    drawText(ctx,l,W/2,hlY,C.text,C.dark);
    hlY+=82;
  });

  if(slide.body){
    ctx.font=`28px ${BF}`; ctx.textAlign="center"; ctx.fillStyle=C.sub;
    const bLines=wrapLines(ctx,slide.body,W-160);
    bLines.forEach(l=>{ctx.fillText(l,W/2,hlY);hlY+=40;});
  }
}

function renderIconHero(ctx, W, H, slide, C, F) {
  const HF=`"${F.headline}"`, BF=`"${F.body}"`;
  const cx=W/2;

  // Large circle icon area
  const circleR=130, circleY=260;
  ctx.strokeStyle=C.accent; ctx.lineWidth=1.5; ctx.globalAlpha=0.3;
  ctx.beginPath(); ctx.arc(cx,circleY,circleR,0,Math.PI*2); ctx.stroke();
  ctx.globalAlpha=1;
  // Glow
  const glow=ctx.createRadialGradient(cx,circleY,0,cx,circleY,circleR);
  glow.addColorStop(0,`${C.accent}22`); glow.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(cx,circleY,circleR,0,Math.PI*2); ctx.fill();

  // Icon / symbol
  if(slide.icon_symbol) {
    ctx.font=`bold 96px ${HF}`; ctx.textAlign="center"; ctx.fillStyle=C.accent;
    ctx.fillText(slide.icon_symbol,cx,circleY+32);
  }

  // Headline
  const hl=slide.headline||"";
  const hSize=hl.length>30?68:82;
  ctx.font=`bold ${hSize}px ${HF}`; ctx.textAlign="center";
  const hlLines=wrapLines(ctx,hl,W-120);
  let hlY=circleY+circleR+60;
  hlLines.forEach(l=>{
    drawText(ctx,l,cx,hlY,C.text,C.dark);
    hlY+=hSize*1.22;
  });

  // Divider
  ctx.strokeStyle=C.accent; ctx.lineWidth=1.5; ctx.globalAlpha=0.4;
  ctx.beginPath(); ctx.moveTo(cx-50,hlY+10); ctx.lineTo(cx+50,hlY+10); ctx.stroke();
  ctx.globalAlpha=1; hlY+=38;

  // Body
  if(slide.body){
    ctx.font=`30px ${BF}`; ctx.textAlign="center"; ctx.fillStyle=C.sub;
    wrapLines(ctx,slide.body,W-180).forEach(l=>{ctx.fillText(l,cx,hlY);hlY+=46;});
  }

  // CTA boxes
  if(slide.cta_items&&slide.cta_items.length) {
    const startY=H-300;
    slide.cta_items.forEach((item,i)=>{
      const bx=70, bw=W-140, bh=68, by=startY+i*(bh+14);
      ctx.fillStyle=i===0?C.accent:`${C.accent}18`;
      ctx.beginPath(); if(ctx.roundRect)ctx.roundRect(bx,by,bw,bh,34); else ctx.rect(bx,by,bw,bh); ctx.fill();
      ctx.strokeStyle=C.accent; ctx.lineWidth=1; ctx.globalAlpha=0.3;
      ctx.beginPath(); if(ctx.roundRect)ctx.roundRect(bx,by,bw,bh,34); else ctx.rect(bx,by,bw,bh); ctx.stroke();
      ctx.globalAlpha=1;
      ctx.font=`bold 26px ${HF}`; ctx.textAlign="center";
      ctx.fillStyle=i===0?(C.dark?"#000":"#fff"):C.accent;
      ctx.fillText(item,W/2,by+42);
    });
  } else if(slide.cta) {
    const ctaY=H-100;
    ctx.font=`bold 30px ${HF}`; ctx.textAlign="center";
    ctx.fillStyle=C.accent; ctx.fillText(slide.cta,cx,ctaY);
  }
}

function renderQuote(ctx, W, H, slide, C, F) {
  const HF=`"${F.headline}"`, BF=`"${F.body}"`;
  const cx=W/2;

  // Large quote mark
  ctx.font=`bold 200px ${HF}`; ctx.textAlign="center";
  ctx.fillStyle=`${C.accent}20`; ctx.fillText('"',cx,H*0.45);

  // Tag
  if(slide.tag){
    ctx.font=`700 22px ${BF}`; ctx.textAlign="center";
    const tw=ctx.measureText(slide.tag.toUpperCase()).width+44;
    ctx.fillStyle=C.accent;
    ctx.beginPath(); if(ctx.roundRect)ctx.roundRect(cx-tw/2,100,tw,36,18); else ctx.rect(cx-tw/2,100,tw,36); ctx.fill();
    ctx.fillStyle=C.dark?"#000":"#fff"; ctx.fillText(slide.tag.toUpperCase(),cx,125);
  }

  // Headline — bigger, italic optional
  const hl=slide.headline||"";
  const hSize=hl.length>40?64:hl.length>25?76:90;
  ctx.font=`bold ${hSize}px ${HF}`; ctx.textAlign="center";
  const hlLines=wrapLines(ctx,hl,W-180);
  let hlY=H*0.38;
  hlLines.forEach(l=>{drawText(ctx,l,cx,hlY,C.text,C.dark);hlY+=hSize*1.25;});

  // Thin rule
  ctx.strokeStyle=C.accent; ctx.lineWidth=1; ctx.globalAlpha=0.35;
  ctx.beginPath(); ctx.moveTo(cx-80,hlY+10); ctx.lineTo(cx+80,hlY+10); ctx.stroke();
  ctx.globalAlpha=1;

  if(slide.body){
    ctx.font=`28px ${BF}`; ctx.textAlign="center"; ctx.fillStyle=C.sub;
    wrapLines(ctx,slide.body,W-200).forEach(l=>{ctx.fillText(l,cx,hlY+52+28);hlY+=36;});
  }
  if(slide.cta){
    ctx.font=`bold 28px ${HF}`; ctx.textAlign="center"; ctx.fillStyle=C.accent;
    ctx.fillText(slide.cta,cx,H-90);
  }
}

// ─── MAIN DRAW ────────────────────────────────────────────

function drawSlide(ctx, W, H, slide, idx, total, opts) {
  const {theme,fontId,bgImg,treatment,imgOpacity,overlayDark,showNums,
         profileImg,name,handle,blueTick,websiteUrl,customBg,customAccent} = opts;
  const C = getColors(theme,customBg,customAccent);
  const F = getFont(fontId);
  const HF=`"${F.headline}"`, BF=`"${F.body}"`;
  const layout = slide.layout || "standard";

  // Base
  ctx.fillStyle=C.bg; ctx.fillRect(0,0,W,H);

  // Background image
  if (bgImg && treatment!=="none") {
    ctx.save();
    ctx.globalAlpha = treatment==="dim" ? imgOpacity/100 : 1;
    const sc=Math.max(W/bgImg.width,H/bgImg.height);
    ctx.drawImage(bgImg,(W-bgImg.width*sc)/2,(H-bgImg.height*sc)/2,bgImg.width*sc,bgImg.height*sc);
    ctx.restore();
    if (treatment==="gradient") {
      const d=Math.min(overlayDark/100,0.8);
      const g=ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,`rgba(0,0,0,${d*0.9})`); g.addColorStop(0.35,`rgba(0,0,0,${d*0.4})`);
      g.addColorStop(0.65,`rgba(0,0,0,${d*0.4})`); g.addColorStop(1,`rgba(0,0,0,${d*0.92})`);
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    }
  }

  // Theme elements — noise + brackets always on dark
  if (C.dark) {
    drawNoise(ctx,W,H,0.022);
    drawBrackets(ctx,W,H,C.accent,0.35);
    // Gold top wash for dark-gold
    if (theme==="dark-gold"||theme==="navy") {
      const tg=ctx.createLinearGradient(0,0,0,H*0.35);
      tg.addColorStop(0,`${C.accent}12`); tg.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=tg; ctx.fillRect(0,0,W,H*0.35);
    }
    if (theme==="midnight") {
      const gl=ctx.createRadialGradient(W*0.75,H*0.15,0,W*0.75,H*0.15,W*0.6);
      gl.addColorStop(0,"rgba(124,158,255,0.14)"); gl.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=gl; ctx.fillRect(0,0,W,H);
    }
    // Bottom fade
    const bf=ctx.createLinearGradient(0,H*0.65,0,H);
    bf.addColorStop(0,"rgba(0,0,0,0)"); bf.addColorStop(1,"rgba(0,0,0,0.55)");
    ctx.fillStyle=bf; ctx.fillRect(0,H*0.65,W,H*0.35);
  } else {
    // Light themes — subtle rule + dot grid
    ctx.fillStyle=C.accent; ctx.fillRect(60,54,100,2.5); ctx.globalAlpha=0.12; ctx.fillStyle=C.accent; ctx.fillRect(60,H-54,W-120,1); ctx.globalAlpha=1;
    ctx.save(); ctx.globalAlpha=0.03;
    for(let x=80;x<W-80;x+=44)for(let y=220;y<H-100;y+=44){ctx.fillStyle="#000";ctx.beginPath();ctx.arc(x,y,1.3,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }

  // Profile badge
  drawProfileBadge(ctx,W,profileImg,name,handle,blueTick,C,HF,BF,72);

  // Slide number watermark
  if (showNums) {
    ctx.save();
    const numStr=String(idx+1).padStart(2,"0");
    ctx.font=`bold ${Math.floor(H*0.25)}px ${HF}`;
    ctx.fillStyle=C.dark?"rgba(255,255,255,0.032)":"rgba(0,0,0,0.032)";
    ctx.textAlign="right"; ctx.textBaseline="bottom";
    ctx.fillText(numStr,W-40,H-32);
    ctx.textBaseline="alphabetic"; ctx.textAlign="left";
    ctx.font=`600 16px ${BF}`; ctx.fillStyle=`${C.accent}99`;
    ctx.textAlign="right"; ctx.fillText(`${idx+1} / ${total}`,W-62,62);
    ctx.restore();
  }

  // Layout render
  switch(layout) {
    case "cards": renderCards(ctx,W,H,slide,C,F); break;
    case "split": renderSplit(ctx,W,H,slide,C,F); break;
    case "icon-hero": renderIconHero(ctx,W,H,slide,C,F); break;
    case "quote": renderQuote(ctx,W,H,slide,C,F); break;
    default: renderStandard(ctx,W,H,slide,C,F);
  }

  // Brand footer
  const footerY=H-30;
  ctx.font=`600 18px ${BF}`; ctx.textAlign="center";
  ctx.fillStyle=C.dark?"rgba(255,255,255,0.22)":"rgba(0,0,0,0.22)";
  if(websiteUrl&&websiteUrl.trim()) ctx.fillText(websiteUrl.trim(),W/2,footerY);
}

// ─── SLIDE CANVAS ─────────────────────────────────────────

function SlideCanvas({slide,idx,total,opts}) {
  const ref=useRef(null);
  const key=JSON.stringify({slide,theme:opts.theme,fontId:opts.fontId,showNums:opts.showNums,name:opts.name,handle:opts.handle,blueTick:opts.blueTick,websiteUrl:opts.websiteUrl,ratio:opts.ratio,bgImageUrl:opts.bgImageUrl?"y":"n",profileDataUrl:opts.profileDataUrl?"y":"n",imgOpacity:opts.imgOpacity,overlayDark:opts.overlayDark,customBg:opts.customBg,customAccent:opts.customAccent});
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
  const [fontId,setFontId]=useState(S?.fontId||"montserrat");
  const [showNums,setShowNums]=useState(S?.showNums??true);
  const [treatment,setTreatment]=useState(S?.treatment||"gradient");
  const [imgOpacity,setImgOpacity]=useState(S?.imgOpacity||30);
  const [overlayDark,setOverlayDark]=useState(S?.overlayDark||60);
  const [customBg,setCustomBg]=useState(S?.customBg||"#0A0A0A");
  const [customAccent,setCustomAccent]=useState(S?.customAccent||"#C9A84C");

  const [topic,setTopic]=useState("");
  const [keyThemes,setKeyThemes]=useState("");
  const [angle,setAngle]=useState("");
  const [slideCount,setSlideCount]=useState(7);
  const [coverImage,setCoverImage]=useState(null);
  const [imageForAll,setImageForAll]=useState(false);

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
  const [lastTopic,setLastTopic]=useState("");

  const profileRef=useRef(null);
  const coverRef=useRef(null);

  useEffect(()=>{loadFonts().then(()=>setFontsLoaded(true));},[]);
  useEffect(()=>{saveData({appTheme,businessType,brandAnswers,voiceProfile,profileDataUrl,displayName,handle,blueTick,websiteUrl,showWebsite,slideTheme,fontId,showNums,treatment,imgOpacity,overlayDark,customBg,customAccent});},[appTheme,businessType,brandAnswers,voiceProfile,profileDataUrl,displayName,handle,blueTick,websiteUrl,showWebsite,slideTheme,fontId,showNums,treatment,imgOpacity,overlayDark,customBg,customAccent]);

  const handleImg=(e,set)=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>set(ev.target.result);r.readAsDataURL(f);};

  const fetchWithRetry=async(body,retries=2)=>{
    for(let i=0;i<=retries;i++){
      try{
        const res=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
        if(!res.ok)throw new Error(`HTTP ${res.status}`);
        return await res.json();
      }catch(e){if(i===retries)throw e;await new Promise(r=>setTimeout(r,1200));}
    }
  };

  const buildVoice=async()=>{
    setGenVoice(true);
    const bType=BUSINESS_TYPES.find(b=>b.id===businessType)?.label||"brand";
    const questions=BRAND_QUESTIONS[businessType]||BRAND_QUESTIONS.creator;
    const qa=questions.map(q=>`${q.label}\n${brandAnswers[q.key]||"Not provided"}`).join("\n\n");
    try{
      const d=await fetchWithRetry({model:"claude-opus-4-7",max_tokens:600,messages:[{role:"user",content:`Write a concise voice profile (under 180 words) for a ${bType} Instagram carousel generator. Based on:\n\n${qa}\n\nStart "Write in a tone that..." Be specific, not generic. Cover tone, audience, what to avoid, CTA style.`}]});
      setVoiceProfile(d.content?.find(b=>b.type==="text")?.text||"");
    }catch{setVoiceProfile("Write directly and honestly. Short punchy sentences. Speak to real problems. Never overpromise.");}
    setGenVoice(false);
  };

  const buildPrompt=(topicStr)=>{
    const bType=BUSINESS_TYPES.find(b=>b.id===businessType)?.label||"";
    const extras=[bType&&`Business type: ${bType}`,keyThemes&&`Key themes/words to include: ${keyThemes}`,angle&&`Specific angle: ${angle}`].filter(Boolean).join("\n");

    return `You are creating an Instagram carousel — both the content AND the visual design decisions.

Think of yourself as a creative director AND copywriter working together. Each slide should be visually distinct and designed to suit its content.

BRAND VOICE:
${voiceProfile||"Direct, honest, real. Short punchy sentences. Speak to genuine problems. No hype, no fluff."}

BRIEF:
Topic: "${topicStr}"
${extras}
Slides: ${slideCount}

YOUR JOB:
1. Write a carousel with a clear narrative arc — hook, reality, insight/shift, advice, CTA
2. For each slide, decide the best LAYOUT based on the content:
   - "standard" — headline + body text, works for most slides
   - "cards" — when you have 3-5 distinct points to list (add "items" array with label+text per item)
   - "split" — when comparing two things side by side (add "items" array with 2 items, each with label+sub, and add "vs_label")
   - "icon-hero" — for CTA slides or emotional beats — use a simple symbol in "icon_symbol" field (use a single unicode char like ✦ ◆ ⟡ ★)
   - "quote" — for a powerful single statement slide
3. For one or two key words in headlines, add "accent_word" field with that exact word — it will render in gold
4. Mix layouts — no two consecutive slides should use the same layout
5. Slide titles (tag): short, editorial, interesting — like a magazine section header. NOT "HOOK" or "CTA".
6. Headlines: max 8 words, punchy and specific
7. Body: 1-2 sentences max. Every word earns its place.
8. Last slide: use icon-hero layout with cta_items array (2 items max — primary and secondary action)
9. Use web search only if you need to verify a specific stat — max 1-2 stats in the whole carousel
10. Match language and energy to the business type and voice

Return ONLY a valid JSON array. No markdown. No HTML. No cite tags:
[{
  "tag": "EDITORIAL LABEL",
  "headline": "punchy headline",
  "body": "1-2 sentences",
  "layout": "standard|cards|split|icon-hero|quote",
  "accent_word": "optional single word from headline",
  "items": [],
  "vs_label": "VS",
  "icon_symbol": "✦",
  "cta_items": [],
  "cta": null
}]

Only the last slide needs cta or cta_items. All others have cta as null.`;
  };

  const sanitize=s=>({
    ...s,
    tag:(s.tag||"").replace(/<[^>]+>/g,"").trim(),
    headline:(s.headline||"").replace(/<[^>]+>/g,"").trim(),
    body:(s.body||"").replace(/<[^>]+>/g,"").trim(),
    cta:(s.cta||"").replace(/<[^>]+>/g,"").trim()||null,
  });

  const generate=async(topicOverride)=>{
    const t=topicOverride||topic;
    if(!t.trim()){setErr("Add a topic first.");return;}
    setErr(""); setStep("generating"); setLastTopic(t);
    try{
      const d=await fetchWithRetry({model:"claude-opus-4-7",max_tokens:3000,
        tools:[{type:"web_search_20250305",name:"web_search"}],
        messages:[{role:"user",content:buildPrompt(t)}]});
      const raw=d.content?.find(b=>b.type==="text")?.text||"";
      const clean=raw.replace(/<cite[^>]*>/g,"").replace(/<\/cite>/g,"").replace(/<[^>]+>/g,"");
      const m=clean.match(/\[[\s\S]*\]/);
      if(!m)throw new Error("no json");
      const parsed=JSON.parse(m[0]);
      setEditing(parsed.map(sanitize)); setActive(0); setStep("preview");
    }catch{setErr("Generation failed. Please try again.");setStep("setup");}
  };

  const regenerate=async()=>{
    await generate(lastTopic||topic);
  };

  const regenSlide=async()=>{
    if(!slidePrompt.trim())return; setRegenLoading(true);
    const cur=editing[active];
    try{
      const d=await fetchWithRetry({model:"claude-opus-4-7",max_tokens:600,
        messages:[{role:"user",content:`Rewrite this carousel slide following this instruction: "${slidePrompt}"\n\nCurrent slide:\n${JSON.stringify(cur,null,2)}\n\nBrand voice: ${voiceProfile||"Direct, honest, specific."}\n\nReturn ONLY a JSON object with the same structure. No HTML, no cite tags, no markdown.`}]});
      const raw=(d.content?.find(b=>b.type==="text")?.text||"").replace(/<[^>]+>/g,"");
      const m=raw.match(/\{[\s\S]*\}/);
      if(m){const u=JSON.parse(m[0]);const n=[...editing];n[active]={...sanitize(u)};setEditing(n);setSlidePrompt("");}
    }catch{}
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
    websiteUrl:showWebsite?websiteUrl:"",ratio,customBg,customAccent,
  }),[slideTheme,fontId,coverImage,imageForAll,treatment,imgOpacity,overlayDark,showNums,profileDataUrl,displayName,handle,blueTick,websiteUrl,showWebsite,ratio,customBg,customAccent]);

  const inp={width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"11px 14px",color:T.text,fontSize:14,fontFamily:"inherit"};
  const lbl={display:"block",color:T.muted,fontSize:10,letterSpacing:2.5,marginBottom:6,textTransform:"uppercase",fontWeight:700};
  const chip=(on)=>({background:on?`${T.accent}14`:T.surface2,border:`1px solid ${on?T.accent:T.border}`,borderRadius:7,padding:"9px 12px",cursor:"pointer",textAlign:"left",color:T.text,fontFamily:"inherit",transition:"all 0.14s"});
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
          <span style={{fontSize:14,fontWeight:800,color:T.accent}}>Build with Tav</span>
          <span style={{color:T.border}}>|</span>
          <span style={{fontSize:13,fontWeight:600,color:T.muted}}>Carousel Generator</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {step==="preview"&&(
            <>
              <button onClick={regenerate} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.muted,padding:"6px 13px",borderRadius:6,fontSize:12,fontWeight:600}}>↺ Regenerate</button>
              <button onClick={()=>{setStep("setup");setEditing([]);}} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.muted,padding:"6px 13px",borderRadius:6,fontSize:12,fontWeight:600}}>← New</button>
            </>
          )}
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
                  <input value={topic} onChange={e=>setTopic(e.target.value)}
                    placeholder={businessType==="restaurant"?"e.g. 5 reasons our Sunday roast sells out every week":businessType==="gym"?"e.g. Why most people quit the gym within 6 weeks":businessType==="coach"?"e.g. The real reason high achievers still feel empty":businessType==="creator"?"e.g. Why most creators never make money from their content":"e.g. Why most businesses fail on social media in year one"}
                    style={{...inp,fontSize:15,padding:"13px 15px"}} />
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div>
                    <label style={lbl}>Key themes / words <span style={{letterSpacing:0,fontSize:9,fontWeight:500}}>(optional)</span></label>
                    <input value={keyThemes} onChange={e=>setKeyThemes(e.target.value)} placeholder={businessType==="restaurant"?"e.g. seasonal, locally sourced":businessType==="gym"?"e.g. strength, community, results":businessType==="coach"?"e.g. burnout, career change":"e.g. 2026, UK market, real examples"} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Specific angle <span style={{letterSpacing:0,fontSize:9,fontWeight:500}}>(optional)</span></label>
                    <input value={angle} onChange={e=>setAngle(e.target.value)} placeholder={businessType==="restaurant"?"e.g. focus on the story, not just the food":businessType==="coach"?"e.g. lean into the emotional side":"e.g. focus on the human side, not just tactics"} style={inp} />
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:20}}>
                  <div>
                    <label style={lbl}>Slides</label>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <button onClick={()=>setSlideCount(Math.max(3,slideCount-1))} style={{width:32,height:32,borderRadius:6,background:T.surface2,border:`1px solid ${T.border}`,color:T.text,fontSize:18,fontWeight:700}}>−</button>
                      <span style={{fontSize:24,fontWeight:800,color:T.accent,minWidth:24,textAlign:"center"}}>{slideCount}</span>
                      <button onClick={()=>setSlideCount(Math.min(12,slideCount+1))} style={{width:32,height:32,borderRadius:6,background:T.surface2,border:`1px solid ${T.border}`,color:T.text,fontSize:18,fontWeight:700}}>+</button>
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
                <button onClick={()=>generate()} disabled={!topic.trim()} style={{background:topic.trim()?T.accent:T.surface2,color:topic.trim()?T.accentText:T.muted,border:"none",borderRadius:10,padding:"14px 40px",fontSize:15,fontWeight:800,width:"100%"}}>
                  Generate Carousel →
                </button>
              </div>
            )}

            {tab==="visual"&&(
              <div style={{display:"flex",flexDirection:"column",gap:22}}>
                <div>
                  <label style={lbl}>Colour Theme</label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                    {SLIDE_THEMES.map(st=>(
                      <button key={st.id} onClick={()=>setSlideTheme(st.id)} style={{...chip(slideTheme===st.id),display:"flex",alignItems:"center",gap:8,padding:"10px 12px"}}>
                        <div style={{display:"flex",gap:3,flexShrink:0}}>
                          <div style={{width:14,height:14,borderRadius:3,background:st.id==="custom"?customBg:st.preview[0],border:"1px solid rgba(0,0,0,0.15)"}} />
                          <div style={{width:14,height:14,borderRadius:3,background:st.id==="custom"?customAccent:st.preview[1]}} />
                        </div>
                        <span style={{fontSize:11,fontWeight:700,color:slideTheme===st.id?T.accent:T.text}}>{st.label}</span>
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
                    {FONTS.map(f=>(
                      <button key={f.id} onClick={()=>setFontId(f.id)} style={{background:fontId===f.id?`${T.accent}14`:T.surface2,border:`1px solid ${fontId===f.id?T.accent:T.border}`,borderRadius:6,padding:"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontFamily:`"${f.headline}",serif`,fontSize:13,fontWeight:700,color:fontId===f.id?T.accent:T.text}}>{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Image Treatment</label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    {[["gradient","Gradient Overlay"],["dim","Dimmed"],["none","Text Only"]].map(([id,label])=>(
                      <button key={id} onClick={()=>setTreatment(id)} style={{...chip(treatment===id),textAlign:"center",padding:"10px"}}>
                        <div style={{fontSize:12,fontWeight:700,color:treatment===id?T.accent:T.text}}>{label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                {treatment==="dim"&&<div><label style={lbl}>Opacity — {imgOpacity}%</label><input type="range" min={5} max={55} value={imgOpacity} onChange={e=>setImgOpacity(+e.target.value)} /></div>}
                {treatment==="gradient"&&<div><label style={lbl}>Overlay — {overlayDark}%</label><input type="range" min={20} max={80} value={overlayDark} onChange={e=>setOverlayDark(+e.target.value)} /></div>}
                <div onClick={()=>setShowNums(!showNums)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"11px 14px",cursor:"pointer"}}>
                  <div><div style={{fontWeight:700,fontSize:13}}>Slide Numbers</div><div style={{color:T.muted,fontSize:11,marginTop:2}}>Editorial watermark numbers on each slide</div></div>
                  <Toggle on={showNums} set={setShowNums} T={T} />
                </div>
              </div>
            )}

            {tab==="identity"&&(
              <div style={{display:"flex",flexDirection:"column",gap:18}}>
                {!businessType?(
                  <div style={{textAlign:"center",padding:"40px 0",color:T.muted}}>
                    <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>Select your business type first</div>
                    <div style={{fontSize:13}}>Go to Content tab and choose what you are</div>
                  </div>
                ):(
                  <>
                    <div style={{color:T.muted,fontSize:13,lineHeight:1.7}}>Answer these questions and we'll build your AI voice profile — what gets sent with every carousel prompt.</div>
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
                        <textarea value={voiceProfile} onChange={e=>setVoiceProfile(e.target.value)} rows={6} style={{...inp,resize:"vertical",lineHeight:1.7}} />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

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
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setShowWebsite(!showWebsite)}>
                    <div><div style={{fontWeight:700,fontSize:13}}>Website Footer</div><div style={{color:T.muted,fontSize:11,marginTop:2}}>Show URL at bottom of every slide</div></div>
                    <Toggle on={showWebsite} set={setShowWebsite} T={T} />
                  </div>
                  {showWebsite&&<input value={websiteUrl} onChange={e=>setWebsiteUrl(e.target.value)} placeholder="e.g. www.buildwithtav.co" style={{...inp,marginTop:10}} />}
                </div>
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
            <div style={{color:T.accent,fontSize:9,letterSpacing:4,marginBottom:8,textTransform:"uppercase",fontWeight:700}}>Creating</div>
            <div style={{fontSize:19,fontWeight:800,marginBottom:6}}>Designing your carousel</div>
            <div style={{color:T.muted,fontSize:13}}>Writing content and deciding layouts for {slideCount} slides...</div>
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
                <div><label style={lbl}>CTA <span style={{color:T.muted,letterSpacing:0,fontSize:9,fontWeight:500}}>(leave blank to hide)</span></label><input value={editing[active]?.cta||""} onChange={e=>updateSlide(active,"cta",e.target.value||null)} placeholder="e.g. Free preview → bio" style={inp} /></div>
                {treatment==="dim"&&<div><label style={lbl}>Opacity — {imgOpacity}%</label><input type="range" min={5} max={55} value={imgOpacity} onChange={e=>setImgOpacity(+e.target.value)} /></div>}
                {treatment==="gradient"&&<div><label style={lbl}>Overlay — {overlayDark}%</label><input type="range" min={20} max={80} value={overlayDark} onChange={e=>setOverlayDark(+e.target.value)} /></div>}
                <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12}}>
                  <label style={lbl}>AI Rewrite</label>
                  <textarea value={slidePrompt} onChange={e=>setSlidePrompt(e.target.value)} placeholder={`"Make this more punchy"\n"Add a specific stat"\n"Rewrite as a quote"`} rows={3} style={{...inp,resize:"vertical",lineHeight:1.5,marginBottom:8}} />
                  <button onClick={regenSlide} disabled={regenLoading||!slidePrompt.trim()} style={{background:slidePrompt.trim()?T.accent:T.surface2,border:"none",color:slidePrompt.trim()?T.accentText:T.muted,padding:"9px",borderRadius:7,fontWeight:700,fontSize:13,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {regenLoading?<><Spin c={T.accentText}/>Rewriting...</>:"Rewrite This Slide →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{borderTop:`1px solid ${T.border}`,padding:"14px 28px",textAlign:"center",marginTop:40}}>
        <span style={{color:T.muted,fontSize:12}}>
          Created by <a href="https://www.buildwithtav.co" target="_blank" rel="noopener noreferrer" style={{color:T.accent,fontWeight:700}}>Build with Tav</a> · <a href="https://www.buildwithtav.co" target="_blank" rel="noopener noreferrer" style={{color:T.muted}}>buildwithtav.co</a>
        </span>
      </div>
    </div>
  );
}
