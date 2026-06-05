// ============================================================================
//  Statut d'une CAMPAGNE de calendrier organisme.
//  Règle métier clé : une campagne dont le code est suivi reste en STAND-BY
//  tant qu'on n'est pas à moins de N jours de la date de clôture ; elle bascule
//  alors « à traiter ». Une fois une fiche créée, le statut suit la fiche.
// ============================================================================
import type { Campagne, Fiche, StatusChip } from '../types/models';
import { daysTo } from './enqueteStatus';

/** Fenêtre (en jours) d'ouverture avant clôture pour passer « à traiter ». */
export const JOURS_AVANT_TRAITEMENT = 15;

/** Découpe la liste brute d'analytes en noms exploitables (hors « Commentaire »). */
export function analytesDeCampagne(c: Campagne): string[] {
  return c.analytes
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !/^commentaire/i.test(s));
}

/**
 * Statut d'une campagne.
 * @param fichesLiees fiches dont campagneId === campagne.id
 */
export function statutCampagne(c: Campagne, fichesLiees: Fiche[]): StatusChip {
  if (fichesLiees.length) {
    const allClosed = fichesLiees.every((f) => f.verdict);
    if (allClosed) {
      return fichesLiees.some((f) => f.verdict === 'non-conforme')
        ? { cls: 'bad', txt: 'Clôturée · NC', key: 'clos-nc' }
        : { cls: 'ok', txt: 'Clôturée · conforme', key: 'clos-ok' };
    }
    return { cls: 'info', txt: 'Reçue · en cours', key: 'encours' };
  }
  const d = daysTo(c.dateFin);
  if (d !== null && d < 0) return { cls: 'bad', txt: 'Clôture dépassée', key: 'echue' };
  if (d !== null && d <= JOURS_AVANT_TRAITEMENT) return { cls: 'warn', txt: 'À traiter', key: 'a-traiter' };
  return { cls: 'neutral', txt: 'Stand-by', key: 'standby' };
}

/** Une campagne demande-t-elle une action (à traiter ou en retard, sans fiche close) ? */
export function campagneActionnable(c: Campagne, fichesLiees: Fiche[]): boolean {
  const key = statutCampagne(c, fichesLiees).key;
  return key === 'a-traiter' || key === 'echue';
}
