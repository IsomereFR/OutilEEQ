// ============================================================================
//  Données d'amorce (cf. PRD §11). ⚠️ À COMPLÉTER avec les référentiels réels
//  BIOXA (9 sites, abonnements EEQ effectifs, parc d'automates complet).
//  Les enquêtes ci-dessous sont une DÉMO couvrant les 4 niveaux d'urgence.
// ============================================================================
import type { AppData, Fournisseur, Site, Automate, Programme, Enquete } from '../domain/types';
import { isoDecale } from '../domain/dates';

// --- Fournisseurs (à confirmer selon les abonnements réels) ------------------
const fournisseurs: Fournisseur[] = [
  { id: 'f-probioq', nom: 'ProBioQ', sigle: 'PBQ' },
  { id: 'f-asqualab', nom: 'Asqualab', sigle: 'ASQ' },
  { id: 'f-ctcb', nom: 'CTCB', sigle: 'CTCB' },
  { id: 'f-bioprospective', nom: 'Biologie Prospective', sigle: 'BP' },
  { id: 'f-riqas', nom: 'RIQAS (Randox)', sigle: 'RIQAS' },
  // À COMPLÉTER : Eurotrol, GEHT, etc. selon abonnements BIOXA.
];

// --- Sites (les 9 sites du réseau — À COMPLÉTER avec codes réels) -------------
const sites: Site[] = [
  { id: 's-central', nom: 'Plateau technique central', code: 'PTC' },
  { id: 's-site2', nom: 'Site 2 (à nommer)', code: 'S2' },
  // À COMPLÉTER : 9 sites au total.
];

// --- Automates (amorce connue — À COMPLÉTER) ---------------------------------
const automates: Automate[] = [
  { id: 'a-atellica', nom: 'Atellica IM 1600', modele: 'Siemens Atellica IM 1600', siteId: 's-central', discipline: 'Immuno-analyse', actif: true },
  { id: 'a-vision', nom: 'ORTHO VISION', modele: 'Ortho VISION', siteId: 's-central', discipline: 'Immuno-hématologie', actif: true },
  { id: 'a-epoc', nom: 'epoc', modele: 'Siemens epoc', siteId: 's-central', discipline: 'Gaz du sang', actif: true },
  // À COMPLÉTER : parc réel rattaché aux 9 sites.
];

// --- Programmes EEQ (exemples reliant fournisseur + automates par défaut) -----
const programmes: Programme[] = [
  {
    id: 'p-pbq-immuno', fournisseurId: 'f-probioq', codeProgramme: 'IMM-01', libelle: 'Immuno-analyse générale',
    discipline: 'Immuno-analyse', parametres: ['TSH', 'T4L', 'Ferritine'], frequence: 'Mensuelle',
    automatesParDefaut: ['a-atellica'],
  },
  {
    id: 'p-asq-gds', fournisseurId: 'f-asqualab', codeProgramme: 'GDS-02', libelle: 'Gaz du sang',
    discipline: 'Gaz du sang', parametres: ['pH', 'pCO2', 'pO2'], frequence: 'Trimestrielle',
    automatesParDefaut: ['a-epoc'],
  },
  {
    id: 'p-bp-ih', fournisseurId: 'f-bioprospective', codeProgramme: 'IH-03', libelle: 'Immuno-hématologie',
    discipline: 'Immuno-hématologie', parametres: ['Groupe ABO', 'RAI'], frequence: '3 / an',
    automatesParDefaut: ['a-vision'],
  },
];

// --- Enquêtes de démonstration (4 niveaux d'urgence + inbox + réalisée) -------
const nowISO = new Date().toISOString();
const mkEnq = (o: Partial<Enquete> & Pick<Enquete, 'id' | 'programmeId' | 'fournisseurId' | 'envoiRef' | 'dateEcheanceRealisation'>): Enquete => ({
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
  // En retard (échéance passée, non réalisée)
  mkEnq({ id: 'e-retard', programmeId: 'p-pbq-immuno', fournisseurId: 'f-probioq', envoiRef: 'Envoi 1/12',
    dateEcheanceRealisation: isoDecale(-4), automateIds: ['a-atellica'], statut: 'a_realiser' }),
  // Urgent J-7
  mkEnq({ id: 'e-urgent', programmeId: 'p-asq-gds', fournisseurId: 'f-asqualab', envoiRef: 'Cycle 2026-A',
    dateEcheanceRealisation: isoDecale(3), automateIds: ['a-epoc'], statut: 'a_realiser' }),
  // À surveiller (8-15 j)
  mkEnq({ id: 'e-surv', programmeId: 'p-bp-ih', fournisseurId: 'f-bioprospective', envoiRef: 'Envoi 2/3',
    dateEcheanceRealisation: isoDecale(11), automateIds: ['a-vision'], statut: 'a_venir' }),
  // À venir (> 15 j)
  mkEnq({ id: 'e-venir', programmeId: 'p-pbq-immuno', fournisseurId: 'f-probioq', envoiRef: 'Envoi 2/12',
    dateEcheanceRealisation: isoDecale(35), automateIds: ['a-atellica'], statut: 'a_venir' }),
  // Non affectée (inbox « À affecter »)
  mkEnq({ id: 'e-inbox', programmeId: 'p-asq-gds', fournisseurId: 'f-asqualab', envoiRef: 'Cycle 2026-B',
    dateEcheanceRealisation: isoDecale(9), automateIds: [], affectee: false, statut: 'a_venir', source: 'excel' }),
  // Réalisée ce mois (pour le KPI)
  mkEnq({ id: 'e-realisee', programmeId: 'p-bp-ih', fournisseurId: 'f-bioprospective', envoiRef: 'Envoi 1/3',
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
  };
}
