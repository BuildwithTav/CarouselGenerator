"use client";

import { useEffect, useState } from "react";

const C = {
  bg: "#f5f3ef",
  surface: "#ffffff",
  border: "#e0ddd8",
  text: "#0a0a0a",
  muted: "#82807c",
  gold: "#C9A84C",
  accentText: "#ffffff",
};

const inp = {
  width: "100%",
  padding: "10px 12px",
  background: C.bg,
  border: `1.5px solid ${C.border}`,
  borderRadius: 8,
  color: C.text,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const lbl = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.muted, marginBottom: 6 };

function Toggle({ on, onClick }) {
  return (
    <div onClick={onClick} style={{ width: 40, height: 22, borderRadius: 11, background: on ? C.gold : C.border, position: "relative", cursor: "pointer", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.15s" }} />
    </div>
  );
}

function fmtSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function PassGate({ onUnlock }) {
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async () => {
    setChecking(true); setErr("");
    try {
      const res = await fetch("/api/dashboard-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passphrase: pass }) });
      const d = await res.json();
      if (d.ok) { localStorage.setItem("dash_key", pass); onUnlock(pass); }
      else setErr(d.error || "Wrong passphrase");
    } catch { setErr("Something went wrong — try again."); }
    setChecking(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "Plus Jakarta Sans,system-ui,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 4 }}>BUILD WITH TAV</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Content Dashboard</div>
        </div>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="Passphrase" autoFocus style={inp} />
        {err && <p style={{ color: "#e05252", fontSize: 12, margin: "8px 0 0" }}>{err}</p>}
        <button onClick={submit} disabled={checking || !pass} style={{ width: "100%", marginTop: 12, padding: "11px", background: C.gold, color: "#000", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: checking || !pass ? 0.6 : 1 }}>
          {checking ? "Checking…" : "Enter"}
        </button>
      </div>
    </div>
  );
}

function BrandForm({ brand, saving, onSave, onDelete }) {
  const [voice, setVoice] = useState(brand.voice || "");
  const [pillars, setPillars] = useState(brand.pillars || "");
  const [ctaRules, setCtaRules] = useState(brand.cta_rules || "");
  const [dailyTarget, setDailyTarget] = useState(brand.daily_target ?? 1);
  const [autoReady, setAutoReady] = useState(brand.automation_mode === "auto_ready");

  const dirty = voice !== (brand.voice || "") || pillars !== (brand.pillars || "") || ctaRules !== (brand.cta_rules || "") || dailyTarget !== (brand.daily_target ?? 1) || autoReady !== (brand.automation_mode === "auto_ready");

  return (
    <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={lbl}>Voice & tone</label>
        <textarea value={voice} onChange={e => setVoice(e.target.value)} placeholder="How this brand sounds — tone, audience, what to avoid." rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
      </div>
      <div>
        <label style={lbl}>Content pillars</label>
        <textarea value={pillars} onChange={e => setPillars(e.target.value)} placeholder="e.g. Training tips, client wins, myth-busting" rows={2} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
      </div>
      <div>
        <label style={lbl}>CTA rules</label>
        <input value={ctaRules} onChange={e => setCtaRules(e.target.value)} placeholder="e.g. Always soft CTA — 'link in bio'" style={inp} />
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>Daily target</label>
          <input type="number" min={0} value={dailyTarget} onChange={e => setDailyTarget(Number(e.target.value) || 0)} style={inp} />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10 }}>
          <div><div style={{ fontWeight: 600, fontSize: 13 }}>Auto-ready</div><div style={{ color: C.muted, fontSize: 11 }}>Skip manual review once generated</div></div>
          <Toggle on={autoReady} onClick={() => setAutoReady(a => !a)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
        <button onClick={() => onSave({ voice, pillars, cta_rules: ctaRules, daily_target: dailyTarget, automation_mode: autoReady ? "auto_ready" : "needs_review" })} disabled={saving || !dirty} style={{ flex: 1, padding: "10px", background: dirty ? C.gold : C.border, color: "#000", borderRadius: 8, fontWeight: 700, fontSize: 13, border: "none", cursor: dirty ? "pointer" : "default", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button onClick={onDelete} style={{ padding: "10px 16px", background: "none", border: `1.5px solid ${C.border}`, color: "#e05252", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Delete brand</button>
      </div>
    </div>
  );
}

function Dashboard({ dashKey, onLock }) {
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [media, setMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sortMode, setSortMode] = useState("least_used");

  const headers = { "x-dashboard-key": dashKey };

  const loadBrands = async () => {
    setBrandsLoading(true);
    try {
      const res = await fetch("/api/brands", { headers });
      if (res.status === 403) { onLock(); return; }
      const d = await res.json();
      if (d.brands) { setBrands(d.brands); if (!activeId && d.brands.length) setActiveId(d.brands[0].id); }
    } catch (e) { console.error(e); }
    setBrandsLoading(false);
  };

  const loadMedia = async (brandId) => {
    setMediaLoading(true);
    try {
      const res = await fetch(`/api/brand-media?brandId=${brandId}`, { headers });
      const d = await res.json();
      if (d.media) setMedia(d.media);
    } catch (e) { console.error(e); }
    setMediaLoading(false);
  };

  useEffect(() => { loadBrands(); }, []);
  useEffect(() => { if (activeId) loadMedia(activeId); }, [activeId]);

  const createBrand = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const res = await fetch("/api/brands", { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ name: newName.trim(), slug }) });
      const d = await res.json();
      if (d.brand) { setBrands(b => [...b, d.brand]); setActiveId(d.brand.id); setNewName(""); }
      else if (d.error) alert(d.error);
    } catch (e) { console.error(e); alert("Could not create brand."); }
    setCreating(false);
  };

  const saveBrand = async (id, fields) => {
    setSaving(true);
    try {
      const res = await fetch("/api/brands", { method: "PATCH", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ id, ...fields }) });
      const d = await res.json();
      if (d.brand) setBrands(list => list.map(b => b.id === id ? d.brand : b));
    } catch (e) { console.error(e); alert("Could not save brand."); }
    setSaving(false);
  };

  const deleteBrand = async (id) => {
    if (!window.confirm("Delete this brand and all its media? This can't be undone.")) return;
    try {
      await fetch("/api/brands", { method: "DELETE", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      setBrands(list => list.filter(b => b.id !== id));
      if (activeId === id) { setActiveId(null); setMedia([]); }
    } catch (e) { console.error(e); alert("Could not delete brand."); }
  };

  const uploadFiles = async (files) => {
    if (!activeId || !files?.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("brandId", activeId);
        fd.append("file", file);
        const res = await fetch("/api/brand-media", { method: "POST", headers, body: fd });
        const d = await res.json();
        if (d.media) setMedia(m => [d.media, ...m]);
      }
    } catch (e) { console.error(e); alert("Upload failed for one or more files."); }
    setUploading(false);
  };

  const deleteMedia = async (id, storagePath) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      await fetch("/api/brand-media", { method: "DELETE", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ id, storagePath }) });
      setMedia(m => m.filter(x => x.id !== id));
    } catch (e) { console.error(e); alert("Could not delete file."); }
  };

  const setUsed = async (id, action) => {
    try {
      const res = await fetch("/api/brand-media", { method: "PATCH", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
      const d = await res.json();
      if (d.media) setMedia(m => m.map(x => x.id === id ? d.media : x));
    } catch (e) { console.error(e); alert("Could not update use count."); }
  };

  const activeBrand = brands.find(b => b.id === activeId);
  const sortedMedia = [...media].sort((a, b) => sortMode === "least_used"
    ? (a.use_count || 0) - (b.use_count || 0) || new Date(b.uploaded_at) - new Date(a.uploaded_at)
    : new Date(b.uploaded_at) - new Date(a.uploaded_at));

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Plus Jakarta Sans,system-ui,sans-serif" }}>
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: C.gold }}>BUILD WITH TAV</div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Content Dashboard</div>
        </div>
        <button onClick={() => { localStorage.removeItem("dash_key"); onLock(); }} style={{ background: "none", border: `1.5px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Lock</button>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {brands.map(b => (
            <button key={b.id} onClick={() => setActiveId(b.id)} style={{ background: activeId === b.id ? C.gold : C.surface, border: `1.5px solid ${activeId === b.id ? C.gold : C.border}`, borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: 700, color: activeId === b.id ? "#000" : C.text, cursor: "pointer" }}>{b.name}</button>
          ))}
          {brandsLoading && <span style={{ color: C.muted, fontSize: 12, alignSelf: "center" }}>Loading…</span>}
        </div>

        <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <label style={lbl}>New brand</label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && createBrand()} placeholder="e.g. HealthCode Performance" style={{ ...inp, flex: 1 }} />
            <button onClick={createBrand} disabled={creating || !newName.trim()} style={{ padding: "8px 18px", background: C.gold, color: "#000", borderRadius: 8, fontWeight: 700, fontSize: 12, border: "none", whiteSpace: "nowrap", opacity: creating || !newName.trim() ? 0.5 : 1 }}>{creating ? "Creating…" : "Create"}</button>
          </div>
        </div>

        {activeBrand && (
          <BrandForm key={activeBrand.id} brand={activeBrand} saving={saving} onSave={fields => saveBrand(activeBrand.id, fields)} onDelete={() => deleteBrand(activeBrand.id)} />
        )}

        {activeBrand && (
          <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 20, marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <label style={{ ...lbl, margin: 0 }}>Media library — {activeBrand.name}</label>
              <label style={{ padding: "7px 16px", background: C.text, color: C.accentText, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: uploading ? 0.6 : 1 }}>
                {uploading ? "Uploading…" : "Upload photos/video"}
                <input type="file" accept="image/*,video/*" multiple disabled={uploading} onChange={e => { const files = [...(e.target.files || [])]; e.target.value = ""; if (files.length) uploadFiles(files); }} style={{ display: "none" }} />
              </label>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p style={{ color: C.muted, fontSize: 11, margin: 0 }}>Stored privately, full original quality — nothing is recompressed on upload.</p>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {[["least_used", "Least used"], ["newest", "Newest"]].map(([id, label]) => (
                  <button key={id} onClick={() => setSortMode(id)} style={{ fontSize: 10, fontWeight: 700, padding: "5px 10px", background: sortMode === id ? C.gold : "none", color: sortMode === id ? "#000" : C.muted, border: `1px solid ${sortMode === id ? C.gold : C.border}`, borderRadius: 6, cursor: "pointer" }}>{label}</button>
                ))}
              </div>
            </div>
            {mediaLoading ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>Loading…</div>
            ) : media.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>No media uploaded yet.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
                {sortedMedia.map(m => (
                  <div key={m.id} style={{ background: C.bg, border: `1px solid ${(m.use_count||0)===0?C.gold+"66":C.border}`, borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ width: "100%", aspectRatio: "1", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {m.file_type === "image" && m.url
                        ? <img src={m.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : m.file_type === "video" && m.url
                          ? <video src={m.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                          : <span style={{ color: C.muted, fontSize: 24 }}>📄</span>}
                    </div>
                    <div style={{ padding: 8 }}>
                      <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{m.original_filename || "file"}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: (m.use_count||0)===0?C.gold:C.muted }}>{(m.use_count||0)===0?"Never used":`Used ${m.use_count}×`}</span>
                        <span style={{ fontSize: 9, color: C.muted }}>{fmtSize(m.size_bytes)}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                        <button onClick={() => setUsed(m.id, "mark_used")} style={{ flex: 1, fontSize: 10, fontWeight: 700, padding: "5px 0", background: C.gold, color: "#000", border: "none", borderRadius: 6, cursor: "pointer" }}>Mark used</button>
                        {(m.use_count||0)>0 && <button onClick={() => setUsed(m.id, "unmark_used")} title="Undo last use" style={{ fontSize: 10, fontWeight: 700, padding: "5px 8px", background: "none", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, cursor: "pointer" }}>↺</button>}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {m.url && <a href={m.url} download target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: "center", fontSize: 10, fontWeight: 700, padding: "5px 0", background: C.text, color: C.accentText, borderRadius: 6, textDecoration: "none" }}>Download</a>}
                        <button onClick={() => deleteMedia(m.id, m.storage_path)} style={{ flex: 1, fontSize: 10, fontWeight: 700, padding: "5px 0", background: "none", border: `1px solid ${C.border}`, color: "#e05252", borderRadius: 6, cursor: "pointer" }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [dashKey, setDashKey] = useState(undefined); // undefined = not checked yet, null = locked

  useEffect(() => {
    try { setDashKey(localStorage.getItem("dash_key") || null); } catch { setDashKey(null); }
  }, []);

  if (dashKey === undefined) return null;
  if (!dashKey) return <PassGate onUnlock={setDashKey} />;
  return <Dashboard dashKey={dashKey} onLock={() => setDashKey(null)} />;
}
