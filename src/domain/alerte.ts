// ============================================================================
//  Niveaux d'alerte du MUR d'affichage (lecture seule).
//  4 niveaux : « aujourd'hui », « sous 3 jours », « sous 7 jours », « à jour ».
//  Règle clé : une échéance DÉPASSÉE n'est pas affichée (elle disparaît du mur ;
//  son traitement relève de la partie administrateur).
// ============================================================================
import type { Enquete } from './types';
import { avantRealise } from './urgence';
import { joursRestants, aujourdhui } from './dates';
import { SEUIL_ALERTE_3J, SEUIL_ALERTE_7J, FENETRE_AFFICHAGE_JOURS } from './config/seuils';

export type NiveauAlerte = 'aujourdhui' | 'j3' | 'j7' | 'a_jour';

/** Ordre de sévérité (0 = plus urgent). */
export const RANG_ALERTE: Record<NiveauAlerte, number> = {
  aujourdhui: 0,
  j3: 1,
  j7: 2,
  a_jour: 3,
};

/**
 * Une enquête est-elle affichable sur le mur ?
 *  - affectée à un automate,
 *  - pas encore réalisée (statut avant « réalisé »),
 *  - échéance dans la fenêtre [0, FENETRE_AFFICHAGE_JOURS] : ni dépassée, ni
 *    trop lointaine (au-delà de 15 j, inutile de l'afficher).
 */
export function estAffichable(e: Enquete, ref: Date = aujourdhui()): boolean {
  if (!e.affectee || !avantRealise(e.statut)) return false;
  const jr = joursRestants(e.dateEcheanceRealisation, ref);
  return jr !== null && jr >= 0 && jr <= FENETRE_AFFICHAGE_JOURS;
}

/** Niveau d'alerte d'une enquête, ou null si non affichable (dépassée/réalisée). */
export function niveauAlerte(e: Enquete, ref: Date = aujourdhui()): NiveauAlerte | null {
  if (!estAffichable(e, ref)) return null;
  const jr = joursRestants(e.dateEcheanceRealisation, ref) as number;
  if (jr === 0) return 'aujourdhui';
  if (jr <= SEUIL_ALERTE_3J) return 'j3';
  if (jr <= SEUIL_ALERTE_7J) return 'j7';
  return 'a_jour';
}

/** Pire (plus urgent) niveau parmi une liste ; null si aucune affichable. */
export function pireAlerte(enquetes: Enquete[], ref: Date = aujourdhui()): NiveauAlerte | null {
  let pire: NiveauAlerte | null = null;
  for (const e of enquetes) {
    const n = niveauAlerte(e, ref);
    if (n && (pire === null || RANG_ALERTE[n] < RANG_ALERTE[pire])) pire = n;
  }
  return pire;
}

/** Comptes par palier d'alerte sur un ensemble d'enquêtes (pour la synthèse). */
export interface ComptesAlerte {
  aujourdhui: number;
  j3: number;
  j7: number;
}
export function comptesAlerte(enquetes: Enquete[], ref: Date = aujourdhui()): ComptesAlerte {
  const c: ComptesAlerte = { aujourdhui: 0, j3: 0, j7: 0 };
  for (const e of enquetes) {
    const n = niveauAlerte(e, ref);
    if (n === 'aujourdhui') c.aujourdhui += 1;
    else if (n === 'j3') c.j3 += 1;
    else if (n === 'j7') c.j7 += 1;
  }
  return c;
}
