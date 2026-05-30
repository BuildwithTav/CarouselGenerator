import { NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const maxDuration = 60;

export async function POST(request) {
  let browser = null;
  try {
    const { html, width = 1080, height = 1080 } = await request.json();

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width, height },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width, height },
      omitBackground: false,
    });

    await browser.close();

    return new NextResponse(screenshot, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': screenshot.length.toString(),
      },
    });
  } catch (error) {
    if (browser) await browser.close().catch(() => {});
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
