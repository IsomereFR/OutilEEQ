// ============================================================================
//  Fusion d'une nouvelle amorce (référentiels + plannings) dans l'état local,
//  en PRÉSERVANT les attributions de l'utilisateur. Garantit que les mises à
//  jour de plannings n'écrasent jamais le travail d'affectation (attributions
//  conservées définitivement). Pur et testé.
// ============================================================================
import type { AppData } from '../domain/types';

/** Union par id (l'amorce prime ; on conserve les entrées locales absentes). */
export function unionParId<T extends { id: string }>(amorce: T[], local: T[]): T[] {
  const ids = new Set(amorce.map((x) => x.id));
  return [...amorce, ...local.filter((x) => !ids.has(x.id))];
}

/**
 * Fusionne `amorce` dans `local` :
 *  - programmes déjà attribués : leurs automates par défaut sont conservés ;
 *  - enquêtes existantes : leur état d'affectation (automateIds/affectee/statut)
 *    est conservé ;
 *  - nouvelles enquêtes d'un programme déjà attribué : héritent de l'attribution ;
 *  - profils / journal / pièces jointes : conservés.
 */
export function fusionnerAmorce(local: AppData, amorce: AppData): AppData {
  const attributions = new Map(
    local.programmes
      .filter((p) => (p.automatesParDefaut ?? []).length > 0)
      .map((p) => [p.id, p.automatesParDefaut]),
  );

  const programmes = unionParId(
    amorce.programmes.map((p) =>
      attributions.has(p.id) ? { ...p, automatesParDefaut: attributions.get(p.id) as string[] } : p,
    ),
    local.programmes,
  );

  const localEnq = new Map(local.enquetes.map((e) => [e.id, e]));
  const amorceEnqIds = new Set(amorce.enquetes.map((e) => e.id));
  const enquetes = [
    ...amorce.enquetes.map((e) => {
      const ex = localEnq.get(e.id);
      if (ex) {
        return { ...e, automateIds: ex.automateIds, affectee: ex.affectee, statut: ex.statut, notes: ex.notes, updatedAt: ex.updatedAt };
      }
      const auto = attributions.get(e.programmeId);
      return auto ? { ...e, automateIds: auto, affectee: auto.length > 0 } : e;
    }),
    ...local.enquetes.filter((e) => !amorceEnqIds.has(e.id)),
  ];

  return {
    fournisseurs: unionParId(amorce.fournisseurs, local.fournisseurs),
    sites: unionParId(amorce.sites, local.sites),
    automates: amorce.automates,
    programmes,
    enquetes,
    profils: local.profils,
    piecesJointes: local.piecesJointes,
    journal: local.journal,
    seedVersion: amorce.seedVersion,
  };
}
