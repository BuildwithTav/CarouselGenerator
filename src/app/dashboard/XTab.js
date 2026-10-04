"use client";

import { useEffect, useState } from "react";
import { C, inp, lbl, card, btn, Badge, STATUS_COLOR, Spinner, CopyButton } from "./ui";
import { CarouselEditor } from "./CarouselsTab";
import { itemPlatforms, THEME_DEFAULTS } from "@/lib/brandTemplate";

// X posts itself (cron, 3x/day) or on a manual "Post now" click — nothing
// about it is copy-paste-somewhere-else like Instagram/TikTok/YouTube, so it
// gets its own feed here rather than sharing the Carousels queue. An item
// belongs in this feed purely by destination (itemPlatforms includes
// "twitter"), regardless of whether its shape is a raw X post or a full
// branded carousel that also happens to go out on X.
const POST_WINDOWS_UTC = ["09:00", "13:00", "18:00"];
const BATCH_TIME_UTC = "07:00";

function nextWindow() {
  const now = new Date();
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  for (const w of POST_WINDOWS_UTC) {
    const [h, m] = w.split(":").map(Number);
    if (h * 60 + m > mins) return `${w} UTC today`;
  }
  return `${POST_WINDOWS_UTC[0]} UTC tomorrow`;
}

// Raw X posts only: 0-4 photos attached as-is, no template, no slide fields —
// the caption is the whole post. A full branded carousel going to X opens in
// CarouselEditor instead (see XTab's open-item routing below).
function XPostEditor({ api, itemId, onBack, onChanged }) {
  const [item, setItem] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(null);
  const [caption, setCaption] = useState("");

  const load = async () => {
    try {
      const { item } = await api.get(`/api/content?id=${itemId}`);
      setItem(item);
      setCaption(item.tw_caption || "");
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, [itemId]);

  if (err && !item) return <div style={{ ...card, color: C.danger }}>{err}</div>;
  if (!item) return <div style={{ textAlign: "center", padding: 40, color: C.muted }}><Spinner /> Loading…</div>;

  const dirty = caption !== (item.tw_caption || "");
  const run = async (label, fn) => {
    setBusy(label); setErr("");
    try { const { item: next } = await fn(); setItem(next); setCaption(next.tw_caption || ""); onChanged?.(next); } catch (e) { setErr(e.message); }
    setBusy(null);
  };
  const save = () => run("save", () => api.patch("/api/content", { id: item.id, tw_caption: caption }));
  const setStatus = (status) => run(status, () => api.patch("/api/content", { id: item.id, status }));
  const postNow = () => run("post", () => api.post("/api/content/post-now", { id: item.id }));
  const del = async () => {
    if (!window.confirm("Delete this X post?")) return;
    try { await api.del("/api/content", { id: item.id }); onChanged?.(null, item.id); onBack(); } catch (e) { setErr(e.message); }
  };

  const photos = item.slide_urls || [];
  const m = item.x_metrics;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={onBack} style={btn("ghost")}>← Back</button>
        <Badge color={STATUS_COLOR[item.status]}>{item.status}</Badge>
        <span style={{ fontSize: 12, color: C.muted }}>{item.brands?.name} · {item.pillar || "X post"}</span>
        <div style={{ flex: 1 }} />
        {item.status === "draft" && <button onClick={() => setStatus("ready")} disabled={!!busy} style={btn("primary")}>{busy === "ready" ? "…" : "Approve → Ready"}</button>}
        {item.status === "ready" && <button onClick={() => setStatus("draft")} disabled={!!busy} style={btn("ghost")}>Back to draft</button>}
      </div>

      {err && <div style={{ color: C.danger, fontSize: 12, marginBottom: 10 }}>{err}</div>}

      <div style={{ ...card, marginBottom: 14 }}>
        <label style={{ ...lbl, marginBottom: 8, display: "block" }}>Photos {photos.length ? `(${photos.length})` : "— none, text-only post"}</label>
        {photos.length > 0 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 4 }}>
            {photos.map((u, i) => (
              <a key={i} href={u} target="_blank" rel="noreferrer" style={{ flexShrink: 0, width: 110, aspectRatio: "1080/1350", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, display: "block" }}>
                <img src={u} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </a>
            ))}
          </div>
        )}
        <div style={{ fontSize: 11, color: C.muted }}>Generated to match exactly what the post text describes — no swap-in picker here yet; delete and regenerate the batch if a photo's wrong.</div>
      </div>

      <div style={{ ...card, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <label style={{ ...lbl, margin: 0 }}>Post text</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: caption.length > 280 ? C.danger : C.muted }}>{caption.length}/280</span>
            <CopyButton text={caption} label="Copy" kind="small" />
          </div>
        </div>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={5} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
      </div>

      {m && (
        <div style={{ ...card, marginBottom: 14, display: "flex", gap: 18, fontSize: 13 }}>
          <div><b>{m.like_count ?? 0}</b> <span style={{ color: C.muted }}>likes</span></div>
          <div><b>{m.reply_count ?? 0}</b> <span style={{ color: C.muted }}>replies</span></div>
          <div><b>{m.retweet_count ?? 0}</b> <span style={{ color: C.muted }}>reposts</span></div>
          <div><b>{m.impression_count ?? 0}</b> <span style={{ color: C.muted }}>views</span></div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={save} disabled={!dirty || !!busy} style={btn("primary", { flex: 1, background: dirty ? C.gold : C.border, cursor: dirty ? "pointer" : "default" })}>{busy === "save" ? "Saving…" : dirty ? "Save changes" : "Saved"}</button>
        {!item.posted_twitter_at && (
          <button onClick={postNow} disabled={!!busy || dirty} title={dirty ? "Save first" : ""} style={btn("dark", { opacity: dirty ? 0.5 : 1 })}>{busy === "post" ? <><Spinner /> Posting…</> : "Post now →"}</button>
        )}
        <button onClick={del} style={btn("danger")}>Delete</button>
      </div>
      {item.posted_twitter_at && <div style={{ fontSize: 12, color: C.ok, marginTop: 10 }}>Posted to X {new Date(item.posted_twitter_at).toLocaleString()}</div>}
    </div>
  );
}

