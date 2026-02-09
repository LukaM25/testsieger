import { describe, expect, it } from 'vitest';
import { extractLastName, formatContactName, formatLastName } from '../lib/name';

describe('name formatting', () => {
  it('extracts the last token from full names', () => {
    expect(extractLastName('Max Lang')).toBe('Lang');
    expect(extractLastName('Anna Maria Meyer')).toBe('Meyer');
  });

  it('supports comma format', () => {
    expect(extractLastName('Lang, Max')).toBe('Lang');
  });

  it('falls back when no name is provided', () => {
    expect(extractLastName('')).toBe('');
    expect(formatLastName('', 'Kunde')).toBe('Kunde');
  });

  it('uses full name for OTHER', () => {
    expect(formatContactName('Alex Morgan', 'OTHER')).toBe('Alex Morgan');
    expect(formatContactName('Alex Morgan', 'MALE')).toBe('Morgan');
  });
});
