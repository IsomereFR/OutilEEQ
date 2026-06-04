// ============================================================================
//  Dérivation du statut d'une ENQUÊTE (planning) à partir de ses fiches et
//  de ses échéances. Statuts : Planifiée / À venir (≤30 j) / À réceptionner
//  (échéance dépassée) / Reçue·en cours / Clôturée (conforme | NC).
// ============================================================================
import type { Enquete, Fiche, StatusChip } from '../types/models';

/** Date du jour à minuit (comparaisons d'échéances stables). */
export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Nombre de jours d'ici à `dateStr` (négatif = passé). null si vide. */
export function daysTo(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today().getTime()) / 86_400_000);
}

/**
 * Statut d'une enquête.
 * @param fichesLiees fiches dont enqueteId === enquete.id
 */
export function statutEnquete(e: Enquete, fichesLiees: Fiche[]): StatusChip {
  if (fichesLiees.length) {
    const allClosed = fichesLiees.every((f) => f.verdict);
    if (allClosed) {
      return fichesLiees.some((f) => f.verdict === 'non-conforme')
        ? { cls: 'bad', txt: 'Clôturée · NC', key: 'clos-nc' }
        : { cls: 'ok', txt: 'Clôturée · conforme', key: 'clos-ok' };
    }
    return { cls: 'info', txt: 'Reçue · en cours', key: 'encours' };
  }
  // Pas encore de fiche : on se base sur la date de réception prévue.
  const dPrevu = daysTo(e.dateReceptionPrevue);
  if (dPrevu !== null && dPrevu < 0) return { cls: 'bad', txt: 'À réceptionner (échue)', key: 'retard' };
  if (dPrevu !== null && dPrevu <= 30) return { cls: 'warn', txt: 'À venir (≤ 30 j)', key: 'avenir' };
  return { cls: 'neutral', txt: 'Planifiée', key: 'planif' };
}
