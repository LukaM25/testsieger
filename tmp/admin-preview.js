const { chromium } = require('playwright');

const mockProducts = (() => {
  const now = Date.now();
  const day2 = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const day3 = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
  return [
    {
      id: 'prod-1',
      name: 'Kaffeemaschine Pro',
      brand: 'AromaTech',
      category: 'Kueche',
      code: 'KM-PRO-2026',
      specs: '2L, 1600W, Edelstahl',
      size: '32 x 24 x 40 cm',
      madeIn: 'Deutschland',
      material: 'Edelstahl',
      status: 'PAID',
      adminProgress: 'PASS',
      paymentStatus: 'PAID',
      baseFeePlan: 'PRECHECK_PRIORITY',
      licensePaid: true,
      createdAt: day2,
      processNumber: 'TS-2026-001',
      user: {
        name: 'Anna Mueller',
        company: 'Brew GmbH',
        email: 'anna@brew.example',
        address: 'Musterweg 12, 10115 Berlin',
      },
      certificate: {
        id: 'cert-1',
        pdfUrl: null,
        qrUrl: null,
        seal_number: 'SEAL-0001',
        ratingScore: '1,3',
        ratingLabel: 'Sehr gut',
        sealUrl: null,
        reportUrl: null,
      },
      license: {
        id: 'lic-1',
        plan: 'PREMIUM',
        status: 'ACTIVE',
        licenseCode: 'LIC-0001',
        startsAt: day2,
        expiresAt: new Date(now + 340 * 24 * 60 * 60 * 1000).toISOString(),
        paidAt: day2,
      },
    },
    {
      id: 'prod-2',
      name: 'Milchaufschaeumer X',
      brand: 'AromaTech',
      category: 'Kueche',
      code: 'MX-100',
      specs: '500ml, 700W',
      size: '12 x 12 x 20 cm',
      madeIn: 'Polen',
      material: 'Kunststoff',
      status: 'PAID',
      adminProgress: 'ANALYSIS',
      paymentStatus: 'PAID',
      baseFeePlan: 'PRECHECK_FEE',
      licensePaid: false,
      createdAt: day2,
      processNumber: 'TS-2026-002',
      user: {
        name: 'Anna Mueller',
        company: 'Brew GmbH',
        email: 'anna@brew.example',
        address: 'Musterweg 12, 10115 Berlin',
      },
      certificate: null,
      license: null,
    },
    {
      id: 'prod-3',
      name: 'Smart Lampe Lumen',
      brand: 'LumenCo',
      category: 'Elektronik',
      code: 'SL-900',
      specs: 'RGB, WiFi, 9W',
      size: '8 x 8 x 14 cm',
      madeIn: 'China',
      material: 'Alu/Glas',
      status: 'PRECHECK',
      adminProgress: 'PRECHECK',
      paymentStatus: 'MANUAL',
      baseFeePlan: 'PRECHECK_PRIORITY',
      licensePaid: false,
      createdAt: day2,
      processNumber: 'TS-2026-003',
      user: {
        name: 'Lena Fischer',
        company: 'LumenCo AG',
        email: 'lena@lumen.example',
        address: 'Lichtallee 7, 80331 Muenchen',
      },
      certificate: null,
      license: null,
    },
    {
      id: 'prod-4',
      name: 'Buerostuhl Ergo',
      brand: 'ErgoWorks',
      category: 'Bueromoebel',
      code: 'ERGO-500',
      specs: 'Netzruecken, 120kg',
      size: '70 x 70 x 120 cm',
      madeIn: 'Deutschland',
      material: 'Stahl/Polyester',
      status: 'PAID',
      adminProgress: 'RECEIVED',
      paymentStatus: 'PAID',
      baseFeePlan: 'PRECHECK_FEE',
      licensePaid: false,
      createdAt: day3,
      processNumber: 'TS-2026-004',
      user: {
        name: 'Markus Klein',
        company: 'ErgoWorks',
        email: 'markus@ergoworks.example',
        address: 'Hauptstrasse 20, 50667 Koeln',
      },
      certificate: null,
      license: null,
    },
  ];
})();

const mockResponse = {
  products: mockProducts,
  total: mockProducts.length,
  statusCounts: {
    PRECHECK: 1,
    RECEIVED: 1,
    ANALYSIS: 1,
    PASS: 1,
  },
  nextCursor: null,
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.route('**/api/auth/logout', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/api/admin/me', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        admin: { id: 'admin-1', email: 'admin@example.com', name: 'Admin', role: 'SUPERADMIN' },
      }),
    });
  });

  await page.route('**/api/admin/products**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockResponse),
    });
  });

  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Batch:', { timeout: 10000 });
  await page.waitForTimeout(600);

  await page.screenshot({
    path: '/Users/lukamatanic/Web/testsieger-check-mvp-hero/tmp/admin-preview.png',
    fullPage: true,
  });

  await browser.close();
})();
