"use client";

import { useEffect, useRef, useState } from "react";
import { C, inp, lbl, card, btn, Badge, STATUS_COLOR, Spinner, CopyButton } from "./ui";
import { CarouselEditor } from "./CarouselsTab";
import { itemPlatforms, THEME_DEFAULTS } from "@/lib/brandTemplate";
import { RejectDialog, RefStar, TeachPanel } from "./TeachAi";

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

// What this tab shows has to be whether X itself has posted the item, not
// its overall status — that only reaches "posted" once every platform the
// item targets (Instagram/TikTok/YouTube included, for a brand's regular
// carousel content that also goes to X) is separately marked done. A post
// that's live on X but still waiting on Instagram is posted, as far as X
// is concerned, and the X tab needs to say so.
function xStatus(item) {
  if (item.posted_twitter_at) return "posted";
  return item.status === "ready" ? "ready" : "draft";
}

function tweetUrl(item) {
  return item.twitter_post_id ? `https://x.com/i/status/${item.twitter_post_id}` : null;
}

// Which X account the dashboard posts as, a red warning when posting has
// stopped, and "Reconnect X": X's own sign-in page, then the short code it
// shows, typed here. Nothing to copy into Vercel.
function XLogin({ api, brandId }) {
  const [status, setStatus] = useState(null);
  const [link, setLink] = useState(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    try { setStatus(await api.get(`/api/x/connect?brandId=${brandId}`)); } catch (e) { setErr(e.message); }
  };
  useEffect(() => { setLink(null); setCode(""); setErr(""); load(); }, [brandId]);

  const start = async () => {
    setBusy(true); setErr("");
    try { const { authorizeUrl } = await api.post("/api/x/connect", { brandId, step: "start" }); setLink(authorizeUrl); setCode(""); } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const finish = async () => {
    setBusy(true); setErr("");
    try { await api.post("/api/x/connect", { brandId, step: "finish", pin: code }); setLink(null); setCode(""); await load(); } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const failing = status?.failing;
  return (
    <div style={{ ...card, marginBottom: 14, padding: 14, ...(failing ? { background: C.danger + "14", borderColor: C.danger } : {}) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13 }}>
          {failing
            ? <><div style={{ fontWeight: 800, color: C.danger }}>{failing.loggedOut ? "X has logged the dashboard out, so nothing is posting" : "The last post to X failed"}</div><div style={{ fontSize: 12, color: C.muted }}>{new Date(failing.at).toLocaleString()} · {failing.message}</div></>
            : <>X account: <b>{status?.screenName ? `@${status.screenName}` : "connected with the original keys"}</b>{status?.connectedAt && <span style={{ color: C.muted }}> · reconnected {new Date(status.connectedAt).toLocaleDateString()}</span>}</>}
        </div>
        {!link && <button onClick={start} disabled={busy} style={btn(failing ? "dark" : "small")}>{busy ? "…" : "Reconnect X"}</button>}
      </div>
      {link && (
        <div style={{ marginTop: 10, fontSize: 13 }}>
          <div style={{ marginBottom: 8 }}>1. <a href={link} target="_blank" rel="noreferrer" style={{ color: C.text, fontWeight: 800 }}>Open X and press Authorize app →</a> (be logged in as the Sky High Soles account)</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span>2. Type the code X shows:</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="1234567" style={{ ...inp, width: 130, padding: "6px 10px" }} />
            <button onClick={finish} disabled={busy || !code.trim()} style={btn("primary")}>{busy ? "…" : "Connect"}</button>
            <button onClick={() => { setLink(null); setErr(""); }} disabled={busy} style={btn("ghost")}>Cancel</button>
          </div>
        </div>
      )}
      {err && <div style={{ color: C.danger, fontSize: 12, marginTop: 8 }}>{err}</div>}
    </div>
  );
}

function Choice({ label, value, options, onPick, hint }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700 }}>{label}:</span>
      {options.map(([v, text]) => (
        <button key={text} onClick={() => onPick(v)} disabled={value === v} style={btn("small", value === v ? { background: C.text, color: C.accentText, borderColor: C.text } : {})}>{text}</button>
      ))}
      <span style={{ fontSize: 11, color: C.muted }}>{hint}</span>
    </div>
  );
}

