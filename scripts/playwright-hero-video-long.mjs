import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  const url = process.env.URL || 'http://localhost:3000/';
  const browser = await chromium.launch();
  const context = await browser.newContext({ recordVideo: { dir: '.output', size: { width: 1280, height: 720 } } });
  const page = await context.newPage();
  try {
    console.log('Recording longer video for', url);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const hero = await page.waitForSelector('section.relative.overflow-hidden.bg-slate-950', { timeout: 5000 });
    await hero.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500); // longer wait to ensure full reveal
    await page.close();
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
    // print newest file
    const newest = files.map((f) => ({ f, t: fs.statSync(path.join(outDir, f)).mtimeMs })).sort((a, b) => b.t - a.t)[0].f;
    console.log('Video saved:', path.join(outDir, newest));
  } catch (err) {
    console.error(err);
    await browser.close();
    process.exit(1);
  }
})();
