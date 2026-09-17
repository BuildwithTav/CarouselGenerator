"use client";

import { C, lbl, CopyButton, btn } from "./ui";

const PLATFORM_LABEL = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" };

export function SlideStrip({ item, size = 96 }) {
  const urls = item.slide_urls || [];
  if (!urls.length) return <div style={{ fontSize: 12, color: C.muted, padding: "8px 0" }}>Slides not rendered yet.</div>;
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
      {urls.map((u, i) => (
        <a key={i} href={u} target="_blank" rel="noreferrer" download={`slide-${i + 1}.png`} style={{ flexShrink: 0, width: size, aspectRatio: "1080/1350", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, position: "relative", display: "block" }}>
          <img src={u} alt={`Slide ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <span style={{ position: "absolute", bottom: 4, right: 6, fontSize: 10, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{i + 1}</span>
        </a>
      ))}
    </div>
  );
}

function Field({ label, value, copyLabel = "Copy" }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderTop: `1px solid ${C.border}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...lbl, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{value || <span style={{ color: C.muted }}>—</span>}</div>
      </div>
      <CopyButton text={value} label={copyLabel} kind="small" style={{ flexShrink: 0, marginTop: 18 }} />
    </div>
  );
}

// The copy-paste-ready package for one content item. `platforms` limits which
// sections show (Today passes only the platforms still unposted).
export function PackageView({ item, platforms, onMarkPosted, marking }) {
  const show = platforms || ["instagram", "tiktok", "youtube"];
  const social = show.filter((p) => p !== "youtube");
  const yt = show.includes("youtube");
  const tags = (item.yt_tags || []).join(", ");

  return (
    <div>
      {social.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>{social.map((p) => PLATFORM_LABEL[p]).join(" + ")} caption</div>
            <CopyButton text={item.caption} label="Copy caption" />
          </div>
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{item.caption || <span style={{ color: C.muted }}>No caption yet.</span>}</div>
          {onMarkPosted && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {social.map((p) => (
                <button key={p} onClick={() => onMarkPosted(p)} disabled={marking === p} style={btn("ghost", { opacity: marking === p ? 0.5 : 1 })}>
                  {marking === p ? "Saving…" : `✓ Posted on ${PLATFORM_LABEL[p]}`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {yt && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>YouTube package</div>
          <Field label="Title" value={item.yt_title} />
          <Field label="Description" value={item.caption} />
          <Field label="Tags" value={tags} />
          <Field label="Pinned comment" value={item.yt_pinned_comment} />
          <div style={{ padding: "10px 0", borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.muted }}>Category: <b style={{ color: C.text }}>{item.yt_category || "—"}</b></div>
          {onMarkPosted && (
            <button onClick={() => onMarkPosted("youtube")} disabled={marking === "youtube"} style={btn("ghost", { opacity: marking === "youtube" ? 0.5 : 1 })}>
              {marking === "youtube" ? "Saving…" : "✓ Posted on YouTube"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
