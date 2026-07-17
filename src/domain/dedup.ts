// ============================================================================
//  Déduplication à l'import (cf. PRD §6.2).
//  Clé = fournisseurId + programmeId + envoiRef + dateEcheanceRealisation.
// ============================================================================
import type { Enquete } from './types';

/** Verdict de rapprochement d'un candidat vis-à-vis de l'existant. */
export type VerdictDedup = 'nouvelle' | 'deja_presente' | 'mise_a_jour_possible';

/** Champs minimaux d'un candidat nécessaires au rapprochement. */
export interface CandidatCle {
  fournisseurId: string;
  programmeId: string;
  envoiRef: string;
  dateEcheanceRealisation: string;
}

/** Clé exacte de déduplication. */
export function cleDedup(c: CandidatCle): string {
  return [c.fournisseurId, c.programmeId, c.envoiRef, c.dateEcheanceRealisation].join('|');
}

/** Clé partielle (même programme + envoi, date ignorée). */
export function clePartielle(c: CandidatCle): string {
  return [c.fournisseurId, c.programmeId, c.envoiRef].join('|');
}

/**
 * Classe un candidat par rapport aux enquêtes existantes :
 *  - clé exacte identique                    => 'deja_presente'
 *  - même programme+envoi, date différente   => 'mise_a_jour_possible'
 *  - sinon                                    => 'nouvelle'
 */
export function classifierCandidat(candidat: CandidatCle, existantes: Enquete[]): VerdictDedup {
  const cle = cleDedup(candidat);
  const clePart = clePartielle(candidat);
  let partiel = false;
  for (const e of existantes) {
    if (cleDedup(e) === cle) return 'deja_presente';
    if (clePartielle(e) === clePart) partiel = true;
  }
  return partiel ? 'mise_a_jour_possible' : 'nouvelle';
}

/** Candidat enrichi de son verdict. */
export interface CandidatClasse<T extends CandidatCle = CandidatCle> {
  candidat: T;
  verdict: VerdictDedup;
}

/**
 * Classe une liste de candidats en tenant compte de l'existant ET des candidats
 * déjà vus dans le même lot (évite les doublons internes au fichier).
 */
export function classifierLot<T extends CandidatCle>(
  candidats: T[],
  existantes: Enquete[],
): CandidatClasse<T>[] {
  const vues = new Set(existantes.map(cleDedup));
  return candidats.map((candidat) => {
    const cle = cleDedup(candidat);
    let verdict: VerdictDedup;
    if (vues.has(cle)) {
      verdict = 'deja_presente';
    } else {
      verdict = classifierCandidat(candidat, existantes);
      vues.add(cle);
    }
    return { candidat, verdict };
  });
}
