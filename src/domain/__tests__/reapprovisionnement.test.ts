import { describe, it, expect } from 'vitest';
import { automatesAReapprovisionner } from '../reapprovisionnement';
import { isoDecale, aujourdhui } from '../dates';
import type { Automate, Enquete, Statut } from '../types';

const REF = aujourdhui();

const auto = (id: string, actif = true): Automate => ({
  id,
  nom: id.toUpperCase(),
  modele: '',
  siteId: 's',
  disciplines: ['Biochimie'],
  actif,
});

const enq = (
  automateIds: string[],
  jr: number,
  affectee = true,
  statut: Statut = 'a_realiser',
): Enquete => ({
  id: 'e-' + automateIds.join('') + '-' + jr,
  programmeId: 'p',
  fournisseurId: 'f',
  envoiRef: 'E',
  dateOuverture: '',
  dateEcheanceRealisation: isoDecale(jr),
  dateLimiteSaisie: '',
  automateIds,
  siteId: 's',
  statut,
  affectee,
  source: 'manuel',
  createdAt: '',
  updatedAt: '',
});

describe('automatesAReapprovisionner', () => {
  it('ignore un automate dont l\'horizon est au-delà du seuil (30 j)', () => {
    const r = automatesAReapprovisionner([enq(['a'], 45)], [auto('a')], REF);
    expect(r).toHaveLength(0);
  });

  it('signale un automate dont la dernière échéance tombe dans les 30 jours', () => {
    const r = automatesAReapprovisionner([enq(['a'], 20)], [auto('a')], REF);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ automateId: 'a', joursRestants: 20, epuise: false });
  });

  it('prend l\'horizon = dernière échéance (max) parmi les enquêtes affectées', () => {
    // Une enquête dans 5 j et une dans 25 j : l'horizon est 25 (> aucune alerte inutile),
    // mais 25 <= 30 donc signalé avec l'horizon le plus lointain.
    const r = automatesAReapprovisionner([enq(['a'], 5), enq(['a'], 25)], [auto('a')], REF);
    expect(r).toHaveLength(1);
    expect(r[0].joursRestants).toBe(25);
    expect(r[0].dateHorizon).toBe(isoDecale(25));
  });

  it('marque « épuisé » un automate dont toutes les échéances sont passées', () => {
    const r = automatesAReapprovisionner([enq(['a'], -3)], [auto('a')], REF);
    expect(r).toHaveLength(1);
    expect(r[0].epuise).toBe(true);
    expect(r[0].joursRestants).toBe(-3);
  });

  it('ignore les enquêtes non affectées (inbox)', () => {
    const r = automatesAReapprovisionner([enq(['a'], 10, false)], [auto('a')], REF);
    expect(r).toHaveLength(0);
  });

  it('ignore un automate sans aucune enquête affectée', () => {
    const r = automatesAReapprovisionner([], [auto('a')], REF);
    expect(r).toHaveLength(0);
  });

  it('ignore un automate inactif', () => {
    const r = automatesAReapprovisionner([enq(['a'], 5)], [auto('a', false)], REF);
    expect(r).toHaveLength(0);
  });

  it('tient compte du statut réalisé (l\'horizon reste la dernière date planifiée)', () => {
    const r = automatesAReapprovisionner([enq(['a'], 12, true, 'realise')], [auto('a')], REF);
    expect(r).toHaveLength(1);
    expect(r[0].joursRestants).toBe(12);
  });

  it('trie du plus urgent (épuisé) au moins urgent', () => {
    const enqs = [enq(['a'], 28), enq(['b'], -10), enq(['c'], 5)];
    const autos = [auto('a'), auto('b'), auto('c')];
    const r = automatesAReapprovisionner(enqs, autos, REF);
    expect(r.map((x) => x.automateId)).toEqual(['b', 'c', 'a']);
  });

  it('gère une enquête affectée à plusieurs automates', () => {
    const r = automatesAReapprovisionner([enq(['a', 'b'], 15)], [auto('a'), auto('b')], REF);
    expect(r.map((x) => x.automateId).sort()).toEqual(['a', 'b']);
  });
});
