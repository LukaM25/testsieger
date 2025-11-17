import { chromium } from 'playwright';

(async () => {
  const url = process.env.URL || 'http://localhost:3000/';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    console.log('Navigating to', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const hero = await page.waitForSelector('section.relative.overflow-hidden.bg-slate-950', { timeout: 5000 });
    if (!hero) throw new Error('Hero not found');
    await hero.scrollIntoViewIfNeeded();

    // Poll for reveal times: watch each .reveal element for when opacity becomes 1
    const times = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('section.relative.overflow-hidden.bg-slate-950 .reveal'));
      const results = items.map(() => ({ seen: false, time: null }));
      return { count: items.length };
    });

    const start = Date.now();
    const revealTimes = [];
    // wait up to 2s for all items to reveal
    const deadline = start + 2000;
    while (Date.now() < deadline) {
      const snapshot = await page.evaluate(() => {
        const elems = Array.from(document.querySelectorAll('section.relative.overflow-hidden.bg-slate-950 .reveal'));
        return elems.map((el) => ({ opacity: window.getComputedStyle(el).opacity }));
      });

      snapshot.forEach((s, idx) => {
        if (!revealTimes[idx] && s.opacity === '1') {
          revealTimes[idx] = Date.now() - start;
        }
      });

      if (revealTimes.filter(Boolean).length === (snapshot.length || 0)) break;
      await page.waitForTimeout(50);
    }

    console.log('Reveal times (ms since start):', revealTimes);

    // Evaluate simple assertions: times should be increasing (allow equal for near-simultaneous)
    let ok = true;
    for (let i = 1; i < revealTimes.length; i++) {
      const a = revealTimes[i - 1] ?? 0;
      const b = revealTimes[i] ?? 0;
      if (b < a - 40) {
        ok = false;
        console.error(`Reveal out-of-order: index ${i - 1}=${a}ms, index ${i}=${b}ms`);
      }
    }

    console.log('Stagger assertion:', ok ? 'PASS' : 'FAIL');
    await browser.close();
    process.exit(ok ? 0 : 3);
  } catch (err) {
    console.error(err);
    await browser.close();
    process.exit(2);
  }
})();
