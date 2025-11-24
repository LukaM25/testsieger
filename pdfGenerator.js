import core from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
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
let browserPromise;

async function getBrowser() {
  if (global.browserInstance && global.browserInstance.isConnected()) {
    return global.browserInstance;
  }

  console.log('🚀 Launching Browser...');
  const isProduction = process.env.NODE_ENV === 'production';
  let launchOptions;

  if (isProduction) {
    // --- VERCEL CONFIGURATION ---
    chromium.setGraphicsMode = false;
    
    // SAFETY NET: If local binary is missing, download it.
    // This fixes the "input directory does not exist" error permanently.
    const executablePath = await chromium.executablePath(
      // Pass a remote URL as a fallback if the local file isn't traced correctly
      "https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar"
    );

    launchOptions = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    };
  } else {
    // --- LOCAL CONFIGURATION ---
    const { executablePath } = await import('puppeteer');
    launchOptions = {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: executablePath(),
      headless: 'new',
    };
  }

  global.browserInstance = await core.launch(launchOptions);
  return global.browserInstance;
}

export async function generateCertificatePdf(data) {
  let page = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // 1. Read Template (Safe Path Resolution)
    const templatePath = path.join(process.cwd(), 'templates', 'certificate.hbs');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateHtml);
    const html = template(data);

    // 2. Set Content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000, 
    });

    // 3. Force Font Load
    await page.evaluateHandle('document.fonts.ready');

    // 4. Print
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return pdfBuffer;

  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    if (global.browserInstance) {
        try { await global.browserInstance.close(); } catch (e) {}
        global.browserInstance = null;
    }
    throw new Error(`PDF Gen Failed: ${error.message}`);
  } finally {
    if (page) await page.close();
  }
}