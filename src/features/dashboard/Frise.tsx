// ============================================================================
//  Frise chronologique du dashboard (fenêtre glissante de 90 j, cf. PRD F4).
//  Deux vues basculables :
//   - « Frise » : colonnes régulières = semaines (label court jj/mm), chaque
//     enquête = petite barre colorée par le niveau d'urgence.
//   - « Calendrier » : regroupement par mois, liste par jour.
//  Aucun tiret cadratin dans les libellés (séparateurs : point médian, deux-points).
// ============================================================================
import { useMemo, useState } from 'react';
import type { Enquete } from '../../domain/types';
import { useStore } from '../../store/useStore';
import { frisParSemaine } from '../../domain/vues';
import { niveauUrgence } from '../../domain/urgence';
import { fmtDate } from '../../domain/dates';
import { COULEUR_URGENCE, LIBELLE_URGENCE } from '../../theme/tokens';
import { Carte, CarteTitre } from '../../ui/Carte';

type ModeFrise = 'frise' | 'calendrier';

/** Petite barre d'enquête colorée selon l'urgence (tooltip informatif). */
function BarreEnquete({
  enquete,
  etiquette,
  titre,
}: {
  enquete: Enquete;
  etiquette: string;
  titre: string;
}) {
  const couleur = COULEUR_URGENCE[niveauUrgence(enquete)];
  return (
    <div
      title={titre}
      className="flex items-center gap-1.5 rounded-md bg-creme/60 border border-brume/70 px-1.5 py-1 text-[11px] text-encre/90 truncate"
    >
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: couleur }}
        aria-hidden
      />
      <span className="truncate">{etiquette}</span>
    </div>
  );
}

export function Frise({ enquetes }: { enquetes: Enquete[] }) {
  const [mode, setMode] = useState<ModeFrise>('frise');
  const fournisseurs = useStore((s) => s.fournisseurs);
  const programmes = useStore((s) => s.programmes);

  // Résolutions id -> libellé via Map (référentiels stables).
  const sigleParFournisseur = useMemo(
    () => new Map(fournisseurs.map((f) => [f.id, f.sigle])),
    [fournisseurs],
  );
  const libelleParProgramme = useMemo(
    () => new Map(programmes.map((p) => [p.id, p.libelle])),
    [programmes],
  );

  const etiquette = (e: Enquete) =>
    `${sigleParFournisseur.get(e.fournisseurId) ?? '?'} ${e.envoiRef}`.trim();
  const titre = (e: Enquete) =>
    [
      libelleParProgramme.get(e.programmeId) ?? e.programmeId,
      `Échéance : ${fmtDate(e.dateEcheanceRealisation)}`,
      LIBELLE_URGENCE[niveauUrgence(e)],
    ].join(' · ');

  const semaines = useMemo(() => frisParSemaine(enquetes), [enquetes]);

  const total = enquetes.length;

  const bascule = (
    <div className="inline-flex rounded-lg border border-brume overflow-hidden">
      {(['frise', 'calendrier'] as ModeFrise[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={
            'px-3 py-1 text-xs font-medium transition ' +
            (mode === m
              ? 'bg-marine text-white'
              : 'bg-surface text-encre/70 hover:text-marine')
          }
        >
          {m === 'frise' ? 'Frise' : 'Calendrier'}
        </button>
      ))}
    </div>
  );

  return (
    <Carte>
      <CarteTitre extra={bascule}>Frise chronologique · 90 jours</CarteTitre>
      {total === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-encre/50">
          Aucune enquête planifiée dans la fenêtre.
        </p>
      ) : mode === 'frise' ? (
        <VueFrise semaines={semaines} etiquette={etiquette} titre={titre} />
      ) : (
        <VueCalendrier
          enquetes={enquetes}
          etiquette={etiquette}
          titre={titre}
        />
      )}
    </Carte>
  );
}

/** Vue « frise » : colonnes semaines à défilement horizontal. */
function VueFrise({
  semaines,
  etiquette,
  titre,
}: {
  semaines: ReturnType<typeof frisParSemaine>;
  etiquette: (e: Enquete) => string;
  titre: (e: Enquete) => string;
}) {
  return (
    <div className="overflow-x-auto p-3">
      <div className="flex gap-2 min-w-max">
        {semaines.map((sem) => (
          <div
            key={sem.debut}
            className="w-36 shrink-0 rounded-lg bg-creme/40 border border-brume/60 p-2"
          >
            <div className="text-[11px] font-title font-bold text-marine mb-2 tabular-nums">
              {sem.label}
            </div>
            <div className="flex flex-col gap-1">
              {sem.enquetes.length === 0 ? (
                <div className="text-[11px] text-encre/30 italic py-1">Vide</div>
              ) : (
                sem.enquetes.map((e) => (
                  <BarreEnquete
                    key={e.id}
                    enquete={e}
                    etiquette={etiquette(e)}
                    titre={titre(e)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
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
  // Regroupe par mois (clé AAAA-MM) puis trie chronologiquement.
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
        liste: liste.slice().sort((a, b) =>
          a.dateEcheanceRealisation.localeCompare(b.dateEcheanceRealisation),
        ),
      }));
  }, [enquetes]);

  const nomMois = (cle: string) => {
    const [annee, mois] = cle.split('-');
    const libelles = [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ];
    return `${libelles[Number(mois) - 1] ?? mois} ${annee}`;
  };

  return (
    <div className="p-3 space-y-4">
      {parMois.map(({ cle, liste }) => (
        <div key={cle}>
          <div className="text-xs font-title font-bold text-marine capitalize mb-2">
            {nomMois(cle)}
          </div>
          <ul className="space-y-1">
            {liste.map((e) => (
              <li key={e.id} className="flex items-center gap-2 text-sm" title={titre(e)}>
                <span className="w-16 shrink-0 tabular-nums text-encre/60 text-[11px]">
                  {fmtDate(e.dateEcheanceRealisation)}
                </span>
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: COULEUR_URGENCE[niveauUrgence(e)] }}
                  aria-hidden
                />
                <span className="truncate text-encre/90">{etiquette(e)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
