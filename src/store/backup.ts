// ============================================================================
//  Sauvegarde : export / import JSON complet horodaté (cf. PRD §6 F6).
//  Les pièces jointes (captures) sont déjà encodées en base64 dans AppData,
//  donc incluses telles quelles dans l'export.
// ============================================================================
import type { AppData } from '../domain/types';
import { normaliserAppData } from './db';

/** Enveloppe d'export : métadonnées + données. */
export interface ExportJSON {
  format: 'eeq-bioxa';
  version: 1;
  exporteLe: string; // horodatage ISO
  data: AppData;
}

/** Déclenche le téléchargement d'un instantané JSON daté. */
export function exporterJSON(data: AppData): void {
  const enveloppe: ExportJSON = {
    format: 'eeq-bioxa',
    version: 1,
    exporteLe: new Date().toISOString(),
    data,
  };
  const blob = new Blob([JSON.stringify(enveloppe, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'eeq-bioxa_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

/** Lit un fichier JSON exporté et renvoie l'AppData (rejette si invalide). */
export function lireImportJSON(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(String(r.result));
        const data = parsed?.data ?? parsed; // tolère un AppData nu
        if (!data || !Array.isArray(data.enquetes)) throw new Error('format inattendu');
        resolve(normaliserAppData(data));
      } catch {
        reject(new Error('Fichier JSON invalide.'));
      }
    };
    r.onerror = () => reject(new Error('Lecture impossible.'));
    r.readAsText(file);
  });
}

/** Mode d'import : fusion (ajout non destructif) ou remplacement total. */
export type ModeImport = 'fusion' | 'remplacement';

/** Fusionne deux AppData en dédupliquant par id (l'import prime en cas d'égalité). */
export function fusionner(actuel: AppData, entrant: AppData): AppData {
  const parId = <T extends { id: string }>(a: T[], b: T[]): T[] => {
    const map = new Map<string, T>();
    for (const x of a) map.set(x.id, x);
    for (const x of b) map.set(x.id, x);
    return [...map.values()];
  };
  return {
    fournisseurs: parId(actuel.fournisseurs, entrant.fournisseurs),
    sites: parId(actuel.sites, entrant.sites),
    automates: parId(actuel.automates, entrant.automates),
    programmes: parId(actuel.programmes, entrant.programmes),
    enquetes: parId(actuel.enquetes, entrant.enquetes),
    profils: parId(actuel.profils, entrant.profils),
    piecesJointes: parId(actuel.piecesJointes, entrant.piecesJointes),
    journal: parId(actuel.journal, entrant.journal),
  };
}
