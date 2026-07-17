// ============================================================================
//  Sélecteurs de vues (purs) pour le dashboard : indicateurs, compteurs
//  d'alerte, filtres transverses, regroupement de la frise par semaine.
// ============================================================================
import type { Enquete, Programme } from './types';
import { niveauUrgence } from './urgence';
import { aujourdhui, joursRestants, parseISO } from './dates';
import { FENETRE_FRISE_JOURS } from './config/seuils';

/** Indicateurs du bandeau de cartes (cf. PRD F4). */
export interface Indicateurs {
  sous7j: number;
  enRetard: number;
  aSurveiller: number;
  nonAffectees: number;
  realiseesCeMois: number;
}

export function indicateurs(enquetes: Enquete[], ref: Date = aujourdhui()): Indicateurs {
  let sous7j = 0;
  let enRetard = 0;
  let aSurveiller = 0;
  let nonAffectees = 0;
  let realiseesCeMois = 0;
  const moisRef = ref.getMonth();
  const anneeRef = ref.getFullYear();

  for (const e of enquetes) {
    if (!e.affectee) {
      nonAffectees += 1;
      continue; // l'inbox n'entre pas dans les indicateurs de planning
    }
    const n = niveauUrgence(e, ref);
    if (n === 'urgent') sous7j += 1;
    else if (n === 'en_retard') enRetard += 1;
    else if (n === 'a_surveiller') aSurveiller += 1;

    if (e.statut === 'realise' || e.statut === 'resultats_saisis' || e.statut === 'cloture') {
      const d = parseISO(e.updatedAt.slice(0, 10)) ?? parseISO(e.dateEcheanceRealisation);
      if (d && d.getMonth() === moisRef && d.getFullYear() === anneeRef) realiseesCeMois += 1;
    }
  }
  return { sous7j, enRetard, aSurveiller, nonAffectees, realiseesCeMois };
}

/** Compteurs du bandeau d'alerte en tête (cf. PRD F4.1). */
export interface CompteursAlerte {
  urgent: number;
  retard: number;
  nonAffectees: number;
}

export function compteursAlerte(enquetes: Enquete[], ref: Date = aujourdhui()): CompteursAlerte {
  const i = indicateurs(enquetes, ref);
  return { urgent: i.sous7j, retard: i.enRetard, nonAffectees: i.nonAffectees };
}

/** Le bandeau d'alerte doit-il s'afficher ? (masqué si tout est à zéro). */
export function bandeauVisible(c: CompteursAlerte): boolean {
  return c.urgent > 0 || c.retard > 0 || c.nonAffectees > 0;
}

/** Filtres transverses du dashboard. */
export interface Filtres {
  fournisseurId?: string;
  automateId?: string;
  siteId?: string;
  discipline?: string;
  statut?: string;
}

/** Applique les filtres (la discipline est résolue via le programme). */
export function appliquerFiltres(
  enquetes: Enquete[],
  filtres: Filtres,
  programmes: Programme[],
): Enquete[] {
  const discParProg = new Map(programmes.map((p) => [p.id, p.discipline]));
  return enquetes.filter((e) => {
    if (filtres.fournisseurId && e.fournisseurId !== filtres.fournisseurId) return false;
    if (filtres.automateId && !e.automateIds.includes(filtres.automateId)) return false;
    if (filtres.siteId && e.siteId !== filtres.siteId) return false;
    if (filtres.statut && e.statut !== filtres.statut) return false;
    if (filtres.discipline && discParProg.get(e.programmeId) !== filtres.discipline) return false;
    return true;
  });
}

/** Une semaine de la frise chronologique. */
export interface SemaineFrise {
  /** ISO du lundi de la semaine. */
  debut: string;
  /** Libellé court (ex. « 09/03 »). */
  label: string;
  enquetes: Enquete[];
}

/** Lundi (à minuit) de la semaine contenant `d`. */
function lundiDe(d: Date): Date {
  const x = new Date(d);
  const jour = (x.getDay() + 6) % 7; // 0 = lundi
  x.setDate(x.getDate() - jour);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Regroupe par semaine les enquêtes affectées dont l'échéance tombe dans la
 * fenêtre glissante [aujourd'hui, aujourd'hui + fenetreJours].
 */
export function frisParSemaine(
  enquetes: Enquete[],
  ref: Date = aujourdhui(),
  fenetreJours: number = FENETRE_FRISE_JOURS,
): SemaineFrise[] {
  const semaines = new Map<string, SemaineFrise>();
  // Pré-crée les semaines de la fenêtre (colonnes régulières, même vides).
  const debut = lundiDe(ref);
  for (let j = 0; j <= fenetreJours + 7; j += 7) {
    const d = new Date(debut);
    d.setDate(d.getDate() + j);
    const iso = d.toISOString().slice(0, 10);
    semaines.set(iso, {
      debut: iso,
      label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      enquetes: [],
    });
  }
  for (const e of enquetes) {
    if (!e.affectee) continue;
    const jr = joursRestants(e.dateEcheanceRealisation, ref);
    if (jr === null || jr < 0 || jr > fenetreJours) continue;
    const d = parseISO(e.dateEcheanceRealisation);
    if (!d) continue;
    const iso = lundiDe(d).toISOString().slice(0, 10);
    const sem = semaines.get(iso);
    if (sem) sem.enquetes.push(e);
  }
  return [...semaines.values()];
}
