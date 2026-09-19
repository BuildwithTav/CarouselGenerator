"use client";

import { useEffect, useState } from "react";
import { C, card, lbl, Badge, Spinner } from "./ui";
import { PackageView, SlideStrip } from "./PackageView";

export function TodayTab({ api, active, onOpenItem }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [marking, setMarking] = useState(null);

  const load = async () => {
    setErr("");
    try { setData(await api.get("/api/content/today")); } catch (e) { setErr(e.message); }
  };
  // Reload each time this tab becomes the visible one (it stays mounted in
  // the background otherwise), so freshly-approved content shows up.
  useEffect(() => { if (active) load(); }, [active]);

  const markPosted = async (item, platform) => {
    setMarking(item.id + platform);
    try {
      const { item: updated } = await api.patch("/api/content", { id: item.id, action: "mark_posted", platform });
      setData((d) => {
        if (!d) return d;
        const remaining = item.remaining.filter((p) => p !== platform);
        const items = remaining.length
          ? d.items.map((i) => (i.id === item.id ? { ...i, ...updated, platforms: item.platforms, remaining } : i))
          : d.items.filter((i) => i.id !== item.id);
        const brands = d.brands.map((b) => (b.id === item.brand_id ? { ...b, posted_today: b.posted_today + 1 } : b));
        return { ...d, items, brands };
      });
    } catch (e) { alert(e.message); }
    setMarking(null);
  };

  if (err) return <div style={{ ...card, color: C.danger }}>{err} <button onClick={load} style={{ marginLeft: 8, background: "none", border: "none", color: C.gold, fontWeight: 700, cursor: "pointer" }}>Retry</button></div>;
  if (!data) return <div style={{ textAlign: "center", padding: 40, color: C.muted }}><Spinner /> Loading today…</div>;

  const byBrand = {};
  for (const it of data.items) (byBrand[it.brand_id] ||= []).push(it);
  const activeBrands = data.brands.filter((b) => byBrand[b.id]?.length);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {data.brands.map((b) => {
          const done = b.posted_today >= (b.daily_target || 0) * b.platforms.length && b.daily_target > 0;
          return (
            <div key={b.id} style={{ background: C.surface, border: `1.5px solid ${done ? C.ok : C.border}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700, display: "flex", gap: 8, alignItems: "center" }}>
              {b.name}
              <span style={{ color: done ? C.ok : C.muted, fontWeight: 600 }}>{b.posted_today}/{(b.daily_target || 0) * b.platforms.length} posted today</span>
            </div>
          );
        })}
      </div>

      {data.items.length === 0 && (
        <div style={{ ...card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Nothing due right now</div>
          <div style={{ fontSize: 13, color: C.muted }}>Generate something in the Content tab and approve it — it'll show up here ready to post.</div>
        </div>
      )}

      {activeBrands.map((b) => (
        <div key={b.id} style={{ marginBottom: 28 }}>
          <div style={{ ...lbl, fontSize: 12, marginBottom: 10 }}>{b.name} · {byBrand[b.id].length} to post</div>
          {byBrand[b.id].map((item) => (
            <div key={item.id} style={{ ...card, marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 12 }}>
                {item.thumb_url && <img src={item.thumb_url} alt="" style={{ width: 64, aspectRatio: "1080/1350", objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}`, flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3, marginBottom: 4 }}>{item.idea}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {item.pillar && <Badge>{item.pillar}</Badge>}
                    <span style={{ fontSize: 11, color: C.muted }}>Due {item.scheduled_for}</span>
                    <button onClick={() => onOpenItem(item.id)} style={{ background: "none", border: "none", color: C.gold, fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0 }}>Edit →</button>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ ...lbl, marginBottom: 6 }}>Slides — tap to open / long-press to save</div>
                <SlideStrip item={item} />
              </div>
              <PackageView item={item} platforms={item.remaining} marking={marking === null ? null : marking.replace(item.id, "")} onMarkPosted={(p) => markPosted(item, p)} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
