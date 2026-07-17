// ============================================================================
//  Modèle de données EEQ · BIOXA (cf. PRD §5). Types purs, aucun accès UI/store.
//  Dates stockées en ISO "AAAA-MM-JJ".
// ============================================================================

/** Fournisseur de programmes EEQ (ProBioQ, Asqualab, RIQAS…). */
export interface Fournisseur {
  id: string;
  nom: string;
  sigle: string;
  urlPortail?: string;
  notes?: string;
}

/** Site du réseau BIOXA. */
export interface Site {
  id: string;
  nom: string;
  code: string;
}

/** Automate / analyseur. Peut couvrir plusieurs disciplines (ex. TLA). */
export interface Automate {
  id: string;
  nom: string;
  modele: string;
  siteId: string;
  /** 1..n disciplines couvertes par l'automate. */
  disciplines: string[];
  actif: boolean;
}

/** Programme EEQ récurrent d'un fournisseur. */
export interface Programme {
  id: string;
  fournisseurId: string;
  codeProgramme: string;
  libelle: string;
  discipline: string;
  parametres: string[];
  frequence: string;
  /** Automates proposés par défaut à l'affectation. */
  automatesParDefaut: string[];
}

/** Workflow de statut d'une enquête (cf. PRD §5.2). */
export type Statut =
  | 'a_venir'
  | 'a_realiser'
  | 'en_cours'
  | 'realise'
  | 'resultats_saisis'
  | 'cloture';

/** Ordre du workflow (index = avancement). */
export const STATUTS: Statut[] = [
  'a_venir',
  'a_realiser',
  'en_cours',
  'realise',
  'resultats_saisis',
  'cloture',
];

/** Statuts « avant réalisation » : concernés par le retard/urgence. */
export const STATUTS_AVANT_REALISE: Statut[] = ['a_venir', 'a_realiser', 'en_cours'];

/** Origine d'une enquête (traçabilité COFRAC). */
export type SourceEnquete = 'excel' | 'capture' | 'manuel';

/** Occurrence datée d'un programme : un envoi précis à réaliser. */
export interface Enquete {
  id: string;
  programmeId: string;
  fournisseurId: string;
  /** Référence d'envoi, ex. « Envoi 2/3 », « Cycle 2025-B ». */
  envoiRef: string;
  dateOuverture: string;
  /** Échéance de passage sur automate — pilote l'alerte. */
  dateEcheanceRealisation: string;
  /** Échéance de saisie des résultats sur le portail. */
  dateLimiteSaisie: string;
  automateIds: string[];
  siteId: string;
  responsable?: string;
  statut: Statut;
  /** false = enquête en attente d'affectation (inbox). */
  affectee: boolean;
  source: SourceEnquete;
  /** Id de pièce jointe source (capture d'origine). */
  sourceRef?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Profil d'import mémorisant le mapping de colonnes par fournisseur. */
export interface ProfilImport {
  id: string;
  fournisseurId: string;
  /** champ Enquete -> nom de colonne du fichier. */
  mappingColonnes: Record<string, string>;
  formatDate: string;
  ligneEntete: number;
}

/** Pièce jointe (capture) stockée en IndexedDB. */
export interface PieceJointe {
  id: string;
  type: string;
  /** Contenu encodé base64 (portable dans l'export JSON). */
  blob: string;
  nom: string;
}

/** Entrée du journal minimal des imports. */
export interface JournalImport {
  id: string;
  date: string;
  fournisseurId: string;
  source: SourceEnquete;
  nbCandidats: number;
  nbIntegres: number;
}

/** État applicatif complet (= contenu exporté/importé en JSON). */
export interface AppData {
  fournisseurs: Fournisseur[];
  sites: Site[];
  automates: Automate[];
  programmes: Programme[];
  enquetes: Enquete[];
  profils: ProfilImport[];
  piecesJointes: PieceJointe[];
  journal: JournalImport[];
  /** Version du jeu d'amorce ayant produit les référentiels (cf. seed). */
  seedVersion?: number;
}
