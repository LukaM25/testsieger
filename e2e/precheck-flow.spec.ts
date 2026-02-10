import { test, expect } from '@playwright/test';

import { fulfillJson, installCommonAppMocks } from './helpers/mockApi';

test.describe('Precheck customer flows', () => {
  test('selects product and starts checkout payment', async ({ page }) => {
    await installCommonAppMocks(page);

    let paid = false;
    let payRequestBody: any = null;

    await page.route('**/api/precheck/products', async (route) => {
      await fulfillJson(route, 200, {
        products: [
          {
            id: 'prod-open-1',
            name: 'Wasserkocher Pro',
            brand: 'HeatCo',
            paymentStatus: paid ? 'PAID' : 'UNPAID',
            adminProgress: 'PRECHECK',
            status: 'PRECHECK',
            createdAt: new Date().toISOString(),
            certificate: null,
            license: null,
          },
        ],
      });
    });

    await page.route('**/api/precheck/pay', async (route) => {
      payRequestBody = route.request().postDataJSON();
      paid = true;
      await fulfillJson(route, 200, {
        url: '/precheck?checkout=success&productId=prod-open-1',
      });
    });

    await page.route('**/api/products/quick-create', async (route) => {
      await fulfillJson(route, 400, { error: 'NOT_USED_IN_THIS_TEST' });
    });

    await page.goto('/precheck');

    const productCheckbox = page.locator('#product-select-prod-open-1');
    await expect(productCheckbox).toBeVisible();

    await productCheckbox.check();
    await expect(productCheckbox).toBeChecked();

    await page.getByRole('button', { name: 'Zum Checkout' }).first().click();

    await expect
      .poll(() => payRequestBody, { message: 'wait for /api/precheck/pay payload' })
      .not.toBeNull();

    expect(payRequestBody.productIds).toContain('prod-open-1');
    expect(payRequestBody.option).toBe('standard');

    await expect(page.getByText('Zahlung bestätigt')).toBeVisible();
    await expect(page).toHaveURL(/\/precheck/);
  });

  test('submits an additional product through inline precheck form', async ({ page }) => {
    await installCommonAppMocks(page);

    let createdPayload: any = null;

    await page.route('**/api/precheck/products', async (route) => {
      await fulfillJson(route, 200, { products: [] });
    });

    await page.route('**/api/precheck/pay', async (route) => {
      await fulfillJson(route, 400, { error: 'NOT_USED_IN_THIS_TEST' });
    });

    await page.route('**/api/products/quick-create', async (route) => {
      createdPayload = route.request().postDataJSON();
      await fulfillJson(route, 200, {
        product: {
          id: 'prod-new-1',
          name: createdPayload.productName,
          brand: createdPayload.brand,
          paymentStatus: 'UNPAID',
          adminProgress: 'PRECHECK',
          status: 'PRECHECK',
          createdAt: new Date().toISOString(),
        },
      });
    });

    await page.goto('/precheck');

    await page.getByRole('button', { name: 'Weitere Produkte einreichen' }).first().click();

    await page.getByPlaceholder('Produktname').fill('Bluetooth Lautsprecher X');
    await page.getByPlaceholder('Marke').fill('AudioNova');
    await page.locator('select').filter({ hasText: 'Nichts ausgewählt' }).first().selectOption({ label: 'Baby' });
    await page.getByPlaceholder('Artikelnummer').fill('BN-12345');
    await page.getByPlaceholder('Spezifikationen').fill('Robust, spritzwassergeschützt, kabellos.');
    await page.getByPlaceholder('Länge').fill('10');
    await page.getByPlaceholder('Breite').fill('20');
    await page.getByPlaceholder('Höhe').fill('30');
    await page.locator('select').filter({ hasText: 'Hergestellt in' }).first().selectOption({ label: 'Deutschland' });
    await page.getByPlaceholder('Material').fill('Kunststoff');

    await page.getByRole('button', { name: 'Produkt einreichen' }).click();

    await expect
      .poll(() => createdPayload, { message: 'wait for /api/products/quick-create payload' })
      .not.toBeNull();

    expect(createdPayload.productName).toBe('Bluetooth Lautsprecher X');
    expect(createdPayload.size).toBe('10x20x30');

    await expect(page.getByText('Produkt angelegt.')).toBeVisible();
    await expect(page.getByText('Bluetooth Lautsprecher X')).toBeVisible();
  });
});
