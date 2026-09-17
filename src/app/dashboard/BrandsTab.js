"use client";

import { useEffect, useState } from "react";
import { C, inp, lbl, card, btn, Toggle, Chip, fmtSize } from "./ui";

const FONTS = ["Montserrat", "Inter", "Poppins", "Playfair Display", "Oswald", "Bebas Neue", "Cormorant Garamond"];
const PLATFORMS = [["instagram", "Instagram"], ["tiktok", "TikTok"], ["youtube", "YouTube"]];
const DEFAULT_THEME = { bg: "#0a0a0a", accent: "#C9A84C", text: "#ffffff", font: "Montserrat", handle: "", platforms: ["instagram", "tiktok", "youtube"] };

function useGoogleFont(font) {
  useEffect(() => {
    if (!font) return;
    const id = "dash-font-" + font.replace(/\s+/g, "-");
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, "+")}:wght@700;900&display=swap`;
    document.head.appendChild(link);
  }, [font]);
}

function SlidePreview({ theme, name }) {
  useGoogleFont(theme.font);
  return (
    <div style={{ width: 180, aspectRatio: "1080/1350", background: theme.bg, color: theme.text, borderRadius: 10, overflow: "hidden", position: "relative", fontFamily: `'${theme.font}',sans-serif`, padding: "26px 16px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "flex-end", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: theme.accent }} />
      <div style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.08, letterSpacing: -0.3 }}>Your hook headline goes here</div>
      <div style={{ fontSize: 7, fontWeight: 700, color: theme.accent, letterSpacing: 1, textTransform: "uppercase", marginTop: 10 }}>Swipe →</div>
      <div style={{ position: "absolute", left: 16, bottom: 10, fontSize: 7, fontWeight: 600, color: theme.accent }}>{theme.handle || name}</div>
    </div>
  );
}

function BrandForm({ brand, saving, onSave, onDelete }) {
  const [voice, setVoice] = useState(brand.voice || "");
  const [pillars, setPillars] = useState(brand.pillars || "");
  const [ctaRules, setCtaRules] = useState(brand.cta_rules || "");
  const [dailyTarget, setDailyTarget] = useState(brand.daily_target ?? 1);
  const [autoReady, setAutoReady] = useState(brand.automation_mode === "auto_ready");
  const [theme, setTheme] = useState({ ...DEFAULT_THEME, ...(brand.visual_theme || {}) });

  const original = JSON.stringify({ voice: brand.voice || "", pillars: brand.pillars || "", ctaRules: brand.cta_rules || "", dailyTarget: brand.daily_target ?? 1, autoReady: brand.automation_mode === "auto_ready", theme: { ...DEFAULT_THEME, ...(brand.visual_theme || {}) } });
  const dirty = original !== JSON.stringify({ voice, pillars, ctaRules, dailyTarget, autoReady, theme });
  const setT = (k, v) => setTheme((t) => ({ ...t, [k]: v }));
  const togglePlatform = (p) => setT("platforms", theme.platforms.includes(p) ? theme.platforms.filter((x) => x !== p) : [...theme.platforms, p]);

  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={lbl}>Voice & tone</label>
        <textarea value={voice} onChange={(e) => setVoice(e.target.value)} placeholder="How this brand sounds — tone, audience, what to avoid, sign-off." rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
      </div>
      <div>
        <label style={lbl}>Content pillars <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>(comma-separated — used for idea suggestions)</span></label>
        <textarea value={pillars} onChange={(e) => setPillars(e.target.value)} placeholder="e.g. Training tips, client wins, myth-busting" rows={2} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
      </div>
      <div>
        <label style={lbl}>CTA rules</label>
        <input value={ctaRules} onChange={(e) => setCtaRules(e.target.value)} placeholder="e.g. Always soft CTA — 'link in bio'. Sign off as — Tav" style={inp} />
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
        <label style={lbl}>Slide look</label>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <SlidePreview theme={theme} name={brand.name} />
          <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[["bg", "Background"], ["accent", "Accent"], ["text", "Text"]].map(([k, label]) => (
                <div key={k}>
                  <label style={{ ...lbl, marginBottom: 4 }}>{label}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="color" value={theme[k]} onChange={(e) => setT(k, e.target.value)} style={{ width: 34, height: 34, padding: 0, border: `1px solid ${C.border}`, borderRadius: 6, background: "none", cursor: "pointer" }} />
                    <input value={theme[k]} onChange={(e) => setT(k, e.target.value)} style={{ ...inp, padding: "6px 8px", fontSize: 12 }} />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <label style={{ ...lbl, marginBottom: 4 }}>Font</label>
              <select value={theme.font} onChange={(e) => setT("font", e.target.value)} style={inp}>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...lbl, marginBottom: 4 }}>Handle on slides</label>
              <input value={theme.handle} onChange={(e) => setT("handle", e.target.value)} placeholder="@yourhandle" style={inp} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
        <label style={lbl}>Platforms you post this brand to</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PLATFORMS.map(([id, label]) => <Chip key={id} active={theme.platforms.includes(id)} onClick={() => togglePlatform(id)}>{label}</Chip>)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "flex-end", borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>Daily target (posts per platform)</label>
          <input type="number" min={0} value={dailyTarget} onChange={(e) => setDailyTarget(Number(e.target.value) || 0)} style={inp} />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10 }}>
          <div><div style={{ fontWeight: 600, fontSize: 13 }}>Auto-ready</div><div style={{ color: C.muted, fontSize: 11 }}>Generated content goes straight to Today, no review</div></div>
          <Toggle on={autoReady} onClick={() => setAutoReady((a) => !a)} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
        <button onClick={() => onSave({ voice, pillars, cta_rules: ctaRules, daily_target: dailyTarget, automation_mode: autoReady ? "auto_ready" : "needs_review", visual_theme: theme })} disabled={saving || !dirty} style={btn("primary", { flex: 1, background: dirty ? C.gold : C.border, cursor: dirty ? "pointer" : "default", opacity: saving ? 0.6 : 1 })}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button onClick={onDelete} style={btn("danger")}>Delete brand</button>
      </div>
    </div>
  );
}

export function BrandsTab({ api, brands, activeId, setActiveId, onBrandsChange }) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [media, setMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sortMode, setSortMode] = useState("least_used");

  const activeBrand = brands.find((b) => b.id === activeId);

  const loadMedia = async (brandId) => {
    setMediaLoading(true);
    try { const d = await api.get(`/api/brand-media?brandId=${brandId}`); setMedia(d.media || []); } catch (e) { console.error(e); }
    setMediaLoading(false);
  };
  useEffect(() => { if (activeId) loadMedia(activeId); else setMedia([]); }, [activeId]);

  const createBrand = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { brand } = await api.post("/api/brands", { name: newName.trim(), slug, visual_theme: DEFAULT_THEME });
      onBrandsChange([...brands, brand]);
      setActiveId(brand.id);
      setNewName("");
    } catch (e) { alert(e.message); }
    setCreating(false);
  };

  const saveBrand = async (id, fields) => {
    setSaving(true);
    try {
      const { brand } = await api.patch("/api/brands", { id, ...fields });
      onBrandsChange(brands.map((b) => (b.id === id ? brand : b)));
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const deleteBrand = async (id) => {
    if (!window.confirm("Delete this brand, all its media and all its content? This can't be undone.")) return;
    try {
      await api.del("/api/brands", { id });
      const next = brands.filter((b) => b.id !== id);
      onBrandsChange(next);
      setActiveId(next[0]?.id || null);
    } catch (e) { alert(e.message); }
  };

  const uploadFiles = async (files) => {
    if (!activeId || !files?.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("brandId", activeId);
        fd.append("file", file);
        const d = await api.upload("/api/brand-media", fd);
        if (d.media) setMedia((m) => [d.media, ...m]);
      }
    } catch (e) { alert("Upload failed: " + e.message); }
    setUploading(false);
  };

  const deleteMedia = async (id, storagePath) => {
    if (!window.confirm("Delete this file?")) return;
    try { await api.del("/api/brand-media", { id, storagePath }); setMedia((m) => m.filter((x) => x.id !== id)); } catch (e) { alert(e.message); }
  };

  const setUsed = async (id, action) => {
    try { const d = await api.patch("/api/brand-media", { id, action }); if (d.media) setMedia((m) => m.map((x) => (x.id === id ? d.media : x))); } catch (e) { alert(e.message); }
  };

  const sortedMedia = [...media].sort((a, b) => sortMode === "least_used"
    ? (a.use_count || 0) - (b.use_count || 0) || new Date(b.uploaded_at) - new Date(a.uploaded_at)
    : new Date(b.uploaded_at) - new Date(a.uploaded_at));

  return (
    <div>
      <div style={{ ...card, marginBottom: 20 }}>
        <label style={lbl}>New brand</label>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createBrand()} placeholder="e.g. HealthCode Performance" style={{ ...inp, flex: 1 }} />
          <button onClick={createBrand} disabled={creating || !newName.trim()} style={btn("primary", { opacity: creating || !newName.trim() ? 0.5 : 1 })}>{creating ? "Creating…" : "Create"}</button>
        </div>
      </div>

      {activeBrand && <BrandForm key={activeBrand.id} brand={activeBrand} saving={saving} onSave={(f) => saveBrand(activeBrand.id, f)} onDelete={() => deleteBrand(activeBrand.id)} />}

      {activeBrand && (
        <div style={{ ...card, marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10 }}>
            <label style={{ ...lbl, margin: 0 }}>Media library — {activeBrand.name}</label>
            <label style={btn("dark", { opacity: uploading ? 0.6 : 1 })}>
              {uploading ? "Uploading…" : "Upload photos/video"}
              <input type="file" accept="image/*,video/*" multiple disabled={uploading} onChange={(e) => { const files = [...(e.target.files || [])]; e.target.value = ""; if (files.length) uploadFiles(files); }} style={{ display: "none" }} />
            </label>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10 }}>
            <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>Stored privately, full original quality. Photos can be used as carousel covers.</p>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {[["least_used", "Least used"], ["newest", "Newest"]].map(([id, label]) => (
                <button key={id} onClick={() => setSortMode(id)} style={btn("small", sortMode === id ? { background: C.gold, color: "#000", borderColor: C.gold } : {})}>{label}</button>
              ))}
            </div>
          </div>
          {mediaLoading ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>Loading…</div>
          ) : media.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>No media uploaded yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
              {sortedMedia.map((m) => (
                <div key={m.id} style={{ background: C.bg, border: `1px solid ${(m.use_count || 0) === 0 ? C.gold + "66" : C.border}`, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ width: "100%", aspectRatio: "1", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {m.file_type === "image" && m.url ? <img src={m.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : m.file_type === "video" && m.url ? <video src={m.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                      : <span style={{ color: C.muted, fontSize: 24 }}>📄</span>}
                  </div>
                  <div style={{ padding: 8 }}>
                    <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{m.original_filename || "file"}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: (m.use_count || 0) === 0 ? C.gold : C.muted }}>{(m.use_count || 0) === 0 ? "Never used" : `Used ${m.use_count}×`}</span>
                      <span style={{ fontSize: 9, color: C.muted }}>{fmtSize(m.size_bytes)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      <button onClick={() => setUsed(m.id, "mark_used")} style={btn("primary", { flex: 1, fontSize: 10, padding: "5px 0", borderRadius: 6 })}>Mark used</button>
                      {(m.use_count || 0) > 0 && <button onClick={() => setUsed(m.id, "unmark_used")} title="Undo last use" style={btn("small", { padding: "5px 8px", fontSize: 10, borderRadius: 6 })}>↺</button>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {m.url && <a href={m.url} download target="_blank" rel="noreferrer" style={{ ...btn("dark", { flex: 1, fontSize: 10, padding: "5px 0", borderRadius: 6 }), textAlign: "center", textDecoration: "none" }}>Download</a>}
                      <button onClick={() => deleteMedia(m.id, m.storage_path)} style={btn("danger", { flex: 1, fontSize: 10, padding: "5px 0", borderRadius: 6, borderWidth: 1 })}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
