import { describe, it, expect } from 'vitest';
import {
  statutCampagne,
  campagneActionnable,
  analytesDeCampagne,
  JOURS_AVANT_TRAITEMENT,
} from '../campagneStatus';
import type { Campagne, Fiche } from '../../types/models';

function isoOffset(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const camp = (p: Partial<Campagne>): Campagne => ({
  id: 'probioqual:26HA01',
  echantillon: '26HA01',
  annee: '26',
  code: 'HA',
  numero: '01',
  programme: 'Hémostase',
  analytes: 'TCA; Fibrinogène; Commentaire',
  dateDebut: isoOffset(-40),
  dateFin: isoOffset(30),
  ...p,
});

// Fiche minimale liée à une campagne.
const ficheLiee = (verdict: Fiche['verdict']): Fiche =>
  ({ id: 'f', enqueteId: null, campagneId: 'probioqual:26HA01', automateId: 'a', verdict } as Fiche);

describe('analytesDeCampagne', () => {
  it('découpe et retire les commentaires', () => {
    expect(analytesDeCampagne(camp({ analytes: 'TCA; Fibrinogène; Commentaire' }))).toEqual([
      'TCA',
      'Fibrinogène',
    ]);
  });
});

describe('statutCampagne (sans fiche)', () => {
  it('stand-by si clôture lointaine (> 15 j)', () => {
    expect(statutCampagne(camp({ dateFin: isoOffset(30) }), []).key).toBe('standby');
  });
  it('à traiter dans les 15 j avant clôture', () => {
    expect(statutCampagne(camp({ dateFin: isoOffset(JOURS_AVANT_TRAITEMENT) }), []).key).toBe('a-traiter');
    expect(statutCampagne(camp({ dateFin: isoOffset(3) }), []).key).toBe('a-traiter');
  });
  it('échue si clôture dépassée', () => {
    expect(statutCampagne(camp({ dateFin: isoOffset(-1) }), []).key).toBe('echue');
  });
});

describe('statutCampagne (avec fiche)', () => {
  it('en cours si fiche non clôturée', () => {
    expect(statutCampagne(camp({}), [ficheLiee(null)]).key).toBe('encours');
  });
  it('clôturée conforme', () => {
    expect(statutCampagne(camp({}), [ficheLiee('conforme')]).key).toBe('clos-ok');
  });
  it('clôturée NC', () => {
    expect(statutCampagne(camp({}), [ficheLiee('conforme'), ficheLiee('non-conforme')]).key).toBe('clos-nc');
  });
});

describe('campagneActionnable', () => {
  it('vrai si à traiter ou échue', () => {
    expect(campagneActionnable(camp({ dateFin: isoOffset(5) }), [])).toBe(true);
    expect(campagneActionnable(camp({ dateFin: isoOffset(-2) }), [])).toBe(true);
  });
  it('faux si stand-by ou déjà prise en charge', () => {
    expect(campagneActionnable(camp({ dateFin: isoOffset(40) }), [])).toBe(false);
    expect(campagneActionnable(camp({}), [ficheLiee(null)])).toBe(false);
  });
});
