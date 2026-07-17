// Pastilles pleines sobres (jamais de smiley). Statuts et niveaux d'urgence.
import type { Statut } from '../domain/types';
import type { NiveauUrgence } from '../domain/urgence';
import { COULEURS, COULEUR_URGENCE, LIBELLE_STATUT, LIBELLE_URGENCE } from '../theme/tokens';

function Pill({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: bg, color: fg }}
    >
      {children}
    </span>
  );
}

/** Pastille de niveau d'urgence (couleurs DA). */
export function PastilleUrgence({ niveau }: { niveau: NiveauUrgence }) {
  const bg = COULEUR_URGENCE[niveau];
  // Texte foncé sur ambre/brume (clairs), clair sinon.
  const fg = niveau === 'a_surveiller' || niveau === 'a_venir' ? COULEURS.encre : '#FFFFFF';
  return <Pill bg={bg} fg={fg}>{LIBELLE_URGENCE[niveau]}</Pill>;
}

// Couleurs sobres par statut (aplats discrets, cf. DA).
const STATUT_STYLE: Record<Statut, { bg: string; fg: string }> = {
  a_venir: { bg: '#E7ECF0', fg: COULEURS.marine },
  a_realiser: { bg: COULEURS.marine, fg: '#FFFFFF' },
  en_cours: { bg: '#E2EBE7', fg: '#3B5B4F' },
  realise: { bg: COULEURS.sauge, fg: '#FFFFFF' },
  resultats_saisis: { bg: '#DCE6EC', fg: COULEURS.marine },
  cloture: { bg: '#E4E2DC', fg: COULEURS.encre },
};

/** Pastille de statut d'enquête. */
export function PastilleStatut({ statut }: { statut: Statut }) {
  const s = STATUT_STYLE[statut];
  return <Pill bg={s.bg} fg={s.fg}>{LIBELLE_STATUT[statut]}</Pill>;
}
