// ============================================================================
//  Tokens de la direction artistique BIOXA (cf. PRD §8).
//  Source unique des couleurs pour un usage hors classes Tailwind (frise, SVG…).
// ============================================================================
export const COULEURS = {
  creme: '#F7F2EA',
  surface: '#FFFFFF',
  brume: '#D5DBDF',
  marine: '#14304A',
  encre: '#1E2933',
  terracotta: '#C0623F',
  ambre: '#D7A24A',
  sauge: '#6F9080',
} as const;

/** Couleur associée à chaque niveau d'urgence. */
export const COULEUR_URGENCE = {
  en_retard: COULEURS.marine,
  urgent: COULEURS.terracotta,
  a_surveiller: COULEURS.ambre,
  a_venir: COULEURS.brume,
} as const;

/** Libellés d'affichage des statuts (séparateurs sans tiret cadratin). */
export const LIBELLE_STATUT: Record<string, string> = {
  a_venir: 'À venir',
  a_realiser: 'À réaliser',
  en_cours: 'En cours',
  realise: 'Réalisée',
  resultats_saisis: 'Résultats saisis',
  cloture: 'Clôturée',
};

/** Libellés d'affichage des niveaux d'urgence. */
export const LIBELLE_URGENCE: Record<string, string> = {
  en_retard: 'En retard',
  urgent: 'Urgent, J-7',
  a_surveiller: 'À surveiller',
  a_venir: 'À venir',
};
