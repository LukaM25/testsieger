import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export async function renderHtmlToPdfBuffer(html: string): Promise<Buffer> {
  const execPath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    (await chromium.executablePath().catch(() => null)) ||
    undefined;

  if (!execPath) {
    throw new Error('CHROMIUM_EXECUTABLE_NOT_FOUND');
  }

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: execPath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
