import { SLIDE_W, SLIDE_H } from "./slideTemplate.js";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

// Fetch a Google Fonts stylesheet and inline, as base64, only the latin
// @font-face blocks for families the documents actually use. The template
// stylesheet lists ~15 families, so inlining everything would be megabytes.
async function inlineFontCss(fontHref, usedFamilies) {
  try {
    const cssRes = await fetch(fontHref, { headers: { "User-Agent": UA } });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const blocks = css.split("@font-face").slice(1);
    const kept = [];
    for (const raw of blocks) {
      const block = "@font-face" + raw;
      const family = block.match(/font-family:\s*'([^']+)'/)?.[1];
      const isLatin = /\/\*\s*latin\s*\*\//.test(raw) || !/unicode-range/.test(raw);
      if (!family || !isLatin || !usedFamilies.has(family)) continue;
      const url = block.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/)?.[1];
      if (!url) continue;
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const b64 = Buffer.from(await r.arrayBuffer()).toString("base64");
        const ext = url.includes(".woff2") ? "woff2" : "woff";
        kept.push(block.replace(url, `data:font/${ext};base64,${b64}`).replace(/\/\*[^*]*\*\//g, ""));
      } catch {}
    }
    return kept.join("\n");
  } catch {
    return null;
  }
}

function familiesUsed(htmls, css) {
  const names = new Set([...css.matchAll(/font-family:\s*'([^']+)'/g)].map((m) => m[1]));
  const used = new Set();
  for (const name of names) {
    if (htmls.some((h) => h.includes(`'${name}'`) || h.includes(`font-family:${name},`) || h.includes(`font-family: ${name},`) || h.includes(`family=${name.replace(/ /g, "+")}`))) used.add(name);
  }
  return used;
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
    if (!link || !href || inlined.has(link)) continue;
    let css = null;
    try {
      const r = await fetch(href, { headers: { "User-Agent": UA } });
      if (r.ok) css = await r.text();
    } catch {}
    const used = css ? familiesUsed(htmls, css) : new Set();
    const style = css ? await inlineFontCss(href, used) : null;
    if (style) inlined.set(link, `<style>${style}</style>`);
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
      if (doc.includes("__TEXT_FIT_DONE__")) {
        await page.waitForFunction("window.__TEXT_FIT_DONE__ === true", { timeout: 4000 }).catch(() => {});
      }
      out.push(await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: SLIDE_W, height: SLIDE_H } }));
      await page.close();
    }
    return out;
  } finally {
    await browser.close().catch(() => {});
  }
}
