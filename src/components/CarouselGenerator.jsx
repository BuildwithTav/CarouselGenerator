"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const GOLD = "#C9A84C";
const STORAGE_KEY = "bwt_v11";

const ACCENT_SWATCHES = [
  { id:"gold",      label:"Gold",      hex:"#C9A84C" },
  { id:"champagne", label:"Champagne", hex:"#E8D5A3" },
  { id:"coral",     label:"Coral",     hex:"#E8553E" },
  { id:"dustyrose", label:"Dusty Rose",hex:"#C4756A" },
  { id:"sky",       label:"Sky",       hex:"#60A5FA" },
  { id:"sage",      label:"Sage",      hex:"#6BAA8E" },
  { id:"lilac",     label:"Lilac",     hex:"#A78BFA" },
  { id:"warmwhite", label:"Warm White",hex:"#F5EDE0" },
];
const BG_COLOUR_PRESETS = [
  { id:"obsidian",   label:"Obsidian",   hex:"#0A0A0A" },
  { id:"indigo",     label:"Indigo",     hex:"#1B1F5E" },
  { id:"teal",       label:"Teal",       hex:"#0D4F4F" },
  { id:"sage",       label:"Sage",       hex:"#3D5A47" },
  { id:"plum",       label:"Plum",       hex:"#3D1A3D" },
  { id:"rust",       label:"Rust",       hex:"#8B3A2A" },
  { id:"terracotta", label:"Terracotta", hex:"#C4623A" },
  { id:"blush",      label:"Blush",      hex:"#E8C4B8" },
  { id:"cream",      label:"Cream",      hex:"#FAF7F2" },
  { id:"white",      label:"White",      hex:"#FFFFFF" },
];

const FONTS = [
  { id:"montserrat",   label:"Montserrat",        css:"Montserrat" },
  { id:"playfair",     label:"Playfair Display",  css:"Playfair Display" },
  { id:"poppins",      label:"Poppins",           css:"Poppins" },
  { id:"inter",        label:"Inter",             css:"Inter" },
  { id:"oswald",       label:"Oswald",            css:"Oswald" },
  { id:"dancing",      label:"Dancing Script",    css:"Dancing Script" },
  { id:"raleway",      label:"Raleway",           css:"Raleway" },
  { id:"lato",         label:"Lato",              css:"Lato" },
  { id:"roboto",       label:"Roboto",            css:"Roboto" },
  { id:"ubuntu",       label:"Ubuntu",            css:"Ubuntu" },
  { id:"nunito",       label:"Nunito",            css:"Nunito" },
  { id:"sourcesans",   label:"Source Sans",       css:"Source Sans 3" },
  { id:"crimson",      label:"Crimson Text",      css:"Crimson Text" },
  { id:"merriweather", label:"Merriweather",      css:"Merriweather" },
  { id:"bebasneue",    label:"Bebas Neue",        css:"Bebas Neue" },
  { id:"abril",        label:"Abril Fatface",     css:"Abril Fatface" },
  { id:"pacifico",     label:"Pacifico",          css:"Pacifico" },
  { id:"josefin",      label:"Josefin Sans",      css:"Josefin Sans" },
  { id:"quicksand",    label:"Quicksand",         css:"Quicksand" },
  { id:"dmserif",      label:"DM Serif Display",  css:"DM Serif Display" },
  { id:"cormorant",    label:"Cormorant Garamond",css:"Cormorant Garamond" },
  { id:"righteous",    label:"Righteous",         css:"Righteous" },
];

const HEADLINE_STYLES = [
  { id:"bold",      label:"Bold",      desc:"Mixed case, max impact",   transform:"none",       letterSpacing:"-1px" },
  { id:"upper",     label:"Uppercase", desc:"All caps, high energy",    transform:"uppercase",  letterSpacing:"1px"  },
  { id:"serif",     label:"Serif",     desc:"Elegant, authoritative",   transform:"none",       letterSpacing:"-0.5px", forceFont:"Playfair Display" },
  { id:"minimal",   label:"Minimal",   desc:"Clean, understated",       transform:"none",       letterSpacing:"0px"  },
];

const BUSINESS_TYPES = [
  { id:"marketer",   label:"Digital Marketer",        audience:"content creators and online entrepreneurs" },
  { id:"coach",      label:"Coach / Consultant",      audience:"people looking to grow or transform" },
  { id:"fitness",    label:"Fitness / Personal Trainer", audience:"people wanting to get fit or lose weight" },
  { id:"beauty",     label:"Beauty / Salon",          audience:"clients looking for beauty and self-care" },
  { id:"restaurant", label:"Restaurant / Café",       audience:"diners and food lovers" },
  { id:"realestate", label:"Real Estate",             audience:"buyers, sellers, and property investors" },
  { id:"ecommerce",  label:"E-commerce / Product Brand", audience:"online shoppers and customers" },
  { id:"other",      label:"Other",                   audience:"your target audience" },
];

const BRIEF_PLACEHOLDERS = {
  marketer:   "Title: The reason your content gets views but zero clients.\nSlides 2-4: one specific reason each, keep it direct.\nFinal slide: follow CTA only.",
  coach:      "Title: The question every client asks me in week one.\nSlides 2-4: break down the answer step by step.\nFinal slide: one soft CTA only.",
  fitness:    "Title: Why most people quit the gym after 3 weeks.\nSlides 2-4: one real reason each with a fix.\nFinal slide: follow for daily tips.",
  beauty:     "Title: What nobody tells you about your skincare routine.\nSlides 2-4: one insight per slide, specific.\nFinal slide: follow CTA only.",
  restaurant: "Title: The one thing that keeps customers coming back.\nSlides 2-4: specific details — food, service, atmosphere.\nFinal slide: follow to see behind the scenes.",
  realestate: "Title: What nobody tells you before buying your first home.\nSlides 2-4: one honest insight each.\nFinal slide: save this and come back to it.",
  ecommerce:  "Title: Why your product page is losing sales silently.\nSlides 2-4: one reason each with a fix.\nFinal slide: follow CTA only.",
  other:      "Title: The thing nobody tells you about starting out.\nSlides 2-4: one real insight each, keep it grounded.\nFinal slide: follow CTA only.",
};

