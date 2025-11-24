import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';

// --- Helpers ---
Handlebars.registerHelper('default', (value, defaultValue) => value || defaultValue);
Handlebars.registerHelper('date', (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US');
});

// --- Singleton Browser Logic ---
// We attach the browser instance to the global object so it survives Next.js hot reloads.
let browserPromise;

async function getBrowser() {
  if (global.browserInstance) {
    // Check if the browser is still actually connected
    if (global.browserInstance.isConnected()) {
      return global.browserInstance;
    }
  }

  console.log('🚀 Launching Chrome Instance...');
  
  global.browserInstance = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
    // Force usage of the installed dependency to prevent path issues
    executablePath: puppeteer.executablePath(), 
  });

  return global.browserInstance;
}

export async function generateCertificatePdf(data) {
  let page = null;
  try {
    const browser = await getBrowser();
    
    // Create a new tab (Context)
    page = await browser.newPage();

    // 1. Compile Template
    // (In production, you'd cache this fs.read)
    const templatePath = path.join(process.cwd(), 'templates', 'certificate.hbs');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateHtml);
    const html = template(data);

    // 2. Set Content
    await page.setContent(html, {
      waitUntil: 'networkidle0', // Wait for fonts/images
      timeout: 30000, 
    });

    // 3. Force Font Check
    await page.evaluateHandle('document.fonts.ready');

    // 4. Generate Buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return pdfBuffer;

  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    // If the browser crashed, kill the global ref so it restarts next time
    if (global.browserInstance) {
        try { await global.browserInstance.close(); } catch (e) {}
        global.browserInstance = null;
    }
    throw new Error(`PDF Gen Failed: ${error.message}`);
  } finally {
    // CRITICAL: Always close the tab, never close the browser
    if (page) await page.close();
  }
}