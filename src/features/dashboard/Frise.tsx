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
        <VueFrise enquetes={enquetes} />
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

// Ordre d'empilage des segments (du bas vers le haut) : le plus urgent en bas.
const SEGMENTS: NiveauUrgence[] = ['urgent', 'a_surveiller', 'a_venir'];
const NOMS_MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/**
 * Vue principale : histogramme HEBDOMADAIRE empilé par urgence, rendu en SVG
 * (positionnement exact, robuste à toute largeur). Colonne « Retard » à gauche,
 * zones d'alerte ombrées, repère « aujourd'hui », axe des mois.
 */
function VueFrise({ enquetes }: { enquetes: Enquete[] }) {
  const ref = aujourdhui();

  const modele = useMemo(() => {
    // Colonnes = semaines de la fenêtre (espacement régulier, semaines vides incluses).
    const semaines = frisParSemaine(enquetes, ref)
      .map((s) => {
        const jr = joursRestants(s.debut, ref) ?? 0;
        const compte: Record<NiveauUrgence, number> = { en_retard: 0, urgent: 0, a_surveiller: 0, a_venir: 0 };
        for (const e of s.enquetes) compte[niveauUrgence(e, ref)] += 1;
        const total = SEGMENTS.reduce((n, k) => n + compte[k], 0);
        return { debut: s.debut, jr, compte, total, mois: new Date(s.debut).getMonth() };
      })
      .filter((s) => s.jr >= -6 && s.jr <= FENETRE);

    const retard = enquetes.filter((e) => niveauUrgence(e, ref) === 'en_retard').length;
    const maxTotal = Math.max(1, retard, ...semaines.map((s) => s.total));
    return { semaines, retard, maxTotal };
  }, [enquetes, ref]);

  // Géométrie SVG.
  const VBW = 1000;
  const VBH = 210;
  const L = 8;
  const R = 8;
  const T = 16; // espace pour les étiquettes de compte
  const B = 40; // espace pour l'axe des mois
  const baseline = VBH - B;
  const plotH = baseline - T;

  const offset = model_offset(modele.retard);
  const nbCol = modele.semaines.length + offset;
  const slotW = (VBW - L - R) / Math.max(1, nbCol);
  const barW = Math.min(slotW * 0.6, 30);
  const centre = (i: number) => L + slotW * (i + 0.5);
  const hauteurBarre = (n: number) => (n / modele.maxTotal) * plotH;

  // Position exacte du repère « aujourd'hui » dans la semaine courante.
  const idxToday = modele.semaines.findIndex((s) => s.jr <= 0 && s.jr + 6 >= 0);
  const xToday =
    idxToday >= 0
      ? centre(idxToday + offset) - slotW / 2 + (Math.min(6, -modele.semaines[idxToday].jr) / 7) * slotW
      : centre(offset) - slotW / 2;

  return (
    <div className="p-4">
      {/* Légende */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2 text-[11px] text-encre/60">
        {(['en_retard', 'urgent', 'a_surveiller', 'a_venir'] as NiveauUrgence[]).map((n) => (
          <span key={n} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COULEUR_URGENCE[n] }} />
            {LIBELLE_URGENCE[n]}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${VBW} ${VBH}`} className="w-full" style={{ height: 220 }} role="img" aria-label="Histogramme hebdomadaire des enquêtes par niveau d'urgence">
        {/* Ligne de base */}
        <line x1={L} y1={baseline} x2={VBW - R} y2={baseline} stroke="#D5DBDF" strokeWidth={1.5} />

        {/* Repère aujourd'hui, positionné au jour près dans la semaine courante */}
        {idxToday >= 0 && (
          <g>
            <line x1={xToday} y1={T - 6} x2={xToday} y2={baseline} stroke="#14304A" strokeWidth={2} strokeDasharray="3 3" />
            <text x={xToday + 4} y={T - 2} fontSize={11} fontWeight={700} fill="#14304A" fontFamily="Manrope, sans-serif">
              Aujourd'hui
            </text>
          </g>
        )}

        {/* Colonne « En retard » */}
        {modele.retard > 0 && (
          <g>
            <title>{`${modele.retard} enquête${modele.retard > 1 ? 's' : ''} en retard`}</title>
            <rect
              x={centre(0) - barW / 2}
              y={baseline - hauteurBarre(modele.retard)}
              width={barW}
              height={hauteurBarre(modele.retard)}
              rx={3}
              fill={COULEUR_URGENCE.en_retard}
            />
            <text x={centre(0)} y={baseline - hauteurBarre(modele.retard) - 5} fontSize={12} fontWeight={800} textAnchor="middle" fill="#14304A" fontFamily="Manrope, sans-serif">
              {modele.retard}
            </text>
            <text x={centre(0)} y={baseline + 15} fontSize={10} textAnchor="middle" fill="#C0623F" fontWeight={700}>
              Retard
            </text>
          </g>
        )}

        {/* Barres empilées par semaine */}
        {modele.semaines.map((s, i) => {
          const cx = centre(i + offset);
          let y = baseline;
          return (
            <g key={s.debut}>
              <title>
                {`Semaine du ${fmtDate(s.debut)} : ${s.total} enquête${s.total > 1 ? 's' : ''}` +
                  (s.total ? ` · ${s.compte.urgent} urgent, ${s.compte.a_surveiller} à surveiller, ${s.compte.a_venir} à venir` : '')}
              </title>
              {SEGMENTS.map((k) => {
                const h = hauteurBarre(s.compte[k]);
                if (h <= 0) return null;
                y -= h;
                return <rect key={k} x={cx - barW / 2} y={y + 1} width={barW} height={Math.max(0, h - 1)} rx={2} fill={COULEUR_URGENCE[k]} />;
              })}
              {s.total > 0 && (
                <text x={cx} y={y - 5} fontSize={12} fontWeight={800} textAnchor="middle" fill="#14304A" fontFamily="Manrope, sans-serif">
                  {s.total}
                </text>
              )}
              {/* Étiquette de mois quand le mois change (ou 1re colonne) */}
              {(i === 0 || s.mois !== modele.semaines[i - 1].mois) && (
                <text x={cx} y={baseline + 30} fontSize={11} textAnchor="middle" fill="rgba(30,41,51,.55)" className="capitalize">
                  {NOMS_MOIS[s.mois]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-[11px] text-encre/45">
        Chaque colonne · une semaine, sur 90 jours. Hauteur · nombre d'enquêtes, empilées par niveau d'urgence. Survolez une colonne pour le détail.
      </p>
    </div>
  );
}

/** Décalage de colonnes réservé à la barre « Retard » (1 si présente). */
function model_offset(retard: number): number {
  return retard > 0 ? 1 : 0;
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
