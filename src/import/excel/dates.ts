// ============================================================================
//  Normalisation des dates à l'import (cf. PRD F1).
//  Gère les dates série Excel (nombres) et les formats texte jj/mm/aaaa, etc.
//  Sortie : ISO "AAAA-MM-JJ" (ou '' si non interprétable).
// ============================================================================

/** Formats de date texte reconnus, sélectionnables dans le profil d'import. */
export type FormatDate = 'jj/mm/aaaa' | 'mm/jj/aaaa' | 'aaaa-mm-jj' | 'auto';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Convertit une date série Excel (jours depuis le 30/12/1899, système 1900)
 * en ISO. Excel comporte le bug de l'année 1900 bissextile, géré par l'epoch.
 */
export function serieExcelEnISO(serie: number): string {
  const epoch = Date.UTC(1899, 11, 30); // 30/12/1899
  const ms = epoch + Math.round(serie) * 86_400_000;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Normalise une valeur de cellule (nombre série ou texte) en ISO. */
export function normaliserDate(valeur: unknown, format: FormatDate = 'auto'): string {
  if (valeur == null || valeur === '') return '';

  // Date série Excel.
  if (typeof valeur === 'number' && Number.isFinite(valeur)) {
    return serieExcelEnISO(valeur);
  }

  const s = String(valeur).trim();

  // Déjà ISO.
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // Texte jj/mm/aaaa ou mm/jj/aaaa (séparateurs / . -).
  const m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})/.exec(s);
  if (m) {
    let [, a, b, y] = m;
    let jour: string;
    let mois: string;
    if (format === 'mm/jj/aaaa') {
      mois = a; jour = b;
    } else {
      jour = a; mois = b; // défaut FR : jj/mm/aaaa (et 'auto')
    }
    const annee = y.length === 2 ? `20${y}` : y;
    return `${annee}-${pad(Number(mois))}-${pad(Number(jour))}`;
  }

  // Dernier recours : Date native.
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return '';
}
