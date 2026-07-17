// ============================================================================
//  Hook d'actualisation des alertes du dashboard.
//  Les niveaux d'urgence dérivent de la date du jour : sans interaction, un
//  compteur « J-7 » deviendrait « en retard » sans que l'écran ne bouge. Ce
//  hook force un re-render à l'ouverture puis toutes les INTERVALLE_RECALCUL_MS.
// ============================================================================
import { useEffect, useState } from 'react';
import { INTERVALLE_RECALCUL_MS } from '../../domain/config/seuils';

/** Recalcul périodique (re-render) des statuts d'urgence. Ne renvoie rien. */
export function useAlertes(): void {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), INTERVALLE_RECALCUL_MS);
    return () => clearInterval(id);
  }, []);
}
