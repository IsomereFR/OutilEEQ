// Helpers de formatage — locale fr-FR.

/** Formate une date ISO "AAAA-MM-JJ" en "JJ/MM/AAAA". Renvoie "—" si vide. */
export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const p = d.split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
}

/** Libellé de mois capitalisé en français ("Juin 2026"). */
export function monthLabel(d: string | null | undefined): string {
  if (!d) return 'Sans date prévue';
  const dt = new Date(d);
  const s = dt.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
