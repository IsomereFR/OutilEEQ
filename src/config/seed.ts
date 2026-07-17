// ============================================================================
//  Données d'amorce (cf. PRD §11). Parc d'automates réel BIOXA (un automate par
//  famille analytique) + plannings importés (ProBioQual, Biologie Prospective).
//  Les enquêtes sont NON AFFECTÉES : l'admin attribue chaque programme à un
//  automate, ce qui les fait apparaître au mur (cf. AttributionProgrammes).
//  ⚠️ À COMPLÉTER : les 9 sites (ici un seul site d'amorce) et le rattachement
//  automate ↔ site.
// ============================================================================
import type { AppData, Fournisseur, Site, Automate, Programme, Enquete } from '../domain/types';
import { PROBIOQUAL_PROGRAMMES, PROBIOQUAL_ENQUETES } from './probioqual';
import { BP_PROGRAMMES, BP_ENQUETES } from './bioprospective';
import { BIORAD_PROGRAMMES, BIORAD_ENQUETES } from './biorad';

/**
 * Version du jeu d'amorce. À incrémenter quand on modifie les référentiels de
 * démonstration que l'on souhaite voir appliqués automatiquement (cf. initStore
 * qui régénère lorsque la version stockée est inférieure). Phase d'amorce : la
 * régénération remplace l'état local (données de démonstration, pas réelles).
 */
export const SEED_VERSION = 11;

// --- Fournisseurs (à confirmer selon les abonnements réels) ------------------
const fournisseurs: Fournisseur[] = [
  { id: 'f-probioq', nom: 'ProBioQual', sigle: 'PBQ' },
  { id: 'f-asqualab', nom: 'Asqualab', sigle: 'ASQ' },
  { id: 'f-ctcb', nom: 'CTCB', sigle: 'CTCB' },
  { id: 'f-bioprospective', nom: 'Biologie Prospective', sigle: 'BP' },
  { id: 'f-biorad', nom: 'BIORAD (EQAS)', sigle: 'EQAS' },
  { id: 'f-riqas', nom: 'RIQAS (Randox)', sigle: 'RIQAS' },
  // À COMPLÉTER : Eurotrol, GEHT, etc.
];

// --- Sites (les 9 sites du réseau — À COMPLÉTER avec codes réels) -------------
const sites: Site[] = [
  { id: 's-central', nom: 'Plateau technique central', code: 'PTC' },
  // À COMPLÉTER : 9 sites au total.
];

// --- Parc d'automates : UN automate par famille analytique (simplification
//     d'amorce). Le dédoublonnage (CH1..CH4, IM1..IM4, etc.) et le partage
//     multi-discipline pourront être ajoutés ultérieurement. Rattachement site :
//     À COMPLÉTER (les 9 sites). Le modèle Automate.disciplines[] reste prêt à
//     accueillir un automate couvrant plusieurs familles.
const A = (id: string, nom: string, disciplines: string[], modele = ''): Automate => ({
  id,
  nom,
  modele,
  siteId: 's-central',
  disciplines,
  actif: true,
});

const automates: Automate[] = [
  A('a-ch', 'Atellica CH', ['Biochimie'], 'Siemens Atellica CH'),
  A('a-im', 'Atellica IM', ['Immunologie'], 'Siemens Atellica IM'),
  A('a-liaisonxl', 'Liaison XL', ['Immuno-enzymologie'], 'DiaSorin Liaison XL'),
  A('a-cs', 'CS-5100', ['Hémostase'], 'Sysmex CS-5100'),
  A('a-xn', 'XN', ['Hématologie'], 'Sysmex XN'),
  A('a-vision', 'Vision', ['Immunohématologie'], 'Ortho VISION'),
  // TLA / Octa : un seul automate (même famille : HbA1c, ELP, PBJ, CDT).
  A('a-tlaocta', 'TLA / Octa', ['HbA1c', 'ELP', 'PBJ', 'CDT']),
  A('a-manuel', 'Techniques manuelles', ['Techniques Manuelles']),
];

// --- Programmes EEQ : plannings importés (ProBioQual + Biologie Prospective + BIORAD)
const programmes: Programme[] = [...PROBIOQUAL_PROGRAMMES, ...BP_PROGRAMMES, ...BIORAD_PROGRAMMES];

// --- Enquêtes : plannings importés, NON AFFECTÉES. L'admin attribue chaque
//     programme à un automate (cf. AttributionProgrammes), ce qui affecte les
//     enquêtes correspondantes et les fait apparaître au mur.
const enquetes: Enquete[] = [...PROBIOQUAL_ENQUETES, ...BP_ENQUETES, ...BIORAD_ENQUETES];

/** Jeu de données d'amorce complet. */
export function seed(): AppData {
  return {
    fournisseurs,
    sites,
    automates,
    programmes,
    enquetes,
    profils: [],
    piecesJointes: [],
    journal: [],
    seedVersion: SEED_VERSION,
  };
}
