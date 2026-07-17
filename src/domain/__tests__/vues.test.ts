import { describe, it, expect } from 'vitest';
import { indicateurs, compteursAlerte, bandeauVisible, appliquerFiltres, frisParSemaine } from '../vues';
import { isoDecale, aujourdhui } from '../dates';
import type { Enquete, Programme, Statut } from '../types';

const REF = aujourdhui();
const nowISO = new Date().toISOString();

const enq = (o: Partial<Enquete> & Pick<Enquete, 'id'>): Enquete => ({
  programmeId: 'p1',
  fournisseurId: 'f1',
  envoiRef: o.id,
  dateOuverture: '',
  dateEcheanceRealisation: isoDecale(3),
  dateLimiteSaisie: '',
  automateIds: [],
  siteId: 's1',
  statut: 'a_realiser' as Statut,
  affectee: true,
  source: 'manuel',
  createdAt: nowISO,
  updatedAt: nowISO,
  ...o,
});

describe('indicateurs', () => {
  it('ventile par niveau et compte l\'inbox à part', () => {
    const liste = [
      enq({ id: 'retard', dateEcheanceRealisation: isoDecale(-2) }),
      enq({ id: 'urgent', dateEcheanceRealisation: isoDecale(2) }),
      enq({ id: 'surv', dateEcheanceRealisation: isoDecale(10), statut: 'a_venir' }),
      enq({ id: 'inbox', affectee: false }),
      enq({ id: 'faite', dateEcheanceRealisation: isoDecale(-6), statut: 'realise' }),
    ];
    const i = indicateurs(liste, REF);
    expect(i.enRetard).toBe(1);
    expect(i.sous7j).toBe(1);
    expect(i.aSurveiller).toBe(1);
    expect(i.nonAffectees).toBe(1);
    expect(i.realiseesCeMois).toBe(1);
  });
});

describe('compteursAlerte / bandeauVisible', () => {
  it('bandeau masqué si tout à zéro', () => {
    const c = compteursAlerte([enq({ id: 'loin', dateEcheanceRealisation: isoDecale(40), statut: 'a_venir' })], REF);
    expect(bandeauVisible(c)).toBe(false);
  });
  it('bandeau visible si au moins un urgent', () => {
    const c = compteursAlerte([enq({ id: 'u', dateEcheanceRealisation: isoDecale(1) })], REF);
    expect(bandeauVisible(c)).toBe(true);
  });
});

describe('appliquerFiltres', () => {
  const progs: Programme[] = [
    { id: 'p1', fournisseurId: 'f1', codeProgramme: 'A', libelle: 'A', discipline: 'Bioch', parametres: [], frequence: '', automatesParDefaut: [] },
  ];
  it('filtre par fournisseur et discipline', () => {
    const liste = [enq({ id: 'a', fournisseurId: 'f1' }), enq({ id: 'b', fournisseurId: 'f2' })];
    expect(appliquerFiltres(liste, { fournisseurId: 'f1' }, progs).map((e) => e.id)).toEqual(['a']);
    expect(appliquerFiltres(liste, { discipline: 'Bioch' }, progs).length).toBe(2);
    expect(appliquerFiltres(liste, { discipline: 'Hemato' }, progs).length).toBe(0);
  });
});

describe('frisParSemaine', () => {
  it('place les enquêtes affectées de la fenêtre dans une semaine', () => {
    const sem = frisParSemaine([enq({ id: 'x', dateEcheanceRealisation: isoDecale(5) })], REF);
    const total = sem.reduce((n, s) => n + s.enquetes.length, 0);
    expect(total).toBe(1);
  });
  it('exclut l\'inbox et le hors-fenêtre', () => {
    const sem = frisParSemaine(
      [
        enq({ id: 'inbox', affectee: false, dateEcheanceRealisation: isoDecale(5) }),
        enq({ id: 'loin', dateEcheanceRealisation: isoDecale(200) }),
      ],
      REF,
    );
    expect(sem.reduce((n, s) => n + s.enquetes.length, 0)).toBe(0);
  });
});
