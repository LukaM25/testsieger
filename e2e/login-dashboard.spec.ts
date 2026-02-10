import { test, expect } from '@playwright/test';

import { fulfillJson, installCommonAppMocks } from './helpers/mockApi';

test.describe('Customer authenticated dashboard flow', () => {
  test('logs in and validates dashboard buttons/actions end-to-end', async ({ page }) => {
    await installCommonAppMocks(page);

    const products = [
      {
        id: 'prod-open-1',
        name: 'Kaffeemaschine Pro',
        brand: 'AromaTech',
        paymentStatus: 'PAID',
        adminProgress: 'PASS',
        status: 'PAID',
        createdAt: new Date().toISOString(),
        certificate: { id: 'cert-1', pdfUrl: null },
        license: null,
      },
      {
        id: 'prod-open-2',
        name: 'Smart Lampe',
        brand: 'LumenCo',
        paymentStatus: 'UNPAID',
        adminProgress: 'PRECHECK',
        status: 'PRECHECK',
        createdAt: new Date().toISOString(),
        certificate: null,
        license: null,
      },
    ];

    const productById = new Map(products.map((product) => [product.id, product]));

    let loginRequestBody: any = null;
    let accountPatchBody: any = null;

    let cartState = {
      cartId: 'cart-1',
      items: [] as Array<{
        id: string;
        productId: string;
        productName: string;
        productBrand?: string | null;
        plan: string;
        basePriceCents: number;
        discountPercent: number;
        finalPriceCents: number;
        savingsCents: number;
        eligible: boolean;
      }>,
      totals: {
        baseCents: 0,
        savingsCents: 0,
        totalCents: 0,
        itemCount: 0,
      },
    };

    await page.route('**/api/auth/login', async (route) => {
      loginRequestBody = route.request().postDataJSON();
      await fulfillJson(route, 200, {
        ok: true,
        redirect: '/dashboard?preview=1',
      });
    });

    await page.route('**/api/precheck/products', async (route) => {
      await fulfillJson(route, 200, { products });
    });

    await page.route('**/api/precheck/pay', async (route) => {
      await fulfillJson(route, 200, {
        ok: true,
        url: '/precheck?productId=prod-open-2&checkout=success',
      });
    });

    await page.route('**/api/license-cart', async (route) => {
      const method = route.request().method();

      if (method === 'GET') {
        await fulfillJson(route, 200, cartState);
        return;
      }

      if (method === 'POST') {
        const body = route.request().postDataJSON() as { productId: string; plan: string };
        const product = productById.get(body.productId);
        const basePriceCents = body.plan === 'PREMIUM' ? 39785 : body.plan === 'LIFETIME' ? 146000 : 36135;

        cartState = {
          cartId: 'cart-1',
          items: [
            {
              id: `item-${body.productId}`,
              productId: body.productId,
              productName: product?.name || 'Produkt',
              productBrand: product?.brand || null,
              plan: body.plan,
              basePriceCents,
              discountPercent: 0,
              finalPriceCents: basePriceCents,
              savingsCents: 0,
              eligible: true,
            },
          ],
          totals: {
            baseCents: basePriceCents,
            savingsCents: 0,
            totalCents: basePriceCents,
            itemCount: 1,
          },
        };

        await fulfillJson(route, 200, { ok: true });
        return;
      }

      if (method === 'DELETE') {
        cartState = {
          cartId: 'cart-1',
          items: [],
          totals: { baseCents: 0, savingsCents: 0, totalCents: 0, itemCount: 0 },
        };
        await fulfillJson(route, 200, { ok: true });
        return;
      }

      await fulfillJson(route, 405, { error: 'METHOD_NOT_ALLOWED' });
    });

    await page.route('**/api/license-cart/checkout', async (route) => {
      await fulfillJson(route, 200, { url: '/dashboard?preview=1&licenseCheckout=success' });
    });

    await page.route('**/api/licenses/active', async (route) => {
      await fulfillJson(route, 200, {
        items: [
          {
            productId: 'prod-open-1',
            productName: 'Kaffeemaschine Pro',
            plan: 'BASIC',
            activeSince: new Date().toISOString(),
            sealUrl: '/siegel.png',
          },
        ],
      });
    });

    await page.route('**/api/account', async (route) => {
      if (route.request().method() === 'PATCH') {
        accountPatchBody = route.request().postDataJSON();
        await fulfillJson(route, 200, { ok: true });
        return;
      }

      await fulfillJson(route, 200, { ok: true });
    });

    await page.route('**/api/orders/receipt', async (route) => {
      await fulfillJson(route, 200, { receiptUrl: '/tmp/receipt.pdf' });
    });

    await page.route('**/api/auth/logout', async (route) => {
      await fulfillJson(route, 200, { ok: true });
    });

    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

    const passwordInput = page.getByPlaceholder('Passwort');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Passwort anzeigen' }).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await page.getByPlaceholder('E-Mail').fill('kunde@example.com');
    await passwordInput.fill('SehrSicher123!');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/dashboard\?preview=1/);
    await expect(page.getByRole('heading', { name: /Willkommen/ })).toBeVisible();

    expect(loginRequestBody.email).toBe('kunde@example.com');
    expect(loginRequestBody.password).toBe('SehrSicher123!');

    await page.getByRole('button', { name: /Meine Zertifizierungen/ }).click();
    await expect(page.locator('#certifications-section').getByText('Kaffeemaschine Pro')).toBeVisible();
    await expect(page.locator('#certifications-section').getByRole('button', { name: 'Grundgebühr zahlen' })).toBeVisible();

    await page.getByRole('button', { name: '+hinzufügen' }).click();
    await expect(page).toHaveURL(/\/precheck/);
    await page.goto('/dashboard?preview=1');
    await expect(page).toHaveURL(/\/dashboard\?preview=1/);

    await page.getByRole('button', { name: 'Zum Warenkorb hinzufügen' }).first().click();

    const cartSection = page.locator('section', { hasText: 'Warenkorb' });
    await expect(cartSection.getByText('Kaffeemaschine Pro').first()).toBeVisible();
    await expect(cartSection.getByRole('button', { name: 'Entfernen' })).toBeVisible();

    await page.getByRole('button', { name: 'Plan aktualisieren' }).first().click();
    await expect(cartSection.getByText('Premium').first()).toBeVisible();

    await cartSection.getByRole('button', { name: 'Entfernen' }).click();
    await expect(cartSection.getByText('Noch keine Lizenzpläne im Warenkorb.')).toBeVisible();

    await page.getByRole('button', { name: 'Zum Warenkorb hinzufügen' }).first().click();
    await expect(cartSection.getByText('Kaffeemaschine Pro').first()).toBeVisible();

    await cartSection.getByRole('button', { name: 'Siegel jetzt aktivieren' }).click();
    await expect(page.getByText('Zahlung bestätigt')).toBeVisible();
    await page.getByRole('button', { name: 'Weiter' }).click();

    await page.getByRole('button', { name: /Abrechnung & Lizenzen/ }).click();
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: 'Rechnung PDF' }).first().click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/\/tmp\/receipt\.pdf/);
    await popup.close();

    await expect(page.getByText('Noch keine Lizenzen aktiv.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Testsieger Siegel (PNG)' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Konto Einstellungen' }).first().click();
    await page.getByPlaceholder('E-Mail-Adresse').fill('neu@example.com');
    await page.getByRole('button', { name: 'Änderungen speichern' }).click();

    await expect(page.getByText('Account-Einstellungen gespeichert.')).toBeVisible();
    expect(accountPatchBody.email).toBe('neu@example.com');

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
