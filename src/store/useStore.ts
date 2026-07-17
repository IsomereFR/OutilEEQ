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
import { seed, SEED_VERSION } from '../config/seed';
import { fusionner, type ModeImport } from './backup';
import { fusionnerAmorce } from './fusion';
import { syncActif, chargerDistant, sauverDistant } from './sync';

let SEQ = 0;
/** Identifiant local unique (mono-poste). */
export function uid(prefixe = 'id'): string {
  SEQ += 1;
  return `${prefixe}-${Date.now().toString(36)}-${SEQ.toString(36)}`;
}

/** État de la synchronisation multi-poste. */
export type SyncEtat = 'local' | 'synchro' | 'hors-ligne';

interface StoreState extends AppData {
  ready: boolean;
  error: string | null;
  /** local = non configurée ; synchro = Supabase OK ; hors-ligne = échec réseau. */
  syncEtat: SyncEtat;

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

  /**
   * Attribue un programme à un (ou plusieurs) automate(s) : met à jour les
   * automates par défaut du programme ET affecte toutes ses enquêtes à ces
   * automates (affectee = true si au moins un automate). Coeur du flux admin.
   */
  attribuerProgramme(programmeId: string, automateIds: string[]): void;

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
    seedVersion: s.seedVersion,
  };
}

const nowISO = () => new Date().toISOString();

export const useStore = create<StoreState>((set, get) => ({
  ...APPDATA_VIDE,
  ready: false,
  error: null,
  syncEtat: syncActif ? 'synchro' : 'local',

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

  attribuerProgramme: (programmeId, automateIds) =>
    set((s) => ({
      programmes: s.programmes.map((p) => (p.id === programmeId ? { ...p, automatesParDefaut: automateIds } : p)),
      enquetes: s.enquetes.map((e) =>
        e.programmeId === programmeId
          ? { ...e, automateIds, affectee: automateIds.length > 0, updatedAt: nowISO() }
          : e,
      ),
    })),

  appliquerImportJSON: (data, mode) =>
    set(() => (mode === 'remplacement' ? data : fusionner(get().snapshot(), data))),

  snapshot: () => extraireAppData(get()),
}));

// Renommage d'automates : les anciennes références sont migrées vers le nouvel
// identifiant (fusion TLA + Octa -> TLA / Octa), pour ne pas perdre d'attribution.
const REMAP_AUTOMATES: Record<string, string> = {
  'a-tla': 'a-tlaocta',
  'a-octa': 'a-tlaocta',
};
function migrerAutomates(data: AppData): AppData {
  const remap = (ids: string[]) => [...new Set(ids.map((id) => REMAP_AUTOMATES[id] ?? id))];
  return {
    ...data,
    programmes: data.programmes.map((p) => ({ ...p, automatesParDefaut: remap(p.automatesParDefaut) })),
    enquetes: data.enquetes.map((e) => ({ ...e, automateIds: remap(e.automateIds) })),
  };
}

// --- Initialisation : Supabase (partagé) prioritaire, sinon IndexedDB, sinon seed
export async function initStore(): Promise<void> {
  try {
    const local = await chargerAppData(); // cache hors-ligne

    // Source partagée (Supabase) si configurée et joignable.
    let distant: AppData | null = null;
    let syncEtat: SyncEtat = syncActif ? 'synchro' : 'local';
    if (syncActif) {
      try {
        distant = await chargerDistant();
      } catch (e) {
        syncEtat = 'hors-ligne';
        // eslint-disable-next-line no-console
        console.warn('Supabase injoignable, mode hors-ligne (cache local) :', e);
      }
    }

    // Base = données partagées si dispo, sinon cache local.
    const base = distant ?? local;
    let etat: AppData;
    if (base && (base.seedVersion ?? 0) >= SEED_VERSION) etat = base;
    else if (base) etat = fusionnerAmorce(base, seed()); // fusion : attributions préservées
    else etat = seed(); // tout premier chargement
    etat = migrerAutomates(etat); // remap des identifiants d'automates renommés

    await sauverAppData(etat); // cache local
    // Pousse l'état (fusionné) vers Supabase pour l'initialiser/le mettre à jour.
    if (syncActif && syncEtat === 'synchro') {
      try {
        await sauverDistant(etat);
      } catch {
        syncEtat = 'hors-ligne';
      }
    }
    useStore.setState({ ...etat, ready: true, error: null, syncEtat });
  } catch (e) {
    useStore.setState({
      ...seed(),
      ready: true,
      syncEtat: syncActif ? 'hors-ligne' : 'local',
      error:
        'Stockage local indisponible. Les données ne seront pas conservées après fermeture. Exportez régulièrement (JSON).',
    });
    // eslint-disable-next-line no-console
    console.error('IndexedDB indisponible :', e);
  }
}

// --- Sauvegarde automatique débouncée : cache local + Supabase (si actif) ----
let timer: ReturnType<typeof setTimeout> | null = null;
useStore.subscribe((s) => {
  if (!s.ready) return;
  if (timer) clearTimeout(timer);
  const snap = extraireAppData(s);
  timer = setTimeout(() => {
    sauverAppData(snap).catch((e) =>
      useStore.setState({ error: 'Échec de sauvegarde locale : ' + String(e) }),
    );
    if (syncActif) {
      sauverDistant(snap)
        .then(() => {
          if (useStore.getState().syncEtat !== 'synchro') useStore.setState({ syncEtat: 'synchro' });
        })
        .catch((e) => {
          useStore.setState({ syncEtat: 'hors-ligne' });
          // eslint-disable-next-line no-console
          console.warn('Échec de synchro Supabase (conservé en local) :', e);
        });
    }
  }, 400);
});