// A row that says "1 photo" or "4 photos" but has no thumb_url means the
// slide_paths it's carrying don't actually resolve to a real file in storage
// (a failed/partial generation that still got inserted) — show that clearly
// rather than quietly falling back to a "text" label as if nothing's wrong.
function XRow({ api, item, onOpen, onChanged }) {
  const m = item.x_metrics;
  const [busy, setBusy] = useState(null);
  const hasPhotos = (item.slide_paths?.length || 0) > 0;
  const photoBroken = hasPhotos && !item.thumb_url;
  const posted = !!item.posted_twitter_at;

  const run = async (label, fn) => {
    setBusy(label);
    try { const { item: next } = await fn(); onChanged(next); } catch (e) { alert(e.message); }
    setBusy(null);
  };
  const setStatus = (e, status) => { e.stopPropagation(); run(status, () => api.patch("/api/content", { id: item.id, status })); };
  const reschedule = (e) => { e.stopPropagation(); const v = e.target.value; if (v) run("date", () => api.patch("/api/content", { id: item.id, scheduled_for: v })); };
  const del = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this X post?")) return;
    setBusy("delete");
    try { await api.del("/api/content", { id: item.id }); onChanged(null, item.id); } catch (err) { alert(err.message); }
    setBusy(null);
  };

  return (
    <div style={{ ...card, padding: 14 }}>
      <div onClick={onOpen} style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
        <div style={{ width: 52, aspectRatio: "1080/1350", borderRadius: 6, background: C.bg, border: `1px solid ${photoBroken ? C.danger : C.border}`, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {item.thumb_url ? <img src={item.thumb_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : photoBroken ? <span style={{ fontSize: 9, color: C.danger, textAlign: "center", padding: "0 2px" }}>photo missing</span> : <span style={{ fontSize: 9, color: C.muted }}>text</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.tw_caption || item.idea}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <Badge color={STATUS_COLOR[item.status]}>{item.status}</Badge>
            <Badge color={item.template === "x-post" ? C.muted : C.gold}>{item.template === "x-post" ? (hasPhotos ? `${item.slide_paths.length} photo${item.slide_paths.length > 1 ? "s" : ""}` : "text") : "carousel"}</Badge>
            {photoBroken && <Badge color={C.danger}>photo missing</Badge>}
            <span style={{ fontSize: 11, color: C.muted }}>{item.scheduled_for}</span>
            {m && <span style={{ fontSize: 11, color: C.muted }}>❤ {m.like_count ?? 0} · 👁 {m.impression_count ?? 0}</span>}
          </div>
        </div>
        <span style={{ color: C.muted }}>›</span>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
        {item.status === "draft" && <button onClick={(e) => setStatus(e, "ready")} disabled={!!busy} style={btn("primary", { fontSize: 11, padding: "5px 10px" })}>{busy === "ready" ? "…" : "Approve"}</button>}
        {item.status === "ready" && !posted && <button onClick={(e) => setStatus(e, "draft")} disabled={!!busy} style={btn("ghost", { fontSize: 11, padding: "5px 10px" })}>{busy === "draft" ? "…" : "Pause — don't post"}</button>}
        {!posted && (
          <input type="date" value={item.scheduled_for} onClick={(e) => e.stopPropagation()} onChange={reschedule} disabled={!!busy} style={{ ...inp, width: "auto", padding: "4px 8px", fontSize: 11 }} />
        )}
        <div style={{ flex: 1 }} />
        <button onClick={del} disabled={!!busy} style={btn("danger", { fontSize: 11, padding: "5px 10px" })}>{busy === "delete" ? "…" : "Delete"}</button>
      </div>
    </div>
  );
}

export function XTab({ api, brands, activeId, setActiveId, openItemId, setOpenItemId, active, onBrandsChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  const generateBatch = async () => {
    setGenerating(true);
    try {
      const { results } = await api.post("/api/cron/x-content", { brandId: activeId });
      const r = results?.[0];
      const queued = r?.queued ?? 0;
      alert(r?.error ? `Queued ${queued} as drafts. Some slots failed: ${r.error}` : queued ? `Queued ${queued} X post${queued === 1 ? "" : "s"} as drafts — review and approve below.` : "Nothing queued.");
      load();
    } catch (e) { alert(e.message); }
    setGenerating(false);
  };

  const refreshStats = async () => {
    setRefreshing(true);
    try {
      const d = await api.post("/api/x/stats", { brandId: activeId });
      onBrandsChange(brands.map((b) => (b.id === activeId ? { ...b, x_followers: d.followers, x_followers_prev: d.followersPrev } : b)));
      load();
    } catch (e) { alert(e.message); }
    setRefreshing(false);
  };

  if (openItemId) {
    const openItem = items.find((i) => i.id === openItemId);
    // Falls back to the raw editor while the item is still loading (we don't
    // know its shape yet) — both editors load the item themselves regardless.
    if (openItem && openItem.template !== "x-post") {
      return <CarouselEditor api={api} itemId={openItemId} onBack={() => setOpenItemId(null)} onChanged={onChanged} />;
    }
    return <XPostEditor api={api} itemId={openItemId} onBack={() => setOpenItemId(null)} onChanged={onChanged} />;
  }
  if (!brand) return <div style={{ ...card, color: C.muted, textAlign: "center" }}>Create a brand first in the Brand tab.</div>;
  const brandPlatforms = brand.visual_theme?.platforms?.length ? brand.visual_theme.platforms : THEME_DEFAULTS.platforms;
  if (!brandPlatforms.includes("twitter")) {
    return <div style={{ ...card, color: C.muted, textAlign: "center" }}>X isn't enabled for {brand.name} yet — turn it on in the Brand tab's Voice &amp; Platforms section.</div>;
  }

  const xItems = items.filter((i) => itemPlatforms(i, brand).includes("twitter"));
  const visible = xItems.filter((i) => filter === "all" || i.status === filter);
  const queuedReady = xItems.filter((i) => i.status === "ready" && !i.posted_twitter_at).length;
  const followerDelta = brand.x_followers != null && brand.x_followers_prev != null ? brand.x_followers - brand.x_followers_prev : null;

  return (
    <div>
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>Automation</div>
            <div style={{ fontSize: 13 }}>Next batch written <b>{BATCH_TIME_UTC} UTC</b> · next posting window <b>{nextWindow()}</b> · <b>{queuedReady}</b> queued and ready</div>
          </div>
          <button onClick={generateBatch} disabled={generating} style={btn("primary", { opacity: generating ? 0.6 : 1 })}>{generating ? <><Spinner /> Generating…</> : "✨ Generate today's batch"}</button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          <div style={{ fontSize: 13 }}>
            {brand.x_followers != null ? (
              <><b>{brand.x_followers.toLocaleString()}</b> <span style={{ color: C.muted }}>followers</span> {followerDelta != null && followerDelta !== 0 && <span style={{ color: followerDelta > 0 ? C.ok : C.danger, fontWeight: 700 }}> {followerDelta > 0 ? "+" : ""}{followerDelta} today</span>}</>
            ) : <span style={{ color: C.muted }}>Follower count not synced yet.</span>}
          </div>
          <button onClick={refreshStats} disabled={refreshing} style={btn("small", { opacity: refreshing ? 0.6 : 1 })}>{refreshing ? "Refreshing…" : "↻ Refresh stats"}</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        {[["all", "All"], ["draft", "Drafts"], ["ready", "Ready"], ["posted", "Posted"]].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} style={btn("small", filter === id ? { background: C.text, color: C.accentText, borderColor: C.text } : {})}>{label}</button>
        ))}
        {loading && <Spinner />}
      </div>

      {visible.length === 0 && !loading && <div style={{ ...card, color: C.muted, textAlign: "center", fontSize: 13 }}>Nothing here yet — generate today's batch above.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.map((i) => <XRow key={i.id} api={api} item={i} onOpen={() => setOpenItemId(i.id)} onChanged={onChanged} />)}
      </div>
    </div>
  );
}
