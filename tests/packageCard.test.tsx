import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PackageCard } from '../components/PackageCard';

describe('PackageCard interactions', () => {
  test('calls onSelect when card is enabled', () => {
    const onSelect = vi.fn();

    render(
      <PackageCard
        title="Basic"
        price="0,99 €"
        subtitle="Test"
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Auswählen' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test('calls onDisabledClick when card is disabled', () => {
    const onSelect = vi.fn();
    const onDisabledClick = vi.fn();

    render(
      <PackageCard
        title="Basic"
        price="0,99 €"
        subtitle="Test"
        onSelect={onSelect}
        disabled
        disabledLabel="Nicht verfügbar"
        onDisabledClick={onDisabledClick}
      />
    );

    const button = screen.getByRole('button', { name: 'Nicht verfügbar' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    fireEvent.click(button);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onDisabledClick).not.toHaveBeenCalled();
  });
});
