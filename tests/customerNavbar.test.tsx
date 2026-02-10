import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const pushMock = vi.fn();
const refreshMock = vi.fn();
const setLocaleMock = vi.fn();

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={typeof href === 'string' ? href : '#'} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ priority: _priority, ...props }: any) => <img {...props} alt={props.alt || ''} />,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  usePathname: () => '/',
}));

vi.mock('@/components/LocaleProvider', () => ({
  useLocale: () => ({
    locale: 'de',
    setLocale: setLocaleMock,
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

import Navbar from '../app/components/Navbar';

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  );
}

describe('Customer Navbar interactions', () => {
  beforeEach(() => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/api/auth/me')) {
        return jsonResponse({}, { status: 401 });
      }

      if (url.includes('/api/admin/me')) {
        return jsonResponse({}, { status: 401 });
      }

      if (url.includes('/search-index.json')) {
        return jsonResponse([
          {
            label: 'Kontakt',
            href: '/kontakt',
            keywords: ['support', 'kontakt'],
            excerpt: 'Kontaktieren Sie unser Team.',
          },
        ]);
      }

      return jsonResponse({ ok: true });
    });

    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test('opens and closes the menu and switches locale', async () => {
    render(<Navbar />);

    fireEvent.click(screen.getByRole('button', { name: 'nav.menu.open' }));
    expect(screen.getByText('nav.services')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /EN/ }));
    expect(setLocaleMock).toHaveBeenCalledWith('en');

    fireEvent.click(screen.getByRole('button', { name: 'nav.menu.close' }));
    await waitFor(() => {
      expect(screen.queryByText('nav.services')).toBeNull();
    });
  });

  test('shows search results, navigates to selected result, and clears search', async () => {
    render(<Navbar />);

    const searchInput = screen.getAllByRole('textbox', { name: 'Suche' })[0] as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'kont' } });

    const resultItem = await screen.findByRole('listitem');
    fireEvent.mouseDown(resultItem);
    expect(pushMock).toHaveBeenCalledWith('/kontakt');

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(searchInput.value).toBe('');
  });

  test('opens register mode and validates mismatched passwords', async () => {
    render(<Navbar />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Kundenkonto öffnen/i }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Kundenkonto öffnen/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Registrieren' })[0]);

    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Max Mustermann' } });
    fireEvent.change(screen.getByPlaceholderText('profile.email'), { target: { value: 'max@example.com' } });

    const passwordInput = screen.getByPlaceholderText('profile.password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
    fireEvent.click(screen.getAllByRole('button', { name: 'Passwort anzeigen' })[0]);
    expect(passwordInput.type).toBe('text');

    fireEvent.change(passwordInput, { target: { value: 'SicheresPasswort123' } });
    fireEvent.change(screen.getByPlaceholderText('Passwort wiederholen'), { target: { value: 'NichtGleich123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Registrieren' }));

    expect(await screen.findByText('Passwörter stimmen nicht überein')).toBeTruthy();
  });
});
