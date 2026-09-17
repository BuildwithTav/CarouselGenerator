import { SLIDE_W, SLIDE_H } from "./slideTemplate.js";

// Fetch the Google Fonts stylesheet once and inline its font files as base64
// so headless Chromium renders the real typeface instead of a fallback.
async function inlineFontCss(fontHref) {
  try {
    const cssRes = await fetch(fontHref, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" } });
    if (!cssRes.ok) return null;
    let css = await cssRes.text();
    const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)];
    for (const m of urls) {
      try {
        const r = await fetch(m[1]);
        if (!r.ok) continue;
        const b64 = Buffer.from(await r.arrayBuffer()).toString("base64");
        const ext = m[1].includes(".woff2") ? "woff2" : "woff";
        css = css.replace(m[1], `data:font/${ext};base64,${b64}`);
      } catch {}
    }
    return css;
  } catch {
    return null;
  }
}

async function launchBrowser() {
  const chromium = (await import("@sparticuz/chromium")).default;
  const puppeteer = (await import("puppeteer-core")).default;
  const executablePath = process.env.CHROMIUM_PATH || (await chromium.executablePath());
  if (!process.env.CHROMIUM_PATH) {
    process.env.LD_LIBRARY_PATH = [executablePath.replace("/chromium", ""), process.env.LD_LIBRARY_PATH].filter(Boolean).join(":");
  }
  return puppeteer.launch({
    args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--single-process"],
    defaultViewport: { width: SLIDE_W, height: SLIDE_H, deviceScaleFactor: 2 },
    executablePath,
    headless: true,
    ignoreHTTPSErrors: true,
  });
}

// htmls: array of full HTML documents. Returns array of PNG Buffers, same order.
export async function renderSlides(htmls) {
  const inlined = new Map();
  for (const html of htmls) {
    const link = html.match(/<link[^>]+fonts\.googleapis\.com[^>]+>/)?.[0];
    const href = link?.match(/href=['"]([^'"]+)['"]/)?.[1];
    if (link && href && !inlined.has(link)) {
      const css = await inlineFontCss(href);
      if (css) inlined.set(link, `<style>${css}</style>`);
    }
  }

  const browser = await launchBrowser();
  try {
    const out = [];
    for (const html of htmls) {
      let doc = html;
      for (const [link, style] of inlined) doc = doc.replace(link, style);
      const page = await browser.newPage();
      await page.setViewport({ width: SLIDE_W, height: SLIDE_H, deviceScaleFactor: 2 });
      await page.setContent(doc, { waitUntil: "networkidle0", timeout: 25000 });
      await page.evaluateHandle("document.fonts.ready");
      out.push(await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: SLIDE_W, height: SLIDE_H } }));
      await page.close();
    }
    return out;
  } finally {
    await browser.close().catch(() => {});
  }
}
