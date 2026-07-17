// ============================================================================
//  Store applicatif (zustand) au-dessus d'IndexedDB (idb-keyval).
//  Toute mutation déclenche une sauvegarde confirmée (débouncée).
// ============================================================================
import { create } from 'zustand';
import type {
  AppData,
  Enquete,
  Statut,
  ProfilImport,
  JournalImport,
  PieceJointe,
} from '../domain/types';
import { chargerAppData, sauverAppData, APPDATA_VIDE } from './db';
import { seed } from '../config/seed';
import { fusionner, type ModeImport } from './backup';

let SEQ = 0;
/** Identifiant local unique (mono-poste). */
export function uid(prefixe = 'id'): string {
  SEQ += 1;
  return `${prefixe}-${Date.now().toString(36)}-${SEQ.toString(36)}`;
}

interface StoreState extends AppData {
  ready: boolean;
  error: string | null;

  /** Modifie le statut d'une enquête. */
  setStatut(id: string, statut: Statut): void;
  /** Réaffecte les automates d'une enquête. */
  reaffecter(id: string, automateIds: string[]): void;
  /** Patch générique d'une enquête. */
  patchEnquete(id: string, patch: Partial<Enquete>): void;
  /** Affecte une enquête de l'inbox (bascule affectee = true) et l'entre au planning. */
  affecter(id: string, patch: Partial<Enquete>): void;
  /** Ajoute des enquêtes (issues de la réconciliation). */
  ajouterEnquetes(list: Enquete[]): void;

  /** Enregistre / met à jour un profil d'import (mémorisation apprenante). */
  upsertProfil(profil: ProfilImport): void;
  /** Ajoute une entrée au journal des imports. */
  ajouterJournal(entry: JournalImport): void;
  /** Ajoute une pièce jointe (capture). */
  ajouterPieceJointe(pj: PieceJointe): void;

  /** Remplace ou fusionne tout l'état (import JSON). */
  appliquerImportJSON(data: AppData, mode: ModeImport): void;
  /** Instantané AppData pur (pour export). */
  snapshot(): AppData;
}

function extraireAppData(s: StoreState): AppData {
  return {
    fournisseurs: s.fournisseurs,
    sites: s.sites,
    automates: s.automates,
    programmes: s.programmes,
    enquetes: s.enquetes,
    profils: s.profils,
    piecesJointes: s.piecesJointes,
    journal: s.journal,
  };
}

const nowISO = () => new Date().toISOString();

export const useStore = create<StoreState>((set, get) => ({
  ...APPDATA_VIDE,
  ready: false,
  error: null,

  setStatut: (id, statut) =>
    set((s) => ({
      enquetes: s.enquetes.map((e) =>
        e.id === id ? { ...e, statut, updatedAt: nowISO() } : e,
      ),
    })),

  reaffecter: (id, automateIds) =>
    set((s) => ({
      enquetes: s.enquetes.map((e) =>
        e.id === id ? { ...e, automateIds, updatedAt: nowISO() } : e,
      ),
    })),

  patchEnquete: (id, patch) =>
    set((s) => ({
      enquetes: s.enquetes.map((e) =>
        e.id === id ? { ...e, ...patch, updatedAt: nowISO() } : e,
      ),
    })),

  affecter: (id, patch) =>
    set((s) => ({
      enquetes: s.enquetes.map((e) =>
        e.id === id ? { ...e, ...patch, affectee: true, updatedAt: nowISO() } : e,
      ),
    })),

  ajouterEnquetes: (list) => set((s) => ({ enquetes: [...s.enquetes, ...list] })),

  upsertProfil: (profil) =>
    set((s) => {
      const i = s.profils.findIndex((p) => p.fournisseurId === profil.fournisseurId);
      const profils = i === -1
        ? [...s.profils, profil]
        : s.profils.map((p, j) => (j === i ? profil : p));
      return { profils };
    }),

  ajouterJournal: (entry) => set((s) => ({ journal: [entry, ...s.journal] })),

  ajouterPieceJointe: (pj) => set((s) => ({ piecesJointes: [...s.piecesJointes, pj] })),

  appliquerImportJSON: (data, mode) =>
    set(() => (mode === 'remplacement' ? data : fusionner(get().snapshot(), data))),

  snapshot: () => extraireAppData(get()),
}));

// --- Initialisation : charge depuis IndexedDB, sinon seed --------------------
export async function initStore(): Promise<void> {
  try {
    const data = await chargerAppData();
    if (data) {
      useStore.setState({ ...data, ready: true, error: null });
    } else {
      const s = seed();
      await sauverAppData(s);
      useStore.setState({ ...s, ready: true, error: null });
    }
  } catch (e) {
    useStore.setState({
      ...seed(),
      ready: true,
      error:
        'Stockage local indisponible. Les données ne seront pas conservées après fermeture. Exportez régulièrement (JSON).',
    });
    // eslint-disable-next-line no-console
    console.error('IndexedDB indisponible :', e);
  }
}

// --- Sauvegarde automatique confirmée (débouncée) ---------------------------
let timer: ReturnType<typeof setTimeout> | null = null;
useStore.subscribe((s) => {
  if (!s.ready) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    sauverAppData(extraireAppData(s)).catch((e) =>
      useStore.setState({ error: 'Échec de sauvegarde locale : ' + String(e) }),
    );
  }, 300);
});
