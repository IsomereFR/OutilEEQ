// ============================================================================
//  Persistance IndexedDB via Dexie.
//  Choix : un UNIQUE enregistrement contenant tout l'état applicatif.
//  → atomicité de l'export/import, aucun lien inter-fichiers, robustesse.
// ============================================================================
import Dexie, { type Table } from 'dexie';
import type { AppData } from '../types/models';

interface KV {
  key: string;
  value: AppData;
}

class EeqDB extends Dexie {
  kv!: Table<KV, string>;
  constructor() {
    super('suivi-eeq');
    this.version(1).stores({ kv: 'key' });
  }
}

export const db = new EeqDB();
export const STATE_KEY = 'state';

/** Charge l'état persistant, ou null si absent. Peut lever si IndexedDB KO. */
export async function loadData(): Promise<AppData | null> {
  const rec = await db.kv.get(STATE_KEY);
  return rec?.value ?? null;
}

/** Écrit l'état complet (remplacement atomique). */
export async function saveData(data: AppData): Promise<void> {
  await db.kv.put({ key: STATE_KEY, value: data });
}
