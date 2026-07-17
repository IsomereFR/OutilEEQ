// ============================================================================
//  Cartes indicateurs (KPI) du dashboard (cf. PRD F4).
//  Chaque tuile : icône en trait dans un carré teinté, grand nombre (Manrope,
//  en encre = jeton de texte), liseré de statut, et légère teinte sur les
//  tuiles d'alerte (retard, urgent) pour attirer l'œil. indicateurs() gère
//  l'inbox : on lui passe TOUTES les enquêtes.
// ============================================================================
import type { ReactNode } from 'react';
import type { Enquete } from '../../domain/types';
import { indicateurs } from '../../domain/vues';
import { IconHorloge, IconAlerte, IconVeille, IconInbox, IconCheck } from '../../ui/icones';

interface Ton {
  accent: string;
  iconBg: string;
  iconFg: string;
  teinte?: string; // fond très léger pour signaler l'alerte
}

const TONS: Record<string, Ton> = {
  urgent: { accent: '#C0623F', iconBg: 'rgba(192,98,63,.12)', iconFg: '#C0623F', teinte: 'rgba(192,98,63,.05)' },
  retard: { accent: '#14304A', iconBg: 'rgba(20,48,74,.10)', iconFg: '#14304A', teinte: 'rgba(20,48,74,.045)' },
  ambre: { accent: '#D7A24A', iconBg: 'rgba(215,162,74,.16)', iconFg: '#9A6F1F' },
  neutre: { accent: '#D5DBDF', iconBg: 'rgba(30,41,51,.06)', iconFg: 'rgba(30,41,51,.55)' },
  sauge: { accent: '#6F9080', iconBg: 'rgba(111,144,128,.16)', iconFg: '#4F6B5E' },
};

function Tuile({
  ton,
  valeur,
  libelle,
  icone,
  onClick,
}: {
  ton: keyof typeof TONS;
  valeur: number;
  libelle: string;
  icone: ReactNode;
  onClick?: () => void;
}) {
  const t = TONS[ton];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{ background: t.teinte ?? '#FFFFFF' }}
      className={
        'group relative overflow-hidden text-left rounded-xl2 border border-brume shadow-carte p-4 transition ' +
        (onClick ? 'hover:-translate-y-0.5 hover:shadow-lg cursor-pointer' : 'cursor-default')
      }
    >
      <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: t.accent }} />
      <div className="flex items-start justify-between gap-2 pt-1">
        <span
          className="grid place-items-center h-10 w-10 rounded-lg"
          style={{ backgroundColor: t.iconBg, color: t.iconFg }}
        >
          <span className="h-5 w-5">{icone}</span>
        </span>
      </div>
      <div className="mt-3 font-title font-extrabold text-4xl text-marine tabular-nums leading-none">
        {valeur}
      </div>
      <div className="mt-1.5 text-xs text-encre/65 leading-tight">{libelle}</div>
    </button>
  );
}

export function CartesIndicateurs({
  enquetes,
  onVoirInbox,
}: {
  enquetes: Enquete[];
  onVoirInbox: () => void;
}) {
  const i = indicateurs(enquetes);
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Tuile ton="urgent" valeur={i.sous7j} libelle="À réaliser sous 7 jours" icone={<IconHorloge className="h-5 w-5" />} />
      <Tuile ton="retard" valeur={i.enRetard} libelle="En retard" icone={<IconAlerte className="h-5 w-5" />} />
      <Tuile ton="ambre" valeur={i.aSurveiller} libelle="À surveiller, 8 à 15 jours" icone={<IconVeille className="h-5 w-5" />} />
      <Tuile ton="neutre" valeur={i.nonAffectees} libelle="Non affectées" icone={<IconInbox className="h-5 w-5" />} onClick={onVoirInbox} />
      <Tuile ton="sauge" valeur={i.realiseesCeMois} libelle="Réalisées ce mois" icone={<IconCheck className="h-5 w-5" />} />
    </div>
  );
}
