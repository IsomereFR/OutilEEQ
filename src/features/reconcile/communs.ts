// ============================================================================
//  Fragments et utilitaires partagés du module réconciliation / import.
//  Aucune logique métier ici : simples aides de présentation et d'options.
// ============================================================================
import type { Option } from '../../ui/SelectMulti';
import type { Statut } from '../../domain/types';
import { STATUTS } from '../../domain/types';
import { LIBELLE_STATUT } from '../../theme/tokens';

/** Classe commune des champs de saisie (bordure brume, focus marine). */
export const CHAMP =
  'rounded-lg border border-brume bg-surface text-sm px-2.5 py-1.5 ' +
  'focus:outline-none focus:border-marine transition';

/** Bouton primaire sobre (accent terracotta). */
export const BTN_PRIMAIRE =
  'rounded-lg bg-terracotta text-white text-sm font-medium px-3 py-2 ' +
  'hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed';

/** Bouton secondaire (filet brume). */
export const BTN_SECONDAIRE =
  'rounded-lg border border-brume bg-surface text-sm px-3 py-2 hover:border-marine/40';

/** Options de statut initial d'une enquête (workflow complet). */
export const OPTIONS_STATUT: Option[] = STATUTS.map((s: Statut) => ({
  value: s,
  label: LIBELLE_STATUT[s] ?? s,
}));

/** Construit une Map id vers libellé à partir d'une liste d'entités. */
export function indexNoms<T extends { id: string }>(
  liste: T[],
  nom: (e: T) => string,
): Map<string, string> {
  return new Map(liste.map((e) => [e.id, nom(e)]));
}

/** Convertit une liste d'entités en options { value, label } pour un select. */
export function enOptions<T extends { id: string }>(
  liste: T[],
  label: (e: T) => string,
): Option[] {
  return liste.map((e) => ({ value: e.id, label: label(e) }));
}
