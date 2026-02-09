import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

describe('pre-check email salutations', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.BREVO_API_KEY = 'test-key';
    process.env.BREVO_API_URL = 'https://example.invalid/v3/smtp/email';
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses "Herr" for MALE in payment success email', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '',
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { sendPrecheckPaymentSuccess } = await import('../lib/email');
    await sendPrecheckPaymentSuccess({
      to: 'kunde@example.com',
      name: 'Max Lang',
      gender: 'MALE',
      productNames: ['Maulwurfvertreiber', 'Brunnen'],
      processNumber: 'TC-25256',
      receiptPdf: null,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const payload = JSON.parse((fetchMock.mock.calls[0] as any)[1].body);
    expect(payload.htmlContent).toContain('Sehr geehrter Herr Lang,');
    expect(payload.htmlContent).not.toContain('Sehr geehrter Herr Max Lang,');
    expect(payload.subject).toContain('Prüfgebühr bestätigt');
  });

  it('uses "Frau" for FEMALE in pre-check confirmation email', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '',
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { sendPrecheckConfirmation } = await import('../lib/email');
    await sendPrecheckConfirmation({
      to: 'kundin@example.com',
      name: 'Anna Meyer',
      gender: 'FEMALE',
      productName: 'Testprodukt',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const payload = JSON.parse((fetchMock.mock.calls[0] as any)[1].body);
    expect(payload.htmlContent).toContain('Guten Tag Frau Meyer,');
    expect(payload.htmlContent).not.toContain('Guten Tag Frau Anna Meyer,');
    expect(payload.subject).toContain('Pre-Check bestanden');
  });

  it('uses full name for OTHER in pre-check payment success email', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '',
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { sendPrecheckPaymentSuccess } = await import('../lib/email');
    await sendPrecheckPaymentSuccess({
      to: 'kunde@example.com',
      name: 'Alex Morgan',
      gender: 'OTHER',
      productNames: ['Produkt A'],
      processNumber: 'TC-25256',
      receiptPdf: null,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const payload = JSON.parse((fetchMock.mock.calls[0] as any)[1].body);
    expect(payload.htmlContent).toContain('Guten Tag Alex Morgan,');
    expect(payload.htmlContent).not.toContain('Herr Morgan');
    expect(payload.htmlContent).not.toContain('Frau Morgan');
  });

  it('uses only last name in non-gendered greetings', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '',
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { sendLicensePlanReminderEmail } = await import('../lib/email');
    await sendLicensePlanReminderEmail({
      to: 'kunde@example.com',
      name: 'Marie von Stein',
      productName: 'Testprodukt',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const payload = JSON.parse((fetchMock.mock.calls[0] as any)[1].body);
    expect(payload.htmlContent).toContain('Guten Tag Stein,');
    expect(payload.htmlContent).not.toContain('Guten Tag Marie von Stein,');
  });

  it('uses full name for OTHER in non-formal reminders', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => '',
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { sendLicensePlanReminderEmail } = await import('../lib/email');
    await sendLicensePlanReminderEmail({
      to: 'kunde@example.com',
      name: 'Taylor Jordan',
      gender: 'OTHER',
      productName: 'Testprodukt',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const payload = JSON.parse((fetchMock.mock.calls[0] as any)[1].body);
    expect(payload.htmlContent).toContain('Guten Tag Taylor Jordan,');
    expect(payload.htmlContent).not.toContain('Guten Tag Jordan,');
  });
});
