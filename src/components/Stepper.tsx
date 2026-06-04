import { STEPS } from '../logic/ficheStatus';

/** Frise des 6 étapes du workflow d'une fiche. `current` = nb d'étapes franchies. */
export function Stepper({ current }: { current: number }) {
  return (
    <div className="stepper">
      {STEPS.map((lbl, i) => {
        const cls = i < current ? 'done' : i === current ? 'current' : '';
        return (
          <div key={lbl} className={`step ${cls}`}>
            <span className="n">{i < current ? '✓' : i + 1}</span>
            <span className="lbl">{lbl}</span>
          </div>
        );
      })}
    </div>
  );
}
