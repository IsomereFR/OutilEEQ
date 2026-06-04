import type { Analyte } from '../types/models';
import { zscore, zbarPosition } from '../logic/calculations';

/** Barre de position du z-score sur un axe −3 / +3 (zone verte centrale |z|<1). */
export function ZBar({ analyte }: { analyte: Analyte }) {
  const z = zscore(analyte);
  const pos = zbarPosition(analyte);
  if (z === null || pos === null) return <>—</>;
  const az = Math.abs(z);
  const col = az < 2 ? 'var(--ok)' : az < 3 ? 'var(--warn)' : 'var(--bad)';
  return (
    <div className="zbar">
      <div className="zone" style={{ left: '33.3%', right: '33.3%' }} />
      <div className="mid" />
      <div className="mk" style={{ left: `${pos}%`, background: col }} />
    </div>
  );
}
