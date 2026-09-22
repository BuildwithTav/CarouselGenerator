"use client";

import { C, lbl, CopyButton, DownloadButton, downloadFile, btn } from "./ui";
import { useState } from "react";

const PLATFORM_LABEL = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", twitter: "X (Twitter)" };

export function SlideStrip({ item, size = 96 }) {
  const urls = item.slide_urls || [];
  const [savingAll, setSavingAll] = useState(false);
  if (!urls.length) return <div style={{ fontSize: 12, color: C.muted, padding: "8px 0" }}>Slides not rendered yet.</div>;

  const downloadAll = async () => {
    setSavingAll(true);
    const failed = [];
    for (let i = 0; i < urls.length; i++) {
      try {
        await downloadFile(urls[i], `${(item.idea || "slide").slice(0, 40).replace(/[^a-z0-9]+/gi, "-")}-${String(i + 1).padStart(2, "0")}.png`);
      } catch (e) {
        failed.push(`#${i + 1} (${e.message})`);
      }
      // A short gap so the browser doesn't block a burst of downloads as a popup flood.
      if (i < urls.length - 1) await new Promise((r) => setTimeout(r, 350));
    }
    if (failed.length) alert(`${failed.length} slide${failed.length === 1 ? "" : "s"} didn't download: ${failed.join(", ")}`);
    setSavingAll(false);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
        {urls.map((u, i) => (
          <div key={i} style={{ flexShrink: 0, width: size, display: "flex", flexDirection: "column", gap: 4 }}>
            <a href={u} target="_blank" rel="noreferrer" style={{ width: size, aspectRatio: "1080/1350", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, position: "relative", display: "block" }}>
              <img src={u} alt={`Slide ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              {/* Dashboard-only position label — never sits over a template's own
                  text (which lives bottom-center on every template), and has its
                  own background so it reads as UI chrome, not part of the photo. */}
              <span style={{ position: "absolute", top: 4, left: 4, fontSize: 10, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.55)", borderRadius: 4, padding: "1px 5px", lineHeight: 1.4 }}>{i + 1}</span>
            </a>
            <DownloadButton url={u} filename={`slide-${String(i + 1).padStart(2, "0")}.png`} label="Download" style={{ width: "100%", padding: "3px 0", fontSize: 10 }} />
          </div>
        ))}
      </div>
      <button onClick={downloadAll} disabled={savingAll} style={btn("small", { marginTop: 6, opacity: savingAll ? 0.6 : 1 })}>{savingAll ? "Downloading…" : `⬇ Download all ${urls.length} slides`}</button>
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

function Section({ platform, title, children, onMarkPosted, marking }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>{title}</div>
      {children}
      {onMarkPosted && (
        <button onClick={() => onMarkPosted(platform)} disabled={marking === platform} style={btn("ghost", { marginTop: 10, opacity: marking === platform ? 0.5 : 1 })}>
          {marking === platform ? "Saving…" : `✓ Posted on ${PLATFORM_LABEL[platform]}`}
        </button>
      )}
    </div>
  );
}

function CaptionBox({ text, label }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
        <CopyButton text={text} label={label} />
      </div>
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{text || <span style={{ color: C.muted }}>No caption yet.</span>}</div>
    </div>
  );
}

// The copy-paste-ready package for one content item, one section per
// platform. Instagram: caption. TikTok: its own shorter caption + 5 hashtags.
// YouTube: title, description (with hashtags), comma-separated tags, pinned
// comment, category. `platforms` limits which sections show (Today passes
// only the platforms still unposted).
export function PackageView({ item, platforms, onMarkPosted, marking }) {
  const show = platforms || ["instagram", "tiktok", "youtube", "twitter"];
  const tags = (item.yt_tags || []).join(", ");
  const ttCaption = item.tt_caption || item.caption;
  const twCaption = item.tw_caption || item.caption;
  const ytDescription = item.yt_description || item.caption;

  return (
    <div>
      {show.includes("instagram") && (
        <Section platform="instagram" title="Instagram" onMarkPosted={onMarkPosted} marking={marking}>
          <CaptionBox text={item.caption} label="Copy caption" />
        </Section>
      )}
      {show.includes("tiktok") && (
        <Section platform="tiktok" title="TikTok" onMarkPosted={onMarkPosted} marking={marking}>
          <CaptionBox text={ttCaption} label="Copy caption" />
        </Section>
      )}
      {show.includes("twitter") && (
        <Section platform="twitter" title="X (Twitter)" onMarkPosted={onMarkPosted} marking={marking}>
          <CaptionBox text={twCaption} label="Copy post" />
        </Section>
      )}
      {show.includes("youtube") && (
        <Section platform="youtube" title="YouTube" onMarkPosted={onMarkPosted} marking={marking}>
          <Field label="Title" value={item.yt_title} />
          <Field label="Description" value={ytDescription} />
          <Field label="Tags (comma separated)" value={tags} />
          <Field label="Pinned comment" value={item.yt_pinned_comment} />
          <div style={{ padding: "10px 0", borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.muted }}>Category: <b style={{ color: C.text }}>{item.yt_category || "—"}</b></div>
        </Section>
      )}
    </div>
  );
}
