// ============================================================================
//  Statut & avancement d'une fiche EEQ — dérivés des champs saisis.
//  Workflow en 6 étapes :
//   Brouillon → En cours → À transmettre → En attente du rapport
//             → À exploiter → Clôturé (conforme / non conforme)
// ============================================================================
import type { Fiche, StatusChip } from '../types/models';

/** Libellés des 6 étapes du stepper. */
export const STEPS = [
  'Administratif',
  'Reconstitution',
  'Analytique',
  'Envoi résultats',
  'Réception rapport',
  'Exploitation',
] as const;

/**
 * Nombre d'étapes franchies (0..6), déduit des champs renseignés.
 * Une reconstitution explicitement non requise (échantillon liquide) compte
 * comme franchie.
 */
export function stepIndex(f: Fiche): number {
  let s = 0;
  if (f.organisme && f.dateReception) s = 1;
  if (f.dateReconstitution || /pas de reconstitution|liquide/i.test(f.remarqueRecon || '')) {
    s = Math.max(s, 2);
  }
  if (f.dateAnalyse) s = Math.max(s, 3);
  if (f.dateEnvoiResultats) s = Math.max(s, 4);
  if (f.dateReceptionRapport) s = Math.max(s, 5);
  if (f.verdict) s = 6;
  return s;
}

/** Statut affichable (chip coloré) d'une fiche. */
export function statutFiche(f: Fiche): StatusChip {
  const s = stepIndex(f);
  if (s >= 6) {
    return f.verdict === 'non-conforme'
      ? { cls: 'bad', txt: 'Non conforme' }
      : { cls: 'ok', txt: 'Clôturé · conforme' };
  }
  if (s >= 5) return { cls: 'info', txt: 'Rapport reçu — à exploiter' };
  if (s >= 4) return { cls: 'warn', txt: 'En attente du rapport' };
  if (s >= 3) return { cls: 'warn', txt: "À transmettre à l'organisme" };
  if (s >= 1) return { cls: 'info', txt: "En cours d'analyse" };
  return { cls: 'neutral', txt: 'Brouillon' };
}
