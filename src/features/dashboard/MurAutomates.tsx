// ============================================================================
//  Mur d'affichage « À réaliser par automate » (LECTURE SEULE).
//  Pour chaque automate : l'ENQUÊTE PRÉCISE à réaliser est inscrite, avec sa
//  date et son niveau d'alerte (aujourd'hui / 3 j / 7 j / à jour). Les échéances
//  dépassées ne sont pas affichées. Aucune interaction (aucun clic, aucune
//  modification) : l'intégration et l'affectation vivent dans l'espace admin.
// ============================================================================
import { useMemo } from 'react';
import type { Enquete } from '../../domain/types';
import { useStore } from '../../store/useStore';
import { niveauAlerte, pireAlerte, estAffichable, type NiveauAlerte } from '../../domain/alerte';
import { joursRestants, fmtDate } from '../../domain/dates';
import { COULEUR_ALERTE, LIBELLE_ALERTE } from '../../theme/tokens';
import { Carte, CarteTitre } from '../../ui/Carte';

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

/** Libellé temporel court d'une enquête (« Aujourd'hui » ou « J-n »). */
function libelleEcheance(e: Enquete): string {
  const jr = joursRestants(e.dateEcheanceRealisation);
  if (jr === null) return '';
  return jr === 0 ? "Aujourd'hui" : `J-${jr}`;
}

export function MurAutomates({ enquetes }: { enquetes: Enquete[] }) {
  const automates = useStore((s) => s.automates);
  const programmes = useStore((s) => s.programmes);

  const libelleProgramme = useMemo(
    () => new Map(programmes.map((p) => [p.id, p.libelle])),
    [programmes],
  );

  // Enquêtes affichables par automate (affectées, à réaliser, non dépassées).
  const parAutomate = useMemo(() => {
    const map = new Map<string, Enquete[]>();
    for (const e of enquetes) {
      if (!estAffichable(e)) continue;
      for (const aid of e.automateIds) {
        const liste = map.get(aid);
        if (liste) liste.push(e);
        else map.set(aid, [e]);
      }
    }
    // Tri par échéance croissante.
    for (const liste of map.values()) {
      liste.sort((a, b) => a.dateEcheanceRealisation.localeCompare(b.dateEcheanceRealisation));
    }
    return map;
  }, [enquetes]);

  // Automates actifs ordonnés par discipline.
  const ordre = (a: (typeof automates)[number]) => {
    const i = ORDRE_DISCIPLINES.indexOf(a.disciplines[0] ?? '');
    return i === -1 ? 999 : i;
  };
  const liste = useMemo(
    () => automates.filter((a) => a.actif).slice().sort((x, y) => ordre(x) - ordre(y) || x.nom.localeCompare(y.nom)),
    [automates],
  );

  return (
    <Carte>
      <CarteTitre>À réaliser par automate</CarteTitre>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {liste.map((a) => {
          const items = parAutomate.get(a.id) ?? [];
          const pire: NiveauAlerte = pireAlerte(items) ?? 'a_jour';
          const couleur = COULEUR_ALERTE[pire];
          const vide = items.length === 0;
          return (
            <div
              key={a.id}
              className="relative overflow-hidden rounded-xl2 border border-brume bg-surface shadow-carte"
              style={{ background: vide ? 'rgba(111,144,128,.05)' : '#FFFFFF' }}
            >
              <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: couleur }} />
              <div className="pl-4 pr-3 py-3">
                <div className="surtitre text-[9px] truncate">{a.disciplines.join(' · ')}</div>
                <div className="font-title font-extrabold text-marine text-base leading-tight">{a.nom}</div>

                {vide ? (
                  <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: COULEUR_ALERTE.a_jour }}>
                    <span className="grid place-items-center h-5 w-5 rounded-full text-white text-xs" style={{ backgroundColor: COULEUR_ALERTE.a_jour }}>
                      ✓
                    </span>
                    <span className="font-medium">À jour</span>
                  </div>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {items.map((e) => {
                      const niv = niveauAlerte(e) as NiveauAlerte;
                      const c = COULEUR_ALERTE[niv];
                      return (
                        <li key={e.id} className="flex items-start gap-2">
                          <span className="mt-0.5 h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: c }} aria-hidden />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-encre leading-snug">
                              {libelleProgramme.get(e.programmeId) ?? e.programmeId}
                              <span className="text-encre/50"> · {e.envoiRef}</span>
                            </div>
                            <div className="text-[11px] mt-0.5 flex items-center gap-1.5">
                              <span className="font-medium" style={{ color: c }}>
                                {niv === 'aujourdhui' ? LIBELLE_ALERTE.aujourdhui : libelleEcheance(e)}
                              </span>
                              <span className="text-encre/45 tabular-nums">· {fmtDate(e.dateEcheanceRealisation)}</span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Carte>
  );
}
