"use client";

import { useEffect, useState } from "react";
import { C, inp, lbl, card, btn, Chip, Badge, STATUS_COLOR, Spinner, CopyButton } from "./ui";
import { PackageView, SlideStrip } from "./PackageView";
import { themeOf, itemTemplate, slideCanHaveImage, templateAllowsAiImage, slideText, TEMPLATES, PHOTO_SOURCES, defaultPhotoSource, itemPlatforms } from "@/lib/brandTemplate";

const today = () => new Date().toISOString().slice(0, 10);
const CAROUSEL_PLATFORMS = ["instagram", "tiktok", "youtube"];
// An item belongs in the Carousels queue if it's destined for at least one
// manual-post-elsewhere platform — a brand's regular carousel content still
// shows its X caption box too if twitter's also enabled for that brand (see
// itemPlatforms), it just isn't the X engine's own native post shape.
const isCarouselItem = (item, brand) => itemPlatforms(item, brand).some((p) => CAROUSEL_PLATFORMS.includes(p));

function splitPillars(s) {
  return String(s || "").split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
}

function NewContent({ api, brand, onCreated }) {
  const [idea, setIdea] = useState("");
  const [pillar, setPillar] = useState("");
  const [slideCount, setSlideCount] = useState(7);
  const [date, setDate] = useState(today());
  const [media, setMedia] = useState([]);
  const [mediaId, setMediaId] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [phase, setPhase] = useState(null); // writing | photo | rendering
  const [err, setErr] = useState("");
  const pillars = splitPillars(brand.pillars);
  // Each brand has exactly one template — it's not a per-post choice (see
  // brandTemplate.js's TEMPLATES comment), so this just reads the brand's own.
  const template = themeOf(brand).template;
  const [photoSource, setPhotoSource] = useState(defaultPhotoSource(template));
  const [progress, setProgress] = useState("");

  useEffect(() => {
    setMediaId(null); setIdeas([]); setPillar(""); setPhotoSource(defaultPhotoSource(themeOf(brand).template));
    api.get(`/api/brand-media?brandId=${brand.id}`).then((d) => setMedia((d.media || []).filter((m) => m.file_type === "image"))).catch(() => setMedia([]));
  }, [brand.id]);

  const suggest = async () => {
    setSuggesting(true); setErr("");
    try { const d = await api.post("/api/content/ideas", { brandId: brand.id, count: 10 }); setIdeas(d.ideas || []); } catch (e) { setErr(e.message); }
    setSuggesting(false);
  };

  const generate = async () => {
    if (!idea.trim()) return;
    setErr("");
    setPhase("writing");
    let item;
    try {
      ({ item } = await api.post("/api/content", { brandId: brand.id, idea: idea.trim(), pillar: pillar || null, mediaId, slideCount, scheduledFor: date, template, photoSource }));
    } catch (e) { setErr(e.message); setPhase(null); return; }
    // AI photos: one per slide that needs a photo and doesn't have one yet.
    if (photoSource === "ai") {
      setPhase("photo");
      const slides = item.slides.map((x) => ({ ...x }));
      const todo = slides.map((x, i) => i).filter((i) => slideCanHaveImage(template, i, slides[i]) && !slides[i].image_media_id);
      // Locked after the first photo and reused so every slide shows the same
      // recurring person — skipped for HealthCode, whose slides each suit a
      // different subject (food, an object, a person) rather than one
      // consistent model appearing throughout the set.
      const lockModel = template !== "healthcode";
      let modelNote = null;
      try {
        for (let n = 0; n < todo.length; n++) {
          const i = todo[n];
          setProgress(`${n + 1} of ${todo.length}`);
          const { media: m, modelNote: mn } = await api.post("/api/content/generate-image", { brandId: brand.id, slideText: slideText(slides[i]), idea: idea.trim(), style: "editorial", textZone: "bottom", modelNote: lockModel ? modelNote : null });
          if (mn && lockModel) modelNote = mn;
          slides[i] = { ...slides[i], image_media_id: m.id, image_path: m.storage_path };
          ({ item } = await api.patch("/api/content", { id: item.id, slides }));
        }
      } catch (e) {
        setErr("Slides and captions are done, but an AI photo failed: " + e.message + " — open the item and press Generate photo on the slides still missing one.");
        setPhase(null); setProgress(""); setIdea(""); onCreated(item); return;
      }
      setProgress("");
    }
    setPhase("rendering");
    try {
      ({ item } = await api.post("/api/content/render", { id: item.id }));
    } catch (e) {
      setErr("Copy is done but the slides didn't render: " + e.message + " — open the item and press Render slides to retry.");
    }
    setPhase(null);
    setIdea(""); setMediaId(null);
    onCreated(item);
  };

  const [advanced, setAdvanced] = useState(false);

  return (
    <div style={{ ...card, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: C.gold, color: "#000", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>1</span>
        <label style={{ ...lbl, margin: 0 }}>What's this about — {brand.name}</label>
        <div style={{ flex: 1 }} />
        <button onClick={suggest} disabled={suggesting} style={btn("ghost", { opacity: suggesting ? 0.6 : 1 })}>{suggesting ? <><Spinner /> Thinking…</> : "✨ Suggest ideas"}</button>
      </div>

      {ideas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {ideas.map((s, i) => (
            <button key={i} onClick={() => setIdea(s)} style={{ textAlign: "left", background: idea === s ? C.gold + "22" : C.bg, border: `1px solid ${idea === s ? C.gold : C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, cursor: "pointer", color: C.text, lineHeight: 1.4 }}>{s}</button>
          ))}
        </div>
      )}

      <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="One line is enough — e.g. '3 mistakes people make when they start…'" rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.6, marginBottom: 16 }} />

      <button type="button" onClick={() => setAdvanced((a) => !a)} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: advanced ? 12 : 16, display: "flex", alignItems: "center", gap: 4 }}>
        {advanced ? "▾" : "▸"} Customize {photoSource !== defaultPhotoSource(template) || pillar || slideCount !== 7 || mediaId ? "(changed)" : "(photos, pillar, slide count, date, cover)"}
      </button>

      {advanced && (
        <div style={{ background: C.bg, borderRadius: 10, padding: 14, marginBottom: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>Photos</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PHOTO_SOURCES.filter(([id]) => id !== "ai" || templateAllowsAiImage(template)).map(([id, label]) => <Chip key={id} active={photoSource === id} onClick={() => setPhotoSource(id)}>{label}</Chip>)}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
              {photoSource === "ai" ? "AI creates a photo for every slide, following the brand's photo direction (set in Brand)." : photoSource === "same" ? "One photo from your library goes on every slide (pick it below, or the least-used one is chosen)." : "Photos come from your library, least-used first, no repeats."}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
            {pillars.length > 0 && (
              <div>
                <label style={lbl}>Pillar</label>
                <select value={pillar} onChange={(e) => setPillar(e.target.value)} style={inp}>
                  <option value="">Any</option>
                  {pillars.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={lbl}>Slides</label>
              <select value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))} style={inp}>
                {[5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Post on</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} />
            </div>
          </div>

          {media.length > 0 && photoSource !== "ai" && (
            <div>
              <label style={lbl}>{photoSource === "same" ? "Photo for this set" : "Cover photo"} <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>(optional — least used first)</span></label>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {[...media].sort((a, b) => (a.use_count || 0) - (b.use_count || 0)).map((m) => (
                  <div key={m.id} onClick={() => setMediaId(mediaId === m.id ? null : m.id)} style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 8, overflow: "hidden", border: `2px solid ${mediaId === m.id ? C.gold : C.border}`, cursor: "pointer", position: "relative" }}>
                    <img src={m.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span style={{ position: "absolute", bottom: 2, right: 4, fontSize: 9, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px #000" }}>{m.use_count || 0}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {photoSource !== "ai" && media.length === 0 && <div style={{ fontSize: 12, color: C.danger }}>This brand has no photos yet — upload some in the Brand tab{templateAllowsAiImage(template) ? ", or switch Photos to AI" : ""}.</div>}
        </div>
      )}

      {err && <div style={{ color: C.danger, fontSize: 12, marginBottom: 10 }}>{err}</div>}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: C.gold, color: "#000", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>2</span>
        <label style={{ ...lbl, margin: 0 }}>Generate — {TEMPLATES.find((t) => t.id === template)?.label}</label>
      </div>
      <button onClick={generate} disabled={!!phase || !idea.trim()} style={btn("primary", { width: "100%", padding: 12, fontSize: 14, opacity: !idea.trim() ? 0.5 : 1 })}>
        {phase === "writing" ? <><Spinner /> Writing slides + captions…</> : phase === "photo" ? <><Spinner /> Creating AI photos… {progress}</> : phase === "rendering" ? <><Spinner /> Rendering slide images…</> : "Generate carousel + captions"}
      </button>
    </div>
  );
}

function SlideImage({ slide, idx, media, busy, onPick, onGenerate, label }) {
  const [picking, setPicking] = useState(false);
  const current = media.find((m) => m.id === slide.image_media_id);
  const sorted = [...media].sort((a, b) => (a.use_count || 0) - (b.use_count || 0));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: 44, aspectRatio: "1080/1350", borderRadius: 6, overflow: "hidden", background: C.bg, border: `1px solid ${slide.image_media_id ? C.border : C.danger}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {current?.url ? <img src={current.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 9, color: C.danger, textAlign: "center" }}>no photo</span>}
        </div>
        {label && <span style={{ fontSize: 12, color: C.muted }}>{label}</span>}
        <button type="button" onClick={() => setPicking((p) => !p)} style={btn("small")}>{slide.image_media_id ? "Change photo" : "Pick photo"}</button>
        {onGenerate && <button type="button" onClick={onGenerate} disabled={!!busy} style={btn("small", { color: C.gold, borderColor: C.gold + "88" })}>{busy === `image-${idx}` ? <><Spinner /> Generating…</> : slide.image_media_id ? "✨ Generate another (AI)" : "✨ Generate photo (AI)"}</button>}
      </div>
      {picking && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {sorted.length === 0 && <span style={{ fontSize: 12, color: C.muted }}>No photos in the library — generate one.</span>}
          {sorted.map((m) => (
            <div key={m.id} onClick={() => { onPick(m); setPicking(false); }} style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 6, overflow: "hidden", border: `2px solid ${slide.image_media_id === m.id ? C.gold : C.border}`, cursor: "pointer", position: "relative" }}>
              <img src={m.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <span style={{ position: "absolute", bottom: 1, right: 3, fontSize: 9, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px #000" }}>{m.use_count || 0}×</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Branded template items only — raw/dark-fade/clean-pro/bold are gone,
// elegant/healthcode are all that's left. An X-engine item never opens here:
// the "x-post" shape (raw text + photos, no template) has its own XPostEditor
// in XTab.js, and routing between the two is structural (which editor gets
// mounted), not a flag threaded through this one.
export function CarouselEditor({ api, itemId, onBack, onChanged }) {
  const [item, setItem] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(null);
  const [draft, setDraft] = useState(null);
  const [media, setMedia] = useState([]);

  const load = async () => {
    try {
      const { item } = await api.get(`/api/content?id=${itemId}`);
      setItem(item); setDraft(pick(item));
      api.get(`/api/brand-media?brandId=${item.brand_id}`).then((d) => setMedia((d.media || []).filter((m) => m.file_type === "image" && m.url))).catch(() => {});
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, [itemId]);

  function pick(i) {
    const template = itemTemplate(i, i.brands);
    return { idea: i.idea, scheduled_for: i.scheduled_for, template, slides: (i.slides || []).map((s) => ({ ...s })), caption: i.caption || "", tt_caption: i.tt_caption || "", tw_caption: i.tw_caption || "", yt_title: i.yt_title || "", yt_description: i.yt_description || "", yt_tags: (i.yt_tags || []).join(", "), yt_pinned_comment: i.yt_pinned_comment || "", yt_category: i.yt_category || "" };
  }
  const dirty = item && draft && JSON.stringify(pick(item)) !== JSON.stringify(draft);

  const run = async (label, fn) => {
    setBusy(label); setErr("");
    try { const { item: next } = await fn(); setItem(next); setDraft(pick(next)); onChanged?.(next); } catch (e) { setErr(e.message); }
    setBusy(null);
  };

  const save = () => run("save", () => api.patch("/api/content", {
    id: item.id, idea: draft.idea, scheduled_for: draft.scheduled_for, template: draft.template, slides: draft.slides, caption: draft.caption, tt_caption: draft.tt_caption, tw_caption: draft.tw_caption,
    yt_title: draft.yt_title, yt_description: draft.yt_description,
    yt_tags: draft.yt_tags.split(",").map((t) => t.trim()).filter(Boolean), yt_pinned_comment: draft.yt_pinned_comment, yt_category: draft.yt_category,
    hashtags: (draft.caption.match(/#[\w\d_]+/g) || []).slice(0, 5),
  }));
  const setStatus = (status) => run(status, () => api.patch("/api/content", { id: item.id, status }));
  // Writes an explicit platforms list onto the item itself (not just the
  // brand-inherited default itemPlatforms() computes for display) - the X
  // posting cron only picks up items with "twitter" actually stored on the
  // row, exactly the same tagging the X engine's own posts already carry.
  // Keeps every platform the item already had, just adds twitter to it.
  const sendToX = () => run("send-to-x", () => api.patch("/api/content", { id: item.id, platforms: Array.from(new Set([...itemPlatforms(item, item.brands), "twitter"])) }));
  const render = () => run("render", () => api.post("/api/content/render", { id: item.id }));
  const regen = (field) => run("regen-" + field, () => api.post("/api/content/regenerate", { id: item.id, field }));
  const del = async () => {
    if (!window.confirm("Delete this content and its slide images?")) return;
    try { await api.del("/api/content", { id: item.id }); onChanged?.(null, item.id); onBack(); } catch (e) { setErr(e.message); }
  };

  const generateImage = async (i) => {
    setBusy(`image-${i}`); setErr("");
    try {
      const s = draft.slides[i];
      const { media: m } = await api.post("/api/content/generate-image", { brandId: item.brand_id, slideText: slideText(s), idea: draft.idea, style: "editorial", textZone: "bottom" });
      setMedia((list) => [m, ...list]);
      setDraft((d) => ({ ...d, slides: d.slides.map((x, j) => (j === i ? { ...x, image_media_id: m.id, image_path: m.storage_path } : x)) }));
    } catch (e) { setErr(e.message); }
    setBusy(null);
  };

  if (err && !item) return <div style={{ ...card, color: C.danger }}>{err}</div>;
  if (!item || !draft) return <div style={{ textAlign: "center", padding: 40, color: C.muted }}><Spinner /> Loading…</div>;

  const template = draft.template;
  const setSlide = (i, k, v) => setDraft((d) => ({ ...d, slides: d.slides.map((s, j) => (j === i ? { ...s, [k]: v } : s)) }));
  const pickImage = (i, m) => setDraft((d) => ({ ...d, slides: d.slides.map((s, j) => (j === i ? { ...s, image_media_id: m.id, image_path: m.storage_path } : s)) }));
  const aiAllowed = templateAllowsAiImage(template);
  const stale = item.slide_paths?.length && JSON.stringify(item.slides) !== JSON.stringify(draft.slides);
  const platforms = itemPlatforms(item, item.brands);

  const slideFields = (s, i) => {
    if (s.isCta) return (
      <>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: 1 }}>CTA SLIDE</div>
        <input value={s.line1 || ""} onChange={(e) => setSlide(i, "line1", e.target.value)} placeholder="Line above the big word" style={inp} />
        <input value={s.line3 || ""} onChange={(e) => setSlide(i, "line3", e.target.value)} placeholder="Line below it" style={inp} />
      </>
    );
    return (
      <>
        <input value={s.kicker || ""} onChange={(e) => setSlide(i, "kicker", e.target.value)} placeholder="Kicker (small eyebrow label)" style={{ ...inp, fontSize: 12 }} />
        <input value={s.headline || ""} onChange={(e) => setSlide(i, "headline", e.target.value)} placeholder="Headline" style={{ ...inp, fontWeight: 700 }} />
        <textarea value={s.detail || ""} onChange={(e) => setSlide(i, "detail", e.target.value)} placeholder="Detail — the substance the reader stays for" rows={2} style={{ ...inp, fontSize: 13, resize: "vertical" }} />
      </>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={onBack} style={btn("ghost")}>← Back</button>
        <Badge color={STATUS_COLOR[item.status]}>{item.status}</Badge>
        <span style={{ fontSize: 12, color: C.muted }}>{item.brands?.name} · {TEMPLATES.find((t) => t.id === template)?.label || template}</span>
        <div style={{ flex: 1 }} />
        {item.status === "draft" && <button onClick={() => setStatus("ready")} disabled={!!busy} style={btn("primary")}>{busy === "ready" ? "…" : "Approve → Ready"}</button>}
        {item.status === "ready" && <button onClick={() => setStatus("draft")} disabled={!!busy} style={btn("ghost")}>Back to draft</button>}
        {item.status === "posted" && <button onClick={() => setStatus("ready")} disabled={!!busy} style={btn("ghost")}>Re-queue</button>}
      </div>

      {err && <div style={{ color: C.danger, fontSize: 12, marginBottom: 10 }}>{err}</div>}

      <div style={{ ...card, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={lbl}>Idea</label>
            <input value={draft.idea} onChange={(e) => setDraft((d) => ({ ...d, idea: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={lbl}>Post on</label>
            <input type="date" value={draft.scheduled_for} onChange={(e) => setDraft((d) => ({ ...d, scheduled_for: e.target.value }))} style={inp} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <label style={{ ...lbl, margin: 0 }}>Slides</label>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => regen("slides")} disabled={!!busy} style={btn("small")}>{busy === "regen-slides" ? <><Spinner /> Rewriting…</> : "↻ Rewrite slides"}</button>
            <button onClick={render} disabled={!!busy || dirty} title={dirty ? "Save first" : ""} style={btn("small", { background: C.gold, color: "#000", borderColor: C.gold, opacity: dirty ? 0.5 : 1 })}>{busy === "render" ? <><Spinner /> Rendering…</> : item.slide_paths?.length ? "Re-render images" : "Render images"}</button>
          </div>
        </div>
        {stale ? <div style={{ fontSize: 11, color: C.gold, marginBottom: 6 }}>Slides changed — save, then re-render to update the images.</div> : null}
        <SlideStrip item={item} size={84} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
          {draft.slides.map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 8, alignItems: "start" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, paddingTop: 12 }}>{i + 1}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {slideFields(s, i)}
                {slideCanHaveImage(template, i, s) && <SlideImage slide={s} idx={i} media={media} busy={busy} onPick={(m) => pickImage(i, m)} onGenerate={aiAllowed ? () => generateImage(i) : null} label={i === 0 ? "Cover photo" : "Slide photo"} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...card, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <label style={{ ...lbl, margin: 0 }}>Platform copy</label>
          <button onClick={() => regen("copy")} disabled={!!busy} style={btn("small")}>{busy === "regen-copy" ? <><Spinner /> Rewriting…</> : "↻ Rewrite all copy"}</button>
        </div>

        {platforms.includes("instagram") && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <label style={{ ...lbl, margin: 0 }}>Instagram caption</label>
              <CopyButton text={draft.caption} label="Copy" kind="small" />
            </div>
            <textarea value={draft.caption} onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))} rows={7} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
          </div>
        )}
        {platforms.includes("tiktok") && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <label style={{ ...lbl, margin: 0 }}>TikTok caption (short + 5 hashtags)</label>
              <CopyButton text={draft.tt_caption} label="Copy" kind="small" />
            </div>
            <textarea value={draft.tt_caption} onChange={(e) => setDraft((d) => ({ ...d, tt_caption: e.target.value }))} rows={4} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
          </div>
        )}
        {platforms.includes("twitter") && (() => {
          const queuedForX = Array.isArray(item.platforms) && item.platforms.includes("twitter");
          const tooManySlides = (item.slide_paths?.length || 0) > 4;
          return (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
              <label style={{ ...lbl, margin: 0 }}>X (Twitter) post <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500, color: C.muted }}>{queuedForX ? "(queued for X — posts same as the X tab's own items, up to 4 photos)" : tooManySlides ? `(${item.slide_paths.length} photos — over X's 4-photo limit, trim slides first)` : "(copy-paste, or send it into the X auto-post queue)"}</span></label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: draft.tw_caption.length > 280 ? C.danger : C.muted }}>{draft.tw_caption.length}/280</span>
                <CopyButton text={draft.tw_caption} label="Copy" kind="small" />
                {!queuedForX && (
                  <button onClick={sendToX} disabled={!!busy || tooManySlides} title={tooManySlides ? "Trim to 4 slides or fewer first" : ""} style={btn("primary", { fontSize: 11, padding: "5px 10px", opacity: tooManySlides ? 0.5 : 1 })}>
                    {busy === "send-to-x" ? "…" : "Send to X"}
                  </button>
                )}
              </div>
            </div>
            <textarea value={draft.tw_caption} onChange={(e) => setDraft((d) => ({ ...d, tw_caption: e.target.value }))} rows={4} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
          </div>
          );
        })()}
        {platforms.includes("youtube") && (
          <div>
            <label style={lbl}>YouTube</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={draft.yt_title} onChange={(e) => setDraft((d) => ({ ...d, yt_title: e.target.value }))} placeholder="Title" style={inp} />
              <textarea value={draft.yt_description} onChange={(e) => setDraft((d) => ({ ...d, yt_description: e.target.value }))} placeholder="Description (with hashtags)" rows={4} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
              <input value={draft.yt_tags} onChange={(e) => setDraft((d) => ({ ...d, yt_tags: e.target.value }))} placeholder="Tags, comma separated" style={inp} />
              <input value={draft.yt_pinned_comment} onChange={(e) => setDraft((d) => ({ ...d, yt_pinned_comment: e.target.value }))} placeholder="Pinned comment" style={inp} />
              <input value={draft.yt_category} onChange={(e) => setDraft((d) => ({ ...d, yt_category: e.target.value }))} placeholder="Category" style={inp} />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button onClick={save} disabled={!dirty || !!busy} style={btn("primary", { flex: 1, background: dirty ? C.gold : C.border, cursor: dirty ? "pointer" : "default" })}>{busy === "save" ? "Saving…" : dirty ? "Save changes" : "Saved"}</button>
        <button onClick={del} style={btn("danger")}>Delete</button>
      </div>

      <div style={card}>
        <label style={lbl}>Copy-paste package</label>
        <PackageView item={{ ...item, ...draft, yt_tags: draft.yt_tags.split(",").map((t) => t.trim()).filter(Boolean) }} platforms={platforms} />
      </div>
    </div>
  );
}

function QueueRow({ api, item, brand, onOpen, onChanged }) {
  const [marking, setMarking] = useState(null);
  const [busy, setBusy] = useState(false);
  const platforms = itemPlatforms(item, brand).filter((p) => CAROUSEL_PLATFORMS.includes(p));
  const remaining = platforms.filter((p) => !item[`posted_${p}_at`]);
  const done = item.status === "posted";

  const setStatus = async (status) => {
    setBusy(true);
    try { const { item: next } = await api.patch("/api/content", { id: item.id, status }); onChanged(next); } catch (e) { alert(e.message); }
    setBusy(false);
  };
  const markPosted = async (platform) => {
    setMarking(platform);
    try { const { item: next } = await api.patch("/api/content", { id: item.id, action: "mark_posted", platform }); onChanged(next); } catch (e) { alert(e.message); }
    setMarking(null);
  };
  const reschedule = async (e) => {
    const v = e.target.value;
    if (!v) return;
    setBusy(true);
    try { const { item: next } = await api.patch("/api/content", { id: item.id, scheduled_for: v }); onChanged(next); } catch (err) { alert(err.message); }
    setBusy(false);
  };
  const del = async () => {
    if (!window.confirm("Delete this content and its slide images?")) return;
    setBusy(true);
    try { await api.del("/api/content", { id: item.id }); onChanged(null, item.id); } catch (e) { alert(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ ...card, padding: 14 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }} onClick={onOpen}>
        <div style={{ width: 52, aspectRatio: "1080/1350", borderRadius: 6, background: C.bg, border: `1px solid ${C.border}`, overflow: "hidden", flexShrink: 0 }}>
          {item.thumb_url && <img src={item.thumb_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.idea}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <Badge color={STATUS_COLOR[item.status]}>{item.status}</Badge>
            {item.pillar && <Badge>{item.pillar}</Badge>}
            <span style={{ fontSize: 11, color: C.muted }}>{item.scheduled_for}</span>
            {!item.slide_paths?.length && <span style={{ fontSize: 11, color: C.danger }}>images not rendered</span>}
          </div>
        </div>
        <span style={{ color: C.muted }}>›</span>
      </div>
      {item.status === "draft" && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
          <button onClick={(e) => { e.stopPropagation(); setStatus("ready"); }} disabled={busy} style={btn("primary", { flex: 1 })}>{busy ? "…" : "Approve → Ready"}</button>
        </div>
      )}
      {item.status === "ready" && remaining.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, flexWrap: "wrap" }}>
          {remaining.map((p) => (
            <button key={p} onClick={(e) => { e.stopPropagation(); markPosted(p); }} disabled={marking === p} style={btn("ghost", { fontSize: 11, opacity: marking === p ? 0.5 : 1 })}>
              {marking === p ? "Saving…" : `✓ Posted on ${p === "instagram" ? "Instagram" : p === "tiktok" ? "TikTok" : "YouTube"}`}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
        {!done && <input type="date" value={item.scheduled_for} onChange={reschedule} disabled={busy} style={{ ...inp, width: "auto", padding: "4px 8px", fontSize: 11 }} />}
        <div style={{ flex: 1 }} />
        <button onClick={del} disabled={busy} style={btn("danger", { fontSize: 11, padding: "5px 10px" })}>Delete</button>
      </div>
    </div>
  );
}

export function CarouselsTab({ api, brands, activeId, setActiveId, openItemId, setOpenItemId, active }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const brand = brands.find((b) => b.id === activeId);

  const load = async () => {
    if (!activeId) return;
    setLoading(true);
    try { const d = await api.get(`/api/content?brandId=${activeId}`); setItems(d.items || []); } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { if (active) load(); }, [activeId, active]);

  const onChanged = (next, deletedId) => {
    if (deletedId) return setItems((list) => list.filter((i) => i.id !== deletedId));
    if (next) setItems((list) => list.some((i) => i.id === next.id) ? list.map((i) => (i.id === next.id ? next : i)) : [next, ...list]);
  };

  if (openItemId) return <CarouselEditor api={api} itemId={openItemId} onBack={() => setOpenItemId(null)} onChanged={onChanged} />;
  if (!brand) return <div style={{ ...card, color: C.muted, textAlign: "center" }}>Create a brand first in the Brand tab.</div>;

  const carouselItems = items.filter((i) => isCarouselItem(i, brand));
  const visible = carouselItems.filter((i) => filter === "all" || i.status === filter);

  return (
    <div>
      <NewContent api={api} brand={brand} onCreated={(item) => { onChanged(item); setOpenItemId(item.id); }} />

      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        {[["all", "All"], ["draft", "Drafts"], ["ready", "Ready"], ["posted", "Posted"]].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} style={btn("small", filter === id ? { background: C.text, color: C.accentText, borderColor: C.text } : {})}>{label}</button>
        ))}
        {loading && <Spinner />}
      </div>

      {visible.length === 0 && !loading && <div style={{ ...card, color: C.muted, textAlign: "center", fontSize: 13 }}>Nothing here yet.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.map((i) => (
          <QueueRow key={i.id} api={api} item={i} brand={brand} onOpen={() => setOpenItemId(i.id)} onChanged={onChanged} />
        ))}
      </div>
    </div>
  );
}
