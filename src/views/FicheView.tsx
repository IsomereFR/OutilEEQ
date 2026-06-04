// ============================================================================
//  Vue Fiche EEQ/CNQ — formulaire complet (LA vue centrale de l'application).
//  Stepper + 6 parties + module d'analyse des analytes (écart %, z-score,
//  barre de position, statut) + synthèse automatique + traçabilité FNC/Kalilab.
//  Les contrôles sont CONTRÔLÉS : chaque saisie passe par le store, la
//  réactivité (z-scores, stepper, synthèse) est automatique — aucun render().
// ============================================================================
import type { ChangeEvent } from 'react';
import type { Fiche, Analyte } from '../types/models';
import { useStore } from '../store/useStore';
import { useNav } from '../store/useNav';
import { useToast } from '../store/useToast';
import { findAutomate, findEnquete } from '../store/selectors';
import { stepIndex } from '../logic/ficheStatus';
import { ecartPct, zscore, analyteEval, syntheseAnalytes } from '../logic/calculations';
import { Topbar } from '../components/Topbar';
import { Stepper } from '../components/Stepper';
import { Field, Section } from '../components/Field';
import { ZBar } from '../components/ZBar';

/** Formate un nombre signé : signe + explicite si positif, selon le nb de décimales. */
function fmtSigne(n: number, decimales: number): string {
  return (n > 0 ? '+' : '') + n.toFixed(decimales);
}

