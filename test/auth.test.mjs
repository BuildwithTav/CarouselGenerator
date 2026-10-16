// Run with: npm test
// Login and the admin gate in /api/auth, against a fake Supabase that applies
// RLS like the real one: only the service key can read or write `users`.
import { test } from "node:test";
import assert from "node:assert/strict";

const SERVICE = "service-key";
const jwt = (email) => "eyJhbGciOiJIUzI1NiJ9." + Buffer.from(JSON.stringify({ sub: email, email, exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url") + ".sig";
const ROWS = {
  "admin@test.co": { email: "admin@test.co", plan: "affiliate_licence", is_admin: true, affiliate_id: "admin001", affiliate_active: true, affiliate_welcome_email_sent: true },
  "user@test.co": { email: "user@test.co", plan: "starter", is_admin: false, affiliate_id: "u1", affiliate_active: true, affiliate_welcome_email_sent: true },
};
const calls = [];
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

globalThis.fetch = async (input, init = {}) => {
  const url = decodeURIComponent(typeof input === "string" ? input : input.url);
  const method = (init.method || "GET").toUpperCase();
  const auth = new Headers(init.headers).get("authorization") || "";
  calls.push({ url, method, auth });
  if (url.includes("/auth/v1/verify")) {
    const { email } = JSON.parse(init.body);
    return json({ access_token: jwt(email), refresh_token: "r", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: "bearer", user: { id: email, email } });
  }
  if (url.includes("/auth/v1/user")) {
    const email = JSON.parse(Buffer.from(auth.slice(7).split(".")[1] || "", "base64url").toString() || "{}").email;
    return email ? json({ id: email, email }) : json({ msg: "bad jwt" }, 401);
  }
  if (url.includes("/rest/v1/")) {
    if (auth !== "Bearer " + SERVICE) return method === "GET" ? json({ code: "PGRST116" }, 406) : json({ code: "42501" }, 403);
    const email = url.match(/email=eq\.([^&]+)/)?.[1];
    const row = url.includes("/rest/v1/users") && ROWS[email];
    return row ? json(row) : json({ code: "PGRST116" }, 406);
  }
  return json({ id: "sent" });
};
Object.assign(process.env, { SUPABASE_URL: "https://fake.supabase.co", SUPABASE_SERVICE_KEY: SERVICE, RESEND_API_KEY: "test", SYSTEME_API_KEY: "test" });

const { POST } = await import("@/app/api/auth/route");
const call = async (body, token) => {
  const res = await POST(new Request("https://studio.test/api/auth", { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) }, body: JSON.stringify(body) }));
  return { status: res.status, body: await res.json() };
};

test("logging in returns the existing account, and later queries still run as the server", async () => {
  calls.length = 0;
  const first = await call({ action: "verify-otp", email: "admin@test.co", token: "123456" });
  assert.equal(first.body.user?.plan, "affiliate_licence");
  assert.ok(!calls.some((c) => c.url.includes("/rest/v1/users") && c.method === "POST"), "must not try to create a new account");
  assert.ok(!calls.some((c) => c.url.includes("resend")), "must not send a welcome email");
  // A second login on the same warm instance must not be read as the first user.
  const second = await call({ action: "verify-otp", email: "user@test.co", token: "123456" });
  assert.equal(second.body.user?.plan, "starter");
});

test("admin actions need a logged-in admin account", async () => {
  assert.equal((await call({ action: "admin_get_users" })).status, 401);
  assert.equal((await call({ action: "admin_get_users" }, jwt("user@test.co"))).status, 403);
  assert.equal((await call({ action: "admin_update_user", email: "user@test.co", plan: "agency" }, jwt("user@test.co"))).status, 403);
  assert.equal((await call({ action: "admin_get_users" }, jwt("admin@test.co"))).status, 200);
});
