// ============================================================================
//  Mapping des colonnes du fichier vers les champs d'une enquête (cf. PRD F1).
//  Un ProfilImport mémorise ce mapping par fournisseur (mémorisation apprenante).
// ============================================================================
import type { ProfilImport } from '../../domain/types';
import { normaliserDate, type FormatDate } from './dates';

/** Champs d'enquête alimentables depuis un fichier. */
export const CHAMPS_MAPPABLES = [
  { cle: 'programme', label: 'Programme (code ou libellé)' },
  { cle: 'envoiRef', label: 'Référence d’envoi' },
  { cle: 'dateOuverture', label: 'Date d’ouverture' },
  { cle: 'dateEcheanceRealisation', label: 'Échéance de réalisation' },
  { cle: 'dateLimiteSaisie', label: 'Date limite de saisie' },
  { cle: 'notes', label: 'Notes' },
] as const;

export type ChampMappable = (typeof CHAMPS_MAPPABLES)[number]['cle'];

/** Candidat d'enquête extrait d'un fichier (avant réconciliation). */
export interface CandidatEnquete {
  /** Texte de programme lu (code ou libellé) à résoudre en programmeId. */
  programmeRef: string;
  envoiRef: string;
  dateOuverture: string;
  dateEcheanceRealisation: string;
  dateLimiteSaisie: string;
  notes: string;
  /** Ligne d'origine (traçabilité). */
  brut: Record<string, unknown>;
}

/** Mots-clés pour proposer un mapping automatique quand aucun profil n'existe. */
const INDICES: Record<ChampMappable, RegExp> = {
  programme: /programme|analyte|param|libell|intitul|examen/i,
  envoiRef: /envoi|cycle|r[ée]f|s[ée]rie|lot|num/i,
  dateOuverture: /ouvert|disponib|mise ?a ?dispo|d[ée]but/i,
  dateEcheanceRealisation: /[ée]ch[ée]anc|r[ée]alis|passage|limite ?r[ée]alis|deadline/i,
  dateLimiteSaisie: /saisie|r[ée]sultat|cl[ôo]tur|retour/i,
  notes: /note|remarque|comment/i,
};

/** Propose un mapping champ -> colonne à partir des en-têtes du fichier. */
export function suggererMapping(entetes: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const { cle } of CHAMPS_MAPPABLES) {
    const col = entetes.find((h) => INDICES[cle].test(h));
    if (col) map[cle] = col;
  }
  return map;
}

/** Construit les candidats depuis les lignes de données + mapping + format de date. */
export function construireCandidats(
  rows: Record<string, unknown>[],
  mapping: Record<string, string>,
  formatDate: FormatDate = 'auto',
): CandidatEnquete[] {
  const lire = (row: Record<string, unknown>, cle: ChampMappable): string => {
    const col = mapping[cle];
    if (!col) return '';
    return String(row[col] ?? '').trim();
  };
  const lireDate = (row: Record<string, unknown>, cle: ChampMappable): string => {
    const col = mapping[cle];
    if (!col) return '';
    return normaliserDate(row[col], formatDate);
  };

  return rows.map((row) => ({
    programmeRef: lire(row, 'programme'),
    envoiRef: lire(row, 'envoiRef'),
    dateOuverture: lireDate(row, 'dateOuverture'),
    dateEcheanceRealisation: lireDate(row, 'dateEcheanceRealisation'),
    dateLimiteSaisie: lireDate(row, 'dateLimiteSaisie'),
    notes: lire(row, 'notes'),
    brut: row,
  }));
}

/** Fabrique un ProfilImport à mémoriser. */
export function construireProfil(
  id: string,
  fournisseurId: string,
  mapping: Record<string, string>,
  formatDate: string,
  ligneEntete: number,
): ProfilImport {
  return { id, fournisseurId, mappingColonnes: mapping, formatDate, ligneEntete };
}