export function FicheView({ id }: { id: string | null }) {
  const go = useNav((s) => s.go);
  const fiches = useStore((s) => s.fiches);
  const automates = useStore((s) => s.automates);
  const enquetes = useStore((s) => s.enquetes);
  // Actions du store (hors souscription).
  const updateFiche = useStore((s) => s.updateFiche);
  const deleteFiche = useStore((s) => s.deleteFiche);
  const setVerdict = useStore((s) => s.setVerdict);
  const addAnalyte = useStore((s) => s.addAnalyte);
  const updateAnalyte = useStore((s) => s.updateAnalyte);
  const deleteAnalyte = useStore((s) => s.deleteAnalyte);
  const show = useToast((s) => s.show);

  const f = fiches.find((x) => x.id === id);
  if (!f) {
    go('dashboard');
    return null;
  }

  const a = findAutomate(automates, f.automateId);
  const enq = f.enqueteId ? findEnquete(enquetes, f.enqueteId) : undefined;

  // --- Helpers de liaison (contrôles contrôlés) -----------------------------
  // bind : champ texte/date/time/select — value + onChange typés (clé = keyof Fiche).
  const bind = (champ: keyof Fiche) => ({
    value: (f[champ] as string) ?? '',
    onChange: (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => updateFiche(f.id, { [champ]: e.target.value } as Partial<Fiche>),
  });

  // bindAn : champ contrôlé d'un analyte (param/valeur/cible/sd).
  const bindAn = (i: number, k: keyof Analyte) => ({
    value: f.analytes[i][k] ?? '',
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      updateAnalyte(f.id, i, { [k]: e.target.value } as Partial<Analyte>),
  });

  // --- Synthèse automatique des analytes ------------------------------------
  const synth = syntheseAnalytes(f.analytes);

  // --- Verdict --------------------------------------------------------------
  const verdictCls =
    f.verdict === 'conforme' ? 'ok' : f.verdict === 'non-conforme' ? 'bad' : 'pending';
  const verdictTxt =
    f.verdict === 'conforme'
      ? 'Conforme'
      : f.verdict === 'non-conforme'
        ? 'Non conforme'
        : 'Conformité à statuer';

  // --- Suppression de la fiche ----------------------------------------------
  const delFiche = () => {
    if (!confirm('Supprimer définitivement cette fiche ?')) return;
    deleteFiche(f.id);
    go('automate', f.automateId);
  };

  return (
    <>
      <Topbar
        crumb={
          <>
            {enq && (
              <>
                <a
                  href="#"
                  style={{ color: 'inherit' }}
                  onClick={(e) => {
                    e.preventDefault();
                    go('enquete', enq.id);
                  }}
                >
                  Enquête {enq.reference}
                </a>{' '}
                ·{' '}
              </>
            )}
            <a
              href="#"
              style={{ color: 'inherit' }}
              onClick={(e) => {
                e.preventDefault();
                go('automate', f.automateId);
              }}
            >
              {a ? a.nom : 'Automate'}
            </a>{' '}
            · Fiche EEQ
          </>
        }
        title={f.reference || 'Nouvelle fiche'}
        actions={
          <button className="btn ghost" onClick={() => go('automate', f.automateId)}>
            ← Retour
          </button>
        }
      />

      <div className="page" id="page">
        <Stepper current={stepIndex(f)} />

        {/* 1. Partie administrative */}
        <Section ix={1} title="Partie administrative">
          <div className="fgrid">
            <Field label="Type de contrôle">
              <select {...bind('type')}>
                <option value="EEQ">EEQ</option>
                <option value="CNQ">CNQ</option>
              </select>
            </Field>
            <Field label="Organisme">
              <input type="text" {...bind('organisme')} />
            </Field>
            <Field label="Référence du contrôle">
              <input type="text" {...bind('reference')} />
            </Field>
            <Field label="Secteur(s) technique(s)">
              <input type="text" {...bind('secteur')} />
            </Field>
            <Field label="N° Clarilab / SMQ">
              <input type="text" {...bind('nClarilab')} />
            </Field>
            <Field label="Date d'envoi (organisme)">
              <input type="date" {...bind('dateEnvoi')} />
            </Field>
            <Field label="Date de réception">
              <input type="date" {...bind('dateReception')} />
            </Field>
            <Field label="Par">
              <input type="text" placeholder="Initiales" {...bind('parReception')} />
            </Field>
            <Field label="Date de clôture">
              <input type="date" {...bind('dateCloture')} />
            </Field>
            <Field label="Réception service concerné">
              <input type="date" {...bind('dateReceptionService')} />
            </Field>
            <Field label="Par">
              <input type="text" placeholder="Initiales" {...bind('parService')} />
            </Field>
            <Field label="Conformité de la température">
              <select {...bind('tempConforme')}>
                <option value=""></option>
                <option value="Conforme">Conforme</option>
                <option value="Non conforme (→ FNC)">Non conforme (→ FNC)</option>
              </select>
            </Field>
            <Field label="Enceinte de stockage avant analyse" span={2}>
              <input
                type="text"
                placeholder="Réfrigérateur 4°C, congélateur -20°C…"
                {...bind('enceinteStockage')}
              />
            </Field>
          </div>
        </Section>

        {/* 2. Reconstitution / stabilisation */}
        <Section ix={2} title="Reconstitution / stabilisation" req="à saisir le cas échéant">
          <div className="fgrid">
            <Field label="Date de reconstitution">
              <input type="date" {...bind('dateReconstitution')} />
            </Field>
            <Field label="Heure de reconstitution">
              <input type="time" {...bind('heureReconstitution')} />
            </Field>
            <Field label="Par">
              <input type="text" placeholder="Initiales" {...bind('parReconstitution')} />
            </Field>
            <Field label="Micropipette (n° inventaire)">
              <input type="text" {...bind('micropipette')} />
            </Field>
            <Field label="Remarque (stabilité, conditions…)" span={3}>
              <textarea {...bind('remarqueRecon')} />
            </Field>
          </div>
        </Section>

        {/* 3. Partie analytique */}
        <Section ix={3} title="Partie analytique" req="à saisir impérativement">
          <div className="fgrid">
            <Field label="Date d'analyse">
              <input type="date" {...bind('dateAnalyse')} />
            </Field>
            <Field label="Par">
              <input type="text" placeholder="Initiales" {...bind('parAnalyse')} />
            </Field>
            <Field label="Remarque" span={3}>
              <textarea {...bind('remarqueAnalyse')} />
            </Field>
          </div>
        </Section>

        {/* 4. Envoi des résultats */}
        <Section ix={4} title="Envoi des résultats">
          <div className="fgrid">
            <Field label="Mode d'envoi des résultats">
              <select {...bind('modeEnvoi')}>
                <option value=""></option>
                <option value="Saisie manuelle">Saisie manuelle</option>
                <option value="Connexion">Connexion</option>
                <option value="Portail organisme">Portail organisme</option>
              </select>
            </Field>
            <Field label="Date d'envoi">
              <input type="date" {...bind('dateEnvoiResultats')} />
            </Field>
            <Field label="Par">
              <input type="text" placeholder="Initiales" {...bind('parEnvoi')} />
            </Field>
            <Field label="Saisie vérifiée le">
              <input type="date" {...bind('saisieVerifieeLe')} />
            </Field>
            <Field label="Par">
              <input type="text" placeholder="Initiales" {...bind('parSaisie')} />
            </Field>
            <Field label="Connexion vérifiée">
              <select {...bind('connexionVerifiee')}>
                <option value=""></option>
                <option value="Conforme">Conforme</option>
                <option value="Non conforme">Non conforme</option>
                <option value="N/A">N/A</option>
              </select>
            </Field>
            <Field label="Par">
              <input type="text" placeholder="Initiales" {...bind('parConnexion')} />
            </Field>
            <Field label="Résultats automate (référence / chemin)" span={2}>
              <input type="text" placeholder="Réf. du fichier joint" {...bind('resultatsAutomate')} />
            </Field>
          </div>
        </Section>

        {/* 5. Réception des résultats */}
        <Section ix={5} title="Réception des résultats">
          <div className="fgrid">
            <Field label="Date de réception du rapport">
              <input type="date" {...bind('dateReceptionRapport')} />
            </Field>
            <Field label="Par">
              <input type="text" placeholder="Initiales" {...bind('parReceptionRapport')} />
            </Field>
            <Field label="Référence rapport BP / organisme">
              <input type="text" {...bind('resultatsBP')} />
            </Field>
          </div>
        </Section>

        {/* 6. Exploitation & analyse des résultats */}
        <Section ix={6} title="Exploitation & analyse des résultats" req="ISO 15189 §7.3.7">
          {/* Bloc verdict */}
          <div className={`verdict ${verdictCls}`}>
            <div>
              <div className="small">Décision de conformité</div>
              <div className="big">{verdictTxt}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button
                className={`btn ${f.verdict === 'conforme' ? 'primary' : ''}`}
                onClick={() => setVerdict(f.id, 'conforme')}
              >
                ✓ Conforme
              </button>
              <button
                className={`btn ${f.verdict === 'non-conforme' ? 'primary' : ''}`}
                onClick={() => setVerdict(f.id, 'non-conforme')}
              >
                ✕ Non conforme
              </button>
            </div>
          </div>

          {/* Module d'analyse des analytes */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ margin: 0, fontSize: 13 }}>Analyse des résultats reçus</h4>
              <button
                className="btn ghost"
                style={{ marginLeft: 'auto' }}
                onClick={() => addAnalyte(f.id)}
              >
                + Ajouter un paramètre
              </button>
            </div>
            <table className="analyte-tbl">
              <thead>
                <tr>
                  <th>Paramètre</th>
                  <th className="num">Valeur</th>
                  <th className="num">Cible/Consensus</th>
                  <th className="num">Écart-type</th>
                  <th className="num">Écart</th>
                  <th className="num">z-score</th>
                  <th>Position (−3 ◦ +3)</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {f.analytes.length ? (
                  f.analytes.map((an, i) => {
                    const z = zscore(an);
                    const ep = ecartPct(an);
                    const ev = analyteEval(an);
                    // Chip de statut selon l'évaluation |z|.
                    const chip =
                      ev === 'conforme' ? (
                        <span className="chip ok">
                          <span className="d"></span>OK
                        </span>
                      ) : ev === 'alerte' ? (
                        <span className="chip warn">
                          <span className="d"></span>Alerte
                        </span>
                      ) : ev === 'hors-limites' ? (
                        <span className="chip bad">
                          <span className="d"></span>Hors limites
                        </span>
                      ) : (
                        <span className="chip neutral">
                          <span className="d"></span>—
                        </span>
                      );
                    return (
                      <tr key={i}>
                        <td>
                          <input placeholder="Paramètre" {...bindAn(i, 'param')} />
                        </td>
                        <td>
                          <input className="num" placeholder="0" {...bindAn(i, 'valeur')} />
                        </td>
                        <td>
                          <input className="num" placeholder="cible" {...bindAn(i, 'cible')} />
                        </td>
                        <td>
                          <input className="num" placeholder="écart-type" {...bindAn(i, 'sd')} />
                        </td>
                        <td className="num">{ep === null ? '—' : `${fmtSigne(ep, 1)} %`}</td>
                        <td
                          className="num"
                          style={{
                            fontWeight: 600,
                            color:
                              z === null
                                ? 'var(--muted)'
                                : Math.abs(z) < 2
                                  ? 'var(--ok)'
                                  : 'var(--bad)',
                          }}
                        >
                          {z === null ? '—' : fmtSigne(z, 2)}
                        </td>
                        <td>
                          <ZBar analyte={an} />
                        </td>
                        <td>{chip}</td>
                        <td>
                          <button className="icon-btn" onClick={() => deleteAnalyte(f.id, i)}>
                            🗑
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="small"
                      style={{ padding: 18, textAlign: 'center' }}
                    >
                      Aucun paramètre saisi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Synthèse automatique */}
            <div
              className="small"
              style={{
                marginTop: 10,
                padding: '10px 12px',
                background: 'var(--paper-2)',
                borderRadius: 8,
              }}
            >
              <b>Synthèse automatique :</b>{' '}
              {synth.evaluables ? (
                <>
                  {synth.dansLimites}/{synth.evaluables} paramètres dans les limites (|z| &lt; 2)
                  {synth.horsLimites > 0 && (
                    <>
                      {' — '}
                      <b style={{ color: 'var(--bad)' }}>{synth.horsLimites} hors limites</b>
                    </>
                  )}
                </>
              ) : (
                'Saisir les résultats du rapport pour calculer les z-scores.'
              )}
            </div>
          </div>

          {/* Traçabilité FNC */}
          <div className="fgrid">
            <Field label="Référence FNC (si non conforme)">
              <input type="text" placeholder="FNC-2026-…" {...bind('refFNC')} />
            </Field>
            <Field label="Présentation au personnel le">
              <input type="date" {...bind('presentationLe')} />
            </Field>
            <Field label="Par">
              <input type="text" placeholder="Initiales" {...bind('parPresentation')} />
            </Field>
            <Field label="Support utilisé" span={2}>
              <input
                type="text"
                placeholder="Kalilab, réunion qualité, affichage…"
                {...bind('supportUtilise')}
              />
            </Field>
          </div>

          {/* Note explicite : la gestion NC reste dans Kalilab */}
          <div className="info-note">
            La gestion de la non-conformité (analyse des causes, actions, CAPA) reste dans Kalilab.
            Saisir ici uniquement le <b>n° de FNC</b> pour assurer la traçabilité du lien EEQ → FNC.
          </div>
        </Section>

        {/* Barre d'enregistrement (sticky) */}
        <div className="save-bar">
          <button className="btn primary" onClick={() => show('Enregistré ✓')}>
            💾 Enregistrer la fiche
          </button>
          <button className="btn" onClick={delFiche}>
            Supprimer
          </button>
          <span className="note">
            Enregistrement automatique à chaque modification · sauvegarde locale
          </span>
        </div>
      </div>
    </>
  );
}
