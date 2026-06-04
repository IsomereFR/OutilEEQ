import { describe, it, expect } from 'vitest';
import { stepIndex, statutFiche } from '../ficheStatus';
import { statutEnquete, daysTo } from '../enqueteStatus';
import type { Fiche, Enquete } from '../../types/models';

// Fiche minimale paramétrable.
const fiche = (p: Partial<Fiche>): Fiche => ({
  id: 'f',
  enqueteId: null,
  automateId: 'a',
  type: 'EEQ',
  organisme: '',
  reference: '',
  secteur: '',
  nClarilab: '',
  dateEnvoi: '',
  dateReception: '',
  parReception: '',
  dateCloture: '',
  dateReceptionService: '',
  parService: '',
  tempConforme: '',
  enceinteStockage: '',
  dateReconstitution: '',
  heureReconstitution: '',
  parReconstitution: '',
  micropipette: '',
  remarqueRecon: '',
  dateAnalyse: '',
  parAnalyse: '',
  remarqueAnalyse: '',
  modeEnvoi: '',
  dateEnvoiResultats: '',
  parEnvoi: '',
  saisieVerifieeLe: '',
  parSaisie: '',
  connexionVerifiee: '',
  parConnexion: '',
  resultatsAutomate: '',
  dateReceptionRapport: '',
  parReceptionRapport: '',
  resultatsBP: '',
  verdict: null,
  refFNC: '',
  presentationLe: '',
  parPresentation: '',
  supportUtilise: '',
  analytes: [],
  ...p,
});

// Date ISO relative à aujourd'hui (offset en jours).
function isoOffset(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

describe('stepIndex', () => {
  it('brouillon = 0 étape', () => {
    expect(stepIndex(fiche({}))).toBe(0);
  });
  it('administratif renseigné = étape 1', () => {
    expect(stepIndex(fiche({ organisme: 'PBQ', dateReception: '2026-01-01' }))).toBe(1);
  });
  it('reconstitution non requise (liquide) compte comme franchie', () => {
    const f = fiche({
      organisme: 'PBQ',
      dateReception: '2026-01-01',
      remarqueRecon: 'Échantillon liquide — pas de reconstitution',
    });
    expect(stepIndex(f)).toBeGreaterThanOrEqual(2);
  });
  it('progression jusqu\'au verdict = 6', () => {
    const f = fiche({
      organisme: 'PBQ',
      dateReception: '2026-01-01',
      dateReconstitution: '2026-01-02',
      dateAnalyse: '2026-01-02',
      dateEnvoiResultats: '2026-01-03',
      dateReceptionRapport: '2026-01-10',
      verdict: 'conforme',
    });
    expect(stepIndex(f)).toBe(6);
  });
});

describe('statutFiche', () => {
  it('brouillon', () => {
    expect(statutFiche(fiche({})).txt).toBe('Brouillon');
  });
  it('clôturé conforme', () => {
    expect(statutFiche(fiche({ verdict: 'conforme' })).cls).toBe('ok');
  });
  it('non conforme', () => {
    expect(statutFiche(fiche({ verdict: 'non-conforme' })).cls).toBe('bad');
  });
  it('en attente du rapport', () => {
    const f = fiche({
      organisme: 'PBQ',
      dateReception: '2026-01-01',
      dateReconstitution: '2026-01-02',
      dateAnalyse: '2026-01-02',
      dateEnvoiResultats: '2026-01-03',
    });
    expect(statutFiche(f).txt).toBe('En attente du rapport');
  });
});

describe('daysTo', () => {
  it('null si vide', () => expect(daysTo('')).toBeNull());
  it('0 pour aujourd\'hui', () => expect(daysTo(isoOffset(0))).toBe(0));
  it('négatif pour le passé', () => expect(daysTo(isoOffset(-5))).toBe(-5));
});

describe('statutEnquete', () => {
  const enq = (p: Partial<Enquete>): Enquete => ({
    id: 'e',
    organisme: '',
    programme: '',
    reference: '',
    secteur: '',
    automates: [],
    dateReceptionPrevue: '',
    echeanceRetour: '',
    periodicite: '',
    remarque: '',
    ...p,
  });

  it('planifiée si réception > 30 j et aucune fiche', () => {
    expect(statutEnquete(enq({ dateReceptionPrevue: isoOffset(60) }), []).key).toBe('planif');
  });
  it('à venir si réception ≤ 30 j', () => {
    expect(statutEnquete(enq({ dateReceptionPrevue: isoOffset(10) }), []).key).toBe('avenir');
  });
  it('à réceptionner si échéance dépassée', () => {
    expect(statutEnquete(enq({ dateReceptionPrevue: isoOffset(-2) }), []).key).toBe('retard');
  });
  it('reçue·en cours si fiche non clôturée', () => {
    const f = fiche({ enqueteId: 'e', verdict: null });
    expect(statutEnquete(enq({}), [f]).key).toBe('encours');
  });
  it('clôturée conforme si toutes fiches conformes', () => {
    const f = fiche({ enqueteId: 'e', verdict: 'conforme' });
    expect(statutEnquete(enq({}), [f]).key).toBe('clos-ok');
  });
  it('clôturée NC si au moins une non conforme', () => {
    const f1 = fiche({ enqueteId: 'e', verdict: 'conforme' });
    const f2 = fiche({ enqueteId: 'e', verdict: 'non-conforme' });
    expect(statutEnquete(enq({}), [f1, f2]).key).toBe('clos-nc');
  });
});
