// Fabriques d'entités vierges (valeurs par défaut centralisées).
import { uid } from '../utils/id';
import type { Automate, Enquete, Fiche } from '../types/models';

export function emptyAutomate(p: Partial<Automate> = {}): Automate {
  return { id: uid(), nom: '', secteur: '', modele: '', inventaire: '', ...p };
}

export function emptyEnquete(p: Partial<Enquete> = {}): Enquete {
  return {
    id: uid(),
    organisme: '',
    programme: 'Nouvelle enquête',
    reference: '',
    secteur: '',
    automates: [],
    dateReceptionPrevue: '',
    echeanceRetour: '',
    periodicite: '',
    remarque: '',
    ...p,
  };
}

/** Fiche vierge. Renseigner au minimum automateId via `p`. */
export function emptyFiche(p: Partial<Fiche> = {}): Fiche {
  return {
    id: uid(),
    enqueteId: null,
    automateId: '',
    type: 'EEQ',
    organisme: '',
    reference: 'Nouvelle campagne',
    secteur: '',
    nClarilab: '',
    dateEnvoi: '',
    dateReception: '',
    parReception: '',
    dateCloture: '',
    dateReceptionService: '',
    parService: '',
    tempConforme: '',
    enceinteStockage: '',
    dateReconstitution: '',
    heureReconstitution: '',
    parReconstitution: '',
    micropipette: '',
    remarqueRecon: '',
    dateAnalyse: '',
    parAnalyse: '',
    remarqueAnalyse: '',
    modeEnvoi: '',
    dateEnvoiResultats: '',
    parEnvoi: '',
    saisieVerifieeLe: '',
    parSaisie: '',
    connexionVerifiee: '',
    parConnexion: '',
    resultatsAutomate: '',
    dateReceptionRapport: '',
    parReceptionRapport: '',
    resultatsBP: '',
    verdict: null,
    refFNC: '',
    presentationLe: '',
    parPresentation: '',
    supportUtilise: '',
    analytes: [],
    ...p,
  };
}
