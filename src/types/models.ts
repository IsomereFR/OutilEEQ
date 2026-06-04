// ============================================================================
//  Modèle de données — store unique, aucun lien inter-fichiers rigide.
//  Toutes les entités vivent dans IndexedDB et s'exportent en un seul JSON.
// ============================================================================

/** Automate / analyseur du laboratoire. */
export interface Automate {
  id: string;
  nom: string;
  secteur: string;
  modele: string;
  inventaire: string;
}

/** Enquête EEQ planifiée (programme annuel) — une entrée PAR enquête. */
export interface Enquete {
  id: string;
  organisme: string;
  programme: string;
  reference: string;
  secteur: string;
  /** 1..n automates concernés (ids). */
  automates: string[];
  dateReceptionPrevue: string;
  echeanceRetour: string;
  periodicite: string;
  remarque: string;
}

/** Paramètre analysé dans le rapport de l'organisme. */
export interface Analyte {
  param: string;
  valeur: string;
  cible: string;
  sd: string;
  unite: string;
}

/**
 * Pièce jointe PDF embarquée dans le store (encodée en data URL base64).
 * Embarquer le fichier — plutôt qu'un chemin — garantit la portabilité et
 * l'absence de lien fragile : le PDF voyage avec l'export JSON et reste
 * accessible hors-ligne.
 */
export interface PieceJointePDF {
  nom: string;
  taille: number; // octets
  data: string; // data URL "data:application/pdf;base64,…"
}

/** Verdict de conformité d'une fiche. */
export type Verdict = 'conforme' | 'non-conforme' | null;

/** Type de contrôle. */
export type TypeControle = 'EEQ' | 'CNQ';

/** Fiche de suivi d'une campagne EEQ/CNQ pour un automate donné. */
export interface Fiche {
  id: string;
  /** Rattachement à une enquête du planning (null = fiche autonome). */
  enqueteId: string | null;
  automateId: string;

  // 1. administratif
  type: TypeControle;
  organisme: string;
  reference: string;
  secteur: string;
  nClarilab: string;
  dateEnvoi: string;
  dateReception: string;
  parReception: string;
  dateCloture: string;
  dateReceptionService: string;
  parService: string;
  tempConforme: string;
  enceinteStockage: string;

  // 2. reconstitution
  dateReconstitution: string;
  heureReconstitution: string;
  parReconstitution: string;
  micropipette: string;
  remarqueRecon: string;

  // 3. analytique
  dateAnalyse: string;
  parAnalyse: string;
  remarqueAnalyse: string;

  // 4. envoi
  modeEnvoi: string;
  dateEnvoiResultats: string;
  parEnvoi: string;
  saisieVerifieeLe: string;
  parSaisie: string;
  connexionVerifiee: string;
  parConnexion: string;
  resultatsAutomate: string;
  /** PDF des résultats automate déposé dans la fiche (optionnel). */
  resultatsAutomatePdf?: PieceJointePDF | null;

  // 5. réception
  dateReceptionRapport: string;
  parReceptionRapport: string;
  resultatsBP: string;

  // 6. exploitation
  verdict: Verdict;
  refFNC: string;
  presentationLe: string;
  parPresentation: string;
  supportUtilise: string;
  analytes: Analyte[];
}

/** Entrée du journal d'audit léger (traçabilité ISO). */
export interface AuditEntry {
  ts: string; // horodatage ISO
  entity: 'automate' | 'enquete' | 'fiche' | 'lab' | 'data';
  entityId: string | null;
  action: string; // ex. "création", "modification", "suppression", "import"
  detail?: string;
}

/** État applicatif complet (= contenu exporté/importé en JSON). */
export interface AppData {
  lab: string;
  automates: Automate[];
  enquetes: Enquete[];
  fiches: Fiche[];
  audit: AuditEntry[];
}

/** Statut affiché sous forme de chip coloré. */
export interface StatusChip {
  cls: 'ok' | 'warn' | 'bad' | 'info' | 'neutral';
  txt: string;
  /** Clé stable pour le comptage (statut enquête). */
  key?: string;
}
