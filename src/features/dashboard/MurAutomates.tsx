// ============================================================================
//  Mur d'affichage « À réaliser par automate » (LECTURE SEULE).
//  Affichage à deux niveaux, pensé pour être lu de loin :
//   1. GRANDES cartes, mises en évidence, pour les automates ayant une EEQ
//      DANS LES 7 JOURS (triées par urgence). L'échéance « aujourd'hui » est
//      immanquable (carte pleine + pastille pulsée).
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
  'Gazométrie',
  'Hématologie',
  'Immunohématologie',
  'HbA1c', // famille TLA / Octa (HbA1c · ELP · PBJ · CDT)
  'Techniques Manuelles',
];

/** hex #RRGGBB -> rgba avec alpha. */
function tint(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** « Aujourd'hui » ou « J-n ». */
function libelleJours(e: Enquete): string {
  const jr = joursRestants(e.dateEcheanceRealisation);
  if (jr === null) return '';
  return jr === 0 ? "Aujourd'hui" : `J-${jr}`;
}

interface AutoVue {
  automate: Automate;
  items: Enquete[];
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
      .map((automate) => ({ automate, items: parAutomate.get(automate.id) ?? [], pire: pireAlerte(parAutomate.get(automate.id) ?? []) }));

    const dansSemaine = (v: AutoVue) => v.pire !== null && RANG_ALERTE[v.pire] <= RANG_ALERTE.j7;
    const urgents = vues
      .filter(dansSemaine)
      .sort((x, y) => RANG_ALERTE[x.pire!] - RANG_ALERTE[y.pire!] ||
        x.items[0].dateEcheanceRealisation.localeCompare(y.items[0].dateEcheanceRealisation));
    const calmes = vues.filter((v) => !dansSemaine(v)).sort((x, y) => ordreDisc(x.automate) - ordreDisc(y.automate));
    return { urgents, calmes };
  }, [enquetes, automates]);

  return (
    <div className="space-y-6">
      {/* 1 · Grandes cartes des EEQ à réaliser cette semaine */}
      {urgents.length > 0 ? (
        <div>
          <div className="surtitre mb-3">À réaliser cette semaine</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {urgents.map((v) => (
              <CarteAuto key={v.automate.id} vue={v} libelleProgramme={libelleProgramme} />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl2 px-5 py-5 text-base font-semibold flex items-center gap-3"
          style={{ background: tint(COULEUR_ALERTE.a_jour, 0.1), color: COULEUR_ALERTE.a_jour }}
        >
          <span className="grid place-items-center h-7 w-7 rounded-full text-white" style={{ backgroundColor: COULEUR_ALERTE.a_jour }}>
            ✓
          </span>
          Aucune EEQ à réaliser dans les 7 jours.
        </div>
      )}

      {/* 2 · Bande compacte : à venir (> 7 j) ou à jour */}
      {calmes.length > 0 && (
        <div>
          <div className="surtitre mb-3">À venir et à jour</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {calmes.map(({ automate: a, items }) => {
              const suivant = items[0];
              const niv = suivant ? (niveauAlerte(suivant) as NiveauAlerte) : null;
              const couleur = niv ? COULEUR_ALERTE[niv] : COULEUR_ALERTE.a_jour;
              return (
                <div key={a.id} className="relative overflow-hidden rounded-xl2 border border-brume bg-surface px-4 py-3">
                  {/* Indication « sous 15 j » : liseré latéral coloré, sans mise en avant */}
                  {suivant && <span className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: couleur }} />}
                  <div className={suivant ? 'pl-1.5' : ''}>
                    <div className="surtitre text-[10px] truncate">{a.disciplines.join(' · ')}</div>
                    <div className="font-title font-bold text-marine text-base truncate">{a.nom}</div>
                    {suivant ? (
                      <div className="mt-1">
                        {/* Programme (identité explicite de l'enquête) puis réf + date */}
                        <div className="text-sm text-encre/85 leading-snug truncate">
                          {libelleProgramme.get(suivant.programmeId) ?? suivant.programmeId}
                        </div>
                        <div className="text-[11px] text-encre/55 truncate">
                          {suivant.envoiRef && (
                            <>
                              <span className="font-mono font-semibold text-marine">{suivant.envoiRef}</span> ·{' '}
                            </>
                          )}
                          {fmtDate(suivant.dateEcheanceRealisation)} ·{' '}
                          <span className="font-semibold" style={{ color: couleur }}>
                            {libelleJours(suivant)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs mt-1 flex items-center gap-1.5" style={{ color: COULEUR_ALERTE.a_jour }}>
                        <span className="grid place-items-center h-4 w-4 rounded-full text-white text-[9px]" style={{ backgroundColor: COULEUR_ALERTE.a_jour }}>
                          ✓
                        </span>
                        À jour
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** GRANDE carte d'un automate à traiter cette semaine, mise en évidence. */
function CarteAuto({ vue, libelleProgramme }: { vue: AutoVue; libelleProgramme: Map<string, string> }) {
  const { automate: a, items } = vue;
  const pire = vue.pire ?? 'a_jour';
  const couleur = COULEUR_ALERTE[pire];
  const pleine = pire === 'aujourdhui'; // carte pleine = alerte maximale

  const styleCarte = pleine
    ? { background: couleur, borderColor: couleur }
    : { background: tint(couleur, 0.1), borderColor: couleur };
  const nomColor = pleine ? '#FFFFFF' : '#14304A';
  const eyebrowColor = pleine ? 'rgba(255,255,255,.75)' : couleur;
  const progColor = pleine ? '#FFFFFF' : '#14304A';
  const subColor = pleine ? 'rgba(255,255,255,.75)' : 'rgba(30,41,51,.55)';

  return (
    <div className="relative overflow-hidden rounded-xl2 border-2 shadow-carte" style={styleCarte}>
      {pleine && <span className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10" aria-hidden />}
      <div className="p-5">
        <div className="text-[11px] font-title font-bold uppercase tracking-[0.14em]" style={{ color: eyebrowColor }}>
          {a.disciplines.join(' · ')}
        </div>
        <div className="font-title font-extrabold text-2xl leading-tight" style={{ color: nomColor }}>
          {a.nom}
        </div>

        <ul className="mt-4 space-y-3">
          {items.map((e) => {
            const niv = niveauAlerte(e) as NiveauAlerte;
            const badgeBg = pleine ? 'rgba(255,255,255,.22)' : COULEUR_ALERTE[niv];
            const auj = niv === 'aujourdhui';
            return (
              <li key={e.id} className="flex items-center gap-4">
                <span
                  className={
                    'shrink-0 inline-flex items-center justify-center rounded-lg text-white font-title font-extrabold text-lg tabular-nums px-3.5 py-2 min-w-[84px] ' +
                    (auj && pleine ? 'animate-pulse' : '')
                  }
                  style={{ backgroundColor: badgeBg }}
                >
                  {auj ? LIBELLE_ALERTE.aujourdhui : libelleJours(e)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-semibold leading-snug truncate" style={{ color: progColor }}>
                    {libelleProgramme.get(e.programmeId) ?? e.programmeId}
                  </div>
                  <div className="text-sm truncate" style={{ color: subColor }}>
                    <span className="font-mono font-semibold">{e.envoiRef}</span> · échéance {fmtDate(e.dateEcheanceRealisation)}
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
