// ============================================================================
//  DOSSIER RÉSERVÉ (prompt 02) — module de lecture de capture d'écran.
//  Volontairement NON IMPLÉMENTÉ dans ce socle. Le reste de l'application
//  ignore comment les candidats sont produits (isolation IA, cf. PRD §4).
//
//  Pour brancher le module capture : implémenter `parseCaptureToEnquetes` et
//  fournir la configuration (clé API…) dans un fichier dédié, séparé du reste.
// ============================================================================
import type { CandidatEnquete } from '../excel/mapping';

/**
 * Transforme une image de capture (portail fournisseur) en candidats d'enquêtes
 * structurés, à faire valider dans l'écran de réconciliation (contrôle humain).
 * @throws tant que le module capture n'est pas installé.
 */
export interface ParseCaptureToEnquetes {
  (image: Blob): Promise<CandidatEnquete[]>;
}

export const parseCaptureToEnquetes: ParseCaptureToEnquetes = async () => {
  throw new Error('Module capture non installé');
};
