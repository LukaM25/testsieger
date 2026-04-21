import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

const findManyMock = vi.fn();

vi.mock('../lib/prisma', () => ({
  prisma: {
    admin: {
      findMany: findManyMock,
    },
  },
}));

describe('precheck superadmin notifications', () => {
  beforeEach(() => {
    vi.resetModules();
    findManyMock.mockReset();
    process.env = {
      ...ORIGINAL_ENV,
      BREVO_API_KEY: 'test-key',
      BREVO_API_URL: 'https://example.invalid/v3/smtp/email',
    };
    delete process.env.SUPERADMIN_NOTIFICATION_EMAILS;
    delete process.env.SUPERADMIN_NOTIFICATION_EMAIL;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('emails active superadmins when a new precheck product is registered', async () => {
    findManyMock.mockResolvedValue([{ email: 'superadmin@example.com' }]);

    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '',
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { notifySuperadminsOfPrecheckRegistration } = await import('../lib/precheckNotifications');
    await notifySuperadminsOfPrecheckRegistration({
      productId: 'prod_123',
      productName: 'Solarleuchte Pro',
      brand: 'LumenWorks',
      category: 'Garten',
      code: 'SKU-42',
      customerName: 'Anna Meyer',
      customerEmail: 'anna@example.com',
      customerCompany: 'Lumen GmbH',
      sourceLabel: 'Precheck-Formular',
    });

    expect(findManyMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const payload = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(payload.to).toEqual([{ email: 'superadmin@example.com' }]);
    expect(payload.subject).toContain('Neuer Pre-Check: Solarleuchte Pro');
    expect(payload.htmlContent).toContain('Solarleuchte Pro');
    expect(payload.htmlContent).toContain('anna@example.com');
    expect(payload.htmlContent).toContain('Lumen GmbH');
    expect(payload.htmlContent).toContain('Zum Admin-Dashboard');
  });

  it('uses env fallback recipients when no superadmin records are present', async () => {
    findManyMock.mockResolvedValue([]);
    process.env.SUPERADMIN_NOTIFICATION_EMAILS = 'owner@example.com, second@example.com';

    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '',
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { notifySuperadminsOfPrecheckRegistration } = await import('../lib/precheckNotifications');
    await notifySuperadminsOfPrecheckRegistration({
      productId: 'prod_456',
      productName: 'Testprodukt',
      brand: 'Marke',
      customerName: 'Max Mustermann',
      customerEmail: 'max@example.com',
      sourceLabel: 'Dashboard-Produktanlage',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const recipients = fetchMock.mock.calls.map((call) => JSON.parse((call as [string, RequestInit])[1].body as string).to[0].email);
    expect(recipients).toEqual(['owner@example.com', 'second@example.com']);
  });
});
