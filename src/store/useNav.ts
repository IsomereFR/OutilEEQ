// Navigation minimale : le dashboard est la seule page d'usage courant ;
// la réconciliation/import est un module ouvert ponctuellement (cf. PRD F3/F4).
import { create } from 'zustand';

export type Vue = 'dashboard' | 'reconcile';

interface NavState {
  vue: Vue;
  aller: (vue: Vue) => void;
}

export const useNav = create<NavState>((set) => ({
  vue: 'dashboard',
  aller: (vue) => set({ vue }),
}));
