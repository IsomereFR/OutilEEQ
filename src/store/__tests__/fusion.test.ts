import { describe, it, expect } from 'vitest';
import { fusionnerAmorce } from '../fusion';
import type { AppData, Programme, Enquete } from '../../domain/types';

const prog = (id: string, autos: string[] = []): Programme => ({
  id,
  fournisseurId: 'f',
  codeProgramme: id,
  libelle: id,
  discipline: id,
  parametres: [],
  frequence: '',
  automatesParDefaut: autos,
});

const enq = (id: string, programmeId: string, o: Partial<Enquete> = {}): Enquete => ({
  id,
  programmeId,
  fournisseurId: 'f',
  envoiRef: id,
  dateOuverture: '',
  dateEcheanceRealisation: '2026-09-01',
  dateLimiteSaisie: '',
  automateIds: [],
  siteId: 's',
  statut: 'a_realiser',
  affectee: false,
  source: 'excel',
  createdAt: '',
  updatedAt: '',
  ...o,
});

const vide = (o: Partial<AppData>): AppData => ({
  fournisseurs: [],
  sites: [],
  automates: [],
  programmes: [],
  enquetes: [],
  profils: [],
  piecesJointes: [],
  journal: [],
  ...o,
});

describe('fusionnerAmorce (attributions conservées définitivement)', () => {
  it('conserve l\'attribution d\'un programme et l\'état des enquêtes existantes', () => {
    const local = vide({
      programmes: [prog('p1', ['a-ch'])],
      enquetes: [enq('e1', 'p1', { automateIds: ['a-ch'], affectee: true, statut: 'en_cours' })],
      seedVersion: 9,
    });
    const amorce = vide({
      programmes: [prog('p1', []), prog('p2', [])], // p1 réinitialisé côté amorce, p2 nouveau
      enquetes: [enq('e1', 'p1'), enq('e2', 'p1'), enq('e3', 'p2')], // e2 = nouvelle occurrence de p1
      seedVersion: 10,
    });

    const f = fusionnerAmorce(local, amorce);

    // p1 garde son attribution ; p2 (nouveau) reste non attribué
    expect(f.programmes.find((p) => p.id === 'p1')!.automatesParDefaut).toEqual(['a-ch']);
    expect(f.programmes.find((p) => p.id === 'p2')!.automatesParDefaut).toEqual([]);

    // e1 conserve son état utilisateur
    const e1 = f.enquetes.find((e) => e.id === 'e1')!;
    expect(e1.affectee).toBe(true);
    expect(e1.automateIds).toEqual(['a-ch']);
    expect(e1.statut).toBe('en_cours');

    // e2 (nouvelle enquête d'un programme attribué) hérite de l'attribution
    const e2 = f.enquetes.find((e) => e.id === 'e2')!;
    expect(e2.affectee).toBe(true);
    expect(e2.automateIds).toEqual(['a-ch']);

    // e3 (programme non attribué) reste non affectée
    const e3 = f.enquetes.find((e) => e.id === 'e3')!;
    expect(e3.affectee).toBe(false);

    expect(f.seedVersion).toBe(10);
  });

  it('conserve les enquêtes locales absentes de l\'amorce (saisies à la main)', () => {
    const local = vide({ enquetes: [enq('manuel', 'p1', { source: 'manuel', affectee: true })] });
    const amorce = vide({ enquetes: [enq('e1', 'p1')] });
    const f = fusionnerAmorce(local, amorce);
    expect(f.enquetes.map((e) => e.id).sort()).toEqual(['e1', 'manuel']);
  });
});
