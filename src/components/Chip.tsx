import type { StatusChip } from '../types/models';

/** Chip de statut coloré (pastille + libellé). */
export function Chip({ status, style }: { status: StatusChip; style?: React.CSSProperties }) {
  return (
    <span className={`chip ${status.cls}`} style={style}>
      <span className="d" />
      {status.txt}
    </span>
  );
}
