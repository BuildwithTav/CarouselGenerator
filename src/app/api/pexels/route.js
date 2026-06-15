// PexelsModal.jsx
import { useState, useEffect, useRef } from "react";

function Spin({ c = "#fff" }) {
  return (
    <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid rgba(255,255,255,0.15)`, borderTop: `2px solid ${c}`, animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
  );
}

export default function PexelsModal({ open, onClose, onSelect, A, GOLD }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selecting, setSelecting] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
      setError("");
      setPage(1);
      setHasMore(false);
      setSelecting(null);
    }
  }, [open]);

  if (!open) return null;

  const search = async (q, p = 1) => {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    if (p === 1) setResults([]);
    try {
      const res = await fetch(
        "/api/pexels?" + new URLSearchParams({ query: q.trim(), per_page: "20", page: String(p) })
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(prev => p === 1 ? data.photos : [...prev, ...data.photos]);
      setHasMore(!!data.next_page);
      setPage(p);
    } catch (e) {
      setError("Search failed — check your connection and try again.");
    }
    setLoading(false);
  };

  const handleSelect = async (photo) => {
    setSelecting(photo.id);
    try {
      await onSelect(photo.url);
      onClose();
    } catch (e) {
      console.error("Pexels select failed:", e);
    }
    setSelecting(null);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 3000, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: A.surface, borderRadius: 16, width: "100%", maxWidth: 720,
          maxHeight: "85vh", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${A.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Search Pexels</div>
              <div style={{ fontSize: 11, color: A.muted, marginTop: 2 }}>
                Free high-quality backgrounds · Photos by{" "}
                <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" style={{ color: GOLD, textDecoration: "none" }}>Pexels</a>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: A.muted, cursor: "pointer", padding: 4 }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search(query)}
              placeholder="dark background, bokeh, nature, abstract..."
              style={{
                flex: 1, padding: "10px 14px", background: A.bg,
                border: `1.5px solid ${A.border}`, borderRadius: 9,
                color: A.text, fontSize: 14, fontFamily: "inherit", outline: "none",
              }}
            />
            <button
              onClick={() => search(query)}
              disabled={loading || !query.trim()}
              style={{
                padding: "10px 20px", background: query.trim() ? A.text : A.border,
                color: A.accentText, borderRadius: 9, fontWeight: 700,
                fontSize: 13, border: "none", cursor: query.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              }}
            >
              {loading && page === 1 ? <><Spin c="#fff" />Searching...</> : "Search"}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {error && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#c0392b", fontSize: 13 }}>{error}</div>
          )}
          {!error && results.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "60px 0", color: A.muted, fontSize: 13 }}>
              {query ? "No results — try a different search" : "Search for backgrounds above"}
            </div>
          )}
          {loading && page === 1 && (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <Spin c={A.text} />
            </div>
          )}
          {results.length > 0 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
                {results.map(photo => (
                  <div
                    key={photo.id}
                    onClick={() => !selecting && handleSelect(photo)}
                    style={{
                      position: "relative", borderRadius: 8, overflow: "hidden",
                      aspectRatio: "3/4", cursor: selecting ? "wait" : "pointer",
                      border: `2px solid ${A.border}`, transition: "transform 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.borderColor = GOLD; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = A.border; }}
                  >
                    <img src={photo.thumb} alt={photo.alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                    {selecting === photo.id && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Spin c={GOLD} />
                      </div>
                    )}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      padding: "20px 6px 6px",
                      background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))",
                      fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 600,
                    }}>
                      {photo.photographer}
                    </div>
                  </div>
                ))}
              </div>
              {hasMore && (
                <button
                  onClick={() => search(query, page + 1)}
                  disabled={loading}
                  style={{
                    width: "100%", padding: "12px", background: A.bg,
                    border: `1.5px solid ${A.border}`, borderRadius: 9,
                    color: A.text, fontWeight: 700, fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  {loading ? <><Spin c={A.text} />Loading...</> : "Load more"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
