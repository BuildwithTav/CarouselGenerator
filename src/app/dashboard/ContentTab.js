"use client";

import { useEffect, useState } from "react";
import { C, inp, lbl, card, btn, Chip, Badge, STATUS_COLOR, Spinner, CopyButton } from "./ui";
import { PackageView, SlideStrip } from "./PackageView";
import { themeOf, itemTemplate, slideCanHaveImage, templateAllowsAiImage, TEMPLATES } from "@/lib/brandTemplate";

const today = () => new Date().toISOString().slice(0, 10);

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
  const [template, setTemplate] = useState(themeOf(brand).template);

  useEffect(() => {
    setMediaId(null); setIdeas([]); setPillar(""); setTemplate(themeOf(brand).template);
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
      ({ item } = await api.post("/api/content", { brandId: brand.id, idea: idea.trim(), pillar: pillar || null, mediaId, slideCount, scheduledFor: date, template }));
    } catch (e) { setErr(e.message); setPhase(null); return; }
    // Clean Pro: the cover gets a hyper-realistic AI photo unless you picked one.
    if (template === "clean-pro" && !item.slides?.[0]?.image_media_id) {
      setPhase("photo");
      try {
        const cover = item.slides[0];
        const { media: m } = await api.post("/api/content/generate-image", { brandId: brand.id, slideText: [cover.headline, cover.subline].filter(Boolean).join(" — "), idea: idea.trim(), style: "editorial" });
        const slides = item.slides.map((s, i) => (i === 0 ? { ...s, image_media_id: m.id, image_path: m.storage_path } : s));
        ({ item } = await api.patch("/api/content", { id: item.id, slides }));
      } catch (e) {
        setErr("Slides and captions are done, but the AI cover photo failed: " + e.message + " — open the item and press Generate photo to retry.");
        setPhase(null); setIdea(""); onCreated(item); return;
      }
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

  return (
    <div style={{ ...card, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 10 }}>
        <label style={{ ...lbl, margin: 0 }}>New content — {brand.name}</label>
        <button onClick={suggest} disabled={suggesting} style={btn("ghost", { opacity: suggesting ? 0.6 : 1 })}>{suggesting ? <><Spinner /> Thinking…</> : "✨ Suggest ideas"}</button>
      </div>

      {ideas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {ideas.map((s, i) => (
            <button key={i} onClick={() => setIdea(s)} style={{ textAlign: "left", background: idea === s ? C.gold + "22" : C.bg, border: `1px solid ${idea === s ? C.gold : C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, cursor: "pointer", color: C.text, lineHeight: 1.4 }}>{s}</button>
          ))}
        </div>
      )}

      <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="What's this post about? One line is enough — e.g. '3 mistakes people make when they start…'" rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.6, marginBottom: 12 }} />

      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>Template <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>(the look for each is set in Brands)</span></label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TEMPLATES.map((t) => <Chip key={t.id} active={template === t.id} onClick={() => setTemplate(t.id)}>{t.label}</Chip>)}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{TEMPLATES.find((t) => t.id === template)?.desc}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 12 }}>
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

      {media.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>{template === "raw" ? "Photo for this set" : "Cover photo"} <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>({template === "raw" ? "goes on every slide — " : ""}optional, least used first{template === "clean-pro" ? " — leave empty and an AI photo is created for the cover" : ""})</span></label>
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

      {template === "raw" && media.length === 0 && <div style={{ fontSize: 12, color: C.danger, marginBottom: 10 }}>Raw needs one of your photos for the set — upload some to this brand's library first (Brands tab).</div>}
      {err && <div style={{ color: C.danger, fontSize: 12, marginBottom: 10 }}>{err}</div>}

      <button onClick={generate} disabled={!!phase || !idea.trim()} style={btn("primary", { width: "100%", padding: 12, fontSize: 14, opacity: !idea.trim() ? 0.5 : 1 })}>
        {phase === "writing" ? <><Spinner /> Writing slides + captions…</> : phase === "photo" ? <><Spinner /> Creating the AI cover photo…</> : phase === "rendering" ? <><Spinner /> Rendering slide images…</> : "Generate carousel + captions"}
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
        {onGenerate && <button type="button" onClick={onGenerate} disabled={!!busy} style={btn("small", { color: C.gold, borderColor: C.gold + "88" })}>{busy === `image-${idx}` ? <><Spinner /> Generating…</> : "✨ Generate photo (AI)"}</button>}
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

function slideTextOf(s) {
  return s.rawText || [s.headline, s.subline, s.bodyText || s.body, s.accentText].filter(Boolean).join(" — ");
}

function Editor({ api, itemId, onBack, onChanged }) {
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
    return { idea: i.idea, scheduled_for: i.scheduled_for, slides: (i.slides || []).map((s) => ({ ...s })), caption: i.caption || "", tt_caption: i.tt_caption || "", yt_title: i.yt_title || "", yt_description: i.yt_description || "", yt_tags: (i.yt_tags || []).join(", "), yt_pinned_comment: i.yt_pinned_comment || "", yt_category: i.yt_category || "" };
  }
  const dirty = item && draft && JSON.stringify(pick(item)) !== JSON.stringify(draft);

  const run = async (label, fn) => {
    setBusy(label); setErr("");
    try { const { item: next } = await fn(); setItem(next); setDraft(pick(next)); onChanged?.(next); } catch (e) { setErr(e.message); }
    setBusy(null);
  };

  const save = () => run("save", () => api.patch("/api/content", {
    id: item.id, idea: draft.idea, scheduled_for: draft.scheduled_for, slides: draft.slides, caption: draft.caption, tt_caption: draft.tt_caption,
    yt_title: draft.yt_title, yt_description: draft.yt_description,
    yt_tags: draft.yt_tags.split(",").map((t) => t.trim()).filter(Boolean), yt_pinned_comment: draft.yt_pinned_comment, yt_category: draft.yt_category,
    hashtags: (draft.caption.match(/#[\w\d_]+/g) || []).slice(0, 5),
  }));
  const setStatus = (status) => run(status, () => api.patch("/api/content", { id: item.id, status }));
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
      const { media: m } = await api.post("/api/content/generate-image", { brandId: item.brand_id, slideText: slideTextOf(s), idea: draft.idea, style: "editorial" });
      setMedia((list) => [m, ...list]);
      setDraft((d) => ({ ...d, slides: d.slides.map((x, j) => (j === i ? { ...x, image_media_id: m.id, image_path: m.storage_path } : x)) }));
    } catch (e) { setErr(e.message); }
    setBusy(null);
  };

  if (err && !item) return <div style={{ ...card, color: C.danger }}>{err}</div>;
  if (!item || !draft) return <div style={{ textAlign: "center", padding: 40, color: C.muted }}><Spinner /> Loading…</div>;

  const template = itemTemplate(item, item.brands);
  const setSlide = (i, k, v) => setDraft((d) => ({ ...d, slides: d.slides.map((s, j) => (j === i ? { ...s, [k]: v } : s)) }));
  const pickImage = (i, m) => setDraft((d) => ({ ...d, slides: d.slides.map((s, j) => (j === i ? { ...s, image_media_id: m.id, image_path: m.storage_path } : s)) }));
  // Raw is one photo set: the same photo goes on every slide.
  const pickSetImage = (m) => setDraft((d) => ({ ...d, slides: d.slides.map((s) => (s.isCta ? s : { ...s, image_media_id: m.id, image_path: m.storage_path })) }));
  const aiAllowed = templateAllowsAiImage(template);
  const stale = item.slide_paths?.length && JSON.stringify(item.slides) !== JSON.stringify(draft.slides);
  const platforms = item.brands?.visual_theme?.platforms?.length ? item.brands.visual_theme.platforms : ["instagram", "tiktok", "youtube"];

  const slideFields = (s, i) => {
    if (s.isCta) return (
      <>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: 1 }}>CTA SLIDE</div>
        <input value={s.line1 || ""} onChange={(e) => setSlide(i, "line1", e.target.value)} placeholder="Line above the big word" style={inp} />
        <input value={s.line3 || ""} onChange={(e) => setSlide(i, "line3", e.target.value)} placeholder="Line below it" style={inp} />
      </>
    );
    if (template === "raw") return <textarea value={s.rawText || ""} onChange={(e) => setSlide(i, "rawText", e.target.value)} placeholder={i === 0 ? "Scroll-stopper — 3 to 7 words" : "One or two short lines"} rows={2} style={{ ...inp, fontWeight: 700, resize: "vertical" }} />;
    if (template === "clean-pro") return (
      <>
        <input value={s.headline || ""} onChange={(e) => setSlide(i, "headline", e.target.value)} placeholder="Headline" style={{ ...inp, fontWeight: 700 }} />
        {i === 0
          ? <input value={s.subline || ""} onChange={(e) => setSlide(i, "subline", e.target.value)} placeholder="Subline" style={{ ...inp, fontSize: 13 }} />
          : <>
              <textarea value={s.bodyText || ""} onChange={(e) => setSlide(i, "bodyText", e.target.value)} placeholder="Body — the fact or insight" rows={2} style={{ ...inp, fontSize: 13, resize: "vertical" }} />
              <input value={s.accentText || ""} onChange={(e) => setSlide(i, "accentText", e.target.value)} placeholder="Punchline (accent colour)" style={{ ...inp, fontSize: 13 }} />
            </>}
      </>
    );
    return (
      <>
        <input value={s.headline || ""} onChange={(e) => setSlide(i, "headline", e.target.value)} placeholder="Headline" style={{ ...inp, fontWeight: 700 }} />
        {(i > 0) && <textarea value={s.body || ""} onChange={(e) => setSlide(i, "body", e.target.value)} placeholder="Body (optional)" rows={2} style={{ ...inp, fontSize: 13, resize: "vertical" }} />}
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
        {item.status === "draft" && <button onClick={() => setStatus("ready")} disabled={!!busy} style={btn("primary")}>{busy === "ready" ? "…" : "Approve → Today"}</button>}
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
        {template === "raw" && draft.slides[0] && (
          <div style={{ marginTop: 10, padding: 10, background: C.bg, borderRadius: 8 }}>
            <SlideImage slide={draft.slides[0]} idx={0} media={media} busy={busy} onPick={pickSetImage} label="Photo for this set (every slide)" />
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
          {draft.slides.map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 8, alignItems: "start" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, paddingTop: 12 }}>{i + 1}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {slideFields(s, i)}
                {template !== "raw" && slideCanHaveImage(template, i, s) && <SlideImage slide={s} idx={i} media={media} busy={busy} onPick={(m) => pickImage(i, m)} onGenerate={aiAllowed ? () => generateImage(i) : null} label={i === 0 ? "Cover photo" : null} />}
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
        <label style={lbl}>Copy-paste package (as it'll appear in Today)</label>
        <PackageView item={{ ...item, ...draft, yt_tags: draft.yt_tags.split(",").map((t) => t.trim()).filter(Boolean) }} platforms={platforms} />
      </div>
    </div>
  );
}

export function ContentTab({ api, brands, activeId, setActiveId, openItemId, setOpenItemId }) {
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
  useEffect(() => { load(); }, [activeId]);

  const onChanged = (next, deletedId) => {
    if (deletedId) return setItems((list) => list.filter((i) => i.id !== deletedId));
    if (next) setItems((list) => list.some((i) => i.id === next.id) ? list.map((i) => (i.id === next.id ? next : i)) : [next, ...list]);
  };

  if (openItemId) return <Editor api={api} itemId={openItemId} onBack={() => setOpenItemId(null)} onChanged={onChanged} />;
  if (!brand) return <div style={{ ...card, color: C.muted, textAlign: "center" }}>Create a brand first in the Brands tab.</div>;

  const visible = items.filter((i) => filter === "all" || i.status === filter);

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
          <div key={i.id} onClick={() => setOpenItemId(i.id)} style={{ ...card, padding: 14, display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
            <div style={{ width: 52, aspectRatio: "1080/1350", borderRadius: 6, background: C.bg, border: `1px solid ${C.border}`, overflow: "hidden", flexShrink: 0 }}>
              {i.thumb_url && <img src={i.thumb_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.idea}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <Badge color={STATUS_COLOR[i.status]}>{i.status}</Badge>
                {i.pillar && <Badge>{i.pillar}</Badge>}
                <span style={{ fontSize: 11, color: C.muted }}>{i.scheduled_for}</span>
                {!i.slide_paths?.length && <span style={{ fontSize: 11, color: C.danger }}>images not rendered</span>}
              </div>
            </div>
            <span style={{ color: C.muted }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}
