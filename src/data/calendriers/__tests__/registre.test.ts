import { describe, it, expect } from 'vitest';
import { CALENDRIERS, codesDuCalendrier, calendrierById } from '../index';

describe('registre des calendriers', () => {
  it('contient ProBioQual et Biologie Prospective', () => {
    expect(calendrierById('probioqual')?.organisme).toBe('ProBioQual');
    expect(calendrierById('biologie-prospective')?.organisme).toBe('Biologie Prospective');
  });

  it('chaque campagne a un id unique et des dates ISO valides', () => {
    const ids = new Set<string>();
    for (const cal of CALENDRIERS) {
      expect(cal.campagnes.length).toBeGreaterThan(0);
      for (const c of cal.campagnes) {
        expect(ids.has(c.id)).toBe(false);
        ids.add(c.id);
        expect(c.dateFin).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        if (c.dateDebut) expect(c.dateDebut).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(c.code).toBeTruthy();
      }
    }
  });

  it('codesDuCalendrier regroupe les occurrences par code', () => {
    for (const cal of CALENDRIERS) {
      const codes = codesDuCalendrier(cal);
      const total = codes.reduce((s, ci) => s + ci.occurrences, 0);
      expect(total).toBe(cal.campagnes.length);
    }
  });
});
