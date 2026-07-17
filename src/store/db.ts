// ============================================================================
//  Persistance IndexedDB via idb-keyval (cf. PRD §6 F6).
//  Tout l'état applicatif (référentiels, enquêtes, profils, pièces jointes,
//  journal) est stocké sous une clé unique — atomicité export/import.
// ============================================================================
import { get, set } from 'idb-keyval';
import type { AppData } from '../domain/types';

const CLE = 'eeq-bioxa/state';

/** État vide (aucune donnée). */
export const APPDATA_VIDE: AppData = {
  fournisseurs: [],
  sites: [],
  automates: [],
  programmes: [],
  enquetes: [],
  profils: [],
  piecesJointes: [],
  journal: [],
};

/** Complète un AppData partiel (tolérant aux imports/versions anciennes). */
export function normaliserAppData(d: Partial<AppData> | null | undefined): AppData {
  return { ...APPDATA_VIDE, ...(d ?? {}) };
}

/** Charge l'état persistant, ou null si absent. Peut lever si IndexedDB KO. */
export async function chargerAppData(): Promise<AppData | null> {
  const d = await get<AppData>(CLE);
  return d ? normaliserAppData(d) : null;
}

/** Écrit l'état complet (remplacement atomique). Écriture confirmée (await). */
export async function sauverAppData(data: AppData): Promise<void> {
  await set(CLE, data);
}
