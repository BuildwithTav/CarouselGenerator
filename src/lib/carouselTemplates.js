// Carousel Studio slide templates. Shared by the Carousel Studio UI and the
// dashboard server renderer so both produce identical slides.

export function buildTmplHTML(slide, idx, total, tmpl, _c_opts) {
  const {effect,font,fontSize,primary,secondary,accentLine,bg,fontStyle,rawBox,rawPos,listicleNum,profUrl,nm,hdl,showTick,isFree,userWebsite,showCounter}=_c_opts;
  const AL=accentLine||primary;
  const FS=fontSize||82;
  function effectColor(eff,al){
    if(eff==="none"||!eff)return al;
    if(eff==="gold")return"#C9A84C";
    if(eff==="chrome")return"#aaaaaa";
    if(eff==="fire")return"#ff6600";
    if(eff==="ice")return"#38bdf8";
    if(eff==="3d")return"#ffffff";
    if(eff==="rosegold")return"#f4a0b0";
    if(eff==="glitter")return"#f0d060";
    if(eff==="holographic")return"#a78bfa";
    if(eff==="pastel")return"#f9a8d4";
    if(eff==="blush")return"#fcb69f";
    if(eff==="sunset")return"#ff8c00";
    if(eff==="purplehaze")return"#c084fc";
    if(eff==="shadowpop")return"#ffffff";
    if(eff==="duotone")return al;
    return al;
  }
  function autoFS(text,base){if(!text)return base;const len=text.length;const scaled=base-Math.max(0,(len-12)*2);return Math.max(28,Math.min(base,scaled));}
  const W=1080,H=1350,SAFE=60,isCover=idx===0;
      const FONT_CSS_MAP={montserrat:"Montserrat",playfair:"Playfair Display",poppins:"Poppins",inter:"Inter",oswald:"Oswald",dancing:"Dancing Script",raleway:"Raleway",lato:"Lato",roboto:"Roboto",ubuntu:"Ubuntu",nunito:"Nunito",sourcesans:"Source Sans 3",crimson:"Crimson Text",merriweather:"Merriweather",bebasneue:"Bebas Neue",abril:"Abril Fatface",pacifico:"Pacifico",josefin:"Josefin Sans",quicksand:"Quicksand",dmserif:"DM Serif Display",cormorant:"Cormorant Garamond",righteous:"Righteous"};
  const fontFamily=(FONT_CSS_MAP[font]||font||"Bebas Neue").replace(/'/g,"");
  function esc(s){return(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
  const gFonts="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Anton&family=Oswald:wght@700&family=Barlow+Condensed:wght@800;900&family=Archivo+Black&family=Playfair+Display:ital,wght@0,900;1,900&family=Alfa+Slab+One&family=Cormorant+Garamond:ital,wght@0,700;1,700&family=Josefin+Sans:wght@700&family=Raleway:wght@800;900&family=Quicksand:wght@700&family=Dancing+Script:wght@700&family=Inter:wght@400;600;700;800&family=Poppins:wght@400;600;700;800&family=Montserrat:wght@400;600;700;800&display=swap";
  function effectCSS(eff,pri,sec){
    const cs="padding-top:0.15em;display:inline-block;";
    if(eff==="gold") return cs+"background:linear-gradient(180deg,"+sec+" 0%,#ffe44d 20%,"+pri+" 50%,#7a5800 80%,#ffe066 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 4px 8px rgba(140,100,0,0.5));";
    if(eff==="chrome") return cs+"background:linear-gradient(180deg,"+sec+" 0%,#ddd 20%,#777 45%,#bbb 65%,#444 85%,#ccc 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;";
    if(eff==="fire") return cs+"background:linear-gradient(180deg,"+sec+" 0%,#ffff00 15%,#ff6600 40%,#cc0000 75%,#660000 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;";
    if(eff==="ice") return cs+"background:linear-gradient(180deg,"+sec+" 0%,#d0f0ff 30%,"+pri+" 65%,#1a6090 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;";
    if(eff==="3d") return"color:#fff;text-shadow:1px 1px 0 #555,2px 2px 0 #444,3px 3px 0 #333,4px 4px 0 #222,5px 5px 0 #111,6px 6px 8px rgba(0,0,0,0.4);";
    if(eff==="rosegold") return cs+"background:linear-gradient(180deg,#fff0f0 0%,#f4a0b0 25%,#c96a7a 55%,#8b3a4a 85%,#f4a0b0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;";
    if(eff==="glitter") return cs+"background:linear-gradient(135deg,#fff 0%,#f0d060 20%,#fff 40%,#f0d060 60%,#fff 80%,#f0d060 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 6px rgba(240,208,96,0.8));";
    if(eff==="holographic") return cs+"background:linear-gradient(135deg,#ff6eb4 0%,#a78bfa 25%,#38bdf8 50%,#34d399 75%,#fb923c 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;";
    if(eff==="pastel") return"-webkit-text-fill-color:#f9a8d4;color:#f9a8d4;text-shadow:0 2px 12px rgba(249,168,212,0.4);";
    if(eff==="blush") return cs+"background:linear-gradient(180deg,#ffecd2 0%,#fcb69f 50%,#ff9a9e 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;";
    if(eff==="sunset") return cs+"background:linear-gradient(180deg,#fff 0%,#ffd700 20%,#ff8c00 50%,#ff4500 80%,#8b0000 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;";
    if(eff==="purplehaze") return"-webkit-text-fill-color:#c084fc;color:#c084fc;text-shadow:0 0 10px #c084fc,0 0 20px #7c3aed,0 0 40px #7c3aed;";
    if(eff==="shadowpop") return"color:#fff;text-shadow:3px 3px 0 "+pri+",6px 6px 0 rgba(0,0,0,0.3);";
    if(eff==="duotone") return cs+"background:linear-gradient(180deg,"+pri+" 0%,"+sec+" 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;";
    if(eff==="none")return"color:"+pri+";-webkit-text-fill-color:"+pri+";";
    return"-webkit-text-fill-color:"+sec+";color:"+sec+";text-shadow:0 2px 8px rgba(0,0,0,0.6);";
  }
  function badge(dark){
    const tc=dark?"#fff":"#0a0a0a",sc=dark?"rgba(255,255,255,0.55)":"rgba(0,0,0,0.45)";
    const tick=showTick?"<span style='display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#1D9BF0;border-radius:50%;margin-left:8px;vertical-align:middle;flex-shrink:0;'><span style='display:block;width:8px;height:5px;border-left:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(-45deg);margin-top:-2px;'></span></span>":"";
    const av=profUrl?"<img src='"+esc(profUrl)+"' style='width:100%;height:100%;object-fit:cover;border-radius:50%;'/>"  :"<div style='width:100%;height:100%;background:#4a6a9a;border-radius:50%;'></div>";
    return"<div style='display:flex;align-items:center;gap:18px;'><div style='width:90px;height:90px;border-radius:50%;overflow:hidden;border:3px solid #fff;flex-shrink:0;background:#4a6a9a;'>"+av+"</div><div style='display:flex;flex-direction:column;gap:4px;'><div style='display:flex;align-items:center;font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:36px;font-weight:800;color:"+tc+";'>"+esc(nm||"")+tick+"</div><div style='font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:28px;color:"+sc+";'>"+esc(hdl||"")+"</div></div></div>";
  }
  const grad="linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0) 28%,rgba(0,0,0,0.08) 44%,rgba(0,0,0,0.35) 54%,rgba(0,0,0,0.65) 62%,rgba(0,0,0,0.88) 70%,rgba(0,0,0,0.96) 78%,rgba(0,0,0,0.99) 88%,rgba(0,0,0,1) 100%)";
  const chevron="<div style='position:absolute;bottom:48px;right:56px;z-index:10;'><svg width='52' height='36' viewBox='0 0 52 36' fill='none'><polyline points='4,4 18,18 4,32' stroke='"+effectColor(effect,AL)+"' stroke-width='5' stroke-linecap='round' stroke-linejoin='round' fill='none'/><polyline points='20,4 34,18 20,32' stroke='"+effectColor(effect,AL)+"' stroke-width='5' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg></div>";
  const websiteStr=isFree?"studio.buildwithtav.co":(userWebsite||"");const {showWebsite}=_c_opts;
  const website=showWebsite&&websiteStr?"<div style='position:absolute;bottom:16px;left:0;right:0;text-align:center;z-index:10;font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:22px;color:rgba(255,255,255,0.45);'>"+websiteStr+"</div>":"";
  const wm=isFree?"<div style='position:absolute;top:32px;left:0;right:0;text-align:center;z-index:20;pointer-events:none;font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:32px;font-weight:800;color:#ffffff;text-shadow:0 2px 8px rgba(0,0,0,0.9),0 0 20px rgba(0,0,0,0.8);letter-spacing:1px;'>studio.buildwithtav.co</div>":"";
  const counter=showCounter?"<div style='position:absolute;top:24px;right:40px;z-index:10;background:rgba(0,0,0,0.55);border-radius:6px;padding:6px 14px;font-size:22px;font-weight:700;color:#fff;'>"+(idx+1)+"/"+total+"</div>":"";
  function imgTag(s){if(!s||!s.image)return"<div style='position:absolute;inset:0;background:#1a1a1a;z-index:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;'><div style='background:rgba(187,153,0,0.15);border:2px dashed rgba(187,153,0,0.6);border-radius:16px;padding:40px 60px;text-align:center;'><div style='font-family:-apple-system,sans-serif;font-size:42px;margin-bottom:16px;'>📷</div><div style='font-family:-apple-system,sans-serif;font-size:34px;font-weight:700;color:#BB9900;'>Upload your image</div><div style='font-family:-apple-system,sans-serif;font-size:26px;color:rgba(255,255,255,0.5);margin-top:8px;'>in the Photo section</div></div></div>";const px=(s.imagePos&&s.imagePos.x!=null)?s.imagePos.x:0,py=(s.imagePos&&s.imagePos.y!=null)?s.imagePos.y:0;const isPlaceholder=s.image&&!s.image.startsWith("_c_data:")&&!s.image.startsWith("https://")&&!s.image.startsWith("http://");const overlay=isPlaceholder?"<div style='position:absolute;bottom:80px;left:50%;transform:translateX(-50%);z-index:3;pointer-events:none;white-space:nowrap;'><div style='background:rgba(0,0,0,0.75);border:2px solid rgba(187,153,0,0.8);border-radius:12px;padding:12px 28px;text-align:center;'><div style='font-family:-apple-system,sans-serif;font-size:22px;font-weight:700;color:#BB9900;'>📷 Replace with your image</div></div></div>":"";const imgSrc=s.image.startsWith("_c_data:")?s.image.replace(/^_c_data:/,"data:"):s.image;const zoom=s.imageZoom||100;const opa=s.imageOpacity!=null?s.imageOpacity/100:1;const zm=(s.imageZoom||100)/100;const fitRule=s.imageFit==="contain"?"max-width:100%;max-height:100%;width:auto;height:auto;":"min-width:100%;min-height:100%;width:auto;height:auto;max-width:none;";return"<div style='position:absolute;inset:0;z-index:0;overflow:hidden;'><img src=\""+imgSrc+"\" style=\"position:absolute;top:50%;left:50%;"+fitRule+"opacity:"+opa+";transform-origin:center center;transform:translate(calc(-50% + "+px+"px),calc(-50% + "+py+"px)) scale("+zm+");\" />"+overlay+"</div>";}
  function darkFadeCover(s){
    const headlineText=esc((s.headline||"").toUpperCase());
    const sublineText=s.subline?esc(s.subline):"";
    const effectStyle=effect==="none"?("color:"+primary+";-webkit-text-fill-color:"+primary+";"):effectCSS(effect,AL,secondary);
    const sublineColor=effect==="clean"?primary:(tmpl==="clean-pro"?AL:secondary);
    const fitScript="<script>(function(){var h=document.getElementById('hl');if(!h)return;var zone=document.getElementById('tz');var sl=document.getElementById('sl');var maxW=zone.offsetWidth;var maxH=zone.offsetHeight;var fs=88;h.style.fontSize=fs+'px';function fits(){return zone.scrollHeight<=maxH;}document.fonts.ready.then(function(){while(fs>36&&!fits()){fs-=2;h.style.fontSize=fs+'px';}if(sl){var sfs=34;while(sfs>20&&!fits()){sfs-=2;sl.style.fontSize=sfs+'px';}}window.__TEXT_FIT_DONE__=true;});})();<\/script>";
    return"<div style='position:relative;width:"+W+"px;height:"+H+"px;background:#000;overflow:hidden;'>"+imgTag(s)
      +"<div style='position:absolute;inset:0;background:"+grad+";z-index:1;'></div>"
      +"<div style='position:absolute;z-index:5;left:50%;transform:translateX(-50%);top:"+Math.round(H*0.638)+"px;white-space:nowrap;'>"+badge(true)+"</div>"
      +"<div style='position:absolute;z-index:5;left:54px;right:54px;top:"+Math.round(H*0.748)+"px;height:5px;background:linear-gradient(to right,transparent 0%,"+AL+" 5%,"+AL+" 95%,transparent 100%);'></div>"
      +"<div id='tz' style='position:absolute;z-index:5;left:60px;right:60px;top:"+Math.round(H*0.762)+"px;height:"+Math.round(H*0.21)+"px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:16px;overflow:hidden;'>"
      +"<div id='hl' style='font-family:"+fontFamily+",sans-serif;font-size:88px;font-weight:900;line-height:1.1;text-align:center;text-transform:uppercase;word-break:break-word;max-width:100%;"+effectStyle+"'>"+headlineText+"</div>"
      +(sublineText?"<div id='sl' style='font-family:"+fontFamily+",sans-serif;font-size:34px;color:"+sublineColor+";text-align:center;font-weight:600;max-width:100%;line-height:1.3;'>"+sublineText+"</div>":"")
      +"</div>"+website+(isCover?chevron:"")+counter+wm+fitScript+"</div>";
  }
  let body="";
  if(tmpl==="dark-fade"){body=darkFadeCover(slide);}
  else if(tmpl==="listicle"&&isCover){
    const cf="linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0) 38%,rgba(0,0,0,0.12) 52%,rgba(0,0,0,0.55) 62%,rgba(0,0,0,0.88) 70%,rgba(0,0,0,0.97) 78%,rgba(0,0,0,1) 85%,rgba(0,0,0,1) 100%)";
    const numDigits=String(listicleNum||6).length;
    const numFS=numDigits>2?240:numDigits>1?360:520;
    const numLineW=Math.min(Math.round(numFS*0.55*numDigits)+10,Math.round(numFS*numDigits*0.6));
    const fitScriptLis="<script>(function(){function fit(el,max,twoLine){if(!el)return;var zone=el.parentElement;var maxW=zone?zone.offsetWidth:800;var fs=max;el.style.fontSize=fs+'px';if(twoLine){while(fs>28&&Math.ceil(el.scrollWidth/(maxW*0.95))>2){fs-=2;el.style.fontSize=fs+'px';}}else{while(fs>18&&el.scrollWidth>maxW){fs-=2;el.style.fontSize=fs+'px';}}}document.fonts.ready.then(function(){fit(document.getElementById('lt'),44,false);fit(document.getElementById('ls'),110,true);fit(document.getElementById('lu'),34,false);window.__TEXT_FIT_DONE__=true;}).catch(function(){fit(document.getElementById('lt'),44,false);fit(document.getElementById('ls'),110,true);fit(document.getElementById('lu'),34,false);window.__TEXT_FIT_DONE__=true;});})();<\/script>";
    body="<div style='position:relative;width:"+W+"px;height:"+H+"px;background:#000;overflow:hidden;'>"+imgTag(slide)
      +"<div style='position:absolute;inset:0;background:"+cf+";z-index:1;'></div>"
      +"<div style='position:absolute;top:100px;left:"+SAFE+"px;z-index:5;'>"+badge(true)+"</div>"
      +"<div style='position:absolute;bottom:100px;left:"+SAFE+"px;right:"+SAFE+"px;z-index:5;display:flex;align-items:flex-end;gap:32px;'>"
      +"<div style='flex-shrink:0;display:flex;flex-direction:column;gap:14px;'>"
      +"<div style='font-family:"+fontFamily+",sans-serif;font-size:"+numFS+"px;font-weight:900;line-height:0.88;"+effectCSS(effect,AL,secondary)+"'>"+(listicleNum||6)+"</div>"
      +"<div style='width:"+numLineW+"px;height:5px;background:"+effectColor(effect,AL)+";'></div>"
      +"</div>"
      +"<div id='ltz' style='flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;padding-bottom:8px;overflow:hidden;'>"
      +"<div id='lt' style='font-family:"+fontFamily+",sans-serif;font-size:44px;font-weight:600;color:"+secondary+";line-height:1.2;white-space:pre-wrap;word-break:break-word;'>"+esc((slide.topicLine||"PLACES YOU NEED TO VISIT BEFORE").toUpperCase())+"</div>"
      +"<div id='ls' style='font-family:"+fontFamily+",sans-serif;font-size:110px;font-weight:900;line-height:1.0;word-break:break-word;"+effectCSS(effect,AL,secondary)+"'>"+esc((slide.subject||"2027 ENDS").toUpperCase())+"</div>"
      +(slide.subline?"<div id='lu' style='font-family:"+fontFamily+",sans-serif;font-size:34px;color:"+(effect==="clean"?primary:secondary)+";line-height:1.3;white-space:pre-wrap;word-break:break-word;'>"+esc(slide.subline)+"</div>":"")
      +"</div></div>"
      +website
      +chevron+counter+wm+fitScriptLis+"</div>";
  }
  else if(tmpl==="listicle"&&!isCover){
    const lGrad="linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0) 40%,rgba(0,0,0,0.15) 54%,rgba(0,0,0,0.55) 62%,rgba(0,0,0,0.88) 70%,rgba(0,0,0,0.97) 78%,rgba(0,0,0,1) 86%,rgba(0,0,0,1) 100%)";
    const numFS2=String(idx).length>1?260:310;
    const numLineW2=Math.round(numFS2*0.62*String(idx).length)+20;
    const fitScriptLisBody="<script>(function(){var h=document.getElementById('lbh"+idx+"');if(!h)return;var zone=document.getElementById('lbz"+idx+"');if(!zone)return;var maxW=zone.offsetWidth;document.fonts.ready.then(function(){var fs=68;h.style.fontSize=fs+'px';while(fs>28&&Math.ceil(h.scrollWidth/(maxW*0.95))>2){fs-=2;h.style.fontSize=fs+'px';}window.__TEXT_FIT_DONE__=true;});})();<\/script>";
    body="<div style='position:relative;width:"+W+"px;height:"+H+"px;background:#0a0a0a;overflow:hidden;'>"+imgTag(slide)
      +"<div style='position:absolute;inset:0;background:"+lGrad+";z-index:1;'></div>"
      +"<div style='position:absolute;top:100px;left:"+SAFE+"px;z-index:5;'>"+badge(true)+"</div>"
      +"<div style='position:absolute;bottom:80px;left:"+SAFE+"px;right:"+SAFE+"px;z-index:5;display:flex;align-items:flex-end;gap:40px;'>"
      +"<div style='flex-shrink:0;display:flex;flex-direction:column;gap:14px;'>"
      +"<div style='font-family:"+fontFamily+",sans-serif;font-size:"+numFS2+"px;font-weight:900;line-height:1;"+effectCSS(effect,AL,secondary)+"'>"+String(idx)+"</div>"
      +"<div style='width:"+numLineW2+"px;height:5px;background:"+effectColor(effect,AL)+";'></div>"
      +"</div>"
      +"<div id='lbz"+idx+"' style='flex:1;min-width:0;display:flex;flex-direction:column;gap:20px;padding-bottom:8px;overflow:hidden;'>"
      +(slide.headline?"<div id='lbh"+idx+"' style='font-family:"+fontFamily+",sans-serif;font-size:68px;font-weight:900;line-height:1.1;text-transform:uppercase;word-break:break-word;"+effectCSS(effect,AL,secondary)+"'>"+esc(slide.headline.toUpperCase())+"</div>":"")
      +(slide.bodyText?"<div style='font-family:"+fontFamily+",sans-serif;font-size:44px;color:"+secondary+";line-height:1.45;word-break:break-word;'>"+esc(slide.bodyText)+"</div>":"")
      +"</div></div>"
      +website+wm+fitScriptLisBody+"</div>";
  }
  else if(tmpl==="clean-pro"&&isCover){body=darkFadeCover(slide);}
  else if(tmpl==="clean-pro"&&!isCover){
    const isW=bg==="white",bgC=isW?"#ffffff":"#0a0a0a",tM=isW?"#0a0a0a":"#ffffff";
    const tS=isW?"rgba(0,0,0,0.5)":"#E8E5E0";
    body="<div style='position:relative;width:"+W+"px;height:"+H+"px;background:"+bgC+";overflow:hidden;'>"
      +"<div style='position:absolute;top:140px;left:"+SAFE+"px;z-index:5;'>"+badge(!isW)+"</div>"
      +"<div style='position:absolute;top:320px;left:"+(SAFE+20)+"px;right:"+(SAFE+20)+"px;bottom:120px;z-index:5;display:flex;flex-direction:column;justify-content:center;gap:52px;'>"
      +(slide.headline?"<div style='font-family:"+fontFamily+",sans-serif;font-size:"+FS+"px;font-weight:800;color:"+tM+";line-height:1.2;word-break:break-word;'>"+esc(slide.headline)+"</div>":"")
      +(slide.bodyText?"<div style='font-family:"+fontFamily+",sans-serif;font-size:52px;color:"+tS+";line-height:1.65;word-break:break-word;'>"+esc(slide.bodyText).replace(/\n/g,"<br/>")+"</div>":"")
      +(slide.accentText?"<div style='font-family:"+fontFamily+",sans-serif;font-size:56px;font-weight:700;color:"+AL+";line-height:1.3;word-break:break-word;'>"+esc(slide.accentText)+"</div>":"")
      +(slide.accentText?"<div style='width:110px;height:5px;background:"+AL+";'></div>":"")
      +"</div>"+counter+(websiteStr?"<div style='position:absolute;bottom:16px;left:0;right:0;text-align:center;z-index:10;font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:22px;color:"+tS+";'>" +websiteStr+"</div>":"")+wm+"</div>";
  }
  else if(tmpl==="storytelling"){
    const isW=bg==="white",bgC=isW?"#ffffff":"#0a0a0a",tC=isW?"#0a0a0a":"#ffffff";
    const stI=fontStyle==="Playfair Display",stF=fontStyle||"Inter";
    const sw=isCover?"<div style='position:absolute;bottom:48px;right:56px;z-index:10;'><svg width='52' height='36' viewBox='0 0 52 36' fill='none'><polyline points='4,4 18,18 4,32' stroke='"+AL+"' stroke-width='5' stroke-linecap='round' stroke-linejoin='round' fill='none'/><polyline points='20,4 34,18 20,32' stroke='"+AL+"' stroke-width='5' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg></div>":"";
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
      +"</div>"+wm+"</div>";
  }
  else if(tmpl==="split"&&idx===0){
    // Split COVER slide — full width image, gradient band, headline + subline
    const coverGrad="linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0) 25%,rgba(0,0,0,0.6) 40%,rgba(0,0,0,0.92) 55%,rgba(0,0,0,0.92) 70%,rgba(0,0,0,0.5) 85%,rgba(0,0,0,0) 100%)";
    const _coverSrc=slide.image&&slide.image.startsWith("_c_data:")?slide.image.replace(/^_c_data:/,"data:"):slide.image;const _coverIsPlaceholder=slide.image&&!slide.image.startsWith("_c_data:")&&!slide.image.startsWith("http");const _coverOverlay=_coverIsPlaceholder?"<div style='position:absolute;bottom:80px;left:50%;transform:translateX(-50%);z-index:3;pointer-events:none;white-space:nowrap;'><div style='background:rgba(0,0,0,0.75);border:2px solid rgba(187,153,0,0.8);border-radius:12px;padding:12px 28px;text-align:center;'><div style='font-family:-apple-system,sans-serif;font-size:22px;font-weight:700;color:#BB9900;'>📷 Replace with your image</div></div></div>":"";const _coverPx=(slide.imagePos&&slide.imagePos.x!=null)?slide.imagePos.x:0;const _coverPy=(slide.imagePos&&slide.imagePos.y!=null)?slide.imagePos.y:0;const _coverZm=(slide.imageZoom||100)/100;const coverImgTag=slide.image?"<div style='position:absolute;inset:0;z-index:0;overflow:hidden;'><img src=\""+_coverSrc+"\" style=\"position:absolute;top:50%;left:50%;min-width:100%;min-height:100%;width:auto;height:auto;max-width:none;transform-origin:center center;transform:translate(calc(-50% + "+_coverPx+"px),calc(-50% + "+_coverPy+"px)) scale("+_coverZm+");\" />"+_coverOverlay+"</div>" : "<div style='position:absolute;inset:0;background:linear-gradient(135deg,#1a1a2e 0%,#0d0d0d 50%,#1a1a1a 100%);z-index:0;'><div style='position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:300px;gap:24px;'><div style='background:rgba(187,153,0,0.15);border:2px dashed rgba(187,153,0,0.6);border-radius:16px;padding:40px 60px;text-align:center;'><div style='font-family:-apple-system,sans-serif;font-size:42px;margin-bottom:16px;'>📷</div><div style='font-family:-apple-system,sans-serif;font-size:34px;font-weight:700;color:#BB9900;'>Upload cover image</div></div></div></div>";
    body="<div style='position:relative;width:"+W+"px;height:"+H+"px;background:#000;overflow:hidden;'>"+coverImgTag
      +"<div style='position:absolute;inset:0;background:"+coverGrad+";z-index:2;'></div>"
      +"<div style='position:absolute;top:120px;left:50%;transform:translateX(-50%);z-index:5;white-space:nowrap;'>"+badge(true)+"</div>"
      +"<div style='position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 80px;text-align:center;gap:32px;'>"
      +(slide.headline?"<div style='font-family:"+fontFamily+",sans-serif;font-size:110px;font-weight:900;line-height:1.05;text-transform:uppercase;word-break:break-word;"+effectCSS(effect,primary,secondary)+"'>"+esc(slide.headline.toUpperCase())+"</div>":"")
      +(slide.subline?"<div style='font-family:"+fontFamily+",sans-serif;font-size:52px;font-weight:500;color:"+secondary+";line-height:1.4;word-break:break-word;'>"+esc(slide.subline)+"</div>":"")
      +"</div>"
      +website+chevron+counter+wm+"</div>";
  }
  else if(tmpl==="split"&&slide.isSplitClosing){
    // Split CLOSING slide — dark bg, accent lines, punchy text
    const accentBar="<div style='width:120px;height:4px;background:"+AL+";border-radius:2px;margin:0 auto;'></div>";
    body="<div style='position:relative;width:"+W+"px;height:"+H+"px;background:#0a0a0a;overflow:hidden;'>"
      +"<div style='position:absolute;top:120px;left:50%;transform:translateX(-50%);z-index:5;white-space:nowrap;'>"+badge(true)+"</div>"
      +"<div style='position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 100px;text-align:center;gap:48px;'>"
      +accentBar
      +(slide.headline?"<div style='font-family:"+fontFamily+",sans-serif;font-size:88px;font-weight:900;line-height:1.1;text-transform:uppercase;word-break:break-word;"+effectCSS(effect,primary,secondary)+"'>"+esc(slide.headline.toUpperCase())+"</div>":"")
      +(slide.accentText?"<div style='font-family:"+fontFamily+",sans-serif;font-size:64px;font-weight:900;color:"+AL+";line-height:1.2;word-break:break-word;text-transform:uppercase;'>"+esc(slide.accentText.toUpperCase())+"</div>":"")
      +accentBar
      +(slide.subline?"<div style='font-family:"+fontFamily+",sans-serif;font-size:44px;font-weight:400;color:"+secondary+";line-height:1.5;word-break:break-word;'>"+esc(slide.subline)+"</div>":"")
      +"</div>"
      +website+counter+wm+"</div>";
  }
  else if(tmpl==="split"){
    const splitGrad="linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0) 38%,rgba(0,0,0,0.08) 52%,rgba(0,0,0,0.42) 62%,rgba(0,0,0,0.82) 72%,rgba(0,0,0,0.97) 82%,rgba(0,0,0,1) 100%)";
    const HW=Math.floor(W/2);
    const splitUploadPrompt="<div style='position:absolute;top:60px;left:50%;transform:translateX(-50%);z-index:3;pointer-events:none;white-space:nowrap;'><div style='background:rgba(0,0,0,0.75);border:1.5px solid rgba(187,153,0,0.8);border-radius:10px;padding:10px 24px;text-align:center;'><div style='font-family:-apple-system,sans-serif;font-size:22px;font-weight:700;color:#BB9900;'>📷 Add image</div></div></div>";
    const _imgLSrc=slide.image&&slide.image.startsWith("_c_data:")?slide.image.replace(/^_c_data:/,"data:"):slide.image;const _imgLPx=(slide.imagePos&&slide.imagePos.x!=null)?slide.imagePos.x:0;const _imgLPy=(slide.imagePos&&slide.imagePos.y!=null)?slide.imagePos.y:0;const _imgLZm=(slide.imageZoom||100)/100;const imgL=slide.image?"<div style='position:absolute;inset:0;z-index:0;overflow:hidden;'><img src=\""+_imgLSrc+"\" style=\"position:absolute;top:50%;left:50%;min-width:100%;min-height:100%;width:auto;height:auto;max-width:none;transform-origin:center center;transform:translate(calc(-50% + "+_imgLPx+"px),calc(-50% + "+_imgLPy+"px)) scale("+_imgLZm+");\" />"+(slide.image&&!slide.image.startsWith("_c_data:")?splitUploadPrompt:"")+"</div>":"<div style='position:absolute;inset:0;background:#111;z-index:0;display:flex;align-items:flex-start;padding-top:80px;justify-content:center;'><div style='background:rgba(187,153,0,0.1);border:1.5px dashed rgba(187,153,0,0.5);border-radius:12px;padding:24px 32px;text-align:center;'><div style='font-family:-apple-system,sans-serif;font-size:32px;margin-bottom:8px;'>📷</div><div style='font-family:-apple-system,sans-serif;font-size:22px;font-weight:700;color:#BB9900;'>Upload image</div></div></div>";
    const _imgRSrc=slide.image2&&slide.image2.startsWith("_c_data:")?slide.image2.replace(/^_c_data:/,"data:"):slide.image2;const _imgRPx=(slide.image2Pos&&slide.image2Pos.x!=null)?slide.image2Pos.x:0;const _imgRPy=(slide.image2Pos&&slide.image2Pos.y!=null)?slide.image2Pos.y:0;const _imgRZm=(slide.image2Zoom||100)/100;const imgR=slide.image2?"<div style='position:absolute;inset:0;z-index:0;overflow:hidden;'><img src=\""+_imgRSrc+"\" style=\"position:absolute;top:50%;left:50%;min-width:100%;min-height:100%;width:auto;height:auto;max-width:none;transform-origin:center center;transform:translate(calc(-50% + "+_imgRPx+"px),calc(-50% + "+_imgRPy+"px)) scale("+_imgRZm+");\" />"+(slide.image2&&!slide.image2.startsWith("_c_data:")?splitUploadPrompt:"")+"</div>":"<div style='position:absolute;inset:0;background:#111;z-index:0;display:flex;align-items:flex-start;padding-top:80px;justify-content:center;'><div style='background:rgba(187,153,0,0.1);border:1.5px dashed rgba(187,153,0,0.5);border-radius:12px;padding:24px 32px;text-align:center;'><div style='font-family:-apple-system,sans-serif;font-size:32px;margin-bottom:8px;'>📷</div><div style='font-family:-apple-system,sans-serif;font-size:22px;font-weight:700;color:#BB9900;'>Upload image</div></div></div>";
    const divider="<div style='position:absolute;left:"+HW+"px;top:0;width:3px;height:100%;background:"+AL+";z-index:1;opacity:0.5;'></div>";
    body="<div style='position:relative;width:"+W+"px;height:"+H+"px;background:#000;overflow:hidden;'>"
      +"<div style='position:absolute;top:0;left:0;width:"+HW+"px;height:"+H+"px;overflow:hidden;'>"+imgL+"</div>"
      +"<div style='position:absolute;top:0;left:"+HW+"px;width:"+HW+"px;height:"+H+"px;overflow:hidden;'>"+imgR+"</div>"
      +"<div style='position:absolute;inset:0;background:"+splitGrad+";z-index:2;'></div>"
      +divider
      +"<div style='position:absolute;bottom:470px;left:50%;transform:translateX(-50%);z-index:5;white-space:nowrap;'>"+badge(true)+"</div>"
      +"<div style='position:absolute;bottom:220px;left:"+SAFE+"px;width:"+(HW-SAFE-24)+"px;z-index:5;display:flex;flex-direction:column;align-items:center;text-align:center;justify-content:flex-start;overflow:hidden;height:220px;'>"
      +(slide.headline?"<div style='font-family:"+fontFamily+",sans-serif;font-size:96px;font-weight:900;line-height:1.1;text-transform:uppercase;word-break:break-word;text-align:center;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;"+effectCSS(effect,primary,secondary)+"'>"+esc(slide.headline.toUpperCase())+"</div>":"")
      +"</div>"
      +"<div style='position:absolute;bottom:220px;left:"+(HW+24)+"px;right:"+SAFE+"px;z-index:5;display:flex;flex-direction:column;align-items:center;text-align:center;justify-content:flex-start;overflow:hidden;height:220px;'>"
      +(slide.headline2?"<div style='font-family:"+fontFamily+",sans-serif;font-size:96px;font-weight:900;line-height:1.1;text-transform:uppercase;word-break:break-word;text-align:center;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;"+effectCSS(effect,primary,secondary)+"'>"+esc(slide.headline2.toUpperCase())+"</div>":"")
      +"</div>"
      +(slide.subline?"<div style='position:absolute;bottom:80px;left:"+SAFE+"px;width:"+(HW-SAFE-24)+"px;z-index:5;font-family:"+fontFamily+",sans-serif;font-size:48px;color:"+secondary+";line-height:1.3;text-align:center;overflow:hidden;height:130px;display:block;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;'>"+esc(slide.subline)+"</div>":"")
      +(slide.subline2?"<div style='position:absolute;bottom:80px;left:"+(HW+24)+"px;right:"+SAFE+"px;z-index:5;font-family:"+fontFamily+",sans-serif;font-size:48px;color:"+secondary+";line-height:1.3;text-align:center;overflow:hidden;height:130px;display:block;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;'>"+esc(slide.subline2)+"</div>":"")
      +website
      +(isCover?chevron:"")+counter+wm+"</div>";
  }
  return"<!DOCTYPE html><html><head><meta charset='UTF-8'><link href='"+gFonts+"' rel='stylesheet'><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased;}body{width:"+W+"px;height:"+H+"px;overflow:hidden;margin:0;padding:0;}</style></head><body>"+body+"</body></html>";
}

// ── buildCtaHTML — generates CTA final slide ──
export function buildCtaHTML(_c_opts,ctaType,keyword,line1,line2,line3,bg,nm,hdl,profUrl,showTick,font,total,showCounter){
  const W=1080,H=1350;
      const FONT_CSS_MAP={montserrat:"Montserrat",playfair:"Playfair Display",poppins:"Poppins",inter:"Inter",oswald:"Oswald",dancing:"Dancing Script",raleway:"Raleway",lato:"Lato",roboto:"Roboto",ubuntu:"Ubuntu",nunito:"Nunito",sourcesans:"Source Sans 3",crimson:"Crimson Text",merriweather:"Merriweather",bebasneue:"Bebas Neue",abril:"Abril Fatface",pacifico:"Pacifico",josefin:"Josefin Sans",quicksand:"Quicksand",dmserif:"DM Serif Display",cormorant:"Cormorant Garamond",righteous:"Righteous"};
  const fontFamily=(FONT_CSS_MAP[font]||font||"Bebas Neue").replace(/'/g,"");
  const gFonts="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Anton&family=Oswald:wght@700&family=Barlow+Condensed:wght@800;900&family=Archivo+Black&family=Playfair+Display:ital,wght@0,900;1,900&family=Alfa+Slab+One&family=Cormorant+Garamond:ital,wght@0,700;1,700&family=Josefin+Sans:wght@700&family=Raleway:wght@800;900&family=Quicksand:wght@700&family=Dancing+Script:wght@700&family=Inter:wght@400;600;700;800&display=swap";
  const isDark=bg==="dark"||bg==="black";
  const bgC=isDark?"#0a0a0a":"#ffffff";
  const textC=isDark?"#ffffff":"#0a0a0a";
  const mutedC=isDark?"rgba(255,255,255,0.55)":"rgba(0,0,0,0.5)";
  const accent=(_c_opts.accentLine||_c_opts.primary)||"#BB9900";
  function esc(s){return(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
  const tick=showTick?"<span style='display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#1D9BF0;border-radius:50%;margin-left:8px;vertical-align:middle;flex-shrink:0;'><span style='display:block;width:8px;height:5px;border-left:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(-45deg);margin-top:-2px;'></span></span>":"";
  const av=profUrl?"<img src='"+esc(profUrl)+"' style='width:100%;height:100%;object-fit:cover;border-radius:50%;'/>":"<div style='width:100%;height:100%;background:#4a6a9a;border-radius:50%;'></div>";
  const badge="<div style='display:flex;align-items:center;gap:18px;'><div style='width:90px;height:90px;border-radius:50%;overflow:hidden;border:3px solid "+(isDark?"#fff":"#ccc")+";flex-shrink:0;background:#4a6a9a;'>"+av+"</div><div style='display:flex;flex-direction:column;gap:4px;'><div style='display:flex;align-items:center;font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:36px;font-weight:800;color:"+textC+";'>"+esc(nm||"")+tick+"</div><div style='font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:28px;color:"+mutedC+";'>"+esc(hdl||"")+"</div></div></div>";
  const body="<div style='position:relative;width:"+W+"px;height:"+H+"px;background:"+bgC+";overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;'>"
    +"<div style='position:absolute;top:80px;left:60px;z-index:5;'>"+badge+"</div>"
    +"<div style='display:flex;flex-direction:column;align-items:center;text-align:center;gap:32px;padding:0 80px;margin-top:60px;'>"
    +"<p style='font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:44px;color:"+textC+";font-weight:600;line-height:1.3;margin:0;'>"+esc(line1)+"</p>"
    +"<div style='width:80px;height:4px;background:"+accent+";'></div>"
    +"<p style='font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:38px;color:"+mutedC+";line-height:1.3;margin:0;'>"+esc(line2)+"</p>"

    +"<p style='font-family:"+fontFamily+",sans-serif;font-size:160px;font-weight:900;color:"+accent+";line-height:0.9;margin:0;letter-spacing:4px;'>"+esc((keyword||"").toUpperCase())+"</p>"
    +"<div style='width:80px;height:4px;background:"+accent+";'></div>"
    +"<p style='font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:40px;color:"+mutedC+";line-height:1.4;margin:0;'>"+esc(line3)+"</p>"
    +"</div>"
    +"</div>"
    +(showCounter?"<div style='position:absolute;top:24px;right:40px;z-index:10;background:rgba(0,0,0,0.55);border-radius:6px;padding:6px 14px;font-size:22px;font-weight:700;color:#fff;'>"+total+"/"+total+"</div>":"")
    +(_c_opts.isFree?"<div style='position:absolute;bottom:16px;left:0;right:0;text-align:center;font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:22px;color:rgba(128,128,128,0.6);'>"+"studio.buildwithtav.co"+"</div>":(_c_opts.userWebsite?"<div style='position:absolute;bottom:16px;left:0;right:0;text-align:center;font-family:-apple-system,Helvetica Neue,Arial,sans-serif;font-size:22px;color:rgba(128,128,128,0.6);'>"+_c_opts.userWebsite+"</div>":""))+"</div>";
  return"<!DOCTYPE html><html><head><meta charset='UTF-8'><link href='"+gFonts+"' rel='stylesheet'><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased;}body{width:"+W+"px;height:"+H+"px;overflow:hidden;margin:0;padding:0;}</style></head><body>"+body+"</body></html>";
}
