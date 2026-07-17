import { describe, it, expect } from 'vitest';
import { niveauUrgence, declencheAlerte } from '../urgence';
import { isoDecale, aujourdhui } from '../dates';
import type { Enquete, Statut } from '../types';

const REF = aujourdhui();

const enq = (jr: number, statut: Statut = 'a_realiser'): Enquete => ({
  id: 'e',
  programmeId: 'p',
  fournisseurId: 'f',
  envoiRef: 'E1',
  dateOuverture: isoDecale(-30),
  dateEcheanceRealisation: isoDecale(jr),
  dateLimiteSaisie: isoDecale(jr + 5),
  automateIds: [],
  siteId: 's',
  statut,
  affectee: true,
  source: 'manuel',
  createdAt: '',
  updatedAt: '',
});

describe('niveauUrgence', () => {
  it('en retard si échéance passée et statut avant réalisé', () => {
    expect(niveauUrgence(enq(-1), REF)).toBe('en_retard');
  });
  it('pas en retard si déjà réalisée', () => {
    expect(niveauUrgence(enq(-1, 'realise'), REF)).toBe('a_venir');
    expect(niveauUrgence(enq(-1, 'cloture'), REF)).toBe('a_venir');
  });
  it('urgent (J-7) dans 0..7 jours', () => {
    expect(niveauUrgence(enq(0), REF)).toBe('urgent');
    expect(niveauUrgence(enq(7), REF)).toBe('urgent');
  });
  it('à surveiller dans 8..15 jours', () => {
    expect(niveauUrgence(enq(8), REF)).toBe('a_surveiller');
    expect(niveauUrgence(enq(15), REF)).toBe('a_surveiller');
  });
  it('à venir au-delà de 15 jours', () => {
    expect(niveauUrgence(enq(16), REF)).toBe('a_venir');
    expect(niveauUrgence(enq(90), REF)).toBe('a_venir');
  });
});

describe('declencheAlerte', () => {
  it('vrai pour retard et urgent', () => {
    expect(declencheAlerte(enq(-2), REF)).toBe(true);
    expect(declencheAlerte(enq(3), REF)).toBe(true);
  });
  it('faux pour à surveiller et à venir', () => {
    expect(declencheAlerte(enq(10), REF)).toBe(false);
    expect(declencheAlerte(enq(40), REF)).toBe(false);
  });
});
