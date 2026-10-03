"use client";

import { useEffect, useState } from "react";
import { C, FONT, inp, btn, Chip, createApi, GLOBAL_CSS } from "./ui";
import { TodayTab } from "./TodayTab";
import { ContentTab } from "./ContentTab";
import { BrandsTab } from "./BrandsTab";

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
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: FONT }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: C.gold, marginBottom: 4 }}>BUILD WITH TAV</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Content Dashboard</div>
        </div>
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Passphrase" autoFocus style={inp} />
        {err && <p style={{ color: C.danger, fontSize: 12, margin: "8px 0 0" }}>{err}</p>}
        <button onClick={submit} disabled={checking || !pass} style={btn("primary", { width: "100%", marginTop: 12, padding: 11, fontSize: 14, opacity: checking || !pass ? 0.6 : 1 })}>
          {checking ? "Checking…" : "Enter"}
        </button>
      </div>
    </div>
  );
}

const TABS = [["today", "Today"], ["content", "Content"], ["brands", "Brands"]];

function Dashboard({ dashKey, onLock }) {
  const [api] = useState(() => createApi(dashKey, onLock));
  const [tab, setTab] = useState("today");
  const [brands, setBrands] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [openItemId, setOpenItemId] = useState(null);

  useEffect(() => {
    api.get("/api/brands").then((d) => {
      setBrands(d.brands || []);
      setActiveId((cur) => cur || d.brands?.[0]?.id || null);
    }).catch(() => {});
  }, []);

  const openItem = (id) => { setOpenItemId(id); setTab("content"); };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT }}>
      <style>{GLOBAL_CSS}</style>
      <nav style={{ borderBottom: `1px solid ${C.border}`, background: C.surface, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "12px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: C.gold }}>BUILD WITH TAV</div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Content Dashboard</div>
          </div>
          <button onClick={() => { localStorage.removeItem("dash_key"); onLock(); }} style={btn("ghost", { padding: "6px 12px", fontSize: 12, color: C.muted })}>Lock</button>
        </div>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "8px 20px 0", display: "flex", gap: 4 }}>
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); if (id !== "content") setOpenItemId(null); }} style={{ background: "none", border: "none", borderBottom: tab === id ? `3px solid ${C.gold}` : "3px solid transparent", color: tab === id ? C.text : C.muted, padding: "8px 14px", fontSize: 14, fontWeight: tab === id ? 800 : 600, cursor: "pointer", fontFamily: FONT }}>
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "22px 16px 60px" }}>
        {tab !== "today" && brands.length > 0 && !openItemId && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
            {brands.map((b) => <Chip key={b.id} active={activeId === b.id} onClick={() => setActiveId(b.id)}>{b.name}</Chip>)}
          </div>
        )}
        {/* All three tabs stay mounted so switching between them never loses
            an unsaved idea, an open editor, or scroll position — only the
            active one is visible. */}
        <div style={{ display: tab === "today" ? "block" : "none" }}><TodayTab api={api} active={tab === "today"} onOpenItem={openItem} /></div>
        <div style={{ display: tab === "content" ? "block" : "none" }}><ContentTab api={api} brands={brands} activeId={activeId} setActiveId={setActiveId} openItemId={openItemId} setOpenItemId={setOpenItemId} /></div>
        <div style={{ display: tab === "brands" ? "block" : "none" }}><BrandsTab api={api} brands={brands} activeId={activeId} setActiveId={setActiveId} onBrandsChange={setBrands} /></div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [dashKey, setDashKey] = useState(undefined);

  useEffect(() => {
    try { setDashKey(localStorage.getItem("dash_key") || null); } catch { setDashKey(null); }
  }, []);

  if (dashKey === undefined) return null;
  if (!dashKey) return <PassGate onUnlock={setDashKey} />;
  return <Dashboard key={dashKey} dashKey={dashKey} onLock={() => setDashKey(null)} />;
}
