import { describe, it, expect } from 'vitest';
import { niveauAlerte, estAffichable, pireAlerte, comptesAlerte } from '../alerte';
import { isoDecale, aujourdhui } from '../dates';
import type { Enquete, Statut } from '../types';

const REF = aujourdhui();

const enq = (jr: number, statut: Statut = 'a_realiser', affectee = true): Enquete => ({
  id: 'e' + jr,
  programmeId: 'p',
  fournisseurId: 'f',
  envoiRef: 'E',
  dateOuverture: '',
  dateEcheanceRealisation: isoDecale(jr),
  dateLimiteSaisie: '',
  automateIds: ['a'],
  siteId: 's',
  statut,
  affectee,
  source: 'manuel',
  createdAt: '',
  updatedAt: '',
});

describe('niveauAlerte (4 paliers, dépassé masqué)', () => {
  it("aujourd'hui si échéance = 0 jour", () => {
    expect(niveauAlerte(enq(0), REF)).toBe('aujourdhui');
  });
  it('sous 3 jours pour 1..3', () => {
    expect(niveauAlerte(enq(1), REF)).toBe('j3');
    expect(niveauAlerte(enq(3), REF)).toBe('j3');
  });
  it('sous 7 jours pour 4..7', () => {
    expect(niveauAlerte(enq(4), REF)).toBe('j7');
    expect(niveauAlerte(enq(7), REF)).toBe('j7');
  });
  it('à jour entre 8 et 15 jours (dans la fenêtre)', () => {
    expect(niveauAlerte(enq(8), REF)).toBe('a_jour');
    expect(niveauAlerte(enq(15), REF)).toBe('a_jour');
  });
  it('null (masquée) au-delà de 15 jours', () => {
    expect(niveauAlerte(enq(16), REF)).toBeNull();
    expect(niveauAlerte(enq(40), REF)).toBeNull();
    expect(estAffichable(enq(16), REF)).toBe(false);
  });
  it('null (masquée) si échéance dépassée', () => {
    expect(niveauAlerte(enq(-1), REF)).toBeNull();
    expect(estAffichable(enq(-1), REF)).toBe(false);
  });
  it('null si déjà réalisée ou non affectée', () => {
    expect(niveauAlerte(enq(2, 'realise'), REF)).toBeNull();
    expect(niveauAlerte(enq(2, 'a_realiser', false), REF)).toBeNull();
  });
});

describe('pireAlerte', () => {
  it('retient le plus urgent', () => {
    expect(pireAlerte([enq(10), enq(2), enq(6)], REF)).toBe('j3');
  });
  it('null si rien d\'affichable', () => {
    expect(pireAlerte([enq(-2), enq(3, 'realise')], REF)).toBeNull();
  });
});

describe('comptesAlerte', () => {
  it('ventile par palier (hors à jour)', () => {
    const c = comptesAlerte([enq(0), enq(2), enq(3), enq(6), enq(20), enq(-1)], REF);
    expect(c).toEqual({ aujourdhui: 1, j3: 2, j7: 1 });
  });
});
