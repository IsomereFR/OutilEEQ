// ============================================================================
//  Jeu de données de démonstration — équivalent à celui du prototype.
//  6 automates, 6 enquêtes (tous statuts), 4 fiches dont une non conforme.
// ============================================================================
import { uid } from '../utils/id';
import type { AppData } from '../types/models';
import { emptyFiche } from './factories';

export function seed(): AppData {
  const a1 = uid();
  const a2 = uid();
  const a3 = uid();
  const a4 = uid();
  const a5 = uid();
  const a6 = uid();
  const e1 = uid();
  const e2 = uid();
  const e3 = uid();
  const e4 = uid();
  const e5 = uid();
  const e6 = uid();

  return {
    lab: 'Laboratoire de biologie médicale',
    audit: [],
    // Démo : le secteur Hémostase (code HA) est rattaché à l'automate Stago.
    codeConfigs: [{ organismeId: 'probioqual', code: 'HA', automateId: a3, actif: true }],
    automates: [
      { id: a1, nom: 'Atellica Solution', secteur: 'Biochimie / Immuno', modele: 'Siemens', inventaire: 'INV-0142' },
      { id: a3, nom: 'CS 5100', secteur: 'Hémostase', modele: 'Sysmex', inventaire: 'INV-0203' },
      { id: a4, nom: 'Liaison XL', secteur: 'Sérologie / Immuno', modele: 'DiaSorin', inventaire: '' },
      { id: a5, nom: 'Vision', secteur: 'Hématologie', modele: '', inventaire: '' },
      { id: a2, nom: 'XN 9100', secteur: 'Hématologie', modele: 'Sysmex', inventaire: 'INV-0088' },
      { id: a6, nom: 'TLA', secteur: 'Automatisation', modele: '', inventaire: '' },
    ],
    enquetes: [
      {
        id: e1, organisme: 'Biologie Prospective', programme: 'Immuno-hématologie (Coombs)', reference: '2026-3A',
        secteur: 'Immuno-hématologie', automates: [a1], dateReceptionPrevue: '2026-06-03', echeanceRetour: '2026-06-15',
        periodicite: '3 / an', remarque: '',
      },
      {
        id: e2, organisme: 'ProBioQual', programme: 'Biochimie générale', reference: '2026-02',
        secteur: 'Biochimie', automates: [a1], dateReceptionPrevue: '2026-04-09', echeanceRetour: '2026-04-25',
        periodicite: 'Mensuelle', remarque: '',
      },
      {
        id: e3, organisme: 'Asqualab', programme: 'Hématologie cellulaire', reference: '2026-Q2',
        secteur: 'Hématologie', automates: [a2], dateReceptionPrevue: '2026-05-13', echeanceRetour: '2026-05-30',
        periodicite: 'Trimestrielle', remarque: '',
      },
      {
        id: e4, organisme: 'ProBioQual', programme: 'Hémostase', reference: '2026-01',
        secteur: 'Hémostase', automates: [a3], dateReceptionPrevue: '2026-03-05', echeanceRetour: '2026-03-22',
        periodicite: 'Trimestrielle', remarque: '',
      },
      {
        id: e5, organisme: 'ProBioQual', programme: 'Biochimie générale', reference: '2026-03',
        secteur: 'Biochimie', automates: [a1], dateReceptionPrevue: '2026-09-10', echeanceRetour: '2026-09-28',
        periodicite: 'Mensuelle', remarque: 'Enquête planifiée — non encore reçue',
      },
      {
        id: e6, organisme: 'Asqualab', programme: 'Hématologie cellulaire', reference: '2026-Q3',
        secteur: 'Hématologie', automates: [a2], dateReceptionPrevue: '2026-05-28', echeanceRetour: '2026-06-02',
        periodicite: 'Trimestrielle', remarque: 'À réceptionner — échéance dépassée',
      },
    ],
    fiches: [
      emptyFiche({
        enqueteId: e1, automateId: a1, type: 'EEQ', organisme: 'Biologie Prospective', reference: 'Coombs 2026-3A',
        secteur: 'Immuno-hématologie', dateEnvoi: '2026-06-02', dateReception: '2026-06-03', parReception: 'BER',
        dateCloture: '2026-06-15', dateReceptionService: '2026-06-02', parService: 'BER', nClarilab: 'CL-2026-118',
        tempConforme: 'Conforme', enceinteStockage: 'Réfrigérateur 4°C',
        dateReconstitution: '2026-06-04', heureReconstitution: '09:30', parReconstitution: 'BER',
        micropipette: 'INV-0301', remarqueRecon: 'Réception 9h30 — gardé à température ambiante, stabilité 20°±5° / 24h',
        dateAnalyse: '2026-06-04', parAnalyse: 'MYL', remarqueAnalyse: '',
        modeEnvoi: 'Saisie manuelle', dateEnvoiResultats: '2026-06-05', parEnvoi: 'MYL',
        saisieVerifieeLe: '2026-06-05', parSaisie: 'BTL', connexionVerifiee: 'N/A', parConnexion: '',
        resultatsAutomate: 'Résultats automate\\2026\\2026.3A.pdf',
        verdict: null, supportUtilise: 'Kalilab', analytes: [],
      }),
      emptyFiche({
        enqueteId: e2, automateId: a1, type: 'EEQ', organisme: 'ProBioQual', reference: 'BIOCH 2026-02',
        secteur: 'Biochimie', dateEnvoi: '2026-04-08', dateReception: '2026-04-09', parReception: 'BER',
        dateCloture: '2026-05-02', dateReceptionService: '2026-04-09', parService: 'BER', nClarilab: 'CL-2026-074',
        tempConforme: 'Conforme', enceinteStockage: 'Congélateur -20°C',
        dateReconstitution: '2026-04-10', heureReconstitution: '08:15', parReconstitution: 'BER', micropipette: 'INV-0301',
        dateAnalyse: '2026-04-10', parAnalyse: 'MYL',
        modeEnvoi: 'Connexion', dateEnvoiResultats: '2026-04-11', parEnvoi: 'MYL',
        saisieVerifieeLe: '2026-04-11', parSaisie: 'BTL', connexionVerifiee: 'Conforme', parConnexion: 'BTL',
        resultatsAutomate: 'Résultats automate\\2026\\2026.02.pdf',
        dateReceptionRapport: '2026-04-28', parReceptionRapport: 'BER', resultatsBP: 'Rapport PBQ 2026-02',
        verdict: 'conforme', presentationLe: '2026-05-02', parPresentation: 'BER', supportUtilise: 'Kalilab',
        analytes: [
          { param: 'Glucose', valeur: '5.12', cible: '5.05', sd: '0.15', unite: 'mmol/L' },
          { param: 'Créatinine', valeur: '88', cible: '86', sd: '3.5', unite: 'µmol/L' },
          { param: 'Potassium', valeur: '4.35', cible: '4.30', sd: '0.10', unite: 'mmol/L' },
          { param: 'ASAT', valeur: '31', cible: '29', sd: '2.2', unite: 'U/L' },
        ],
      }),
      emptyFiche({
        enqueteId: e3, automateId: a2, type: 'EEQ', organisme: 'Asqualab', reference: 'HEMATO 2026-Q2',
        secteur: 'Hématologie', dateEnvoi: '2026-05-12', dateReception: '2026-05-13', parReception: 'IH',
        dateReceptionService: '2026-05-13', parService: 'IH', nClarilab: 'CL-2026-091',
        tempConforme: 'Conforme', enceinteStockage: 'Réfrigérateur 4°C',
        remarqueRecon: 'Échantillon liquide — pas de reconstitution',
        dateAnalyse: '2026-05-14', parAnalyse: 'IH',
        modeEnvoi: 'Connexion',
        verdict: null, supportUtilise: '', analytes: [],
      }),
      emptyFiche({
        enqueteId: e4, automateId: a3, type: 'EEQ', organisme: 'ProBioQual', reference: 'HEMOSTASE 2026-01',
        secteur: 'Hémostase', dateEnvoi: '2026-03-04', dateReception: '2026-03-05', parReception: 'BER',
        dateCloture: '2026-03-28', dateReceptionService: '2026-03-05', parService: 'BER', nClarilab: 'CL-2026-052',
        tempConforme: 'Conforme', enceinteStockage: 'Congélateur -20°C',
        dateReconstitution: '2026-03-06', heureReconstitution: '08:00', parReconstitution: 'BER', micropipette: 'INV-0302',
        dateAnalyse: '2026-03-06', parAnalyse: 'BER',
        modeEnvoi: 'Saisie manuelle', dateEnvoiResultats: '2026-03-07', parEnvoi: 'BER',
        saisieVerifieeLe: '2026-03-07', parSaisie: 'MYL', connexionVerifiee: 'N/A',
        resultatsAutomate: 'Résultats automate\\2026\\hemo-01.pdf',
        dateReceptionRapport: '2026-03-24', parReceptionRapport: 'BER', resultatsBP: 'Rapport PBQ',
        verdict: 'non-conforme', refFNC: 'FNC-2026-019', presentationLe: '2026-03-28', parPresentation: 'BER',
        supportUtilise: 'Kalilab',
        analytes: [
          { param: 'TP', valeur: '78', cible: '92', sd: '4.0', unite: '%' },
          { param: 'TCA (ratio)', valeur: '1.18', cible: '1.15', sd: '0.05', unite: '' },
          { param: 'Fibrinogène', valeur: '3.1', cible: '3.0', sd: '0.18', unite: 'g/L' },
        ],
      }),
    ],
  };
}
