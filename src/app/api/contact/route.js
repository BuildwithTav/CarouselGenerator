import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { type, message, email } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Carousel Studio <noreply@mail.buildwithtav.co>",
        to: "tav@buildwithtav.co",
        subject: `Carousel Studio — ${type || "Feedback"}`,
        html: `
          <h2>${type || "Feedback"}</h2>
          <p><strong>From:</strong> ${email || "Not logged in"}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
        `
      })
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
