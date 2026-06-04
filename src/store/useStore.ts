// ============================================================================
//  Store applicatif (Zustand) + persistance automatique IndexedDB + audit.
//  - Toute mutation déclenche une sauvegarde (débouncée) dans IndexedDB.
//  - Un journal d'audit léger horodate les événements structurants (ISO).
// ============================================================================
import { create } from 'zustand';
import type { AppData, Automate, Enquete, Fiche, Analyte, Verdict, AuditEntry } from '../types/models';
import { loadData, saveData } from './db';
import { seed } from './seed';
import { emptyAutomate, emptyEnquete, emptyFiche } from './factories';

interface StoreState extends AppData {
  /** true une fois l'état chargé depuis IndexedDB (ou seedé). */
  ready: boolean;
  /** message d'erreur de persistance (IndexedDB indisponible…). */
  error: string | null;

  setLab(v: string): void;

  addAutomate(p?: Partial<Automate>): string;
  updateAutomate(id: string, patch: Partial<Automate>): void;
  deleteAutomate(id: string): void;

  addEnquete(): string;
  updateEnquete(id: string, patch: Partial<Enquete>): void;
  deleteEnquete(id: string): void;
  toggleEnqueteAutomate(id: string, automateId: string): void;

  addFiche(automateId: string): string;
  createFicheFromEnquete(enqueteId: string, automateId: string): string;
  updateFiche(id: string, patch: Partial<Fiche>): void;
  deleteFiche(id: string): void;
  setVerdict(id: string, v: Verdict): void;
  addAnalyte(ficheId: string): void;
  updateAnalyte(ficheId: string, index: number, patch: Partial<Analyte>): void;
  deleteAnalyte(ficheId: string, index: number): void;

  /** Remplace tout l'état (import JSON). */
  replaceAll(data: AppData): void;
}

const EMPTY: AppData = { lab: '', automates: [], enquetes: [], fiches: [], audit: [] };

// --- Audit léger : coalesce les "modification" répétées sur la même entité ---
const COALESCE_MS = 60_000;
function appendAudit(audit: AuditEntry[], entry: Omit<AuditEntry, 'ts'>): AuditEntry[] {
  const ts = new Date().toISOString();
  const last = audit[audit.length - 1];
  if (
    last &&
    entry.action === 'modification' &&
    last.action === 'modification' &&
    last.entity === entry.entity &&
    last.entityId === entry.entityId &&
    Date.now() - new Date(last.ts).getTime() < COALESCE_MS
  ) {
    // On rafraîchit simplement l'horodatage de la dernière entrée.
    const copy = audit.slice();
    copy[copy.length - 1] = { ...last, ts };
    return copy;
  }
  return [...audit, { ts, ...entry }];
}

