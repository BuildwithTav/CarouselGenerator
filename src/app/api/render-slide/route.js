export const maxDuration = 30;

export async function POST(req) {
  try {
    const { html, width, height, coverImage, profileImage } = await req.json();

    if (!html) {
      return Response.json({ error: "No HTML provided" }, { status: 400 });
    }

    const accessKey = process.env.SCREENSHOT_ONE_KEY;
    if (!accessKey) {
      return Response.json({ error: "ScreenshotOne key not configured" }, { status: 500 });
    }

    // Strip all base64 images to reduce payload size
    let cleanHtml = html.replace(/src="data:image\/[^"]+"/g, 'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"');

    // Reinject cover image if provided (preserves cover photo in download)
    if (coverImage) {
      cleanHtml = cleanHtml.replace(
        /(<div[^>]+class="cover-img"[^>]*>[\s\S]*?<img[^>]+)src="[^"]*"/,
        `$1src="${coverImage}"`
      );
      // Also try background-image style replacement
      cleanHtml = cleanHtml.replace(
        /background-image:url\(data:image\/[^)]+\)/g,
        `background-image:url(${coverImage})`
      );
    }

    // Reinject profile image if provided
    if (profileImage) {
      // Replace the first stripped profile image src
      cleanHtml = cleanHtml.replace(
        /src="data:image\/gif[^"]*"(\s[^>]*class="[^"]*profile[^"]*")/,
        `src="${profileImage}"$1`
      );
    }

    const body = {
      access_key: accessKey,
      html: cleanHtml,
      format: "png",
      viewport_width: width || 1080,
      viewport_height: height || 1350,
      device_scale_factor: 1,
      image_quality: 95,
      block_ads: true,
      block_trackers: true,
      cache: false,
      delay: 1,
    };

    const response = await fetch("https://api.screenshotone.com/take", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("ScreenshotOne error:", response.status, text);
      return Response.json({ error: "ScreenshotOne failed", status: response.status, detail: text }, { status: 500 });
    }

    const imageBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString("base64");

    return Response.json({ image: base64 });

  } catch (e) {
    console.error("Render slide error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
