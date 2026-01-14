import core from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';

// --- Helpers ---
Handlebars.registerHelper('default', (value, defaultValue) => value || defaultValue);
Handlebars.registerHelper('date', (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('de-DE');
});
Handlebars.registerHelper('statusLabel', (value) => {
  if (!value) return 'AUSSTEHEND';
  const key = String(value).trim().toUpperCase();
  const labels = {
    PENDING: 'AUSSTEHEND',
    VERIFIED: 'VERIFIZIERT',
    COMPLETED: 'ABGESCHLOSSEN',
    IN_REVIEW: 'IN PRÜFUNG',
    PRECHECK: 'PRE-CHECK',
    RECEIVED: 'EINGEGANGEN',
    ANALYSIS: 'ANALYSE',
    COMPLETION: 'ABSCHLUSS',
    PASS: 'BESTANDEN',
    FAIL: 'NICHT BESTANDEN',
    PAID: 'BEZAHLT',
    MANUAL: 'MANUELL',
    UNPAID: 'UNBEZAHLT',
  };
  return labels[key] || value;
});
Handlebars.registerHelper('isPass', function (value, options) {
  const key = String(value || '').trim().toUpperCase();
  if (key === 'PASS' || this?.statusCheck === true) return options.fn(this);
  return options.inverse(this);
});

// Normalize incoming payloads so both flat and nested shapes render correctly
function normalizeCertificateData(data = {}) {
  const product = data.product || {};
  const certificate = data.certificate || {};
  const user = data.user || product.user || {};

  const createdAtRaw = data.createdAt ?? product.createdAt ?? certificate.createdAt;
  const createdAt =
    typeof createdAtRaw === 'string'
      ? createdAtRaw
      : createdAtRaw?.toISOString?.() || undefined;

  let verifyUrl = data.verify_url || data.verifyUrl;
  if (!verifyUrl && data.domain && data.certificateId) {
    verifyUrl = `${data.domain.replace(/\/$/, '')}/lizenzen?q=${encodeURIComponent(data.certificateId)}`;
  }

  const qrUrl = data.qrUrl || data.qrDataUrl || certificate.qrDataUrl || certificate.qrUrl;

  const baseDomain = (() => {
    const domain = data.domain || process.env.APP_URL || process.env.NEXT_PUBLIC_BASE_URL;
    if (typeof domain === 'string' && domain.trim()) return domain.replace(/\/$/, '');
    if (typeof verifyUrl === 'string' && /^https?:\/\//i.test(verifyUrl)) {
      try {
        return new URL(verifyUrl).origin;
      } catch {
        return undefined;
      }
    }
    return undefined;
  })();
  const logoUrl = baseDomain ? `${baseDomain}/dpilogo.png` : undefined;

  return {
    ...data,
    ...product,
    id: data.id || product.id,
    name: data.name || product.name,
    brand: data.brand || product.brand,
    category: data.category || product.category,
    code: data.code || product.code,
    specs: data.specs || product.specs,
    size: data.size || product.size,
    madeIn: data.madeIn || product.madeIn,
    material: data.material || product.material,
    createdAt,
    status: data.status || product.status || certificate.status,
    seal_number: data.seal_number || certificate.seal_number,
    verify_url: verifyUrl,
    qrUrl,
    logoUrl,
    certificate: {
      ...certificate,
      seal_number: certificate.seal_number || data.seal_number,
      pdfUrl: certificate.pdfUrl || data.pdfUrl,
      qrUrl: data.qrUrl || data.qrDataUrl || certificate.qrDataUrl || certificate.qrUrl || qrUrl,
      externalReferenceId: certificate.externalReferenceId || data.externalReferenceId,
      pdfmonkeyDocumentId: certificate.pdfmonkeyDocumentId || data.pdfmonkeyDocumentId,
    },
    user,
  };
}

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
    const html = template(normalizeCertificateData(data));

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
