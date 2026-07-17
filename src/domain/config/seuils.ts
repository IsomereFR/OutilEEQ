// ============================================================================
//  Seuils d'alerte (cf. PRD §6.1). Constantes de configuration MODIFIABLES.
//  [À COMPLÉTER : confirmer 7 j ferme et le palier ambre à 15 j.]
// ============================================================================

/** Fenêtre « urgent » (alerte J-7) : joursRestants dans [0, SEUIL_URGENT]. */
export const SEUIL_URGENT = 7;

/** Fenêtre « à surveiller » : joursRestants dans [SEUIL_URGENT+1, SEUIL_SURVEILLANCE]. */
export const SEUIL_SURVEILLANCE = 15;

/** Fenêtre de la frise chronologique (jours glissants). */
export const FENETRE_FRISE_JOURS = 90;

/** Intervalle de recalcul des alertes (ms) : 60 min. */
export const INTERVALLE_RECALCUL_MS = 60 * 60 * 1000;
