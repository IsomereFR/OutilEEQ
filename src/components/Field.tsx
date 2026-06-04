import type { ReactNode } from 'react';

/** Conteneur libellé + contrôle de formulaire (gère les classes span2/span3). */
export function Field({
  label,
  span,
  children,
}: {
  label: string;
  span?: 2 | 3;
  children: ReactNode;
}) {
  return (
    <div className={`field${span ? ` span${span}` : ''}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

/** Bloc-section pliable visuellement (numéro + titre + contenu). */
export function Section({
  ix,
  title,
  req,
  children,
}: {
  ix: ReactNode;
  title: string;
  req?: string;
  children: ReactNode;
}) {
  return (
    <div className="section">
      <div className="head">
        <span className="ix">{ix}</span>
        <h4>{title}</h4>
        {req && <span className="req">{req}</span>}
      </div>
      <div className="body">{children}</div>
    </div>
  );
}
