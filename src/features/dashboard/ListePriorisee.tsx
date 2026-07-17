// ============================================================================
//  Liste priorisée des enquêtes (cf. PRD F4).
//  Table triée par trierParPriorite (retard, puis J-7, puis échéance).
//  Statut modifiable en ligne (setStatut) ; réaffectation d'automates en ligne
//  (reaffecter) via un panneau dépliable ; « Source » ouvre le module d'import.
//  En-tête sticky léger. Aucun tiret cadratin dans les libellés.
// ============================================================================
import { Fragment, useMemo, useState } from 'react';
import type { Enquete, Statut } from '../../domain/types';
import { STATUTS } from '../../domain/types';
import { useStore } from '../../store/useStore';
import { useNav } from '../../store/useNav';
import { trierParPriorite } from '../../domain/tri';
import { niveauUrgence } from '../../domain/urgence';
import { joursRestants, fmtDate } from '../../domain/dates';
import { LIBELLE_STATUT, COULEUR_URGENCE } from '../../theme/tokens';
import { Carte, CarteTitre } from '../../ui/Carte';
import { PastilleUrgence } from '../../ui/Pastille';
import { SelectMulti, type Option } from '../../ui/SelectMulti';

/** Rend « J-n », « Aujourd'hui » ou « +n j de retard ». */
function libelleJours(iso: string): { texte: string; retard: boolean } {
  const jr = joursRestants(iso);
  if (jr === null) return { texte: '·', retard: false };
  if (jr < 0) return { texte: `+${-jr} j de retard`, retard: true };
  if (jr === 0) return { texte: "Aujourd'hui", retard: false };
  return { texte: `J-${jr}`, retard: false };
}

/** Teinte de fond légère d'un hex (compteur de jours restants). */
function teinte(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function ListePriorisee({ enquetes }: { enquetes: Enquete[] }) {
  const fournisseurs = useStore((s) => s.fournisseurs);
  const programmes = useStore((s) => s.programmes);
  const automates = useStore((s) => s.automates);
  const sites = useStore((s) => s.sites);
  const setStatut = useStore((s) => s.setStatut);
  const reaffecter = useStore((s) => s.reaffecter);
  const aller = useNav((s) => s.aller);

  const [ouvert, setOuvert] = useState<string | null>(null); // id de la ligne dépliée

  // Résolutions id -> libellé.
  const nomFournisseur = useMemo(
    () => new Map(fournisseurs.map((f) => [f.id, f.nom])),
    [fournisseurs],
  );
  const libelleProgramme = useMemo(
    () => new Map(programmes.map((p) => [p.id, p.libelle])),
    [programmes],
  );
  const nomAutomate = useMemo(() => new Map(automates.map((a) => [a.id, a.nom])), [automates]);
  const nomSite = useMemo(() => new Map(sites.map((s) => [s.id, s.nom])), [sites]);

  const optionsAutomates: Option[] = useMemo(
    () => automates.map((a) => ({ value: a.id, label: a.nom })),
    [automates],
  );

  const triees = useMemo(() => trierParPriorite(enquetes), [enquetes]);

  const th = 'px-3 py-2 text-left font-medium text-encre/60 whitespace-nowrap';
  const td = 'px-3 py-2 align-middle';

  return (
    <Carte>
      <CarteTitre extra={`${triees.length} enquête${triees.length > 1 ? 's' : ''}`}>
        Liste priorisée
      </CarteTitre>

      {triees.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-encre/50">
          Aucune enquête à afficher pour ces filtres.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-brume text-xs">
              <tr>
                <th className={th}>Automate(s)</th>
                <th className={th}>Programme</th>
                <th className={th}>Fournisseur</th>
                <th className={th}>Envoi</th>
                <th className={th}>Échéance</th>
                <th className={th}>Jours restants</th>
                <th className={th}>Site</th>
                <th className={th}>Urgence</th>
                <th className={th}>Statut</th>
                <th className={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {triees.map((e) => {
                const jours = libelleJours(e.dateEcheanceRealisation);
                const autos = e.automateIds.map((id) => nomAutomate.get(id) ?? id);
                const deplie = ouvert === e.id;
                const niv = niveauUrgence(e);
                const couleur = COULEUR_URGENCE[niv];
                return (
                  <Fragment key={e.id}>
                    <tr className="border-b border-brume/60 hover:bg-creme/40">
                      <td
                        className={`${td} font-medium text-marine`}
                        style={{ boxShadow: `inset 4px 0 0 ${couleur}` }}
                      >
                        {autos.length > 0 ? autos.join(', ') : <span className="text-encre/30">Non affecté</span>}
                      </td>
                      <td className={td}>{libelleProgramme.get(e.programmeId) ?? e.programmeId}</td>
                      <td className={`${td} text-encre/70`}>
                        {nomFournisseur.get(e.fournisseurId) ?? e.fournisseurId}
                      </td>
                      <td className={`${td} text-encre/70`}>{e.envoiRef}</td>
                      <td className={`${td} tabular-nums whitespace-nowrap`}>
                        {fmtDate(e.dateEcheanceRealisation)}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums"
                          style={{ backgroundColor: teinte(couleur, 0.14), color: couleur }}
                        >
                          {jours.texte}
                        </span>
                      </td>
                      <td className={`${td} text-encre/70 whitespace-nowrap`}>
                        {nomSite.get(e.siteId) ?? <span className="text-encre/30">·</span>}
                      </td>
                      <td className={td}>
                        <PastilleUrgence niveau={niveauUrgence(e)} />
                      </td>
                      <td className={td}>
                        <select
                          value={e.statut}
                          onChange={(ev) => setStatut(e.id, ev.target.value as Statut)}
                          className="rounded-lg border border-brume bg-surface text-xs px-2 py-1 hover:border-marine/40 focus:outline-none focus:border-marine/60"
                        >
                          {STATUTS.map((st) => (
                            <option key={st} value={st}>
                              {LIBELLE_STATUT[st]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setOuvert(deplie ? null : e.id)}
                            className={
                              'rounded-lg border text-xs px-2 py-1 transition ' +
                              (deplie
                                ? 'border-terracotta text-terracotta'
                                : 'border-brume text-encre/70 hover:border-marine/40')
                            }
                          >
                            Réaffecter
                          </button>
                          {e.sourceRef && (
                            <button
                              type="button"
                              onClick={() => aller('reconcile')}
                              className="rounded-lg border border-brume text-xs px-2 py-1 text-encre/70 hover:border-marine/40"
                              title="Voir la source d'origine"
                            >
                              Source
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {deplie && (
                      <tr className="border-b border-brume/60 bg-creme/30">
                        <td className="px-3 py-3" colSpan={10}>
                          <div className="text-xs text-encre/60 mb-2">
                            Automates affectés à cette enquête :
                          </div>
                          <SelectMulti
                            options={optionsAutomates}
                            selection={e.automateIds}
                            onChange={(next) => reaffecter(e.id, next)}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Carte>
  );
}
