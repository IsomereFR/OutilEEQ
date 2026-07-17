import { describe, it, expect } from 'vitest';
import { normaliserDate, serieExcelEnISO } from './dates';

describe('serieExcelEnISO', () => {
  it('convertit une date série Excel (système 1900)', () => {
    // 45999 = 08/12/2025 dans le système 1900 d'Excel.
    expect(serieExcelEnISO(45999)).toBe('2025-12-08');
  });
});

describe('normaliserDate', () => {
  it('gère le nombre série Excel', () => {
    expect(normaliserDate(45999)).toBe('2025-12-08');
  });
  it('gère jj/mm/aaaa (défaut FR)', () => {
    expect(normaliserDate('05/03/2026')).toBe('2026-03-05');
    expect(normaliserDate('5/3/26')).toBe('2026-03-05');
  });
  it('respecte le format mm/jj/aaaa si demandé', () => {
    expect(normaliserDate('03/05/2026', 'mm/jj/aaaa')).toBe('2026-03-05');
  });
  it('gère déjà ISO', () => {
    expect(normaliserDate('2026-03-05')).toBe('2026-03-05');
  });
  it('renvoie vide si non interprétable', () => {
    expect(normaliserDate('')).toBe('');
    expect(normaliserDate('n/a')).toBe('');
  });
});
