import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  const url = process.env.URL || 'http://localhost:3000/';
  const browser = await chromium.launch();
  const context = await browser.newContext({ recordVideo: { dir: '.output', size: { width: 800, height: 600 } } });
  const page = await context.newPage();
  try {
    console.log('Recording video for', url);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const hero = await page.waitForSelector('section.relative.overflow-hidden.bg-slate-950', { timeout: 5000 });
    await hero.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800); // allow reveal to run
    // close page to finalize video
    await page.close();
    // find video file
    await context.close();
    await browser.close();

    const outDir = path.resolve('.output');
    if (!fs.existsSync(outDir)) {
      console.error('No .output dir found');
      process.exit(2);
    }
    const files = fs.readdirSync(outDir).filter((f) => f.endsWith('.webm') || f.endsWith('.mp4'));
    if (files.length === 0) {
      console.error('No video file produced');
      process.exit(3);
    }
    console.log('Video saved:', path.join(outDir, files[0]));
  } catch (err) {
    console.error(err);
    await browser.close();
    process.exit(1);
  }
})();
