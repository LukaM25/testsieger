import { test, expect } from '@playwright/test';
import { PrismaClient, Plan } from '@prisma/client';
import bcrypt from 'bcryptjs';

type SeedScenario = {
  userId: string;
  email: string;
  password: string;
  paidProductName: string;
  activeProductName: string;
  unpaidProductName: string;
};

const prisma = new PrismaClient();

const rand = () => Math.random().toString(36).slice(2, 10);

async function seedDashboardScenario(): Promise<SeedScenario> {
  const token = `${Date.now()}_${rand()}`;
  const email = `e2e.dashboard.${token}@example.com`;
  const password = 'E2eDashboardPassw0rd!';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: 'E2E Dashboard User',
      email,
      passwordHash,
      address: 'Musterstrasse 1, 10115 Berlin',
      active: true,
    },
  });

  const paidProduct = await prisma.product.create({
    data: {
      userId: user.id,
      name: 'E2E Kaffeemaschine',
      brand: 'E2E Brand',
      category: 'Kueche',
      code: `SKU-${rand()}`,
      specs: 'Robust and reliable for test automation',
      size: '10x20x30',
      madeIn: 'Deutschland',
      material: 'Edelstahl',
      status: 'PAID',
      adminProgress: 'PASS',
      paymentStatus: 'PAID',
    },
  });

  const unpaidProduct = await prisma.product.create({
    data: {
      userId: user.id,
      name: 'E2E Unpaid Produkt',
      brand: 'E2E Brand',
      category: 'Elektronik',
      code: `SKU-${rand()}`,
      specs: 'Awaiting base fee payment',
      size: '9x9x9',
      madeIn: 'Deutschland',
      material: 'Kunststoff',
      status: 'PRECHECK',
      adminProgress: 'PRECHECK',
      paymentStatus: 'UNPAID',
    },
  });

  const activeProduct = await prisma.product.create({
    data: {
      userId: user.id,
      name: 'E2E Active Lizenz Produkt',
      brand: 'E2E Brand',
      category: 'Haushalt',
      code: `SKU-${rand()}`,
      specs: 'Has active license',
      size: '11x22x33',
      madeIn: 'Deutschland',
      material: 'Aluminium',
      status: 'PAID',
      adminProgress: 'PASS',
      paymentStatus: 'PAID',
    },
  });

  await prisma.license.create({
    data: {
      productId: activeProduct.id,
      plan: Plan.BASIC,
      status: 'ACTIVE',
      licenseCode: `E2E-LIC-${token}`,
      startsAt: new Date(),
      paidAt: new Date(),
    },
  });

  await prisma.order.create({
    data: {
      userId: user.id,
      productId: paidProduct.id,
      plan: Plan.PRECHECK_FEE,
      priceCents: 22900,
      paidAt: new Date(),
    },
  });

  const cart = await prisma.licenseCart.create({
    data: { userId: user.id },
  });

  await prisma.licenseCartItem.create({
    data: {
      cartId: cart.id,
      productId: paidProduct.id,
      plan: Plan.BASIC,
    },
  });

  return {
    userId: user.id,
    email,
    password,
    paidProductName: paidProduct.name,
    activeProductName: activeProduct.name,
    unpaidProductName: unpaidProduct.name,
  };
}

async function cleanupDashboardScenario(userId: string) {
  await prisma.licenseCartItem.deleteMany({ where: { cart: { userId } } });
  await prisma.licenseCart.deleteMany({ where: { userId } });
  await prisma.license.deleteMany({ where: { product: { userId } } });
  await prisma.order.deleteMany({ where: { userId } });
  await prisma.certificate.deleteMany({ where: { product: { userId } } });
  await prisma.product.deleteMany({ where: { userId } });
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
}

test.describe.serial('Full-stack dashboard actions @fullstack', () => {
  test.skip(!process.env.RUN_FULLSTACK_E2E, 'RUN_FULLSTACK_E2E is not enabled');

  let scenario: SeedScenario;

  test.beforeAll(async () => {
    scenario = await seedDashboardScenario();
  });

  test.afterAll(async () => {
    if (scenario?.userId) {
      await cleanupDashboardScenario(scenario.userId);
    }
    await prisma.$disconnect();
  });

  test('executes real dashboard button flows without API mocks', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('E-Mail').fill(scenario.email);
    await page.getByPlaceholder('Passwort').fill(scenario.password);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /Willkommen/ })).toBeVisible();

    await page.getByRole('button', { name: 'Konto Einstellungen' }).first().click();
    await expect(page.getByPlaceholder('E-Mail-Adresse')).toBeVisible();
    const updatedEmail = scenario.email.replace('@example.com', '.updated@example.com');
    await page.getByPlaceholder('E-Mail-Adresse').fill(updatedEmail);
    await page.getByPlaceholder('Stadt').fill('Hamburg');
    await page.getByRole('button', { name: 'Änderungen speichern' }).click();
    await expect(page.getByText('Account-Einstellungen gespeichert.')).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole('button', { name: 'Konto Einstellungen' }).first().click();
    await expect(page.getByPlaceholder('E-Mail-Adresse')).toHaveValue(updatedEmail);
    await page.getByRole('button', { name: 'Konto Einstellungen' }).first().click();
    await expect(page.getByPlaceholder('E-Mail-Adresse')).toBeHidden();

    await page.getByRole('button', { name: '+hinzufügen' }).click();
    await expect(page).toHaveURL(/\/precheck/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('button', { name: /Meine Zertifizierungen/ }).click();
    await expect(page.locator('#certifications-section').getByText(scenario.paidProductName)).toBeVisible();
    await expect(page.locator('#certifications-section').getByText(scenario.unpaidProductName)).toBeVisible();

    const cartSection = page.locator('section', { hasText: 'Warenkorb' });
    await expect(cartSection.getByText(scenario.paidProductName).first()).toBeVisible();
    await cartSection.getByRole('button', { name: 'Entfernen' }).first().click();
    await expect(cartSection.getByText('Noch keine Lizenzpläne im Warenkorb.')).toBeVisible();

    await page.getByRole('button', { name: new RegExp(scenario.paidProductName) }).first().click();
    await page
      .getByRole('button', { name: /Zum Warenkorb hinzufügen|Plan aktualisieren/ })
      .first()
      .click();
    await expect(cartSection.getByText(scenario.paidProductName).first()).toBeVisible();
    await expect(cartSection.getByText('Produkt konnte nicht hinzugefügt werden.')).toHaveCount(0);

    await page.getByRole('button', { name: /Abrechnung & Lizenzen/ }).click();
    await expect(page.getByText('Rechnungen', { exact: true })).toBeVisible();

    const receiptResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' && response.url().includes('/api/orders/receipt')
    );
    const receiptPopupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: 'Rechnung PDF' }).first().click();
    const receiptResponse = await receiptResponsePromise;
    expect(receiptResponse.ok()).toBeTruthy();
    const receiptPayload = await receiptResponse.json();
    expect(receiptPayload.ok).toBeTruthy();
    expect(receiptPayload.receiptUrl).toMatch(/\/api\/orders\/receipt\/pdf\?orderId=/);
    const receiptPopup = await receiptPopupPromise;
    await receiptPopup.close();

    const cancelLink = page.getByRole('link', { name: 'Lizenz kündigen' }).first();
    await expect(cancelLink).toBeVisible();
    await expect(cancelLink).toHaveAttribute('href', /\/kontakt\?topic=lizenz-kuendigen/);

    await expect(page.getByText(scenario.activeProductName).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Testsieger Siegel (PNG)' }).first()).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
