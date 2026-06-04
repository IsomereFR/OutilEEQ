import type { ReactNode } from 'react';

/** Barre supérieure : fil d'ariane + titre + actions contextuelles. */
export function Topbar({
  crumb,
  title,
  actions,
}: {
  crumb: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="topbar">
      <div>
        <div className="crumb">{crumb}</div>
        <h2>{title}</h2>
      </div>
      <div className="grow" />
      <div id="topActions">{actions}</div>
    </div>
  );
}
