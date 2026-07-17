// ============================================================================
//  ImportExcel : flux d'import d'un planning Excel/CSV (PRD F1 + F3).
//  Dépôt -> fournisseur + mapping -> analyse (dédup) -> affectation -> validation.
//  Aucune intégration automatique : la validation humaine est obligatoire (F2/F3).
// ============================================================================
import { useMemo, useState } from 'react';
import type { Enquete, Statut } from '../../domain/types';
import { useStore, uid } from '../../store/useStore';
import type { FormatDate } from '../../import/excel/dates';
import {
  apercu,
  detecterEntete,
  entetes,
  lignesData,
  lireFichier,
} from '../../import/excel/parse';
import {
  CHAMPS_MAPPABLES,
  construireCandidats,
  construireProfil,
  suggererMapping,
} from '../../import/excel/mapping';
import { classifierLot, type VerdictDedup } from '../../domain/dedup';
import { SelectMulti } from '../../ui/SelectMulti';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CHAMP, OPTIONS_STATUT, enOptions } from './communs';

/** Décision de l'opérateur pour un candidat « nouvelle ». */
type ActionCandidat = 'integrer' | 'ignorer' | 'reporter';

/** Ligne de résultat après analyse : candidat + verdict + affectation éditable. */
interface LigneCandidat {
  programmeRef: string;
  envoiRef: string;
  notes: string;
  verdict: VerdictDedup;
  programmeId: string;
  automateIds: string[];
  siteId: string;
  statut: Statut;
  responsable: string;
  dateOuverture: string;
  dateEcheanceRealisation: string;
  dateLimiteSaisie: string;
  action: ActionCandidat;
}

/** Options de format de date proposées au profil d'import. */
const OPTIONS_FORMAT: { value: FormatDate; label: string }[] = [
  { value: 'auto', label: 'Détection automatique' },
  { value: 'jj/mm/aaaa', label: 'jj/mm/aaaa (France)' },
  { value: 'mm/jj/aaaa', label: 'mm/jj/aaaa (US)' },
  { value: 'aaaa-mm-jj', label: 'aaaa-mm-jj (ISO)' },
];

/** Styles de badge par verdict de déduplication. */
const BADGE: Record<VerdictDedup, { cls: string; label: string }> = {
  nouvelle: { cls: 'bg-terracotta/10 text-terracotta border-terracotta/40', label: 'Nouvelle' },
  deja_presente: { cls: 'bg-brume/50 text-encre/60 border-brume', label: 'Déjà présente' },
  mise_a_jour_possible: {
    cls: 'bg-ambre/15 text-ambre border-ambre/50',
    label: 'Mise à jour possible',
  },
};

