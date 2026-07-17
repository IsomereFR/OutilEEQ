// ============================================================================
//  Bandeau bas d'écran : réapprovisionnement du planning.
//  Alerte, 30 j à l'avance, quand un ou plusieurs automates arrivent au bout de
//  leurs enquêtes planifiées (plannings fournisseurs annuels). Invite à importer
//  un nouveau planning depuis le portail. Lecture seule, aucune interaction.
// ============================================================================
import type { EtatReappro } from '../../domain/reapprovisionnement';
import { fmtDate } from '../../domain/dates';
import { COULEURS } from '../../theme/tokens';

/** hex #RRGGBB -> rgba avec alpha. */
function tint(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** Formule courte de l'échéance d'un automate. */
function echeance(it: EtatReappro): string {
  if (it.epuise) return `planning épuisé depuis le ${fmtDate(it.dateHorizon)}`;
  if (it.joursRestants === 0) return `dernière enquête aujourd'hui (${fmtDate(it.dateHorizon)})`;
  return `dernière enquête le ${fmtDate(it.dateHorizon)} · J-${it.joursRestants}`;
}

export function BandeauReappro({ items }: { items: EtatReappro[] }) {
  if (items.length === 0) return null;

  // Rouge brique si au moins un automate est déjà épuisé, sinon ambre (à surveiller).
  const urgent = items.some((i) => i.epuise);
  const accent = urgent ? COULEURS.terracotta : COULEURS.ambre;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-sm"
      style={{ borderColor: accent, background: tint(accent, 0.12) }}
      role="alert"
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-start gap-3">
        <span
          className="shrink-0 mt-0.5 grid place-items-center h-7 w-7 rounded-full text-white"
          style={{ backgroundColor: accent }}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
        </span>
        <div className="min-w-0">
          <div className="font-title font-bold text-sm" style={{ color: urgent ? COULEURS.terracotta : COULEURS.marine }}>
            Réapprovisionnement du planning ·{' '}
            {items.length === 1 ? '1 automate arrive' : `${items.length} automates arrivent`} au bout de leurs enquêtes
          </div>
          <div className="text-[13px] text-encre/70 leading-snug">
            Importez un nouveau planning depuis le portail fournisseur pour :{' '}
            {items.map((it, i) => (
              <span key={it.automateId}>
                {i > 0 && ' · '}
                <span className="font-semibold text-marine">{it.nomAutomate}</span>{' '}
                <span className="text-encre/55">({echeance(it)})</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
