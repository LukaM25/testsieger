import type { Page, Route } from '@playwright/test';

export async function fulfillJson(route: Route, status: number, data: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
}

export async function installCommonAppMocks(page: Page) {
  await page.route('**/api/auth/me', async (route) => {
    await fulfillJson(route, 401, { error: 'UNAUTHORIZED' });
  });

  await page.route('**/api/admin/me', async (route) => {
    await fulfillJson(route, 401, { error: 'UNAUTHORIZED' });
  });

  await page.route('**/search-index.json', async (route) => {
    await fulfillJson(route, 200, [
      {
        label: 'Kontakt',
        href: '/kontakt',
        excerpt: 'Kontaktieren Sie unser Team.',
        keywords: ['kontakt', 'support'],
      },
      {
        label: 'Produkte',
        href: '/produkte',
        excerpt: 'Produktübersicht und Leistungen.',
        keywords: ['produkt', 'tests'],
      },
    ]);
  });
}
