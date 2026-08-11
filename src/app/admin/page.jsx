"use client";
import { useState, useEffect, useCallback } from "react";

const GOLD = "#BB9900";
const PLAN_CREDITS = { free: 60, starter: 200, pro: 800, agency: 3000, affiliate_licence: 150, white_label: 800 };
const PLAN_LABELS = { free: "Free", starter: "Starter", pro: "Pro", agency: "Agency", affiliate_licence: "Affiliate Licence", white_label: "White Label" };

const A = {
  bg: "#F5F3EF", surface: "#FFFFFF", border: "#E8E5E0",
  text: "#0A0A0A", muted: "#8A8780", accentText: "#FFFFFF"
};

const inp = {
  width: "100%", padding: "8px 12px", borderRadius: 8,
  border: `1.5px solid ${A.border}`, background: A.bg,
  fontSize: 13, color: A.text, outline: "none", boxSizing: "border-box"
};

const btn = (bg, color, extra = {}) => ({
  padding: "8px 16px", borderRadius: 8, border: "none",
  background: bg, color, fontWeight: 700, fontSize: 12,
  cursor: "pointer", whiteSpace: "nowrap", ...extra
});

const pill = (plan) => {
  const colors = {
    free: ["#E8E5E0", "#8A8780"], starter: ["#e6f0ff", "#1a5fc7"],
    pro: [GOLD + "22", GOLD], agency: ["#f0e6ff", "#7c3aed"],
    affiliate_licence: ["#fff3e0", "#e65100"], white_label: ["#e8f5e9", "#2e7d32"],
    pending: ["#fff3e0", "#e65100"], paid: ["#e8f5e9", "#2e7d32"],
  };
  const [bg, col] = colors[plan] || ["#E8E5E0", "#8A8780"];
  return { background: bg, color: col, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, display: "inline-block" };
};

