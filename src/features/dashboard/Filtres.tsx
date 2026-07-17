// ============================================================================
//  Barre de filtres transverses du dashboard (cf. PRD F4).
//  Selects sobres : fournisseur, automate, site, discipline, statut.
//  La discipline provient des valeurs distinctes des programmes.
//  Les changements sont remontés via onChange ; « Réinitialiser » vide tout.
// ============================================================================
import { useStore } from '../../store/useStore';
import { STATUTS } from '../../domain/types';
import type { Filtres as FiltresValeurs } from '../../domain/vues';
import { LIBELLE_STATUT } from '../../theme/tokens';
import { Carte } from '../../ui/Carte';

/** Classe commune des selects (sobre, filet brume). */
const SELECT_CLS =
  'rounded-lg border border-brume bg-surface text-sm text-encre px-2.5 py-1.5 ' +
  'hover:border-marine/40 focus:outline-none focus:border-marine/60';

export function Filtres({
  filtres,
  onChange,
}: {
  filtres: FiltresValeurs;
  onChange: (f: FiltresValeurs) => void;
}) {
  const fournisseurs = useStore((s) => s.fournisseurs);
  const automates = useStore((s) => s.automates);
  const sites = useStore((s) => s.sites);
  const programmes = useStore((s) => s.programmes);

  // Disciplines distinctes issues du référentiel des programmes.
  const disciplines = [...new Set(programmes.map((p) => p.discipline))].sort((a, b) =>
    a.localeCompare(b),
  );

  const set = (patch: Partial<FiltresValeurs>) => onChange({ ...filtres, ...patch });
  const actif = Object.values(filtres).some((v) => v);

  return (
    <Carte className="p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-encre/60 mr-1">Filtrer :</span>

        <select
          className={SELECT_CLS}
          value={filtres.fournisseurId ?? ''}
          onChange={(e) => set({ fournisseurId: e.target.value || undefined })}
        >
          <option value="">Tous fournisseurs</option>
          {fournisseurs.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nom}
            </option>
          ))}
        </select>

        <select
          className={SELECT_CLS}
          value={filtres.automateId ?? ''}
          onChange={(e) => set({ automateId: e.target.value || undefined })}
        >
          <option value="">Tous automates</option>
          {automates.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom}
            </option>
          ))}
        </select>

        <select
          className={SELECT_CLS}
          value={filtres.siteId ?? ''}
          onChange={(e) => set({ siteId: e.target.value || undefined })}
        >
          <option value="">Tous sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nom}
            </option>
          ))}
        </select>

        <select
          className={SELECT_CLS}
          value={filtres.discipline ?? ''}
          onChange={(e) => set({ discipline: e.target.value || undefined })}
        >
          <option value="">Toutes disciplines</option>
          {disciplines.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          className={SELECT_CLS}
          value={filtres.statut ?? ''}
          onChange={(e) => set({ statut: e.target.value || undefined })}
        >
          <option value="">Tous statuts</option>
          {STATUTS.map((st) => (
            <option key={st} value={st}>
              {LIBELLE_STATUT[st]}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onChange({})}
          disabled={!actif}
          className="ml-auto rounded-lg border border-brume bg-surface text-sm px-3 py-1.5 hover:border-marine/40 disabled:opacity-40 disabled:cursor-default"
        >
          Réinitialiser
        </button>
      </div>
    </Carte>
  );
}
