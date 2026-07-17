// ============================================================================
//  « À réaliser par automate » — organisation des EEG à passer PAR AUTOMATE
//  (et non par fournisseur), regroupées par discipline. Un même envoi affecté
//  à plusieurs automates apparaît sous chacun d'eux. Cliquer une tuile filtre
//  la liste priorisée sur l'automate.
// ============================================================================
import { useMemo } from 'react';
import type { Enquete } from '../../domain/types';
import { useStore } from '../../store/useStore';
import { avantRealise, niveauUrgence, RANG_URGENCE, type NiveauUrgence } from '../../domain/urgence';
import { COULEUR_URGENCE, LIBELLE_URGENCE } from '../../theme/tokens';
import { Carte, CarteTitre } from '../../ui/Carte';

// Ordre d'affichage des disciplines (parc BIOXA).
const ORDRE_DISCIPLINES = [
  'Biochimie',
  'Immunologie',
  'Immuno-enzymologie',
  'Hémostase',
  'Hématologie',
  'Immunohématologie',
  'HbA1C',
  'Électrophorèse des protéines',
];

export function ParAutomate({
  enquetes,
  automateActif,
  onChoisirAutomate,
}: {
  enquetes: Enquete[];
  automateActif?: string;
  onChoisirAutomate: (automateId: string) => void;
}) {
  const automates = useStore((s) => s.automates);

  // enquêtes « à réaliser » = affectées et pas encore réalisées.
  const parAutomate = useMemo(() => {
    const map = new Map<string, Enquete[]>();
    for (const e of enquetes) {
      if (!e.affectee || !avantRealise(e.statut)) continue;
      for (const aid of e.automateIds) {
        const liste = map.get(aid);
        if (liste) liste.push(e);
        else map.set(aid, [e]);
      }
    }
    return map;
  }, [enquetes]);

  const totalARealiser = useMemo(
    () => enquetes.filter((e) => e.affectee && avantRealise(e.statut)).length,
    [enquetes],
  );

  // Liste plate { discipline, automate } ordonnée par discipline (un automate
  // multi-discipline apparaît une fois par discipline couverte).
  const entrees = useMemo(() => {
    const ordre = (d: string) => {
      const i = ORDRE_DISCIPLINES.indexOf(d);
      return i === -1 ? 999 : i;
    };
    const out: { discipline: string; automate: (typeof automates)[number] }[] = [];
    for (const a of automates) {
      if (!a.actif) continue;
      for (const d of a.disciplines) out.push({ discipline: d, automate: a });
    }
    return out.sort((x, y) => ordre(x.discipline) - ordre(y.discipline) || x.automate.nom.localeCompare(y.automate.nom));
  }, [automates]);

  return (
    <Carte>
      <CarteTitre extra={`${totalARealiser} à réaliser`}>À réaliser par automate</CarteTitre>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {entrees.map(({ discipline, automate: a }) => {
          const liste = parAutomate.get(a.id) ?? [];
          const pire: NiveauUrgence | null = liste.length
            ? liste.map((e) => niveauUrgence(e)).reduce((p, n) => (RANG_URGENCE[n] < RANG_URGENCE[p] ? n : p))
            : null;
          const couleur = pire ? COULEUR_URGENCE[pire] : '#D5DBDF';
          const actif = automateActif === a.id;
          return (
            <button
              key={`${discipline}:${a.id}`}
              type="button"
              onClick={() => onChoisirAutomate(a.id)}
              className={
                'relative overflow-hidden text-left rounded-xl2 border p-3 transition ' +
                (actif ? 'border-marine ring-1 ring-marine/40 ' : 'border-brume ') +
                (liste.length ? 'hover:-translate-y-0.5 hover:shadow-carte' : 'hover:border-marine/30')
              }
              style={{ background: liste.length ? '#FFFFFF' : 'rgba(213,219,223,.18)' }}
              aria-label={`${a.nom} · ${discipline} · ${liste.length} à réaliser`}
            >
              <span className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: couleur }} />
              <div className="surtitre text-[9px] truncate">{discipline}</div>
              <div className="flex items-baseline justify-between gap-2 mt-0.5">
                <span className="font-title font-bold text-sm text-marine truncate">{a.nom}</span>
                <span className="font-title font-extrabold text-xl text-marine tabular-nums">
                  {liste.length || ''}
                </span>
              </div>
              <div className="mt-1 text-[11px] leading-tight">
                {pire ? (
                  <span style={{ color: couleur }} className="font-medium">
                    {LIBELLE_URGENCE[pire]}
                  </span>
                ) : (
                  <span className="text-encre/40">À jour</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Carte>
  );
}
