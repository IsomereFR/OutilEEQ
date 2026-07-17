import type { ReactNode } from 'react';

type Ton = 'marine' | 'terracotta' | 'ambre' | 'neutre' | 'sauge';

const ACCENT: Record<Ton, string> = {
  marine: '#14304A',
  terracotta: '#C0623F',
  ambre: '#D7A24A',
  neutre: '#D5DBDF',
  sauge: '#6F9080',
};

/** Carte indicateur : valeur mise en avant + liseré coloré + libellé. */
export function Kpi({
  ton,
  valeur,
  libelle,
  onClick,
}: {
  ton: Ton;
  valeur: ReactNode;
  libelle: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative overflow-hidden text-left bg-surface border border-brume rounded-xl2 shadow-carte px-4 py-3 disabled:cursor-default"
      disabled={!onClick}
    >
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: ACCENT[ton] }} />
      <div className="font-title font-extrabold text-3xl text-marine tabular-nums leading-none">
        {valeur}
      </div>
      <div className="mt-1 text-xs text-encre/70">{libelle}</div>
    </button>
  );
}
