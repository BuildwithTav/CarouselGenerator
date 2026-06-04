
export const maxDuration = 30;
export const dynamic = 'force-dynamic';
 
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
 
    // Log all src attributes including blob URLs
    const allSrcs = (html.match(/src="([^"]+)"/g) || []);
    const blobSrcs = allSrcs.filter(s => s.includes('blob.vercel'));
    const base64Srcs = allSrcs.filter(s => s.includes('data:'));
    console.log("Total src attrs:", allSrcs.length);
    console.log("Blob URLs:", blobSrcs.length, blobSrcs[0]?.slice(0,80));
    console.log("Base64 srcs:", base64Srcs.length);
 
    // Strip base64 images only
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
      delay: 2,
      timeout: 25,
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
 
