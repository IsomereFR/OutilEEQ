/** Génère un identifiant court unique (suffisant pour un store local mono-poste). */
export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}
