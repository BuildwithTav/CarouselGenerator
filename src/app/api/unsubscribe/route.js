import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function generateToken(email) {
  return crypto.createHmac("sha256", process.env.UNSUBSCRIBE_SECRET || "cs_unsub_secret")
    .update(email.toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  if (!email || !token) {
    return new Response(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#f5f3ef;">
      <h2 style="color:#c0392b">Invalid unsubscribe link.</h2>
      <p>This link is invalid or has expired.</p>
    </body></html>`, { headers: { "Content-Type": "text/html" } });
  }

  const expectedToken = generateToken(email);
  if (token !== expectedToken) {
    return new Response(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#f5f3ef;">
      <h2 style="color:#c0392b">Invalid unsubscribe link.</h2>
      <p>This link is invalid or has expired.</p>
    </body></html>`, { headers: { "Content-Type": "text/html" } });
  }

  await supabase.from("users").update({ marketing_consent: false }).eq("email", email.toLowerCase());

  return new Response(`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:'Helvetica Neue',sans-serif;text-align:center;padding:60px 24px;background:#f5f3ef;color:#0a0a0a;">
    <div style="max-width:480px;margin:0 auto;">
      <div style="font-size:20px;font-weight:900;color:#0a0a0a;margin-bottom:8px;">Carousel Studio</div>
      <div style="font-size:13px;color:#BB9900;font-weight:700;margin-bottom:40px;">by BuildWithTav</div>
      <div style="background:#fff;border-radius:14px;padding:40px;border:1px solid #e0ddd8;">
        <h2 style="margin:0 0 16px;font-size:22px;">You've been unsubscribed.</h2>
        <p style="font-size:15px;color:#3a3835;line-height:1.7;margin:0 0 24px;">You'll no longer receive marketing emails from Carousel Studio. Transactional emails such as payment receipts may still be sent.</p>
        <a href="https://studio.buildwithtav.co" style="background:#BB9900;color:#000;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:800;text-decoration:none;display:inline-block;">Go to Carousel Studio</a>
      </div>
    </div>
  </body></html>`, { headers: { "Content-Type": "text/html" } });
}