// ChatGPT saves big PNGs and a request to the site can carry ~4.5MB, so a
// photo Tav uploads is shrunk to a JPEG in the browser before it's sent.
async function toJpeg(file, maxSide = 2048, quality = 0.9) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("That file isn't a photo this browser can open"));
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) throw new Error("Couldn't prepare the photo — try again");
    return new File([blob], "chatgpt.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Raw X posts only: 0-4 photos attached as-is, no template, no slide fields —
// the caption is the whole post. A full branded carousel going to X opens in
// CarouselEditor instead (see XTab's open-item routing below).
function XPostEditor({ api, itemId, onBack, onChanged }) {
  const [item, setItem] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(null);
  const [caption, setCaption] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [refPaths, setRefPaths] = useState(new Set());
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const { item } = await api.get(`/api/content?id=${itemId}`);
      setItem(item);
      setCaption(item.tw_caption || "");
      if (item.slide_paths?.length) {
        const { media } = await api.get(`/api/brand-media?brandId=${item.brand_id}&references=1`);
        setRefPaths(new Set((media || []).map((m) => m.storage_path)));
      }
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
  // Photo actions keep any unsaved edit to the post text.
  const runPhoto = async (label, fn) => {
    setBusy(label); setErr("");
    try { const { item: next } = await fn(); setItem(next); onChanged?.(next); } catch (e) { setErr(e.message); }
    setBusy(null);
  };
  const attach = (file) => file && runPhoto("upload", async () => {
    const form = new FormData();
    form.append("id", item.id);
    form.append("file", await toJpeg(file));
    return api.upload("/api/content/x-photo", form);
  });
  const makeWithAi = () => runPhoto("ai", () => api.post("/api/content/x-photo", { id: item.id }));
  const blockPost = dirty ? "Save first" : item.needs_photo ? "Add the photo first" : item.brands?.x_auto_post_paused ? "Auto-posting is paused" : "";
  const onStar = (media) => {
    if (!media) return;
    setRefPaths((set) => {
      const next = new Set(set);
      if (media.is_reference) next.add(media.storage_path); else next.delete(media.storage_path);
      return next;
    });
  };

  const photos = item.slide_urls || [];
  const m = item.x_metrics;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={onBack} style={btn("ghost")}>← Back</button>
        <Badge color={STATUS_COLOR[xStatus(item)]}>{xStatus(item)}</Badge>
        <span style={{ fontSize: 12, color: C.muted }}>{item.brands?.name} · {item.pillar || "X post"}</span>
        <div style={{ flex: 1 }} />
        {item.status === "draft" && (item.needs_photo
          ? <span style={{ fontSize: 12, color: C.muted }}>Add the photo to approve</span>
          : <button onClick={() => setStatus("ready")} disabled={!!busy} style={btn("primary")}>{busy === "ready" ? "…" : "Approve → Ready"}</button>)}
        {item.status === "ready" && <button onClick={() => setStatus("draft")} disabled={!!busy} style={btn("ghost")}>Back to draft</button>}
      </div>

      {err && <div style={{ color: C.danger, fontSize: 12, marginBottom: 10 }}>{err}</div>}

      {item.check_notes?.length > 0 && (
        <div style={{ ...card, marginBottom: 14, background: C.danger + "10", borderColor: C.danger + "66" }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: C.danger, marginBottom: 2 }}>Check this photo</div>
          <div style={{ fontSize: 12 }}>The photo check couldn't get it right in 2 tries and kept the better one: {item.check_notes.join(" · ").replace(/Check this: /g, "")}.</div>
        </div>
      )}

      {(photos.length > 0 || !item.photo_prompt) && <div style={{ ...card, marginBottom: 14 }}>
        <label style={{ ...lbl, marginBottom: 8, display: "block" }}>Photos {photos.length ? `(${photos.length})` : "— none, text-only post"}</label>
        {photos.length > 0 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 4 }}>
            {photos.map((u, i) => (
              <div key={i} style={{ flexShrink: 0, width: 110 }}>
                <a href={u} target="_blank" rel="noreferrer" style={{ width: 110, aspectRatio: "1080/1350", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, display: "block", marginBottom: 4 }}>
                  <img src={u} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </a>
                {item.slide_paths?.[i] && <RefStar api={api} storagePath={item.slide_paths[i]} isRef={refPaths.has(item.slide_paths[i])} onChange={onStar} compact />}
              </div>
            ))}
          </div>
        )}
        {!item.photo_prompt && <div style={{ fontSize: 11, color: C.muted }}>Generated to match exactly what the post text describes. If she looks exactly right, star it (☆ Her look) and new photos will copy her from it. If it's wrong, Delete and say why.</div>}
      </div>}

      {item.photo_prompt && !item.posted_twitter_at && (
        <div style={{ ...card, marginBottom: 14, ...(item.needs_photo ? { borderColor: C.gold } : {}) }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ ...lbl, margin: 0 }}>{item.needs_photo ? "Make the photo in ChatGPT" : "ChatGPT request"}</label>
            <CopyButton text={item.photo_prompt} label="Copy" kind="small" />
          </div>
          <textarea readOnly value={item.photo_prompt} rows={6} style={{ ...inp, resize: "vertical", lineHeight: 1.5, fontSize: 13 }} />
          <div style={{ fontSize: 11, color: C.muted, margin: "6px 0 10px" }}>Paste it into ChatGPT and change anything you like there. Use the same ChatGPT chat every time so she looks the same.</div>
          <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { attach(e.target.files?.[0]); e.target.value = ""; }} style={{ display: "none" }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => fileRef.current?.click()} disabled={!!busy} style={btn("primary")}>{busy === "upload" ? <><Spinner /> Uploading…</> : item.needs_photo ? "Upload photo" : "Replace photo"}</button>
            {item.needs_photo && <button onClick={makeWithAi} disabled={!!busy} style={btn("ghost")}>{busy === "ai" ? <><Spinner /> Making photo… (1-2 min)</> : "Make it with AI instead (about $0.08)"}</button>}
          </div>
        </div>
      )}

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

      {item.brands?.x_auto_post_paused && !item.posted_twitter_at && <div style={{ fontSize: 12, color: C.danger, marginBottom: 10 }}>Auto-posting is paused for this brand — resume it from the X tab to post.</div>}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={save} disabled={!dirty || !!busy} style={btn("primary", { flex: 1, background: dirty ? C.gold : C.border, cursor: dirty ? "pointer" : "default" })}>{busy === "save" ? "Saving…" : dirty ? "Save changes" : "Saved"}</button>
        {!item.posted_twitter_at && (
          <button onClick={postNow} disabled={!!busy || !!blockPost} title={blockPost} style={btn("dark", { opacity: blockPost ? 0.5 : 1 })}>{busy === "post" ? <><Spinner /> Posting…</> : "Post now →"}</button>
        )}
        <button onClick={() => setRejecting(true)} style={btn("danger")}>Delete</button>
      </div>
      {rejecting && <RejectDialog api={api} item={item} onCancel={() => setRejecting(false)} onDone={(id) => { onChanged?.(null, id); onBack(); }} />}
      {item.posted_twitter_at && (
        <div style={{ fontSize: 12, color: C.ok, marginTop: 10 }}>
          Posted to X {new Date(item.posted_twitter_at).toLocaleString()}
          {tweetUrl(item) && <> · <a href={tweetUrl(item)} target="_blank" rel="noreferrer" style={{ color: C.ok, fontWeight: 700 }}>View on X →</a></>}
        </div>
      )}
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
  const [rejecting, setRejecting] = useState(false);
  const hasPhotos = (item.slide_paths?.length || 0) > 0;
  const photoBroken = hasPhotos && !item.thumb_url;
  const posted = !!item.posted_twitter_at;
  const kind = item.template !== "x-post" ? "carousel" : hasPhotos ? `${item.slide_paths.length} photo${item.slide_paths.length > 1 ? "s" : ""}` : item.needs_photo ? "needs photo" : "text";

  const run = async (label, fn) => {
    setBusy(label);
    try { const { item: next } = await fn(); onChanged(next); } catch (e) { alert(e.message); }
    setBusy(null);
  };
  const setStatus = (e, status) => { e.stopPropagation(); run(status, () => api.patch("/api/content", { id: item.id, status })); };
  const reschedule = (e) => { e.stopPropagation(); const v = e.target.value; if (v) run("date", () => api.patch("/api/content", { id: item.id, scheduled_for: v })); };
  const del = (e) => { e.stopPropagation(); setRejecting(true); };

  return (
    <div style={{ ...card, padding: 14 }}>
      <div onClick={onOpen} style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
        <div style={{ width: 52, aspectRatio: "1080/1350", borderRadius: 6, background: C.bg, border: `1px solid ${photoBroken ? C.danger : C.border}`, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {item.thumb_url ? <img src={item.thumb_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : photoBroken ? <span style={{ fontSize: 9, color: C.danger, textAlign: "center", padding: "0 2px" }}>photo missing</span> : item.needs_photo ? <span style={{ fontSize: 9, color: C.gold, fontWeight: 700, textAlign: "center", padding: "0 2px" }}>add photo</span> : <span style={{ fontSize: 9, color: C.muted }}>text</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.tw_caption || item.idea}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <Badge color={STATUS_COLOR[xStatus(item)]}>{xStatus(item)}</Badge>
            <Badge color={item.template !== "x-post" || item.needs_photo ? C.gold : C.muted}>{kind}</Badge>
            {photoBroken && <Badge color={C.danger}>photo missing</Badge>}
            {item.check_notes?.length > 0 && <Badge color={C.danger}>check this</Badge>}
            <span style={{ fontSize: 11, color: C.muted }}>{item.scheduled_for}</span>
            {m && <span style={{ fontSize: 11, color: C.muted }}>❤ {m.like_count ?? 0} · 👁 {m.impression_count ?? 0}</span>}
            {tweetUrl(item) && <a href={tweetUrl(item)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ fontSize: 11, color: C.ok, fontWeight: 700 }}>View on X →</a>}
          </div>
        </div>
        <span style={{ color: C.muted }}>›</span>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
        {item.status === "draft" && !item.needs_photo && <button onClick={(e) => setStatus(e, "ready")} disabled={!!busy} style={btn("primary", { fontSize: 11, padding: "5px 10px" })}>{busy === "ready" ? "…" : "Approve"}</button>}
        {item.status === "draft" && item.needs_photo && <button onClick={onOpen} style={btn("ghost", { fontSize: 11, padding: "5px 10px" })}>Add photo</button>}
        {item.status === "ready" && !posted && <button onClick={(e) => setStatus(e, "draft")} disabled={!!busy} style={btn("ghost", { fontSize: 11, padding: "5px 10px" })}>{busy === "draft" ? "…" : "Pause — don't post"}</button>}
        {!posted && (
          <input type="date" value={item.scheduled_for} onClick={(e) => e.stopPropagation()} onChange={reschedule} disabled={!!busy} style={{ ...inp, width: "auto", padding: "4px 8px", fontSize: 11 }} />
        )}
        <div style={{ flex: 1 }} />
        <button onClick={del} disabled={!!busy} style={btn("danger", { fontSize: 11, padding: "5px 10px" })}>Delete</button>
      </div>
      {rejecting && <RejectDialog api={api} item={item} onCancel={() => setRejecting(false)} onDone={(id) => { setRejecting(false); onChanged(null, id); }} />}
    </div>
  );
}

export function XTab({ api, brands, activeId, setActiveId, openItemId, setOpenItemId, active, onBrandsChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [generating, setGenerating] = useState(null);
  const [photoIdea, setPhotoIdea] = useState("");
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

  // Posts on demand: a text post (scroll-stopper or reply magnet, picked at
  // random), one image post, 3 image posts at once (all different), or a
  // 4-slide carousel. With ChatGPT photos on, image posts come with a
  // ChatGPT request instead of a photo. Carousels always use AI photos.
  const manual = !!brand?.x_manual_photos;
  const daily = brand?.x_daily_posts !== false;
  const KINDS = {
    text: { label: "Text post", busy: "Writing…", body: () => ({ slotKey: Math.random() < 0.5 ? "personality" : "conversation", format: "text" }) },
    single: { label: "Image post", busy: manual ? "Writing…" : "Making photo… (1-2 min)", body: () => ({ slotKey: "visual", format: "single", idea: photoIdea.trim() || undefined }) },
    batch: { label: "3 image posts", busy: manual ? "Writing 3… (about 1 min)" : "Making 3… (2-3 min)", body: () => ({ slotKey: "visual", format: "single", count: 3 }) },
    carousel: { label: "4-slide carousel", busy: "Making carousel… (2-4 min)", body: () => ({ slotKey: "visual", format: "branded_carousel" }) },
  };
  const generate = async (kind) => {
    setGenerating(kind);
    try {
      const { results } = await api.post("/api/cron/x-content", { brandId: activeId, ...KINDS[kind].body() });
      const r = results?.[0];
      if (r?.error && r?.queued) alert(`Made ${r.queued}. ${r.error}.`);
      else if (r?.error) alert(`${KINDS[kind].label} failed: ${r.error}`);
      else if (!r?.queued) alert("Nothing was made — try again.");
      else if (kind === "single") setPhotoIdea("");
      if (kind === "batch" && r?.queued) setFilter(manual ? "needs_photo" : "draft");
    } catch (e) {
      // The request can time out in the browser while the server finishes
      // anyway, so check again shortly before calling it lost.
      alert(`${KINDS[kind].label}: ${e.message}. It may still appear in a minute.`);
      setTimeout(load, 30000);
    }
    load();
    setGenerating(null);
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

  const patchBrand = async (fields) => {
    try {
      const { brand: next } = await api.patch("/api/brands", { id: activeId, ...fields });
      onBrandsChange(brands.map((b) => (b.id === activeId ? next : b)));
    } catch (e) { alert(e.message); }
  };
  const togglePause = (paused) => patchBrand({ x_auto_post_paused: paused });

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

  // Only items actually queued for X (twitter stored on the row itself) —
  // the same rule the posting cron uses. Regular carousels that just
  // inherit twitter from the brand's platform list stay in the Carousels
  // tab until "Send to X" is pressed on them.
  const xItems = items.filter((i) => Array.isArray(i.platforms) && i.platforms.includes("twitter"));
  const visible = xItems.filter((i) => filter === "all" || (filter === "needs_photo" ? i.needs_photo : xStatus(i) === filter));
  const needPhotos = xItems.filter((i) => i.needs_photo).length;
  const queuedReady = xItems.filter((i) => i.status === "ready" && !i.posted_twitter_at).length;
  const followerDelta = brand.x_followers != null && brand.x_followers_prev != null ? brand.x_followers - brand.x_followers_prev : null;

  const paused = !!brand.x_auto_post_paused;

  return (
    <div>
      <XLogin api={api} brandId={activeId} />
      {paused && (
        <div style={{ ...card, marginBottom: 14, background: C.danger + "14", borderColor: C.danger, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: C.danger }}>Auto-posting is paused</div>
            <div style={{ fontSize: 12, color: C.muted }}>The posting cron and "Post now" are both off for {brand.name} — nothing goes out until you resume.</div>
          </div>
          <button onClick={() => togglePause(false)} style={btn("dark")}>Resume auto-posting</button>
        </div>
      )}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.muted, textTransform: "uppercase" }}>Automation</div>
            <div style={{ fontSize: 13 }}>{daily && <>Next drafts written <b>{BATCH_TIME_UTC} UTC</b> · </>}Next posting window <b>{paused ? "paused" : nextWindow()}</b> · <b>{queuedReady}</b> queued and ready</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!paused && <button onClick={() => togglePause(true)} style={btn("ghost", { color: C.danger, borderColor: C.danger + "88" })}>Pause auto-posting</button>}
            {Object.entries(KINDS).map(([kind, k]) => (
              <button key={kind} onClick={() => generate(kind)} disabled={!!generating} style={btn(kind === "text" ? "ghost" : "primary", { opacity: generating && generating !== kind ? 0.5 : 1 })}>
                {generating === kind ? <><Spinner /> {k.busy}</> : `+ ${k.label}`}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <Choice label="Daily drafts" value={daily} options={[[true, "On"], [false, "Off"]]} onPick={(on) => patchBrand({ x_daily_posts: on })}
            hint={daily ? "New drafts are written every morning for you to approve." : "Nothing is written unless you press a button above."} />
          <Choice label="Photos" value={manual} options={[[false, "AI"], [true, "ChatGPT (I make them)"]]} onPick={(on) => patchBrand({ x_manual_photos: on })}
            hint={manual ? "Image posts come with a ChatGPT request and you add the photo, so no fal cost. Carousels still use AI." : "Image posts come with an AI photo (about $0.08 each)."} />
        </div>
        <input
          value={photoIdea}
          onChange={(e) => setPhotoIdea(e.target.value)}
          maxLength={300}
          placeholder="Optional: describe the photo for + Image post, e.g. kneeling on the floor, soles in tights showing"
          style={{ ...inp, fontSize: 13, marginBottom: 12 }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          <div style={{ fontSize: 13 }}>
            {brand.x_followers != null ? (
              <><b>{brand.x_followers.toLocaleString()}</b> <span style={{ color: C.muted }}>followers</span> {followerDelta != null && followerDelta !== 0 && <span style={{ color: followerDelta > 0 ? C.ok : C.danger, fontWeight: 700 }}> {followerDelta > 0 ? "+" : ""}{followerDelta} today</span>}</>
            ) : <span style={{ color: C.muted }}>Follower count not synced yet.</span>}
          </div>
          <button onClick={refreshStats} disabled={refreshing} style={btn("small", { opacity: refreshing ? 0.6 : 1 })}>{refreshing ? "Refreshing…" : "↻ Refresh stats"}</button>
        </div>
      </div>

      <TeachPanel api={api} brand={brand} refreshKey={items.length} />

      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        {[["all", "All"], ["draft", "Drafts"], ...(manual || needPhotos ? [["needs_photo", `Needs photo${needPhotos ? ` (${needPhotos})` : ""}`]] : []), ["ready", "Ready"], ["posted", "Posted"]].map(([id, label]) => (
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