export function ImportExcel() {
  const enquetes = useStore((s) => s.enquetes);
  const fournisseurs = useStore((s) => s.fournisseurs);
  const sites = useStore((s) => s.sites);
  const automates = useStore((s) => s.automates);
  const programmes = useStore((s) => s.programmes);
  const profils = useStore((s) => s.profils);
  const ajouterEnquetes = useStore((s) => s.ajouterEnquetes);
  const upsertProfil = useStore((s) => s.upsertProfil);
  const ajouterJournal = useStore((s) => s.ajouterJournal);

  // --- État de la machine à états locale ------------------------------------
  const [fichierNom, setFichierNom] = useState('');
  const [lignes, setLignes] = useState<unknown[][] | null>(null);
  const [ligneEntete, setLigneEntete] = useState(0);
  const [fournisseurId, setFournisseurId] = useState('');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [formatDate, setFormatDate] = useState<FormatDate>('auto');
  const [resultats, setResultats] = useState<LigneCandidat[] | null>(null);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');

  // --- Dérivés --------------------------------------------------------------
  const programmesFournisseur = useMemo(
    () => programmes.filter((p) => p.fournisseurId === fournisseurId),
    [programmes, fournisseurId],
  );
  const colonnes = useMemo(
    () => (lignes ? entetes(lignes, ligneEntete) : []),
    [lignes, ligneEntete],
  );
  const lignesApercu = useMemo(
    () => (lignes ? apercu(lignes, ligneEntete, 5) : []),
    [lignes, ligneEntete],
  );
  const optsAutomates = useMemo(() => enOptions(automates, (a) => a.nom), [automates]);
  const optsSites = useMemo(
    () => enOptions(sites, (s) => `${s.nom} (${s.code})`),
    [sites],
  );
  const optsProgrammes = useMemo(
    () => enOptions(programmesFournisseur, (p) => `${p.codeProgramme} · ${p.libelle}`),
    [programmesFournisseur],
  );

  // --- (a) Dépôt du fichier -------------------------------------------------
  const deposerFichier = async (file: File) => {
    setErreur('');
    setMessage('');
    setResultats(null);
    try {
      const feuille = await lireFichier(file);
      const idx = detecterEntete(feuille.lignes);
      setLignes(feuille.lignes);
      setLigneEntete(idx);
      setFichierNom(file.name);
      // Si un fournisseur est déjà choisi, on tente le pré-remplissage du mapping.
      if (fournisseurId) appliquerProfilOuSuggestion(fournisseurId, feuille.lignes, idx);
    } catch {
      setLignes(null);
      setFichierNom('');
      setErreur('Fichier illisible. Vérifiez qu\'il s\'agit d\'un .xlsx, .xls ou .csv valide.');
    }
  };

  // --- (b) Choix du fournisseur : profil mémorisé ou suggestion -------------
  const appliquerProfilOuSuggestion = (
    fid: string,
    lgs: unknown[][],
    idx: number,
  ) => {
    const profil = profils.find((p) => p.fournisseurId === fid);
    if (profil) {
      setMapping({ ...profil.mappingColonnes });
      setFormatDate((profil.formatDate as FormatDate) || 'auto');
      setLigneEntete(profil.ligneEntete);
    } else {
      setMapping(suggererMapping(entetes(lgs, idx)));
    }
  };

  const choisirFournisseur = (fid: string) => {
    setFournisseurId(fid);
    setResultats(null);
    setMessage('');
    if (fid && lignes) appliquerProfilOuSuggestion(fid, lignes, ligneEntete);
    else setMapping({});
  };

  // --- (c) Ajustement de la ligne d'en-tête ---------------------------------
  const decalerEntete = (delta: number) => {
    if (!lignes) return;
    const max = Math.max(0, lignes.length - 1);
    setLigneEntete((v) => Math.min(max, Math.max(0, v + delta)));
    setResultats(null);
  };

  // --- (e) Analyse : construction des candidats + déduplication -------------
  const resoudreProgrammeId = (ref: string): string => {
    const r = ref.trim().toLowerCase();
    if (!r) return '';
    const prog = programmesFournisseur.find((p) => {
      const code = p.codeProgramme.toLowerCase();
      const lib = p.libelle.toLowerCase();
      return (
        (code !== '' && (r.includes(code) || code.includes(r))) ||
        (lib !== '' && (r.includes(lib) || lib.includes(r)))
      );
    });
    return prog?.id ?? '';
  };

  const analyser = () => {
    if (!lignes || !fournisseurId) return;
    setErreur('');
    setMessage('');
    const rows = lignesData(lignes, ligneEntete);
    const candidats = construireCandidats(rows, mapping, formatDate);
    // Objets enrichis des clés nécessaires à la déduplication.
    const objets = candidats.map((c) => ({
      ...c,
      fournisseurId,
      programmeId: resoudreProgrammeId(c.programmeRef),
    }));
    const classes = classifierLot(objets, enquetes);

    const lignesC: LigneCandidat[] = classes.map(({ candidat, verdict }) => {
      const prog = programmesFournisseur.find((p) => p.id === candidat.programmeId);
      return {
        programmeRef: candidat.programmeRef,
        envoiRef: candidat.envoiRef,
        notes: candidat.notes,
        verdict,
        programmeId: candidat.programmeId,
        automateIds: prog?.automatesParDefaut ?? [],
        siteId: '',
        statut: 'a_venir',
        responsable: '',
        dateOuverture: candidat.dateOuverture,
        dateEcheanceRealisation: candidat.dateEcheanceRealisation,
        dateLimiteSaisie: candidat.dateLimiteSaisie,
        action: 'integrer',
      };
    });
    setResultats(lignesC);
  };

  // --- (f) Mise à jour d'une ligne de résultat ------------------------------
  const majLigne = (i: number, patch: Partial<LigneCandidat>) =>
    setResultats((prev) => (prev ? prev.map((l, j) => (j === i ? { ...l, ...patch } : l)) : prev));

  const changerProgramme = (i: number, pid: string) => {
    const prog = programmesFournisseur.find((p) => p.id === pid);
    majLigne(i, { programmeId: pid, automateIds: prog?.automatesParDefaut ?? [] });
  };

  // Actions groupées sur toutes les lignes « nouvelle ».
  const appliquerATous = (action: ActionCandidat, defauts = false) =>
    setResultats((prev) =>
      prev
        ? prev.map((l) => {
            if (l.verdict !== 'nouvelle') return l;
            if (!defauts) return { ...l, action };
            const prog = programmesFournisseur.find((p) => p.id === l.programmeId);
            return { ...l, action: 'integrer', automateIds: prog?.automatesParDefaut ?? [] };
          })
        : prev,
    );

  // --- (g) Validation de l'intégration --------------------------------------
  const valider = () => {
    if (!resultats) return;
    const now = new Date().toISOString();
    const retenues = resultats.filter(
      (l) => l.verdict === 'nouvelle' && l.action !== 'ignorer',
    );
    const nouvelles: Enquete[] = retenues.map((l) => ({
      id: uid('enq'),
      programmeId: l.programmeId,
      fournisseurId,
      envoiRef: l.envoiRef,
      dateOuverture: l.dateOuverture,
      dateEcheanceRealisation: l.dateEcheanceRealisation,
      dateLimiteSaisie: l.dateLimiteSaisie,
      automateIds: l.automateIds,
      siteId: l.siteId,
      responsable: l.responsable || undefined,
      statut: l.statut || 'a_venir',
      affectee: l.action !== 'reporter',
      source: 'excel',
      notes: l.notes || undefined,
      createdAt: now,
      updatedAt: now,
    }));

    ajouterEnquetes(nouvelles);
    upsertProfil(construireProfil(uid('prof'), fournisseurId, mapping, formatDate, ligneEntete));
    ajouterJournal({
      id: uid('jrn'),
      date: now,
      fournisseurId,
      source: 'excel',
      nbCandidats: resultats.length,
      nbIntegres: nouvelles.length,
    });

    reinitialiser();
    setMessage(
      `${nouvelles.length} enquête${nouvelles.length > 1 ? 's' : ''} intégrée${
        nouvelles.length > 1 ? 's' : ''
      } sur ${resultats.length} ligne${resultats.length > 1 ? 's' : ''} analysée${
        resultats.length > 1 ? 's' : ''
      }. Profil d'import mémorisé.`,
    );
  };

  const reinitialiser = () => {
    setFichierNom('');
    setLignes(null);
    setLigneEntete(0);
    setFournisseurId('');
    setMapping({});
    setFormatDate('auto');
    setResultats(null);
    setErreur('');
  };

  const nbNouvelles = resultats?.filter((l) => l.verdict === 'nouvelle').length ?? 0;

  // ==========================================================================
  return (
    <div className="space-y-5">
      {message && (
        <div className="rounded-lg border border-sauge/50 bg-sauge/10 text-sm text-marine px-3 py-2">
          {message}
        </div>
      )}
      {erreur && (
        <div className="rounded-lg border border-terracotta bg-terracotta/10 text-sm text-terracotta px-3 py-2">
          {erreur}
        </div>
      )}

      {/* (a) Dépôt du fichier */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) void deposerFichier(f);
        }}
        className="rounded-xl2 border border-dashed border-brume bg-creme/40 p-4 flex flex-wrap items-center gap-3"
      >
        <label className={BTN_SECONDAIRE + ' cursor-pointer'}>
          Choisir un fichier
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void deposerFichier(f);
              e.target.value = '';
            }}
          />
        </label>
        <span className="text-sm text-encre/60">
          {fichierNom ? `Fichier : ${fichierNom}` : 'Déposez un .xlsx, .xls ou .csv, ou parcourez.'}
        </span>
      </div>

      {lignes && (
        <>
          {/* (b) Fournisseur du fichier */}
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs text-encre/70 flex flex-col">
              Fournisseur du fichier
              <select
                className={CHAMP + ' mt-1'}
                value={fournisseurId}
                onChange={(e) => choisirFournisseur(e.target.value)}
              >
                <option value="">Sélectionner un fournisseur</option>
                {fournisseurs.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.sigle ? `${f.sigle} · ${f.nom}` : f.nom}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-encre/70 flex flex-col">
              Format des dates
              <select
                className={CHAMP + ' mt-1'}
                value={formatDate}
                onChange={(e) => setFormatDate(e.target.value as FormatDate)}
              >
                {OPTIONS_FORMAT.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* (c) Aperçu + stepper de ligne d'en-tête */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-encre/70">
              <span>Ligne d'en-tête :</span>
              <button type="button" className={BTN_SECONDAIRE + ' px-2 py-1'} onClick={() => decalerEntete(-1)}>
                -
              </button>
              <span className="font-mono">{ligneEntete + 1}</span>
              <button type="button" className={BTN_SECONDAIRE + ' px-2 py-1'} onClick={() => decalerEntete(1)}>
                +
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl2 border border-brume">
              <table className="min-w-full text-xs">
                <thead className="bg-creme/60">
                  <tr>
                    {colonnes.map((c, j) => (
                      <th key={j} className="px-2 py-1.5 text-left font-medium text-marine whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lignesApercu.map((row, r) => (
                    <tr key={r} className="border-t border-brume">
                      {colonnes.map((c, j) => (
                        <td key={j} className="px-2 py-1 whitespace-nowrap text-encre/80">
                          {String(row[c] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* (d) Mapping des colonnes */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {CHAMPS_MAPPABLES.map(({ cle, label }) => (
              <label key={cle} className="text-xs text-encre/70 flex flex-col">
                {label}
                <select
                  className={CHAMP + ' mt-1'}
                  value={mapping[cle] ?? ''}
                  onChange={(e) => setMapping((m) => ({ ...m, [cle]: e.target.value }))}
                >
                  <option value="">(aucune)</option>
                  {colonnes.map((c, j) => (
                    <option key={j} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {/* (e) Analyser */}
          <div>
            <button type="button" className={BTN_PRIMAIRE} onClick={analyser} disabled={!fournisseurId}>
              Analyser
            </button>
            {!fournisseurId && (
              <span className="ml-3 text-xs text-encre/50">Choisissez d'abord un fournisseur.</span>
            )}
          </div>
        </>
      )}

      {/* Résultats de l'analyse */}
      {resultats && (
        <div className="space-y-3 border-t border-brume pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-title font-bold text-marine">
              {resultats.length} ligne{resultats.length > 1 ? 's' : ''} analysée{resultats.length > 1 ? 's' : ''}
              {nbNouvelles > 0 && ` · ${nbNouvelles} nouvelle${nbNouvelles > 1 ? 's' : ''}`}
            </h4>
            {nbNouvelles > 0 && (
              <div className="ml-auto flex flex-wrap gap-2">
                <button type="button" className={BTN_SECONDAIRE + ' text-xs px-2 py-1'} onClick={() => appliquerATous('integrer', true)}>
                  Tout affecter aux défauts
                </button>
                <button type="button" className={BTN_SECONDAIRE + ' text-xs px-2 py-1'} onClick={() => appliquerATous('ignorer')}>
                  Tout ignorer
                </button>
                <button type="button" className={BTN_SECONDAIRE + ' text-xs px-2 py-1'} onClick={() => appliquerATous('reporter')}>
                  Tout reporter
                </button>
              </div>
            )}
          </div>

          <ul className="space-y-3">
            {resultats.map((l, i) => (
              <li key={i} className="rounded-xl2 border border-brume p-3 space-y-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className={'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ' + BADGE[l.verdict].cls}>
                    {BADGE[l.verdict].label}
                  </span>
                  <span className="font-medium text-marine">{l.programmeRef || 'Programme non lu'}</span>
                  {l.envoiRef && (
                    <>
                      <span className="text-encre/40">·</span>
                      <span className="text-encre/70">{l.envoiRef}</span>
                    </>
                  )}
                  {!l.programmeId && l.verdict === 'nouvelle' && (
                    <span className="text-xs text-terracotta">Programme à rattacher</span>
                  )}
                </div>

                {l.verdict === 'nouvelle' ? (
                  <div className="space-y-3">
                    {/* Rattachement de programme si non résolu */}
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="text-xs text-encre/70 flex flex-col">
                        Programme rattaché
                        <select
                          className={CHAMP + ' mt-1'}
                          value={l.programmeId}
                          onChange={(e) => changerProgramme(i, e.target.value)}
                        >
                          <option value="">(non rattaché)</option>
                          {optsProgrammes.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs text-encre/70 flex flex-col">
                        Échéance de réalisation
                        <input
                          type="date"
                          className={CHAMP + ' mt-1'}
                          value={l.dateEcheanceRealisation}
                          onChange={(e) => majLigne(i, { dateEcheanceRealisation: e.target.value })}
                        />
                      </label>
                    </div>

                    <label className="text-xs text-encre/70 block">
                      Automates
                      <div className="mt-1">
                        <SelectMulti
                          options={optsAutomates}
                          selection={l.automateIds}
                          onChange={(next) => majLigne(i, { automateIds: next })}
                        />
                      </div>
                    </label>

                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="text-xs text-encre/70 flex flex-col">
                        Site
                        <select
                          className={CHAMP + ' mt-1'}
                          value={l.siteId}
                          onChange={(e) => majLigne(i, { siteId: e.target.value })}
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
                        Statut initial
                        <select
                          className={CHAMP + ' mt-1'}
                          value={l.statut}
                          onChange={(e) => majLigne(i, { statut: e.target.value as Statut })}
                        >
                          {OPTIONS_STATUT.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs text-encre/70 flex flex-col">
                        Responsable
                        <input
                          className={CHAMP + ' mt-1'}
                          value={l.responsable}
                          onChange={(e) => majLigne(i, { responsable: e.target.value })}
                          placeholder="Initiales ou nom"
                        />
                      </label>
                    </div>

                    {/* Décision par ligne */}
                    <div className="flex flex-wrap gap-2">
                      {(['integrer', 'reporter', 'ignorer'] as ActionCandidat[]).map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => majLigne(i, { action: a })}
                          className={
                            'rounded-full border px-3 py-1 text-xs transition ' +
                            (l.action === a
                              ? 'border-marine bg-marine/10 text-marine font-medium'
                              : 'border-brume bg-surface text-encre/70 hover:border-marine/40')
                          }
                        >
                          {a === 'integrer' ? 'Intégrer' : a === 'reporter' ? 'Reporter (inbox)' : 'Ignorer'}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-encre/60">
                    {l.verdict === 'deja_presente'
                      ? 'Déjà au planning : cette ligne sera ignorée à la validation.'
                      : 'Occurrence proche déjà présente (date différente). À traiter manuellement, non intégrée.'}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2 border-t border-brume pt-3">
            <button type="button" className={BTN_PRIMAIRE} onClick={valider}>
              Valider l'intégration
            </button>
            <button type="button" className={BTN_SECONDAIRE} onClick={reinitialiser}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
