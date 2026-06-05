// Sélecteurs purs — relations dérivées (aucun lien rigide stocké).
import type { Automate, Enquete, Fiche } from '../types/models';

export const findAutomate = (automates: Automate[], id: string | null) =>
  automates.find((a) => a.id === id);

export const findEnquete = (enquetes: Enquete[], id: string | null) =>
  enquetes.find((e) => e.id === id);

export const fichesForAutomate = (fiches: Fiche[], automateId: string) =>
  fiches.filter((f) => f.automateId === automateId);

export const fichesForEnquete = (fiches: Fiche[], enqueteId: string) =>
  fiches.filter((f) => f.enqueteId === enqueteId);

export const fichesForCampagne = (fiches: Fiche[], campagneId: string) =>
  fiches.filter((f) => f.campagneId === campagneId);
