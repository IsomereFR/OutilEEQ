// ============================================================================
//  Tri par priorité de la liste priorisée (cf. PRD §7 F4).
//  Ordre : en retard, puis urgent (J-7), puis reste ; à niveau égal, par
//  échéance de réalisation croissante.
// ============================================================================
import type { Enquete } from './types';
import { niveauUrgence, RANG_URGENCE } from './urgence';
import { aujourdhui } from './dates';

/** Comparateur de priorité entre deux enquêtes. */
export function comparerPriorite(a: Enquete, b: Enquete, ref: Date = aujourdhui()): number {
  const ra = RANG_URGENCE[niveauUrgence(a, ref)];
  const rb = RANG_URGENCE[niveauUrgence(b, ref)];
  if (ra !== rb) return ra - rb;
  // À urgence égale : échéance la plus proche d'abord.
  return a.dateEcheanceRealisation.localeCompare(b.dateEcheanceRealisation);
}

/** Renvoie une COPIE triée par priorité (ne mute pas l'entrée). */
export function trierParPriorite(enquetes: Enquete[], ref: Date = aujourdhui()): Enquete[] {
  return enquetes.slice().sort((a, b) => comparerPriorite(a, b, ref));
}
