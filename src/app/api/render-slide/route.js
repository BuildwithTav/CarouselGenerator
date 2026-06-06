export const maxDuration = 30;
export const dynamic = 'force-dynamic';
 
export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
 
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
 
    // Strip any remaining base64 images (safety net — photos should now be real URLs)
    const cleanHtml = html.replace(/src="data:image\/[^"]{100,}"/g, 'src=""');
 
    const body = {
      access_key: accessKey,
      html: cleanHtml,
      format: "png",
      viewport_width: width || 1080,
      viewport_height: height || 1350,
      device_scale_factor: 1,
      image_quality: 95,
      block_ads: false,
      block_trackers: false,
      block_cookie_banners: false,
      cache: false,
      delay: 3,
      timeout: 30,
    };
 
    const response = await fetch("https://api.screenshotone.com/take", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
 
    if (!response.ok) {
      const text = await response.text();
      console.error("ScreenshotOne error:", response.status, text);
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
 
