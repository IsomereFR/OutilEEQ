import type { ReactNode } from 'react';

type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral';

/** Carte KPI avec liseré coloré. */
export function Kpi({
  tone,
  label,
  value,
  hint,
}: {
  tone: Tone;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className={`kpi ${tone}`}>
      <div className="lab">{label}</div>
      <div className="val">{value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}
