import { describe, it, expect } from 'vitest';
import { classifierCandidat, classifierLot, cleDedup } from '../dedup';
import type { Enquete } from '../types';

const base = {
  fournisseurId: 'f1',
  programmeId: 'p1',
  envoiRef: 'Envoi 1/3',
  dateEcheanceRealisation: '2026-03-10',
};

const existante = (o: Partial<Enquete>): Enquete => ({
  id: 'x',
  programmeId: base.programmeId,
  fournisseurId: base.fournisseurId,
  envoiRef: base.envoiRef,
  dateOuverture: '',
  dateEcheanceRealisation: base.dateEcheanceRealisation,
  dateLimiteSaisie: '',
  automateIds: [],
  siteId: 's',
  statut: 'a_realiser',
  affectee: true,
  source: 'excel',
  createdAt: '',
  updatedAt: '',
  ...o,
});

describe('classifierCandidat', () => {
  it('déjà présente si clé exacte identique', () => {
    expect(classifierCandidat(base, [existante({})])).toBe('deja_presente');
  });
  it('mise à jour possible si même programme+envoi mais date différente', () => {
    const autre = existante({ dateEcheanceRealisation: '2026-03-24' });
    expect(classifierCandidat(base, [autre])).toBe('mise_a_jour_possible');
  });
  it('nouvelle si aucune correspondance', () => {
    const autre = existante({ envoiRef: 'Envoi 2/3', dateEcheanceRealisation: '2026-06-01' });
    expect(classifierCandidat(base, [autre])).toBe('nouvelle');
  });
});

describe('classifierLot', () => {
  it('détecte les doublons internes au même lot', () => {
    const res = classifierLot([base, { ...base }], []);
    expect(res[0].verdict).toBe('nouvelle');
    expect(res[1].verdict).toBe('deja_presente');
  });
});

describe('cleDedup', () => {
  it('assemble les quatre composantes', () => {
    expect(cleDedup(base)).toBe('f1|p1|Envoi 1/3|2026-03-10');
  });
});
