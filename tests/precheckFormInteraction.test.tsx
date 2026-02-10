import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
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

function fillValidPrecheckForm(confirmPassword = 'SehrSicher123!') {
  const byName = (name: string) => document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

  fireEvent.change(byName('gender'), { target: { value: 'MALE' } });
  fireEvent.change(byName('firstName'), { target: { value: 'Max' } });
  fireEvent.change(byName('lastName'), { target: { value: 'Mustermann' } });
  fireEvent.change(byName('company'), { target: { value: 'Muster GmbH' } });
  fireEvent.change(byName('email'), { target: { value: 'max@example.com' } });
  fireEvent.change(byName('password'), { target: { value: 'SehrSicher123!' } });
  fireEvent.change(byName('confirmPassword'), { target: { value: confirmPassword } });

  fireEvent.change(byName('addressStreet'), { target: { value: 'Musterstraße' } });
  fireEvent.change(byName('addressNumber'), { target: { value: '12a' } });
  fireEvent.change(byName('addressPostal'), { target: { value: '12345' } });
  fireEvent.change(byName('addressCity'), { target: { value: 'Berlin' } });
  fireEvent.change(byName('addressCountry'), { target: { value: 'Deutschland' } });

  fireEvent.change(byName('category'), { target: { value: 'Baby' } });
  fireEvent.change(byName('productName'), { target: { value: 'Testprodukt' } });
  fireEvent.change(byName('brand'), { target: { value: 'Marke X' } });
  fireEvent.change(byName('code'), { target: { value: 'SKU-123' } });
  fireEvent.change(byName('dimensionLength'), { target: { value: '10' } });
  fireEvent.change(byName('dimensionWidth'), { target: { value: '20' } });
  fireEvent.change(byName('dimensionHeight'), { target: { value: '30' } });
  fireEvent.change(byName('madeIn'), { target: { value: 'Deutschland' } });
  fireEvent.change(byName('material'), { target: { value: 'Edelstahl' } });
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

  test('toggles password field visibility', () => {
    render(<PrecheckForm />);

    let passwordInput = document.querySelector('[name="password"]') as HTMLInputElement;
    let confirmInput = document.querySelector('[name="confirmPassword"]') as HTMLInputElement;

    expect(passwordInput.type).toBe('password');
    expect(confirmInput.type).toBe('password');

    const toggleButtons = screen.getAllByRole('button', { name: 'Passwort anzeigen' });
    fireEvent.click(toggleButtons[0]);
    fireEvent.click(toggleButtons[1]);

    passwordInput = document.querySelector('[name="password"]') as HTMLInputElement;
    confirmInput = document.querySelector('[name="confirmPassword"]') as HTMLInputElement;
    expect(passwordInput.type).toBe('text');
    expect(confirmInput.type).toBe('text');
  });

  test('shows validation error when passwords do not match and does not submit', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<PrecheckForm />);
    fillValidPrecheckForm('NichtGleich123!');

    fireEvent.click(screen.getByRole('button', { name: 'Jetzt starten' }));

    expect(await screen.findByText('Passwörter stimmen nicht überein')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('submits transformed payload and redirects on success', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        ok: true,
        redirect: '/precheck?productId=prod-1',
        productId: 'prod-1',
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
    expect(payload.name).toBe('Max Mustermann');
    expect(payload.size).toBe('10x20x30');
    expect(payload.address).toBe('Musterstraße 12a, 12345 Berlin, Deutschland');
    expect(payload.confirmPassword).toBeUndefined();

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/precheck?productId=prod-1'), {
      timeout: 2000,
    });
  });

  test('redirects to login when account already exists', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        error: 'LOGIN_REQUIRED',
        redirect: '/login?next=%2Fprecheck',
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);

    render(<PrecheckForm />);
    fillValidPrecheckForm();

    fireEvent.click(screen.getByRole('button', { name: 'Jetzt starten' }));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith('/login?next=%2Fprecheck');
    });
  });
});
