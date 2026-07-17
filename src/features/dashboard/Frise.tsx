// ============================================================================
//  Frise chronologique du dashboard (fenêtre glissante 90 j, cf. PRD F4).
//  Vue principale : un AXE TEMPOREL CONTINU, avec
//   - les fenêtres d'alerte ombrées (0 à 7 j terracotta, 8 à 15 j ambre) ;
//   - un repère « aujourd'hui » et un axe des mois ;
//   - chaque enquête = un point positionné à son échéance, empilé en couloirs,
//     coloré par le niveau d'urgence, avec infobulle au survol ;
//   - un couloir « en retard » à gauche pour les échéances dépassées ;
//   - un histogramme de charge par semaine sous l'axe.
//  Vue secondaire basculable : calendrier mensuel.
//  Aucun tiret cadratin (séparateurs : point médian, deux-points).
// ============================================================================
import { useMemo, useState } from 'react';
import type { Enquete } from '../../domain/types';
import { useStore } from '../../store/useStore';
import { frisParSemaine } from '../../domain/vues';
import { niveauUrgence, type NiveauUrgence } from '../../domain/urgence';
import { joursRestants, fmtDate, aujourdhui } from '../../domain/dates';
import { FENETRE_FRISE_JOURS } from '../../domain/config/seuils';
import { COULEUR_URGENCE, LIBELLE_URGENCE } from '../../theme/tokens';
import { Carte, CarteTitre } from '../../ui/Carte';
import { IconFrise, IconCalendrier } from '../../ui/icones';

type ModeFrise = 'frise' | 'calendrier';
const FENETRE = FENETRE_FRISE_JOURS;

/** Convertit un nombre de jours restants (0..FENETRE) en position horizontale %. */
function xPct(jours: number): number {
  return 2 + (Math.max(0, Math.min(FENETRE, jours)) / FENETRE) * 96;
}

