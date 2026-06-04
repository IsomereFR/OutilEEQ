// ============================================================================
//  Règles de calcul EEQ — centralisées et testées (cf. logic/__tests__).
//  Référence : ISO 15189:2022 §7.3.7.
// ============================================================================
import type { Analyte } from '../types/models';

/** Évaluation d'un analyte selon |z|. */
export type AnalyteEval = 'conforme' | 'alerte' | 'hors-limites';

/**
 * Écart en pourcentage par rapport à la cible.
 *   ecartPct = (valeur - cible) / cible * 100
 * Renvoie null si données manquantes ou cible = 0.
 */
export function ecartPct(an: Analyte): number | null {
  const v = parseFloat(an.valeur);
  const c = parseFloat(an.cible);
  if (Number.isNaN(v) || Number.isNaN(c) || c === 0) return null;
  return ((v - c) / c) * 100;
}

/**
 * Z-score.
 *   zscore = (valeur - cible) / sd
 * Renvoie null si données manquantes ou sd = 0.
 */
export function zscore(an: Analyte): number | null {
  const v = parseFloat(an.valeur);
  const c = parseFloat(an.cible);
  const sd = parseFloat(an.sd);
  if (Number.isNaN(v) || Number.isNaN(c) || Number.isNaN(sd) || sd === 0) return null;
  return (v - c) / sd;
}

/**
 * Classement d'un analyte d'après |z| :
 *  - conforme      si |z| < 2
 *  - alerte        si 2 ≤ |z| < 3
 *  - hors-limites  si |z| ≥ 3
 * Renvoie null si le z-score n'est pas calculable.
 */
export function analyteEval(an: Analyte): AnalyteEval | null {
  const z = zscore(an);
  if (z === null) return null;
  const az = Math.abs(z);
  if (az < 2) return 'conforme';
  if (az < 3) return 'alerte';
  return 'hors-limites';
}

/** Vrai/faux/null : l'analyte est-il dans les limites (|z| < 2) ? */
export function analyteOk(an: Analyte): boolean | null {
  const z = zscore(an);
  return z === null ? null : Math.abs(z) < 2;
}

/** Synthèse d'une liste d'analytes : nombre dans les limites / total évaluable. */
export interface SyntheseAnalytes {
  evaluables: number;
  dansLimites: number;
  horsLimites: number;
}
export function syntheseAnalytes(analytes: Analyte[]): SyntheseAnalytes {
  const evals = analytes.map(analyteOk).filter((x): x is boolean => x !== null);
  const dansLimites = evals.filter((x) => x).length;
  return {
    evaluables: evals.length,
    dansLimites,
    horsLimites: evals.length - dansLimites,
  };
}

/**
 * Position (0..100 %) du marqueur z sur un axe −3 / +3, bornée.
 * Renvoie null si z non calculable.
 */
export function zbarPosition(an: Analyte): number | null {
  const z = zscore(an);
  if (z === null) return null;
  return Math.max(0, Math.min(100, ((z + 3) / 6) * 100));
}
