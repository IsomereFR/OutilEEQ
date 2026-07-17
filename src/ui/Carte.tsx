import type { ReactNode } from 'react';

/** Carte de contenu (blanc, filet gris brume, ombre douce). */
export function Carte({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-surface border border-brume rounded-xl2 shadow-carte ${className}`}>
      {children}
    </section>
  );
}

/** En-tête de carte (titre + éventuel complément à droite). */
export function CarteTitre({ children, extra }: { children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-brume">
      <h3 className="text-sm font-title font-bold">{children}</h3>
      {extra && <div className="ml-auto text-xs text-encre/60">{extra}</div>}
    </div>
  );
}
