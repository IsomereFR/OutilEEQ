// ============================================================================
//  Lecture d'un fichier Excel/CSV côté client (SheetJS), sans upload externe.
//  Détection de la ligne d'en-tête + aperçu tabulaire (cf. PRD F1).
// ============================================================================
import * as XLSX from 'xlsx';

/** Feuille lue : grille de cellules brutes (valeurs typées SheetJS). */
export interface FeuilleBrute {
  nomFeuille: string;
  /** Lignes (tableau de cellules). Les dates série restent des nombres. */
  lignes: unknown[][];
}

/** Lit le premier onglet d'un fichier en grille brute. */
export async function lireFichier(file: File): Promise<FeuilleBrute> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const nomFeuille = wb.SheetNames[0];
  const ws = wb.Sheets[nomFeuille];
  const lignes = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: true,
    defval: '',
    blankrows: false,
  });
  return { nomFeuille, lignes };
}

/**
 * Détecte l'index (0-based) de la ligne d'en-tête : première ligne dont la
 * majorité des cellules sont des chaînes non vides et non numériques.
 */
export function detecterEntete(lignes: unknown[][]): number {
  const limite = Math.min(lignes.length, 15);
  let meilleur = 0;
  let meilleurScore = -1;
  for (let i = 0; i < limite; i++) {
    const cells = lignes[i] ?? [];
    const remplies = cells.filter((c) => String(c ?? '').trim() !== '');
    if (remplies.length < 2) continue;
    const texte = remplies.filter(
      (c) => typeof c === 'string' && Number.isNaN(Number(c)),
    ).length;
    const score = texte - (remplies.length - texte) * 0.5;
    if (score > meilleurScore) {
      meilleurScore = score;
      meilleur = i;
    }
  }
  return meilleur;
}

/** En-têtes (noms de colonnes) à partir d'un index de ligne d'en-tête. */
export function entetes(lignes: unknown[][], ligneEntete: number): string[] {
  return (lignes[ligneEntete] ?? []).map((c, i) => {
    const v = String(c ?? '').trim();
    return v || `Colonne ${i + 1}`;
  });
}

/** Lignes de données (objets colonne->valeur) sous la ligne d'en-tête. */
export function lignesData(
  lignes: unknown[][],
  ligneEntete: number,
): Record<string, unknown>[] {
  const cols = entetes(lignes, ligneEntete);
  const out: Record<string, unknown>[] = [];
  for (let i = ligneEntete + 1; i < lignes.length; i++) {
    const row = lignes[i] ?? [];
    if (row.every((c) => String(c ?? '').trim() === '')) continue;
    const obj: Record<string, unknown> = {};
    cols.forEach((col, j) => {
      obj[col] = row[j] ?? '';
    });
    out.push(obj);
  }
  return out;
}

/** Aperçu des N premières lignes de données (pour l'écran de mapping). */
export function apercu(
  lignes: unknown[][],
  ligneEntete: number,
  n = 5,
): Record<string, unknown>[] {
  return lignesData(lignes, ligneEntete).slice(0, n);
}