export function Frise({ enquetes }: { enquetes: Enquete[] }) {
  const [mode, setMode] = useState<ModeFrise>('frise');
  const fournisseurs = useStore((s) => s.fournisseurs);
  const programmes = useStore((s) => s.programmes);

  const sigleParFournisseur = useMemo(
    () => new Map(fournisseurs.map((f) => [f.id, f.sigle])),
    [fournisseurs],
  );
  const libelleParProgramme = useMemo(
    () => new Map(programmes.map((p) => [p.id, p.libelle])),
    [programmes],
  );

  const infos = (e: Enquete) => ({
    titre: `${sigleParFournisseur.get(e.fournisseurId) ?? '?'} · ${e.envoiRef}`,
    sous: libelleParProgramme.get(e.programmeId) ?? e.programmeId,
    echeance: fmtDate(e.dateEcheanceRealisation),
    niveau: niveauUrgence(e),
  });

  const total = enquetes.length;

  const bascule = (
    <div className="inline-flex rounded-lg border border-brume overflow-hidden">
      {([
        ['frise', 'Frise', <IconFrise key="f" className="h-3.5 w-3.5" />],
        ['calendrier', 'Calendrier', <IconCalendrier key="c" className="h-3.5 w-3.5" />],
      ] as [ModeFrise, string, JSX.Element][]).map(([m, label, icone]) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={
            'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition ' +
            (mode === m ? 'bg-marine text-white' : 'bg-surface text-encre/70 hover:text-marine')
          }
        >
          {icone}
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <Carte>
      <CarteTitre extra={bascule}>Frise chronologique · 90 jours</CarteTitre>
      {total === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-encre/50">
          Aucune enquête planifiée dans la fenêtre.
        </p>
      ) : mode === 'frise' ? (
        <VueFrise enquetes={enquetes} infos={infos} />
      ) : (
        <VueCalendrier
          enquetes={enquetes}
          etiquette={(e) => infos(e).titre}
          titre={(e) => `${infos(e).sous} · Échéance : ${infos(e).echeance} · ${LIBELLE_URGENCE[infos(e).niveau]}`}
        />
      )}
    </Carte>
  );
}

interface InfoEnquete {
  titre: string;
  sous: string;
  echeance: string;
  niveau: NiveauUrgence;
}

/** Vue principale : axe temporel continu + histogramme de charge. */
function VueFrise({
  enquetes,
  infos,
}: {
  enquetes: Enquete[];
  infos: (e: Enquete) => InfoEnquete;
}) {
  const [survol, setSurvol] = useState<string | null>(null);
  const ref = aujourdhui();

  // Répartition retard / fenêtre.
  const { pointsFenetre, retards, hauteur, maxLane } = useMemo(() => {
    const dansFenetre: { e: Enquete; jr: number }[] = [];
    const enRetard: Enquete[] = [];
    for (const e of enquetes) {
      const jr = joursRestants(e.dateEcheanceRealisation, ref);
      if (jr === null) continue;
      // Le couloir « en retard » suit la règle d'urgence (échue ET non réalisée),
      // pas le simple signe des jours restants.
      if (niveauUrgence(e, ref) === 'en_retard') enRetard.push(e);
      else if (jr >= 0 && jr <= FENETRE) dansFenetre.push({ e, jr });
    }
    dansFenetre.sort((a, b) => a.jr - b.jr);

    // Empilage en couloirs : évite le chevauchement horizontal (écart mini 3.2 %).
    const MAX_LANE = 5;
    const GAP = 3.2;
    const dernierX: number[] = [];
    const points = dansFenetre.map(({ e, jr }) => {
      const x = xPct(jr);
      let lane = 0;
      while (lane < MAX_LANE && dernierX[lane] !== undefined && x - dernierX[lane] < GAP) lane += 1;
      if (lane >= MAX_LANE) lane = MAX_LANE; // couloir de débordement
      dernierX[lane] = x;
      return { e, jr, x, lane };
    });
    const maxL = points.reduce((m, p) => Math.max(m, p.lane), 0);
    const h = 34 + (maxL + 1) * 22 + 8;
    return { pointsFenetre: points, retards: enRetard, hauteur: h, maxLane: maxL };
  }, [enquetes, ref]);

  // Bornes de mois dans la fenêtre (pour l'axe).
  const mois = useMemo(() => {
    const out: { x: number; label: string }[] = [];
    const noms = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const d = new Date(ref);
    d.setDate(1);
    d.setMonth(d.getMonth() + 1); // premier changement de mois à venir
    for (let k = 0; k < 4; k++) {
      const jr = joursRestants(d.toISOString().slice(0, 10), ref);
      if (jr !== null && jr >= 0 && jr <= FENETRE) out.push({ x: xPct(jr), label: `${noms[d.getMonth()]}` });
      d.setMonth(d.getMonth() + 1);
    }
    return out;
  }, [ref]);

  // Histogramme de charge par semaine.
  const semaines = useMemo(() => {
    const sem = frisParSemaine(enquetes, ref);
    const arr = sem
      .map((s) => {
        const jr = joursRestants(s.debut, ref);
        return { debut: s.debut, jr: jr ?? 0, count: s.enquetes.length };
      })
      .filter((s) => s.jr <= FENETRE && s.jr + 6 >= 0);
    const maxCount = Math.max(1, ...arr.map((s) => s.count));
    return { arr, maxCount };
  }, [enquetes, ref]);

  const laneY = (lane: number) => 30 + lane * 22;
  const pointSurvole = pointsFenetre.find((p) => p.e.id === survol);

  return (
    <div className="p-4">
      {/* Légende */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-[11px] text-encre/60">
        {(['en_retard', 'urgent', 'a_surveiller', 'a_venir'] as NiveauUrgence[]).map((n) => (
          <span key={n} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COULEUR_URGENCE[n] }} />
            {LIBELLE_URGENCE[n]}
          </span>
        ))}
      </div>

      <div className="flex gap-3">
        {/* Couloir « en retard » à gauche */}
        <div className="shrink-0 w-16 border-r border-brume pr-3 flex flex-col items-center">
          <div className="text-[10px] font-title font-bold uppercase tracking-wide text-terracotta text-center leading-tight mb-2">
            En retard
          </div>
          {retards.length === 0 ? (
            <div className="text-[11px] text-encre/25 mt-2">·</div>
          ) : (
            <div className="flex flex-wrap justify-center gap-1">
              {retards.slice(0, 12).map((e) => (
                <span
                  key={e.id}
                  title={`${infos(e).titre} · Échéance : ${infos(e).echeance}`}
                  onMouseEnter={() => setSurvol(e.id)}
                  onMouseLeave={() => setSurvol(null)}
                  className="h-3 w-3 rounded-full ring-2 ring-surface cursor-pointer"
                  style={{ backgroundColor: COULEUR_URGENCE.en_retard }}
                />
              ))}
              {retards.length > 12 && (
                <span className="text-[10px] text-terracotta font-medium">+{retards.length - 12}</span>
              )}
            </div>
          )}
        </div>

        {/* Piste temporelle */}
        <div className="relative flex-1 min-w-0">
          <div className="relative" style={{ height: hauteur }}>
            {/* Zones d'alerte */}
            <div className="absolute inset-y-0 rounded-l-md" style={{ left: `${xPct(0)}%`, width: `${xPct(7) - xPct(0)}%`, backgroundColor: 'rgba(192,98,63,.08)' }} />
            <div className="absolute inset-y-0" style={{ left: `${xPct(7)}%`, width: `${xPct(15) - xPct(7)}%`, backgroundColor: 'rgba(215,162,74,.10)' }} />

            {/* Bornes de mois */}
            {mois.map((m) => (
              <div key={m.label + m.x} className="absolute inset-y-0" style={{ left: `${m.x}%` }}>
                <div className="h-full w-px bg-brume/70" />
                <div className="absolute top-0 left-1.5 text-[10px] text-encre/45 capitalize">{m.label}</div>
              </div>
            ))}

            {/* Repère aujourd'hui */}
            <div className="absolute inset-y-0" style={{ left: `${xPct(0)}%` }}>
              <div className="h-full w-0.5 bg-marine" />
              <div className="absolute -top-0.5 left-1 text-[10px] font-title font-bold text-marine whitespace-nowrap">
                Aujourd'hui
              </div>
            </div>

            {/* Points enquêtes */}
            {pointsFenetre.map((p) => (
              <button
                key={p.e.id}
                type="button"
                onMouseEnter={() => setSurvol(p.e.id)}
                onMouseLeave={() => setSurvol(null)}
                onFocus={() => setSurvol(p.e.id)}
                onBlur={() => setSurvol(null)}
                className="absolute h-3.5 w-3.5 rounded-full ring-2 ring-surface -translate-x-1/2 transition-transform hover:scale-125 focus:scale-125 focus:outline-none"
                style={{ left: `${p.x}%`, top: laneY(p.lane), backgroundColor: COULEUR_URGENCE[p.jr <= 7 ? 'urgent' : p.jr <= 15 ? 'a_surveiller' : 'a_venir'] }}
                aria-label={`${infos(p.e).titre} · Échéance : ${infos(p.e).echeance}`}
              />
            ))}
            {maxLane >= 5 && (
              <div className="absolute bottom-0 right-0 text-[10px] text-encre/40">couloirs saturés · voir la liste</div>
            )}

            {/* Infobulle */}
            {pointSurvole && (
              <div
                className="absolute z-20 -translate-x-1/2 pointer-events-none"
                style={{ left: `${Math.max(12, Math.min(88, pointSurvole.x))}%`, top: Math.max(0, laneY(pointSurvole.lane) - 52) }}
              >
                <div className="rounded-lg bg-marine text-white shadow-carte px-2.5 py-1.5 text-[11px] whitespace-nowrap">
                  <div className="font-bold">{infos(pointSurvole.e).titre}</div>
                  <div className="text-white/70">
                    {infos(pointSurvole.e).sous} · {infos(pointSurvole.e).echeance}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Histogramme de charge par semaine */}
          <div className="relative h-14 mt-1 border-t border-brume/70 pt-1">
            <div className="absolute left-1 top-1 surtitre text-[9px]">Charge par semaine</div>
            {semaines.arr.map((s) => {
              const gauche = xPct(Math.max(0, s.jr));
              const largeur = (7 / FENETRE) * 96;
              const h = s.count === 0 ? 0 : 6 + (s.count / semaines.maxCount) * 34;
              return (
                <div
                  key={s.debut}
                  className="absolute bottom-0 group"
                  style={{ left: `${gauche}%`, width: `${largeur}%` }}
                  title={`Semaine du ${fmtDate(s.debut)} : ${s.count} enquête${s.count > 1 ? 's' : ''}`}
                >
                  <div className="mx-[2px] rounded-t bg-marine/25 group-hover:bg-marine/45 transition-colors" style={{ height: h }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Vue « calendrier » : regroupement par mois, liste par jour. */
function VueCalendrier({
  enquetes,
  etiquette,
  titre,
}: {
  enquetes: Enquete[];
  etiquette: (e: Enquete) => string;
  titre: (e: Enquete) => string;
}) {
  const parMois = useMemo(() => {
    const m = new Map<string, Enquete[]>();
    for (const e of enquetes) {
      const cle = e.dateEcheanceRealisation.slice(0, 7);
      const liste = m.get(cle);
      if (liste) liste.push(e);
      else m.set(cle, [e]);
    }
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([cle, liste]) => ({
        cle,
        liste: liste.slice().sort((a, b) => a.dateEcheanceRealisation.localeCompare(b.dateEcheanceRealisation)),
      }));
  }, [enquetes]);

  const nomMois = (cle: string) => {
    const [annee, mois] = cle.split('-');
    const libelles = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${libelles[Number(mois) - 1] ?? mois} ${annee}`;
  };

  return (
    <div className="p-4 space-y-4">
      {parMois.map(({ cle, liste }) => (
        <div key={cle}>
          <div className="surtitre mb-2 capitalize">{nomMois(cle)}</div>
          <ul className="space-y-1">
            {liste.map((e) => (
              <li key={e.id} className="flex items-center gap-2.5 text-sm rounded-md hover:bg-creme/50 px-2 py-1" title={titre(e)}>
                <span className="w-16 shrink-0 tabular-nums text-encre/55 text-[11px]">{fmtDate(e.dateEcheanceRealisation)}</span>
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COULEUR_URGENCE[niveauUrgence(e)] }} aria-hidden />
                <span className="truncate text-encre/90">{etiquette(e)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
