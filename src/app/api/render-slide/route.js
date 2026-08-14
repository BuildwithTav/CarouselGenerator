export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

// Fetch Google Fonts CSS and inline all font URLs as base64
async function inlineFonts(html) {
  try {
    const linkMatch = html.match(/<link[^>]+fonts\.googleapis\.com[^>]+>/);
    if (!linkMatch) return html;
    const hrefMatch = linkMatch[0].match(/href=['"]([^'"]+)['"]/);
    if (!hrefMatch) return html;
    const cssUrl = hrefMatch[1];
    const cssRes = await fetch(cssUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } });
    if (!cssRes.ok) return html;
    let css = await cssRes.text();
    const urlMatches = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)];
    for (const match of urlMatches) {
      try {
        const fontRes = await fetch(match[1]);
        if (!fontRes.ok) continue;
        const buf = await fontRes.arrayBuffer();
        const b64 = Buffer.from(buf).toString('base64');
        const ext = match[1].includes('.woff2') ? 'woff2' : 'woff';
        css = css.replace(match[1], `data:font/${ext};base64,${b64}`);
      } catch {}
    }
    html = html.replace(linkMatch[0], `<style>${css}</style>`);
    return html;
  } catch {
    return html;
  }
}

export async function POST(req) {
  try {
    const body = await req.text();
    const { html, width, height } = JSON.parse(body);

    if (!html) {
      return Response.json({ error: "No HTML provided" }, { status: 400 });
    }

    const targetWidth = width || 1080;
    const targetHeight = height || 1350;
    // Render at 2x and downscale to target size — a native 1x screenshot
    // gives text/logo edges only Chromium's default anti-aliasing, which
    // looks visibly softer once Instagram re-compresses the upload.
    // Supersampling + downscale acts as a sharpening pass that survives
    // that re-compression much better.
    const SCALE = 2;

    const htmlWithFonts = await inlineFonts(html);
    let browser;
    try {
      const chromiumModule = await import('@sparticuz/chromium');
      const puppeteerModule = await import('puppeteer-core');
      const sharpModule = await import('sharp');
      const chromium = chromiumModule.default;
      const puppeteer = puppeteerModule.default;
      const sharp = sharpModule.default;
      const executablePath = await chromium.executablePath();
      process.env.LD_LIBRARY_PATH = [
        executablePath.replace('/chromium', ''),
        process.env.LD_LIBRARY_PATH,
      ].filter(Boolean).join(':');
      browser = await puppeteer.launch({
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
        ],
        defaultViewport: { width: targetWidth, height: targetHeight, deviceScaleFactor: SCALE },
        executablePath,
        headless: true,
        ignoreHTTPSErrors: true,
      });
      const page = await browser.newPage();
      await page.setViewport({ width: targetWidth, height: targetHeight, deviceScaleFactor: SCALE });
      await page.setContent(htmlWithFonts, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await new Promise(r => setTimeout(r, 1500));
      const screenshot = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: targetWidth, height: targetHeight },
        omitBackground: false,
      });
      await browser.close();
      const resized = await sharp(screenshot)
        .resize(targetWidth, targetHeight, { kernel: 'lanczos3' })
        .png()
        .toBuffer();
      const base64 = resized.toString('base64');
      return Response.json({ image: base64 });
    } catch (e) {
      if (browser) await browser.close().catch(() => {});
      throw e;
    }
  } catch (e) {
    console.error("Render slide error:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