const PRESET_BG_COLOURS = [
  "#0A0A0A","#1B1F5E","#0D4F4F","#3D5A47","#3D1A3D","#8B3A2A","#C4623A","#E8C4B8","#FAF7F2","#FFFFFF"
];
const PRESET_ACCENT_COLOURS = [
  "#C9A84C","#E8D5A3","#E8553E","#C4756A","#60A5FA","#6BAA8E","#A78BFA","#F5EDE0","#0A0A0A"
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

function loadS() { try { if (typeof window === "undefined") return null; return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null"); } catch { return null; } }
function saveS(d) { try { if (typeof window === "undefined") return; localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }
function loadHistory() { try { if (typeof window === "undefined") return []; return JSON.parse(localStorage.getItem("bwt_history")||"[]"); } catch { return []; } }
function saveHistory(h) { try { if (typeof window === "undefined") return; localStorage.setItem("bwt_history", JSON.stringify(h.slice(0,10))); } catch {} }
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

// ─── PEXELS MODAL ────────────────────────────────────────────────────────────

function PexelsModal({ open, onClose, onSelect, A, GOLD }) {
  const [pxQuery, setPxQuery] = useState("");
  const [pxResults, setPxResults] = useState([]);
  const [pxLoading, setPxLoading] = useState(false);
  const [pxError, setPxError] = useState("");
  const [pxPage, setPxPage] = useState(1);
  const [pxHasMore, setPxHasMore] = useState(false);
  const [pxSelecting, setPxSelecting] = useState(null);
  const pxInputRef = useRef(null);

  useEffect(() => {
    if (open) { setTimeout(() => pxInputRef.current?.focus(), 100); }
    else { setPxQuery(""); setPxResults([]); setPxError(""); setPxPage(1); setPxHasMore(false); setPxSelecting(null); }
  }, [open]);

  if (!open) return null;

  const pxSearch = async (q, p = 1) => {
    if (!q.trim()) return;
    setPxLoading(true); setPxError("");
    if (p === 1) setPxResults([]);
    try {
      const res = await fetch("/api/pexels?" + new URLSearchParams({ query: q.trim(), per_page: "20", page: String(p) }));
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPxResults(prev => p === 1 ? data.photos : [...prev, ...data.photos]);
      setPxHasMore(!!data.next_page);
      setPxPage(p);
    } catch(e) { setPxError("Search failed — check your connection and try again."); }
    setPxLoading(false);
  };

  const pxHandleSelect = async (photo) => {
    setPxSelecting(photo.id);
    try {
      // Proxy the image through our server to avoid CORS issues
      const proxyRes = await fetch("/api/pexels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: photo.url }),
      });
      const proxyData = await proxyRes.json();
      if (!proxyData.dataUrl) throw new Error("Proxy failed");
      await onSelect(proxyData.dataUrl);
      onClose();
    } catch(e) { console.error("Pexels select failed:", e); }
    setPxSelecting(null);
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3000,padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#FFF",borderRadius:16,width:"100%",maxWidth:720,maxHeight:"85vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,0.3)"}}>
        <div style={{padding:"20px 20px 16px",borderBottom:"1px solid #E8E5E0",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:"#0A0A0A"}}>Search Pexels</div>
              <div style={{fontSize:11,color:"#8A8780",marginTop:2}}>Free high-quality backgrounds · Photos by <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" style={{color:GOLD,textDecoration:"none"}}>Pexels</a></div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,color:"#8A8780",cursor:"pointer",padding:4}}>✕</button>
          </div>
          <div style={{display:"flex",gap:8}}>
            <input
              ref={pxInputRef}
              value={pxQuery}
              onChange={e=>setPxQuery(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&pxSearch(pxQuery)}
              placeholder="dark background, bokeh, nature, abstract..."
              style={{flex:1,padding:"10px 14px",background:"#F5F3EF",border:"1.5px solid #E8E5E0",borderRadius:9,color:"#0A0A0A",fontSize:14,fontFamily:"inherit",outline:"none"}}
            />
            <button
              onClick={()=>pxSearch(pxQuery)}
              disabled={pxLoading||!pxQuery.trim()}
              style={{padding:"10px 20px",background:pxQuery.trim()?"#0A0A0A":"#E8E5E0",color:"#FFF",borderRadius:9,fontWeight:700,fontSize:13,border:"none",cursor:pxQuery.trim()?"pointer":"default",display:"flex",alignItems:"center",gap:6,flexShrink:0}}
            >
              {pxLoading&&pxPage===1?"Searching...":"Search"}
            </button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:16}}>
          {pxError&&<div style={{textAlign:"center",padding:"40px 0",color:"#c0392b",fontSize:13}}>{pxError}</div>}
          {!pxError&&pxResults.length===0&&!pxLoading&&(
            <div style={{textAlign:"center",padding:"60px 0",color:"#8A8780",fontSize:13}}>
              {pxQuery?"No results — try a different search":"Search for backgrounds above"}
            </div>
          )}
          {pxLoading&&pxPage===1&&<div style={{textAlign:"center",padding:"40px 0",color:"#8A8780",fontSize:13}}>Searching...</div>}
          {pxResults.length>0&&(
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
                {pxResults.map(photo=>(
                  <div
                    key={photo.id}
                    onClick={()=>!pxSelecting&&pxHandleSelect(photo)}
                    style={{position:"relative",borderRadius:8,overflow:"hidden",aspectRatio:"3/4",cursor:pxSelecting?"wait":"pointer",border:"2px solid #E8E5E0",transition:"transform 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.02)";e.currentTarget.style.borderColor=GOLD;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor="#E8E5E0";}}
                  >
                    <img src={photo.thumb} alt={photo.alt} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} loading="lazy"/>
                    {pxSelecting===photo.id&&(
                      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700}}>Adding...</div>
                    )}
                    <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"20px 6px 6px",background:"linear-gradient(to bottom,transparent,rgba(0,0,0,0.7))",fontSize:9,color:"rgba(255,255,255,0.7)",fontWeight:600}}>
                      {photo.photographer}
                    </div>
                  </div>
                ))}
              </div>
              {pxHasMore&&(
                <button onClick={()=>pxSearch(pxQuery,pxPage+1)} disabled={pxLoading} style={{width:"100%",padding:"12px",background:"#F5F3EF",border:"1.5px solid #E8E5E0",borderRadius:9,color:"#0A0A0A",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                  {pxLoading?"Loading...":"Load more"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SLIDE HTML BUILDER ───────────────────────────────────

function buildSlideHTML(slide, idx, total, opts, isCover = false) {
  const {
    fontId, headlineStyle, bgMode, templateBgUrl, overlayDark,
    coverImageUrl, coverPosition, badgeArea, photoOpacity, customColourDark, slideTextDark,
    profileUrl, name, handle, blueTick, websiteUrl, showNums,
    accentColor, ratio, coverImgPos, templateImgPos, bgColour, gradientMode,
  } = opts;
  const coverPos2 = coverImgPos || {x:50,y:50};
  const templatePos = templateImgPos || {x:50,y:50};

  const accent = accentColor || GOLD;
  const noImage = bgMode === "custom" && !opts.templateBgUrl && !(isCover ? !!coverImageUrl : false);
  const effectiveColourDark = isCover ? (customColourDark??true) : (slideTextDark??true);
  const isDark = bgMode === "dark" ? true : bgMode === "light" ? false : noImage ? false : (bgMode === "colour" || bgMode === "custom" || !!coverImageUrl) ? effectiveColourDark : true;
  const colourTextDark = !isDark;
  const slideBg = bgMode === "light" ? "#F5F3EF" : bgMode === "colour" ? (opts.bgColour||"#1a1a2e") : (bgMode === "custom" && !opts.templateBgUrl && !(isCover && opts.coverImageUrl)) ? "#F5F3EF" : "#0A0A0A";
  // For image/cover photo modes: if opacity < 100, white shows behind faded photo
  const bgForOpacity = (bgMode === "custom" || (isCover && !!coverImageUrl)) && (photoOpacity||100) < 100 ? "#FFFFFF" : null;
  const coverHasImage = isCover && !!coverImageUrl;
  const isPortrait = ratio === "portrait";
  const W = 1080, H = isPortrait ? 1920 : 1350;
  const layout = slide.layout || "standard";
  // Cover: use cover photo if set; else inherit Visual tab (but if Visual tab = "custom" image, fall back to no image on cover)
  const bgImageUrl = isCover
    ? (coverImageUrl || null)  // cover only uses its own photo, never the template image
    : (bgMode === "custom" ? templateBgUrl : null);
  // Cover slide background: if no cover photo, inherit slideBg from Visual tab setting (but "custom" mode falls to dark)
  const coverFallbackBg = (!isCover || coverImageUrl) ? slideBg : (bgMode === "custom" && !opts.templateBgUrl ? "#F5F3EF" : bgMode === "custom" ? "#0A0A0A" : slideBg);
  const effectiveSlideBg = isCover ? coverFallbackBg : slideBg;
  const forceLight = (coverHasImage || (bgMode === "custom" && bgImageUrl)) ? !effectiveColourDark : false;
  const C = {
    bg: slideBg,
    accent,
    text: forceLight ? "#0A0A0A" : (isDark ? "#FFFFFF" : "#0A0A0A"),
    sub: forceLight ? "#0A0A0A" : (isDark ? "#FFFFFF" : "#0A0A0A"),
    dark: forceLight ? false : isDark,
  };

  const hs = HEADLINE_STYLES.find(h => h.id === headlineStyle) || HEADLINE_STYLES[0];
  const baseFontObj = FONTS.find(f => f.id === fontId) || FONTS[0];
  const hlFont = hs.forceFont || baseFontObj.css;
  const bodyFont = baseFontObj.css;

  const pillBg = bgImageUrl
    ? badgeArea === "light" ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.58)"
    : C.dark ? "rgba(0,0,0,0.62)" : "rgba(255,255,255,0.88)";
  const pillText = bgImageUrl || C.dark ? "#fff" : "#111";
  const pillSub = bgImageUrl || C.dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
  const badgeTextColor = forceLight ? "#0A0A0A" : (C.dark || bgImageUrl ? "#FFFFFF" : "#0A0A0A");
  const badgeSubColor = forceLight ? "rgba(0,0,0,0.55)" : (C.dark || bgImageUrl ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)");
  const badgeTextShadow = bgImageUrl ? (forceLight ? "text-shadow:0 0 12px rgba(255,255,255,0.9);" : "text-shadow:0 1px 6px rgba(0,0,0,0.8);") : "";

  // Pre-compute glow for use inside base CSS — based on bgImageUrl and bgMode
  const hasPhotoOrColour = !!(bgImageUrl);
  const glowHL = hasPhotoOrColour ? (forceLight ? "text-shadow:0 0 20px rgba(255,255,255,0.9),0 0 40px rgba(255,255,255,0.5);" : "text-shadow:0 0 20px rgba(0,0,0,0.9),0 0 40px rgba(0,0,0,0.5);") : "";
  const glowBody = hasPhotoOrColour ? (forceLight ? "text-shadow:0 0 12px rgba(255,255,255,0.8);" : "text-shadow:0 0 12px rgba(0,0,0,0.8);") : "";

  function esc(s) { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

  function accentHL(text) {
    const aw = (slide.accent_word||"").trim();
    if (!aw) {
      return esc(hs.transform==="uppercase"?(text||"").toUpperCase():(text||""));
    }
    const escaped = aw.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const regex = new RegExp(escaped+"[.,!?:;]*");
    const match = text.match(regex);
    if (!match) {
      return esc(hs.transform==="uppercase"?(text||"").toUpperCase():(text||""));
    }
    const full = match[0];
    const i = text.indexOf(full);
    const before = hs.transform==="uppercase"?text.slice(0,i).toUpperCase():text.slice(0,i);
    const accentPart = hs.transform==="uppercase"?full.toUpperCase():full;
    const after = hs.transform==="uppercase"?text.slice(i+full.length).toUpperCase():text.slice(i+full.length);
    return `${esc(before)}<span style="color:${C.accent};text-shadow:-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000,0 0 3px rgba(0,0,0,0.4)">${esc(accentPart)}</span>${esc(after)}`;
  }

  const gFonts = `https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Poppins:wght@700;800;900&family=Inter:wght@700;800;900&family=Oswald:wght@600;700&family=Dancing+Script:wght@600;700&family=Raleway:wght@700;800;900&family=Lato:wght@700;900&family=Roboto:wght@700;900&family=Ubuntu:wght@700&family=Nunito:wght@700;800;900&family=Source+Sans+3:wght@700;900&family=Crimson+Text:wght@700&family=Merriweather:wght@700;900&family=Bebas+Neue&family=Abril+Fatface&family=Pacifico&family=Josefin+Sans:wght@700&family=Quicksand:wght@700&family=DM+Serif+Display&family=Cormorant+Garamond:wght@700&family=Righteous&display=swap`;
  const ts = (C.dark && !colourTextDark) || bgImageUrl ? "" : colourTextDark ? "" : "";
  const ts2 = (C.dark && !colourTextDark) || bgImageUrl ? "" : colourTextDark ? "" : "";

  const BADGE_BOTTOM = 230;
  const topPad = isPortrait ? 300 : 270;
  const botPad = isPortrait ? 300 : 270;

  const base = `
    @import url('${gFonts}');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    html, body { width:${W}px; height:${H}px; overflow:hidden; background:${bgForOpacity||effectiveSlideBg}; }
    .slide { width:${W}px; height:${H}px; overflow:hidden; background:${bgForOpacity||effectiveSlideBg}; font-family:'${bodyFont}',sans-serif; position:relative; color:${C.text}; box-shadow:inset 0 0 0 3px ${C.dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}; }
    .bg-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; object-position:${isCover?`${coverPos2.x}% ${coverPos2.y}%`:`${templatePos.x}% ${templatePos.y}%`}; opacity:${(photoOpacity||100)/100}; }
    .bg-ov { position:absolute; inset:0; z-index:1; pointer-events:none; }
    .noise { position:absolute; inset:0; z-index:2; pointer-events:none; opacity:0.3;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
      background-repeat:repeat; }
    .bk { position:absolute; width:52px; height:52px; z-index:3; }
    .tl { top:44px; left:52px; border-top:2.5px solid ${C.accent}; border-left:2.5px solid ${C.accent}; opacity:${C.dark?0.4:0.7}; }
    .tr { top:44px; right:52px; border-top:2.5px solid ${C.accent}; border-right:2.5px solid ${C.accent}; opacity:${C.dark?0.4:0.7}; }
    .bl { bottom:44px; left:52px; border-bottom:2.5px solid ${C.accent}; border-left:2.5px solid ${C.accent}; opacity:${C.dark?0.4:0.7}; }
    .br { bottom:44px; right:52px; border-bottom:2.5px solid ${C.accent}; border-right:2.5px solid ${C.accent}; opacity:${C.dark?0.4:0.7}; }
    .fade { position:absolute; bottom:0; left:0; right:0; height:75%; z-index:3; pointer-events:none; }
    .badge { position:absolute; top:158px; left:80px; z-index:10;
      display:inline-flex; align-items:center; gap:14px;
      background:transparent; padding:10px 0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif!important; }
    .av { width:110px; height:110px; border-radius:50%; border:3px solid ${C.accent};
      overflow:hidden; flex-shrink:0; background:${C.dark?"#1a1a1a":"#ddd"};
      display:flex; align-items:center; justify-content:center; position:relative; }
    .av img { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:100%; height:100%; object-fit:cover; }
    .av-i { font-size:44px; font-weight:900; color:${C.accent}; font-family:'${hlFont}',sans-serif; }
    .bn { font-size:22px; font-weight:800; color:${badgeTextColor}; line-height:1.2; font-family:'${bodyFont}',sans-serif; ${badgeTextShadow} }
    .bh { font-size:15px; color:${badgeSubColor}; font-family:'${bodyFont}',sans-serif; ${badgeTextShadow} }
    .tick { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; background:#1D9BF0; border-radius:50%; margin-left:5px; vertical-align:middle; position:relative; }
    .tick-mark { position:absolute; width:7px; height:4px; border-left:2px solid #fff; border-bottom:2px solid #fff; transform:rotate(-45deg); top:6px; left:5px; }
    .wm { position:absolute; bottom:28px; right:38px; z-index:3;
      font-size:${Math.floor(H*0.18)}px; font-weight:900; line-height:1;
      color:${C.dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.035)"};
      font-family:'${hlFont}',sans-serif; pointer-events:none; user-select:none; }
    .cnt { position:absolute; top:52px; right:60px; z-index:10;
      font-size:14px; font-weight:700; color:${C.accent}88; font-family:'${bodyFont}',sans-serif; }
    .site { position:absolute; bottom:48px; left:0; right:0; text-align:center; z-index:10;
      font-size:22px; color:${C.accent}88; font-family:'${bodyFont}',sans-serif; letter-spacing:1px; }
    .swipe { position:absolute; bottom:88px; left:0; right:0; z-index:10; display:flex; flex-direction:column; align-items:center; gap:8px; pointer-events:none; }
    .swipe-dots { display:flex; align-items:center; justify-content:center; gap:6px; }
    .swipe-dot { width:6px; height:6px; border-radius:50%; background:${C.accent}44; }
    .swipe-dot-active { width:18px; height:6px; border-radius:3px; background:${C.accent}; }
    .swipe-label { font-size:${Math.round(isPortrait?22:18)}px; letter-spacing:3px; text-transform:uppercase; font-weight:700; color:${C.accent}88; font-family:'${bodyFont}',sans-serif; display:flex; align-items:center; gap:6px; }
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
      .hl { font-size:${isPortrait?72:62}px; font-weight:800; line-height:1.15; letter-spacing:${hs.letterSpacing}; font-family:'${hlFont}',sans-serif; flex-shrink:0; white-space:pre-wrap; ${glowHL} }
      .body { font-size:${isPortrait?40:34}px; line-height:1.65; color:${C.sub}; max-width:860px; margin-top:28px; font-family:'${bodyFont}',sans-serif; ${glowBody} }
      .cta { margin-top:36px; border:1px solid ${C.accent}44; background:${C.accent}16; padding:22px 60px; border-radius:8px; font-size:${isPortrait?34:28}px; font-weight:800; color:${C.accent}; font-family:'${bodyFont}',sans-serif; width:100%; max-width:860px; text-align:center; flex-shrink:0; white-space:pre-wrap; }
    `,
    statement: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:${topPad}px 90px ${botPad}px; text-align:center; overflow:hidden; }
      .hl { font-size:${isPortrait?82:68}px; font-weight:800; line-height:1.1; letter-spacing:${hs.id==="upper"?"2px":"-2px"};  font-family:'${hlFont}',sans-serif; flex-shrink:0; }
      .body { font-size:${isPortrait?40:34}px; line-height:1.65; color:${C.sub}; max-width:800px; margin-top:28px; font-family:'${bodyFont}',sans-serif; ${glowBody} }
    `,
    split: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:${topPad}px 90px ${botPad}px; overflow:hidden; }
      .split-top { width:100%; text-align:center; z-index:4; margin-bottom:${isPortrait?24:16}px; flex-shrink:0; }
      .split-tag { display:inline-block; background:${C.accent}; color:${C.dark?"#000":"#fff"}; font-size:14px; font-weight:800; letter-spacing:2px; padding:8px 24px; border-radius:60px; font-family:'${bodyFont}',sans-serif; margin-bottom:16px; }
      .split-hl { font-size:${isPortrait?62:50}px; font-weight:800; line-height:1.15; letter-spacing:${hs.letterSpacing};  font-family:'${hlFont}',sans-serif; color:${C.text}; }
      .split-panels { width:100%; display:grid; grid-template-columns:1fr 1fr; z-index:3; flex:1; }
      .panel { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px 44px; text-align:center; gap:12px; overflow:hidden; }
      .panel:first-child { background:${C.accent}10; border-right:1px solid ${C.accent}28; }
      .pl { font-size:${isPortrait?54:44}px; font-weight:900; font-family:'${hlFont}',sans-serif; line-height:1.1; color:${C.text}; }
      .pa { color:${C.accent}; }
      .ps { font-size:${isPortrait?30:24}px; color:${C.sub}; font-family:'${bodyFont}',sans-serif; line-height:1.4; }
      .vs { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:6; width:80px; height:80px; border-radius:50%; background:${C.bg}; border:1.5px solid ${C.accent}44; display:flex; align-items:center; justify-content:center; }
      .vt { font-size:26px; font-weight:900; color:${C.accent}; font-family:'${bodyFont}',sans-serif; }
    `,
    cards: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:${topPad}px 90px ${botPad}px; overflow:hidden; }
      .hl { font-size:${isPortrait?66:54}px; font-weight:800; line-height:1.15; letter-spacing:${hs.letterSpacing};  text-align:center; margin-bottom:4px; font-family:'${hlFont}',sans-serif; flex-shrink:0; white-space:pre-wrap; }
      .cg { width:100%; display:flex; flex-direction:column; gap:${isPortrait?14:9}px; margin-top:20px; overflow:hidden; }
      .card { background:${C.dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.05)"}; border:1px solid ${C.accent}28; border-radius:10px; padding:${isPortrait?22:14}px 24px; display:flex; align-items:flex-start; gap:16px; flex-shrink:0; }
      .cn { font-size:${isPortrait?34:24}px; font-weight:900; color:${C.accent}; font-family:'${bodyFont}',sans-serif; flex-shrink:0; width:36px; line-height:1; }
      .ct { font-size:${isPortrait?32:24}px; color:${C.text}; font-family:'${bodyFont}',sans-serif; line-height:1.35; font-weight:600; }
      .cs { font-size:${isPortrait?26:20}px; color:${C.sub}; margin-top:2px; font-family:'${bodyFont}',sans-serif; }
    `,
    quote: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:${topPad}px 90px ${botPad}px; text-align:center; overflow:hidden; }

      .hl { font-size:${isPortrait?58:48}px; font-weight:800; line-height:1.15; letter-spacing:${hs.letterSpacing};  font-style:italic; font-family:'${hlFont}',sans-serif; }
      .body { font-size:${isPortrait?38:32}px; line-height:1.6; color:${C.sub}; max-width:760px; margin-top:28px; font-family:'${bodyFont}',sans-serif; ${glowBody} }
    `,
    hero: `
      .c { position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:${topPad}px 90px ${botPad}px; gap:24px; text-align:center; overflow:hidden; }

      .hl { font-size:${isPortrait?68:56}px; font-weight:800; line-height:1.15; letter-spacing:${hs.letterSpacing};  font-family:'${hlFont}',sans-serif; }
      .body { font-size:${isPortrait?38:32}px; line-height:1.6; color:${C.sub}; max-width:820px; font-family:'${bodyFont}',sans-serif; ${glowBody} }
      .cb { width:100%; max-width:860px; padding:${isPortrait?30:24}px 50px; border-radius:12px; font-size:${isPortrait?34:28}px; font-weight:800; font-family:'${bodyFont}',sans-serif; text-align:center; background:${C.accent}; color:${C.dark?"#000":"#fff"}; }
    `,
  };

  const coverPos = coverPosition || "centre";

  const coverBadgeHTML = `
    <div style="display:inline-flex;align-items:center;gap:14px;background:${pillBg};padding:10px 22px 10px 10px;border-radius:60px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);margin-bottom:24px;">
      <div style="width:80px;height:80px;border-radius:50%;border:3px solid ${C.accent};overflow:hidden;flex-shrink:0;background:${C.dark?"#1a1a1a":"#ddd"};display:flex;align-items:center;justify-content:center;position:relative;">
        ${profileUrl?`<img src="${profileUrl}"  style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100%;height:100%;object-fit:cover;"/>`:`<span style="font-size:32px;font-weight:900;color:${C.accent};font-family:'${hlFont}',sans-serif;">${esc((name||"?")[0].toUpperCase())}</span>`}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-start;">
        <div style="font-size:20px;font-weight:800;color:${pillText};line-height:1.2;font-family:'${bodyFont}',sans-serif;${badgeTextShadow}">${esc(name||"Your Brand")}${blueTick?` <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:#1D9BF0;border-radius:50%;margin-left:5px;position:relative;"><span style="position:absolute;width:7px;height:4px;border-left:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(-45deg);top:6px;left:5px;"></span></span>`:""}</div>
        <div style="font-size:15px;color:${pillSub};font-family:'${bodyFont}',sans-serif;${badgeTextShadow}">${esc(handle||"@yourhandle")}</div>
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
          <div style="font-size:${isPortrait?80:66}px;font-weight:800;line-height:1.1;letter-spacing:${hs.letterSpacing};font-family:'${hlFont}',sans-serif;color:${C.text};${isCentre?"text-align:center;":""}width:100%;white-space:pre-wrap;${glowHL}">${hl}</div>
          ${slide.body ? `<div style="font-size:${isPortrait?32:26}px;line-height:1.6;color:${C.sub};margin-top:24px;font-family:'${bodyFont}',sans-serif;${isCentre?"text-align:center;":""}${glowBody}">${accentHL(slide.body)}</div>` : ""}
        </div>`;
    }

    const hl = accentHL(slide.headline||"");
    const tag = slide.tag ? `<div style="margin-bottom:28px"><span class="tag">${esc(slide.tag.toUpperCase())}</span></div>` : "";
    const divider = `<div class="div" style="margin:28px auto"></div>`;
    const bodyText = (slide.body||"").replace(/\n/g,"<br>");
    const body = slide.body ? `<div class="body">${accentHL(bodyText)}</div>` : "";

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
  const overlayAlpha = (overlayDark||0)/100;
  const coverOverlayAlpha = overlayAlpha;
  const activeAlpha = isCover ? coverOverlayAlpha : overlayAlpha;
  const bgHtml = `
    ${hasBg ? `<img class="bg-img" src="${bgImageUrl}" />` : ""}
    ${activeAlpha > 0 ? `<div class="bg-ov" style="background:linear-gradient(to top,${gradientMode==="white"?`rgba(255,255,255,${Math.min(activeAlpha*0.95,0.95)}) 0%,rgba(255,255,255,${Math.min(activeAlpha*0.4,0.5)}) 50%,rgba(255,255,255,0) 100%`:`rgba(0,0,0,${Math.min(activeAlpha*0.95,0.92)}) 0%,rgba(0,0,0,${Math.min(activeAlpha*0.4,0.5)}) 50%,rgba(0,0,0,0) 100%`})"></div>` : ""}`;

  const avHtml = profileUrl
    ? `<img src="${profileUrl}" />`
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
  ${activeAlpha > 0 ? `<div class="fade" style="background:linear-gradient(to bottom,transparent,rgba(0,0,0,${Math.min(activeAlpha,0.95)}));"></div>` : ""}
  ${isCover ? "" : profileUrl ? `<div class="badge">
    <div class="av">${avHtml}</div>
    <div>
      <div class="bn">${esc(name||"Your Brand")}${blueTick?` <span class="tick"><span class="tick-mark"></span></span>`:""}</div>
      <div class="bh">${esc(handle||"@yourhandle")}</div>
    </div>
  </div>` : ""}
  ${showNums===true?`<div class="wm">${String(idx+1).padStart(2,"0")}</div><div class="cnt">${idx+1} / ${total}</div>`:""}
  ${layoutHTML()}
  ${isCover?'':`<div class="deco"><div class="deco-line"></div><div class="deco-diamond"></div><div class="deco-line"></div></div>`}
  ${websiteUrl?`<div class="site">${esc(websiteUrl)}</div>`:""}
  ${(()=>{
    if (idx === total - 1) return ""; // no indicator on last slide
    const dots = Array.from({length: total}, (_,di) => 
      di === idx
        ? `<div class="swipe-dot-active"></div>`
        : `<div class="swipe-dot"></div>`
    ).join("");
    const label = isCover ? `<div class="swipe-label"><span>Swipe for more</span><span style="font-size:${Math.round(isPortrait?22:18)}px;opacity:0.6;">→</span></div>` : "";
    return `<div class="swipe"><div class="swipe-dots">${dots}</div>${label}</div>`;
  })()}
</div>
</body></html>`;
}

// ─── PREVIEW ─────────────────────────────────────────────

function SlidePreview({ slide, idx, total, opts, onClick, isActive, isCover, previewSize, showWatermark }) {
  const ref = useRef(null);
  const isPortrait = opts.ratio === "portrait";
  const W = 1080, H = isPortrait ? 1920 : 1350;
  const previewW = previewSize || (isPortrait ? 180 : 280);
  const scale = previewW / W;
  const previewH = Math.round(H * scale);
  const html = buildSlideHTML(slide, idx, total, opts, isCover);

  useEffect(() => {
    const iframe = ref.current; if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open(); doc.write(html); doc.close();
  }, [html]);

  return (
    <div onClick={onClick} title={slide.tag||`Slide ${idx+1}`} style={{ cursor:"pointer", borderRadius:8, overflow:"hidden", border:`2px solid ${isActive?"#0A0A0A":"transparent"}`, transition:"border-color 0.15s", position:"relative", width:previewW, height:previewH, flexShrink:0 }}>
      <iframe ref={ref} style={{ width:W, height:H, border:"none", transform:`scale(${scale})`, transformOrigin:"top left", pointerEvents:"none", display:"block" }} sandbox="allow-same-origin allow-scripts" title={`slide-${idx+1}`}/>
    </div>
  );
}

// ─── DOWNLOAD ────────────────────────────────────────────
async function downloadSlideAsPNG(slide, idx, total, opts, filename, isCover=false) {
  const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const needsServer = mobile;
  let blob;
  if (needsServer) {
    const isPortrait = opts.ratio==="portrait";
    const W=1080, H=isPortrait?1920:1350;
    const html = buildSlideHTML(slide,idx,total,opts,isCover);
    const res = await fetch("/api/render-slide", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ html, width:W, height:H })
    });
    const data = await res.json();
    console.log("Slide render response:", res.status, data.error||"ok", "hasImage:", !!data.image);
    if (!data.image) throw new Error(data.error||"Render failed");
    const byteChars = atob(data.image);
    const byteArr = new Uint8Array(byteChars.length);
    for (let j=0;j<byteChars.length;j++) byteArr[j]=byteChars.charCodeAt(j);
    blob = new Blob([byteArr],{type:"image/png"});
  } else {
    blob = await new Promise((resolve, reject) => {
      const isPortrait = opts.ratio === "portrait";
      const W = 1080, H = isPortrait ? 1920 : 1350;
      const html = buildSlideHTML(slide, idx, total, opts, isCover);
      const iframe = document.createElement("iframe");
      iframe.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${W}px;height:${H}px;border:none;`;
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      doc.open(); doc.write(html); doc.close();
      setTimeout(async () => {
        try {
          const win = iframe.contentWindow;
          await new Promise(r => { const s=doc.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"; s.onload=r; s.onerror=r; doc.head.appendChild(s); setTimeout(r,4000); });
          if (!win.html2canvas) throw new Error("html2canvas not loaded");
          const canvas = await win.html2canvas(doc.querySelector(".slide")||doc.body, {useCORS:true,allowTaint:true,scale:1,width:W,height:H,windowWidth:W,windowHeight:H,backgroundColor:null,logging:false});
          canvas.toBlob(b => { document.body.removeChild(iframe); resolve(b); }, "image/png", 1.0);
        } catch(e) { document.body.removeChild(iframe); reject(e); }
      }, 2500);
    });
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download=filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}



function QuotePreview({ html, W, H, scale }) {
  const ref = useRef(null);
  useEffect(() => {
    const iframe = ref.current; if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open(); doc.write(html); doc.close();
  }, [html]);
  return <iframe ref={ref} style={{ width:W, height:H, border:"none", transform:`scale(${scale})`, transformOrigin:"top left", pointerEvents:"none", display:"block" }} sandbox="allow-same-origin allow-scripts"/>;
}

function PaymentBadges({ dark }) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginTop:12,flexWrap:"wrap"}}>
      {["Apple Pay","Klarna","Amazon Pay","Card"].map(m=>(
        <span key={m} style={{fontSize:10,fontWeight:700,padding:"3px 10px",background:dark?"rgba(255,255,255,0.1)":"#f0eeea",border:dark?"1px solid rgba(255,255,255,0.15)":"1px solid #ddd",borderRadius:20,color:dark?"rgba(255,255,255,0.5)":"#888"}}>{m}</span>
      ))}
    </div>
  );
}

function ContactForm({ A, inp, GOLD, userEmail }) {
  const [type, setType] = useState("Review");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const send = async () => {
    if (!message.trim()) { setErr("Please add a message."); return; }
    if (type === "Review" && !rating) { setErr("Please select a star rating."); return; }
    setSending(true); setErr("");
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: type === "Review" ? `Review — ${rating} stars` : type, 
          message, 
          email: userEmail 
        })
      });
      const d = await r.json();
      if (d.error) { setErr("Something went wrong — try again."); }
      else { setSent(true); setMessage(""); setRating(0); }
    } catch { setErr("Something went wrong — try again."); }
    setSending(false);
  };

  if (sent) return (
    <div style={{textAlign:"center",padding:"20px 0"}}>
      <div style={{fontSize:32,marginBottom:8}}>✓</div>
      <p style={{fontSize:14,fontWeight:700,margin:"0 0 4px"}}>Sent. Thank you.</p>
      <p style={{fontSize:12,color:A.muted,margin:0}}>I'll get back to you if needed.</p>
      <button onClick={()=>setSent(false)} style={{marginTop:12,background:"none",border:"none",color:GOLD,fontSize:12,fontWeight:700,cursor:"pointer"}}>Send another</button>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",gap:8}}>
        {["Review","Bug","Feature"].map(t=>(
          <button key={t} onClick={()=>{setType(t);setRating(0);setErr("");}} style={{flex:1,padding:"8px",background:type===t?A.text:A.bg,color:type===t?A.accentText:A.muted,border:`1.5px solid ${type===t?A.text:A.border}`,borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer"}}>
            {t==="Review"?"⭐ Review":t==="Bug"?"🐛 Bug":"💡 Feature"}
          </button>
        ))}
      </div>
      {type==="Review"&&(
        <div style={{display:"flex",gap:6}}>
          {[1,2,3,4,5].map(star=>(
            <button key={star} onClick={()=>setRating(star)} onMouseEnter={()=>setHovered(star)} onMouseLeave={()=>setHovered(0)}
              style={{fontSize:28,background:"none",border:"none",cursor:"pointer",color:(hovered||rating)>=star?GOLD:A.border,padding:0,lineHeight:1}}>★</button>
          ))}
        </div>
      )}
      <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder={type==="Review"?"What do you think of Carousel Studio?":type==="Bug"?"Describe the bug and what you were doing when it happened.":"What feature would make Carousel Studio better for you?"} rows={4} style={{...inp,resize:"vertical",lineHeight:1.6}}/>
      {err&&<p style={{color:"#c0392b",fontSize:12,margin:0}}>{err}</p>}
      <button onClick={send} disabled={sending||!message.trim()} style={{padding:"11px",background:message.trim()?A.text:A.border,color:A.accentText,borderRadius:9,fontWeight:700,fontSize:13,border:"none",cursor:message.trim()?"pointer":"default"}}>
        {sending?"Sending...":"Send"}
      </button>
    </div>
  );
}

export default function App() {
  const S = loadS();

  const [nav, setNav] = useState("generate");

  // ─── AUTH STATE ───────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authFirstName, setAuthFirstName] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [upgradePrompt, setUpgradePrompt] = useState(false);

  const getToken = () => { try { return localStorage.getItem("cs_token")||null; } catch { return null; } };
  const setToken = (t) => { try { localStorage.setItem("cs_token",t); } catch {} };
  const clearToken = () => { try { localStorage.removeItem("cs_token"); localStorage.removeItem("cs_refresh"); } catch {} };
  const getRefreshToken = () => { try { return localStorage.getItem("cs_refresh")||null; } catch { return null; } };
  const setRefreshToken = (t) => { try { localStorage.setItem("cs_refresh",t); } catch {} };

  const tryRefreshSession = async () => {
    const refresh = getRefreshToken();
    if (!refresh) return false;
    try {
      const { data, error } = await import("@supabase/supabase-js").then(({createClient}) => {
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        return sb.auth.refreshSession({ refresh_token: refresh });
      });
      if (error || !data?.session) return false;
      setToken(data.session.access_token);
      setRefreshToken(data.session.refresh_token);
      return true;
    } catch { return false; }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) { 
      tryRefreshSession().then(refreshed => {
        if (refreshed) {
          const newToken = getToken();
          fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+newToken}, body: JSON.stringify({ action:"me" }) })
            .then(r=>r.json()).then(d=>{ if (d.user) { setCurrentUser(d.user); setShowAuthModal(false); } else { clearToken(); setShowAuthModal(true); } })
            .catch(()=>{ clearToken(); setShowAuthModal(true); })
            .finally(()=>setAuthLoading(false));
        } else { setAuthLoading(false); setShowAuthModal(true); }
      });
      return;
    }
    fetch("/api/auth", {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
      body: JSON.stringify({ action:"me" })
    }).then(r=>r.json()).then(d=>{
      if (d.user) { 
        setCurrentUser(d.user); 
        setShowAuthModal(false);
        if (d.user && !isUnlimitedPlan(d.user.plan) && !d.user.is_admin && d.user.period_start) {
          const daysSince = (new Date() - new Date(d.user.period_start)) / (1000 * 60 * 60 * 24);
          if (daysSince >= 30) {
            fetch("/api/credits/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email: d.user.email }) })
              .then(()=>refreshUser()).catch(()=>{});
          }
        }
      }
      else { 
        tryRefreshSession().then(refreshed => {
          if (refreshed) {
            const newToken = getToken();
            fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+newToken}, body: JSON.stringify({ action:"me" }) })
              .then(r=>r.json()).then(d2=>{ if (d2.user) { setCurrentUser(d2.user); setShowAuthModal(false); } else { clearToken(); setShowAuthModal(true); } })
              .catch(()=>{ clearToken(); setShowAuthModal(true); });
          } else { clearToken(); setShowAuthModal(true); }
        });
      }
    }).catch(()=>{ clearToken(); setShowAuthModal(true); })
    .finally(()=>setAuthLoading(false));
  }, []);

  const sendOtp = async () => {
    if (!authFirstName.trim()) { setAuthError("Enter your first name."); return; }
    if (!authEmail.trim()) { setAuthError("Enter your email address."); return; }
    if (!marketingConsent) { setAuthError("Please agree to receive emails to continue."); return; }
    setAuthSubmitting(true); setAuthError("");
    try {
      const r = await fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"send-otp", email: authEmail.trim().toLowerCase() }) });
      const d = await r.json();
      if (d.error) { setAuthError(d.error); }
      else { setOtpSent(true); }
    } catch { setAuthError("Something went wrong — try again."); }
    setAuthSubmitting(false);
  };

  const verifyOtp = async () => {
    if (!otpCode.trim()) { setAuthError("Enter the 6 digit code."); return; }
    setAuthSubmitting(true); setAuthError("");
    try {
      const affiliateRef = getAffiliateRef();
      const r = await fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"verify-otp", email: authEmail.trim().toLowerCase(), token: otpCode.trim(), affiliateRef, firstName: authFirstName.trim(), marketingConsent }) });
      const d = await r.json();
      if (d.error) { setAuthError("Invalid code — check your email and try again."); }
      else { 
        // Clear any stale localStorage data from previous user
        try { 
          const keysToKeep = ["cs_token","cs_refresh"];
          Object.keys(localStorage).forEach(k => { if(!keysToKeep.includes(k)) localStorage.removeItem(k); });
        } catch {}
        setToken(d.access_token);
        if (d.refresh_token) setRefreshToken(d.refresh_token);
        setCurrentUser(d.user||{ email: d.email, plan:"free", credits_used:0, credits_limit:60 }); setShowAuthModal(false); 
      }
    } catch { setAuthError("Something went wrong — try again."); }
    setAuthSubmitting(false);
  };

  const logout = () => { clearToken(); setCurrentUser(null); setOtpSent(false); setOtpCode(""); setAuthEmail(""); setShowAuthModal(true); };

  const refreshUser = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const r = await fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+token}, body: JSON.stringify({ action:"me" }) });
      const d = await r.json();
      if (d.user) setCurrentUser(d.user);
    } catch {}
  };

  const isUnlimitedPlan = (plan) => false;

  const creditsRemaining = () => {
    if (!currentUser) return 0;
    if (isUnlimitedPlan(currentUser.plan) || currentUser.is_admin) return "∞";
    const limit = (currentUser.credits_limit||60) + (currentUser.bonus_credits||0);
    return Math.max(0, limit - (currentUser.credits_used||0));
  };

  const canGenerate = () => {
    if (!currentUser) return false;
    if (isUnlimitedPlan(currentUser.plan) || currentUser.is_admin) return true;
    const limit = (currentUser.credits_limit||60) + (currentUser.bonus_credits||0);
    return (currentUser.credits_used||0) < limit;
  };

  const isLastCredit = () => {
    if (!currentUser || isUnlimitedPlan(currentUser.plan) || currentUser.is_admin) return false;
    return creditsRemaining() === 1;
  };

  const confirmLastCredit = () => true;

  const checkMonthlyReset = async () => {
    if (!currentUser || isUnlimitedPlan(currentUser.plan) || currentUser.is_admin) return;
    const periodStart = currentUser.period_start ? new Date(currentUser.period_start) : null;
    if (!periodStart) return;
    const now = new Date();
    const daysSince = (now - periodStart) / (1000 * 60 * 60 * 24);
    if (daysSince >= 30) {
      try {
        await fetch("/api/credits/reset", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email: currentUser.email }) });
        setCurrentUser(u => u ? ({...u, credits_used: 0, period_start: now.toISOString()}) : u);
      } catch {}
    }
  };

  const [upgrading, setUpgrading] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [affiliateStats, setAffiliateStats] = useState(null);
  const [affiliateLoading, setAffiliateLoading] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("bank");
  // Templates tab state
  const [tmplSelected, setTmplSelected] = useState(null);
  const [tmplSlideCount, setTmplSlideCount] = useState(6);
  const [tmplSlides, setTmplSlides] = useState(Array(12).fill(null).map(()=>({image:null,image2:null,imagePos:{x:50,y:50},image2Pos:{x:50,y:50},headline:"",subline:"",bodyText:"",accentText:"",number:6,topicLine:"PLACES YOU MUST VISIT BEFORE",subject:"2026 ENDS",storyText:"",rawText:"",pillText:""})));
  const [tmplEffect, setTmplEffect] = useState("clean");
  const [tmplFont, setTmplFont] = useState("Bebas Neue");
  const [tmplFontSize, setTmplFontSize] = useState(72);
  const [tmplAccentLineColor, setTmplAccentLineColor] = useState("#BB9900");
  const [tmplFavColors, setTmplFavColors] = useState(()=>{try{return JSON.parse(localStorage.getItem("bwt_tmpl_fav_colors")||"[null,null,null]");}catch{return[null,null,null];}});
  const [tmplShowCounter, setTmplShowCounter] = useState(false);
  const [tmplRecentFonts, setTmplRecentFonts] = useState(()=>{try{return JSON.parse(localStorage.getItem("bwt_tmpl_recent_fonts")||"[]");}catch{return[];}});
  const [tmplContentStyleTab, setTmplContentStyleTab] = useState("content");
  const [tmplShowInspo, setTmplShowInspo] = useState(true);
  const [tmplShowCta, setTmplShowCta] = useState(false);
  const [tmplCtaType, setTmplCtaType] = useState("comment");
  const [tmplCtaKeyword, setTmplCtaKeyword] = useState("");
  const [tmplCtaTopLine, setTmplCtaTopLine] = useState("");
  const [tmplCtaRewardLine, setTmplCtaRewardLine] = useState("");
  const [tmplCtaLine2, setTmplCtaLine2] = useState("");
  const [tmplCtaGenerating, setTmplCtaGenerating] = useState(false);
  const [tmplCtaBg, setTmplCtaBg] = useState("dark");
  const [tmplPrimary, setTmplPrimary] = useState("#BB9900");
  const [tmplSecondary, setTmplSecondary] = useState("#ffffff");
  const [tmplBg, setTmplBg] = useState("white");
  const [tmplFontStyle, setTmplFontStyle] = useState("Inter");
  const [tmplRawBox, setTmplRawBox] = useState("white");
  const [tmplRawPos, setTmplRawPos] = useState("bottom");
  const [tmplListicleNum, setTmplListicleNum] = useState(6);
  const [tmplBrief, setTmplBrief] = useState("");
  const [tmplSuggesting, setTmplSuggesting] = useState(null);
  const [tmplDownloading, setTmplDownloading] = useState(false);
  const [tmplDownloadingIdx, setTmplDownloadingIdx] = useState(null);
  const [tmplActiveSlide, setTmplActiveSlide] = useState(0);
  const [pendingTmplImage, setPendingTmplImage] = useState(null);
  const [tmplLibrary, setTmplLibrary] = useState(()=>{try{return JSON.parse(localStorage.getItem("bwt_tmpl_library")||"[]");}catch{return[];}});
  const [suppressLibraryConfirm, setSuppressLibraryConfirm] = useState(()=>{try{return localStorage.getItem("bwt_suppress_lib_confirm")==="1";}catch{return false;}});
  const [payoutDetails, setPayoutDetails] = useState({});
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // Capture affiliate ref from URL on load
  const getAffiliateRef = () => { try { return localStorage.getItem("cs_affiliate_ref")||null; } catch { return null; } };
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sa = params.get("sa");
      if (sa) localStorage.setItem("cs_affiliate_ref", sa);
      const checkout = params.get("checkout");
      if (checkout) localStorage.setItem("cs_checkout_plan", checkout);
    } catch {}
  }, []);

  // Load Google Fonts for Templates canvas rendering
  useEffect(() => {
    const id = "tmpl-gfonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Anton&family=Oswald:wght@700&family=Teko:wght@700&family=Barlow+Condensed:wght@800;900&family=Archivo+Black&family=Playfair+Display:ital,wght@0,900;1,900&family=Alfa+Slab+One&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // Fire checkout automatically after login if checkout param was set
  useEffect(() => {
    if (!currentUser) return;
    try {
      const plan = localStorage.getItem("cs_checkout_plan");
      if (!plan) return;
      localStorage.removeItem("cs_checkout_plan");
      const planMap = {
        starter: { id: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID, mode: "subscription" },
        pro: { id: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID, mode: "subscription" },
        agency: { id: process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID, mode: "subscription" },
        affiliate: { id: process.env.NEXT_PUBLIC_STRIPE_AFFILIATE_PRICE_ID, mode: "payment" },
        whitelabel: { id: process.env.NEXT_PUBLIC_STRIPE_WHITELABEL_PRICE_ID, mode: "payment" },
      };
      const p = planMap[plan];
      if (p) handleUpgrade(p.id, p.mode);
    } catch {}
  }, [currentUser]);

  const handleUpgrade = async (priceId, mode="subscription") => {
    setUpgrading(true);
    try {
      const affiliateRef = getAffiliateRef();
      const r = await fetch("/api/checkout", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email: currentUser.email, priceId, mode, affiliateRef }) });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
    } catch { alert("Something went wrong — try again."); }
    setUpgrading(false);
  };

  const loadAffiliateStats = async () => {
    if (!currentUser || affiliateLoading) return;
    setAffiliateLoading(true);
    try {
      const r = await fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"affiliate-stats" }) });
      const d = await r.json();
      setAffiliateStats(d);
    } catch {}
    setAffiliateLoading(false);
  };

  useEffect(() => {
    if (nav === "account" && currentUser && currentUser.plan !== "free") {
      loadAffiliateStats();
    }
  }, [nav, currentUser?.plan, currentUser?.affiliate_active]);

  // Build full-resolution HTML for template slide export
  // ============================================================
  // UNIVERSAL BADGE RENDERER — locked, never varies per template
  // ============================================================
  // useDebouncedValue removed — hooks must be at top level, not in nested functions

  // ── buildTmplHTML — generates HTML sent to Puppeteer /api/render-slide ──
  function buildTmplHTML(slide, idx, total, tmpl, opts) {
    const {effect,font,fontSize,primary,secondary,accentLine,bg,fontStyle,rawBox,rawPos,listicleNum,profUrl,nm,hdl,showTick,isFree,userWebsite,showCounter}=opts;
    const AL=accentLine||primary;
    const FS=fontSize||82;
    function autoFS(text,base){if(!text)return base;const len=text.length;const scaled=base-Math.max(0,(len-12)*2);return Math.max(28,Math.min(base,scaled));}
    const W=1080,H=1350,SAFE=60,isCover=idx===0;
    const fontFamily=(font||"Bebas Neue").replace(/'/g,"");
    function esc(s){return(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
    const gFonts="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Anton&family=Oswald:wght@700&family=Barlow+Condensed:wght@800;900&family=Archivo+Black&family=Playfair+Display:ital,wght@0,900;1,900&family=Alfa+Slab+One&family=Cormorant+Garamond:ital,wght@0,700;1,700&family=Josefin+Sans:wght@700&family=Raleway:wght@800;900&family=Quicksand:wght@700&family=Dancing+Script:wght@700&family=Inter:wght@400;600;700;800&display=swap";
    function effectCSS(eff,pri,sec){
      const cs="padding-top:0.15em;display:inline-block;";
      if(eff==="gold") return cs+"background:linear-gradient(180deg,"+sec+" 0%,#ffe44d 20%,"+pri+" 50%,#7a5800 80%,#ffe066 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 4px 8px rgba(140,100,0,0.5));";
      if(eff==="chrome") return cs+"background:linear-gradient(180deg,"+sec+" 0%,#ddd 20%,#777 45%,#bbb 65%,#444 85%,#ccc 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;";
      if(eff==="fire") return cs+"background:linear-gradient(180deg,"+sec+" 0%,#ffff00 15%,#ff6600 40%,#cc0000 75%,#660000 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;";
      if(eff==="ice") return cs+"background:linear-gradient(180deg,"+sec+" 0%,#d0f0ff 30%,"+pri+" 65%,#1a6090 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;";
      if(eff==="neon") return"-webkit-text-fill-color:"+pri+";color:"+pri+";text-shadow:0 0 10px "+pri+",0 0 20px "+pri+",0 0 40px "+pri+",0 0 80px "+pri+";";
      if(eff==="3d") return"color:#fff;text-shadow:1px 1px 0 #555,2px 2px 0 #444,3px 3px 0 #333,4px 4px 0 #222,5px 5px 0 #111,6px 6px 8px rgba(0,0,0,0.4);";
      if(eff==="rosegold") return cs+"background:linear-gradient(180deg,#fff0f0 0%,#f4a0b0 25%,#c96a7a 55%,#8b3a4a 85%,#f4a0b0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;";
      if(eff==="glitter") return cs+"background:linear-gradient(135deg,#fff 0%,#f0d060 20%,#fff 40%,#f0d060 60%,#fff 80%,#f0d060 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 6px rgba(240,208,96,0.8));";
      if(eff==="holographic") return cs+"background:linear-gradient(135deg,#ff6eb4 0%,#a78bfa 25%,#38bdf8 50%,#34d399 75%,#fb923c 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;";
      if(eff==="pastel") return"-webkit-text-fill-color:#f9a8d4;color:#f9a8d4;text-shadow:0 2px 12px rgba(249,168,212,0.4);";
      if(eff==="blush") return cs+"background:linear-gradient(180deg,#ffecd2 0%,#fcb69f 50%,#ff9a9e 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;";
      if(eff==="sunset") return cs+"background:linear-gradient(180deg,#fff 0%,#ffd700 20%,#ff8c00 50%,#ff4500 80%,#8b0000 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;";
      if(eff==="matrix") return"-webkit-text-fill-color:#00ff41;color:#00ff41;text-shadow:0 0 10px #00ff41,0 0 20px #00ff41,0 0 40px #00ff41;";
      if(eff==="purplehaze") return"-webkit-text-fill-color:#c084fc;color:#c084fc;text-shadow:0 0 10px #c084fc,0 0 20px #7c3aed,0 0 40px #7c3aed;";
      if(eff==="shadowpop") return"color:#fff;text-shadow:3px 3px 0 "+pri+",6px 6px 0 rgba(0,0,0,0.3);";
      if(eff==="duotone") return cs+"background:linear-gradient(180deg,"+pri+" 0%,"+sec+" 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;";
      return"-webkit-text-fill-color:"+sec+";color:"+sec+";text-shadow:0 2px 8px rgba(0,0,0,0.6);";
    }
    function badge(dark){
      const tc=dark?"#fff":"#0a0a0a",sc=dark?"rgba(255,255,255,0.55)":"rgba(0,0,0,0.45)";
      const tick=showTick?"<span style='display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#1D9BF0;border-radius:50%;margin-left:8px;vertical-align:middle;flex-shrink:0;'><span style='display:block;width:8px;height:5px;border-left:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(-45deg);margin-top:-2px;'></span></span>":"";
      const av=profUrl?"<img src='"+esc(profUrl)+"' style='width:100%;height:100%;object-fit:cover;border-radius:50%;'/>"  :"<div style='width:100%;height:100%;background:#4a6a9a;border-radius:50%;'></div>";
      return"<div style='display:flex;align-items:center;gap:18px;'><div style='width:90px;height:90px;border-radius:50%;overflow:hidden;border:3px solid #fff;flex-shrink:0;background:#4a6a9a;'>"+av+"</div><div style='display:flex;flex-direction:column;gap:4px;'><div style='display:flex;align-items:center;font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:36px;font-weight:800;color:"+tc+";'>"+esc(nm||"")+tick+"</div><div style='font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:28px;color:"+sc+";'>"+esc(hdl||"")+"</div></div></div>";
    }
    const grad="linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0) 28%,rgba(0,0,0,0.08) 44%,rgba(0,0,0,0.35) 54%,rgba(0,0,0,0.65) 62%,rgba(0,0,0,0.88) 70%,rgba(0,0,0,0.96) 78%,rgba(0,0,0,0.99) 88%,rgba(0,0,0,1) 100%)";
    const chevron="<div style='position:absolute;bottom:48px;right:56px;z-index:10;'><svg width='52' height='36' viewBox='0 0 52 36' fill='none'><polyline points='4,4 18,18 4,32' stroke='"+AL+"' stroke-width='5' stroke-linecap='round' stroke-linejoin='round' fill='none'/><polyline points='20,4 34,18 20,32' stroke='"+AL+"' stroke-width='5' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg></div>";
    const websiteStr=isFree?"studio.buildwithtav.co":(userWebsite||"");const website=websiteStr?"<div style='position:absolute;bottom:16px;left:0;right:0;text-align:center;z-index:10;font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:22px;color:rgba(255,255,255,0.45);'>"+websiteStr+"</div>":"";
    const wm=isFree?"<div style='position:absolute;top:32px;left:0;right:0;text-align:center;z-index:20;pointer-events:none;font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:32px;font-weight:800;color:#ffffff;text-shadow:0 2px 8px rgba(0,0,0,0.9),0 0 20px rgba(0,0,0,0.8);letter-spacing:1px;'>studio.buildwithtav.co</div>":"";
    const counter=showCounter?"<div style='position:absolute;top:24px;right:40px;z-index:10;background:rgba(0,0,0,0.55);border-radius:6px;padding:6px 14px;font-size:22px;font-weight:700;color:#fff;'>"+(idx+1)+"/"+total+"</div>":"";
    function imgTag(s){if(!s||!s.image)return"<div style='position:absolute;inset:0;background:#1a1a1a;z-index:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;'><div style='background:rgba(187,153,0,0.15);border:2px dashed rgba(187,153,0,0.6);border-radius:16px;padding:40px 60px;text-align:center;'><div style='font-family:-apple-system,sans-serif;font-size:42px;margin-bottom:16px;'>📷</div><div style='font-family:-apple-system,sans-serif;font-size:34px;font-weight:700;color:#BB9900;'>Upload your image</div><div style='font-family:-apple-system,sans-serif;font-size:26px;color:rgba(255,255,255,0.5);margin-top:8px;'>in the Photo section</div></div></div>";const px=(s.imagePos&&s.imagePos.x)||50,py=(s.imagePos&&s.imagePos.y)||50;const isPlaceholder=s.image&&!s.image.startsWith("data:");const overlay=isPlaceholder?"<div style='position:absolute;top:60px;left:50%;transform:translateX(-50%);z-index:3;pointer-events:none;'><div style='background:rgba(0,0,0,0.75);border:2px solid rgba(187,153,0,0.8);border-radius:12px;padding:16px 32px;text-align:center;'><div style='font-family:-apple-system,sans-serif;font-size:28px;font-weight:700;color:#BB9900;'>📷 Replace with your image</div></div></div>":"";return"<img src='"+esc(s.image)+"' style='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:"+px+"% "+py+"%;z-index:0;'/>"+overlay;}
    function darkFadeCover(s){
      const headlineText=esc((s.headline||"").toUpperCase());
      const sublineText=s.subline?esc(s.subline):"";
      const effectStyle=effectCSS(effect,primary,secondary);
      const sublineColor=effect==="clean"?primary:secondary;
      const fitScript="<script>(function(){var h=document.getElementById('hl');if(!h)return;var zone=document.getElementById('tz');var maxW=zone.offsetWidth;var maxH=zone.offsetHeight;var fs=88;h.style.fontSize=fs+'px';function fits(){return zone.scrollHeight<=maxH;}document.fonts.ready.then(function(){while(fs>36&&!fits()){fs-=2;h.style.fontSize=fs+'px';}window.__TEXT_FIT_DONE__=true;});})();<\/script>";
      return"<div style='position:relative;width:"+W+"px;height:"+H+"px;background:#000;overflow:hidden;'>"+imgTag(s)
        +"<div style='position:absolute;inset:0;background:"+grad+";z-index:1;'></div>"
        +"<div style='position:absolute;z-index:5;left:50%;transform:translateX(-50%);top:"+Math.round(H*0.638)+"px;white-space:nowrap;'>"+badge(true)+"</div>"
        +"<div style='position:absolute;z-index:5;left:54px;right:54px;top:"+Math.round(H*0.748)+"px;height:5px;background:linear-gradient(to right,transparent 0%,"+primary+" 5%,"+primary+" 95%,transparent 100%);'></div>"
        +"<div id='tz' style='position:absolute;z-index:5;left:60px;right:60px;top:"+Math.round(H*0.762)+"px;height:"+Math.round(H*0.21)+"px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:16px;overflow:hidden;'>"
        +"<div id='hl' style='font-family:"+fontFamily+",sans-serif;font-size:88px;font-weight:900;line-height:1.1;text-align:center;text-transform:uppercase;word-break:break-word;max-width:100%;"+effectStyle+"'>"+headlineText+"</div>"
        +(sublineText?"<div style='font-family:"+fontFamily+",sans-serif;font-size:34px;color:"+sublineColor+";text-align:center;font-weight:600;max-width:100%;flex-shrink:0;'>"+sublineText+"</div>":"")
        +"</div>"+website+(isCover?chevron:"")+counter+wm+fitScript+"</div>";
    }
    let body="";
    if(tmpl==="dark-fade"){body=darkFadeCover(slide);}
    else if(tmpl==="listicle"&&isCover){
      const cf="linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0) 38%,rgba(0,0,0,0.12) 52%,rgba(0,0,0,0.55) 62%,rgba(0,0,0,0.88) 70%,rgba(0,0,0,0.97) 78%,rgba(0,0,0,1) 85%,rgba(0,0,0,1) 100%)";
      const numDigits=String(listicleNum||6).length;
      const numFS=numDigits>2?240:numDigits>1?360:520;
      const numLineW=Math.min(Math.round(numFS*0.55*numDigits)+10,Math.round(numFS*numDigits*0.6));
      const fitScriptLis="<script>(function(){var t=document.getElementById('lt');var s=document.getElementById('ls');var u=document.getElementById('lu');var zone=document.getElementById('ltz');if(!zone)return;var maxW=zone.offsetWidth;document.fonts.ready.then(function(){[{el:t,max:44,single:true},{el:s,max:110,single:false},{el:u,max:34,single:true}].forEach(function(item){if(!item.el)return;var fs=item.max;item.el.style.fontSize=fs+'px';if(item.single){while(fs>18&&item.el.scrollWidth>maxW){fs-=2;item.el.style.fontSize=fs+'px';}}else{var lines=Math.ceil(item.el.scrollWidth/(maxW*0.95));while(fs>28&&lines>2){fs-=2;item.el.style.fontSize=fs+'px';lines=Math.ceil(item.el.scrollWidth/(maxW*0.95));}}});window.__TEXT_FIT_DONE__=true;});})();<\/script>";
      body="<div style='position:relative;width:"+W+"px;height:"+H+"px;background:#000;overflow:hidden;'>"+imgTag(slide)
        +"<div style='position:absolute;inset:0;background:"+cf+";z-index:1;'></div>"
        +"<div style='position:absolute;top:100px;left:"+SAFE+"px;z-index:5;'>"+badge(true)+"</div>"
        +"<div style='position:absolute;bottom:100px;left:"+SAFE+"px;right:"+SAFE+"px;z-index:5;display:flex;align-items:flex-end;gap:32px;'>"
        +"<div style='flex-shrink:0;display:flex;flex-direction:column;gap:14px;'>"
        +"<div style='font-family:"+fontFamily+",sans-serif;font-size:"+numFS+"px;font-weight:900;line-height:0.88;color:"+AL+";-webkit-text-fill-color:"+AL+";'>"+(listicleNum||6)+"</div>"
        +"<div style='width:"+numLineW+"px;height:5px;background:"+AL+";'></div></div>"
        +"<div id='ltz' style='flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;padding-bottom:8px;overflow:hidden;'>"
        +"<div id='lt' style='font-family:"+fontFamily+",sans-serif;font-size:44px;font-weight:600;color:rgba(255,255,255,0.65);line-height:1.2;white-space:nowrap;'>"+esc((slide.topicLine||"PLACES YOU NEED TO VISIT BEFORE").toUpperCase())+"</div>"
        +"<div id='ls' style='font-family:"+fontFamily+",sans-serif;font-size:110px;font-weight:900;line-height:1.0;white-space:nowrap;color:"+AL+";-webkit-text-fill-color:"+AL+";'>"+esc((slide.subject||"2027 ENDS").toUpperCase())+"</div>"
        +(slide.subline?"<div id='lu' style='font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:34px;color:rgba(255,255,255,0.6);line-height:1.3;white-space:nowrap;'>"+esc(slide.subline)+"</div>":"")
        +"</div></div>"
        +"<div style='position:absolute;bottom:16px;left:0;right:0;text-align:center;z-index:10;font-size:22px;color:rgba(255,255,255,0.45);'>"+websiteStr+"</div>"+chevron+counter+wm+fitScriptLis+"</div>";
    }
    else if(tmpl==="listicle"&&!isCover){
      const lGrad="linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0) 40%,rgba(0,0,0,0.15) 54%,rgba(0,0,0,0.55) 62%,rgba(0,0,0,0.88) 70%,rgba(0,0,0,0.97) 78%,rgba(0,0,0,1) 86%,rgba(0,0,0,1) 100%)";
      const numFS2=String(idx).length>1?260:310;
      const numLineW2=Math.round(numFS2*0.62*String(idx).length)+20;
      const fitScriptLisBody="<script>(function(){var h=document.getElementById('lbh'+"+idx+");if(!h)return;var zone=document.getElementById('lbz'+"+idx+");if(!zone)return;var maxW=zone.offsetWidth;document.fonts.ready.then(function(){var fs=68;h.style.fontSize=fs+'px';while(fs>28&&Math.ceil(h.scrollWidth/(maxW*0.95))>2){fs-=2;h.style.fontSize=fs+'px';}window.__TEXT_FIT_DONE__=true;});})();<\/script>";
      body="<div style='position:relative;width:"+W+"px;height:"+H+"px;background:#0a0a0a;overflow:hidden;'>"+imgTag(slide)
        +"<div style='position:absolute;inset:0;background:"+lGrad+";z-index:1;'></div>"
        +"<div style='position:absolute;top:100px;left:"+SAFE+"px;z-index:5;'>"+badge(true)+"</div>"
        +"<div style='position:absolute;bottom:80px;left:"+SAFE+"px;right:"+SAFE+"px;z-index:5;display:flex;align-items:flex-end;gap:40px;'>"
        +"<div style='flex-shrink:0;display:flex;flex-direction:column;gap:14px;'>"
        +"<div style='font-family:"+fontFamily+",sans-serif;font-size:"+numFS2+"px;font-weight:900;line-height:1;color:"+secondary+";'>"+String(idx)+"</div>"
        +"<div style='width:"+numLineW2+"px;height:5px;background:"+AL+";'></div></div>"
        +"<div id='lbz'+"+idx+" style='flex:1;min-width:0;display:flex;flex-direction:column;gap:20px;padding-bottom:8px;overflow:hidden;'>"
        +(slide.headline?"<div id='lbh'+"+idx+" style='font-family:"+fontFamily+",sans-serif;font-size:68px;font-weight:900;line-height:1.1;text-transform:uppercase;word-break:break-word;"+effectCSS(effect,primary,secondary)+"'>"+esc(slide.headline.toUpperCase())+"</div>":"")
        +(slide.bodyText?"<div style='font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:44px;color:rgba(255,255,255,0.85);line-height:1.45;word-break:break-word;'>"+esc(slide.bodyText)+"</div>":"")
        +"</div></div>"
        +website+wm+fitScriptLisBody+"</div>";
    }
    else if(tmpl==="clean-pro"&&isCover){body=darkFadeCover(slide);}
    else if(tmpl==="clean-pro"&&!isCover){
      const isW=bg==="white",bgC=isW?"#ffffff":"#0a0a0a",tM=isW?"#0a0a0a":"#ffffff";
      const tS=isW?"rgba(0,0,0,0.5)":"rgba(255,255,255,0.5)";
      body="<div style='position:relative;width:"+W+"px;height:"+H+"px;background:"+bgC+";overflow:hidden;'>"
        +"<div style='position:absolute;top:140px;left:"+SAFE+"px;z-index:5;'>"+badge(!isW)+"</div>"
        +"<div style='position:absolute;top:320px;left:"+(SAFE+20)+"px;right:"+(SAFE+20)+"px;bottom:120px;z-index:5;display:flex;flex-direction:column;justify-content:center;gap:52px;'>"
        +(slide.headline?"<div style='font-family:"+fontFamily+",sans-serif;font-size:"+autoFS((slide.headline||""),FS)+"px;font-weight:800;color:"+tM+";line-height:1.2;word-break:break-word;'>"+esc(slide.headline)+"</div>":"")
        +(slide.bodyText?"<div style='font-family:"+fontFamily+",sans-serif;font-size:52px;color:"+tS+";line-height:1.65;word-break:break-word;'>"+esc(slide.bodyText).replace(/\n/g,"<br/>")+"</div>":"")
        +(slide.accentText?"<div style='font-family:"+fontFamily+",sans-serif;font-size:56px;font-weight:700;color:"+primary+";line-height:1.3;word-break:break-word;'>"+esc(slide.accentText)+"</div>":"")
        +(slide.accentText?"<div style='width:110px;height:5px;background:"+AL+";'></div>":"")
        +"</div><div style='position:absolute;bottom:48px;right:"+SAFE+"px;z-index:5;font-size:28px;color:"+tS+";'>"+(idx+1)+"/"+total+"</div>"+wm+"</div>";
    }
    else if(tmpl==="storytelling"){
      const isW=bg==="white",bgC=isW?"#ffffff":"#0a0a0a",tC=isW?"#0a0a0a":"#ffffff";
      const stI=fontStyle==="Playfair Display",stF=fontStyle||"Inter";
      const sw=isCover?"<div style='position:absolute;bottom:48px;right:56px;z-index:10;'><svg width='52' height='36' viewBox='0 0 52 36' fill='none'><polyline points='4,4 18,18 4,32' stroke='"+(isW?"rgba(0,0,0,0.3)":"rgba(255,255,255,0.3)")+"' stroke-width='5' stroke-linecap='round' stroke-linejoin='round' fill='none'/><polyline points='20,4 34,18 20,32' stroke='"+(isW?"rgba(0,0,0,0.3)":"rgba(255,255,255,0.3)")+"' stroke-width='5' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg></div>":"";
      body="<div style='position:relative;width:"+W+"px;height:"+H+"px;background:"+bgC+";overflow:hidden;'>"
        +"<div style='position:absolute;top:140px;left:"+SAFE+"px;z-index:5;'>"+badge(!isW)+"</div>"
        +"<div style='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:200px 120px;z-index:5;'>"
        +"<div style='font-family:"+stF+",-apple-system,Helvetica Neue,Arial,sans-serif;font-size:44px;"+(stI?"font-style:italic;":"")+"font-weight:400;color:"+tC+";line-height:1.7;text-align:center;'>"
        +esc(slide.storyText||"").replace(/\n\n/g,"</p><p style='margin-top:1.2em;'>").replace(/\n/g,"<br/>")
        +"</div></div>"+sw+counter+wm+"</div>";
    }
    else if(tmpl==="raw"){
      const isNone=rawBox==="none",isWB=rawBox==="white",tCR=isNone?"#ffffff":isWB?"#0a0a0a":"#ffffff";
      const bBg=isNone?"transparent":isWB?"rgba(255,255,255,0.93)":"rgba(0,0,0,0.85)";
      const bBorder=isNone?"border:none;":"";
      const txtShadow=isNone?"text-shadow:2px 2px 0 rgba(0,0,0,0.9),0 0 20px rgba(0,0,0,0.8),-1px -1px 0 rgba(0,0,0,0.9),1px -1px 0 rgba(0,0,0,0.9),-1px 1px 0 rgba(0,0,0,0.9),1px 1px 0 rgba(0,0,0,0.9);":"";
      const stI=fontStyle==="Playfair Display";
      const paras=(slide.rawText||"").split(/\n\n+/);
      const parasHTML=paras.map(p=>p.trim()===""
        ?""
        :"<div style='display:inline-block;background:"+bBg+";padding:"+(isNone?"0":"18px 36px")+";margin:10px 0;font-family:"+fontFamily+",-apple-system,Helvetica Neue,Arial,sans-serif;font-size:"+FS+"px;font-weight:800;color:"+tCR+";line-height:1.4;"+(stI?"font-style:italic;":"")+txtShadow+"word-break:break-word;white-space:pre-wrap;"+bBorder+"'>"+esc(p.trim())+"</div>"
      ).join("<br/>");
      const vAlign=rawPos==="bottom"?"justify-content:flex-end;padding-bottom:140px":"justify-content:center";
      body="<div style='position:relative;width:"+W+"px;height:"+H+"px;background:#1a1a1a;overflow:hidden;'>"+imgTag(slide)
        +"<div style='position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;"+vAlign+";padding:80px 80px;text-align:center;'>"
        +parasHTML
        +"</div>"+counter+wm+"</div>";
    }
    else if(tmpl==="split"){
      const splitGrad="linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0) 38%,rgba(0,0,0,0.08) 52%,rgba(0,0,0,0.42) 62%,rgba(0,0,0,0.82) 72%,rgba(0,0,0,0.97) 82%,rgba(0,0,0,1) 100%)";
      const HW=Math.floor(W/2);
      const imgL=slide.image?"<img src='"+esc(slide.image)+"' style='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:"+(slide.imagePos?.x||50)+"% "+(slide.imagePos?.y||50)+"%;z-index:0;'/>":"";
      const imgR=slide.image2?"<img src='"+esc(slide.image2)+"' style='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:"+(slide.image2Pos?.x||50)+"% "+(slide.image2Pos?.y||50)+"%;z-index:0;'/>":"";
      const divider="<div style='position:absolute;left:"+HW+"px;top:0;width:3px;height:100%;background:"+primary+";z-index:1;opacity:0.5;'></div>";
      body="<div style='position:relative;width:"+W+"px;height:"+H+"px;background:#000;overflow:hidden;'>"
        +"<div style='position:absolute;top:0;left:0;width:"+HW+"px;height:"+H+"px;overflow:hidden;'>"+imgL+"</div>"
        +"<div style='position:absolute;top:0;left:"+HW+"px;width:"+HW+"px;height:"+H+"px;overflow:hidden;'>"+imgR+"</div>"
        +"<div style='position:absolute;inset:0;background:"+splitGrad+";z-index:2;'></div>"
        +divider
        +"<div style='position:absolute;bottom:280px;left:50%;transform:translateX(-50%);z-index:5;white-space:nowrap;'>"+badge(true)+"</div>"
        +"<div style='position:absolute;bottom:90px;left:"+SAFE+"px;width:"+(HW-SAFE-24)+"px;z-index:5;display:flex;flex-direction:column;gap:10px;align-items:center;text-align:center;overflow:hidden;max-height:320px;'>"
        +(slide.headline?"<div style='font-family:"+fontFamily+",sans-serif;font-size:"+autoFS((slide.headline||""),Math.min(FS,56))+"px;font-weight:900;line-height:1.05;text-transform:uppercase;word-break:break-word;text-align:center;"+effectCSS(effect,primary,secondary)+"'>"+esc(slide.headline.toUpperCase())+"</div>":"")
        +(slide.subline?"<div style='font-family:"+fontFamily+",sans-serif;font-size:26px;color:"+(effect==="clean"?primary:"rgba(255,255,255,0.7)")+";line-height:1.3;text-align:center;word-break:break-word;'>"+esc(slide.subline)+"</div>":"")
        +"</div>"
        +"<div style='position:absolute;bottom:90px;left:"+(HW+24)+"px;right:"+SAFE+"px;z-index:5;display:flex;flex-direction:column;gap:10px;align-items:center;text-align:center;overflow:hidden;max-height:320px;'>"
        +(slide.headline2?"<div style='font-family:"+fontFamily+",sans-serif;font-size:"+autoFS((slide.headline2||""),Math.min(FS,56))+"px;font-weight:900;line-height:1.05;text-transform:uppercase;word-break:break-word;text-align:center;"+effectCSS(effect,primary,secondary)+"'>"+esc(slide.headline2.toUpperCase())+"</div>":"")
        +(slide.subline2?"<div style='font-family:"+fontFamily+",sans-serif;font-size:26px;color:"+(effect==="clean"?primary:"rgba(255,255,255,0.7)")+";line-height:1.3;text-align:center;word-break:break-word;'>"+esc(slide.subline2)+"</div>":"")
        +"</div>"
        +"<div style='position:absolute;bottom:16px;left:0;right:0;text-align:center;z-index:10;font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:22px;color:rgba(255,255,255,0.45);'>studio.buildwithtav.co</div>"
        +(isCover?chevron:"")+counter+wm+"</div>";
    }
    return"<!DOCTYPE html><html><head><meta charset='UTF-8'><link href='"+gFonts+"' rel='stylesheet'><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased;}body{width:"+W+"px;height:"+H+"px;overflow:hidden;margin:0;padding:0;}</style></head><body>"+body+"</body></html>";
  }


  // ── buildCtaHTML — generates CTA final slide ──
  function buildCtaHTML(opts,ctaType,keyword,line1,line2,line3,bg,nm,hdl,profUrl,showTick,font,total,showCounter){
    const W=1080,H=1350;
    const fontFamily=(font||"Bebas Neue").replace(/'/g,"");
    const gFonts="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Anton&family=Oswald:wght@700&family=Barlow+Condensed:wght@800;900&family=Archivo+Black&family=Playfair+Display:ital,wght@0,900;1,900&family=Alfa+Slab+One&family=Cormorant+Garamond:ital,wght@0,700;1,700&family=Josefin+Sans:wght@700&family=Raleway:wght@800;900&family=Quicksand:wght@700&family=Dancing+Script:wght@700&family=Inter:wght@400;600;700;800&display=swap";
    const isDark=bg==="dark"||bg==="black";
    const bgC=isDark?"#0a0a0a":"#ffffff";
    const textC=isDark?"#ffffff":"#0a0a0a";
    const mutedC=isDark?"rgba(255,255,255,0.55)":"rgba(0,0,0,0.5)";
    const accent=(opts.accentLine||opts.primary)||"#BB9900";
    function esc(s){return(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
    const tick=showTick?"<span style='display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#1D9BF0;border-radius:50%;margin-left:8px;vertical-align:middle;flex-shrink:0;'><span style='display:block;width:8px;height:5px;border-left:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(-45deg);margin-top:-2px;'></span></span>":"";
    const av=profUrl?"<img src='"+esc(profUrl)+"' style='width:100%;height:100%;object-fit:cover;border-radius:50%;'/>":"<div style='width:100%;height:100%;background:#4a6a9a;border-radius:50%;'></div>";
    const badge="<div style='display:flex;align-items:center;gap:18px;'><div style='width:90px;height:90px;border-radius:50%;overflow:hidden;border:3px solid "+(isDark?"#fff":"#ccc")+";flex-shrink:0;background:#4a6a9a;'>"+av+"</div><div style='display:flex;flex-direction:column;gap:4px;'><div style='display:flex;align-items:center;font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:36px;font-weight:800;color:"+textC+";'>"+esc(nm||"")+tick+"</div><div style='font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:28px;color:"+mutedC+";'>"+esc(hdl||"")+"</div></div></div>";
    const body="<div style='position:relative;width:"+W+"px;height:"+H+"px;background:"+bgC+";overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;'>"
      +"<div style='position:absolute;top:80px;left:60px;z-index:5;'>"+badge+"</div>"
      +"<div style='display:flex;flex-direction:column;align-items:center;text-align:center;gap:32px;padding:0 80px;margin-top:60px;'>"
      +"<p style='font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:44px;color:"+textC+";font-weight:600;line-height:1.3;margin:0;'>"+esc(line1)+"</p>"
      +"<div style='width:80px;height:4px;background:"+accent+";'></div>"
      +(ctaType==="comment"?"<p style='font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:36px;color:"+mutedC+";letter-spacing:3px;text-transform:uppercase;margin:0;'>"+esc(line2)+"</p>":"")
      +"<p style='font-family:"+fontFamily+",sans-serif;font-size:160px;font-weight:900;color:"+accent+";line-height:0.9;margin:0;letter-spacing:4px;'>"+esc((keyword||"").toUpperCase())+"</p>"
      +"<div style='width:80px;height:4px;background:"+accent+";'></div>"
      +"<p style='font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:40px;color:"+mutedC+";line-height:1.4;margin:0;'>"+esc(line3)+"</p>"
      +"</div>"
      +"</div>"
      +(showCounter?"<div style='position:absolute;top:24px;right:40px;z-index:10;background:rgba(0,0,0,0.55);border-radius:6px;padding:6px 14px;font-size:22px;font-weight:700;color:#fff;'>"+total+"/"+total+"</div>":"")
      +(opts.isFree?"<div style='position:absolute;bottom:16px;left:0;right:0;text-align:center;font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:22px;color:rgba(128,128,128,0.6);'>"+"studio.buildwithtav.co"+"</div>":(opts.userWebsite?"<div style='position:absolute;bottom:16px;left:0;right:0;text-align:center;font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:22px;color:rgba(128,128,128,0.6);'>"+opts.userWebsite+"</div>":""))+"</div>";
    return"<!DOCTYPE html><html><head><meta charset='UTF-8'><link href='"+gFonts+"' rel='stylesheet'><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased;}body{width:"+W+"px;height:"+H+"px;overflow:hidden;margin:0;padding:0;}</style></head><body>"+body+"</body></html>";
  }

  // ── Template AI suggest ──────────────────────────────────────────────────
  const tmplSuggestSlide = async (idx, tmpl, brief, slides, slideCount) => {
    setTmplSuggesting(idx);
    try {
      const context=slides.slice(0,slideCount).map((s,i)=>{const t=tmpl==="storytelling"?s.storyText:s.bodyText;return t?`Slide ${i+1}: "${t.substring(0,60)}"`:""}).filter(Boolean).join("; ");
      const prompt=tmpl==="listicle"
        ?`Write ONE specific punchy point for slide ${idx+1} of a listicle carousel. Topic: "${brief||"general"}". ${context?`Already covered: ${context}.`:""} Max 80 chars. Return ONLY the text.`
        :tmpl==="storytelling"
        ?`Write ONE paragraph continuing a personal story carousel (slide ${idx+1}). Story brief: "${brief||"personal journey"}". ${context?`Story so far: ${context}.`:""} Max 120 chars. First person, specific details only. Return ONLY the text.`
        :`Write ONE clear body text point for slide ${idx+1} of an informative carousel about "${brief||"this topic"}". ${context?`Previous: ${context}.`:""} Max 100 chars. Return ONLY the text.`;
      const r=await fetchWithRetry({model:"claude-sonnet-4-6",max_tokens:80,messages:[{role:"user",content:prompt}]});
      const text=r?.content?.[0]?.text?.trim()||"";
      if(text){
        setTmplSlides(prev=>{const next=[...prev];const field=tmpl==="storytelling"?"storyText":"bodyText";next[idx]={...next[idx],[field]:text};return next;});
        if(currentUser?.email){
          await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()},body:JSON.stringify({action:"increment-downloads",email:currentUser.email,credits:3})});
          setCurrentUser(u=>({...u,credits_used:(u.credits_used||0)+3}));
        }
      }
    }catch(e){console.error(e);}
    setTmplSuggesting(null);
  };

  // Top-level debounced slides state — hooks must never be inside IIFE or nested fns
  const [dTmplSlides, setDTmplSlides] = useState(tmplSlides);
  useEffect(()=>{ const t=setTimeout(()=>setDTmplSlides([...tmplSlides]),300); return()=>clearTimeout(t); },[JSON.stringify(tmplSlides),tmplFont,tmplEffect,tmplPrimary,tmplSecondary,tmplAccentLineColor,tmplBg,tmplShowCounter,tmplFontSize]);
  useEffect(()=>{
    if(!pendingTmplImage)return;
    setTmplSlides(prev=>{const next=[...prev];const idx=tmplActiveSlide||0;next[idx]={...next[idx],image:pendingTmplImage};return next;});
    setPendingTmplImage(null);
  },[pendingTmplImage,tmplActiveSlide]);

  // ADMIN-ONLY brand preset functions — only ever called from is_admin-gated UI, touches a separate localStorage key only
  const saveAdminPreset = () => {
    const trimmed = adminPresetName.trim();
    if (!trimmed) { alert("Give this preset a name first."); return; }
    const snapshot = {
      id: Date.now().toString(),
      label: trimmed,
      profileUrl, name, handle, blueTick, website, showWebsite, voiceProfile, businessType,
      headlineStyle, bgMode, bgColour, customColourDark, slideTextDark, accentColor, fontId,
      templateBgUrl, photoOpacity, templateOpacity, overlayDark,
    };
    const next = [...adminPresets.filter(p=>p.label!==trimmed), snapshot];
    setAdminPresets(next);
    try { localStorage.setItem("bwt_admin_presets", JSON.stringify(next)); } catch {}
    setAdminActivePreset(snapshot.id);
    setAdminPresetName("");
  };

  const loadAdminPreset = (id) => {
    const p = adminPresets.find(x=>x.id===id);
    if (!p) return;
    setProfileUrl(p.profileUrl||""); setName(p.name||""); setHandle(p.handle||"");
    setBlueTick(p.blueTick??false); setWebsite(p.website||""); setShowWebsite(p.showWebsite??false);
    setVoiceProfile(p.voiceProfile||""); setBusinessType(p.businessType||"marketer");
    setHeadlineStyle(p.headlineStyle); setBgMode(p.bgMode); setBgColour(p.bgColour);
    setCustomColourDark(p.customColourDark); setSlideTextDark(p.slideTextDark);
    setAccentColor(p.accentColor); setFontId(p.fontId); setTemplateBgUrl(p.templateBgUrl||null);
    setPhotoOpacity(p.photoOpacity); setTemplateOpacity(p.templateOpacity); setOverlayDark(p.overlayDark);
    setAdminActivePreset(id);
  };

  const deleteAdminPreset = (id) => {
    if (!confirm("Delete this preset?")) return;
    const next = adminPresets.filter(p=>p.id!==id);
    setAdminPresets(next);
    try { localStorage.setItem("bwt_admin_presets", JSON.stringify(next)); } catch {}
    if (adminActivePreset===id) setAdminActivePreset(null);
  };

  const submitPayoutRequest = async () => {
    setPayoutSubmitting(true);
    try {
      const amount = parseFloat(affiliateStats?.available || 0);
      if (amount < 30) { alert("Minimum withdrawal is $30."); setPayoutSubmitting(false); return; }
      const r = await fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"request-payout", amount, payoutMethod, payoutDetails }) });
      const d = await r.json();
      if (d.success) { setPayoutSuccess(true); setShowPayoutForm(false); }
      else alert("Something went wrong — try again.");
    } catch { alert("Something went wrong — try again."); }
    setPayoutSubmitting(false);
  };
  const [profileUrl, setProfileUrl] = useState(S?.profileUrl||null);
  const [name, setName] = useState(S?.name||"");
  const [handle, setHandle] = useState(S?.handle||"");
  const [blueTick, setBlueTick] = useState(S?.blueTick??false);
  const [website, setWebsite] = useState(S?.website||"");
  const [showWebsite, setShowWebsite] = useState(S?.showWebsite??false);
  const [voiceProfile, setVoiceProfile] = useState(S?.voiceProfile||"");
  const [businessType, setBusinessType] = useState(S?.businessType||"marketer");
  // ADMIN-ONLY brand presets — isolated feature, separate storage key, zero effect on normal users
  const [adminPresets, setAdminPresets] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bwt_admin_presets")||"[]"); } catch { return []; }
  });
  const [adminPresetName, setAdminPresetName] = useState("");
  const [adminActivePreset, setAdminActivePreset] = useState(null);
  const [otherType, setOtherType] = useState(S?.otherType||"");
  const [coverPhotos, setCoverPhotos] = useState(S?.coverPhotos||[]);
  const [activeCoverPhoto, setActiveCoverPhoto] = useState(S?.activeCoverPhoto||null);
  const [coverPosition, setCoverPosition] = useState(S?.coverPosition||"centre");
  const [badgeArea, setBadgeArea] = useState(null);

  const [accentSwatch, setAccentSwatch] = useState(S?.accentSwatch||"gold");
  const [accentCustomSlots, setAccentCustomSlots] = useState(S?.accentCustomSlots||["","",""]);
  const [bgCustomSlots, setBgCustomSlots] = useState(S?.bgCustomSlots||["","",""]); 
  const [accentColor, setAccentColor] = useState(S?.accentColor||GOLD);
  const [customActiveSlot, setCustomActiveSlot] = useState(S?.customActiveSlot??null);
  const [fontId, setFontId] = useState(S?.fontId||"montserrat");
  const [recentFonts, setRecentFonts] = useState(() => { try { return JSON.parse(localStorage.getItem("bwt_recent_fonts")||"[]"); } catch { return []; } });
  const [recentQuoteFonts, setRecentQuoteFonts] = useState(() => { try { return JSON.parse(localStorage.getItem("bwt_recent_quote_fonts")||"[]"); } catch { return []; } });

  const trackFont = (id, isQuote=false) => {
    const key = isQuote ? "bwt_recent_quote_fonts" : "bwt_recent_fonts";
    const setter = isQuote ? setRecentQuoteFonts : setRecentFonts;
    setter(prev => {
      const next = [id, ...prev.filter(f=>f!==id)].slice(0,5);
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const [headlineStyle, setHeadlineStyle] = useState(S?.headlineStyle||"bold");
  const [showNums, setShowNums] = useState(S?.showNums??false);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [bgMode, setBgMode] = useState(S?.bgMode||"light");
  const [templateBgUrl, setTemplateBgUrl] = useState(S?.templateBgUrl||null);
  const [templatePhotos, setTemplatePhotos] = useState(S?.coverPhotos||S?.templatePhotos||[]);
  const [overlayDark, setOverlayDark] = useState(S?.overlayDark??75);
  const [photoOpacity, setPhotoOpacity] = useState(S?.photoOpacity??100);
  const [templateOpacity, setTemplateOpacity] = useState(S?.templateOpacity??100);

  const [topic, setTopic] = useState("");
  const [inspirationImg, setInspirationImg] = useState(null);
  const [ratio, setRatio] = useState(S?.ratio||"instagram");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  useEffect(()=>{
    const prevent = e => {
      // Allow scroll inside the drawer scrollable area
      const drawerScroll = document.querySelector('.drawer-scroll');
      if(drawerScroll && drawerScroll.contains(e.target)) return;
      e.preventDefault();
    };
    if(editDrawerOpen){
      document.addEventListener('touchmove', prevent, {passive:false});
    } else {
      document.removeEventListener('touchmove', prevent);
    }
    return()=>{ document.removeEventListener('touchmove', prevent); };
  },[editDrawerOpen]);
  const [gradientMode, setGradientMode] = useState("dark");
  const [customBgSlots, setCustomBgSlots] = useState(S?.customBgSlots||["","",""]);
  const [customAccentSlots, setCustomAccentSlots] = useState(S?.customAccentSlots||["","",""]);
  const [bgColour, setBgColour] = useState(S?.bgColour||"#1a1a2e");
  const [customColourDark, setCustomColourDark] = useState(S?.customColourDark??(S?.bgMode==="light"?false:true));
  const [slideTextDark, setSlideTextDark] = useState(S?.slideTextDark??(S?.bgMode==="light"?false:true));
  const [slideCount, setSlideCount] = useState(6);
  const [err, setErr] = useState("");
  const [randomising, setRandomising] = useState(false);
  const [audienceType, setAudienceType] = useState(S?.audienceType||"customers");
  const [angle, setAngle] = useState("");

  const [view, setView] = useState("setup");
  const [slides, setSlides] = useState([]);
  const [active, setActive] = useState(0);
  const [rewritePrompt, setRewritePrompt] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [lastTopic, setLastTopic] = useState("");
  const [caption, setCaption] = useState("");
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [affiliateLinkCopied, setAffiliateLinkCopied] = useState(false);
  const [history, setHistory] = useState(loadHistory());

  const [quoteInputs, setQuoteInputs] = useState(["","",""]);
  const [quoteSignature, setQuoteSignature] = useState("");
  const [quoteFont, setQuoteFont] = useState("playfair");
  const [quoteSigFont, setQuoteSigFont] = useState("dancing");
  const [quoteBgMode, setQuoteBgMode] = useState("light");
  const [quoteBgCustomUrl, setQuoteBgCustomUrl] = useState(null);
  const [quotePhotos, setQuotePhotos] = useState(S?.quotePhotos||[]);
  const [textDensity, setTextDensity] = useState(S?.textDensity||"balanced");
  const [quoteOverlay, setQuoteOverlay] = useState(50);
  const [quotePhotoOpacity, setQuotePhotoOpacity] = useState(75);
  const [quoteTemplate, setQuoteTemplate] = useState("raw");
  const [luxuryLabel, setLuxuryLabel] = useState("wisdom");
  const [showHandle, setShowHandle] = useState(true);
  const [quoteFormat, setQuoteFormat] = useState("instagram");
  const [generatingQuotes, setGeneratingQuotes] = useState(false);
  const [quoteMode, setQuoteMode] = useState("brand");
  const [quoteSlides, setQuoteSlides] = useState([]);
  const [downloadingQuotes, setDownloadingQuotes] = useState(false);
  const [quoteTextColor, setQuoteTextColor] = useState("#0A0A0A");
  const [quoteTextCustomSlots, setQuoteTextCustomSlots] = useState(["","",""]);
  const [expandedQuote, setExpandedQuote] = useState(null);
  const [quoteHistory, setQuoteHistory] = useState(()=>{try{return JSON.parse(localStorage.getItem("bwt_quote_history")||"[]");}catch{return [];}});
  const [slideOverlays, setSlideOverlays] = useState({});
  const [coverImgPos, setCoverImgPos] = useState({x:50,y:50});
  const [templateImgPos, setTemplateImgPos] = useState({x:50,y:50});
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);
  // Keep cover and template photo libraries in sync
  useEffect(() => {
    if (coverPhotos.length > 0 && templatePhotos.length === 0) {
      setTemplatePhotos(coverPhotos);
    }
  }, []);

  const addToSharedLibrary = async (url) => {
    const next = [url, ...coverPhotos.filter(p => p !== url)].slice(0, 10);
    setCoverPhotos(next);
    setTemplatePhotos(next);
  };

  const removeFromSharedLibrary = (url) => {
    const next = coverPhotos.filter(p => p !== url);
    setCoverPhotos(next);
    setTemplatePhotos(next);
    if (activeCoverPhoto === url) { setActiveCoverPhoto(next[0] || null); if(!next[0]){if(bgMode==="light")setCustomColourDark(false);else setCustomColourDark(true);} }
    if (templateBgUrl === url) { setTemplateBgUrl(next[0] || null); if(!next[0]) setSlideTextDark(false); }
  };

  const profileRef = useRef(null);
  const mainTmplCanvasRef = useRef(null);
  const coverDragRef = useRef(null);
  const templateDragRef = useRef(null);
  const coverPhotoRef = useRef(null);
  const templateBgRef = useRef(null);
  const inspirationRef = useRef(null);
  const quoteBgRef = useRef(null);
  const quotePhotoRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    // Never save base64 images to localStorage — only save real Blob URLs
    const safeProfileUrl = profileUrl?.startsWith('data:') ? '' : profileUrl;
    const safeQuoteBg = quoteBgCustomUrl?.startsWith('data:') ? null : quoteBgCustomUrl;
    const safeTemplateBg = templateBgUrl?.startsWith('data:') ? null : templateBgUrl;
    const safeCoverPhotos = coverPhotos.filter(p => !p?.startsWith('data:'));
    const safeActiveCover = activeCoverPhoto?.startsWith('data:') ? '' : activeCoverPhoto;
    saveS({profileUrl:safeProfileUrl,name,handle,blueTick,website,showWebsite,voiceProfile,businessType,otherType,
           coverPhotos:safeCoverPhotos,activeCoverPhoto:safeActiveCover,quoteBgCustomUrl:safeQuoteBg,quotePhotos,coverPosition,accentSwatch,accentColor,accentCustomSlots,bgCustomSlots,fontId,headlineStyle,showNums,
           bgMode,templateBgUrl:safeTemplateBg,templatePhotos:templatePhotos.filter(p=>!p?.startsWith("data:")),overlayDark,photoOpacity,templateOpacity,ratio,bgColour,customColourDark,slideTextDark,audienceType,customActiveSlot,textDensity});
  }, [profileUrl,name,handle,blueTick,website,showWebsite,voiceProfile,businessType,otherType,
      coverPhotos,activeCoverPhoto,coverPosition,accentSwatch,accentColor,accentCustomSlots,bgCustomSlots,fontId,headlineStyle,showNums,
      bgMode,templateBgUrl,overlayDark,ratio,bgColour,audienceType,customActiveSlot,textDensity,quotePhotos]);

  const readFile = (e, cb) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => cb(ev.target.result);
    r.readAsDataURL(f);
  };

  const addCoverPhoto = async (url) => {
    sampleImageBrightness(url).then(setBadgeArea);
    try {
      const res = await fetch('/api/upload-photo', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ imageData: url, filename: `cover-${Date.now()}.jpg` })
      });
      const data = await res.json();
      if (data.url) {
        const next = [data.url, ...coverPhotos.filter(p => !p.startsWith('data:'))].slice(0, 10);
        setCoverPhotos(next);
        setTemplatePhotos(next);
        setActiveCoverPhoto(data.url);
      } else {
        const next = [url, ...coverPhotos].slice(0, 10);
        setCoverPhotos(next);
        setTemplatePhotos(next);
        setActiveCoverPhoto(url);
      }
    } catch(e) {
      console.error('Cover upload failed:', e);
      const next = [url, ...coverPhotos].slice(0, 10);
      setCoverPhotos(next);
      setTemplatePhotos(next);
      setActiveCoverPhoto(url);
    }
  };

  const fetchWithRetry = async (body, tries=4, countCredit=false) => {
    for (let i=0; i<=tries; i++) {
      try {
        const payload = countCredit && currentUser ? { ...body, userEmail: currentUser.email } : body;
        const res = await fetch("/api/generate", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify(payload)
        });
        if (res.status === 429) {
          const d = await res.json();
          if (d.error === "credits_exhausted" || d.error === "fair_use_limit") {
            setNav("upgrade");
            throw new Error("credits_exhausted");
          }
        }
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        if (countCredit && currentUser) {
          refreshUser();
        }
        return data;
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
    const btObj = BUSINESS_TYPES.find(b=>b.id===businessType);
    const btLabel = businessType==="other"?(otherType||"brand"):btObj?.label||"Digital Marketer";
    const audienceDesc = audienceType==="peers" ? `other ${btLabel.toLowerCase()}s and industry professionals` : (btObj?.audience||"your target audience");
    const voice = voiceProfile || `Write for a ${btLabel}. Direct, specific, speak to real problems. No hype.`;
    const briefSection = angle.trim() ? `\nSPECIFIC BRIEF — follow this exactly: ${angle.trim()}` : "";
    const inspiration = imgBase64 ? `\nINSPIRATION IMAGE: The topic has been extracted from the image and is shown above. Use that exact topic. Write the carousel entirely in my voice with fresh copy — do not reproduce any text from the image.` : "";
    const styles = [
      "myth-busting: challenge a common belief head-on, use data or logic to flip it",
      "story-driven: open with a relatable scenario, build tension, then resolve with insight",
      "contrarian: take the position most people disagree with and defend it with evidence",
      "data-driven: lead with a surprising stat or number on every slide, back every claim",
      "step-by-step: practical, sequential, each slide one concrete action",
      "empathetic: speak directly to the frustration, validate it, then reframe it",
    ];
    const style = angle.trim() ? `guided by this specific brief: "${angle.trim()}"` : styles[Math.floor(Math.random()*styles.length)];
    const narrativeStyle = angle.trim() ? "" : `\nNARRATIVE STYLE: ${style}`;
    return `You are creating an Instagram carousel for a ${btLabel}.
You are the copywriter AND creative director. Every slide must earn its place.

VOICE: ${voice}
AUDIENCE: ${audienceDesc}
TOPIC: "${topicStr}"${briefSection}${inspiration}
SLIDES: ${slideCount}${narrativeStyle}
TEXT DENSITY: ${textDensity === "concise" ? "PUNCHY — body text must be 80 characters maximum. One short punchy sentence. No exceptions. Count characters strictly." : textDensity === "detailed" ? "DEPTH — body text must be 160 characters maximum. Up to 3 short sentences. Explain the insight clearly but stay tight." : "BALANCED — body text must be 120 characters maximum. 1-2 sentences. Clear and direct. Every word earns its place."}

NARRATIVE ARC: hook → reality → insight → shift → advice → CTA

LAYOUT SYSTEM:
- "statement" — ALWAYS slide 1. Big bold headline, short punchy body optional. Make it provocative. Stop the scroll.
- "standard" — headline + body. Use for ALL middle slides. Body is where the value lives.
- "hero" — headline + body + CTA. ALWAYS final slide. Add "cta_items":["one CTA only"].

DO NOT use "split" or "cards" layouts. Write lists and comparisons as body text instead.

RULES:
- No two consecutive slides same layout
- Slide 1 always "statement"
- Final slide always "hero" with exactly one cta_items string
- Pick ONE accent word per headline — must be the single most emotionally charged, surprising, or powerful word in that headline. The word that makes someone stop. Exact match to how it appears in the headline. Put in "accent_word".
- Tags: must be editorially specific to what THAT slide is actually saying — like a magazine would label it. Unique per slide. E.g. "THE UNCOMFORTABLE TRUTH", "WHAT THE DATA SHOWS", "THE SILENT KILLER", "WHY MOST FAIL HERE", "THE TURNING POINT". Never generic: NOT "THE HOOK", "SLIDE 1", "THE PROBLEM", "THE SOLUTION", "THE CTA". Write each tag as if it is the headline of a newspaper column about that specific point.
- Headlines: max 10 words. Must be immediately clear on first read — no lines that can be misread as the opposite of what you mean. Contrarian is good. Ambiguous is not.. A clear statement, question, or insight. Think subheading not billboard.
- Body: REQUIRED on standard slides. 1-2 sentences MAX. Every sentence must be self-contained and immediately understandable without context. Use plain everyday language — no metaphors, no abstract concepts, no aphorisms. One specific insight or one actionable point. Ask yourself: would someone reading this on a phone at 9am understand it instantly? If not, rewrite it.
- Final slide (hero) CTA: MUST have body text (1-2 sentences reinforcing why they should act — make it specific to the topic, not generic). Then cta_items with ONE fresh, specific call to action written for this exact carousel. Never repeat the same CTA twice. Never invent a download, product, or link. Keep it to follow, save, share, or comment — but write the wording fresh every time.
- Only final slide gets cta. All others cta is null.
- No HTML, no cite tags, plain text only
- NO invented statistics or fabricated data. Only use facts you are confident are accurate and well-established. If uncertain, frame as a principle, observation, or opinion — never as a stated fact. Every body text must be specific and genuinely useful, not a generic statement dressed as insight.

Return ONLY valid JSON array:
[{"tag":"LABEL","headline":"text","body":"text","accent_word":"word","layout":"type","items":[],"vs_label":"VS","icon_symbol":"◆","cta_items":[],"cta":null}]`;
  };

  const generate = async (topicOverride) => {
    const t = topicOverride || topic;
    if (!t.trim()) { setErr("Add a topic first."); return; }
    if (!canGenerate()) { setNav("upgrade"); if (currentUser?.plan === "free") { fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"credits-exhausted-email" }) }).catch(()=>{}); } return; }
    if (!confirmLastCredit()) return;
    await checkMonthlyReset();
    setErr(""); setAngle(""); setView("generating"); setLastTopic(t);

    try {
      const messages = [{
        role: "user",
        content: inspirationImg
          ? [
              { type:"image", source:{ type:"base64", media_type:(inspirationImg.match(/data:(image\/[a-z]+);/)?.[1]||"image/jpeg"), data: inspirationImg.split(",")[1] }},
              { type:"text", text: buildPrompt(t, inspirationImg) }
            ]
          : buildPrompt(t, null)
      }];

      const d = await fetchWithRetry({ model:"claude-sonnet-4-6", max_tokens:3000, messages }, 4, true);
      const raw = d.content?.find(b=>b.type==="text")?.text||"";
      const clean = raw.replace(/<cite[^>]*>/g,"").replace(/<\/cite>/g,"").replace(/<[^>]+>/g,"");
      const m = clean.match(/\[[\s\S]*\]/);
      if (!m) throw new Error("no json");
      const parsed = JSON.parse(m[0]).map(sanitize);
      const newSlides = parsed.map((s, i) => ({
        ...s,
        layout: i === 0 ? "statement" : i === parsed.length - 1 ? "hero" : "standard"
      }));
      setSlides(newSlides); setActive(0); setView("preview"); setCaption(""); setShowCaption(false);

      const entry = { id: Date.now(), topic: t, slides: newSlides, date: new Date().toLocaleDateString() };
      const newHistory = [entry, ...history].slice(0, 10);
      setHistory(newHistory); saveHistory(newHistory);

      // Charge 10 credits for generation
      if (currentUser && !currentUser.is_admin && !isUnlimitedPlan(currentUser.plan)) {
        await fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"increment-downloads", email: currentUser.email, credits: 10 }) });
        refreshUser();
      }

    } catch { setErr("Generation failed — check your connection and try again. If the problem persists, try a shorter topic."); setView("setup"); }
  };

  const randomiseTopic = async () => {
    setRandomising(true);
    const btObj2 = BUSINESS_TYPES.find(b=>b.id===businessType);
    const btLabel = businessType==="other"?(otherType||"brand"):btObj2?.label||"Digital Marketer";
    const audDesc = audienceType==="peers" ? `other ${btLabel.toLowerCase()}s and industry professionals` : (btObj2?.audience||"your target audience");
    try {
      const angles = [
        "a surprising myth to bust in this industry",
        "a counterintuitive truth most people get wrong",
        "a specific mistake that quietly costs people money or time",
        "a common belief that is completely backwards",
        "a simple mindset shift that changes everything",
        "something everyone does that quietly holds them back",
        "a question nobody is asking but everyone should be",
        "the real reason most people fail at this",
        "what the top performers do differently",
        "an unpopular opinion that happens to be true",
        "a warning most people ignore until it is too late",
        "the thing nobody tells beginners but should",
        "a hidden cost that most people never account for",
        "why the conventional advice is wrong",
        "a small habit that compounds into a big result",
        "what success actually looks like vs what people expect",
        "the fastest way to improve at this",
        "a skill most people undervalue that changes everything",
      ];
      const angle = angles[Math.floor(Math.random()*angles.length)];
      const d = await fetchWithRetry({ model:"claude-sonnet-4-6", max_tokens:80, messages:[{ role:"user", content:`You are a creative director for social media. Give me ONE punchy Instagram carousel topic for a ${btLabel} whose audience is ${audDesc} — specifically about ${angle}. Voice: ${voiceProfile||"direct, honest, no hype"}. Make it specific, not generic. Never use asterisks or quotes. Return ONLY the topic, max 12 words.` }] });
      const idea = d.content?.find(b=>b.type==="text")?.text?.trim()||"";
      if (idea) { const clean = idea.replace(/[*_]/g,'').replace(/^["']+|["']+$/g,'').trim(); setTopic(clean.length>80?clean.slice(0,77)+'...':clean); }
    } catch {}
    setRandomising(false);
  };

  



  const extractTopicFromImage = async (imgBase64) => {
    try {
      const mediaType = imgBase64.match(/data:(image\/[a-z]+);/)?.[1] || "image/jpeg";
      const d = await fetchWithRetry({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imgBase64.split(",")[1] }},
            { type: "text", text: `Analyse this carousel image. Return a JSON object with exactly two fields:
1. "topic": the main topic or headline in 10 words or less
2. "brief": a 1-2 line brief describing the structure, tone, and angle of this carousel (e.g. "Title: X. Slides cover A, B, C. Tone is direct and punchy. Final slide has follow CTA.")
Return ONLY valid JSON, nothing else.` }
          ]
        }]
      });
      const raw = d.content?.find(b => b.type === "text")?.text?.replace(/[*_]/g,"").trim() || "";
      try {
        const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0]||"{}");
        if (parsed.topic) setTopic(parsed.topic);
        if (parsed.brief) setAngle(parsed.brief);
        setInspirationImg(null);
      } catch {
        // fallback - just set topic
        const clean = raw.replace(/[*_"{}]/g,"").trim();
        if (clean) setTopic(clean);
        setInspirationImg(null);
      }
    } catch(e) { console.error("Extract failed", e); }
  };

  const generateCaption = async () => {
    if (!canGenerate()) { setNav("upgrade"); if (currentUser?.plan === "free") { fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"credits-exhausted-email" }) }).catch(()=>{}); } return; }
    if (!confirmLastCredit()) return;
    setGeneratingCaption(true);
    setShowCaption(false);
    try {
      const btObj = BUSINESS_TYPES.find(b=>b.id===businessType);
      const btLabel = businessType==="other"?(otherType||"brand"):btObj?.label||"Digital Marketer";
      const audienceDesc = audienceType==="peers" ? `other ${btLabel.toLowerCase()}s` : (btObj?.audience||"your target audience");
      const slidesSummary = slides.map((s,i)=>`Slide ${i+1}: ${s.headline}`).join("\n");
      const d = await fetchWithRetry({ model:"claude-sonnet-4-6", max_tokens:400, messages:[{ role:"user", content:`Write an Instagram/LinkedIn caption for a carousel post about "${lastTopic}" for a ${btLabel} targeting ${audienceDesc}.\n\nThe carousel covers:\n${slidesSummary}\n\nVoice: ${voiceProfile||"Direct, honest, no hype. Short punchy sentences."}\n\nRules:\n- Hook in first line — make them stop scrolling\n- 3-5 sentences max\n- Tell them to swipe\n- Soft CTA at end (save, follow, comment — pick the most relevant)\n- Max 5 relevant hashtags at the end\n- No emojis unless they feel natural\n- Sign off as — ${name||"Tav"}\n\nReturn ONLY the caption text, nothing else.` }] }, 4, true);
      const text = d.content?.find(b=>b.type==="text")?.text?.trim()||"";
      if (text) { 
        setCaption(text); 
        setShowCaption(true);
        // Save caption to most recent history entry
        setHistory(prev => {
          if (!prev.length) return prev;
          const updated = [...prev];
          updated[0] = { ...updated[0], caption: text };
          saveHistory(updated);
          return updated;
        });
        // Charge 5 credits for caption
        if (currentUser && !currentUser.is_admin && !isUnlimitedPlan(currentUser.plan)) {
          await fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"increment-downloads", email: currentUser.email, credits: 5 }) });
          refreshUser();
        }
      }
    } catch(e) { console.error("Caption failed:", e); alert("Caption generation failed — try again."); }
    setGeneratingCaption(false);
  };

  const rewrite = async () => {
    if (!rewritePrompt.trim()) return;
    if (!canGenerate()) { setNav("upgrade"); if (currentUser?.plan === "free") { fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"credits-exhausted-email" }) }).catch(()=>{}); } return; }
    if (!confirmLastCredit()) return;
    setRewriting(true);
    try {
      const btObj3 = BUSINESS_TYPES.find(b=>b.id===businessType);
      const btLabel3 = businessType==="other"?(otherType||"brand"):btObj3?.label||"Digital Marketer";
      const audDesc3 = audienceType==="peers" ? `other ${btLabel3.toLowerCase()}s` : (btObj3?.audience||"your target audience");
      const d = await fetchWithRetry({ model:"claude-sonnet-4-6", max_tokens:600, messages:[{ role:"user", content:`Rewrite this carousel slide for a ${btLabel3} whose audience is ${audDesc3}.\n\nInstruction: "${rewritePrompt}"\n\nCurrent slide:\n${JSON.stringify(slides[active],null,2)}\n\nVoice: ${voiceProfile||"Direct, honest, specific. No hype."}\n\nKeep same JSON structure. Improve only what the instruction asks. Return ONLY valid JSON object. No markdown.` }] }, 4, true);
      const raw = (d.content?.find(b=>b.type==="text")?.text||"").replace(/<[^>]+>/g,"");
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { const next=[...slides]; next[active]=sanitize(JSON.parse(m[0])); setSlides(next); setRewritePrompt("");
        // Charge 5 credits for rewrite
        if (currentUser && !currentUser.is_admin && !isUnlimitedPlan(currentUser.plan)) {
          await fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"increment-downloads", email: currentUser.email, credits: 5 }) });
          refreshUser();
        }
      }
      else { alert("Rewrite failed — try again."); }
    } catch(e) { console.error("Rewrite error:", e); alert("Rewrite failed — check your connection and try again."); }
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

  const slideOpts = useCallback((slideIdx) => ({
    fontId, headlineStyle, bgMode, templateBgUrl,
    overlayDark: slideOverlays[slideIdx]??overlayDark,
    coverImageUrl: activeCoverPhoto, coverPosition, badgeArea,
    photoOpacity: slideIdx === 0 ? photoOpacity : templateOpacity,
    profileUrl, name, handle, blueTick,
    websiteUrl: currentUser?.plan==="free" ? "studio.buildwithtav.co" : (showWebsite?website:""),
    showNums, ratio, accentColor, bgColour, customColourDark, slideTextDark,
    coverImgPos, templateImgPos, gradientMode,
  }), [fontId,headlineStyle,bgMode,templateBgUrl,overlayDark,photoOpacity,templateOpacity,activeCoverPhoto,coverPosition,badgeArea,profileUrl,name,handle,blueTick,website,showWebsite,showNums,ratio,accentColor,coverImgPos,templateImgPos,bgColour,customColourDark,slideTextDark,slideOverlays,gradientMode,currentUser]);

  const downloadOne = async (i) => {
    if (!canGenerate()) { setNav("upgrade"); if (currentUser?.plan === "free") { fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"credits-exhausted-email" }) }).catch(()=>{}); } return; }
    if (!confirmLastCredit()) return;
    setDownloading(true);
    try {
      await downloadSlideAsPNG(slides[i], i, slides.length, slideOpts(i), `slide-${i+1}.png`, i===0);
      setDownloadDone(true); setTimeout(()=>setDownloadDone(false), 2000);
      if (currentUser && !currentUser.is_admin && !isUnlimitedPlan(currentUser.plan)) {
        await fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"increment-downloads", email: currentUser.email, credits: 5 }) });
        refreshUser();
      }
    } catch(e) { console.error(e); alert("Download failed — try again."); }
    setDownloading(false);
  };

  // Auto-restore custom slot selection when accentColor matches a saved slot
  useEffect(()=>{
    if(accentSwatch==="custom" && customActiveSlot !== null) return; // already set
    const matchIdx = accentCustomSlots.findIndex(c=>c&&c===accentColor);
    if(matchIdx >= 0) {
      setAccentSwatch("custom");
      setCustomActiveSlot(matchIdx);
    }
  },[]);

  // Refresh user data every 60 seconds so credit/plan changes show without signing out
  useEffect(()=>{
    if (!currentUser) return;
    const interval = setInterval(()=>{ refreshUser(); }, 60000);
    return () => clearInterval(interval);
  }, [currentUser?.email]);

  // Handle ?tab= URL param to navigate to specific tab on load
  useEffect(()=>{
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) { setNav(tab); window.history.replaceState({}, "", "/"); }
  }, []);

  const isMobileDevice = () => true;

  const slideHasCustomImage = (opts, isCover) => {
    // Cover photo only applies to slide 1 (isCover)
    if (isCover && opts.coverImageUrl) return true;
    // Template image applies to all non-cover slides
    if (!isCover && opts.templateBgUrl && opts.bgMode === "custom") return true;
    return false;
  };

  const renderSlideViaServer = async (slide, idx, total, opts, isCover) => {
    const isPortrait = opts.ratio==="portrait";
    const W=1080, H=isPortrait?1920:1350;
    const html = buildSlideHTML(slide,idx,total,opts,isCover);
    const res = await fetch("/api/render-slide", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ html, width:W, height:H })
    });
    const data = await res.json();
    if (!data.image) throw new Error(data.error||"Render failed");
    const byteChars = atob(data.image);
    const byteArr = new Uint8Array(byteChars.length);
    for (let j=0;j<byteChars.length;j++) byteArr[j]=byteChars.charCodeAt(j);
    return new Blob([byteArr],{type:"image/png"});
  };

  const renderSlideViaCanvas = (slide, idx, total, opts, isCover) => {
    return new Promise((res,rej) => {
      const isPortrait = opts.ratio==="portrait";
      const W=1080, H=isPortrait?1920:1350;
      const html = buildSlideHTML(slide,idx,total,opts,isCover);
      const iframe = document.createElement("iframe");
      iframe.style.cssText=`position:fixed;top:-9999px;left:-9999px;width:${W}px;height:${H}px;border:none;`;
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument||iframe.contentWindow?.document;
      doc.open(); doc.write(html); doc.close();
      setTimeout(async()=>{
        try {
          const win=iframe.contentWindow;
          await new Promise(r=>{const s=doc.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";s.onload=r;s.onerror=r;doc.head.appendChild(s);setTimeout(r,4000);});
          if(!win.html2canvas) throw new Error("no h2c");
          const canvas=await win.html2canvas(doc.querySelector(".slide")||doc.body,{useCORS:true,allowTaint:true,scale:1,width:W,height:H,windowWidth:W,windowHeight:H,backgroundColor:null,logging:false});
          canvas.toBlob(b=>{document.body.removeChild(iframe);res(b);},"image/png",1.0);
        } catch(e){document.body.removeChild(iframe);rej(e);}
      },2500);
    });
  };

  const downloadAll = async () => {
    if (!canGenerate()) { setNav("upgrade"); if (currentUser?.plan === "free") { fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"credits-exhausted-email" }) }).catch(()=>{}); } return; }
    if (!confirmLastCredit()) return;
    setDownloadingAll(true);
    const mobile = isMobileDevice();
    try {
      await new Promise((res,rej) => {
        if (window.JSZip) return res();
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        s.onload = res; s.onerror = rej; document.head.appendChild(s); setTimeout(res,5000);
      });
      const zip = new window.JSZip();
      for (let i=0; i<slides.length; i++) {
        let blob = null;
        for (let attempt=0; attempt<2; attempt++) {
          try {
            const opts = slideOpts(i);
            blob = mobile
            ? await renderSlideViaServer(slides[i],i,slides.length,opts,i===0)
            : await renderSlideViaCanvas(slides[i],i,slides.length,opts,i===0);
            if (blob) break;
          } catch(e) {
            console.error("Slide",i+1,"attempt",attempt+1,"failed:",e);
            if (attempt===0) await new Promise(r=>setTimeout(r,1000));
          }
        }
        if (blob) zip.file(`slide-${i+1}.png`,blob);
        else console.error("Slide",i+1,"failed after 2 attempts");
        if (mobile) await new Promise(r=>setTimeout(r,300));
      }
      const zipBlob = await zip.generateAsync({type:"blob"});
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href=url; a.download="carousel-slides.zip";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(()=>URL.revokeObjectURL(url),2000);
      if (isMobileDevice()) setTimeout(()=>alert("✓ Zip downloaded — open the Files app to find your slides."),1500);
      if (currentUser && !currentUser.is_admin && !isUnlimitedPlan(currentUser.plan)) {
        await fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"increment-downloads", email: currentUser.email, credits: 5 }) });
        refreshUser();
      }
    } catch(e){console.error("Zip failed:",e);alert("Download failed — try again.");}
    setDownloadingAll(false); setDownloadDone(true); setTimeout(()=>setDownloadDone(false),4000);
  };

  const generateQuotes = async () => {
    if (!canGenerate()) { setNav("upgrade"); if (currentUser?.plan === "free") { fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"credits-exhausted-email" }) }).catch(()=>{}); } return; }
    if (!confirmLastCredit()) return;
    await checkMonthlyReset();
    setGeneratingQuotes(true);
    const btLabel = businessType==="other"?(otherType||"brand"):BUSINESS_TYPES.find(b=>b.id===businessType)?.label||"Digital Marketer";
    const emptyCount = quoteInputs.filter(q=>!q.trim()).length;
    const needed = emptyCount || 3;
    try {
      const prompt = quoteMode === "life"
        ? `Generate ${needed} short, powerful life and mindset quotes. Theme: positivity, resilience, self-belief, growth, emotional truth. Universal — anyone can relate regardless of industry.

RULES:
- About the reader's own inner world, choices, and potential. Never business-specific.
- The logic must hold as a standalone truth. No contradictions.
- Emotionally resonant — should make someone stop and think or feel something.
- Max 12 words each. No attribution, no author names.

Return ONLY a JSON array of ${needed} strings.`
        : `Generate ${needed} short, powerful quotes for a ${btLabel}. Voice: ${voiceProfile||"direct, honest, real"}.

RULES:
- Every quote must be about the READER and their own situation. Never mention competitors or third parties.
- The subject and conclusion must be directly and logically connected. No contradictions.
- Must stand alone as a complete truth — no context needed to understand it.
- Read each quote back and ask: does the logic hold? If not, rewrite it.
- Max 12 words each. No attribution, no author names.

Return ONLY a JSON array of ${needed} strings.`;
      const d = await fetchWithRetry({ model:"claude-sonnet-4-6", max_tokens:400, messages:[{ role:"user", content:prompt }] }, 4, true);
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
        // Charge 10 credits for quote generation
        if (currentUser && !currentUser.is_admin && !isUnlimitedPlan(currentUser.plan)) {
          await fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"increment-downloads", email: currentUser.email, credits: 10 }) });
          refreshUser();
        }
      }
    } catch(e) { console.error("generateQuotes error:", e); alert("Quote error: " + e.message); }
    setGeneratingQuotes(false);
  };

  const buildQuoteHTML = (quoteText, sig, textColorOverride, opacityOverride) => {
    const accent = accentColor || GOLD;
    const isDark = quoteBgMode !== "light";
    const hasBgImg = quoteBgMode === "custom" && quoteBgCustomUrl;
    const effectiveQuoteOpacity = opacityOverride !== undefined ? opacityOverride : quotePhotoOpacity;
    const bg = isDark ? "#0d0b08" : "#F8F4EE";
    const textColor = textColorOverride || (hasBgImg ? "#FFFFFF" : (isDark ? "#F5EDE0" : "#1a1208"));
    const subColor = hasBgImg ? "rgba(255,255,255,0.85)" : (isDark ? "rgba(245,237,224,0.7)" : "rgba(26,18,8,0.55)");
    const textShadow = ""; // placeholder — real value set after cardTextColor is declared below
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
        <span style="color:${textColor};font-size:${Math.round(24*s)}px;font-family:'Montserrat',sans-serif;font-weight:700;letter-spacing:${Math.round(3*s)}px;opacity:0.75;">${esc(handleStr)}</span>
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
        <span style="color:${luxAccent};font-size:${Math.round(22*s)}px;font-family:'Montserrat',sans-serif;font-weight:700;letter-spacing:${Math.round(5*s)}px;opacity:0.8;">${esc(handleStr)}</span>
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
        <span style="color:${femAccent};font-size:${Math.round(22*s)}px;font-family:'Montserrat',sans-serif;font-weight:700;letter-spacing:${Math.round(3*s)}px;opacity:0.85;">${esc(handleStr)}</span>
      </div>` : "";

    const rawTextC = isDark ? "#FFFFFF" : "#0A0A0A";
    const cardTextColor = tmpl === "feminine" ? femText : textColor;
    const cardSubColor = tmpl === "feminine" ? (isDark?"rgba(245,237,232,0.7)":"rgba(58,37,32,0.6)") : subColor;
    // Glow: on custom image only. Dark text → white glow. Light text → dark glow.
    const quoteDarkText = cardTextColor === "#0A0A0A" || cardTextColor === "#1a1208" || cardTextColor === "#3a2520";
    const quoteTextShadow = hasBgImg
      ? (quoteDarkText
          ? "text-shadow:0 0 20px rgba(255,255,255,0.9),0 0 40px rgba(255,255,255,0.5);"
          : "text-shadow:0 0 20px rgba(0,0,0,0.9),0 0 40px rgba(0,0,0,0.5);")
      : "";
    const rawHTML = `
      <div style="position:absolute;top:${Math.round(24*s)}px;left:${Math.round(24*s)}px;right:${Math.round(24*s)}px;height:${Math.round(18*s)}px;background:${rawTextC};z-index:3;pointer-events:none;border-radius:${Math.round(2*s)}px;"></div>
      <div style="position:absolute;bottom:${Math.round(90*s)}px;left:${Math.round(24*s)}px;right:${Math.round(24*s)}px;height:${Math.round(6*s)}px;background:${rawTextC};opacity:0.5;z-index:3;pointer-events:none;border-radius:${Math.round(2*s)}px;"></div>
      <div style="position:absolute;top:${Math.round(68*s)}px;left:${Math.round(24*s)}px;bottom:${Math.round(120*s)}px;width:${Math.round(10*s)}px;background:${accent};z-index:3;pointer-events:none;"></div>`;
    const rawDivider = `
      <div style="width:100%;height:${Math.round(2*s)}px;background:${rawTextC};opacity:0.12;margin-bottom:${Math.round(52*s)}px;"></div>`;
    const rawLabel = `
      <div style="margin-bottom:${Math.round(32*s)}px;width:100%;padding-left:${Math.round(20*s)}px;">
        <span style="font-size:${Math.round(22*s)}px;letter-spacing:${Math.round(10*s)}px;text-transform:uppercase;font-family:'${font}',sans-serif;font-weight:700;color:${textColor};opacity:0.4;">${luxuryLabel||"Truth"}</span>
      </div>`;
    const rawHandle = showHandle&&handleStr ? `
      <div style="position:absolute;bottom:${Math.round(100*s)}px;left:${Math.round(60*s)}px;z-index:6;">
        <span style="color:${textColor};font-size:${Math.round(22*s)}px;font-family:'Montserrat',sans-serif;font-weight:700;opacity:0.6;letter-spacing:${Math.round(3*s)}px;">${esc(handleStr)}</span>
      </div>` : "";

    const customDivider = `
      <div style="width:${Math.round(100*s)}px;height:${Math.round(2*s)}px;background:${accent};margin:0 auto ${Math.round(52*s)}px;opacity:0.7;"></div>`;

    const contentPadX = tmpl === "feminine" ? Math.round(140*s) : padX;
    const contentPadTop = tmpl === "feminine" ? Math.round(220*s) : padTop;
    const contentPadBottom = tmpl === "feminine" ? Math.round(240*s) : padBottom;
    const isLeft = tmpl === "raw" && !hasBgImg;
    const tExtras = { classic: classicHTML, luxury: luxuryHTML, feminine: feminineHTML, raw: rawHTML, custom: "" }[tmpl] || "";
    const tDivider = { classic: classicDivider, luxury: luxuryDivider, feminine: feminineDivider, raw: rawDivider, custom: customDivider }[tmpl] || customDivider;
    const tHandle = { classic: classicHandle, luxury: luxuryHandle, feminine: feminineHandle, raw: rawHandle, custom: "" }[tmpl] || (showHandle&&handleStr?`<div style="position:absolute;bottom:${handleBottom}px;left:0;right:0;text-align:center;z-index:6;"><span style="color:${accent};font-size:${Math.round(26*s)}px;font-family:'Montserrat',sans-serif;font-weight:700;letter-spacing:3px;opacity:0.85;">${esc(handleStr)}</span></div>`:"");
    const cardBg = tmpl === "feminine" ? femBg : hasBgImg ? "#FFFFFF" : bg;

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@import url('${gFonts}');
*{box-sizing:border-box;margin:0;padding:0;}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${cardBg};}
.slide{width:${W}px;height:${H}px;background:${cardBg};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${contentPadTop}px ${contentPadX}px ${contentPadBottom}px;position:relative;}
.bg-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:${(effectiveQuoteOpacity||100)/100};}
.bg-ov{position:absolute;inset:0;z-index:1;pointer-events:none;}
.content{position:relative;z-index:5;width:100%;display:flex;flex-direction:column;align-items:${isLeft?"flex-start":"center"};text-align:${isLeft?"left":"center"};}
.quote{font-size:${quoteSz}px;font-weight:700;line-height:1.32;color:${cardTextColor};font-style:italic;font-family:'${font}',serif;text-align:${isLeft?"left":"center"};margin-bottom:${Math.round(60*s)}px;${quoteTextShadow}}
.sig{font-size:${sigSz}px;font-weight:600;color:${cardTextColor};opacity:0.75;font-family:'${sigFont}',cursive,serif;${quoteTextShadow}text-align:${isLeft?"left":"center"};width:100%;}
</style>
</head><body>
<div class="slide">
  ${hasBgImg?`<img class="bg-img" src="${quoteBgCustomUrl}" />${(quoteOverlay||0)>0?`<div class="bg-ov" style="background:linear-gradient(to top,rgba(0,0,0,${Math.min((quoteOverlay/100)*0.95,0.92)}) 0%,rgba(0,0,0,${Math.min((quoteOverlay/100)*0.4,0.5)}) 50%,rgba(0,0,0,0) 100%)"></div>`:""}`:""}
  ${tExtras}
  <div class="content">
    ${tmpl==="raw"?rawLabel:""}
    <div class="quote">&#8220;${escapedQuote}&#8221;</div>
    ${tDivider}
    ${signature?`<div class="sig">${esc(signature)}</div>`:""}
  </div>
  ${tHandle}
  ${currentUser?.plan==="free"?`<div style="position:absolute;top:${Math.round(28*s)}px;left:0;right:0;text-align:center;z-index:10;"><span style="font-family:'Montserrat',sans-serif;font-size:${Math.round(28*s)}px;font-weight:800;color:#ffffff;text-shadow:0 2px 8px rgba(0,0,0,0.9),0 0 20px rgba(0,0,0,0.8);letter-spacing:2px;">studio.buildwithtav.co</span></div>`:""}
</div>
</body></html>`;
  };

  const downloadQuote = async (quoteText, i) => {
    const isPortrait = quoteFormat === "portrait";
    const W = 1080, H = isPortrait ? 1920 : 1350;
    const html = buildQuoteHTML(quoteText, null, quoteTextColor);
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const needsServer = mobile && !!quoteBgCustomUrl;

    if (needsServer) {
      const res = await fetch("/api/render-slide", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ html, width: W, height: H })
      });
      const data = await res.json();
      if (!data.image) throw new Error(data.error || "Render failed");
      const byteChars = atob(data.image);
      const byteArr = new Uint8Array(byteChars.length);
      for (let j=0; j<byteChars.length; j++) byteArr[j] = byteChars.charCodeAt(j);
      return new Blob([byteArr], {type:"image/png"});
    }

    return new Promise((resolve, reject) => {
      const iframe = document.createElement("iframe");
      iframe.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${W}px;height:${H}px;border:none;`;
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      doc.open(); doc.write(html); doc.close();
      setTimeout(async () => {
        try {
          const win = iframe.contentWindow;
          await new Promise(r => { const s=doc.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"; s.onload=r; s.onerror=r; doc.head.appendChild(s); setTimeout(r,4000); });
          if (!win.html2canvas) throw new Error("no h2c");
          const canvas = await win.html2canvas(doc.querySelector(".slide")||doc.body, {useCORS:true,allowTaint:true,scale:1,width:W,height:H,windowWidth:W,windowHeight:H,backgroundColor:null,logging:false});
          canvas.toBlob(blob => { document.body.removeChild(iframe); resolve(blob); }, "image/png", 1.0);
        } catch(e) { document.body.removeChild(iframe); reject(e); }
      }, 2000);
    });
  };

  const downloadAllQuotes = async () => {
    const filled = quoteInputs.filter(q => q.trim());
    if (!canGenerate()) { setNav("upgrade"); if (currentUser?.plan === "free") { fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"credits-exhausted-email" }) }).catch(()=>{}); } return; }
    if (filled.length > 1 && !isUnlimitedPlan(currentUser?.plan) && !currentUser?.is_admin) {
      if (!window.confirm(`Downloading all ${filled.length} quote cards will use ${filled.length} credits. Continue?`)) return;
    }
    setDownloadingQuotes(true);
    try {
      await new Promise((res,rej) => {
        if (window.JSZip) return res();
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        s.onload = res; s.onerror = rej; document.head.appendChild(s); setTimeout(res,5000);
      });
      const zip = new window.JSZip();
      for (let i=0; i<filled.length; i++) {
        try {
          const blob = await downloadQuote(filled[i], i);
          if (blob) {
            zip.file(`quote-${i+1}.png`, blob);
            if (currentUser && !currentUser.is_admin && !isUnlimitedPlan(currentUser.plan)) {
              await fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"increment-downloads", email: currentUser.email, credits: 5 }) });
            }
          }
        } catch(e) { console.error("Quote", i+1, "failed:", e); }
      }
      const zipBlob = await zip.generateAsync({type:"blob"});
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href=url; a.download="quote-cards.zip";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(()=>URL.revokeObjectURL(url),2000);
      if (currentUser && !currentUser.is_admin && !isUnlimitedPlan(currentUser.plan)) refreshUser();
    } catch(e) { console.error("Quote zip failed:", e); alert("Download failed — try again."); }
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

  const planLabel = currentUser?.plan === "agency" ? "agency" : currentUser?.plan === "pro" ? "pro" : currentUser?.plan === "starter" ? "starter" : currentUser?.plan === "affiliate_licence" ? "affiliate_licence" : currentUser?.plan === "white_label" ? "white_label" : "free";
  const isPexelsUser = ["pro","agency","affiliate_licence","white_label"].includes(planLabel);
  const [showPexelsCover, setShowPexelsCover] = useState(false);
  const [showPexelsTemplate, setShowPexelsTemplate] = useState(false);
  const [showPexelsTmplLib, setShowPexelsTmplLib] = useState(false);
  const [showPexelsQuote, setShowPexelsQuote] = useState(false);
  const NAV_ITEMS = [["generate","Generate"],...(currentUser?.is_admin?[["templates","Templates"]]:[]),["quotes","Quotes"],["brand","Brand"],["visual","Visual"],["history","History"],["help","Help"],["account","Account"]];
  const BURGER_ITEMS = [["quotes","Quotes"],["brand","Brand"],["visual","Visual"],["history","History"],["help","Help"],["account","Account"]];
  const MAIN_NAV = [["generate","Generate"],...(currentUser?.is_admin?[["templates","Templates"]]:[])];

  return (
    <div style={{minHeight:"100vh",background:A.bg,color:A.text,fontFamily:"Plus Jakarta Sans,system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Dancing+Script:wght@600;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        .desktop-nav{display:flex!important}
        .mobile-nav{display:none!important}
        .desktop-reset{display:inline-flex}
        @media(max-width:768px){
          .desktop-nav{display:none!important}
          .mobile-nav{display:flex!important}
          nav{padding:0 12px!important}
          .desktop-reset{display:none!important}
          body,html,#__next{width:100%!important;max-width:100vw!important;overflow-x:hidden!important}
          nav{width:100%!important;max-width:100vw!important}
          .mobile-edit-btn{display:flex!important}
          .mobile-drawer{display:block!important}
          .preview-scroll-area{padding-bottom:120px!important}
          .desktop-only{display:none!important}
          .cover-format-grid{grid-template-columns:1fr!important}
          .topic-textarea{min-height:unset!important}
          .quotes-layout{grid-template-columns:1fr!important}
          .quotes-preview-col{display:none!important}
          .quotes-mobile-preview{display:flex!important}
          .quotes-format-card{display:none!important}
          .cmd-hint{display:none!important}
          .desktop-edit-panel{display:none!important}
          .topic-row input{width:100%!important;flex:unset!important}

          /* Brand tab */
          .brand-grid{grid-template-columns:1fr!important}
          .brand-color-grid{grid-template-columns:1fr 1fr!important}

          /* Visual tab */
          .visual-grid{grid-template-columns:1fr!important}
          .visual-preview-col{display:none!important}

          /* Help tab */
          .help-grid{grid-template-columns:1fr!important}

          /* Account tab */
          .account-inner{padding:16px!important}
          .account-view{padding:0 14px!important}
          .upgrade-view{padding:0 14px!important}

          /* Upgrade view — plan cards 2 col on mobile */
          .plan-cards-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
          .plan-cards-grid>div{padding:12px 10px!important}
          .plan-cards-grid .plan-price{font-size:17px!important}
          .plan-cards-grid .plan-name{font-size:11px!important}
          .plan-cards-grid .plan-credits{font-size:9px!important}
          .plan-cards-grid button{padding:8px!important;font-size:10px!important}
          .plan-cards-grid li{font-size:10px!important;margin-bottom:4px!important}

          /* Affiliate and White Label boxes */
          .aff-features-grid{grid-template-columns:1fr!important}

          /* Top-ups */
          .topup-row{flex-direction:column!important}

          /* General tab content breathing room */
          .tab-content{padding:16px 14px!important}
          .upgrade-header{flex-direction:column!important;gap:8px!important}

          /* Make all surface boxes slightly more compact */
          div[style*="padding:24"]{padding:16px!important}
          div[style*="padding:20"]{padding:14px!important}
          div[style*="padding:28"]{padding:16px!important}
          div[style*="padding:32"]{padding:18px!important}
          div[style*="marginBottom:16"]{margin-bottom:10px!important}
          div[style*="marginBottom:28"]{margin-bottom:16px!important}
        }
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .topic-textarea{min-height:42px}
        body.drawer-open{overflow:hidden!important;}
        *{box-sizing:border-box}input,textarea,select{outline:none!important;font-family:inherit}
        button{cursor:pointer;font-family:inherit;border:none;transition:all 0.15s}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${A.border};border-radius:2px}
        input[type=range]{-webkit-appearance:none;height:3px;border-radius:2px;background:${A.border};width:100%}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${A.text};cursor:pointer}
        .topup-btn:hover { border-color: #BB9900 !important; color: #BB9900 !important; transform: translateY(-1px); }
        .topup-btn { transition: all 0.15s; }
      `}</style>

      {/* AUTH LOADING */}
      {authLoading&&(
        <div style={{position:"fixed",inset:0,background:A.bg,display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
            <div style={{width:32,height:32,borderRadius:"50%",border:`3px solid ${A.border}`,borderTop:`3px solid ${GOLD}`,animation:"spin 0.7s linear infinite"}}/>
            <span style={{color:A.muted,fontSize:13}}>Loading...</span>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {showAuthModal&&!authLoading&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9998,padding:16}}>
          <div style={{background:A.surface,borderRadius:16,padding:32,width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
              <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#1a1a1a,#2a2a2a)",border:`1.5px solid ${GOLD}44`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{color:GOLD,fontSize:13,fontWeight:900}}>C</span>
              </div>
              <div>
                <div style={{fontSize:15,fontWeight:800}}>Carousel Studio</div>
                <div style={{fontSize:10,color:A.muted}}>by <span style={{color:GOLD,fontWeight:700}}>BuildWithTav</span></div>
              </div>
            </div>
            {!otpSent ? (
              <>
                <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 6px"}}>Sign in to continue</h2>
                <p style={{fontSize:13,color:A.muted,margin:"0 0 20px",lineHeight:1.6}}>Enter your details and we'll send you a 6 digit code. No password needed.</p>
                <label style={lbl}>First name</label>
                <input value={authFirstName} onChange={e=>setAuthFirstName(e.target.value)} placeholder="Your first name" type="text" style={{...inp,marginBottom:12,fontSize:15}}/>
                <label style={lbl}>Email address</label>
                <input value={authEmail} onChange={e=>setAuthEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendOtp()} placeholder="you@example.com" type="email" style={{...inp,marginBottom:12,fontSize:15}}/>
                {authError&&<p style={{color:"#c0392b",fontSize:12,margin:"0 0 10px"}}>{authError}</p>}
                <button onClick={sendOtp} disabled={authSubmitting} style={{width:"100%",padding:"13px",background:A.text,color:A.accentText,borderRadius:10,fontWeight:700,fontSize:15,border:"none"}}>
                  {authSubmitting?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Spin/>Sending...</span>:"Send Code"}
                </button>
                <div style={{display:"flex",alignItems:"flex-start",gap:10,margin:"14px 0 0"}}>
                  <input type="checkbox" id="marketing-consent" checked={marketingConsent} onChange={e=>setMarketingConsent(e.target.checked)} style={{marginTop:2,accentColor:GOLD,flexShrink:0,width:16,height:16,cursor:"pointer"}}/>
                  <label htmlFor="marketing-consent" style={{fontSize:11,color:A.muted,lineHeight:1.6,cursor:"pointer"}}>
                    I agree to receive emails from Carousel Studio including product updates, account notices and offers. Unsubscribe at any time. By continuing you agree to our <a href="/terms" target="_blank" rel="noopener noreferrer" style={{color:GOLD,textDecoration:"none"}}>Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{color:GOLD,textDecoration:"none"}}>Privacy Policy</a>.
                  </label>
                </div>
              </>
            ) : (
              <>
                <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 6px"}}>Check your email</h2>
                <p style={{fontSize:13,color:A.muted,margin:"0 0 20px",lineHeight:1.6}}>We sent a 6 digit code to <strong>{authEmail}</strong>. Enter it below.</p>
                <label style={lbl}>6 digit code</label>
                <input value={otpCode} onChange={e=>setOtpCode(e.target.value.replace(/\D/g,"").slice(0,6))} onKeyDown={e=>e.key==="Enter"&&verifyOtp()} placeholder="000000" type="text" inputMode="numeric" maxLength={6} style={{...inp,marginBottom:12,fontSize:22,letterSpacing:8,textAlign:"center"}}/>
                {authError&&<p style={{color:"#c0392b",fontSize:12,margin:"0 0 10px"}}>{authError}</p>}
                <button onClick={verifyOtp} disabled={authSubmitting||otpCode.length!==6} style={{width:"100%",padding:"13px",background:otpCode.length===6?A.text:A.border,color:A.accentText,borderRadius:10,fontWeight:700,fontSize:15,border:"none"}}>
                  {authSubmitting?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Spin/>Verifying...</span>:"Confirm"}
                </button>
                <button onClick={sendOtp} disabled={authSubmitting} style={{width:"100%",padding:"10px",background:"none",color:A.muted,border:`1px solid ${A.border}`,borderRadius:8,fontSize:13,marginTop:8}}>{authSubmitting?"Sending...":"Resend code"}</button>
                <button onClick={()=>{setOtpSent(false);setOtpCode("");setAuthError("");}} style={{width:"100%",padding:"10px",background:"none",color:A.muted,border:"none",fontSize:13,marginTop:4}}>← Use a different email</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* UPGRADING OVERLAY */}
      {upgrading&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
            <div style={{width:32,height:32,borderRadius:"50%",border:`3px solid ${GOLD}44`,borderTop:`3px solid ${GOLD}`,animation:"spin 0.7s linear infinite"}}/>
            <span style={{color:"#fff",fontSize:14,fontWeight:600}}>Redirecting to checkout...</span>
          </div>
        </div>
      )}
      {upgradePrompt&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9997,padding:16}}>
          <div style={{background:A.surface,borderRadius:16,padding:32,width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
            <button onClick={()=>setUpgradePrompt(false)} style={{position:"absolute",top:16,right:16,background:"none",border:"none",fontSize:20,color:A.muted,cursor:"pointer"}}>✕</button>
            <div style={{fontSize:32,marginBottom:12}}>⚡</div>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 8px"}}>
              {creditsRemaining()===0 ? "You've used all your credits" : "Upgrade your plan"}
            </h2>
            <p style={{fontSize:13,color:A.muted,margin:"0 0 24px",lineHeight:1.6}}>
              {creditsRemaining()===0
                ? currentUser?.plan==="free" ? "Free accounts get 6 credits per month. Upgrade for more." : "You've hit your monthly limit. Upgrade to Pro for 800 credits/month."
                : "More credits, more features. Cancel anytime."}
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <button onClick={()=>{setUpgradePrompt(false);setNav("upgrade");}} style={{padding:"14px",background:GOLD,color:"#000",borderRadius:10,fontWeight:700,fontSize:15,border:"none",textAlign:"center"}}>
                See All Plans & Pricing →
              </button>
              <button onClick={()=>setUpgradePrompt(false)} style={{padding:"10px",background:"none",color:A.muted,border:"none",fontSize:13}}>Maybe later</button>
            </div>
          </div>
        </div>
      )}

      <nav style={{borderBottom:`1px solid ${A.border}`,padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"flex-start",height:56,position:"sticky",top:0,background:`${A.bg}EE`,backdropFilter:"blur(20px)",zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8,paddingRight:4}}>
          <div style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,#1a1a1a,#2a2a2a)`,border:`1.5px solid ${GOLD}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{color:GOLD,fontSize:12,fontWeight:900}}>C</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:1,lineHeight:1}}>
            <span style={{fontSize:13,fontWeight:800,letterSpacing:-0.3,lineHeight:1.1}}>Carousel Studio</span>
            <span style={{fontSize:9,color:A.muted,letterSpacing:0.3,lineHeight:1}}>by <span style={{color:GOLD,fontWeight:700}}>BuildWithTav</span></span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"stretch",gap:0,marginLeft:"auto"}}>
          {/* Desktop nav - all items */}
          <div style={{display:"none"}} className="desktop-nav">
            {NAV_ITEMS.map(([id,label])=>(
              <button key={id} onClick={()=>setNav(id)} style={{background:"none",border:"none",borderBottom:nav===id?`2px solid ${GOLD}`:"2px solid transparent",color:nav===id?A.text:A.muted,padding:"0 14px",fontSize:13,fontWeight:nav===id?700:500,height:56,display:"flex",alignItems:"center",cursor:"pointer",flexShrink:0}}>
                {label}
              </button>
            ))}
          </div>
          {/* Mobile nav - Generate + Quotes + Burger */}
          <div style={{display:"flex",alignItems:"stretch"}} className="mobile-nav">
            {MAIN_NAV.map(([id,label])=>(
              <button key={id} onClick={()=>{setNav(id);setMenuOpen(false);}} style={{background:"none",border:"none",borderBottom:nav===id?`3px solid ${GOLD}`:"3px solid transparent",color:nav===id?A.text:A.muted,padding:"0 20px",fontSize:15,fontWeight:nav===id?700:500,height:56,display:"flex",alignItems:"center",cursor:"pointer",flexShrink:0}}>
                {label}
              </button>
            ))}
            <button onClick={()=>setMenuOpen(o=>!o)} style={{background:"none",border:"none",color:menuOpen?A.text:A.muted,padding:"0 16px",fontSize:22,height:56,display:"flex",alignItems:"center",cursor:"pointer",flexShrink:0}}>
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
          {nav==="generate"&&view==="preview"&&<>
            <button onClick={()=>generate(lastTopic)} style={{background:"transparent",border:`1.5px solid ${A.border}`,color:A.muted,padding:"5px 12px",borderRadius:7,fontSize:12,fontWeight:600,marginLeft:8}}>↺ Regenerate</button>
            <button onClick={()=>{setView("setup");setSlides([]);setNav("generate");}} style={{background:"transparent",border:`1.5px solid ${A.border}`,color:A.muted,padding:"5px 12px",borderRadius:7,fontSize:12,fontWeight:600}}>← New</button>
          </>}
          {/* Credit counter — desktop only */}
          {currentUser&&(
            <div className="desktop-only" style={{display:"flex",alignItems:"center",gap:6,padding:"0 10px",borderLeft:`1px solid ${A.border}`,marginLeft:4}}>
              <span style={{fontSize:11,fontWeight:700,color:currentUser.plan==="free"&&creditsRemaining()===0?"#c0392b":currentUser.plan==="free"&&creditsRemaining()===1?"#e67e22":GOLD}}>
                {currentUser.plan==="free"&&creditsRemaining()===0?"No credits left":currentUser.plan==="free"&&creditsRemaining()===1?"1 credit left ⚠️":currentUser.plan==="free"?`${creditsRemaining()} free`:`${creditsRemaining()} left`}
              </span>
              {planLabel!=="affiliate_licence"&&planLabel!=="white_label"&&<button onClick={()=>setNav("upgrade")} style={{fontSize:10,fontWeight:700,padding:"3px 8px",background:GOLD,color:"#000",border:"none",borderRadius:5}}>Upgrade</button>}
            </div>
          )}
          <button onClick={()=>{if(window.confirm("Reset app? This will clear all brand settings and history.")){{localStorage.removeItem(STORAGE_KEY);localStorage.removeItem("bwt_history");window.location.reload();}}}} className="desktop-reset" style={{background:"transparent",border:`1.5px solid ${A.border}`,color:A.muted,padding:"5px 12px",borderRadius:7,fontSize:12,marginLeft:4,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"}}>Reset app</button>
          {currentUser&&<button onClick={logout} className="desktop-only" style={{background:"transparent",border:`1.5px solid ${A.border}`,color:A.muted,padding:"5px 12px",borderRadius:7,fontSize:12,marginLeft:4}}>Sign out</button>}
        </div>
      </nav>
      {menuOpen&&(
        <div style={{position:"fixed",top:56,left:0,right:0,background:A.bg,borderBottom:`1px solid ${A.border}`,zIndex:999,padding:"8px 0",boxShadow:"0 4px 20px rgba(0,0,0,0.1)"}}>
          {/* Credits in burger menu */}
          {currentUser&&(
            <div style={{padding:"12px 24px",borderBottom:`1px solid ${A.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:14,fontWeight:700,color:currentUser.plan==="free"&&creditsRemaining()===0?"#c0392b":currentUser.plan==="free"&&creditsRemaining()===1?"#e67e22":GOLD}}>
                {currentUser.plan==="free"&&creditsRemaining()===0?"No credits left":currentUser.plan==="free"&&creditsRemaining()===1?"⚠️ 1 credit left":currentUser.plan==="free"?`${creditsRemaining()} free credits`:`${creditsRemaining()} credits left`}
              </span>
              {planLabel!=="affiliate_licence"&&planLabel!=="white_label"&&<button onClick={()=>{setMenuOpen(false);setNav("upgrade");}} style={{fontSize:12,fontWeight:700,padding:"6px 14px",background:GOLD,color:"#000",border:"none",borderRadius:6}}>Upgrade</button>}
            </div>
          )}
          {BURGER_ITEMS.map(([id,label])=>(
            <button key={id} onClick={()=>{setNav(id);setMenuOpen(false);}} style={{display:"flex",alignItems:"center",width:"100%",padding:"16px 24px",background:nav===id?A.surface:"none",border:"none",borderLeft:nav===id?`3px solid ${GOLD}`:"3px solid transparent",color:nav===id?A.text:A.muted,fontSize:16,fontWeight:nav===id?700:500,cursor:"pointer",textAlign:"left"}}>
              {label}
            </button>
          ))}
          <button onClick={()=>{setMenuOpen(false);if(window.confirm("Reset app? This will clear all brand settings and history.")){localStorage.removeItem(STORAGE_KEY);localStorage.removeItem("bwt_history");localStorage.removeItem("bwt_quote_history");window.location.reload();}}} style={{display:"flex",alignItems:"center",width:"100%",padding:"16px 24px",background:"none",border:"none",borderLeft:"3px solid transparent",color:"#c0392b",fontSize:16,fontWeight:500,cursor:"pointer",textAlign:"left"}}>
            Reset app
          </button>
          {currentUser&&<button onClick={()=>{setMenuOpen(false);logout();}} style={{display:"flex",alignItems:"center",width:"100%",padding:"16px 24px",background:"none",border:"none",borderLeft:"3px solid transparent",color:A.muted,fontSize:16,fontWeight:500,cursor:"pointer",textAlign:"left"}}>Sign out</button>}
        </div>
      )}

      <div style={{maxWidth:1200,margin:"0 auto",padding:"20px 16px"}}>

        {nav==="quotes"&&(
          <div style={{animation:"fadeUp 0.3s ease",maxWidth:960,margin:"0 auto"}}>
            <div style={{marginBottom:24}}>
              <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 6px"}}>Quote Cards</h2>
              <p style={{color:A.muted,fontSize:14,margin:0}}>Create up to 3 branded quote cards. Accent colour pulls from Brand settings.</p>
            </div>
            {/* Mobile only - format + background in white card, then preview */}
            <div className="quotes-mobile-preview" style={{display:"none",flexDirection:"column",gap:12,marginBottom:16}}>
              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:16,display:"flex",flexDirection:"column",gap:10}}>
                <div>
                  <label style={lbl}>Format</label>
                  <div style={{display:"flex",gap:8}}>
                    {[["instagram","Instagram · LinkedIn · TikTok Photos"],["portrait","Stories · Reels · TikTok Video"]].map(([id,label])=>(
                      <button key={id} onClick={()=>setQuoteFormat(id)} style={{flex:1,background:quoteFormat===id?A.text:A.bg,border:`1.5px solid ${quoteFormat===id?A.text:A.border}`,color:quoteFormat===id?A.accentText:A.muted,padding:"7px",borderRadius:7,fontSize:11,fontWeight:700}}>{label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Background</label>
                  <div style={{display:"flex",gap:8,marginBottom:quoteBgMode==="custom"?10:0}}>
                    {[["dark","Dark"],["light","Light"],["custom","Custom"]].map(([id,label])=>(
                      <button key={id} onClick={()=>{setQuoteBgMode(id);if(id==="dark")setQuoteTextColor("#FFFFFF");if(id==="light")setQuoteTextColor("#0A0A0A");if(id==="custom")setQuoteTextColor("#FFFFFF");}} style={{flex:1,background:quoteBgMode===id?A.text:A.bg,border:`1.5px solid ${quoteBgMode===id?A.text:A.border}`,color:quoteBgMode===id?A.accentText:A.muted,padding:"7px",borderRadius:7,fontSize:11,fontWeight:700}}>{label}</button>
                    ))}
                  </div>
                  {quoteBgMode==="custom"&&(
                    <div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                        {quotePhotos.map((p,i)=>(
                          <div key={i} style={{position:"relative",flexShrink:0}}>
                            <div onClick={()=>setQuoteBgCustomUrl(quoteBgCustomUrl===p?null:p)} style={{width:48,height:48,borderRadius:8,overflow:"hidden",border:`2px solid ${quoteBgCustomUrl===p?GOLD:A.border}`,cursor:"pointer"}}>
                              <img src={p} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                            </div>
                            {quoteBgCustomUrl===p&&<div onClick={()=>{setQuoteBgCustomUrl(null);setQuoteTextColor("#FFFFFF");}} style={{position:"absolute",top:-4,right:-4,width:14,height:14,borderRadius:"50%",background:"#e74c3c",color:"#fff",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontWeight:700,border:"none"}}>×</div>}
                            <div onClick={()=>{if(window.confirm("Remove this image from your library? This cannot be undone.")){const next=quotePhotos.filter((_,j)=>j!==i);setQuotePhotos(next);if(quoteBgCustomUrl===p){setQuoteBgCustomUrl(next[0]||null);if(!next[0])setQuoteTextColor("#FFFFFF");}}}} style={{position:"absolute",bottom:-4,right:-4,width:14,height:14,borderRadius:"50%",background:"#333",color:"#fff",fontSize:7,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontWeight:700,lineHeight:1}} title="Delete from library">🗑</div>
                          </div>
                        ))}
                        {quotePhotos.length < 10 && (
                          <div onClick={()=>quotePhotoRef.current?.click()} style={{width:48,height:48,borderRadius:8,border:`1.5px dashed ${A.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:A.muted,fontSize:22}}>+</div>
                        )}
                      </div>
                      <p style={{color:A.muted,fontSize:11,margin:"0 0 8px",lineHeight:1.5}}>Upload and save up to 10 custom images.</p>
                      {isPexelsUser ? (
                        <button onClick={()=>setShowPexelsQuote(true)} style={{width:"100%",padding:"8px",background:A.bg,border:`1.5px solid ${A.border}`,borderRadius:8,color:A.text,fontWeight:700,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                          🔍 Search 1000s of free backgrounds
                        </button>
                      ) : (
                        <div style={{width:"100%",padding:"8px",background:A.bg,border:`1.5px dashed ${A.border}`,borderRadius:8,color:A.muted,fontWeight:700,fontSize:11,textAlign:"center",opacity:0.6}}>
                          🔍 Search 1000s of free backgrounds — Pro+
                        </div>
                      )}
                      {quoteBgCustomUrl&&(
                        <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>
                          <div>
                            <label style={{...lbl,marginBottom:4}}>Photo opacity — {quotePhotoOpacity}%</label>
                            <input type="range" min={10} max={100} value={quotePhotoOpacity} onChange={e=>setQuotePhotoOpacity(+e.target.value)} style={{width:"100%"}}/>
                          </div>
                          <div>
                            <label style={{...lbl,marginBottom:4}}>Overlay darkness — {quoteOverlay}%</label>
                            <input type="range" min={0} max={80} value={quoteOverlay} onChange={e=>setQuoteOverlay(+e.target.value)} style={{width:"100%"}}/>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {(()=>{
                const isP=quoteFormat==="portrait";
                const W=1080,H=isP?1920:1350,pw=180,scale=pw/W;
                const html=buildQuoteHTML("Your quote will appear here",null,quoteTextColor);
                return <div style={{width:pw,height:Math.round(H*scale),borderRadius:8,overflow:"hidden",border:`1.5px solid ${A.border}`,margin:"0 auto"}}><QuotePreview key={html} html={html} W={W} H={H} scale={scale}/></div>;
              })()}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:24,alignItems:"start"}} className="quotes-layout">
            <div>


            <div className="quotes-format-card" style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:18,marginBottom:16,display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <label style={lbl}>Format</label>
                <div style={{display:"flex",gap:8}}>
                  {[["instagram","Instagram · LinkedIn · TikTok Photos"],["portrait","Stories · Reels · TikTok Video"]].map(([id,label])=>(
                    <button key={id} onClick={()=>setQuoteFormat(id)} style={{flex:1,background:quoteFormat===id?A.text:A.bg,border:`1.5px solid ${quoteFormat===id?A.text:A.border}`,color:quoteFormat===id?A.accentText:A.muted,padding:"7px",borderRadius:7,fontSize:11,fontWeight:700}}>{label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>Background</label>
                <div style={{display:"flex",gap:8,marginBottom:quoteBgMode==="custom"?14:0}}>
                  {[["dark","Dark"],["light","Light"],["custom","Custom"]].map(([id,label])=>(
                    <button key={id} onClick={()=>{setQuoteBgMode(id);if(id==="dark")setQuoteTextColor("#FFFFFF");if(id==="light")setQuoteTextColor("#0A0A0A");if(id==="custom")setQuoteTextColor("#FFFFFF");}} style={{flex:1,background:quoteBgMode===id?A.text:A.bg,border:`1.5px solid ${quoteBgMode===id?A.text:A.border}`,color:quoteBgMode===id?A.accentText:A.muted,padding:"7px",borderRadius:7,fontSize:11,fontWeight:700}}>{label}</button>
                  ))}
                </div>
                {quoteBgMode==="custom"&&(
                  <div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                      {quotePhotos.map((p,i)=>(
                        <div key={i} style={{position:"relative",flexShrink:0}}>
                          <div onClick={()=>setQuoteBgCustomUrl(quoteBgCustomUrl===p?null:p)} style={{width:56,height:56,borderRadius:8,overflow:"hidden",border:`2px solid ${quoteBgCustomUrl===p?GOLD:A.border}`,cursor:"pointer"}}>
                            <img src={p} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                          </div>
                          {quoteBgCustomUrl===p&&<div onClick={()=>{setQuoteBgCustomUrl(null);setQuoteTextColor("#FFFFFF");}} style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#e74c3c",color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontWeight:700,border:"none"}}>×</div>}
                          <div onClick={()=>{if(window.confirm("Remove this image from your library? This cannot be undone.")){const next=quotePhotos.filter((_,j)=>j!==i);setQuotePhotos(next);if(quoteBgCustomUrl===p){setQuoteBgCustomUrl(next[0]||null);if(!next[0])setQuoteTextColor("#FFFFFF");}}}} style={{position:"absolute",bottom:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#333",color:"#fff",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontWeight:700,lineHeight:1}} title="Delete from library">🗑</div>
                        </div>
                      ))}
                      {quotePhotos.length < 10 && (
                        <div onClick={()=>quotePhotoRef.current?.click()} style={{width:56,height:56,borderRadius:8,border:`1.5px dashed ${A.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:A.muted,fontSize:28}}>+</div>
                      )}
                    </div>
                    <input ref={quotePhotoRef} type="file" accept="image/*" onChange={async e=>{
                      const file = e.target.files[0]; if(!file) return;
                      const reader = new FileReader();
                      reader.onload = async ev => {
                        const base64 = ev.target.result;
                        setQuoteBgCustomUrl(base64);
                        try {
                          const res = await fetch('/api/upload-photo', {
                            method:'POST',
                            headers:{'Content-Type':'application/json'},
                            body: JSON.stringify({ imageData: base64, filename: `quotebg-${Date.now()}.jpg` })
                          });
                          const data = await res.json();
                          if (data.url) {
                            setQuoteBgCustomUrl(data.url);
                            setQuotePhotos(prev => [data.url, ...prev.filter(p=>p!==data.url)].slice(0,10));
                          }
                        } catch(err) { console.error('Quote BG upload failed:', err); }
                      };
                      reader.readAsDataURL(file);
                    }} style={{display:"none"}}/>
                    {isPexelsUser ? (
                      <button onClick={()=>setShowPexelsQuote(true)} style={{width:"100%",padding:"9px",background:A.bg,border:`1.5px solid ${A.border}`,borderRadius:8,color:A.text,fontWeight:700,fontSize:12,cursor:"pointer",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                        🔍 Search 1000s of free backgrounds
                      </button>
                    ) : (
                      <div title="Upgrade to Pro to search Pexels" style={{width:"100%",padding:"9px",background:A.bg,border:`1.5px dashed ${A.border}`,borderRadius:8,color:A.muted,fontWeight:700,fontSize:12,textAlign:"center",marginBottom:8,cursor:"not-allowed",opacity:0.6}}>
                        🔍 Search 1000s of free backgrounds — Pro+
                      </div>
                    )}
                    <p style={{color:A.muted,fontSize:11,margin:"0 0 10px",lineHeight:1.6}}>
                      Upload and save up to 10 custom images. Click to select. Safe zone: keep text within 80px of edges.<br/>
                      Recommended: <strong>{quoteFormat==="portrait"?"1080×1920px":"1080×1350px"}</strong>
                    </p>
                    <div style={{marginBottom:10}}>
                      <label style={lbl}>Photo opacity — {quotePhotoOpacity}% <span style={{letterSpacing:0,fontWeight:400,fontSize:9,textTransform:"none"}}>(lower = more faded)</span></label>
                      <input type="range" min={10} max={100} value={quotePhotoOpacity} onChange={e=>setQuotePhotoOpacity(+e.target.value)}/>
                    </div>
                    <div style={{marginBottom:12}}>
                      <label style={lbl}>Overlay darkness — {quoteOverlay}% <span style={{letterSpacing:0,fontWeight:400,fontSize:9,textTransform:"none"}}>(0% = no overlay)</span></label>
                      <input type="range" min={0} max={80} value={quoteOverlay} onChange={e=>setQuoteOverlay(+e.target.value)}/>
                    </div>
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
              <div>
                <label style={lbl}>Signature <span style={{letterSpacing:0,fontWeight:400,fontSize:9,textTransform:"none"}}>(leave blank to use brand name)</span></label>
                <input value={quoteSignature} onChange={e=>setQuoteSignature(e.target.value)} placeholder={name||"Your name"} style={inp}/>
              </div>
            </div>

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
                {quoteTemplate==="raw"&&(
                  <div>
                    <label style={{...lbl,marginBottom:6}}>Label word <span style={{letterSpacing:0,fontWeight:400,fontSize:9,textTransform:"none"}}>(shown above quote in Raw template)</span></label>
                    <input value={luxuryLabel} onChange={e=>setLuxuryLabel(e.target.value)} placeholder="Truth" style={inp}/>
                  </div>
                )}
              </div>

              <div>
                <label style={lbl}>Quote font</label>
                {recentQuoteFonts.length>0&&(
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                    {recentQuoteFonts.map(id=>{const f=FONTS.find(f=>f.id===id);if(!f)return null;return(
                      <button key={id} onClick={()=>{setQuoteFont(id);trackFont(id,true);}} style={{background:quoteFont===id?A.text:A.bg,border:`1.5px solid ${quoteFont===id?GOLD:A.border}`,borderRadius:20,padding:"4px 12px",cursor:"pointer"}}>
                        <span style={{fontFamily:`"${f.css}",serif`,fontSize:12,fontWeight:700,fontStyle:"italic",color:quoteFont===id?A.accentText:A.muted}}>{f.label}</span>
                      </button>
                    );})}
                  </div>
                )}
                <div style={{position:"relative"}}>
                  <select value={quoteFont} onChange={e=>{setQuoteFont(e.target.value);trackFont(e.target.value,true);}} style={{width:"100%",padding:"10px 14px",background:A.bg,border:`1.5px solid ${A.border}`,borderRadius:9,color:A.text,fontSize:14,fontFamily:`"${FONTS.find(f=>f.id===quoteFont)?.css||"Playfair Display"}",serif`,fontStyle:"italic",fontWeight:700,appearance:"none",cursor:"pointer",paddingRight:36}}>
                    {FONTS.map(f=>(
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                  <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:A.muted,fontSize:12}}>▼</div>
                </div>
              </div>
              <div>
                <label style={lbl}>Signature font</label>
                <div style={{display:"flex",gap:5,flexWrap:"nowrap"}}>
                  {[{id:"montserrat",label:"Plain",css:"Montserrat"},{id:"playfair",label:"Elegant",css:"Playfair Display"},{id:"dancing",label:"Script",css:"Dancing Script"},{id:"pacifico",label:"Casual",css:"Pacifico"},{id:"cormorant",label:"Luxury",css:"Cormorant Garamond"}].map(f=>(
                    <button key={f.id} onClick={()=>setQuoteSigFont(f.id)} style={{background:quoteSigFont===f.id?A.text:"none",border:`1.5px solid ${quoteSigFont===f.id?A.text:A.border}`,borderRadius:20,padding:"4px 12px",flexShrink:0}}>
                      <span style={{fontFamily:`"${f.css}",serif`,fontSize:12,fontWeight:600,color:quoteSigFont===f.id?A.accentText:A.muted}}>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>Quote text colour</label>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  {["#C9A84C","#E8D5A3","#E8553E","#C4756A","#60A5FA","#6BAA8E","#A78BFA","#F5EDE0","#0A0A0A"].map(c=>(
                    <button key={c} onClick={()=>setQuoteTextColor(c)} style={{width:28,height:28,borderRadius:"50%",background:c,border:quoteTextColor===c?`3px solid ${GOLD}`:`2px solid ${A.border}`,cursor:"pointer",flexShrink:0,boxShadow:c==="#FFFFFF"?`inset 0 0 0 1px ${A.border}`:"none"}}/>
                  ))}
                  {quoteTextCustomSlots.map((c,i)=>(
                    <div key={i} style={{position:"relative"}}>
                      {c ? (
                        <>
                          <div onClick={()=>setQuoteTextColor(c)} style={{width:28,height:28,borderRadius:"50%",background:c,border:quoteTextColor===c?`3px solid ${GOLD}`:`2px solid ${A.border}`,cursor:"pointer",boxShadow:c==="#FFFFFF"?`inset 0 0 0 1px ${A.border}`:"none"}}/>
                          <div onClick={()=>{const s=[...quoteTextCustomSlots];s[i]="";setQuoteTextCustomSlots(s);if(quoteTextColor===c)setQuoteTextColor("#FFFFFF");}} style={{position:"absolute",top:-4,right:-4,width:12,height:12,borderRadius:"50%",background:"#e74c3c",color:"#fff",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontWeight:900}}>×</div>
                        </>
                      ) : (
                        <>
                          <div style={{width:28,height:28,borderRadius:"50%",background:A.surface,border:`2px dashed ${A.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:A.muted,cursor:"pointer"}}>+</div>
                          <input type="color" defaultValue={quoteTextColor} onChange={e=>{const s=[...quoteTextCustomSlots];s[i]=e.target.value;setQuoteTextCustomSlots(s);setQuoteTextColor(e.target.value);}} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:0,cursor:"pointer"}}/>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>Show handle</div>
                  <div style={{color:A.muted,fontSize:12}}>{handle?(handle.startsWith("@")?handle:"@"+handle):"Set handle in Brand settings"}</div>
                </div>
                {tog(showHandle,setShowHandle)}
              </div>
            </div>

            </div>
            {/* Right column - live preview (desktop only) */}
            <div className="quotes-preview-col" style={{position:"sticky",top:76,overflow:"hidden"}}>
              <label style={{...lbl,marginBottom:8}}>Live Preview</label>
              {(()=>{
              const isP = quoteFormat==="portrait";
              const W=1080,H=isP?1920:1350,pw=240,scale=pw/W;
              const html=buildQuoteHTML("Your quote will appear here", null, quoteTextColor);
              return (
                <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}>
                  <div style={{width:pw,height:Math.round(H*scale),borderRadius:10,overflow:"hidden",border:`1.5px solid ${A.border}`}}>
                    <QuotePreview key={html} html={html} W={W} H={H} scale={scale}/>
                  </div>
                </div>
              );
            })()}
            </div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {[["brand","On Brand"],["life","Life & Mindset"]].map(([id,label])=>(
                <button key={id} onClick={()=>setQuoteMode(id)} style={{flex:1,padding:"10px",borderRadius:9,border:`1.5px solid ${quoteMode===id?GOLD:A.border}`,background:quoteMode===id?A.text:A.surface,color:quoteMode===id?A.accentText:A.muted,fontSize:13,fontWeight:700}}>
                  {label}
                </button>
              ))}
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
              {quoteInputs.every(q=>q.trim())&&<p style={{color:"#c0392b",fontSize:12,margin:"-10px 0 14px",fontWeight:600}}>All slots full — clear one or more to generate new quotes.</p>}
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
                    <select value={quoteFont} onChange={e=>setQuoteFont(e.target.value)} style={{padding:"2px 8px",background:A.bg,border:`1px solid ${A.border}`,borderRadius:8,color:A.text,fontSize:11,fontFamily:`"${FONTS.find(f=>f.id===quoteFont)?.css||"Playfair Display"}",serif`,fontStyle:"italic",appearance:"none",cursor:"pointer"}}>
                      {FONTS.map(f=>(<option key={f.id} value={f.id}>{f.label}</option>))}
                    </select>
                  </div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:12}}>
                  {quoteInputs.filter(q=>q.trim()).map((q,i)=>{
                    const isP=quoteFormat==="portrait";
                    const W=1080,H=isP?1920:1350,scale=220/W;
                    const html=buildQuoteHTML(q, null, quoteTextColor);
                    return (
                      <div key={i} style={{display:"flex",flexDirection:"column",gap:6,alignItems:"center"}}>
                        <div onClick={()=>setExpandedQuote(html)} style={{width:220,height:Math.round(H*scale),borderRadius:8,overflow:"hidden",border:`1.5px solid ${A.border}`,flexShrink:0,cursor:"pointer"}}>
                          <QuotePreview key={html} html={html} W={W} H={H} scale={scale}/>
                        </div>
                        <button onClick={async()=>{
                          if (!canGenerate()) { setNav("upgrade"); if (currentUser?.plan === "free") { fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"credits-exhausted-email" }) }).catch(()=>{}); } return; }
                          try {
                            const blob = await downloadQuote(q, i);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href=url; a.download=`quote-${i+1}.png`;
                            document.body.appendChild(a); a.click(); document.body.removeChild(a);
                            setTimeout(()=>URL.revokeObjectURL(url),1000);
                            const entry={id:Date.now(),text:q,date:new Date().toLocaleDateString(),font:quoteFont,bgMode:quoteBgMode};
                            const next=[entry,...quoteHistory].slice(0,20);
                            setQuoteHistory(next);
                            try{localStorage.setItem("bwt_quote_history",JSON.stringify(next));}catch{}
                            if (currentUser && !currentUser.is_admin && !isUnlimitedPlan(currentUser.plan)) {
                              await fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()}, body: JSON.stringify({ action:"increment-downloads", email: currentUser.email, credits: 5 }) });
                              refreshUser();
                            }
                          } catch(e) { alert("Download failed — try again."); }
                        }} style={{width:220,background:A.surface,border:`1.5px solid ${A.border}`,color:A.text,padding:"10px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer"}}>
                          ↓ {i+1}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {expandedQuote&&(
                  <div onClick={()=>setExpandedQuote(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
                    <div style={{width:"min(340px,90vw)",height:"min(450px,80vh)",borderRadius:12,overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
                      <QuotePreview html={expandedQuote} W={1080} H={1350} scale={340/1080}/>
                    </div>
                  </div>
                )}
                <button onClick={downloadAllQuotes} disabled={downloadingQuotes} style={{width:"100%",padding:"13px",background:`linear-gradient(135deg,#1a1a1a,#0a0a0a)`,color:A.accentText,borderRadius:10,fontSize:14,fontWeight:800,border:`1px solid ${GOLD}33`,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:8}}>
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
          <div style={{animation:"fadeUp 0.3s ease",maxWidth:960,margin:"0 auto"}}>
            <div style={{marginBottom:24}}>
              <h1 style={{fontSize:28,fontWeight:800,lineHeight:1.2,margin:"0 0 8px",letterSpacing:-0.8}}>What's today's carousel about?</h1>
              <p style={{color:A.muted,fontSize:14,margin:0}}>One topic. I handle the strategy, layouts, and copy.</p>
            </div>

            <div style={{marginBottom:12}}>
              <label style={lbl}>Who is your audience?</label>
              <div style={{display:"flex",gap:8}}>
                {[["customers","Your Customers / Clients"],["peers","Industry Peers"]].map(([id,label])=>(
                  <button key={id} onClick={()=>setAudienceType(id)} style={{flex:1,padding:"8px",borderRadius:8,border:`1.5px solid ${audienceType===id?A.text:A.border}`,background:audienceType===id?A.text:A.surface,color:audienceType===id?A.accentText:A.muted,fontSize:12,fontWeight:700}}>{label}</button>
                ))}
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <textarea value={topic} onChange={e=>{setTopic(e.target.value);if(err)setErr("");}}
                  rows={2}
                  className="topic-textarea"
                  placeholder={audienceType==="peers"?(businessType==="marketer"?"e.g. Why most digital marketers price themselves out of good clients":businessType==="fitness"?"e.g. Why most PTs price themselves out of business":businessType==="beauty"?"e.g. Why most salons lose money on their best service":businessType==="restaurant"?"e.g. Why most restaurants fail in year two":businessType==="realestate"?"e.g. The mistake most agents make with new listings":businessType==="ecommerce"?"e.g. Why most product brands waste their ad budget":businessType==="coach"?"e.g. Why most coaches struggle to retain clients":businessType==="other"?(otherType?"e.g. A hard truth about "+otherType:"e.g. A hard truth most in your industry ignore"):"e.g. Why your content gets views but zero clients"):(businessType==="fitness"?"e.g. Why most people quit the gym after 3 weeks":businessType==="beauty"?"e.g. Why your skin actually needs less, not more":businessType==="restaurant"?"e.g. What really goes into your favourite dish":businessType==="realestate"?"e.g. What nobody tells you before buying your first home":businessType==="ecommerce"?"e.g. Why fast shipping matters more than price":businessType==="coach"?"e.g. Why mindset alone won't get you results":businessType==="other"?(otherType?"e.g. Something surprising about "+otherType:"e.g. Something your audience doesn't know yet"):"e.g. Why your content gets views but zero clients")}
                  style={{...inp,fontSize:15,fontWeight:500,flex:1,borderColor:err?"#c0392b":A.border,resize:"none",lineHeight:1.5}}
                  onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)generate();}}/>
                <button onClick={randomiseTopic} disabled={randomising} title="Randomise topic" style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:10,padding:"0 16px",fontSize:18,color:A.muted,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",width:48}}>
                  {randomising?<Spin c={A.muted}/>:"🎲"}
                </button>
              </div>
              {err&&<p style={{color:"#c0392b",fontSize:12,margin:"4px 0 0",fontWeight:600}}>⚠ {err}</p>}
            </div>

            <div style={{marginBottom:16}}>
              <label style={lbl}>Brief <span style={{letterSpacing:0,fontWeight:400,fontSize:9,textTransform:"none"}}>(optional — exact title, slide structure, tone, anything specific)</span></label>
              <div style={{position:"relative"}}>
                <textarea value={angle} onChange={e=>setAngle(e.target.value.slice(0,280))} placeholder={BRIEF_PLACEHOLDERS[businessType]||BRIEF_PLACEHOLDERS.other} rows={4} style={{...inp,fontSize:14,resize:"none",lineHeight:1.6,paddingBottom:22}}/>
                <div style={{position:"absolute",bottom:8,right:12,fontSize:10,color:angle.length>240?"#c0392b":"#aaa",fontWeight:600}}>{angle.length}/280</div>
              </div>
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
              <input ref={inspirationRef} type="file" accept="image/*" onChange={e=>readFile(e,url=>{setInspirationImg(url);setTopic("Reading screenshot...");setAngle("");setErr("");extractTopicFromImage(url);}) } style={{display:"none"}}/>
            </div>

            <div className="cover-format-grid" style={{display:"grid",gridTemplateColumns:"1fr",gap:16,marginBottom:20}}>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <div>
                  <label style={lbl}>Text density</label>
                  <div style={{display:"flex",gap:6}}>
                    {[["concise","Punchy"],["balanced","Balanced"],["detailed","Depth"]].map(([id,label])=>(
                      <button key={id} onClick={()=>setTextDensity(id)} style={{flex:1,background:textDensity===id?A.text:A.bg,border:`1.5px solid ${textDensity===id?A.text:A.border}`,color:textDensity===id?A.accentText:A.muted,padding:"7px 4px",borderRadius:7,fontSize:11,fontWeight:700}}>{label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Format</label>
                  <div style={{display:"flex",gap:6}}>
                    {[["instagram","Instagram · LinkedIn · TikTok Photos"],["portrait","Stories · Reels · TikTok Video"]].map(([id,label])=>(
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
            <p className="cmd-hint" style={{textAlign:"center",color:A.muted,fontSize:11,marginTop:10}}>⌘ + Enter · ~15–25 seconds</p>
          </div>
        )}

        {nav==="history"&&(
          <div style={{animation:"fadeUp 0.3s ease"}}>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 20px"}}>History</h2>

            <div style={{marginBottom:24}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:700}}>Carousels</div>
                {history.length>0&&<button onClick={()=>{if(window.confirm("Clear carousel history?")){{setHistory([]);saveHistory([]);}}}} style={{background:"none",border:`1.5px solid ${A.border}`,borderRadius:7,padding:"4px 10px",fontSize:11,color:"#c0392b",fontWeight:600,cursor:"pointer"}}>Clear</button>}
              </div>
              {history.length===0
                ? <div style={{textAlign:"center",padding:"30px 0",color:A.muted,fontSize:13}}>No carousels yet.</div>
                : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {history.map(entry=>(
                      <div key={entry.id} style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:"16px 18px"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginBottom:entry.caption?10:0}}>
                          <div>
                            <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>{entry.topic}</div>
                            <div style={{color:A.muted,fontSize:12}}>{entry.slides.length} slides · {entry.date}{entry.caption?" · Caption saved":""}</div>
                          </div>
                          <button onClick={()=>{setSlides(entry.slides);setActive(0);setView("preview");setLastTopic(entry.topic);setNav("generate");if(entry.caption){setCaption(entry.caption);setShowCaption(true);}}} style={{background:A.text,color:A.accentText,padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:700,flexShrink:0}}>
                            Load →
                          </button>
                        </div>
                        {entry.caption&&(
                          <div style={{background:A.bg,border:`1px solid ${A.border}`,borderRadius:8,padding:"10px 12px",fontSize:12,color:A.muted,lineHeight:1.6,whiteSpace:"pre-wrap"}}>
                            {entry.caption.length>150?entry.caption.slice(0,150)+"...":entry.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
              }
            </div>

            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:700}}>Quote Cards</div>
                {quoteHistory.length>0&&<button onClick={()=>{if(window.confirm("Clear quote history?")){const next=[];setQuoteHistory(next);try{localStorage.setItem("bwt_quote_history",JSON.stringify(next));}catch{}}}} style={{background:"none",border:`1.5px solid ${A.border}`,borderRadius:7,padding:"4px 10px",fontSize:11,color:"#c0392b",fontWeight:600,cursor:"pointer"}}>Clear</button>}
              </div>
              {quoteHistory.length===0
                ? <div style={{textAlign:"center",padding:"30px 0",color:A.muted,fontSize:13}}>No quotes downloaded yet.</div>
                : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {quoteHistory.map(entry=>(
                      <div key={entry.id} style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:"16px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:600,fontSize:13,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{entry.text}"</div>
                          <div style={{color:A.muted,fontSize:12}}>{entry.font} · {entry.bgMode} · {entry.date}</div>
                        </div>
                        <button onClick={()=>{setQuoteInputs([entry.text,"",""]);setQuoteFont(entry.font);setQuoteBgMode(entry.bgMode);setNav("quotes");}} style={{background:A.text,color:A.accentText,padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:700,flexShrink:0}}>
                          Load →
                        </button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        )}

        {nav==="templates"&&(
          <div style={{animation:"fadeUp 0.3s ease",maxWidth:1100,margin:"0 auto",width:"100%",paddingBottom:60}}>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 4px"}}>Templates</h2>
            <p style={{fontSize:14,color:A.muted,margin:"0 0 24px"}}>Pick a design, add your content, download.</p>

            {/* ── TEMPLATE PICKER ── */}
            {!tmplSelected&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
                {[
                  {id:"dark-fade",label:"Classic Theme Page",desc:"Bold photo cover, gradient fade, badge, headline, subline.",emoji:"🌑"},
                  {id:"listicle",label:"Listicle",desc:"Big number left, topic right. Body slides numbered. Up to 12 points.",emoji:"🔢"},
                  {id:"clean-pro",label:"Clean Pro",desc:"Dark Fade cover then clean white or black body slides.",emoji:"✨"},
                  {id:"storytelling",label:"Storytelling",desc:"Pure text on white or black. Badge top left. Dead centre paragraph.",emoji:"📖"},
                  {id:"raw",label:"Raw",desc:"Your photo. Tight text box. No badge. Authentic, unfiltered.",emoji:"📱"},
                  {id:"split",label:"Split",desc:"Two images side by side. Left and right text. Perfect for comparisons.",emoji:"⚡"},
                ].map(t=>(
                  <div key={t.id} style={{position:"relative"}}>
                    <div onClick={()=>{
                      let restored=false;
                      try{const saved=localStorage.getItem("bwt_tmpl_session_"+t.id);if(saved){const s=JSON.parse(saved);setTmplSlides(s.slides);setTmplSlideCount(s.slideCount);setTmplBrief(s.brief||"");setTmplEffect(s.effect||"clean");setTmplFont(s.font||"Bebas Neue");setTmplFontSize(s.fontSize||72);setTmplPrimary(s.primary||"#BB9900");setTmplSecondary(s.secondary||"#ffffff");setTmplAccentLineColor(s.accentLine||"#BB9900");setTmplBg(s.bg||"white");setTmplFontStyle(s.fontStyle||"Inter");setTmplRawBox(s.rawBox||"white");setTmplRawPos(s.rawPos||"bottom");setTmplListicleNum(s.listicleNum||6);restored=true;}}catch{}
                      setTmplSelected(t.id);setTmplActiveSlide(0);
                      if(!restored){
                        const PLACEHOLDER_IMGS={"dark-fade":"https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1080&q=80","listicle":"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&q=80","clean-pro":"https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1080&q=80","storytelling":null,"raw":"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1080&q=80","split-left":"https://images.unsplash.com/photo-1541480601022-2308c0f02487?w=540&q=80","split-right":"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=540&q=80"};
                        const defaults=Array(12).fill(null).map((_,i)=>{
                          const base={image:i===0?(PLACEHOLDER_IMGS[t.id]||PLACEHOLDER_IMGS[t.id+"-left"]||null):null,imagePos:{x:50,y:50},image2:i===0?(PLACEHOLDER_IMGS[t.id+"-right"]||PLACEHOLDER_IMGS[t.id]||null):null,image2Pos:{x:50,y:50},headline:"",subline:"",headline2:"",subline2:"",bodyText:"",accentText:"",topicLine:"PLACES YOU NEED TO VISIT BEFORE",subject:"2027 ENDS",storyText:"",rawText:""};
                          if(t.id==="dark-fade"){base.headline=i===0?"The Secrets The Top 1% Never Reveal About Wealth":"";base.subline=i===0?"Most people will never know this.":"";}
                          if(t.id==="listicle"&&i===0){base.topicLine="PLACES YOU NEED TO VISIT BEFORE";base.subject="2027 ENDS";base.subline="Swipe to see them all.";}
                          if(t.id==="listicle"&&i>0){base.headline=["Santorini, Greece","Kyoto, Japan","Amalfi Coast, Italy","Bali, Indonesia","Patagonia, Argentina","Cape Town, South Africa","Iceland","Machu Picchu, Peru","The Maldives","New Zealand","Morocco"][i-1]||"";base.bodyText=["Sunsets you won't find anywhere else.","Cherry blossom and centuries of culture.","The most dramatic coastline in Europe.","Temples, rice fields, and world-class surf.","Mountains that look computer generated.","Beaches, wine, wildlife. All in one place.","Northern lights every clear night.","Lost city of the Incas. Nothing like it.","Overwater bungalows. Turquoise lagoons.","Lord of the Rings meets real adventure.","Deserts, medinas, and mint tea."][i-1]||"";}
                          if(t.id==="clean-pro"&&i===0){base.headline="You're Using AI Wrong In Your Business";base.subline="Here's what actually works.";}
                          if(t.id==="clean-pro"&&i>0){base.headline=["The timing is everything.","Your DMs are a free lead machine.","Most businesses have no idea this exists.","Set it up once. Let it run forever.","Here's exactly how to do it."][i-1]||"";base.bodyText=["Someone just followed you. They're curious right now.","Instagram now auto-DMs every new follower. No manual outreach.","It captures the lead the moment they follow.","Five minutes of setup. Automated outreach indefinitely.","Settings → Creators → Automated Responses. Turn it on."][i-1]||"";base.accentText=["That's the highest-intent moment you'll ever get.","That's a free lead machine.","Most businesses have no idea this feature exists.","Your ad drives the follow. This captures the lead.","You're already paying for the follower. Don't waste them."][i-1]||"";}
                          if(t.id==="storytelling"){base.storyText=["I went bankrupt at 25.\n\nNot the kind you read about in business books. The kind where you can't look your mum in the eye.","Her name is Carol. She raised three of us on her own. No shortcuts. Just sacrifice.\n\nAnd I'd thrown it all away.","I spent three years on bail waiting for a trial that kept getting cancelled.\n\nCOVID hit. Courts closed. I just had to wait.","The day I got my tag off, I sat in my car for twenty minutes.\n\nNo music. No phone. Just silence.","I found digital marketing while I was still on tag.\n\nI made my first sale at 3am on a Tuesday. I cried.","That's why I built this. Not to flex. To show you what's possible when you stop waiting for permission."][i]||"";}
                          if(t.id==="split"){base.headline=i===0?"Your Life Now":"";base.subline=i===0?"The 9-5. The commute. The alarm.":"";base.headline2=i===0?"Your Life In 12 Months":"";base.subline2=i===0?"Your terms. Your time. Your rules.":"";}
                          if(t.id==="raw"){base.rawText=["The average person spends\n90,000 hours at work\nin their lifetime.\n\nMost hate every single one.","Most people will retire\non 40% of\nwhat wasn't enough anyway.","You don't need more motivation.\n\nYou need a better plan.","Information is free.\n\nExecution is rare.","The goal isn't to be rich.\n\nIt's to be free.","Start before you're ready.\n\nYou'll never be ready."][i]||"";}
                          return base;
                        });
                        setTmplSlides(defaults);setTmplSlideCount(t.id==="listicle"?7:6);setTmplBrief("");
                      }
                    }} style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:14,padding:20,cursor:"pointer",transition:"border-color 0.2s,transform 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.transform="translateY(-2px)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=A.border;e.currentTarget.style.transform="translateY(0)";}}>
                      <div style={{fontSize:28,marginBottom:8}}>{t.emoji}</div>
                      <div style={{fontSize:14,fontWeight:800,color:A.text,marginBottom:6}}>{t.label}</div>
                      <div style={{fontSize:12,color:A.muted,lineHeight:1.6}}>{t.desc}</div>
                    </div>
                    <button onClick={e=>{e.stopPropagation();if(window.confirm("Reset "+t.label+" to defaults?")){localStorage.removeItem("bwt_tmpl_session_"+t.id);}}} style={{position:"absolute",top:8,right:8,background:"none",border:"none",color:A.muted,fontSize:11,cursor:"pointer",padding:"2px 6px",borderRadius:4}} title="Reset to defaults">↺</button>
                  </div>
                ))}
              </div>
            )}

            {/* ── TEMPLATE EDITOR ── */}
            {tmplSelected&&(()=>{
              const isListicle=tmplSelected==="listicle",isCleanPro=tmplSelected==="clean-pro",isStory=tmplSelected==="storytelling",isRaw=tmplSelected==="raw",isDarkFade=tmplSelected==="dark-fade",isSplit=tmplSelected==="split";
              const hasAI=isListicle||isCleanPro||isStory,maxSlides=isListicle?12:8,isFree=currentUser?.plan==="free",activeSlide=tmplActiveSlide||0,slide=tmplSlides[activeSlide]||{};
              const ctaBgFinal=(isCleanPro||isStory)?tmplBg:tmplCtaBg;const opts={effect:tmplEffect,font:tmplFont,fontSize:tmplFontSize,primary:tmplPrimary,secondary:tmplSecondary,accentLine:tmplAccentLineColor,showCounter:tmplShowCounter,bg:tmplBg,fontStyle:tmplFontStyle,rawBox:tmplRawBox,rawPos:tmplRawPos,listicleNum:tmplListicleNum,profUrl:profileUrl,nm:name,hdl:handle,showTick:blueTick,isFree,userWebsite:website};
              const ctaLine2Defaults={comment:"Comment the word",follow:"Follow",save:"Save this",share:"Share this",like:"Like this"};
              const ctaKeywordDefaults={comment:tmplCtaKeyword||"GUIDE",follow:"FOLLOW",save:"SAVE",share:"SHARE",like:"LIKE"};
              const ctaLine3Defaults={comment:"and I'll send it straight over",follow:"for more content like this",save:"so you don't lose it",share:"with someone who needs it",like:"if it resonated with you"};
              const ctaHTML=tmplShowCta?buildCtaHTML(opts,tmplCtaType,ctaKeywordDefaults[tmplCtaType],tmplCtaTopLine||(isDarkFade?"Want to build wealth online?":isListicle?"Want more content like this?":isCleanPro?"Want the full strategy?":isStory?"Want to start your own journey?":"Want more like this?"),tmplCtaLine2||ctaLine2Defaults[tmplCtaType],tmplCtaRewardLine||ctaLine3Defaults[tmplCtaType],ctaBgFinal,name,handle,profileUrl,blueTick,tmplFont,tmplSlideCount+(tmplShowCta?1:0),tmplShowCounter):null;
              const totalSlides=tmplSlideCount+(ctaHTML?1:0);
              const activeIsCtaSlide=ctaHTML&&activeSlide===tmplSlideCount;
              const previewHTML=activeIsCtaSlide?ctaHTML:buildTmplHTML(dTmplSlides[activeSlide]||{},activeSlide,totalSlides,tmplSelected,opts);
              const thumbHTMLs=[...dTmplSlides.slice(0,tmplSlideCount).map((s,i)=>buildTmplHTML(s||{},i,totalSlides,tmplSelected,opts)),...(ctaHTML?[ctaHTML]:[])];



              const updateSlide=(field,val)=>setTmplSlides(prev=>{const next=[...prev];next[activeSlide]={...next[activeSlide],[field]:val};return next;});

              const downloadSlide=async(idx)=>{
                if(!canGenerate()){setNav("upgrade");return;}
                setTmplDownloadingIdx(idx);
                try{
                  const html=buildTmplHTML(tmplSlides[idx],idx,tmplSlideCount,tmplSelected,opts);
                  const res=await fetch("/api/render-slide",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({html,width:1080,height:1350})});
                  const data=await res.json();
                  if(!data.image)throw new Error(data.error||"Render failed");
                  const bytes=atob(data.image),arr=new Uint8Array(bytes.length);
                  for(let j=0;j<bytes.length;j++)arr[j]=bytes.charCodeAt(j);
                  const url=URL.createObjectURL(new Blob([arr],{type:"image/png"}));
                  const a=document.createElement("a");a.href=url;a.download=tmplSelected+"-slide-"+(idx+1)+".png";a.click();URL.revokeObjectURL(url);
                  await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()},body:JSON.stringify({action:"increment-downloads",email:currentUser.email,credits:3})});
                  setCurrentUser(u=>({...u,credits_used:(u.credits_used||0)+5}));
                }catch(e){console.error(e);alert("Download failed — try again");}
                setTmplDownloadingIdx(null);
              };

              const downloadAllTmpl=async()=>{
                if(!canGenerate()){setNav("upgrade");return;}
                setTmplDownloading(true);
                try{
                  const slidesToDownload=[...Array(tmplSlideCount).keys()].map(i=>buildTmplHTML(tmplSlides[i],i,totalSlides,tmplSelected,opts));
                  if(ctaHTML)slidesToDownload.push(ctaHTML);
                  for(let i=0;i<slidesToDownload.length;i++){
                    const html=slidesToDownload[i];
                    const res=await fetch("/api/render-slide",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({html,width:1080,height:1350})});
                    const data=await res.json();if(!data.image)continue;
                    const bytes=atob(data.image),arr=new Uint8Array(bytes.length);
                    for(let j=0;j<bytes.length;j++)arr[j]=bytes.charCodeAt(j);
                    const url=URL.createObjectURL(new Blob([arr],{type:"image/png"}));
                    const label=ctaHTML&&i===slidesToDownload.length-1?"cta":"slide-"+(i+1);
                    const a=document.createElement("a");a.href=url;a.download=tmplSelected+"-"+label+".png";a.click();URL.revokeObjectURL(url);
                    await new Promise(r=>setTimeout(r,400));
                  }
                  await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()},body:JSON.stringify({action:"increment-downloads",email:currentUser.email,credits:10})});
                  setCurrentUser(u=>({...u,credits_used:(u.credits_used||0)+10}));
                }catch(e){console.error(e);}
                setTmplDownloading(false);
              };

              const generateList=async()=>{
                if(!tmplBrief&&!tmplSlides.some(s=>s.headline))return;
                setTmplSuggesting("list");
                try{
                  const briefNumMatch=tmplBrief.match(/^(\d+)\s/);
                  const briefNum=briefNumMatch?parseInt(briefNumMatch[1]):null;
                  let targetCount=tmplSlideCount;
                  if(briefNum&&briefNum>=2&&briefNum<=12){targetCount=briefNum+1;setTmplSlideCount(targetCount);setTmplListicleNum(briefNum);}
                  const numItems=targetCount-1;
                  const existingItems=tmplSlides.slice(1,targetCount).map((s,i)=>s.headline?(i+1)+". "+s.headline+" (keep, generate detail)":(i+1)+". (generate)").join("\n");
                  const prompt="Create a listicle carousel about: \""+tmplBrief+"\". Generate "+numItems+" items. Existing: "+existingItems+". Return ONLY valid JSON with keys: coverTopicLine (string max 6 words), coverSubject (string max 4 words), items (array of "+numItems+" objects with headline max 4 words and bodyText max 15 words). No markdown.";
                  const r=await fetchWithRetry({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:prompt}]});
                  const text=r?.content?.[0]?.text?.trim()||"{}";
                  const bt=String.fromCharCode(96);const clean=text.replace(new RegExp(bt+bt+bt+"json","g"),"").replace(new RegExp(bt+bt+bt,"g"),"").trim();
                  const result=JSON.parse(clean);
                  if(result.coverTopicLine||result.coverSubject){setTmplSlides(prev=>{const next=[...prev];next[0]={...next[0],topicLine:result.coverTopicLine||next[0].topicLine,subject:result.coverSubject||next[0].subject};return next;});}
                  if(Array.isArray(result.items)){setTmplSlides(prev=>{const next=[...prev];result.items.forEach((item,i)=>{const si=i+1;if(si<next.length){if(item.headline)next[si]={...next[si],headline:item.headline};if(item.bodyText)next[si]={...next[si],bodyText:item.bodyText};}});return next;});}
                  if(currentUser?.email){await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()},body:JSON.stringify({action:"increment-downloads",email:currentUser.email,credits:5})});setCurrentUser(u=>({...u,credits_used:(u.credits_used||0)+5}));}
                }catch(e){console.error(e);alert("Generation failed — try again");}
                setTmplSuggesting(null);
              };
              const generateStory=async()=>{
                if(!tmplBrief)return;
                setTmplSuggesting("story");
                try{
                  const prompt="Write a personal story carousel with exactly "+tmplSlideCount+" slides. Brief: "+tmplBrief+". Each slide should be 2-4 short sentences that flow naturally into the next. The story should have a beginning (who you were), a struggle or turning point, and a resolution or lesson. Make it honest, direct, and human. Return ONLY valid JSON array of "+tmplSlideCount+" objects with key: storyText (string). No markdown.";
                  const r=await fetchWithRetry({model:"claude-sonnet-4-6",max_tokens:1200,messages:[{role:"user",content:prompt}]});
                  const text=r?.content?.[0]?.text?.trim()||"[]";
                  const bt=String.fromCharCode(96);const clean=text.replace(new RegExp(bt+bt+bt+"json","g"),"").replace(new RegExp(bt+bt+bt,"g"),"").trim();
                  const slides=JSON.parse(clean);
                  if(Array.isArray(slides)){
                    setTmplSlides(prev=>{const next=[...prev];slides.forEach((s,i)=>{if(i<next.length&&s.storyText)next[i]={...next[i],storyText:s.storyText};});return next;});
                    if(currentUser?.email){await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+getToken()},body:JSON.stringify({action:"increment-downloads",email:currentUser.email,credits:10})});setCurrentUser(u=>({...u,credits_used:(u.credits_used||0)+10}));}
                  }
                }catch(e){console.error(e);alert("Generation failed — try again");}
                setTmplSuggesting(null);
              };
              const generateCta=async()=>{
                setTmplCtaGenerating(true);
                try{
                  const prompt="Generate 3 lines for a social media CTA card. Offering: \"" +(tmplCtaTopLine||"digital product")+"\". CTA type: "+tmplCtaType+". "+(tmplCtaType==="comment"&&tmplCtaKeyword?"Keyword: "+tmplCtaKeyword+".":"")+" Return ONLY valid JSON with keys: topLine (intrigue/hook, max 10 words), keyword (1 word caps if comment type, else empty), rewardLine (what they get, max 12 words). No markdown.";
                  const r=await fetchWithRetry({model:"claude-sonnet-4-6",max_tokens:150,messages:[{role:"user",content:prompt}]});
                  const text=r?.content?.[0]?.text?.trim()||"{}";
                  const bt=String.fromCharCode(96);const clean=text.replace(new RegExp(bt+bt+bt+"json","g"),"").replace(new RegExp(bt+bt+bt,"g"),"").trim();
                  const parsed=JSON.parse(clean);
                  if(parsed.topLine)setTmplCtaTopLine(parsed.topLine);
                  if(parsed.keyword)setTmplCtaKeyword(parsed.keyword);
                  if(parsed.rewardLine)setTmplCtaRewardLine(parsed.rewardLine);
                }catch(e){console.error(e);}
                setTmplCtaGenerating(false);
              };

              const EFFECTS=[
                {id:"clean",label:"CLEAN",style:{color:"#fff",fontWeight:900}},
                {id:"gold",label:"GOLD",style:{background:"linear-gradient(135deg,#ffe44d,#BB9900,#ffe44d)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:900}},
                {id:"chrome",label:"CHROME",style:{background:"linear-gradient(135deg,#ddd,#777,#ccc)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:900}},
                {id:"fire",label:"FIRE 🔥",style:{background:"linear-gradient(135deg,#ffff00,#ff6600,#cc0000)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:900}},
                {id:"ice",label:"ICE ❄️",style:{background:"linear-gradient(135deg,#d0f0ff,#38bdf8,#1a6090)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:900}},
                {id:"neon",label:"NEON",style:{color:"#BB9900",textShadow:"0 0 10px #BB9900,0 0 20px #BB9900",fontWeight:900}},
                {id:"3d",label:"3D",style:{color:"#fff",textShadow:"2px 2px 0 #555,4px 4px 0 #333,6px 6px 8px rgba(0,0,0,0.4)",fontWeight:900}},
                {id:"rosegold",label:"ROSE GOLD",style:{background:"linear-gradient(135deg,#f4a0b0,#c96a7a,#f4a0b0)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:900}},
                {id:"glitter",label:"✨ GLITTER",style:{background:"linear-gradient(135deg,#fff,#f0d060,#fff,#f0d060)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:900}},
                {id:"holographic",label:"HOLO",style:{background:"linear-gradient(135deg,#ff6eb4,#a78bfa,#38bdf8,#34d399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:900}},
                {id:"pastel",label:"PASTEL",style:{color:"#f9a8d4",fontWeight:900}},
                {id:"blush",label:"BLUSH",style:{background:"linear-gradient(135deg,#ffecd2,#fcb69f,#ff9a9e)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:900}},
                {id:"sunset",label:"SUNSET",style:{background:"linear-gradient(135deg,#ffd700,#ff8c00,#ff4500)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:900}},
                {id:"matrix",label:"MATRIX",style:{color:"#00ff41",textShadow:"0 0 10px #00ff41",fontWeight:900}},
                {id:"purplehaze",label:"PURPLE",style:{color:"#c084fc",textShadow:"0 0 10px #c084fc",fontWeight:900}},
                {id:"shadowpop",label:"SHADOW",style:{color:"#fff",textShadow:"3px 3px 0 #BB9900",fontWeight:900}},
                {id:"duotone",label:"DUOTONE",style:{background:"linear-gradient(180deg,#BB9900,#fff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:900}},
              ];

              const ALL_FONTS=[
                {id:"Bebas Neue",label:"Bebas Neue"},
                {id:"Anton",label:"Anton"},
                {id:"Oswald",label:"Oswald"},
                {id:"Barlow Condensed",label:"Barlow Condensed"},
                {id:"Archivo Black",label:"Archivo Black"},
                {id:"Alfa Slab One",label:"Alfa Slab One"},
                {id:"Playfair Display",label:"Playfair Display"},
                {id:"Cormorant Garamond",label:"Cormorant Garamond"},
                {id:"Josefin Sans",label:"Josefin Sans"},
                {id:"Raleway",label:"Raleway"},
                {id:"Quicksand",label:"Quicksand"},
                {id:"Dancing Script",label:"Dancing Script"},
              ];

              const selectFont=(fontId)=>{
                setTmplFont(fontId);
                setTmplRecentFonts(prev=>{const next=[fontId,...prev.filter(f=>f!==fontId)].slice(0,4);try{localStorage.setItem("bwt_tmpl_recent_fonts",JSON.stringify(next));}catch{}return next;});
              };

              return(<div>
                {/* Back button + title */}
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                  <button onClick={()=>{
                    try{localStorage.setItem("bwt_tmpl_session_"+tmplSelected,JSON.stringify({slides:tmplSlides,slideCount:tmplSlideCount,brief:tmplBrief,effect:tmplEffect,font:tmplFont,fontSize:tmplFontSize,accentLine:tmplAccentLineColor,primary:tmplPrimary,secondary:tmplSecondary,bg:tmplBg,fontStyle:tmplFontStyle,rawBox:tmplRawBox,rawPos:tmplRawPos,listicleNum:tmplListicleNum}));}catch{}
                    setTmplSelected(null);
                  }} style={{background:"none",border:`1px solid ${A.border}`,color:A.muted,padding:"6px 14px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>← Templates</button>
                  <span style={{fontSize:15,fontWeight:800,color:GOLD}}>{isDarkFade?"Classic Theme Page":isListicle?"Listicle":isCleanPro?"Clean Pro":isStory?"Storytelling":isSplit?"Split":"Raw"}</span>
                  {isFree&&<span style={{fontSize:11,color:"#e74c3c",background:"rgba(231,76,60,0.1)",border:"1px solid rgba(231,76,60,0.3)",padding:"2px 8px",borderRadius:6,marginLeft:"auto"}}>Free — watermark on exports</span>}
                </div>

                {/* Main grid */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:28,alignItems:"start"}}>

                  {/* LEFT — sticky preview */}
                  <div style={{position:"sticky",top:76,alignSelf:"start"}}>
                    <div style={{background:A.surface,borderRadius:12,border:`1.5px solid ${A.border}`,overflow:"hidden",marginBottom:12}}>
                      <div style={{position:"relative",overflow:"hidden",borderRadius:8,background:A.bg}}>
                        {(()=>{const PW=540,PH=Math.round(1350*PW/1080);return(<div style={{width:"100%",maxWidth:PW,height:PH,position:"relative",overflow:"hidden",margin:"0 auto"}}><iframe key={`prev-${activeSlide}`} srcDoc={previewHTML} style={{width:1080,height:1350,border:"none",transform:"scale(0.5)",transformOrigin:"top left",pointerEvents:"none",display:"block"}} scrolling="no"/></div>);})()}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                      {thumbHTMLs.map((html,idx)=>(<div key={idx} onClick={()=>setTmplActiveSlide(idx)} style={{cursor:"pointer",position:"relative",flexShrink:0,width:86,height:108,borderRadius:6,overflow:"hidden",border:`2px solid ${activeSlide===idx?GOLD:A.border}`,transition:"border-color 0.15s"}}><iframe srcDoc={html} style={{width:1080,height:1350,border:"none",transform:"scale(0.0796)",transformOrigin:"top left",pointerEvents:"none"}} scrolling="no"/><div style={{position:"absolute",bottom:3,right:4,background:idx===tmplSlideCount?"rgba(187,153,0,0.9)":"rgba(0,0,0,0.7)",borderRadius:3,padding:"1px 5px",fontSize:9,color:"#fff",fontWeight:700,zIndex:2}}>{idx===tmplSlideCount?"CTA":idx+1}</div></div>))}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>downloadSlide(activeSlide)} disabled={tmplDownloadingIdx===activeSlide} style={{flex:1,background:A.surface,border:`1.5px solid ${A.border}`,color:A.text,padding:"10px",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                        {tmplDownloadingIdx===activeSlide?<><Spin c={A.text}/>Downloading...</>:`↓ Slide ${activeSlide+1}`}
                      </button>
                      <button onClick={()=>{if(window.confirm("Please check all slides look correct. This cannot be undone.")){downloadAllTmpl();}}} disabled={tmplDownloading} style={{flex:2,background:`linear-gradient(135deg,#1a1a1a,#0a0a0a)`,color:A.accentText,padding:"10px",borderRadius:9,fontSize:13,fontWeight:800,border:`1px solid ${GOLD}33`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                        {tmplDownloading?<><Spin/>Downloading...</>:"↓ Download All (10 credits)"}
                      </button>
                    </div>
                  </div>

                  {/* RIGHT — Content / Style tabs */}
                  <div style={{display:"flex",flexDirection:"column",gap:0}}>

                    {/* Tab switcher */}
                    <div style={{display:"flex",marginBottom:12,background:A.surface,borderRadius:10,padding:4,border:`1.5px solid ${A.border}`}}>
                      {["content","style"].map(tab=>(
                        <button key={tab} onClick={()=>setTmplContentStyleTab(tab)} style={{flex:1,padding:"8px",borderRadius:7,border:"none",background:tmplContentStyleTab===tab?A.bg:"transparent",color:tmplContentStyleTab===tab?A.text:A.muted,fontSize:13,fontWeight:tmplContentStyleTab===tab?800:500,cursor:"pointer",textTransform:"capitalize",transition:"all 0.15s"}}>{tab}</button>
                      ))}
                    </div>

                    {/* ── CONTENT TAB ── */}
                    {tmplContentStyleTab==="content"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>



                      {!activeIsCtaSlide&&<><div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:10,padding:14}}>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:A.muted,marginBottom:10}}>Slide {activeSlide+1} of {tmplSlideCount}</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:12}}>
                          {tmplSlides.slice(0,tmplSlideCount).map((_,i)=>(<button key={i} onClick={()=>setTmplActiveSlide(i)} style={{width:27,height:27,borderRadius:6,background:activeSlide===i?A.text:A.surface,border:`1.5px solid ${activeSlide===i?GOLD:A.border}`,color:activeSlide===i?A.accentText:A.muted,fontSize:12,fontWeight:700,cursor:"pointer"}}>{i+1}</button>))}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:11,color:A.muted}}>Slides:</span>
                          <button onClick={()=>setTmplSlideCount(s=>Math.max(2,s-1))} style={{width:24,height:24,borderRadius:5,border:`1px solid ${A.border}`,background:A.bg,color:A.text,fontSize:14,cursor:"pointer"}}>−</button>
                          <span style={{fontWeight:800,fontSize:14}}>{tmplSlideCount}</span>
                          <button onClick={()=>setTmplSlideCount(s=>Math.min(maxSlides,s+1))} style={{width:24,height:24,borderRadius:5,border:`1px solid ${A.border}`,background:A.bg,color:A.text,fontSize:14,cursor:"pointer"}}>+</button>
                          <span style={{fontSize:10,color:A.muted}}>max {maxSlides}</span>
                        </div>
                      </div>

                      {/* Slide counter toggle */}
                      {!isListicle&&<div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:A.text}}>Slide Counter</div>
                          <div style={{fontSize:11,color:A.muted}}>Show slide number on every slide</div>
                        </div>
                        <div onClick={()=>setTmplShowCounter(s=>!s)} style={{width:36,height:20,borderRadius:10,background:tmplShowCounter?GOLD:A.border,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
                          <div style={{position:"absolute",top:2,left:tmplShowCounter?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
                        </div>
                      </div>}

                      {/* Slide content inputs */}
                      <div style={{background:A.surface,border:`1.5px solid ${activeSlide===0?GOLD:A.border}`,borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:10}}>
                        <div style={{fontSize:12,fontWeight:800,color:activeSlide===0?GOLD:A.text}}>{activeSlide===0?"Cover Slide":"Slide "+(activeSlide+1)}</div>

                        {/* Image pickers */}
                        {(isDarkFade||isListicle||(isCleanPro&&activeSlide===0)||isRaw||isSplit)&&(
                          <div>
                            <label style={lbl}>{isSplit?"Left Image":"Photo"}</label>
                            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                              {tmplLibrary.map((p,pi)=>(<div key={pi} style={{position:"relative",flexShrink:0}}><div onClick={()=>updateSlide("image",p)} style={{width:52,height:52,borderRadius:7,overflow:"hidden",border:`2px solid ${slide.image===p?GOLD:A.border}`,cursor:"pointer"}}><img src={p} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div><div onClick={()=>{if(slide.image===p)updateSlide("image",null);}} style={{position:"absolute",top:-4,right:-4,width:15,height:15,borderRadius:"50%",background:"#e74c3c",color:"#fff",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontWeight:900,zIndex:2}}>×</div><div onClick={()=>{const doRemove=()=>{const next=tmplLibrary.filter((_,j)=>j!==pi);setTmplLibrary(next);try{localStorage.setItem("bwt_tmpl_library",JSON.stringify(next));}catch{}if(slide.image===p)updateSlide("image",null);};if(suppressLibraryConfirm){doRemove();return;}if(window.confirm("Remove from library?")){doRemove();if(window.confirm("Don't show again?")){setSuppressLibraryConfirm(true);try{localStorage.setItem("bwt_suppress_lib_confirm","1");}catch{}}}}} style={{position:"absolute",bottom:-4,right:-4,width:15,height:15,borderRadius:"50%",background:"#333",color:"#fff",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontWeight:700,zIndex:2}}>🗑</div></div>))}
                              <div onClick={()=>{const i=document.createElement("input");i.type="file";i.accept="image/*";i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const url=ev.target.result;updateSlide("image",url);const next=[url,...tmplLibrary.filter(p=>p!==url)].slice(0,15);setTmplLibrary(next);try{localStorage.setItem("bwt_tmpl_library",JSON.stringify(next));}catch{}};r.readAsDataURL(f);};i.click();}} style={{width:52,height:52,borderRadius:7,border:`1.5px dashed ${A.border}`,background:A.bg,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:A.muted,fontSize:22,flexShrink:0}}>+</div>
                              {isPexelsUser&&<div onClick={()=>setShowPexelsTmplLib(true)} style={{width:52,height:52,borderRadius:7,border:`1.5px solid ${GOLD}44`,background:A.bg,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:GOLD,fontSize:9,fontWeight:800,flexShrink:0,textAlign:"center",lineHeight:1.2}}>🔍<br/>Pexels</div>}
                            </div>
                            {tmplLibrary.length===0&&<p style={{fontSize:11,color:A.muted,margin:"0 0 6px"}}>Upload photos — they'll save to your library.</p>}
                          </div>
                        )}

                        {/* Split right image */}
                        {isSplit&&<div>
                          <label style={lbl}>Right Image</label>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}}>
                            {tmplLibrary.map((p,pi)=>(<div key={pi} style={{position:"relative",flexShrink:0}}><div onClick={()=>updateSlide("image2",p)} style={{width:52,height:52,borderRadius:7,overflow:"hidden",border:`2px solid ${slide.image2===p?GOLD:A.border}`,cursor:"pointer"}}><img src={p} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>{slide.image2===p&&<div onClick={()=>updateSlide("image2",null)} style={{position:"absolute",top:-4,right:-4,width:15,height:15,borderRadius:"50%",background:"#e74c3c",color:"#fff",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontWeight:900,zIndex:2}}>×</div>}</div>))}
                            <div onClick={()=>{const i=document.createElement("input");i.type="file";i.accept="image/*";i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const url=ev.target.result;updateSlide("image2",url);const next=[url,...tmplLibrary.filter(p=>p!==url)].slice(0,15);setTmplLibrary(next);try{localStorage.setItem("bwt_tmpl_library",JSON.stringify(next));}catch{}};r.readAsDataURL(f);};i.click();}} style={{width:52,height:52,borderRadius:7,border:`1.5px dashed ${A.border}`,background:A.bg,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:A.muted,fontSize:22}}>+</div>
                          </div>
                        </div>}

                        {/* Text inputs per template type */}
                        {(isDarkFade||(isCleanPro&&activeSlide===0))&&<><label style={lbl}>Headline</label><input value={slide.headline||""} onChange={e=>updateSlide("headline",e.target.value)} placeholder="Hook headline" style={{...inp}}/><label style={lbl}>Subline</label><input value={slide.subline||""} onChange={e=>updateSlide("subline",e.target.value)} placeholder="Supporting line (optional)" style={{...inp}}/></>}
                        {isListicle&&activeSlide===0&&<><label style={lbl}>Number</label><input type="number" min={1} value={tmplListicleNum} onChange={e=>setTmplListicleNum(Math.max(1,parseInt(e.target.value)||1))} style={{...inp,width:80}}/><label style={lbl}>Topic Line</label><input value={slide.topicLine||""} onChange={e=>updateSlide("topicLine",e.target.value)} style={{...inp}}/><label style={lbl}>Subject</label><input value={slide.subject||""} onChange={e=>updateSlide("subject",e.target.value)} style={{...inp}}/><label style={lbl}>Subline</label><input value={slide.subline||""} onChange={e=>updateSlide("subline",e.target.value)} style={{...inp}}/></>}
                        {isListicle&&activeSlide>0&&<><label style={lbl}>Point {activeSlide} — Headline</label><input value={slide.headline||""} onChange={e=>updateSlide("headline",e.target.value)} placeholder={`Point ${activeSlide} headline`} style={{...inp}}/><label style={lbl}>Detail</label><div style={{position:"relative"}}><textarea value={slide.bodyText||""} onChange={e=>updateSlide("bodyText",e.target.value)} placeholder="The tip, fact or detail" rows={3} style={{...inp,resize:"vertical",paddingRight:72}}/><button onClick={()=>tmplSuggestSlide(activeSlide,tmplSelected,tmplBrief,tmplSlides,tmplSlideCount)} disabled={tmplSuggesting===activeSlide} style={{position:"absolute",right:6,top:8,background:"none",border:`1px solid ${A.border}`,color:GOLD,fontSize:11,fontWeight:700,padding:"4px 8px",borderRadius:6,cursor:"pointer"}}>{tmplSuggesting===activeSlide?"...":"✨ AI"}</button></div></>}
                        {isCleanPro&&activeSlide>0&&<><label style={lbl}>Headline</label><input value={slide.headline||""} onChange={e=>updateSlide("headline",e.target.value)} placeholder="Headline" style={{...inp}}/><label style={lbl}>Body Text</label><div style={{position:"relative"}}><textarea value={slide.bodyText||""} onChange={e=>updateSlide("bodyText",e.target.value)} placeholder="Body text" rows={4} style={{...inp,resize:"vertical",paddingRight:72}}/><button onClick={()=>tmplSuggestSlide(activeSlide,tmplSelected,tmplBrief,tmplSlides,tmplSlideCount)} disabled={tmplSuggesting===activeSlide} style={{position:"absolute",right:6,top:8,background:"none",border:`1px solid ${A.border}`,color:GOLD,fontSize:11,fontWeight:700,padding:"4px 8px",borderRadius:6,cursor:"pointer"}}>{tmplSuggesting===activeSlide?"...":"✨ AI"}</button></div><label style={lbl}>Accent Sub-text</label><input value={slide.accentText||""} onChange={e=>updateSlide("accentText",e.target.value)} placeholder="Key takeaway in accent colour" style={{...inp}}/></>}
                        {isStory&&<><label style={lbl}>Story Text — Slide {activeSlide+1}</label><div style={{position:"relative"}}><textarea value={slide.storyText||""} onChange={e=>updateSlide("storyText",e.target.value)} placeholder="Your story paragraph." rows={6} style={{...inp,resize:"vertical",paddingRight:72,lineHeight:1.6}}/><button onClick={()=>tmplSuggestSlide(activeSlide,tmplSelected,tmplBrief,tmplSlides,tmplSlideCount)} disabled={tmplSuggesting===activeSlide} style={{position:"absolute",right:6,top:8,background:"none",border:`1px solid ${A.border}`,color:GOLD,fontSize:11,fontWeight:700,padding:"4px 8px",borderRadius:6,cursor:"pointer"}}>{tmplSuggesting===activeSlide?"...":"✨ AI"}</button></div></>}
                        {isSplit&&<><label style={lbl}>Left Headline</label><input value={slide.headline||""} onChange={e=>updateSlide("headline",e.target.value)} placeholder="Before" style={{...inp}}/><label style={lbl}>Left Subline</label><input value={slide.subline||""} onChange={e=>updateSlide("subline",e.target.value)} placeholder="Where you are now." style={{...inp}}/><label style={lbl}>Right Headline</label><input value={slide.headline2||""} onChange={e=>updateSlide("headline2",e.target.value)} placeholder="After" style={{...inp}}/><label style={lbl}>Right Subline</label><input value={slide.subline2||""} onChange={e=>updateSlide("subline2",e.target.value)} placeholder="Where you could be." style={{...inp}}/></>}
                        {isRaw&&<><label style={lbl}>Your Text</label><p style={{fontSize:11,color:A.muted,margin:"-6px 0 4px"}}>Each paragraph gets its own highlight box.</p><textarea value={slide.rawText||""} onChange={e=>updateSlide("rawText",e.target.value)} placeholder={"The goal isn't to be rich.\n\nIt's to be free."} rows={6} style={{...inp,resize:"vertical",lineHeight:1.6}}/></>}

                        {/* AI Brief (inside content panel) */}
                        {isCleanPro&&<><label style={{...lbl,color:GOLD}}>AI Brief</label><textarea value={tmplBrief} onChange={e=>setTmplBrief(e.target.value)} rows={2} placeholder="What's this carousel about?" style={{...inp,fontSize:12,lineHeight:1.5}}/><div style={{fontSize:10,color:A.muted,marginTop:-4}}>Powers ✨ AI Suggest on each slide.</div></>}
                        {isStory&&<><label style={{...lbl,color:GOLD}}>AI — Generate Full Story</label><textarea value={tmplBrief} onChange={e=>setTmplBrief(e.target.value)} rows={4} placeholder="Describe what this story is about. Include detail — names, places, emotions, timeline, turning points, outcomes. Can be personal, educational, fictional or factual." style={{...inp,fontSize:12,lineHeight:1.5}}/><div style={{fontSize:10,color:A.muted,marginTop:-4}}>AI will write your story across all {tmplSlideCount} slides, each flowing into the next.</div><button onClick={generateStory} disabled={tmplSuggesting==="story"} style={{background:"linear-gradient(135deg,#1a1500,#0a0a0a)",border:"1px solid "+GOLD,color:GOLD,padding:"10px",borderRadius:8,fontSize:13,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",marginTop:4}}>{tmplSuggesting==="story"?<><Spin/>Generating story...</>:"✨ Generate Story (10 credits)"}</button></>}
                        {isListicle&&activeSlide===0&&<><label style={{...lbl,color:GOLD}}>AI — Generate Full List</label><textarea value={tmplBrief} onChange={e=>setTmplBrief(e.target.value)} rows={2} placeholder="What's your list about? e.g. places to visit in Europe, productivity habits, business lessons..." style={{...inp,fontSize:12,lineHeight:1.5}}/><div style={{fontSize:10,color:A.muted,marginTop:-4}}>Any filled headlines will be used as anchors. Empty slots will be generated.</div><button onClick={generateList} disabled={tmplSuggesting==="list"} style={{background:"linear-gradient(135deg,#1a1500,#0a0a0a)",border:"1px solid "+GOLD,color:GOLD,padding:"10px",borderRadius:8,fontSize:13,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",marginTop:4}}>{tmplSuggesting==="list"?<><Spin/>Generating list...</>:"✨ Generate Full List (10 credits)"}</button></>}
                      </div></>
                      }
                      {/* Optional CTA Card */}
                      <div style={{background:A.surface,border:`1.5px solid ${tmplShowCta?GOLD:A.border}`,borderRadius:10,overflow:"hidden"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px"}}>
                          <div>
                            <div style={{fontSize:12,fontWeight:800,color:A.text}}>Optional CTA Card</div>
                            <div style={{fontSize:11,color:A.muted}}>Adds a final slide with a call to action</div>
                          </div>
                          <div onClick={()=>setTmplShowCta(s=>!s)} style={{width:36,height:20,borderRadius:10,background:tmplShowCta?GOLD:A.border,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
                            <div style={{position:"absolute",top:2,left:tmplShowCta?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
                          </div>
                        </div>
                        {tmplShowCta&&<div style={{padding:"0 14px 14px",display:"flex",flexDirection:"column",gap:10}}>
                          <label style={lbl}>CTA Type</label>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            {[["comment","Comment"],["follow","Follow"],["save","Save"],["share","Share"],["like","Like"]].map(([t,l])=>(<button key={t} onClick={()=>{setTmplCtaType(t);setTmplCtaLine2("");setTmplCtaKeyword("");setTmplCtaTopLine("");setTmplCtaRewardLine("");}} style={{flex:1,padding:"7px 4px",borderRadius:7,border:`1.5px solid ${tmplCtaType===t?GOLD:A.border}`,background:tmplCtaType===t?"#1a1500":A.bg,color:tmplCtaType===t?GOLD:A.muted,fontSize:11,fontWeight:700,cursor:"pointer",minWidth:56}}>{l}</button>))}
                          </div>
                          <label style={lbl}>Line 1 — Hook</label>
                          <input value={tmplCtaTopLine} onChange={e=>setTmplCtaTopLine(e.target.value)} placeholder={isDarkFade?"Want to build wealth online?":isListicle?"Want more content like this?":isCleanPro?"Want the full strategy?":isStory?"Want to start your own journey?":"Want more like this?"} style={{...inp}}/>
                          <label style={lbl}>Line 2 — Action</label>
                          <input value={tmplCtaLine2} onChange={e=>setTmplCtaLine2(e.target.value)} placeholder={tmplCtaType==="comment"?"Comment the word":tmplCtaType==="follow"?"Follow":tmplCtaType==="save"?"Save this":tmplCtaType==="share"?"Share this":"Like this"} style={{...inp}}/>
                          <label style={lbl}>{tmplCtaType==="comment"?"Keyword — big bold word":"Big word"}</label>
                          <input value={tmplCtaKeyword} onChange={e=>setTmplCtaKeyword(e.target.value.toUpperCase())} placeholder={tmplCtaType==="comment"?"GUIDE":tmplCtaType==="follow"?"FOLLOW":tmplCtaType==="save"?"SAVE":tmplCtaType==="share"?"SHARE":"LIKE"} style={{...inp,textTransform:"uppercase",fontWeight:800,fontSize:18,letterSpacing:3}}/>
                          <label style={lbl}>Line 3 — Reward / Reason</label>
                          <input value={tmplCtaRewardLine} onChange={e=>setTmplCtaRewardLine(e.target.value)} placeholder={tmplCtaType==="comment"?"and I'll send it straight over":tmplCtaType==="follow"?"for more content like this":tmplCtaType==="save"?"so you don't lose it":tmplCtaType==="share"?"with someone who needs it":"if it resonated with you"} style={{...inp}}/>
                          {!isCleanPro&&!isStory&&<><label style={lbl}>Background</label>
                          <div style={{display:"flex",gap:6}}>{["dark","light"].map(m=>(<button key={m} onClick={()=>setTmplCtaBg(m)} style={{flex:1,padding:"7px",borderRadius:7,border:`1.5px solid ${tmplCtaBg===m?GOLD:A.border}`,background:tmplCtaBg===m?"#1a1500":A.bg,color:tmplCtaBg===m?GOLD:A.muted,fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>{m}</button>))}</div></>}
                          
                        </div>}
                      </div>

                    </div>}

                    {/* ── STYLE TAB ── */}
                    {tmplContentStyleTab==="style"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
                      {activeIsCtaSlide&&<div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:10,padding:14,marginBottom:8}}><div style={{fontSize:12,color:A.muted,lineHeight:1.6}}>CTA slide inherits your template colours and font.</div></div>}
                      {/* Effects dropdown */}
                      {!isRaw&&!isStory&&!activeIsCtaSlide&&<div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:10}}>
                        <label style={lbl}>Text Effect</label>
                        <div style={{position:"relative",display:"flex",alignItems:"center"}}><select value={tmplEffect} onChange={e=>setTmplEffect(e.target.value)} style={{...inp,appearance:"none",cursor:"pointer",fontWeight:700,paddingRight:32,width:"100%"}}>
                          {EFFECTS.map(ef=>(<option key={ef.id} value={ef.id}>{ef.label}</option>))}
                        </select><div style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:GOLD,fontSize:14}}>▼</div></div>
                        {/* Preview of selected effect */}
                        <div style={{padding:"12px",background:A.bg,borderRadius:8,textAlign:"center",fontSize:28,fontWeight:900,...EFFECTS.find(e=>e.id===tmplEffect)?.style}}>
                          {EFFECTS.find(e=>e.id===tmplEffect)?.label||tmplEffect.toUpperCase()}
                        </div>
                        {/* NEON colour picker */}
                        <label style={lbl}>{isListicle?"Number & Subject Colour":tmplEffect==="neon"?"Glow Colour":"Headline / Effect Colour"}</label>
                        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
                          {(tmplFavColors||[null,null,null]).map((c,i)=>(<div key={i} style={{position:"relative",flexShrink:0,width:28,height:28,borderRadius:6,background:c||"transparent",border:`2px solid ${c&&tmplPrimary===c?GOLD:A.border}`,cursor:c?"pointer":"default"}} onClick={c?()=>setTmplPrimary(c):undefined}>{!c&&<div style={{position:"relative",overflow:"hidden",width:"100%",height:"100%",borderRadius:6}}><input type="color" defaultValue="#BB9900" onChange={e=>{const n=[...(tmplFavColors||[null,null,null])];n[i]=e.target.value;setTmplFavColors(n);setTmplPrimary(e.target.value);try{localStorage.setItem("bwt_tmpl_fav_colors",JSON.stringify(n));}catch{}}} style={{position:"absolute",inset:-4,opacity:0,cursor:"pointer",width:"calc(100% + 8px)",height:"calc(100% + 8px)"}}/><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#666",fontSize:16,pointerEvents:"none"}}>+</div></div>}{c&&<div onClick={e=>{e.stopPropagation();const n=[...(tmplFavColors||[null,null,null])];n[i]=null;setTmplFavColors(n);try{localStorage.setItem("bwt_tmpl_fav_colors",JSON.stringify(n));}catch{}}} style={{position:"absolute",top:-4,right:-4,width:12,height:12,borderRadius:"50%",background:"#e74c3c",color:"#fff",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:10}}>×</div>}</div>))}
                          <input type="text" value={tmplPrimary} onChange={e=>{if(/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value))setTmplPrimary(e.target.value);}} maxLength={7} style={{...inp,flex:1,minWidth:70,fontFamily:"monospace",fontWeight:700,textTransform:"uppercase"}}/>
                          <div style={{position:"relative",width:34,height:34,flexShrink:0,borderRadius:8,overflow:"hidden",border:`1.5px solid ${A.border}`,cursor:"pointer"}}><div style={{width:"100%",height:"100%",background:tmplPrimary}}/><input type="color" value={tmplPrimary} onChange={e=>setTmplPrimary(e.target.value)} style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%"}}/></div>
                        </div>
                        <label style={lbl}>{isListicle?"Topic & Text Colour":"Subline / Body Colour"}</label>
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          {(tmplFavColors||[null,null,null]).map((c,i)=>(<div key={i} style={{position:"relative",flexShrink:0,width:28,height:28,borderRadius:6,background:c||"transparent",border:`2px solid ${c&&tmplSecondary===c?GOLD:A.border}`,cursor:c?"pointer":"default"}} onClick={c?()=>setTmplSecondary(c):undefined}>{!c&&<div style={{position:"relative",overflow:"hidden",width:"100%",height:"100%",borderRadius:6}}><input type="color" defaultValue="#ffffff" onChange={e=>{const n=[...(tmplFavColors||[null,null,null])];n[i]=e.target.value;setTmplFavColors(n);setTmplSecondary(e.target.value);try{localStorage.setItem("bwt_tmpl_fav_colors",JSON.stringify(n));}catch{}}} style={{position:"absolute",inset:-4,opacity:0,cursor:"pointer",width:"calc(100% + 8px)",height:"calc(100% + 8px)"}}/><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#666",fontSize:16,pointerEvents:"none"}}>+</div></div>}{c&&<div onClick={e=>{e.stopPropagation();const n=[...(tmplFavColors||[null,null,null])];n[i]=null;setTmplFavColors(n);try{localStorage.setItem("bwt_tmpl_fav_colors",JSON.stringify(n));}catch{}}} style={{position:"absolute",top:-4,right:-4,width:12,height:12,borderRadius:"50%",background:"#e74c3c",color:"#fff",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:10}}>×</div>}</div>))}
                          <input type="text" value={tmplSecondary} onChange={e=>{if(/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value))setTmplSecondary(e.target.value);}} maxLength={7} style={{...inp,flex:1,minWidth:70,fontFamily:"monospace",fontWeight:700,textTransform:"uppercase"}}/>
                          <div style={{position:"relative",width:34,height:34,flexShrink:0,borderRadius:8,overflow:"hidden",border:`1.5px solid ${A.border}`,cursor:"pointer"}}><div style={{width:"100%",height:"100%",background:tmplSecondary}}/><input type="color" value={tmplSecondary} onChange={e=>setTmplSecondary(e.target.value)} style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%"}}/></div>
                        </div>
                      </div>}

                      {/* Font */}
{!activeIsCtaSlide&&<div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:10}}>
                        <label style={lbl}>Font</label>
                        {/* Recent fonts quick select */}
                        {tmplRecentFonts.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          {tmplRecentFonts.map(f=>(<button key={f} onClick={()=>selectFont(f)} style={{padding:"5px 10px",borderRadius:7,border:`1.5px solid ${tmplFont===f?GOLD:A.border}`,background:tmplFont===f?"#1a1500":A.bg,color:tmplFont===f?GOLD:A.muted,fontSize:11,fontWeight:600,cursor:"pointer"}}>{f}</button>))}
                        </div>}

                      {/* Headline size slider */}
                        <div style={{position:"relative",display:"flex",alignItems:"center"}}><select value={tmplFont} onChange={e=>selectFont(e.target.value)} style={{...inp,appearance:"none",cursor:"pointer",fontWeight:700,paddingRight:32,width:"100%"}}>{ALL_FONTS.map(f=>(<option key={f.id} value={f.id}>{f.label}</option>))}</select><div style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:GOLD,fontSize:14}}>▼</div></div>

                      {/* Headline size */}
                      
                      </div>
}


                      {/* Accent line colour */}
{!activeIsCtaSlide&&<div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:10}}>
                        <label style={lbl}>Accent Line Colour</label>
                        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                          {(tmplFavColors||[null,null,null]).map((c,i)=>(<div key={i} style={{position:"relative",flexShrink:0}}>{c?<div onClick={e=>{e.stopPropagation();setTmplAccentLineColor(c);}} style={{width:28,height:28,borderRadius:6,background:c,border:`2px solid ${tmplAccentLineColor===c?GOLD:A.border}`,cursor:"pointer",zIndex:5,position:"relative"}}/>:<div style={{width:28,height:28,borderRadius:6,border:`1.5px dashed ${A.border}`,position:"relative",overflow:"hidden"}}><input type="color" defaultValue="#BB9900" onChange={e=>{const n=[...(tmplFavColors||[null,null,null])];n[i]=e.target.value;setTmplFavColors(n);setTmplAccentLineColor(e.target.value);try{localStorage.setItem("bwt_tmpl_fav_colors",JSON.stringify(n));}catch{}}} style={{position:"absolute",inset:-4,opacity:0,cursor:"pointer",width:"calc(100% + 8px)",height:"calc(100% + 8px)"}}/><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:A.muted,fontSize:16,pointerEvents:"none"}}>+</div></div>}{c&&<div onClick={()=>{const n=[...(tmplFavColors||[null,null,null])];n[i]=null;setTmplFavColors(n);try{localStorage.setItem("bwt_tmpl_fav_colors",JSON.stringify(n));}catch{}}} style={{position:"absolute",top:-4,right:-4,width:12,height:12,borderRadius:"50%",background:"#e74c3c",color:"#fff",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:2,pointerEvents:"auto"}}>×</div>}</div>))}
                          <input type="text" value={tmplAccentLineColor} onChange={e=>{if(/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value))setTmplAccentLineColor(e.target.value);}} maxLength={7} placeholder="#BB9900" style={{...inp,flex:1,minWidth:70,fontFamily:"monospace",fontWeight:700,textTransform:"uppercase"}}/>
                          <div style={{position:"relative",width:34,height:34,flexShrink:0,borderRadius:8,overflow:"hidden",border:`1.5px solid ${A.border}`,cursor:"pointer"}}><div style={{width:"100%",height:"100%",background:tmplAccentLineColor}}/><input type="color" value={tmplAccentLineColor} onChange={e=>setTmplAccentLineColor(e.target.value)} style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%"}}/></div>
                        </div>
                      </div>
}
                      {/* Background toggle (Clean Pro / Storytelling) */}
                      {(isCleanPro||isStory)&&<div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:8}}>
                        <label style={lbl}>Body Background</label>
                        <div style={{display:"flex",gap:8}}>{["white","black"].map(m=>(<button key={m} onClick={()=>setTmplBg(m)} style={{flex:1,padding:"8px",borderRadius:7,border:`1.5px solid ${tmplBg===m?GOLD:A.border}`,background:tmplBg===m?"#1a1500":A.bg,color:tmplBg===m?GOLD:A.muted,fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>{m}</button>))}</div>
                      </div>}

                      {/* Raw options */}
                      {isRaw&&<div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:8}}>
                        <label style={lbl}>Text Size <span style={{fontSize:9,fontWeight:400,textTransform:"none"}}>{tmplFontSize}px</span></label>
                        <input type="range" min={24} max={80} value={tmplFontSize} onChange={e=>setTmplFontSize(Number(e.target.value))} style={{width:"100%",accentColor:GOLD}}/>
                        <label style={lbl}>Text Highlight</label>
                        <div style={{display:"flex",gap:8}}>{["white","black","none"].map(m=>(<button key={m} onClick={()=>setTmplRawBox(m)} style={{flex:1,padding:"8px",borderRadius:7,border:`1.5px solid ${tmplRawBox===m?GOLD:A.border}`,background:tmplRawBox===m?"#1a1500":A.bg,color:tmplRawBox===m?GOLD:A.muted,fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>{m}</button>))}</div>
                        <label style={lbl}>Text Position</label>
                        <div style={{display:"flex",gap:8}}>{["bottom","centre"].map(m=>(<button key={m} onClick={()=>setTmplRawPos(m)} style={{flex:1,padding:"8px",borderRadius:7,border:`1.5px solid ${tmplRawPos===m?GOLD:A.border}`,background:tmplRawPos===m?"#1a1500":A.bg,color:tmplRawPos===m?GOLD:A.muted,fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>{m}</button>))}</div>
                      </div>}

                      {/* Storytelling font style */}
                      {isStory&&<div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:8}}>
                        <label style={lbl}>Font Style</label>
                        <div style={{display:"flex",gap:6}}>{[["Inter","Clean"],["Times New Roman","Serif"]].map(([id,label])=>(<button key={id} onClick={()=>setTmplFontStyle(id)} style={{flex:1,padding:"8px",borderRadius:7,border:`1.5px solid ${tmplFontStyle===id?GOLD:A.border}`,background:tmplFontStyle===id?"#1a1500":A.bg,color:tmplFontStyle===id?GOLD:A.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>{label}</button>))}</div>
                      </div>}

                    </div>}
                  </div>
                </div>
              </div>);
            })()}
          </div>
        )}

         {nav==="brand"&&(
          <div style={{animation:"fadeUp 0.3s ease",maxWidth:900,margin:"0 auto",width:"100%"}}>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 20px"}}>Brand</h2>
            {currentUser?.is_admin&&(
              <div style={{background:"#1a1500",border:`1.5px solid ${GOLD}`,borderRadius:12,padding:16,marginBottom:20}}>
                <label style={{...lbl,color:GOLD}}>Admin — Brand Presets</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10,marginBottom:10}}>
                  {adminPresets.map(p=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:4,background:adminActivePreset===p.id?GOLD:A.bg,border:`1px solid ${A.border}`,borderRadius:8,padding:"4px 4px 4px 10px"}}>
                      <span onClick={()=>loadAdminPreset(p.id)} style={{cursor:"pointer",fontSize:12,fontWeight:700,color:adminActivePreset===p.id?"#000":A.text}}>{p.label}</span>
                      <button onClick={()=>deleteAdminPreset(p.id)} style={{background:"none",border:"none",color:adminActivePreset===p.id?"#000":A.muted,cursor:"pointer",fontSize:12,padding:"2px 6px"}}>×</button>
                    </div>
                  ))}
                  {adminPresets.length===0&&<span style={{fontSize:12,color:A.muted}}>No presets saved yet.</span>}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <input value={adminPresetName} onChange={e=>setAdminPresetName(e.target.value)} placeholder="Preset name e.g. Client X" style={{...inp,flex:1}}/>
                  <button onClick={saveAdminPreset} style={{padding:"8px 16px",background:GOLD,color:"#000",borderRadius:8,fontWeight:700,fontSize:12,border:"none",whiteSpace:"nowrap"}}>Save Current</button>
                </div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:24,alignItems:"start"}} className="brand-grid">
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
                  <input ref={profileRef} type="file" accept="image/*" onChange={async e=>{
                    const file = e.target.files[0]; if(!file) return;
                    const reader = new FileReader();
                    reader.onload = async ev => {
                      const base64 = ev.target.result;
                      setProfileUrl(base64); // show preview immediately (base64 not saved to localStorage yet)
                      try {
                        const res = await fetch('/api/upload-photo', {
                          method:'POST',
                          headers:{'Content-Type':'application/json'},
                          body: JSON.stringify({ imageData: base64, filename: `profile-${Date.now()}.jpg` })
                        });
                        const data = await res.json();
                        if (data.url) setProfileUrl(data.url); // replace with real Blob URL — this triggers localStorage save
                      } catch(err) { console.error('Upload failed, using base64:', err); }
                    };
                    reader.readAsDataURL(file);
                  }} style={{display:"none"}}/>
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
                <label style={lbl}>Voice profile <span style={{letterSpacing:0,fontWeight:400,fontSize:9,textTransform:"none"}}>(sent with every prompt)</span></label>
                <p style={{color:A.muted,fontSize:12,margin:"0 0 10px",lineHeight:1.6}}>Describe your tone, audience, what to avoid, CTA style. More specific = better output.</p>
                <textarea value={voiceProfile} onChange={e=>setVoiceProfile(e.target.value)} placeholder="e.g. Direct and honest. Short punchy sentences. Speak to people tired of the hype. Never overpromise. CTA is always soft — 'free preview in bio'." rows={5} style={{...inp,resize:"vertical",lineHeight:1.7}}/>
              </div>

              </div>

              {/* Right column — cover photo library + badge position */}
              <div style={{position:"sticky",top:80}}>
                <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20}}>
                  <label style={lbl}>Cover photo library</label>
                  <p style={{color:A.muted,fontSize:12,margin:"0 0 12px",lineHeight:1.6}}>Upload and save up to 10 images. Pick one per generation. Used on cover slide only.</p>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                    {coverPhotos.map((p,i)=>(
                      <div key={i} style={{position:"relative",flexShrink:0}}>
                        <div onClick={()=>{if(activeCoverPhoto===p){setActiveCoverPhoto(null);if(bgMode==="light")setCustomColourDark(false);else setCustomColourDark(true);}else{setActiveCoverPhoto(p);sampleImageBrightness(p).then(result=>{setBadgeArea(result);if(result==="light")setCustomColourDark(false);else setCustomColourDark(true);});}}} style={{width:56,height:56,borderRadius:8,overflow:"hidden",border:activeCoverPhoto===p?`2.5px solid ${GOLD}`:`2px solid ${A.border}`,cursor:"pointer"}}>
                          <img src={p} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        </div>
                        {activeCoverPhoto===p&&<div onClick={()=>{setActiveCoverPhoto(null);if(bgMode==="light")setCustomColourDark(false);else setCustomColourDark(true);}} style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#e74c3c",color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontWeight:700,border:"none"}}>×</div>}
                        <div onClick={()=>{if(window.confirm("Remove this photo from your library? This cannot be undone.")){const next=coverPhotos.filter((_,j)=>j!==i);setCoverPhotos(next);setTemplatePhotos(next);if(activeCoverPhoto===p){setActiveCoverPhoto(next[0]||null);if(!next[0]){if(bgMode==="light")setCustomColourDark(false);else setCustomColourDark(true);}}}}} style={{position:"absolute",bottom:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#333",color:"#fff",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontWeight:700,lineHeight:1}} title="Delete from library">🗑</div>
                      </div>
                    ))}
                    {coverPhotos.length < 10 && (
                      <div onClick={()=>coverPhotoRef.current?.click()} style={{width:56,height:56,borderRadius:8,border:`1.5px dashed ${A.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:A.muted,fontSize:28}}>+</div>
                    )}
                  </div>
                  <input ref={coverPhotoRef} type="file" accept="image/*" onChange={e=>readFile(e,addCoverPhoto)} style={{display:"none"}}/>
                  {isPexelsUser ? (
                    <button onClick={()=>setShowPexelsCover(true)} style={{width:"100%",padding:"9px",background:A.bg,border:`1.5px solid ${A.border}`,borderRadius:8,color:A.text,fontWeight:700,fontSize:12,cursor:"pointer",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                      🔍 Search 1000s of free images
                    </button>
                  ) : (
                    <div title="Upgrade to Pro to search Pexels" style={{width:"100%",padding:"9px",background:A.bg,border:`1.5px dashed ${A.border}`,borderRadius:8,color:A.muted,fontWeight:700,fontSize:12,textAlign:"center",marginBottom:10,cursor:"not-allowed",opacity:0.6}}>
                      🔍 Search Pexels — Pro+ only
                    </div>
                  )}
                  {activeCoverPhoto&&(
                    <div style={{marginBottom:12}}>
                      <label style={{...lbl,fontSize:11,marginBottom:6,display:"block"}}>Photo opacity — {photoOpacity}% <span style={{fontWeight:400,fontSize:9}}>(lower = more faded)</span></label>
                      <input type="range" min={10} max={100} value={photoOpacity} onChange={e=>setPhotoOpacity(+e.target.value)} style={{width:"100%"}}/>
                      <label style={{...lbl,fontSize:11,marginBottom:6,marginTop:10,display:"block"}}>Photo overlay — {overlayDark}% <span style={{fontWeight:400,fontSize:9}}>(higher = darker)</span></label>
                      <input type="range" min={0} max={100} value={overlayDark} onChange={e=>setOverlayDark(+e.target.value)} style={{width:"100%"}}/>
                    </div>
                  )}
                  <div style={{display:"flex",gap:8,marginBottom:14}}>
                    <button onClick={()=>setCustomColourDark(true)} style={{flex:1,padding:"7px",borderRadius:8,border:`1.5px solid ${customColourDark?GOLD:A.border}`,background:customColourDark?A.text:A.bg,color:customColourDark?A.accentText:A.muted,fontWeight:700,fontSize:11,cursor:"pointer"}}>White text</button>
                    <button onClick={()=>setCustomColourDark(false)} style={{flex:1,padding:"7px",borderRadius:8,border:`1.5px solid ${!customColourDark?GOLD:A.border}`,background:!customColourDark?"#fff":A.bg,color:!customColourDark?"#000":A.muted,fontWeight:700,fontSize:11,cursor:"pointer"}}>Dark text</button>
                  </div>
                  {(()=>{
                    const coverSlide = {headline:"Your hook headline goes here",accent_word:"hook",tag:"THE HOOK",body:"",layout:"statement",items:[],vs_label:"VS",icon_symbol:"◆",cta_items:[],cta:null};
                    return (
                      <div style={{marginBottom:14}}>
                        <div style={{borderRadius:10,overflow:"hidden",border:`1.5px solid ${A.border}`}}>
                          <SlidePreview slide={coverSlide} idx={0} total={1} opts={{...slideOpts(0),ratio:"instagram"}} onClick={()=>{}} isActive={false} isCover={true}/>
                        </div>
                        <p style={{color:A.muted,fontSize:11,marginTop:8}}>{activeCoverPhoto?"Select a position below to adjust badge and headline placement.":"No cover photo selected — showing your background defaults as set in the Visual tab."}</p>
                      </div>
                    );
                  })()}
                  <label style={{...lbl,marginTop:4}}>Badge & hook position on cover</label>
                  <div style={{display:"flex",gap:8,marginBottom:14}}>
                    {COVER_POSITIONS.map(p=>(
                      <button key={p.id} onClick={()=>setCoverPosition(p.id)} style={{flex:1,background:coverPosition===p.id?A.text:A.bg,border:`1.5px solid ${coverPosition===p.id?A.text:A.border}`,borderRadius:8,padding:"8px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                        <span style={{fontSize:11,fontWeight:700,color:coverPosition===p.id?A.accentText:A.text}}>{p.label}</span>
                        <span style={{fontSize:10,color:coverPosition===p.id?"rgba(255,255,255,0.6)":A.muted}}>{p.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {nav==="visual"&&(
          <div style={{animation:"fadeUp 0.3s ease",maxWidth:900,margin:"0 auto",width:"100%"}}>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 20px"}}>Visual</h2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:24,alignItems:"start"}} className="visual-grid">
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
                      <div style={{width:36,height:36,borderRadius:"50%",background:sw.hex||(accentSwatch==="custom"?accentColor:"#C9A84C"),border:`3px solid ${accentSwatch===sw.id?A.text:"transparent"}`,boxShadow:accentSwatch===sw.id?`0 0 0 1px ${A.text}`:["#FFFFFF","#F5F3EF","#FAF7F2"].includes(sw.hex)?`inset 0 0 0 1px ${A.border}`:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {sw.id==="custom"&&<span style={{fontSize:14}}>+</span>}
                      </div>
                      <span style={{fontSize:9,fontWeight:600,color:accentSwatch===sw.id?A.text:A.muted,textTransform:"uppercase",letterSpacing:1}}>{sw.label}</span>
                    </button>
                  ))}
                </div>
                <div style={{display:"flex",gap:8,marginTop:8}}>
                    {accentCustomSlots.map((c,i)=>(
                      <div key={i} style={{position:"relative"}}>
                        {/* Filled slot - click to select, X to clear */}
                        {c ? (
                          <>
                            <div onClick={()=>{setAccentColor(c);setAccentSwatch("custom");setCustomActiveSlot(i);}} style={{width:36,height:36,borderRadius:"50%",background:c,border:accentSwatch==="custom"&&customActiveSlot===i?`3px solid ${A.text}`:`2px solid ${A.border}`,cursor:"pointer",boxShadow:c==="#FFFFFF"?`inset 0 0 0 1px ${A.border}`:"none"}}/>
                            <div onClick={()=>{const s=[...accentCustomSlots];s[i]="";setAccentCustomSlots(s);if(customActiveSlot===i){setAccentSwatch("gold");setAccentColor(GOLD);setCustomActiveSlot(null);}}} style={{position:"absolute",top:-4,right:-4,width:14,height:14,borderRadius:"50%",background:"#e74c3c",color:"#fff",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontWeight:900,lineHeight:1}}>×</div>
                          </>
                        ) : (
                          /* Empty slot - click to open colour picker */
                          <>
                            <div style={{width:36,height:36,borderRadius:"50%",background:A.surface,border:`2px dashed ${A.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:A.muted,cursor:"pointer"}}>+</div>
                            <input type="color" defaultValue={accentColor} onChange={e=>{const s=[...accentCustomSlots];s[i]=e.target.value;setAccentCustomSlots(s);setAccentColor(e.target.value);setAccentSwatch("custom");setCustomActiveSlot(i);}} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:0,cursor:"pointer"}}/>
                          </>
                        )}
                      </div>
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
                <label style={lbl}>Body font</label>
                {recentFonts.length>0&&(
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                    {recentFonts.map(id=>{const f=FONTS.find(f=>f.id===id);if(!f)return null;return(
                      <button key={id} onClick={()=>{setFontId(id);trackFont(id);}} style={{background:fontId===id?A.text:A.bg,border:`1.5px solid ${fontId===id?GOLD:A.border}`,borderRadius:20,padding:"4px 12px",cursor:"pointer"}}>
                        <span style={{fontFamily:`"${f.css}",sans-serif`,fontSize:12,fontWeight:700,color:fontId===id?A.accentText:A.muted}}>{f.label}</span>
                      </button>
                    );})}
                  </div>
                )}
                <div style={{position:"relative"}}>
                  <select value={fontId} onChange={e=>{setFontId(e.target.value);trackFont(e.target.value);}} style={{width:"100%",padding:"10px 14px",background:A.bg,border:`1.5px solid ${A.border}`,borderRadius:9,color:A.text,fontSize:14,fontFamily:`"${FONTS.find(f=>f.id===fontId)?.css||"Montserrat"}",sans-serif`,fontWeight:700,appearance:"none",cursor:"pointer",paddingRight:36}}>
                    {FONTS.map(f=>(
                      <option key={f.id} value={f.id} style={{fontFamily:`"${f.css}",sans-serif`,fontWeight:700}}>{f.label}</option>
                    ))}
                  </select>
                  <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:A.muted,fontSize:12}}>▼</div>
                </div>
              </div>

              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20}}>
                <label style={lbl}>Photo opacity — {templateOpacity}%</label>
                <p style={{color:A.muted,fontSize:12,margin:"0 0 10px",lineHeight:1.5}}>How visible the background photo is on slides 2 onwards. Lower = more faded.</p>
                <input type="range" min={10} max={100} value={templateOpacity} onChange={e=>setTemplateOpacity(+e.target.value)} style={{width:"100%",marginBottom:14}}/>
                <label style={lbl}>Photo overlay — {overlayDark}%</label>
                <p style={{color:A.muted,fontSize:12,margin:"0 0 10px",lineHeight:1.5}}>Applies to all slides. Can be adjusted per-slide in the edit panel after generation.</p>
                <input type="range" min={0} max={100} value={overlayDark} onChange={e=>setOverlayDark(+e.target.value)} style={{width:"100%"}}/>
              </div>
              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div><div style={{fontWeight:600,fontSize:13}}>Slide numbers</div><div style={{color:A.muted,fontSize:12}}>Watermark number on each slide</div></div>
                {tog(showNums,setShowNums)}
              </div>

              </div>

              {/* Right column — slide background (IS the preview) */}
              <div style={{position:"sticky",top:80}}>
                <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:20}}>
                  <label style={lbl}>Slide background (slides 2 onwards)</label>
                  <div style={{display:"flex",gap:8,marginBottom:bgMode==="custom"?14:8}}>
                    {BG_MODES.map(m=>(
                      <button key={m.id} onClick={()=>{setBgMode(m.id);if(m.id==="dark")setCustomColourDark(true);if(m.id==="light")setCustomColourDark(false);}} style={{flex:1,background:bgMode===m.id?A.text:A.bg,border:`1.5px solid ${bgMode===m.id?A.text:A.border}`,borderRadius:8,padding:"10px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                        <span style={{fontSize:12,fontWeight:700,color:bgMode===m.id?A.accentText:A.text}}>{m.label}</span>
                        <span style={{fontSize:10,color:bgMode===m.id?"rgba(255,255,255,0.6)":A.muted}}>{m.desc}</span>
                      </button>
                    ))}
                  </div>
                  {bgMode==="colour"&&(
                    <div style={{marginTop:12}}>
                      <label style={lbl}>Pick a colour</label>
                      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10}}>
                        {BG_COLOUR_PRESETS.map(p=>(
                          <button key={p.id} onClick={()=>{setBgColour(p.hex);setBgMode("colour");}} title={p.label} style={{width:32,height:32,borderRadius:"50%",background:p.hex,border:bgColour===p.hex?`3px solid ${A.text}`:`2px solid ${A.border}`,cursor:"pointer",flexShrink:0,boxShadow:["#F5F3EF","#FAF7F2","#FFFFFF"].includes(p.hex)?`inset 0 0 0 1px ${A.border}`:"none"}}/>
                        ))}
                        {bgCustomSlots.map((c,i)=>(
                          <div key={i} style={{position:"relative"}}>
                            {c ? (
                              <>
                                <div onClick={()=>{setBgColour(c);setBgMode("colour");}} style={{width:32,height:32,borderRadius:"50%",background:c,border:bgColour===c?`3px solid ${A.text}`:`2px solid ${A.border}`,cursor:"pointer",boxShadow:["#FFFFFF","#F5F3EF","#FAF7F2"].includes(c)?`inset 0 0 0 1px ${A.border}`:"none"}}/>
                                <div onClick={()=>{const s=[...bgCustomSlots];s[i]="";setBgCustomSlots(s);if(bgColour===c)setBgColour("#0A0A0A");}} style={{position:"absolute",top:-4,right:-4,width:14,height:14,borderRadius:"50%",background:"#e74c3c",color:"#fff",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontWeight:900,lineHeight:1}}>×</div>
                              </>
                            ) : (
                              <>
                                <div style={{width:32,height:32,borderRadius:"50%",background:A.surface,border:`2px dashed ${A.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:A.muted,cursor:"pointer"}}>+</div>
                                <input type="color" defaultValue={bgColour} onChange={e=>{const s=[...bgCustomSlots];s[i]=e.target.value;setBgCustomSlots(s);setBgColour(e.target.value);}} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:0,cursor:"pointer"}}/>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:10,alignItems:"center"}}>
                        <input type="color" value={bgColour} onChange={e=>setBgColour(e.target.value)} style={{width:40,height:40,borderRadius:8,border:`1px solid ${A.border}`,cursor:"pointer",padding:2}}/>
                        <input value={bgColour} onChange={e=>setBgColour(e.target.value)} placeholder="#1a1a2e" style={{...inp,flex:1,fontSize:13}}/>
                      </div>

                    </div>
                  )}
                  {bgMode==="custom"&&(
                    <div>
                      {templatePhotos.length > 0 ? (
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                          {templatePhotos.map((photo,i)=>(
                            <div key={i} style={{position:"relative",flexShrink:0}}>
                              <div onClick={()=>{if(templateBgUrl===photo){setTemplateBgUrl(null);setSlideTextDark(false);}else setTemplateBgUrl(photo);}} style={{width:56,height:56,borderRadius:8,overflow:"hidden",border:templateBgUrl===photo?`2.5px solid ${GOLD}`:`2px solid ${A.border}`,cursor:"pointer"}}>
                                <img src={photo} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                              </div>
                              {templateBgUrl===photo&&<div onClick={()=>{setTemplateBgUrl(null);setSlideTextDark(false);}} style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#e74c3c",color:"#fff",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontWeight:700,border:"none"}}>×</div>}
                              <div onClick={()=>{if(window.confirm("Remove this image from your library? This cannot be undone.")){removeFromSharedLibrary(photo);}}} style={{position:"absolute",bottom:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#333",color:"#fff",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontWeight:700,lineHeight:1}} title="Delete from library">🗑</div>
                            </div>
                          ))}
                          {templatePhotos.length < 10 && (
                            <div onClick={()=>templateBgRef.current?.click()} style={{width:56,height:56,borderRadius:8,border:`2px dashed ${A.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:A.muted,fontSize:22,flexShrink:0}}>+</div>
                          )}
                        </div>
                      ) : (
                        <div onClick={()=>templateBgRef.current?.click()} style={{background:A.bg,border:`1.5px dashed ${A.border}`,borderRadius:9,padding:"12px",cursor:"pointer",textAlign:"center",marginBottom:8}}>
                          <span style={{fontSize:12,fontWeight:600,color:A.muted}}>Upload and save up to 10 custom images</span>
                        </div>
                      )}
                      <p style={{color:A.muted,fontSize:11,margin:"0 0 8px",lineHeight:1.6}}>Safe zone: keep important elements within 80px from each edge. Recommended size: 1080×1350px.</p>
                      {isPexelsUser ? (
                        <button onClick={()=>setShowPexelsTemplate(true)} style={{width:"100%",padding:"9px",background:A.bg,border:`1.5px solid ${A.border}`,borderRadius:8,color:A.text,fontWeight:700,fontSize:12,cursor:"pointer",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                          🔍 Search 1000s of free backgrounds
                        </button>
                      ) : (
                        <div title="Upgrade to Pro to search Pexels" style={{width:"100%",padding:"9px",background:A.bg,border:`1.5px dashed ${A.border}`,borderRadius:8,color:A.muted,fontWeight:700,fontSize:12,textAlign:"center",marginBottom:10,cursor:"not-allowed",opacity:0.6}}>
                          🔍 Search 1000s of free backgrounds — Pro+
                        </div>
                      )}
                      <input ref={templateBgRef} type="file" accept="image/*" onChange={async e=>{
                      const file = e.target.files[0]; if(!file) return;
                      const reader = new FileReader();
                      reader.onload = async ev => {
                        const base64 = ev.target.result;
                        setTemplateBgUrl(base64);
                        try {
                          const res = await fetch('/api/upload-photo', {
                            method:'POST',
                            headers:{'Content-Type':'application/json'},
                            body: JSON.stringify({ imageData: base64, filename: `template-${Date.now()}.jpg` })
                          });
                          const data = await res.json();
                          if (data.url) {
                            setTemplateBgUrl(data.url);
                            const next = [data.url, ...coverPhotos.filter(p=>p!==data.url)].slice(0,10);
                            setCoverPhotos(next);
                            setTemplatePhotos(next);
                          }
                        } catch(err) { console.error('Template upload failed:', err); }
                      };
                      reader.readAsDataURL(file);
                    }} style={{display:"none"}}/>
                    </div>
                  )}
                  <div style={{padding:8,background:A.bg,borderRadius:12,border:`1.5px solid ${A.border}`,marginTop:16}}><div style={{borderRadius:8,overflow:"hidden"}}>
                    <SlidePreview slide={{headline:"Your headline goes here",accent_word:"headline",tag:"SLIDE TITLE",body:"Supporting text appears here.",layout:"standard",items:[],vs_label:"VS",icon_symbol:"◆",cta_items:[],cta:null}} idx={1} total={6} opts={slideOpts(1)} onClick={()=>{}} isActive={false} isCover={false}/>
                  </div></div>
                  <p style={{color:A.muted,fontSize:11,marginTop:8}}>{bgMode==="custom"&&templateBgUrl?"Image selected — use White/Dark text to match.":bgMode==="custom"?"No image selected — showing background defaults.":`Preview reflects your ${bgMode} background setting.`}</p>
                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    <button onClick={()=>setSlideTextDark(true)} style={{flex:1,padding:"8px",borderRadius:8,border:`1.5px solid ${slideTextDark?GOLD:A.border}`,background:slideTextDark?A.text:A.bg,color:slideTextDark?A.accentText:A.muted,fontWeight:700,fontSize:12,cursor:"pointer"}}>White text</button>
                    <button onClick={()=>setSlideTextDark(false)} style={{flex:1,padding:"8px",borderRadius:8,border:`1.5px solid ${!slideTextDark?GOLD:A.border}`,background:!slideTextDark?"#fff":A.bg,color:!slideTextDark?"#000":A.muted,fontWeight:700,fontSize:12,cursor:"pointer"}}>Dark text</button>
                  </div>
                </div>
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
              {[["instagram","Instagram · LinkedIn · TikTok Photos"],["portrait","Stories · Reels · TikTok Video"]].map(([id,label])=>(
                <button key={id} onClick={()=>setRatio(id)} style={{background:ratio===id?A.text:A.surface,border:`1.5px solid ${ratio===id?A.text:A.border}`,color:ratio===id?A.accentText:A.muted,padding:"5px 14px",borderRadius:7,fontSize:12,fontWeight:700}}>{label}</button>
              ))}
              <button onClick={()=>{setSlides([]);setView("setup");setActive(0);setDownloadDone(false);}} style={{marginLeft:"auto",padding:"5px 14px",borderRadius:7,border:`1.5px solid ${A.border}`,background:A.surface,color:A.text,fontSize:12,fontWeight:700,cursor:"pointer"}}>+ New</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:28,alignItems:"start"}}>
              <div style={{paddingBottom:140}}>
                <button onClick={()=>setEditDrawerOpen(true)} className="mobile-edit-btn" style={{display:"none",width:"100%",padding:"12px",background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:10,fontSize:14,fontWeight:700,color:A.text,cursor:"pointer",marginBottom:8,textAlign:"center"}}>Edit Slide {active+1}</button>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
                  {slides.map((slide,i)=>(
                    <div key={i} data-slide-index={i}>
                    <SlidePreview slide={slide} idx={i} total={slides.length} opts={slideOpts(i)} onClick={()=>setActive(i)} isActive={active===i} isCover={i===0} showWatermark={currentUser?.plan==="free"}/>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>downloadOne(active)} disabled={downloading} style={{flex:1,background:A.surface,border:`1.5px solid ${A.border}`,color:A.text,padding:"10px",borderRadius:9,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    {downloading?<><Spin c={A.text}/>Processing...</>:downloadDone?"✓ Downloaded":`↓ Slide ${active+1}`}
                  </button>
                  <button onClick={downloadAll} disabled={downloadingAll} style={{flex:2,background:`linear-gradient(135deg,#1a1a1a,#0a0a0a)`,color:A.accentText,padding:"10px",borderRadius:9,fontSize:13,fontWeight:800,border:`1px solid ${GOLD}33`,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {downloadingAll?<><Spin/>Downloading...</>:downloadDone?"✓ All Downloaded":`↓ Download All ${slides.length} (zip)`}
                  </button>
                </div>
                <button onClick={()=>{
                  const entry={id:Date.now(),brief,audience:audienceType,slides:slides.map(s=>({...s})),createdAt:new Date().toISOString(),savedManually:true};
                  const existing=JSON.parse(localStorage.getItem("bwt_v12")||"{}");
                  const hist=existing.history||[];
                  hist.unshift(entry);
                  if(hist.length>20)hist.pop();
                  localStorage.setItem("bwt_v12",JSON.stringify({...existing,history:hist}));
                  alert("✓ Saved to History");
                }} style={{width:"100%",padding:"10px",background:"none",border:`1px solid ${A.border}`,color:A.muted,borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",textAlign:"center"}}>
                  💾 Save this version to History
                </button>
                <button onClick={()=>setEditDrawerOpen(true)} className="mobile-edit-btn" style={{display:"none",width:"100%",padding:"12px",background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:10,fontWeight:700,fontSize:14,color:A.text,cursor:"pointer",marginTop:8,textAlign:"center"}}>Edit Slide {active+1}</button>
                <button onClick={generateCaption} disabled={generatingCaption} className="mobile-edit-btn" style={{display:"none",width:"100%",padding:"12px",background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:10,fontWeight:700,fontSize:14,color:A.text,cursor:"pointer",marginTop:8,textAlign:"center"}}>
                  {generatingCaption?"Writing caption...":"Generate Caption"}
                </button>
                {showCaption&&caption&&(
                  <div className="mobile-edit-btn" style={{display:"none",marginTop:8,background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:10,padding:16,flexDirection:"column"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                      <label style={{...lbl,marginBottom:0}}>Caption</label>
                      <button onClick={()=>{navigator.clipboard.writeText(caption);setCaptionCopied(true);setTimeout(()=>setCaptionCopied(false),2000);}} style={{background:captionCopied?"#27ae60":A.text,color:A.accentText,border:"none",borderRadius:7,padding:"6px 16px",fontSize:12,fontWeight:700,cursor:"pointer",transition:"background 0.2s"}}>{captionCopied?"✓ Copied":"Copy"}</button>
                    </div>
                    <p style={{fontSize:14,lineHeight:1.7,color:A.text,whiteSpace:"pre-wrap",margin:0,width:"100%"}}>{caption}</p>
                  </div>
                )}
              </div>

              <div className="desktop-edit-panel" style={{display:"flex",flexDirection:"column",gap:12}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:A.muted}}>Edit Slide {active+1}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {slides.map((s,i)=>(
                    <button key={i} onClick={()=>setActive(i)} title={s.tag||`Slide ${i+1}`} style={{width:27,height:27,borderRadius:6,background:active===i?A.text:A.surface,border:`1.5px solid ${active===i?GOLD:A.border}`,color:active===i?A.accentText:A.muted,fontSize:12,fontWeight:700}}>{i+1}</button>
                  ))}
                </div>
                <div style={{background:A.surface,borderRadius:12,border:`1.5px solid ${A.border}`,padding:18,display:"flex",flexDirection:"column",gap:13}}>
                  <div style={{background:A.bg,borderRadius:9,border:`1.5px solid ${A.border}`,padding:"12px 14px",marginBottom:4}}>
                    <label style={{...lbl,marginBottom:8}}>Photo overlay — {overlayDark}%</label>
                    <input type="range" min={0} max={100} value={overlayDark} onChange={e=>setOverlayDark(+e.target.value)} style={{width:"100%"}}/>
                  </div>
                  <div><label style={lbl}>Slide Title</label><input value={slides[active]?.tag||""} onChange={e=>updateSlide("tag",e.target.value)} style={{...inp,fontSize:16}}/></div>
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

                </div>
                <div style={{background:A.surface,borderRadius:12,border:`1.5px solid ${A.border}`,padding:18}}>
                  <label style={lbl}>Caption Generator</label>
                  <p style={{color:A.muted,fontSize:12,margin:"0 0 10px",lineHeight:1.5}}>Ready-to-post caption based on your carousel.</p>
                  <button onClick={generateCaption} disabled={generatingCaption} style={{width:"100%",background:generatingCaption?A.border:A.surface,border:`1.5px solid ${A.border}`,color:A.text,padding:"9px",borderRadius:8,fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10,cursor:"pointer"}}>
                    {generatingCaption?"Writing...":"Generate Caption"}
                  </button>
                  {showCaption&&caption&&(
                    <div style={{background:A.bg,borderRadius:8,padding:12,marginBottom:10}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                        <label style={{...lbl,marginBottom:0}}>Caption</label>
                        <button onClick={()=>{navigator.clipboard.writeText(caption);setCaptionCopied(true);setTimeout(()=>setCaptionCopied(false),2000);}} style={{background:captionCopied?"#27ae60":A.text,color:A.accentText,border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700,cursor:"pointer",transition:"background 0.2s"}}>{captionCopied?"✓ Copied":"Copy"}</button>
                      </div>
                      <p style={{fontSize:12,lineHeight:1.7,color:A.text,whiteSpace:"pre-wrap",margin:0}}>{caption}</p>
                    </div>
                  )}
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


        {nav==="help"&&(
          <div style={{animation:"fadeUp 0.3s ease",maxWidth:960,margin:"0 auto"}}>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 20px"}}>Help & Support</h2>

            {/* LIVE UPDATES — full width */}
            <div style={{background:A.surface,border:`1.5px solid ${GOLD}44`,borderRadius:12,padding:24,marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <label style={{...lbl,color:GOLD,marginBottom:0}}>⚡ Updates</label>
                <button onClick={()=>setShowAllUpdates(v=>!v)} style={{background:"none",border:"none",color:GOLD,fontSize:12,fontWeight:700,cursor:"pointer"}}>{showAllUpdates?"Show less":"View all"}</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {[
                  { date:"13 Jun 2026", tag:"Coming Soon", msg:"Auto-posting to Instagram is in development. Generate your carousel and post directly from Carousel Studio — no downloading, no uploading. Coming soon." },
                  { date:"13 Jun 2026", tag:"Update", msg:"Tier 2 affiliate commission increased from 8% to 15%. Every referral your network makes now earns you 15% — automatically, every month." },
                  { date:"09 Jun 2026", tag:"Update", msg:"Brand settings currently save to this device only. Cross-device sync is coming soon." },
                  { date:"09 Jun 2026", tag:"New", msg:"Monetisation live — Free, Starter ($20), Pro ($50) and Agency ($100) plans now available. Affiliate Licence ($297) and White Label ($497) also available." },
                  { date:"08 Jun 2026", tag:"New", msg:"OTP email login added. Sign in with your email and a 6 digit code — no password needed." },
                  { date:"07 Jun 2026", tag:"Fix", msg:"Safari download issue resolved. Downloads now work across all browsers." },
                  { date:"06 Jun 2026", tag:"New", msg:"Caption generator added — write ready-to-post captions in your voice with hashtags." },
                ].filter((_,i)=>showAllUpdates||i<3).map((u,i,arr)=>(
                  <div key={i} style={{borderBottom:i<arr.length-1?`1px solid ${A.border}`:"none",paddingBottom:i<arr.length-1?12:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",background:u.tag==="New"?GOLD:u.tag==="Fix"?"#2ecc71":u.tag==="Coming Soon"?"#6644cc":A.border,color:u.tag==="New"?"#000":u.tag==="Fix"?"#000":u.tag==="Coming Soon"?"#fff":A.muted,borderRadius:4}}>{u.tag}</span>
                      <span style={{fontSize:11,color:A.muted}}>{u.date}</span>
                    </div>
                    <p style={{fontSize:13,color:A.text,margin:0,lineHeight:1.6}}>{u.msg}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* TWO COLUMN LAYOUT */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}} className="help-grid">
              <style>{`.help-grid { @media (max-width: 768px) { grid-template-columns: 1fr !important; } }`}</style>

              {/* LEFT COLUMN */}
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:24}}>
                  <p style={{fontSize:14,lineHeight:1.8,color:A.text,margin:"0 0 12px"}}>
                    Carousel Studio was built to make quality content creation faster and more consistent.
                  </p>
                  <p style={{fontSize:14,fontWeight:700,color:A.text,margin:0}}>— Tav</p>
                </div>

                <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:24}}>
                  <label style={lbl}>Find me here</label>
                  <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
                    {[
                      ["Website","www.buildwithtav.co","https://www.buildwithtav.co"],
                      ["Instagram","@buildwithtav","https://www.instagram.com/buildwithtav"],
                      ["TikTok","@buildwithtav","https://www.tiktok.com/@buildwithtav"],
                      ["YouTube","@buildwithtav","https://www.youtube.com/@buildwithtav"],
                    ].map(([platform,handle,url])=>(
                      <a key={platform} href={url} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:A.bg,borderRadius:9,border:`1.5px solid ${A.border}`,textDecoration:"none"}}>
                        <span style={{fontWeight:700,fontSize:13,color:A.text}}>{platform}</span>
                        <span style={{color:GOLD,fontSize:12,fontWeight:700}}>{handle}</span>
                      </a>
                    ))}
                    <a href="mailto:tav@buildwithtav.co" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:A.bg,borderRadius:9,border:`1.5px solid ${A.border}`,textDecoration:"none"}}>
                      <span style={{fontWeight:700,fontSize:13,color:A.text}}>Email</span>
                      <span style={{color:GOLD,fontSize:12,fontWeight:700}}>tav@buildwithtav.co</span>
                    </a>
                  </div>
                </div>

                <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:24}}>
                  <label style={lbl}>Get in touch</label>
                  <p style={{fontSize:13,color:A.muted,margin:"8px 0 16px",lineHeight:1.6}}>Leave a review, report a bug, or suggest a feature. I read everything.</p>
                  <ContactForm A={A} inp={inp} GOLD={GOLD} userEmail={currentUser?.email}/>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:24}}>
                  <label style={lbl}>What people are saying</label>
                  <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:10}}>
                    {[
                      ["Sarah M.","Saves me at least 2 hours per carousel. The content quality is genuinely better than what I was writing myself.",5],
                      ["James K.","Finally a tool that understands what actually works on Instagram. Generated 6 slides in under a minute that I actually posted.",5],
                      ["Priya D.","The variety in topics and styles keeps surprising me. Nothing I've generated has felt generic.",4],
                    ].map(([name,comment,stars])=>(
                      <div key={name} style={{background:A.bg,border:`1.5px solid ${A.border}`,borderRadius:10,padding:"14px 16px"}}>
                        <div style={{color:GOLD,fontSize:14,marginBottom:4}}>{"★".repeat(stars)+"☆".repeat(5-stars)}</div>
                        <p style={{fontSize:13,lineHeight:1.6,color:A.text,margin:"0 0 6px"}}>"{comment}"</p>
                        <span style={{fontSize:11,fontWeight:700,color:A.muted}}>— {name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Credits breakdown */}
                <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:12,padding:24}}>
                  <label style={lbl}>How credits work</label>
                  <p style={{fontSize:12,color:A.muted,margin:"6px 0 12px",lineHeight:1.6}}>Credits are consumed per action. Photo uploads are always free.</p>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {[
                      ["Carousel generation","10 credits"],
                      ["Quote card batch","10 credits"],
                      ["AI caption","5 credits"],
                      ["AI rewrite","5 credits"],
                      ["Download","5 credits"],
                      ["Photo upload","Free"],
                    ].map(([action,cost])=>(
                      <div key={action} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${A.border}`}}>
                        <span style={{fontSize:12,color:A.text}}>{action}</span>
                        <span style={{fontSize:12,fontWeight:700,color:cost==="Free"?"#4caf50":GOLD}}>{cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UPGRADE TAB */}
        {/* ACCOUNT TAB */}
        {nav==="account"&&(
          <div className="account-view" style={{animation:"fadeUp 0.3s ease",maxWidth:900,margin:"0 auto",width:"100%"}}>
            <div style={{marginBottom:28}}>
              <h2 style={{fontSize:24,fontWeight:800,margin:"0 0 6px"}}>Account</h2>
              <p style={{color:A.muted,fontSize:14,margin:0}}>{currentUser?.email}</p>
            </div>

            {/* Current plan summary */}
            <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:14,padding:20,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:11,color:A.muted,marginBottom:4}}>Current plan</div>
                <div style={{fontSize:20,fontWeight:800,color:GOLD,textTransform:"capitalize"}}>{currentUser?.plan==="affiliate_licence"?"Affiliate Licence":currentUser?.plan==="white_label"?"White Label":currentUser?.plan}</div>
                <div style={{fontSize:13,color:A.muted,marginTop:2}}>{currentUser?.plan==="free"?`${creditsRemaining()} trial credits remaining`:`${creditsRemaining()} credits remaining this month`}</div>
              </div>
              {planLabel!=="affiliate_licence"&&planLabel!=="white_label"&&(
                <button onClick={()=>setNav("upgrade")} style={{background:GOLD,color:"#000",padding:"10px 20px",borderRadius:9,fontWeight:700,fontSize:13,border:"none",cursor:"pointer"}}>Upgrade →</button>
              )}
            </div>
            {planLabel!=="free"&&(
            <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:14,padding:24,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                <label style={lbl}>Affiliate Programme</label>
                {currentUser?.affiliate_active&&<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",background:"#1a3a1a",color:"#4caf50",borderRadius:10}}>ACTIVE</span>}
              </div>
              {planLabel!=="free"&&!affiliateStats&&(
                <div>
                  <p style={{fontSize:13,color:A.muted,margin:"8px 0 16px",lineHeight:1.6}}>Share your unique link and earn {planLabel==="starter"?"20%":planLabel==="pro"?"30%":planLabel==="agency"?"40%":planLabel==="white_label"?"40%":"35%"} recurring commission on every subscriber you refer. Plus 8% on everything your referrals generate.</p>
                  <button onClick={loadAffiliateStats} style={{width:"100%",padding:"12px",background:GOLD,color:"#000",borderRadius:10,fontWeight:700,fontSize:14,border:"none"}}>
                    {affiliateLoading?"Loading...":"View My Affiliate Dashboard"}
                  </button>
                </div>
              )}
              {affiliateStats?.active&&(
                <div>
                  <div style={{background:A.bg,border:`1px solid ${GOLD}44`,borderRadius:10,padding:12,marginBottom:16}}>
                    <div style={{fontSize:11,color:A.muted,marginBottom:6}}>Your affiliate link</div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{fontSize:12,color:A.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {"https://studio.buildwithtav.co/landing?sa="+affiliateStats.affiliate_id}
                      </div>
                      <button onClick={()=>{try{navigator.clipboard.writeText("https://studio.buildwithtav.co/landing?sa="+affiliateStats.affiliate_id);setAffiliateLinkCopied(true);setTimeout(()=>setAffiliateLinkCopied(false),2000);}catch{}}} style={{padding:"6px 12px",background:affiliateLinkCopied?"#27ae60":GOLD,color:affiliateLinkCopied?"#fff":"#000",borderRadius:6,fontWeight:700,fontSize:11,border:"none",flexShrink:0,transition:"background 0.2s"}}>{affiliateLinkCopied?"✓ Copied":"Copy"}</button>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                    {[["Total earned","$"+affiliateStats.total],["Pending (30d hold)","$"+affiliateStats.pending],["Available","$"+affiliateStats.available],["Paid out","$"+affiliateStats.paid]].map(([label,val])=>(
                      <div key={label} style={{background:A.bg,border:`1px solid ${A.border}`,borderRadius:10,padding:12,textAlign:"center"}}>
                        <div style={{fontSize:18,fontWeight:800,color:label==="Available"?GOLD:A.text}}>{val}</div>
                        <div style={{fontSize:11,color:A.muted,marginTop:2}}>{label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                    <div style={{background:A.bg,border:`1px solid ${A.border}`,borderRadius:10,padding:12,textAlign:"center"}}>
                      <div style={{fontSize:18,fontWeight:800,color:A.text}}>{affiliateStats.referral_count}</div>
                      <div style={{fontSize:11,color:A.muted,marginTop:2}}>Total referrals</div>
                    </div>
                    <div style={{background:A.bg,border:`1px solid ${A.border}`,borderRadius:10,padding:12,textAlign:"center"}}>
                      <div style={{fontSize:18,fontWeight:800,color:GOLD}}>{affiliateStats.tier2_count||0}</div>
                      <div style={{fontSize:11,color:A.muted,marginTop:2}}>Tier 2 payments</div>
                    </div>
                  </div>
                  {!showPayoutForm&&!payoutSuccess&&(
                    <button onClick={()=>setShowPayoutForm(true)} disabled={parseFloat(affiliateStats.available)<30} style={{width:"100%",padding:"12px",background:parseFloat(affiliateStats.available)>=30?GOLD:"#333",color:parseFloat(affiliateStats.available)>=30?"#000":A.muted,borderRadius:10,fontWeight:700,fontSize:14,border:"none",cursor:parseFloat(affiliateStats.available)>=30?"pointer":"default"}}>
                      {parseFloat(affiliateStats.available)<30?"Minimum $30 to withdraw":"Withdraw Available Funds"}
                    </button>
                  )}
                  {payoutSuccess&&(
                    <div style={{background:"#1a3a1a",border:"1px solid #4caf50",borderRadius:10,padding:14,textAlign:"center"}}>
                      <div style={{color:"#4caf50",fontWeight:700,fontSize:14}}>Withdrawal requested ✓</div>
                      <div style={{color:A.muted,fontSize:12,marginTop:4}}>We'll process your payment within 5 business days.</div>
                    </div>
                  )}
                  {showPayoutForm&&(
                    <div style={{background:A.bg,border:`1px solid ${A.border}`,borderRadius:10,padding:16}}>
                      <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Withdrawal — ${affiliateStats.available}</div>
                      <div style={{display:"flex",gap:8,marginBottom:12}}>
                        {["bank","paypal"].map(m=>(
                          <button key={m} onClick={()=>setPayoutMethod(m)} style={{flex:1,padding:"8px",background:payoutMethod===m?GOLD:"transparent",color:payoutMethod===m?"#000":A.muted,borderRadius:8,fontWeight:700,fontSize:12,border:`1px solid ${payoutMethod===m?GOLD:A.border}`}}>
                            {m==="bank"?"Bank Transfer":"PayPal"}
                          </button>
                        ))}
                      </div>
                      {payoutMethod==="bank"&&(
                        <>
                          {[["accountName","Account name"],["accountNumber","Account number"],["sortCode","Sort code (UK) / IBAN (International)"],["bankName","Bank name"]].map(([key,label])=>(
                            <div key={key} style={{marginBottom:10}}>
                              <div style={{fontSize:11,color:A.muted,marginBottom:4}}>{label}</div>
                              <input value={payoutDetails[key]||""} onChange={e=>setPayoutDetails(p=>({...p,[key]:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:A.surface,border:`1px solid ${A.border}`,borderRadius:8,color:A.text,fontSize:13,boxSizing:"border-box"}} placeholder={label}/>
                            </div>
                          ))}
                        </>
                      )}
                      {payoutMethod==="paypal"&&(
                        <div style={{marginBottom:10}}>
                          <div style={{fontSize:11,color:A.muted,marginBottom:4}}>PayPal email</div>
                          <input value={payoutDetails.paypalEmail||""} onChange={e=>setPayoutDetails(p=>({...p,paypalEmail:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:A.surface,border:`1px solid ${A.border}`,borderRadius:8,color:A.text,fontSize:13,boxSizing:"border-box"}} placeholder="PayPal email address"/>
                        </div>
                      )}
                      <p style={{fontSize:11,color:A.muted,margin:"8px 0 12px",lineHeight:1.5}}>I confirm these details are correct. Incorrect details are my responsibility.</p>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>setShowPayoutForm(false)} style={{flex:1,padding:"10px",background:"none",border:`1px solid ${A.border}`,color:A.muted,borderRadius:8,fontWeight:600,fontSize:13}}>Cancel</button>
                        <button onClick={submitPayoutRequest} disabled={payoutSubmitting} style={{flex:2,padding:"10px",background:GOLD,color:"#000",borderRadius:8,fontWeight:700,fontSize:13,border:"none"}}>
                          {payoutSubmitting?"Submitting...":"Confirm Withdrawal"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {affiliateStats&&!affiliateStats.active&&(
                <p style={{fontSize:13,color:A.muted,margin:"8px 0",lineHeight:1.6}}>Your affiliate account is not yet active. Upgrade to a paid plan to activate it.</p>
              )}
            </div>
            )}

            {/* Free user — show upgrade options */}

            {/* Licence holders — manage only */}
            {(planLabel==="affiliate_licence"||planLabel==="white_label")&&(
              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:14,padding:24,marginBottom:16}}>
                <label style={lbl}>Lifetime Licence</label>
                <p style={{fontSize:13,color:A.muted,margin:"8px 0 16px",lineHeight:1.6}}>You have lifetime access. No subscription needed. Your credits reset monthly.</p>
              </div>
            )}

            {/* Free user — affiliate info */}
            {planLabel==="free"&&(
              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:14,padding:24,marginBottom:16}}>
                <label style={lbl}>Affiliate Programme</label>
                <p style={{fontSize:13,color:A.muted,margin:"8px 0 12px",lineHeight:1.6}}>Upgrade to any paid plan to unlock your affiliate link and start earning recurring commission.</p>
                <div style={{background:A.bg,border:`1px solid ${A.border}`,borderRadius:10,padding:16}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Commission rates:</div>
                  {[["Starter","20% + 15% Tier 2"],["Pro","30% + 15% Tier 2"],["Agency","40% + 15% Tier 2"],["Affiliate Licence","35% + 15% Tier 2 · lifetime"],["White Label","40% + 15% Tier 2 · lifetime"]].map(([plan,rate])=>(
                    <div key={plan} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:A.muted,marginBottom:4}}>
                      <span>{plan}</span><span style={{color:GOLD,fontWeight:700}}>{rate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top-ups for paid plans */}
            {planLabel!=="free"&&(
              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:14,padding:24,marginBottom:16}}>
                <label style={lbl}>Need more credits this month?</label>
                <p style={{fontSize:13,color:A.muted,margin:"8px 0 16px",lineHeight:1.6}}>One-time top-ups. Never expire.</p>
                <div style={{display:"flex",gap:10}} className="topup-row">
                  <button className="topup-btn" onClick={()=>handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_TOPUP_PRICE_ID,"payment")} style={{flex:1,padding:"12px",background:A.bg,border:`1.5px solid ${A.border}`,borderRadius:10,fontWeight:700,fontSize:13,color:A.text,cursor:"pointer",textAlign:"center"}}><div style={{fontSize:16,fontWeight:800,marginBottom:2}}>150 credits</div><div style={{fontSize:12}}>$25 one-time</div></button>
                  <button className="topup-btn" onClick={()=>handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_BOOST_PRICE_ID,"payment")} style={{flex:1,padding:"12px",background:A.bg,border:`1.5px solid ${A.border}`,borderRadius:10,fontWeight:700,fontSize:13,color:A.text,cursor:"pointer",textAlign:"center",position:"relative"}}><div style={{position:"absolute",top:-8,right:8,fontSize:9,fontWeight:700,padding:"2px 6px",background:GOLD,color:"#000",borderRadius:4}}>Best value</div><div style={{fontSize:16,fontWeight:800,marginBottom:2}}>300 credits</div><div style={{fontSize:12}}>$45 one-time</div></button>
                </div>
              </div>
            )}

            {/* Manage subscription */}
            {planLabel!=="free"&&planLabel!=="affiliate_licence"&&planLabel!=="white_label"&&(
              <div style={{background:A.surface,border:`1.5px solid ${A.border}`,borderRadius:14,padding:24,marginBottom:16}}>
                <label style={lbl}>Manage subscription</label>
                <p style={{fontSize:13,color:A.muted,margin:"8px 0 16px",lineHeight:1.6}}>Update payment method, download invoices, or cancel.</p>
                <a href={process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL} target="_blank" rel="noopener noreferrer" style={{display:"block",textAlign:"center",padding:"13px",background:A.text,color:A.accentText,borderRadius:10,fontWeight:700,fontSize:14,textDecoration:"none"}}>Manage Subscription</a>
              </div>
            )}

            <p style={{fontSize:11,color:A.muted,textAlign:"center",margin:"0 0 16px",lineHeight:1.6}}>Secure payment via Stripe. Questions? <a href="mailto:tav@buildwithtav.co" style={{color:GOLD,textDecoration:"none"}}>tav@buildwithtav.co</a> · <a href="/terms" target="_blank" style={{color:GOLD,textDecoration:"none"}}>Terms</a> · <a href="/privacy" target="_blank" style={{color:GOLD,textDecoration:"none"}}>Privacy</a></p>
            {currentUser?.is_admin&&(
              <a href="/admin" target="_blank" rel="noopener noreferrer" style={{display:"block",textAlign:"center",padding:"11px",background:"#1a0a00",border:`1.5px solid ${GOLD}`,color:GOLD,borderRadius:10,fontWeight:700,fontSize:13,textDecoration:"none",marginBottom:10}}>
                Admin Panel →
              </a>
            )}
            <button onClick={logout} style={{width:"100%",padding:"13px",background:"none",border:`1.5px solid ${A.border}`,color:A.muted,borderRadius:10,fontWeight:600,fontSize:14}}>
              Sign out
            </button>
          </div>
        )}

      {/* Mobile edit drawer */}
      {editDrawerOpen&&slides[active]&&(
        <>

        <div className="mobile-drawer" style={{display:"none",position:"fixed",bottom:0,left:0,right:0,zIndex:1001,background:A.bg,borderTop:`2px solid ${A.border}`,borderRadius:"20px 20px 0 0"}}>
          <div style={{display:"flex",flexDirection:"column",maxHeight:"70svh"}}>
          {/* Fixed header with preview - does not scroll */}
          <div style={{flexShrink:0,padding:"12px 16px 0",borderRadius:"20px 20px 0 0",background:A.bg}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontWeight:800,fontSize:16}}>Edit Slide {active+1}</div>
              <button onClick={()=>setEditDrawerOpen(false)} style={{background:"none",border:"none",fontSize:22,color:A.muted,cursor:"pointer"}}>✕</button>
            </div>
            {/* Slide number buttons */}
            <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
            {slides.map((_,i)=>(
              <button key={i} onClick={()=>{setActive(i);setTimeout(()=>{const el=document.querySelector(`[data-slide-index='${i}']`);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});},100);}} style={{width:36,height:36,borderRadius:8,background:active===i?A.text:A.surface,border:`1.5px solid ${active===i?GOLD:A.border}`,color:active===i?A.accentText:A.muted,fontSize:13,fontWeight:700,cursor:"pointer"}}>{i+1}</button>
            ))}
            </div>
            {/* Pinned slide preview - fixed thumbnail, full slide scaled to fit */}
            <div style={{display:"flex",justifyContent:"center",marginBottom:10}}>
              <SlidePreview slide={slides[active]} idx={active} total={slides.length} opts={slideOpts(active)} onClick={()=>{}} isActive={false} isCover={active===0} previewSize={120} showWatermark={currentUser?.plan==="free"}/>
            </div>
          </div>
          {/* Scrollable edit fields */}
          <div className="drawer-scroll" style={{overflowY:"auto",padding:"0 16px 40px",flex:1,WebkitOverflowScrolling:"touch"}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <label style={lbl}>Photo overlay — {overlayDark}%</label>
              <input type="range" min={0} max={100} value={overlayDark} onChange={e=>setOverlayDark(+e.target.value)} style={{width:"100%"}}/>
            </div>
            <div><label style={lbl}>Slide Title</label><input value={slides[active]?.tag||""} onChange={e=>updateSlide("tag",e.target.value)} style={{...inp,fontSize:16}}/></div>
            <div><label style={lbl}>Headline</label><textarea value={slides[active]?.headline||""} onChange={e=>updateSlide("headline",e.target.value)} rows={3} style={{...inp,fontSize:16,resize:"none",lineHeight:1.5}}/></div>
            <div><label style={lbl}>Accent Word</label><input value={slides[active]?.accent_word||""} onChange={e=>updateSlide("accent_word",e.target.value)} style={{...inp,fontSize:16}}/></div>
            <div><label style={lbl}>Body</label><textarea value={slides[active]?.body||""} onChange={e=>updateSlide("body",e.target.value)} rows={4} style={{...inp,fontSize:16,resize:"none",lineHeight:1.6}}/></div>
            <div><label style={lbl}>CTA <span style={{letterSpacing:0,fontWeight:400,fontSize:9,textTransform:"none"}}>(leave blank to hide)</span></label><input value={slides[active]?.cta_items?.[0]||""} onChange={e=>updateSlide("cta_items",e.target.value?[e.target.value]:[])} style={{...inp,fontSize:16}} placeholder="e.g. Save this so you can come back to it"/></div>
            <div>
              <label style={lbl}>AI Rewrite</label>
              <div style={{display:"flex",gap:8}}>
                <input value={rewritePrompt} onChange={e=>setRewritePrompt(e.target.value)} placeholder='"Make this punchier"' style={{...inp,flex:1,fontSize:13}}/>
                <button onClick={()=>rewrite()} disabled={rewriting} style={{background:A.text,color:A.accentText,border:"none",borderRadius:9,padding:"0 14px",fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0}}>{rewriting?<Spin/>:"↺"}</button>
              </div>
            </div>
          </div>
          </div>
          </div>
        </div>
      </>
      )}


        {/* UPGRADE VIEW — accessible via upgrade pill only */}
        {nav==="upgrade"&&(
          <div className="upgrade-view" style={{animation:"fadeUp 0.3s ease",maxWidth:900,margin:"0 auto",width:"100%"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
              <button onClick={()=>setNav("account")} style={{background:"none",border:`1px solid ${A.border}`,color:A.muted,padding:"6px 14px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>← Back</button>
              <div>
                <h2 style={{fontSize:24,fontWeight:800,margin:0}}>Upgrade</h2>
                <p style={{color:A.muted,fontSize:14,margin:0}}>Choose a plan or licence</p>
              </div>
            </div>
{(planLabel==="free"||planLabel==="starter"||planLabel==="pro"||planLabel==="agency")&&(
              <>
                {/* 4 plans side by side always */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}} className="plan-cards-grid">
                  {/* Free */}
                  <div style={{background:A.surface,border:`1.5px solid ${planLabel==="free"?GOLD:A.border}`,borderRadius:14,padding:20,display:"flex",flexDirection:"column",position:"relative"}}>
                    {planLabel==="free"&&<div style={{position:"absolute",top:-10,left:12,background:GOLD,color:"#000",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:10}}>Current</div>}
                    <div style={{fontSize:13,fontWeight:800,color:GOLD,marginBottom:2}}>Free</div>
                    <div style={{fontSize:10,color:A.muted,marginBottom:6}}>60 credits/month</div>
                    <div style={{fontSize:24,fontWeight:900,color:A.text,marginBottom:14}}>$0</div>
                    <div style={{flex:1,marginBottom:14}}>
                      {["60 credits/month","6 carousel generations","Watermarked downloads","Carousel generator","Quote cards","AI captions"].map(f=>(
                        <div key={f} style={{display:"flex",alignItems:"flex-start",gap:5,fontSize:11,color:A.muted,marginBottom:6,lineHeight:1.4}}><span style={{color:GOLD,fontWeight:800,flexShrink:0}}>✓</span>{f}</div>
                      ))}
                    </div>
                    {planLabel==="free"
                      ? <button disabled style={{width:"100%",padding:"10px",background:GOLD,color:"#000",borderRadius:8,fontWeight:700,fontSize:11,border:"none",cursor:"default"}}>Current Plan</button>
                      : <button onMouseEnter={()=>setHoveredBtn("free_down")} onMouseLeave={()=>setHoveredBtn(null)} onClick={()=>window.open(process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL,"_blank")} style={{width:"100%",padding:"10px",background:"none",border:`1px solid ${A.border}`,color:A.muted,borderRadius:8,fontWeight:700,fontSize:11,cursor:"pointer"}}>Downgrade</button>
                    }
                  </div>
                  {/* Starter */}
                  <div style={{background:A.surface,border:`1.5px solid ${planLabel==="starter"?GOLD:A.border}`,borderRadius:14,padding:20,display:"flex",flexDirection:"column",position:"relative"}}>
                    {planLabel==="starter"&&<div style={{position:"absolute",top:-10,left:12,background:GOLD,color:"#000",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:10}}>Current</div>}
                    <div style={{fontSize:13,fontWeight:800,color:GOLD,marginBottom:2}}>Starter</div>
                    <div style={{fontSize:10,color:A.muted,marginBottom:6}}>200 credits/month</div>
                    <div style={{fontSize:24,fontWeight:900,color:A.text,marginBottom:14}}>$20<span style={{fontSize:11,fontWeight:500,color:A.muted}}>/mo</span></div>
                    <div style={{flex:1,marginBottom:14}}>
                      {["No watermark on downloads","200 credits/month","20 carousel generations","Captions, rewrites & downloads","20% affiliate commission","15% Tier 2 on your network"].map(f=>(
                        <div key={f} style={{display:"flex",alignItems:"flex-start",gap:5,fontSize:11,color:A.text,marginBottom:6,lineHeight:1.4}}><span style={{color:GOLD,fontWeight:800,flexShrink:0}}>✓</span>{f}</div>
                      ))}
                    </div>
                    {planLabel==="starter"
                      ? <button disabled style={{width:"100%",padding:"10px",background:GOLD,color:"#000",borderRadius:8,fontWeight:700,fontSize:11,border:"none",cursor:"default"}}>Current Plan</button>
                      : planLabel==="free"
                      ? <button onMouseEnter={()=>setHoveredBtn("starter")} onMouseLeave={()=>setHoveredBtn(null)} onClick={()=>handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID)} style={{width:"100%",padding:"10px",background:hoveredBtn==="starter"?"#1a1a1a":A.text,color:A.accentText,borderRadius:8,fontWeight:700,fontSize:11,border:"none",transition:"all 0.2s"}}>Get Starter</button>
                      : <button onMouseEnter={()=>setHoveredBtn("starter_d")} onMouseLeave={()=>setHoveredBtn(null)} onClick={()=>window.open(process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL,"_blank")} style={{width:"100%",padding:"10px",background:"none",border:`1px solid ${A.border}`,color:A.muted,borderRadius:8,fontWeight:700,fontSize:11,cursor:"pointer"}}>Downgrade</button>
                    }
                  </div>
                  {/* Pro — best value */}
                  <div style={{background:"#111",border:`2px solid ${GOLD}`,borderRadius:14,padding:20,display:"flex",flexDirection:"column",position:"relative"}}>
                    <div style={{position:"absolute",top:-10,right:10,background:planLabel==="pro"?GOLD:GOLD,color:"#000",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:10}}>{planLabel==="pro"?"✓ Current":"Best value"}</div>
                    <div style={{fontSize:13,fontWeight:800,color:GOLD,marginBottom:2}}>Pro</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginBottom:6}}>800 credits/month</div>
                    <div style={{fontSize:24,fontWeight:900,color:GOLD,marginBottom:14}}>$50<span style={{fontSize:11,fontWeight:500,color:"rgba(255,255,255,0.4)"}}>/mo</span></div>
                    <div style={{flex:1,marginBottom:14}}>
                      {["Everything in Starter","80 carousels/month/month","30% affiliate commission","15% Tier 2 on your network","Refer 4 — Pro pays itself","Priority support","Early feature access"].map(f=>(
                        <div key={f} style={{display:"flex",alignItems:"flex-start",gap:5,fontSize:11,color:"#fff",marginBottom:6,lineHeight:1.4}}><span style={{color:GOLD,fontWeight:800,flexShrink:0}}>✓</span>{f}</div>
                      ))}
                    </div>
                    {planLabel==="pro"
                      ? <button disabled style={{width:"100%",padding:"10px",background:GOLD,color:"#000",borderRadius:8,fontWeight:700,fontSize:11,border:"none",cursor:"default"}}>Current Plan</button>
                      : planLabel==="agency"
                      ? <button onMouseEnter={()=>setHoveredBtn("pro_d")} onMouseLeave={()=>setHoveredBtn(null)} onClick={()=>window.open(process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL,"_blank")} style={{width:"100%",padding:"10px",background:"none",border:`1px solid ${GOLD}`,color:GOLD,borderRadius:8,fontWeight:700,fontSize:11,cursor:"pointer"}}>Downgrade</button>
                      : <button onMouseEnter={()=>setHoveredBtn("pro")} onMouseLeave={()=>setHoveredBtn(null)} onClick={()=>handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID)} style={{width:"100%",padding:"10px",background:hoveredBtn==="pro"?"#e6c45a":GOLD,color:"#000",borderRadius:8,fontWeight:700,fontSize:11,border:"none",transition:"all 0.2s"}}>Get Pro</button>
                    }
                  </div>
                  {/* Agency */}
                  <div style={{background:A.surface,border:`1.5px solid ${planLabel==="agency"?GOLD:A.border}`,borderRadius:14,padding:20,display:"flex",flexDirection:"column",position:"relative"}}>
                    {planLabel==="agency"&&<div style={{position:"absolute",top:-10,left:12,background:GOLD,color:"#000",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:10}}>Current</div>}
                    <div style={{fontSize:13,fontWeight:800,color:GOLD,marginBottom:2}}>Agency</div>
                    <div style={{fontSize:10,color:A.muted,marginBottom:6}}>3,000 credits/month</div>
                    <div style={{fontSize:24,fontWeight:900,color:A.text,marginBottom:14}}>$100<span style={{fontSize:11,fontWeight:500,color:A.muted}}>/mo</span></div>
                    <div style={{flex:1,marginBottom:14}}>
                      {["Everything in Pro","300 carousels/month/month","40% affiliate commission","15% Tier 2 on your network","Enough credits for multiple brands","High volume creators & agencies","Priority support"].map(f=>(
                        <div key={f} style={{display:"flex",alignItems:"flex-start",gap:5,fontSize:11,color:A.text,marginBottom:6,lineHeight:1.4}}><span style={{color:GOLD,fontWeight:800,flexShrink:0}}>✓</span>{f}</div>
                      ))}
                    </div>
                    {planLabel==="agency"
                      ? <button disabled style={{width:"100%",padding:"10px",background:GOLD,color:"#000",borderRadius:8,fontWeight:700,fontSize:11,border:"none",cursor:"default"}}>Current Plan</button>
                      : <button onMouseEnter={()=>setHoveredBtn("agency")} onMouseLeave={()=>setHoveredBtn(null)} onClick={()=>handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID)} style={{width:"100%",padding:"10px",background:hoveredBtn==="agency"?"#1a1a1a":A.text,color:A.accentText,borderRadius:8,fontWeight:700,fontSize:11,border:"none",transition:"all 0.2s"}}>Get Agency</button>
                    }
                  </div>
                </div>

                {/* Affiliate Licence */}
                <div style={{background:"linear-gradient(135deg,#1a0a00,#2a1500)",border:`2px solid ${GOLD}`,borderRadius:14,padding:24,marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:8}}>
                    <div><span style={{fontSize:16,fontWeight:800,color:"#fff"}}>Affiliate Licence</span><span style={{fontSize:10,fontWeight:700,padding:"2px 10px",background:GOLD,borderRadius:20,color:"#000",marginLeft:10}}>🔥 Founding price</span></div>
                    <div style={{fontSize:22,fontWeight:800,color:GOLD}}>$297 <span style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.5)"}}>one-time</span></div>
                  </div>
                  <p style={{fontSize:13,color:"rgba(255,255,255,0.7)",margin:"0 0 14px",lineHeight:1.6}}>Pay once. Earn <strong style={{color:GOLD}}>forever</strong>. No monthly fee — ever. Your commissions never stop, even if you never pay another penny.</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:16}}>
                    {["150 credits/month for demos","35% lifetime recurring commission","15% Tier 2 on your network","One payment — no monthly fee ever","Commissions never stop","Pays for itself after a few referrals","Founding price — won't last","Full affiliate dashboard access"].map(f=>(
                      <div key={f} style={{display:"flex",alignItems:"flex-start",gap:6,fontSize:12,color:"#fff",lineHeight:1.4}}><span style={{color:GOLD,fontWeight:800,flexShrink:0,marginTop:1}}>✓</span>{f}</div>
                    ))}
                  </div>
                  <button onMouseEnter={()=>setHoveredBtn("afflicence")} onMouseLeave={()=>setHoveredBtn(null)} onClick={()=>handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_AFFILIATE_PRICE_ID,"payment")} style={{width:"100%",padding:"13px",background:hoveredBtn==="afflicence"?"#e6c45a":GOLD,color:"#000",borderRadius:10,fontWeight:700,fontSize:14,border:"none",transition:"all 0.2s"}}>Get Affiliate Licence — $297 once</button>
                </div>

                {/* White Label */}
                <div style={{background:"linear-gradient(135deg,#0a001a,#15002a)",border:"2px solid #6644cc",borderRadius:14,padding:24,marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:8}}>
                    <div><span style={{fontSize:16,fontWeight:800,color:"#fff"}}>White Label</span><span style={{fontSize:10,fontWeight:700,padding:"2px 10px",background:"#6644cc",borderRadius:20,color:"#fff",marginLeft:10}}>Your brand</span></div>
                    <div style={{fontSize:22,fontWeight:800,color:"#9977ff"}}>$497 <span style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.5)"}}>one-time</span></div>
                  </div>
                  <p style={{fontSize:13,color:"rgba(255,255,255,0.7)",margin:"0 0 14px",lineHeight:1.6}}>Your brand, your domain, your product. Resell as your own tool. Pay once and earn <strong style={{color:"#9977ff"}}>40% lifetime commission</strong> on every client — forever.</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:16}}>
                    {["Your brand & domain","Resell as your own product","800 credits/month included","40% lifetime recurring commission","15% Tier 2 on your network","No monthly fee ever","One payment — lifetime access","Full affiliate dashboard access"].map(f=>(
                      <div key={f} style={{display:"flex",alignItems:"flex-start",gap:6,fontSize:12,color:"#fff",lineHeight:1.4}}><span style={{color:"#9977ff",fontWeight:800,flexShrink:0,marginTop:1}}>✓</span>{f}</div>
                    ))}
                  </div>
                  <button onMouseEnter={()=>setHoveredBtn("whitelabel")} onMouseLeave={()=>setHoveredBtn(null)} onClick={()=>handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_WHITELABEL_PRICE_ID,"payment")} style={{width:"100%",padding:"13px",background:hoveredBtn==="whitelabel"?"#7755dd":"#6644cc",color:"#fff",borderRadius:10,fontWeight:700,fontSize:14,border:"none",transition:"all 0.2s"}}>Get White Label — $497 once</button>
                </div>

                {/* Top-ups for paid plans */}
                {/* Manage subscription */}
                {/* These live in the Account tab */}

                {/* Affiliate earnings diagram */}
                <div style={{background:"linear-gradient(135deg,#1c1000,#2a1800)",border:`1.5px solid ${GOLD}`,borderRadius:14,padding:24,marginTop:8}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:800,color:"#fff",marginBottom:4}}>See how the affiliate system works</div>
                      <p style={{fontSize:13,color:"rgba(255,255,255,0.65)",margin:0,lineHeight:1.6}}>Frank paid $297 once. He now earns $440 every month — forever. See exactly how with real numbers.</p>
                    </div>
                    <a href="/affiliate" target="_blank" rel="noopener noreferrer" style={{background:GOLD,color:"#000",padding:"11px 20px",borderRadius:9,fontWeight:700,fontSize:13,textDecoration:"none",whiteSpace:"nowrap",flexShrink:0}}>See Frank's earnings →</a>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      <PexelsModal
        open={showPexelsCover}
        onClose={()=>setShowPexelsCover(false)}
        onSelect={async (url)=>{ await addCoverPhoto(url); }}
        A={A}
        GOLD={GOLD}
      />
      <PexelsModal
        open={showPexelsTemplate}
        onClose={()=>setShowPexelsTemplate(false)}
        onSelect={async (url)=>{
          setTemplateBgUrl(url);
          try {
            const res = await fetch("/api/upload-photo", {
              method:"POST",
              headers:{"Content-Type":"application/json"},
              body: JSON.stringify({ imageData: url, filename: `template-pexels-${Date.now()}.jpg` }),
            });
            const data = await res.json();
            if (data.url) {
              setTemplateBgUrl(data.url);
              const next = [data.url,...coverPhotos.filter(p=>p!==data.url)].slice(0,10);
              setCoverPhotos(next); setTemplatePhotos(next);
            } else {
              const next = [url,...coverPhotos.filter(p=>p!==url)].slice(0,10);
              setCoverPhotos(next); setTemplatePhotos(next);
            }
          } catch(e) {
            console.error("Template Pexels save failed:",e);
            const next = [url,...coverPhotos.filter(p=>p!==url)].slice(0,10);
            setCoverPhotos(next); setTemplatePhotos(next);
          }
        }}
        A={A}
        GOLD={GOLD}
      />
      <PexelsModal
        open={showPexelsQuote}
        onClose={()=>setShowPexelsQuote(false)}
        onSelect={async (url)=>{
          setQuoteBgCustomUrl(url);
          try {
            const res = await fetch("/api/upload-photo", {
              method:"POST",
              headers:{"Content-Type":"application/json"},
              body: JSON.stringify({ imageData: url, filename: `quotebg-pexels-${Date.now()}.jpg` }),
            });
            const data = await res.json();
            if (data.url) {
              setQuoteBgCustomUrl(data.url);
              setQuotePhotos(prev=>[data.url,...prev.filter(p=>p!==data.url)].slice(0,8));
            } else {
              setQuotePhotos(prev=>[url,...prev.filter(p=>p!==url)].slice(0,8));
            }
          } catch(e) {
            console.error("Quote Pexels save failed:",e);
            setQuotePhotos(prev=>[url,...prev.filter(p=>p!==url)].slice(0,8));
          }
        }}
        A={A}
        GOLD={GOLD}
      />
      <PexelsModal
        open={showPexelsTmplLib}
        onClose={()=>setShowPexelsTmplLib(false)}
        onSelect={async(url)=>{
          setPendingTmplImage(url);
          const next=[url,...tmplLibrary.filter(p=>p!==url)].slice(0,15);
          setTmplLibrary(next);
          try{localStorage.setItem("bwt_tmpl_library",JSON.stringify(next));}catch{}
          setShowPexelsTmplLib(false);
        }}
        A={A}
        GOLD={GOLD}
      />
      <footer style={{borderTop:`1px solid ${A.border}`,padding:"14px 32px",textAlign:"center",marginTop:60}}>
        <a href="https://www.buildwithtav.co" target="_blank" rel="noopener noreferrer" style={{color:GOLD,fontWeight:700,textDecoration:"none",fontSize:12}}>BuildWithTav</a>
        <span style={{color:A.muted,fontSize:12}}> · </span>
        <a href="https://www.buildwithtav.co" target="_blank" rel="noopener noreferrer" style={{color:A.muted,fontSize:12,textDecoration:"none"}}>buildwithtav.co</a>
      </footer>
    </div>
  );
}
