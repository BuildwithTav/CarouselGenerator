"use client";

import { useState } from "react";

export const C = {
  bg: "#f5f3ef",
  surface: "#ffffff",
  border: "#e0ddd8",
  text: "#0a0a0a",
  muted: "#82807c",
  gold: "#C9A84C",
  accentText: "#ffffff",
  danger: "#e05252",
  ok: "#2e9e5b",
};

export const FONT = "Plus Jakarta Sans,system-ui,sans-serif";

export const inp = {
  width: "100%",
  padding: "10px 12px",
  background: C.bg,
  border: `1.5px solid ${C.border}`,
  borderRadius: 8,
  color: C.text,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: FONT,
};

export const lbl = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.muted, marginBottom: 6 };

export const card = { background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 20 };

export function btn(kind = "primary", extra = {}) {
  const base = { padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none", fontFamily: FONT, whiteSpace: "nowrap" };
  const kinds = {
    primary: { background: C.gold, color: "#000" },
    dark: { background: C.text, color: C.accentText },
    ghost: { background: "none", border: `1.5px solid ${C.border}`, color: C.text },
    danger: { background: "none", border: `1.5px solid ${C.border}`, color: C.danger },
    small: { background: "none", border: `1px solid ${C.border}`, color: C.muted, fontSize: 11, padding: "5px 10px" },
  };
  return { ...base, ...kinds[kind], ...extra };
}

export function Toggle({ on, onClick }) {
  return (
    <div onClick={onClick} style={{ width: 40, height: 22, borderRadius: 11, background: on ? C.gold : C.border, position: "relative", cursor: "pointer", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.25)", transition: "left 0.15s" }} />
    </div>
  );
}

export function Chip({ active, onClick, children, color }) {
  return (
    <button onClick={onClick} style={{ background: active ? (color || C.gold) : C.surface, border: `1.5px solid ${active ? (color || C.gold) : C.border}`, borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: 700, color: active ? "#000" : C.text, cursor: "pointer", fontFamily: FONT }}>
      {children}
    </button>
  );
}

export function Badge({ children, color }) {
  return <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", padding: "3px 8px", borderRadius: 6, background: (color || C.muted) + "22", color: color || C.muted }}>{children}</span>;
}

export const STATUS_COLOR = { draft: C.muted, ready: C.gold, posted: C.ok };

export function fmtSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

// The HTML `download` attribute is silently ignored by browsers for
// cross-origin URLs (Supabase's signed URLs are a different origin from the
// dashboard), so a plain <a download> link just opens the image instead of
// saving it. Fetching the bytes ourselves and downloading via a local blob
// URL works regardless of origin.
export async function downloadFile(url, filename) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
}

export function DownloadButton({ url, filename, label = "Download", kind = "small", style }) {
  const [state, setState] = useState("idle");
  const click = async (e) => {
    e.preventDefault();
    setState("busy");
    try { await downloadFile(url, filename); setState("done"); } catch { setState("fail"); }
    setTimeout(() => setState("idle"), 1600);
  };
  return (
    <button onClick={click} disabled={!url || state === "busy"} style={btn(kind, { opacity: url ? 1 : 0.4, ...style })}>
      {state === "busy" ? "…" : state === "done" ? "Saved ✓" : state === "fail" ? "Failed" : label}
    </button>
  );
}

export function CopyButton({ text, label = "Copy", kind = "dark", style }) {
  const [state, setState] = useState("idle");
  const click = async () => {
    const ok = await copyText(text || "");
    setState(ok ? "done" : "fail");
    setTimeout(() => setState("idle"), 1600);
  };
  return (
    <button onClick={click} disabled={!text} style={btn(kind, { opacity: text ? 1 : 0.4, ...style, ...(state === "done" ? { background: C.ok, color: "#fff", border: "none" } : {}) })}>
      {state === "done" ? "Copied ✓" : state === "fail" ? "Couldn't copy" : label}
    </button>
  );
}

export function createApi(dashKey, onLock) {
  const headers = { "x-dashboard-key": dashKey };
  async function handle(res) {
    if (res.status === 403) { onLock?.(); throw new Error("Locked"); }
    let d = {};
    try { d = await res.json(); } catch {}
    if (!res.ok || d.error) throw new Error(d.error || `Request failed (${res.status})`);
    return d;
  }
  return {
    get: (path) => fetch(path, { headers }).then(handle),
    post: (path, body) => fetch(path, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(handle),
    patch: (path, body) => fetch(path, { method: "PATCH", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(handle),
    del: (path, body) => fetch(path, { method: "DELETE", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(handle),
    upload: (path, formData) => fetch(path, { method: "POST", headers, body: formData }).then(handle),
  };
}

export function Spinner() {
  return <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.gold, animation: "dashspin 0.8s linear infinite", verticalAlign: "middle" }} />;
}

export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
@keyframes dashspin { to { transform: rotate(360deg); } }
* { -webkit-tap-highlight-color: transparent; }
textarea, input, select { font-family: ${FONT}; }
`;
