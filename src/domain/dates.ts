// Helpers de dates purs (aucune dépendance UI). ISO "AAAA-MM-JJ".

/** Date du jour à minuit (comparaisons d'échéances stables). */
export function aujourdhui(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Parse une date ISO en Date à minuit, ou null si vide/invalide. */
export function parseISO(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Jours restants jusqu'à `iso` (négatif = passé). null si date absente.
 * @param ref date de référence (défaut : aujourd'hui) — injectable pour les tests.
 */
export function joursRestants(iso: string, ref: Date = aujourdhui()): number | null {
  const d = parseISO(iso);
  if (!d) return null;
  return Math.round((d.getTime() - ref.getTime()) / 86_400_000);
}

/** Formate une date ISO en "JJ/MM/AAAA" (séparateur "/", cf. DA sans tiret cadratin). */
export function fmtDate(iso: string | null | undefined): string {
  const d = parseISO(iso);
  if (!d) return '·';
  const p = iso!.split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso!;
}

/** ISO du jour + n jours (utilitaire seed/tests). */
export function isoDecale(n: number, ref: Date = aujourdhui()): string {
  const d = new Date(ref);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
