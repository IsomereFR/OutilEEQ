// ============================================================================
//  Hook d'actualisation du mur d'affichage.
//  Les niveaux d'alerte dérivent de la date du jour : sans interaction, l'écran
//  doit se recalculer seul. Ce hook force un re-render toutes les 24 h (cf.
//  INTERVALLE_RECALCUL_MS) ET au retour de focus / de visibilité de l'onglet
//  (utile pour un poste d'affichage laissé ouvert plusieurs jours).
// ============================================================================
import { useEffect, useState } from 'react';
import { INTERVALLE_RECALCUL_MS } from '../../domain/config/seuils';

/** Recalcul périodique (re-render) des niveaux d'alerte. Ne renvoie rien. */
export function useAlertes(): void {
  const [, setTick] = useState(0);

  useEffect(() => {
    const rafraichir = () => setTick((t) => t + 1);
    const id = setInterval(rafraichir, INTERVALLE_RECALCUL_MS);
    const surVisibilite = () => {
      if (document.visibilityState === 'visible') rafraichir();
    };
    window.addEventListener('focus', rafraichir);
    document.addEventListener('visibilitychange', surVisibilite);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', rafraichir);
      document.removeEventListener('visibilitychange', surVisibilite);
    };
  }, []);
}
