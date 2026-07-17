// ============================================================================
//  Données d'amorce (cf. PRD §11). Parc d'automates réel BIOXA fourni, organisé
//  PAR DISCIPLINE. ⚠️ À COMPLÉTER : les 9 sites (ici un seul site d'amorce), les
//  abonnements EEQ réels et le rattachement automate ↔ site.
//  Les enquêtes ci-dessous sont une DÉMO couvrant les 4 niveaux d'urgence.
// ============================================================================
import type { AppData, Fournisseur, Site, Automate, Programme, Enquete } from '../domain/types';
import { isoDecale } from '../domain/dates';

/**
 * Version du jeu d'amorce. À incrémenter quand on modifie les référentiels de
 * démonstration que l'on souhaite voir appliqués automatiquement (cf. initStore
 * qui régénère lorsque la version stockée est inférieure). Phase d'amorce : la
 * régénération remplace l'état local (données de démonstration, pas réelles).
 */
export const SEED_VERSION = 4;

// --- Fournisseurs (à confirmer selon les abonnements réels) ------------------
const fournisseurs: Fournisseur[] = [
  { id: 'f-probioq', nom: 'ProBioQ', sigle: 'PBQ' },
  { id: 'f-asqualab', nom: 'Asqualab', sigle: 'ASQ' },
  { id: 'f-ctcb', nom: 'CTCB', sigle: 'CTCB' },
  { id: 'f-bioprospective', nom: 'Biologie Prospective', sigle: 'BP' },
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
  A('a-tla', 'TLA', ['HbA1C'], 'HbA1C'),
  A('a-octa', 'Octa', ['Électrophorèse des protéines'], 'Sebia'),
];

// --- Programmes EEQ (exemples reliant fournisseur + automates par défaut) -----
const programmes: Programme[] = [
  {
    id: 'p-bioch', fournisseurId: 'f-probioq', codeProgramme: 'BIOCH', libelle: 'Biochimie générale',
    discipline: 'Biochimie', parametres: ['Glucose', 'Créatinine', 'Na', 'K'], frequence: 'Mensuelle',
    automatesParDefaut: ['a-ch'],
  },
  {
    id: 'p-immuno', fournisseurId: 'f-probioq', codeProgramme: 'IMMUNO', libelle: 'Immuno-analyse',
    discipline: 'Immunologie', parametres: ['TSH', 'T4L', 'Ferritine'], frequence: 'Mensuelle',
    automatesParDefaut: ['a-im'],
  },
  {
    id: 'p-hemostase', fournisseurId: 'f-probioq', codeProgramme: 'HEMOS', libelle: 'Hémostase',
    discipline: 'Hémostase', parametres: ['TP', 'TCA', 'Fibrinogène'], frequence: 'Trimestrielle',
    automatesParDefaut: ['a-cs'],
  },
  {
    id: 'p-hemato', fournisseurId: 'f-asqualab', codeProgramme: 'HEMATO', libelle: 'Hématologie cellulaire',
    discipline: 'Hématologie', parametres: ['NFS', 'Plaquettes'], frequence: 'Trimestrielle',
    automatesParDefaut: ['a-xn'],
  },
  {
    id: 'p-ih', fournisseurId: 'f-bioprospective', codeProgramme: 'IH', libelle: 'Immuno-hématologie',
    discipline: 'Immunohématologie', parametres: ['Groupe ABO', 'RAI'], frequence: '3 / an',
    automatesParDefaut: ['a-vision'],
  },
  {
    id: 'p-hba1c', fournisseurId: 'f-riqas', codeProgramme: 'HBA1C', libelle: 'HbA1C',
    discipline: 'HbA1C', parametres: ['HbA1C'], frequence: 'Mensuelle',
    automatesParDefaut: ['a-tla'],
  },
  {
    id: 'p-eph', fournisseurId: 'f-asqualab', codeProgramme: 'EPH', libelle: 'Électrophorèse des protéines',
    discipline: 'Électrophorèse des protéines', parametres: ['Albumine', 'Globulines'], frequence: 'Semestrielle',
    automatesParDefaut: ['a-octa'],
  },
];

// --- Enquêtes de démonstration (4 niveaux d'urgence + inbox + réalisée) -------
const nowISO = new Date().toISOString();
const mkEnq = (
  o: Partial<Enquete> & Pick<Enquete, 'id' | 'programmeId' | 'fournisseurId' | 'envoiRef' | 'dateEcheanceRealisation'>,
): Enquete => ({
  dateOuverture: isoDecale(-20),
  dateLimiteSaisie: isoDecale(20),
  automateIds: [],
  siteId: 's-central',
  statut: 'a_realiser',
  affectee: true,
  source: 'manuel',
  notes: '',
  createdAt: nowISO,
  updatedAt: nowISO,
  ...o,
});

const enquetes: Enquete[] = [
  // En retard (Hématologie)
  mkEnq({ id: 'e-retard', programmeId: 'p-hemato', fournisseurId: 'f-asqualab', envoiRef: 'Envoi 1/4',
    dateEcheanceRealisation: isoDecale(-4), automateIds: ['a-xn'], statut: 'a_realiser' }),
  // Urgent J-7 (Biochimie)
  mkEnq({ id: 'e-urgent', programmeId: 'p-bioch', fournisseurId: 'f-probioq', envoiRef: 'Cycle 2026-A',
    dateEcheanceRealisation: isoDecale(3), automateIds: ['a-ch'], statut: 'a_realiser' }),
  // À surveiller (Immunologie)
  mkEnq({ id: 'e-surv', programmeId: 'p-immuno', fournisseurId: 'f-probioq', envoiRef: 'Envoi 5/12',
    dateEcheanceRealisation: isoDecale(11), automateIds: ['a-im'], statut: 'a_venir' }),
  // À venir (Hémostase)
  mkEnq({ id: 'e-venir', programmeId: 'p-hemostase', fournisseurId: 'f-probioq', envoiRef: 'Cycle 2026-2',
    dateEcheanceRealisation: isoDecale(35), automateIds: ['a-cs'], statut: 'a_venir' }),
  // Non affectée (inbox « À affecter »)
  mkEnq({ id: 'e-inbox', programmeId: 'p-hba1c', fournisseurId: 'f-riqas', envoiRef: 'Envoi 7/12',
    dateEcheanceRealisation: isoDecale(9), automateIds: [], affectee: false, statut: 'a_venir', source: 'excel' }),
  // Réalisée ce mois (Immunohématologie)
  mkEnq({ id: 'e-realisee', programmeId: 'p-ih', fournisseurId: 'f-bioprospective', envoiRef: 'Envoi 1/3',
    dateEcheanceRealisation: isoDecale(-6), automateIds: ['a-vision'], statut: 'realise' }),
];

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
