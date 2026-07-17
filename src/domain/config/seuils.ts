// ============================================================================
//  Seuils d'alerte (cf. PRD §6.1). Constantes de configuration MODIFIABLES.
//  [À COMPLÉTER : confirmer 7 j ferme et le palier ambre à 15 j.]
// ============================================================================

/** Fenêtre « urgent » (alerte J-7) : joursRestants dans [0, SEUIL_URGENT]. */
export const SEUIL_URGENT = 7;

/** Fenêtre « à surveiller » : joursRestants dans [SEUIL_URGENT+1, SEUIL_SURVEILLANCE]. */
export const SEUIL_SURVEILLANCE = 15;

// --- Mur d'affichage : 4 niveaux d'alerte (aujourd'hui / 3 j / 7 j / à jour) ---
/** Palier « sous 3 jours » : joursRestants dans [1, SEUIL_ALERTE_3J]. */
export const SEUIL_ALERTE_3J = 3;
/** Palier « sous 7 jours » : joursRestants dans [SEUIL_ALERTE_3J+1, SEUIL_ALERTE_7J]. */
export const SEUIL_ALERTE_7J = 7;

/** Fenêtre de la frise chronologique (jours glissants). */
export const FENETRE_FRISE_JOURS = 90;

/** Intervalle de recalcul du mur d'affichage (ms) : 24 h. */
export const INTERVALLE_RECALCUL_MS = 24 * 60 * 60 * 1000;
