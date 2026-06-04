import { describe, it, expect } from 'vitest';
import {
  ecartPct,
  zscore,
  analyteEval,
  analyteOk,
  syntheseAnalytes,
  zbarPosition,
} from '../calculations';
import type { Analyte } from '../../types/models';

const an = (p: Partial<Analyte>): Analyte => ({
  param: '',
  valeur: '',
  cible: '',
  sd: '',
  unite: '',
  ...p,
});

describe('ecartPct', () => {
  it('calcule (valeur - cible) / cible * 100', () => {
    expect(ecartPct(an({ valeur: '110', cible: '100' }))).toBeCloseTo(10);
    expect(ecartPct(an({ valeur: '90', cible: '100' }))).toBeCloseTo(-10);
  });
  it('renvoie null si cible = 0 ou données manquantes', () => {
    expect(ecartPct(an({ valeur: '5', cible: '0' }))).toBeNull();
    expect(ecartPct(an({ valeur: '', cible: '100' }))).toBeNull();
    expect(ecartPct(an({ valeur: 'abc', cible: '100' }))).toBeNull();
  });
});

describe('zscore', () => {
  it('calcule (valeur - cible) / sd', () => {
    expect(zscore(an({ valeur: '110', cible: '100', sd: '5' }))).toBeCloseTo(2);
    expect(zscore(an({ valeur: '97', cible: '100', sd: '2' }))).toBeCloseTo(-1.5);
  });
  it('renvoie null si sd = 0 ou données manquantes', () => {
    expect(zscore(an({ valeur: '110', cible: '100', sd: '0' }))).toBeNull();
    expect(zscore(an({ valeur: '110', cible: '100', sd: '' }))).toBeNull();
    expect(zscore(an({ valeur: '', cible: '100', sd: '5' }))).toBeNull();
  });
});

describe('analyteEval / analyteOk', () => {
  it('conforme si |z| < 2', () => {
    const a = an({ valeur: '105', cible: '100', sd: '5' }); // z=1
    expect(analyteEval(a)).toBe('conforme');
    expect(analyteOk(a)).toBe(true);
  });
  it('alerte si 2 ≤ |z| < 3', () => {
    const a = an({ valeur: '112.5', cible: '100', sd: '5' }); // z=2.5
    expect(analyteEval(a)).toBe('alerte');
    expect(analyteOk(a)).toBe(false);
  });
  it('hors-limites si |z| ≥ 3', () => {
    const a = an({ valeur: '85', cible: '100', sd: '5' }); // z=-3
    expect(analyteEval(a)).toBe('hors-limites');
    expect(analyteOk(a)).toBe(false);
  });
  it('limite exacte |z| = 2 → alerte (pas conforme)', () => {
    expect(analyteEval(an({ valeur: '110', cible: '100', sd: '5' }))).toBe('alerte');
  });
  it('null si non calculable', () => {
    expect(analyteEval(an({ valeur: '', cible: '100', sd: '5' }))).toBeNull();
    expect(analyteOk(an({ sd: '0', valeur: '1', cible: '1' }))).toBeNull();
  });
});

describe('syntheseAnalytes', () => {
  it('compte les analytes dans / hors limites en ignorant les non évaluables', () => {
    const list = [
      an({ valeur: '101', cible: '100', sd: '5' }), // ok
      an({ valeur: '120', cible: '100', sd: '5' }), // hors (z=4)
      an({ valeur: '', cible: '100', sd: '5' }), // non évaluable
    ];
    expect(syntheseAnalytes(list)).toEqual({ evaluables: 2, dansLimites: 1, horsLimites: 1 });
  });
  it('liste vide', () => {
    expect(syntheseAnalytes([])).toEqual({ evaluables: 0, dansLimites: 0, horsLimites: 0 });
  });
});

describe('zbarPosition', () => {
  it('z=0 → 50 %', () => {
    expect(zbarPosition(an({ valeur: '100', cible: '100', sd: '5' }))).toBeCloseTo(50);
  });
  it('borne à 0 et 100', () => {
    expect(zbarPosition(an({ valeur: '200', cible: '100', sd: '5' }))).toBe(100); // z=20
    expect(zbarPosition(an({ valeur: '0', cible: '100', sd: '5' }))).toBe(0); // z=-20
  });
  it('null si non calculable', () => {
    expect(zbarPosition(an({ sd: '0', valeur: '1', cible: '1' }))).toBeNull();
  });
});