async function adminCall(action, payload = {}) {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Unknown error");
  return data;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [editUser, setEditUser] = useState(null);
  const [editPlan, setEditPlan] = useState("");
  const [addCredits, setAddCredits] = useState("");
  const [msg, setMsg] = useState({ text: "", ok: true });
  const [sendingUpdate, setSendingUpdate] = useState(false);
  const [updateSent, setUpdateSent] = useState(false);

  const flash = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text: "", ok: true }), 5000); };

  const sendUpdateEmail = async () => {
    if (!window.confirm("Send the app update email to ALL users who haven't opted out of emails? This cannot be undone.")) return;
    setSendingUpdate(true);
    try {
      const d = await adminCall("admin_send_update_email", { confirm: true });
      flash(`✓ Update email sent to ${d.sent} of ${d.total} users`);
      setUpdateSent(true);
    } catch (e) { flash(e.message, false); }
    setSendingUpdate(false);
  };

  const checkPassword = () => {
    if (password === "tav_admin_2026") setAuthed(true);
    else flash("Wrong password", false);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "users") {
        const d = await adminCall("admin_get_users");
        setUsers(d.users || []);
      } else if (tab === "commissions") {
        const d = await adminCall("admin_get_commissions");
        setCommissions(d.commissions || []);
      } else if (tab === "payouts") {
        const d = await adminCall("admin_get_payouts");
        setPayouts(d.payouts || []);
      }
    } catch (e) { flash(e.message, false); }
    setLoading(false);
  }, [tab]);

  useEffect(() => { if (authed) load(); }, [authed, tab]);

  const saveEdit = async () => {
    try {
      await adminCall("admin_update_user", {
        email: editUser.email,
        plan: editPlan !== editUser.plan ? editPlan : undefined,
        add_credits: addCredits ? parseInt(addCredits) : undefined,
      });
      flash("✓ User updated");
      setEditUser(null);
      setAddCredits("");
      load();
    } catch (e) { flash(e.message, false); }
  };

  const markPaid = async (id) => {
    try {
      await adminCall("admin_mark_payout_paid", { payout_id: id });
      flash("✓ Marked as paid");
      load();
    } catch (e) { flash(e.message, false); }
  };

  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    return (!s || (u.email || "").toLowerCase().includes(s) || (u.first_name || "").toLowerCase().includes(s))
      && (filterPlan === "all" || u.plan === filterPlan);
  }).sort((a, b) => {
    if (sortBy === "credits_used") return (b.credits_used || 0) - (a.credits_used || 0);
    if (sortBy === "plan") return (a.plan || "").localeCompare(b.plan || "");
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  const stats = {
    total: users.length,
    paid: users.filter(u => u.plan !== "free").length,
    free: users.filter(u => u.plan === "free").length,
    affiliates: users.filter(u => u.affiliate_active).length,
    pendingPayouts: payouts.filter(p => p.status === "pending").length,
  };

  if (!authed) return (
    <div style={{ minHeight: "100vh", background: A.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: A.surface, border: `1.5px solid ${A.border}`, borderRadius: 16, padding: 40, width: 340 }}>
        <div style={{ fontFamily: "Montserrat,sans-serif", fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Admin Panel</div>
        <div style={{ fontSize: 13, color: A.muted, marginBottom: 24 }}>Carousel Studio</div>
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && checkPassword()}
          style={{ ...inp, marginBottom: 12, fontSize: 14 }} />
        <button onClick={checkPassword} style={{ ...btn(A.text, A.accentText), width: "100%", padding: "11px", fontSize: 14 }}>Sign In</button>
        {msg.text && <div style={{ marginTop: 12, fontSize: 12, color: msg.ok ? "#2e7d32" : "#c62828", textAlign: "center" }}>{msg.text}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: A.bg, fontFamily: "system-ui,sans-serif", color: A.text }}>

      {/* Header */}
      <div style={{ background: A.surface, borderBottom: `1.5px solid ${A.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "Montserrat,sans-serif", fontSize: 17, fontWeight: 900 }}>Carousel Studio</span>
          <span style={{ fontSize: 11, color: A.muted, background: A.bg, padding: "3px 10px", borderRadius: 20, border: `1px solid ${A.border}` }}>Admin</span>
        </div>
        {msg.text && <div style={{ fontSize: 13, fontWeight: 600, color: msg.ok ? "#2e7d32" : "#c62828" }}>{msg.text}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={sendUpdateEmail} disabled={sendingUpdate || updateSent} style={btn(updateSent ? A.border : GOLD, updateSent ? A.muted : "#000", { opacity: sendingUpdate ? 0.6 : 1, cursor: sendingUpdate || updateSent ? "default" : "pointer" })}>
            {sendingUpdate ? "Sending..." : updateSent ? "✓ Update email sent" : "Send Update Email to All Users"}
          </button>
          <a href="/" style={{ fontSize: 12, color: A.muted, textDecoration: "none" }}>← Back to app</a>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, padding: "20px 28px 0" }}>
        {[["Total Users", stats.total, A.text], ["Paid", stats.paid, "#1a5fc7"], ["Free", stats.free, A.muted], ["Affiliates", stats.affiliates, GOLD], ["Pending Payouts", stats.pendingPayouts, "#e65100"]].map(([label, val, col]) => (
          <div key={label} style={{ background: A.surface, border: `1.5px solid ${A.border}`, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: A.muted, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: col }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, padding: "18px 28px 0" }}>
        {["users", "commissions", "payouts"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...btn(tab === t ? A.text : A.surface, tab === t ? A.accentText : A.muted), border: `1.5px solid ${A.border}`, textTransform: "capitalize", fontSize: 13 }}>{t}</button>
        ))}
        <button onClick={load} style={{ ...btn(A.surface, A.muted), border: `1.5px solid ${A.border}`, marginLeft: "auto" }}>↻ Refresh</button>
      </div>

      <div style={{ padding: "16px 28px 40px" }}>

        {/* USERS */}
        {tab === "users" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <input placeholder="Search email or name..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, width: 260 }} />
              <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} style={{ ...inp, width: 150 }}>
                <option value="all">All plans</option>
                {Object.entries(PLAN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inp, width: 150 }}>
                <option value="created_at">Newest first</option>
                <option value="credits_used">Most active</option>
                <option value="plan">By plan</option>
              </select>
            </div>
            {loading ? <div style={{ padding: 40, textAlign: "center", color: A.muted }}>Loading...</div> : (
              <div style={{ background: A.surface, border: `1.5px solid ${A.border}`, borderRadius: 12, overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: A.bg }}>
                      {["Email", "Name", "Plan", "Credits", "Affiliate", "Joined", ""].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: A.muted, fontWeight: 600, fontSize: 11, borderBottom: `1.5px solid ${A.border}`, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <tr key={u.email} style={{ borderBottom: `1px solid ${A.border}`, background: i % 2 === 0 ? A.surface : A.bg }}>
                        <td style={{ padding: "9px 14px", fontSize: 12 }}>{u.email}</td>
                        <td style={{ padding: "9px 14px" }}>{u.first_name || "—"}</td>
                        <td style={{ padding: "9px 14px" }}><span style={pill(u.plan)}>{PLAN_LABELS[u.plan] || u.plan}</span></td>
                        <td style={{ padding: "9px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 50, height: 3, background: A.border, borderRadius: 2 }}>
                              <div style={{ height: 3, borderRadius: 2, background: GOLD, width: `${Math.min(100, ((u.credits_used || 0) / (u.credits_limit || 60)) * 100)}%` }} />
                            </div>
                            <span style={{ fontSize: 11, color: A.muted, whiteSpace: "nowrap" }}>{u.credits_used || 0}/{u.credits_limit || 60}</span>
                          </div>
                        </td>
                        <td style={{ padding: "9px 14px" }}>
                          {u.affiliate_active ? <span style={{ color: "#2e7d32", fontSize: 11, fontWeight: 700 }}>✓ Active</span> : <span style={{ color: A.muted, fontSize: 11 }}>—</span>}
                        </td>
                        <td style={{ padding: "9px 14px", fontSize: 11, color: A.muted, whiteSpace: "nowrap" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString("en-GB") : "—"}</td>
                        <td style={{ padding: "9px 14px" }}>
                          <button onClick={() => { setEditUser(u); setEditPlan(u.plan); setAddCredits(""); }} style={btn(A.text, A.accentText)}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: "8px 14px", fontSize: 11, color: A.muted, borderTop: `1px solid ${A.border}` }}>{filtered.length} of {users.length} users</div>
              </div>
            )}
          </>
        )}

        {/* COMMISSIONS */}
        {tab === "commissions" && (
          loading ? <div style={{ padding: 40, textAlign: "center", color: A.muted }}>Loading...</div> : (
            <div style={{ background: A.surface, border: `1.5px solid ${A.border}`, borderRadius: 12, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: A.bg }}>
                    {["Affiliate ID", "Referred Email", "Amount", "Rate", "Tier", "Status", "Date"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: A.muted, fontWeight: 600, fontSize: 11, borderBottom: `1.5px solid ${A.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c, i) => (
                    <tr key={c.id || i} style={{ borderBottom: `1px solid ${A.border}`, background: i % 2 === 0 ? A.surface : A.bg }}>
                      <td style={{ padding: "9px 14px", fontSize: 11 }}>{c.affiliate_id}</td>
                      <td style={{ padding: "9px 14px", fontSize: 12 }}>{c.referred_email}</td>
                      <td style={{ padding: "9px 14px", fontWeight: 700, color: "#2e7d32" }}>${(c.amount || 0).toFixed(2)}</td>
                      <td style={{ padding: "9px 14px" }}>{c.commission_rate}%</td>
                      <td style={{ padding: "9px 14px" }}>T{c.tier || 1}</td>
                      <td style={{ padding: "9px 14px" }}><span style={pill(c.status)}>{c.status}</span></td>
                      <td style={{ padding: "9px 14px", fontSize: 11, color: A.muted }}>{c.created_at ? new Date(c.created_at).toLocaleDateString("en-GB") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {commissions.length === 0 && <div style={{ padding: 40, textAlign: "center", color: A.muted }}>No commissions yet</div>}
            </div>
          )
        )}

        {/* PAYOUTS */}
        {tab === "payouts" && (
          loading ? <div style={{ padding: 40, textAlign: "center", color: A.muted }}>Loading...</div> : (
            <div style={{ background: A.surface, border: `1.5px solid ${A.border}`, borderRadius: 12, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: A.bg }}>
                    {["Affiliate ID", "Email", "Amount", "Method", "Payment Details", "Status", "Requested", "Actions"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: A.muted, fontWeight: 600, fontSize: 11, borderBottom: `1.5px solid ${A.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p, i) => (
                    <tr key={p.id || i} style={{ borderBottom: `1px solid ${A.border}`, background: i % 2 === 0 ? A.surface : A.bg }}>
                      <td style={{ padding: "9px 14px", fontSize: 11 }}>{p.affiliate_id}</td>
                      <td style={{ padding: "9px 14px", fontSize: 11 }}>{p.email || "—"}</td>
                      <td style={{ padding: "9px 14px", fontWeight: 700, color: "#2e7d32" }}>${(p.amount || 0).toFixed(2)}</td>
                      <td style={{ padding: "9px 14px", fontSize: 11, textTransform: "capitalize" }}>{p.payout_method || "—"}</td>
                      <td style={{ padding: "9px 14px", fontSize: 11, maxWidth: 220 }}>
                        {p.payout_details ? (
                          typeof p.payout_details === "object" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              {Object.entries(p.payout_details).map(([k, v]) => (
                                <div key={k} style={{ color: A.text }}><span style={{ color: A.muted, fontSize: 10 }}>{k}: </span>{v}</div>
                              ))}
                            </div>
                          ) : String(p.payout_details)
                        ) : "—"}
                      </td>
                      <td style={{ padding: "9px 14px" }}><span style={pill(p.status)}>{p.status}</span></td>
                      <td style={{ padding: "9px 14px", fontSize: 11, color: A.muted }}>{p.requested_at ? new Date(p.requested_at).toLocaleDateString("en-GB") : "—"}</td>
                      <td style={{ padding: "9px 14px" }}>
                        {p.status === "pending" && <button onClick={() => markPaid(p.id)} style={btn("#2e7d32", "#fff")}>Mark Paid</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payouts.length === 0 && <div style={{ padding: 40, textAlign: "center", color: A.muted }}>No payout requests yet</div>}
            </div>
          )
        )}
      </div>

      {/* EDIT MODAL */}
      {editUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={e => e.target === e.currentTarget && setEditUser(null)}>
          <div style={{ background: A.surface, border: `1.5px solid ${A.border}`, borderRadius: 16, padding: 32, width: 420, maxWidth: "90vw" }}>
            <div style={{ fontFamily: "Montserrat,sans-serif", fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Edit User</div>
            <div style={{ fontSize: 12, color: A.muted, marginBottom: 24 }}>{editUser.email}</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: A.muted, display: "block", marginBottom: 6 }}>Plan</label>
              <select value={editPlan} onChange={e => setEditPlan(e.target.value)} style={inp}>
                {Object.entries(PLAN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <div style={{ fontSize: 11, color: A.muted, marginTop: 4 }}>Credits limit → {PLAN_CREDITS[editPlan] || 60}</div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: A.muted, display: "block", marginBottom: 6 }}>Add bonus credits</label>
              <input type="number" placeholder="e.g. 100" value={addCredits} onChange={e => setAddCredits(e.target.value)} style={inp} />
              <div style={{ fontSize: 11, color: A.muted, marginTop: 4 }}>Current: {editUser.credits_used || 0} used / {editUser.credits_limit || 60} limit</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={saveEdit} style={{ ...btn(A.text, A.accentText), flex: 1, padding: 11 }}>Save</button>
              <button onClick={() => setEditUser(null)} style={{ ...btn(A.surface, A.muted), flex: 1, padding: 11, border: `1.5px solid ${A.border}` }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
