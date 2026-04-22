import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

describe('precheck superadmin notifications', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      BREVO_API_KEY: 'test-key',
      BREVO_API_URL: 'https://example.invalid/v3/smtp/email',
    };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('emails active superadmins when a new precheck product is registered', async () => {
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

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const payload = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(payload.to).toEqual([{ email: 'info@dpi-siegel.de' }]);
    expect(payload.subject).toContain('Neuer Pre-Check: Solarleuchte Pro');
    expect(payload.htmlContent).toContain('Solarleuchte Pro');
    expect(payload.htmlContent).toContain('anna@example.com');
    expect(payload.htmlContent).toContain('Lumen GmbH');
    expect(payload.htmlContent).toContain('Zum Admin-Dashboard');
  });
});
