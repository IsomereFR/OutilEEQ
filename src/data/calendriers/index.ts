// ============================================================================
//  Registre des calendriers EEQ embarqués (données de référence, hors-ligne).
//  Pour ajouter un organisme (Biologie Prospective, EQAS…), créer son fichier
//  de données puis l'ajouter à CALENDRIERS — aucune autre modification requise.
// ============================================================================
import type { CalendrierOrganisme } from '../../types/models';
import { PROBIOQUAL_2026 } from './probioqual2026';
import { BIOLOGIE_PROSPECTIVE_2026 } from './biologieprospective2026';

export const CALENDRIERS: CalendrierOrganisme[] = [PROBIOQUAL_2026, BIOLOGIE_PROSPECTIVE_2026];

/** Calendrier par identifiant d'organisme. */
export function calendrierById(id: string): CalendrierOrganisme | undefined {
  return CALENDRIERS.find((c) => c.id === id);
}

/** Toutes les campagnes, tous organismes confondus. */
export function toutesCampagnes() {
  return CALENDRIERS.flatMap((c) => c.campagnes.map((camp) => ({ ...camp, organismeId: c.id, organisme: c.organisme })));
}

/** Liste des codes distincts d'un calendrier, avec programme et analytes. */
export interface CodeInfo {
  code: string;
  programme: string;
  analytes: string;
  occurrences: number;
}
export function codesDuCalendrier(cal: CalendrierOrganisme): CodeInfo[] {
  const map = new Map<string, CodeInfo>();
  for (const camp of cal.campagnes) {
    const ex = map.get(camp.code);
    if (ex) ex.occurrences += 1;
    else map.set(camp.code, { code: camp.code, programme: camp.programme, analytes: camp.analytes, occurrences: 1 });
  }
  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}
