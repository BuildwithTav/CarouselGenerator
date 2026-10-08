"use client";

import { useEffect, useState } from "react";
import { C, inp, lbl, card, btn, Chip, Spinner } from "./ui";

// The two ways the X tab teaches the generator, kept out of XTab.js so that
// file stays about the feed itself:
// - "Why I rejected": a reason picked when deleting a draft, stored in
//   content_feedback and fed into the next posts' and photos' prompts.
// - "Her look": starred reference photos the image model copies the woman
//   from, so it's the same hair, build, legs and feet every time.

export const REJECT_REASONS = ["Wrong setting", "Not slim / blonde", "Face showing", "Feet not perfect", "Hands or body wrong", "Looks fake / AI", "Caption off"];

// Asks why before deleting. "Reject & delete" saves the reason first (the
// feedback route reads the item's caption and photo prompt, so it has to
// exist when the reason is saved), then deletes.
export function RejectDialog({ api, item, onDone, onCancel }) {
  const [reasons, setReasons] = useState([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const toggle = (r) => setReasons((list) => (list.includes(r) ? list.filter((x) => x !== r) : [...list, r]));
  const hasReason = reasons.length > 0 || note.trim().length > 0;

  const finish = async (withReason) => {
    setBusy(withReason ? "reject" : "delete"); setErr("");
    try {
      if (withReason) await api.post("/api/feedback", { brandId: item.brand_id, itemId: item.id, reasons, note });
      await api.del("/api/content", { id: item.id });
      onDone(item.id);
    } catch (e) { setErr(e.message); setBusy(null); }
  };

  return (
    <div onClick={(e) => { e.stopPropagation(); if (!busy) onCancel(); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...card, width: "100%", maxWidth: 440, cursor: "default" }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Why are you rejecting this?</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>The AI reads your latest reasons every time it writes a post or a photo.</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {REJECT_REASONS.map((r) => <Chip key={r} active={reasons.includes(r)} onClick={() => toggle(r)}>{r}</Chip>)}
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything else? e.g. 'set on a bus', 'her toes looked wrong'" rows={2} style={{ ...inp, resize: "vertical", lineHeight: 1.5, marginBottom: 12 }} />
        {err && <div style={{ color: C.danger, fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => finish(true)} disabled={!!busy || !hasReason} style={btn("danger", { flex: 1, opacity: hasReason ? 1 : 0.5 })}>{busy === "reject" ? "…" : "Reject & delete"}</button>
          <button onClick={() => finish(false)} disabled={!!busy} style={btn("ghost")}>{busy === "delete" ? "…" : "Just delete"}</button>
          <button onClick={onCancel} disabled={!!busy} style={btn("ghost")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// The ★ under a post photo or library photo. `refs` is the brand's current
// list of reference rows; toggling reports the updated row back up.
export function RefStar({ api, storagePath, isRef, onChange, compact }) {
  const [busy, setBusy] = useState(false);
  const toggle = async (e) => {
    e.stopPropagation(); e.preventDefault();
    setBusy(true);
    try { const { media } = await api.patch("/api/brand-media", { storagePath, action: "set_reference", value: !isRef }); onChange?.(media); } catch (err) { alert(err.message); }
    setBusy(false);
  };
  return (
    <button onClick={toggle} disabled={busy} title={isRef ? "Stop using as a reference for her look" : "Use as a reference for her look"} style={btn("small", { fontSize: compact ? 10 : 11, padding: compact ? "4px 6px" : "5px 8px", background: isRef ? C.gold : C.surface, borderColor: isRef ? C.gold : C.border, color: isRef ? "#000" : C.text, opacity: busy ? 0.6 : 1 })}>
      {isRef ? "★ Her look" : "☆ Her look"}
    </button>
  );
}

function ago(ts) {
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
}

export function TeachPanel({ api, brand, refreshKey }) {
  const [open, setOpen] = useState(false);
  const [refs, setRefs] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [making, setMaking] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const [r, f] = await Promise.all([
        api.get(`/api/brand-media?brandId=${brand.id}&references=1`),
        api.get(`/api/feedback?brandId=${brand.id}`),
      ]);
      setRefs(r.media || []);
      setFeedback(f.feedback || []);
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { if (open) load(); }, [open, brand.id, refreshKey]);

  const onStar = (media) => {
    if (!media) return;
    setCandidates((list) => list.map((m) => (m.id === media.id ? { ...m, ...media } : m)));
    load();
  };

  const makeShots = async () => {
    setMaking(true); setErr("");
    try {
      const d = await api.post("/api/brand-media/reference-shots", { brandId: brand.id });
      setCandidates(d.media || []);
      if (d.errors?.length) setErr(`${d.errors.length} of 3 didn't come back: ${d.errors.join(" | ")}`);
    } catch (e) { setErr(e.message); }
    setMaking(false);
  };

  const removeFeedback = async (id) => {
    try { await api.del("/api/feedback", { id }); setFeedback((list) => list.filter((f) => f.id !== id)); } catch (e) { alert(e.message); }
  };

  const thumb = (m, isRef) => (
    <div key={m.id} style={{ flexShrink: 0, width: 96 }}>
      <a href={m.url} target="_blank" rel="noreferrer" style={{ display: "block", width: 96, aspectRatio: "1080/1350", borderRadius: 8, overflow: "hidden", border: `2px solid ${isRef ? C.gold : C.border}`, marginBottom: 4 }}>
        {m.url && <img src={m.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </a>
      <RefStar api={api} storagePath={m.storage_path} isRef={isRef} onChange={onStar} compact />
    </div>
  );

  return (
    <div style={{ ...card, marginBottom: 20 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", gap: 8, textAlign: "left", fontFamily: "inherit" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>Teach the AI</span>
        <span style={{ fontSize: 12, color: C.muted }}>{open ? "" : "her look · why you rejected posts"}</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: C.muted }}>{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div style={{ marginTop: 14 }}>
          {err && <div style={{ color: C.danger, fontSize: 12, marginBottom: 10 }}>{err}</div>}

          <label style={lbl}>Her look</label>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
            Every new photo copies her hair, build, legs and feet from the starred photos below (up to 4, newest first). Star photos that look exactly like her: here, under any X post's photo, or in Brand → Media library.
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, marginBottom: 10 }}>
            {refs.length === 0 && <div style={{ fontSize: 12, color: C.muted, padding: "8px 0" }}>No reference photos yet, so she's drawn from the written description only.</div>}
            {refs.map((m) => thumb(m, true))}
          </div>
          <button onClick={makeShots} disabled={making} style={btn("dark", { opacity: making ? 0.6 : 1, marginBottom: candidates.length ? 10 : 18 })}>
            {making ? <><Spinner /> Creating 3 shots… (about a minute)</> : "Create 3 reference shots of her (~$0.45)"}
          </button>
          {candidates.length > 0 && (
            <>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Star the ones that look right. Unstarred ones just stay in the media library.</div>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, marginBottom: 18 }}>
                {candidates.map((m) => thumb(m, !!m.is_reference))}
              </div>
            </>
          )}

          <label style={lbl}>Why you rejected posts</label>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>The latest 12 go to the AI every time it writes a post or a photo. Remove one once it's no longer a problem.</div>
          {feedback.length === 0 && <div style={{ fontSize: 12, color: C.muted }}>Nothing yet. When you delete a draft you'll be asked why.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {feedback.map((f, i) => (
              <div key={f.id} style={{ background: C.bg, borderRadius: 8, padding: "8px 10px", display: "flex", gap: 10, alignItems: "flex-start", opacity: i < 12 ? 1 : 0.5 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{(f.reasons || []).join(" · ") || "Note"}</div>
                  {f.note && <div style={{ fontSize: 12, marginTop: 2 }}>{f.note}</div>}
                  {f.caption && <div style={{ fontSize: 11, color: C.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Post: {f.caption}</div>}
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{ago(f.created_at)}{i >= 12 ? " · older, no longer sent" : ""}</div>
                </div>
                <button onClick={() => removeFeedback(f.id)} title="Remove" style={btn("small", { padding: "3px 8px", fontSize: 11 })}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
