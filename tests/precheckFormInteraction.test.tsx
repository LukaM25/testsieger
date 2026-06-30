import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={typeof href === 'string' ? href : '#'} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'de' }),
}));

import PrecheckForm from '../components/precheck/PrecheckForm';

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  );
}

function fillValidPrecheckForm() {
  const byName = (name: string) => document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

  fireEvent.change(byName('email'), { target: { value: 'max@example.com' } });

  fireEvent.change(byName('category'), { target: { value: 'Baby' } });
  fireEvent.change(byName('productName'), { target: { value: 'Testprodukt' } });
  fireEvent.change(byName('brand'), { target: { value: 'Marke X' } });
  fireEvent.change(byName('code'), { target: { value: 'SKU-123' } });
  fireEvent.change(byName('specs'), { target: { value: 'Wasserdicht, langlebig und energiesparend' } });

  fireEvent.click(byName('privacyAccepted'));
}

describe('Precheck form interactions', () => {
  beforeEach(() => {
    vi.stubGlobal('alert', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test('does not ask for a password on initial precheck submission', () => {
    render(<PrecheckForm />);

    expect(document.querySelector('[name="password"]')).toBeNull();
    expect(document.querySelector('[name="confirmPassword"]')).toBeNull();
    expect(document.querySelector('[name="firstName"]')).toBeNull();
    expect(document.querySelector('[name="addressStreet"]')).toBeNull();
    expect(document.querySelector('[name="dimensionLength"]')).toBeNull();
  });

  test('submits transformed payload and shows email handoff on success', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        ok: true,
        pending: true,
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<PrecheckForm />);
    fillValidPrecheckForm();

    fireEvent.click(screen.getByRole('button', { name: 'Jetzt starten' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, options] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(url).toBe('/api/precheck');

    const payload = JSON.parse(options.body);
    expect(payload.email).toBe('max@example.com');
    expect(payload.productName).toBe('Testprodukt');
    expect(payload.brand).toBe('Marke X');
    expect(payload.category).toBe('Baby');
    expect(payload.code).toBe('SKU-123');
    expect(payload.specs).toBe('Wasserdicht, langlebig und energiesparend');
    expect(payload.name).toBeUndefined();
    expect(payload.size).toBeUndefined();
    expect(payload.address).toBeUndefined();
    expect(payload.password).toBeUndefined();

    expect(await screen.findByText(/Wir haben eine E-Mail an max@example.com gesendet/)).toBeTruthy();
  });
});
