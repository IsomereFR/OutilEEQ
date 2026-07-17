// ============================================================================
//  Calcul d'urgence d'une enquête (cf. PRD §6.1). Pure et testé.
// ============================================================================
import type { Enquete, Statut } from './types';
import { STATUTS_AVANT_REALISE } from './types';
import { SEUIL_URGENT, SEUIL_SURVEILLANCE } from './config/seuils';
import { joursRestants, aujourdhui } from './dates';

/** Niveau d'urgence dérivé de l'échéance de réalisation. */
export type NiveauUrgence = 'en_retard' | 'urgent' | 'a_surveiller' | 'a_venir';

/** Ordre de priorité (0 = plus prioritaire) pour le tri. */
export const RANG_URGENCE: Record<NiveauUrgence, number> = {
  en_retard: 0,
  urgent: 1,
  a_surveiller: 2,
  a_venir: 3,
};

/** Une enquête est-elle avant l'état « réalisé » ? */
export function avantRealise(statut: Statut): boolean {
  return STATUTS_AVANT_REALISE.includes(statut);
}

/**
 * Niveau d'urgence :
 *  - joursRestants < 0 et statut avant 'realise'      => 'en_retard'
 *  - 0..SEUIL_URGENT                                   => 'urgent' (alerte J-7)
 *  - (SEUIL_URGENT+1)..SEUIL_SURVEILLANCE             => 'a_surveiller'
 *  - > SEUIL_SURVEILLANCE                              => 'a_venir'
 * Une enquête déjà réalisée (ou au-delà) n'est jamais 'en_retard'.
 */
export function niveauUrgence(e: Enquete, ref: Date = aujourdhui()): NiveauUrgence {
  const jr = joursRestants(e.dateEcheanceRealisation, ref);
  if (jr === null) return 'a_venir';
  if (jr < 0) return avantRealise(e.statut) ? 'en_retard' : 'a_venir';
  if (jr <= SEUIL_URGENT) return 'urgent';
  if (jr <= SEUIL_SURVEILLANCE) return 'a_surveiller';
  return 'a_venir';
}

/** Déclenche-t-elle l'alerte dashboard (retard ou J-7) ? */
export function declencheAlerte(e: Enquete, ref: Date = aujourdhui()): boolean {
  const n = niveauUrgence(e, ref);
  return n === 'en_retard' || n === 'urgent';
}
