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
 
    // Pass HTML through as-is — base64 images are needed for correct rendering
    const cleanHtml = html;
 
    let browser;
    try {
      const chromiumModule = await import('@sparticuz/chromium');
      const puppeteerModule = await import('puppeteer-core');
      const chromium = chromiumModule.default;
      const puppeteer = puppeteerModule.default;
 
      const executablePath = await chromium.executablePath();
 
      // Set library path so Chromium can find system libraries on Vercel
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
        defaultViewport: { width: width || 1080, height: height || 1350 },
        executablePath,
        headless: true,
        ignoreHTTPSErrors: true,
      });
 
      const page = await browser.newPage();
      await page.setViewport({ width: width || 1080, height: height || 1350 });
      await page.setContent(cleanHtml, { waitUntil: 'networkidle0', timeout: 25000 });
      // Give fonts extra time to render
      await new Promise(r => setTimeout(r, 1000));
 
      const screenshot = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: width || 1080, height: height || 1350 },
        omitBackground: false,
      });
 
      await browser.close();
 
      const base64 = Buffer.from(screenshot).toString('base64');
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
