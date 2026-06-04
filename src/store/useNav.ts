// Navigation locale (sans routeur) — vue courante + identifiant.
import { create } from 'zustand';

export type ViewName = 'dashboard' | 'planning' | 'enquete' | 'automate' | 'fiche';

interface NavState {
  name: ViewName;
  id: string | null;
  go(name: ViewName, id?: string | null): void;
}

export const useNav = create<NavState>((set) => ({
  name: 'dashboard',
  id: null,
  go: (name, id = null) => set({ name, id }),
}));
