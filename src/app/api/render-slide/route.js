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
 
    // Strip any remaining base64 images
    const cleanHtml = html.replace(/src="data:image\/[^"]{100,}"/g, 'src=""');
 
    let browser;
    try {
      if (process.env.NODE_ENV === 'production') {
        const [chromiumModule, puppeteerModule] = await Promise.all([
          import('@sparticuz/chromium'),
          import('puppeteer-core')
        ]);
        const chromium = chromiumModule.default;
        const puppeteer = puppeteerModule.default;
        browser = await puppeteer.launch({
          args: chromium.args,
          defaultViewport: { width: width || 1080, height: height || 1350 },
          executablePath: await chromium.executablePath(),
          headless: true,
          ignoreHTTPSErrors: true,
        });
      } else {
        const puppeteer = await import('puppeteer');
        browser = await puppeteer.default.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          defaultViewport: { width: width || 1080, height: height || 1350 },
        });
      }
 
      const page = await browser.newPage();
      await page.setViewport({ width: width || 1080, height: height || 1350 });
      await page.setContent(cleanHtml, { waitUntil: 'networkidle0', timeout: 20000 });
 
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
    console.error("Render slide error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
 
