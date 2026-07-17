import { describe, it, expect } from 'vitest';
import { trierParPriorite } from '../tri';
import { isoDecale, aujourdhui } from '../dates';
import type { Enquete } from '../types';

const REF = aujourdhui();

const enq = (id: string, jr: number): Enquete => ({
  id,
  programmeId: 'p',
  fournisseurId: 'f',
  envoiRef: id,
  dateOuverture: '',
  dateEcheanceRealisation: isoDecale(jr),
  dateLimiteSaisie: '',
  automateIds: [],
  siteId: 's',
  statut: 'a_realiser',
  affectee: true,
  source: 'manuel',
  createdAt: '',
  updatedAt: '',
});

describe('trierParPriorite', () => {
  it('ordonne retard, puis urgent, puis à surveiller, puis à venir', () => {
    const liste = [enq('venir', 40), enq('urgent', 3), enq('retard', -5), enq('surv', 10)];
    const ordre = trierParPriorite(liste, REF).map((e) => e.id);
    expect(ordre).toEqual(['retard', 'urgent', 'surv', 'venir']);
  });

  it('à urgence égale, échéance la plus proche en premier', () => {
    const ordre = trierParPriorite([enq('j7', 7), enq('j1', 1), enq('j4', 4)], REF).map((e) => e.id);
    expect(ordre).toEqual(['j1', 'j4', 'j7']);
  });

  it('ne mute pas le tableau d\'entrée', () => {
    const liste = [enq('a', 40), enq('b', 1)];
    const copie = [...liste];
    trierParPriorite(liste, REF);
    expect(liste).toEqual(copie);
  });
});
