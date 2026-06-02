
export const maxDuration = 30;
 
export async function POST(req) {
  try {
    const { html, width, height } = await req.json();
 
    if (!html) {
      return Response.json({ error: "No HTML provided" }, { status: 400 });
    }
 
    const accessKey = process.env.SCREENSHOT_ONE_KEY;
    if (!accessKey) {
      return Response.json({ error: "ScreenshotOne key not configured" }, { status: 500 });
    }
 
    const params = new URLSearchParams({
      access_key: accessKey,
      html: html,
      format: "png",
      viewport_width: String(width || 1080),
      viewport_height: String(height || 1350),
      device_scale_factor: "1",
      image_quality: "100",
      block_ads: "true",
      block_trackers: "true",
      cache: "false",
      delay: "1",
    });
 
    const response = await fetch(`https://api.screenshotone.com/take?${params.toString()}`, {
      method: "GET",
    });
 
    if (!response.ok) {
      const text = await response.text();
      console.error("ScreenshotOne error:", text);
      return Response.json({ error: "ScreenshotOne failed", detail: text }, { status: 500 });
    }
 
    const imageBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString("base64");
 
    return Response.json({ image: base64 });
 
  } catch (e) {
    console.error("Render slide error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
