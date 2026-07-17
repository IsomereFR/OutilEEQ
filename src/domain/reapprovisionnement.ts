// ============================================================================
//  Réapprovisionnement du planning (préavis d'épuisement par automate).
//  Les plannings fournisseurs sont ANNUELS : chaque automate a une dernière
//  échéance planifiée (« horizon »), au-delà de laquelle il n'y a plus d'enquête
//  à réaliser. Il faut alors retourner sur le portail fournisseur pour importer
//  le nouveau planning. Cette règle détecte, SEUIL_REAPPRO_JOURS à l'avance, les
//  automates dont l'horizon approche (ou est déjà dépassé), pour afficher un
//  bandeau d'alerte. Pure et testée : aucun accès UI ni stockage.
// ============================================================================
import type { Automate, Enquete } from './types';
import { aujourdhui, joursRestants } from './dates';
import { SEUIL_REAPPRO_JOURS } from './config/seuils';

/** État de réapprovisionnement d'un automate dont le planning s'épuise. */
export interface EtatReappro {
  automateId: string;
  nomAutomate: string;
  disciplines: string[];
  /** Dernière échéance planifiée pour cet automate (ISO "AAAA-MM-JJ"). */
  dateHorizon: string;
  /** Jours jusqu'à l'horizon (négatif = planning déjà épuisé). */
  joursRestants: number;
  /** true si l'horizon est dépassé : plus aucune enquête à venir. */
  epuise: boolean;
}

/**
 * Automates dont le planning arrive à échéance (ou est épuisé), c.-à-d. dont la
 * dernière enquête planifiée tombe dans les `seuilJours` prochains jours (ou est
 * déjà passée). On considère TOUTES les enquêtes affectées à l'automate (quel
 * que soit le statut) : l'horizon est la date de la dernière d'entre elles.
 * Un automate sans aucune enquête affectée n'est pas concerné (rien à recharger).
 * Résultat trié du plus urgent (déjà épuisé) au moins urgent.
 */
export function automatesAReapprovisionner(
  enquetes: Enquete[],
  automates: Automate[],
  ref: Date = aujourdhui(),
  seuilJours: number = SEUIL_REAPPRO_JOURS,
): EtatReappro[] {
  // Horizon = dernière échéance planifiée parmi les enquêtes affectées, par automate.
  const horizon = new Map<string, string>();
  for (const e of enquetes) {
    if (!e.affectee) continue;
    const d = e.dateEcheanceRealisation;
    if (!d) continue;
    for (const aid of e.automateIds) {
      const actuel = horizon.get(aid);
      if (!actuel || d.localeCompare(actuel) > 0) horizon.set(aid, d);
    }
  }

  const res: EtatReappro[] = [];
  for (const a of automates) {
    if (!a.actif) continue;
    const dateHorizon = horizon.get(a.id);
    if (!dateHorizon) continue; // aucun planning : rien à réapprovisionner
    const jr = joursRestants(dateHorizon, ref);
    if (jr === null || jr > seuilJours) continue;
    res.push({
      automateId: a.id,
      nomAutomate: a.nom,
      disciplines: a.disciplines,
      dateHorizon,
      joursRestants: jr,
      epuise: jr < 0,
    });
  }

  // Plus urgent d'abord (jr croissant : les épuisés, très négatifs, en tête).
  res.sort((x, y) => x.joursRestants - y.joursRestants);
  return res;
}
