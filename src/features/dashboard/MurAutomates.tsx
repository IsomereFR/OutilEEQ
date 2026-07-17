// ============================================================================
//  Mur d'affichage « À réaliser par automate » (LECTURE SEULE).
//  Affichage à deux niveaux pour la lisibilité :
//   1. Grandes cartes pour les automates ayant une EEQ DANS LES 7 JOURS
//      (triées par urgence), avec l'enquête précise et un badge J-n visible.
//   2. Bande compacte pour les automates « à venir » (> 7 j) ou « à jour ».
//  Les échéances dépassées ne sont jamais affichées. Aucune interaction.
// ============================================================================
import { useMemo } from 'react';
import type { Automate, Enquete } from '../../domain/types';
import { useStore } from '../../store/useStore';
import { niveauAlerte, pireAlerte, estAffichable, RANG_ALERTE, type NiveauAlerte } from '../../domain/alerte';
import { joursRestants, fmtDate } from '../../domain/dates';
import { COULEUR_ALERTE, LIBELLE_ALERTE } from '../../theme/tokens';

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

/** « Aujourd'hui » ou « J-n » pour une enquête. */
function libelleJours(e: Enquete): string {
  const jr = joursRestants(e.dateEcheanceRealisation);
  if (jr === null) return '';
  return jr === 0 ? "Aujourd'hui" : `J-${jr}`;
}

interface AutoVue {
  automate: Automate;
  items: Enquete[]; // affichables, triées par échéance
  pire: NiveauAlerte | null;
}

export function MurAutomates({ enquetes }: { enquetes: Enquete[] }) {
  const automates = useStore((s) => s.automates);
  const programmes = useStore((s) => s.programmes);
  const libelleProgramme = useMemo(() => new Map(programmes.map((p) => [p.id, p.libelle])), [programmes]);

  const { urgents, calmes } = useMemo(() => {
    const parAutomate = new Map<string, Enquete[]>();
    for (const e of enquetes) {
      if (!estAffichable(e)) continue;
      for (const aid of e.automateIds) {
        const l = parAutomate.get(aid);
        if (l) l.push(e);
        else parAutomate.set(aid, [e]);
      }
    }
    for (const l of parAutomate.values()) {
      l.sort((a, b) => a.dateEcheanceRealisation.localeCompare(b.dateEcheanceRealisation));
    }
    const ordreDisc = (a: Automate) => {
      const i = ORDRE_DISCIPLINES.indexOf(a.disciplines[0] ?? '');
      return i === -1 ? 999 : i;
    };
    const vues: AutoVue[] = automates
      .filter((a) => a.actif)
      .map((automate) => {
        const items = parAutomate.get(automate.id) ?? [];
        return { automate, items, pire: pireAlerte(items) };
      });

    // Actionnable = a une EEQ dans les 7 jours (aujourd'hui / 3 j / 7 j).
    const urgents = vues
      .filter((v) => v.pire !== null && RANG_ALERTE[v.pire] <= RANG_ALERTE.j7)
      .sort((x, y) => RANG_ALERTE[x.pire!] - RANG_ALERTE[y.pire!] ||
        x.items[0].dateEcheanceRealisation.localeCompare(y.items[0].dateEcheanceRealisation));
    const calmes = vues
      .filter((v) => !(v.pire !== null && RANG_ALERTE[v.pire] <= RANG_ALERTE.j7))
      .sort((x, y) => ordreDisc(x.automate) - ordreDisc(y.automate));
    return { urgents, calmes };
  }, [enquetes, automates]);

  return (
    <div className="space-y-5">
      {/* 1 · Cartes des automates à traiter cette semaine */}
      {urgents.length > 0 ? (
        <div>
          <div className="surtitre mb-2">À réaliser cette semaine</div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {urgents.map((v) => (
              <CarteAuto key={v.automate.id} vue={v} libelleProgramme={libelleProgramme} />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl2 px-4 py-4 text-sm font-medium flex items-center gap-2.5"
          style={{ background: `${COULEUR_ALERTE.a_jour}14`, color: COULEUR_ALERTE.a_jour }}
        >
          <span className="grid place-items-center h-6 w-6 rounded-full text-white" style={{ backgroundColor: COULEUR_ALERTE.a_jour }}>
            ✓
          </span>
          Aucune EEQ à réaliser dans les 7 jours.
        </div>
      )}

      {/* 2 · Bande compacte : automates à venir (> 7 j) ou à jour */}
      {calmes.length > 0 && (
        <div>
          <div className="surtitre mb-2">À venir et à jour</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {calmes.map(({ automate: a, items }) => {
              const suivant = items[0];
              return (
                <div key={a.id} className="rounded-lg border border-brume bg-surface/70 px-3 py-2">
                  <div className="surtitre text-[9px] truncate">{a.disciplines.join(' · ')}</div>
                  <div className="font-title font-bold text-marine text-sm truncate">{a.nom}</div>
                  {suivant ? (
                    <div className="text-[11px] text-encre/55 mt-0.5 truncate">
                      Prochaine · {fmtDate(suivant.dateEcheanceRealisation)} · {libelleJours(suivant)}
                    </div>
                  ) : (
                    <div className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: COULEUR_ALERTE.a_jour }}>
                      <span className="grid place-items-center h-3.5 w-3.5 rounded-full text-white text-[8px]" style={{ backgroundColor: COULEUR_ALERTE.a_jour }}>
                        ✓
                      </span>
                      À jour
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Grande carte d'un automate à traiter cette semaine. */
function CarteAuto({
  vue,
  libelleProgramme,
}: {
  vue: AutoVue;
  libelleProgramme: Map<string, string>;
}) {
  const { automate: a, items } = vue;
  const couleurPire = COULEUR_ALERTE[vue.pire ?? 'a_jour'];
  return (
    <div className="relative overflow-hidden rounded-xl2 border border-brume bg-surface shadow-carte">
      <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: couleurPire }} />
      <div className="pl-4 pr-3 py-3">
        <div className="surtitre text-[10px] truncate">{a.disciplines.join(' · ')}</div>
        <div className="font-title font-extrabold text-marine text-lg leading-tight">{a.nom}</div>
        <ul className="mt-2.5 space-y-2">
          {items.map((e) => {
            const niv = niveauAlerte(e) as NiveauAlerte;
            const c = COULEUR_ALERTE[niv];
            return (
              <li key={e.id} className="flex items-center gap-3">
                <span
                  className="shrink-0 inline-flex items-center justify-center rounded-md px-2 py-1 text-white font-title font-bold text-xs tabular-nums min-w-[52px]"
                  style={{ backgroundColor: c }}
                >
                  {niv === 'aujourdhui' ? LIBELLE_ALERTE.aujourdhui : libelleJours(e)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-encre leading-snug truncate">
                    {libelleProgramme.get(e.programmeId) ?? e.programmeId}
                  </div>
                  <div className="text-[11px] text-encre/50 truncate">
                    {e.envoiRef} · échéance {fmtDate(e.dateEcheanceRealisation)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
