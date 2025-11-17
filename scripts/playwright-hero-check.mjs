import { chromium } from 'playwright';

(async () => {
  const url = process.env.URL || 'http://localhost:3000/';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    console.log('Navigating to', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for hero to exist
    const hero = await page.waitForSelector('section.relative.overflow-hidden.bg-slate-950', { timeout: 5000 });
    if (!hero) {
      console.error('Hero section not found');
      await browser.close();
      process.exit(2);
    }

    // Scroll hero into view
    await hero.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // allow animations/observers to kick in

    const revealed = await page.evaluate(() => {
      const parent = document.querySelector('section.relative.overflow-hidden.bg-slate-950 [data-revealed]');
      const out = { parentAttr: parent ? parent.getAttribute('data-revealed') : null, items: [] };
      const items = document.querySelectorAll('section.relative.overflow-hidden.bg-slate-950 .reveal');
      items.forEach((el) => {
        const style = window.getComputedStyle(el);
        out.items.push({ text: (el.textContent || '').trim().slice(0, 80), opacity: style.opacity, transform: style.transform });
      });
      return out;
    });

    console.log('Reveal status:', JSON.stringify(revealed, null, 2));
    await browser.close();
  } catch (err) {
    console.error(err);
    await browser.close();
    process.exit(1);
  }
})();
