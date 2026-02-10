import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import KontaktPage from '../app/kontakt/page';

describe('Kontakt page form', () => {
  test('renders contact form with expected submit target', () => {
    render(<KontaktPage />);

    const submitButton = screen.getByRole('button', { name: 'Nachricht senden' });
    const form = submitButton.closest('form');

    expect(form).toBeTruthy();
    expect(form?.getAttribute('action')).toBe('/api/contact');
    expect((form?.getAttribute('method') || '').toLowerCase()).toBe('post');

    expect(screen.getByLabelText('Ihr Name')).toBeTruthy();
    expect(screen.getByLabelText('Ihre E-Mail-Adresse')).toBeTruthy();
    expect(screen.getByLabelText('Kategorie')).toBeTruthy();
    expect(screen.getByLabelText('Ihre Nachricht')).toBeTruthy();
  });
});
