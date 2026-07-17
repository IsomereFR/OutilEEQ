// ============================================================================
//  Inbox : enquêtes existantes non affectées (affectee = false), à rattacher
//  au planning. Chaque ligne porte ses propres contrôles d'affectation.
// ============================================================================
import { useMemo, useState } from 'react';
import type { Statut, Enquete, Programme } from '../../domain/types';
import { useStore } from '../../store/useStore';
import { SelectMulti, type Option } from '../../ui/SelectMulti';
import { PastilleStatut } from '../../ui/Pastille';
import { fmtDate } from '../../domain/dates';
import { BTN_PRIMAIRE, CHAMP, OPTIONS_STATUT, enOptions, indexNoms } from './communs';

export function Inbox() {
  const enquetes = useStore((s) => s.enquetes);
  const fournisseurs = useStore((s) => s.fournisseurs);
  const sites = useStore((s) => s.sites);
  const automates = useStore((s) => s.automates);
  const programmes = useStore((s) => s.programmes);
  const affecter = useStore((s) => s.affecter);

  const enAttente = useMemo(() => enquetes.filter((e) => !e.affectee), [enquetes]);

  // Tables de correspondance id -> libellé (affichage sobre).
  const nomFournisseur = useMemo(
    () => indexNoms(fournisseurs, (f) => f.sigle || f.nom),
    [fournisseurs],
  );
  const nomProgramme = useMemo(
    () => indexNoms(programmes, (p) => p.codeProgramme || p.libelle),
    [programmes],
  );
  const programmeParId = useMemo(
    () => new Map(programmes.map((p) => [p.id, p])),
    [programmes],
  );

  const optsAutomates = useMemo(() => enOptions(automates, (a) => a.nom), [automates]);
  const optsSites = useMemo(
    () => enOptions(sites, (s) => `${s.nom} (${s.code})`),
    [sites],
  );

  if (enAttente.length === 0) {
    return (
      <p className="text-sm text-encre/60">Aucune enquête en attente d'affectation.</p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-encre/70">
        {enAttente.length} enquête{enAttente.length > 1 ? 's' : ''} à affecter.
      </p>
      <ul className="space-y-3">
        {enAttente.map((e) => (
          <LigneInbox
            key={e.id}
            enquete={e}
            programme={programmeParId.get(e.programmeId)}
            libelleFournisseur={nomFournisseur.get(e.fournisseurId) ?? 'Fournisseur inconnu'}
            libelleProgramme={nomProgramme.get(e.programmeId) ?? 'Programme non rattaché'}
            optsAutomates={optsAutomates}
            optsSites={optsSites}
            onAffecter={affecter}
          />
        ))}
      </ul>
    </div>
  );
}

/** Une ligne d'inbox avec état d'affectation local (pré-rempli des défauts). */
function LigneInbox({
  enquete,
  programme,
  libelleFournisseur,
  libelleProgramme,
  optsAutomates,
  optsSites,
  onAffecter,
}: {
  enquete: Enquete;
  programme: Programme | undefined;
  libelleFournisseur: string;
  libelleProgramme: string;
  optsAutomates: Option[];
  optsSites: Option[];
  onAffecter: (id: string, patch: Partial<Enquete>) => void;
}) {
  const [automateIds, setAutomateIds] = useState<string[]>(
    enquete.automateIds.length ? enquete.automateIds : programme?.automatesParDefaut ?? [],
  );
  const [siteId, setSiteId] = useState<string>(enquete.siteId ?? '');
  const [statut, setStatut] = useState<Statut>(enquete.statut);
  const [responsable, setResponsable] = useState<string>(enquete.responsable ?? '');

  return (
    <li className="rounded-xl2 border border-brume bg-creme/40 p-3 space-y-3">
      {/* En-tête d'identification */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-medium text-marine">{libelleFournisseur}</span>
        <span className="text-encre/40">·</span>
        <span>{libelleProgramme}</span>
        {enquete.envoiRef && (
          <>
            <span className="text-encre/40">·</span>
            <span className="text-encre/70">{enquete.envoiRef}</span>
          </>
        )}
        <span className="text-encre/40">·</span>
        <span className="text-encre/70">
          Échéance : <span className="font-mono">{fmtDate(enquete.dateEcheanceRealisation)}</span>
        </span>
        <span className="ml-auto">
          <PastilleStatut statut={enquete.statut} />
        </span>
      </div>

      {/* Contrôles d'affectation */}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs text-encre/70">
          Automates
          <div className="mt-1">
            <SelectMulti options={optsAutomates} selection={automateIds} onChange={setAutomateIds} />
          </div>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-encre/70 flex flex-col">
            Site
            <select
              className={CHAMP + ' mt-1'}
              value={siteId}
              onChange={(ev) => setSiteId(ev.target.value)}
            >
              <option value="">(non défini)</option>
              {optsSites.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-encre/70 flex flex-col">
            Statut
            <select
              className={CHAMP + ' mt-1'}
              value={statut}
              onChange={(ev) => setStatut(ev.target.value as Statut)}
            >
              {OPTIONS_STATUT.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-encre/70 flex flex-col grow">
          Responsable
          <input
            className={CHAMP + ' mt-1'}
            value={responsable}
            onChange={(ev) => setResponsable(ev.target.value)}
            placeholder="Initiales ou nom"
          />
        </label>
        <button
          type="button"
          className={BTN_PRIMAIRE}
          onClick={() =>
            onAffecter(enquete.id, {
              automateIds,
              siteId,
              statut,
              responsable: responsable || undefined,
            })
          }
        >
          Affecter
        </button>
      </div>
    </li>
  );
}