export const useStore = create<StoreState>((set, get) => {
  // mutate : applique une mutation sur AppData + journalise + renvoie le patch.
  const mutate = (
    fn: (d: AppData) => Partial<AppData> | void,
    audit?: Omit<AuditEntry, 'ts'>,
  ) => {
    set((state) => {
      const data: AppData = {
        lab: state.lab,
        automates: state.automates,
        enquetes: state.enquetes,
        fiches: state.fiches,
        audit: state.audit,
      };
      const patch = fn(data) || {};
      const nextAudit = audit ? appendAudit(patch.audit ?? data.audit, audit) : patch.audit ?? data.audit;
      return { ...patch, audit: nextAudit };
    });
  };

  return {
    ...EMPTY,
    ready: false,
    error: null,

    setLab: (v) => mutate(() => ({ lab: v }), { entity: 'lab', entityId: null, action: 'modification' }),

    addAutomate: (p) => {
      const a = emptyAutomate(p);
      mutate((d) => ({ automates: [...d.automates, a] }), {
        entity: 'automate', entityId: a.id, action: 'création', detail: a.nom,
      });
      return a.id;
    },
    updateAutomate: (id, patch) =>
      mutate((d) => ({ automates: d.automates.map((a) => (a.id === id ? { ...a, ...patch } : a)) }), {
        entity: 'automate', entityId: id, action: 'modification',
      }),
    deleteAutomate: (id) =>
      mutate(
        (d) => ({
          automates: d.automates.filter((a) => a.id !== id),
          fiches: d.fiches.filter((f) => f.automateId !== id),
        }),
        { entity: 'automate', entityId: id, action: 'suppression' },
      ),

    addEnquete: () => {
      const e = emptyEnquete();
      mutate((d) => ({ enquetes: [...d.enquetes, e] }), {
        entity: 'enquete', entityId: e.id, action: 'création',
      });
      return e.id;
    },
    updateEnquete: (id, patch) =>
      mutate((d) => ({ enquetes: d.enquetes.map((e) => (e.id === id ? { ...e, ...patch } : e)) }), {
        entity: 'enquete', entityId: id, action: 'modification',
      }),
    deleteEnquete: (id) =>
      // Les fiches déjà créées sont conservées et simplement détachées.
      mutate(
        (d) => ({
          enquetes: d.enquetes.filter((e) => e.id !== id),
          fiches: d.fiches.map((f) => (f.enqueteId === id ? { ...f, enqueteId: null } : f)),
        }),
        { entity: 'enquete', entityId: id, action: 'suppression' },
      ),
    toggleEnqueteAutomate: (id, automateId) =>
      mutate(
        (d) => ({
          enquetes: d.enquetes.map((e) => {
            if (e.id !== id) return e;
            const has = e.automates.includes(automateId);
            return {
              ...e,
              automates: has ? e.automates.filter((x) => x !== automateId) : [...e.automates, automateId],
            };
          }),
        }),
        { entity: 'enquete', entityId: id, action: 'modification' },
      ),

    addFiche: (automateId) => {
      const secteur = get().automates.find((a) => a.id === automateId)?.secteur || '';
      const f = emptyFiche({ automateId, secteur });
      mutate((d) => ({ fiches: [...d.fiches, f] }), {
        entity: 'fiche', entityId: f.id, action: 'création',
      });
      return f.id;
    },
    createFicheFromEnquete: (enqueteId, automateId) => {
      const e = get().enquetes.find((x) => x.id === enqueteId);
      const f = emptyFiche({
        enqueteId,
        automateId,
        organisme: e?.organisme || '',
        reference: `${e?.programme || ''} ${e?.reference || ''}`.trim(),
        secteur: e?.secteur || '',
      });
      mutate((d) => ({ fiches: [...d.fiches, f] }), {
        entity: 'fiche', entityId: f.id, action: 'création', detail: 'depuis enquête',
      });
      return f.id;
    },
    updateFiche: (id, patch) =>
      mutate((d) => ({ fiches: d.fiches.map((f) => (f.id === id ? { ...f, ...patch } : f)) }), {
        entity: 'fiche', entityId: id, action: 'modification',
      }),
    deleteFiche: (id) =>
      mutate((d) => ({ fiches: d.fiches.filter((f) => f.id !== id) }), {
        entity: 'fiche', entityId: id, action: 'suppression',
      }),
    setVerdict: (id, v) =>
      mutate(
        (d) => ({
          fiches: d.fiches.map((f) => (f.id === id ? { ...f, verdict: f.verdict === v ? null : v } : f)),
        }),
        { entity: 'fiche', entityId: id, action: 'modification', detail: `verdict ${v}` },
      ),
    addAnalyte: (ficheId) =>
      mutate((d) => ({
        fiches: d.fiches.map((f) =>
          f.id === ficheId
            ? { ...f, analytes: [...f.analytes, { param: '', valeur: '', cible: '', sd: '', unite: '' }] }
            : f,
        ),
      })),
    updateAnalyte: (ficheId, index, patch) =>
      mutate((d) => ({
        fiches: d.fiches.map((f) =>
          f.id === ficheId
            ? { ...f, analytes: f.analytes.map((an, i) => (i === index ? { ...an, ...patch } : an)) }
            : f,
        ),
      })),
    deleteAnalyte: (ficheId, index) =>
      mutate((d) => ({
        fiches: d.fiches.map((f) =>
          f.id === ficheId ? { ...f, analytes: f.analytes.filter((_, i) => i !== index) } : f,
        ),
      })),

    replaceAll: (data) =>
      set({
        lab: data.lab ?? '',
        automates: data.automates ?? [],
        enquetes: data.enquetes ?? [],
        fiches: data.fiches ?? [],
        audit: appendAudit(data.audit ?? [], { entity: 'data', entityId: null, action: 'import' }),
      }),
  };
});

// --- Initialisation : charge depuis IndexedDB, sinon seed ---
export async function initStore(): Promise<void> {
  try {
    const data = await loadData();
    if (data) {
      useStore.setState({ ...data, ready: true, error: null });
    } else {
      const s = seed();
      await saveData(s);
      useStore.setState({ ...s, ready: true, error: null });
    }
  } catch (e) {
    // IndexedDB indisponible : on bascule en mémoire avec le seed + bannière.
    useStore.setState({
      ...seed(),
      ready: true,
      error:
        "Stockage local indisponible — les données ne seront pas conservées après fermeture. Pensez à exporter régulièrement (JSON).",
    });
    // eslint-disable-next-line no-console
    console.error('IndexedDB indisponible :', e);
  }
}

// --- Sauvegarde automatique débouncée à chaque modification ---
let saveTimer: ReturnType<typeof setTimeout> | null = null;
useStore.subscribe((s) => {
  if (!s.ready) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveData({
      lab: s.lab,
      automates: s.automates,
      enquetes: s.enquetes,
      fiches: s.fiches,
      audit: s.audit,
    }).catch((e) => {
      useStore.setState({ error: 'Échec de sauvegarde locale : ' + String(e) });
    });
  }, 300);
});
