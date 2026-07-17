// Navigation minimale : le mur d'affichage (dashboard) est la page publique ;
// l'espace administrateur (import, affectation, sauvegarde) est séparé et n'est
// pas visible depuis le mur (cf. PRD : outil de pilotage mono-poste).
import { create } from 'zustand';

export type Vue = 'dashboard' | 'admin';

interface NavState {
  vue: Vue;
  aller: (vue: Vue) => void;
}

export const useNav = create<NavState>((set) => ({
  vue: 'dashboard',
  aller: (vue) => set({ vue }),
}));
