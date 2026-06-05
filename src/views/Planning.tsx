// ============================================================================
//  Vue Planning — deux volets :
//   1) Calendriers EEQ des organismes (ProBioQual…) : campagnes des codes
//      configurés (rattachés à un automate + actifs), avec règle stand-by →
//      à traiter (15 j avant clôture) et création de fiche pré-remplie.
//   2) Enquêtes ponctuelles saisies manuellement (historique).
// ============================================================================
import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { useNav } from '../store/useNav';
import { findAutomate, fichesForEnquete, fichesForCampagne } from '../store/selectors';
import { statutEnquete, daysTo } from '../logic/enqueteStatus';
import { statutCampagne, campagneActionnable, JOURS_AVANT_TRAITEMENT } from '../logic/campagneStatus';
import { CALENDRIERS } from '../data/calendriers';
import { fmtDate, monthLabel } from '../utils/format';
import { Topbar } from '../components/Topbar';
import { Chip } from '../components/Chip';
import { Kpi } from '../components/Kpi';
import type { Campagne, Fiche, StatusChip } from '../types/models';

interface LigneCampagne {
  campagne: Campagne;
  organisme: string;
  organismeId: string;
  automateId: string;
  fiche: Fiche | undefined;
  statut: StatusChip;
}

export function Planning() {
  const go = useNav((s) => s.go);
  const addEnquete = useStore((s) => s.addEnquete);
  const createFicheFromCampagne = useStore((s) => s.createFicheFromCampagne);
  const fiches = useStore((s) => s.fiches);
  const enquetes = useStore((s) => s.enquetes);
  const automates = useStore((s) => s.automates);
  const codeConfigs = useStore((s) => s.codeConfigs);

  const [voirStandby, setVoirStandby] = useState(false);

  // --- Campagnes des codes configurés (actifs + rattachés) ---
  const campagnes = useMemo<LigneCampagne[]>(() => {
    const out: LigneCampagne[] = [];
    for (const cal of CALENDRIERS) {
      for (const camp of cal.campagnes) {
        const cfg = codeConfigs.find((c) => c.organismeId === cal.id && c.code === camp.code);
        if (!cfg || !cfg.actif || !cfg.automateId) continue;
        const liees = fichesForCampagne(fiches, camp.id);
        out.push({
          campagne: camp,
          organisme: cal.organisme,
          organismeId: cal.id,
          automateId: cfg.automateId,
          fiche: liees[0],
          statut: statutCampagne(camp, liees),
        });
      }
    }
    return out.sort((a, b) => a.campagne.dateFin.localeCompare(b.campagne.dateFin));
  }, [fiches, codeConfigs]);

  // KPIs calendriers.
  const kc = { aTraiter: 0, standby: 0, encours: 0, clos: 0 };
  campagnes.forEach((l) => {
    const k = l.statut.key;
    if (k === 'a-traiter' || k === 'echue') kc.aTraiter++;
    else if (k === 'standby') kc.standby++;
    else if (k === 'encours') kc.encours++;
    else kc.clos++;
  });

  // Lignes visibles (stand-by masqué par défaut pour éviter le bruit).
  const visibles = voirStandby ? campagnes : campagnes.filter((l) => l.statut.key !== 'standby');

  // --- Enquêtes ponctuelles (manuelles) ---
  const list = enquetes
    .slice()
    .sort((a, b) => (a.dateReceptionPrevue || '9999').localeCompare(b.dateReceptionPrevue || '9999'));
  const aucunConfig = codeConfigs.filter((c) => c.actif && c.automateId).length === 0;

  const creerFiche = (l: LigneCampagne) => {
    go('fiche', createFicheFromCampagne(l.campagne, l.organisme, l.automateId));
  };

  let curMonth: string | null = null;

  return (
    <>
      <Topbar
        crumb="Pilotage"
        title="Planning des enquêtes"
        actions={
          <>
            <button className="btn ghost" onClick={() => go('config')}>
              ⚙ Configurer les codes
            </button>
            <button className="btn primary" onClick={() => go('enquete', addEnquete())}>
              + Enquête ponctuelle
            </button>
          </>
        }
      />
      <div className="page">
        {/* ---------- Volet 1 : calendriers organismes ---------- */}
        <div className="kpis">
          <Kpi tone="warn" label="À traiter (≤ 15 j)" value={kc.aTraiter} hint="fiche à créer" />
          <Kpi tone="info" label="Reçues · en cours" value={kc.encours} hint="fiche ouverte" />
          <Kpi tone="neutral" label="En stand-by" value={kc.standby} hint="clôture lointaine" />
          <Kpi tone="ok" label="Clôturées" value={kc.clos} hint="campagnes traitées" />
        </div>

        <div className="card" style={{ marginBottom: 22 }}>
          <h3>
            Calendriers EEQ
            <span className="tag">campagnes des codes suivis</span>
          </h3>
          {aucunConfig ? (
            <div className="empty">
              <div className="em">⚙</div>
              Aucun code suivi pour l'instant.
              <br />
              <button className="btn primary" style={{ marginTop: 14 }} onClick={() => go('config')}>
                Configurer les codes EEQ
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 18px 0' }}>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={voirStandby}
                    onChange={(e) => setVoirStandby(e.target.checked)}
                  />
                  <span>Afficher les campagnes en stand-by</span>
                </label>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Campagne</th>
                    <th>Organisme</th>
                    <th>Automate</th>
                    <th>Réception</th>
                    <th>Clôture</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.length ? (
                    visibles.flatMap((l) => {
                      const rows = [];
                      const m = monthLabel(l.campagne.dateFin);
                      if (m !== curMonth) {
                        curMonth = m;
                        rows.push(
                          <tr key={`sep-${l.campagne.id}`}>
                            <td colSpan={7} style={{ border: 'none', padding: 0 }}>
                              <div className="month-sep">
                                <span className="mlabel">Clôture · {m}</span>
                                <span className="line" />
                              </div>
                            </td>
                          </tr>,
                        );
                      }
                      const a = findAutomate(automates, l.automateId);
                      const dFin = daysTo(l.campagne.dateFin);
                      const dueCls =
                        l.statut.key === 'echue'
                          ? 'late'
                          : dFin !== null && dFin >= 0 && dFin <= JOURS_AVANT_TRAITEMENT
                            ? 'soon'
                            : '';
                      rows.push(
                        <tr key={l.campagne.id} className="enq-row">
                          <td>
                            <div className="prog">
                              {l.campagne.programme}{' '}
                              <span className="ref" style={{ color: 'var(--muted)' }}>
                                {l.campagne.echantillon}
                              </span>
                            </div>
                            <div className="org">{l.campagne.code} · n°{l.campagne.numero}</div>
                          </td>
                          <td className="small">{l.organisme}</td>
                          <td className="small">{a ? a.nom : '—'}</td>
                          <td className="due">{fmtDate(l.campagne.dateDebut)}</td>
                          <td className={`due ${dueCls}`}>{fmtDate(l.campagne.dateFin)}</td>
                          <td>
                            <Chip status={l.statut} />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {l.fiche ? (
                              <button className="btn ghost" onClick={() => go('fiche', l.fiche!.id)}>
                                Ouvrir →
                              </button>
                            ) : campagneActionnable(l.campagne, []) ? (
                              <button className="btn primary" onClick={() => creerFiche(l)}>
                                + Créer la fiche
                              </button>
                            ) : (
                              <button className="btn ghost" onClick={() => creerFiche(l)} title="Anticiper la création">
                                Anticiper
                              </button>
                            )}
                          </td>
                        </tr>,
                      );
                      return rows;
                    })
                  ) : (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty">
                          <div className="em">✓</div>
                          Aucune campagne à traiter — tout est en stand-by.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* ---------- Volet 2 : enquêtes ponctuelles (manuelles) ---------- */}
        <div className="card">
          <h3>
            Enquêtes ponctuelles <span className="tag">saisies manuelles</span>
          </h3>
          <table className="table">
            <thead>
              <tr>
                <th>Enquête</th>
                <th>Secteur</th>
                <th>Automate(s)</th>
                <th>Réception prévue</th>
                <th>Échéance retour</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {list.length ? (
                (() => {
                  let mois: string | null = null;
                  return list.flatMap((e) => {
                    const st = statutEnquete(e, fichesForEnquete(fiches, e.id));
                    const fs = fichesForEnquete(fiches, e.id);
                    const autos = e.automates
                      .map((id) => findAutomate(automates, id)?.nom)
                      .filter((n): n is string => Boolean(n));
                    const dRet = daysTo(e.echeanceRetour);
                    const dueCls =
                      st.key === 'retard'
                        ? 'late'
                        : dRet !== null && dRet >= 0 && dRet <= 15 && st.key !== 'clos-ok' && st.key !== 'clos-nc'
                          ? 'soon'
                          : '';
                    const ncRefs = fs
                      .filter((f) => f.verdict === 'non-conforme' && f.refFNC)
                      .map((f) => f.refFNC);
                    const rows = [];
                    const m = monthLabel(e.dateReceptionPrevue);
                    if (m !== mois) {
                      mois = m;
                      rows.push(
                        <tr key={`sep-${e.id}`}>
                          <td colSpan={6} style={{ border: 'none', padding: 0 }}>
                            <div className="month-sep">
                              <span className="mlabel">{m}</span>
                              <span className="line" />
                            </div>
                          </td>
                        </tr>,
                      );
                    }
                    rows.push(
                      <tr key={e.id} className="enq-row clickable" onClick={() => go('enquete', e.id)}>
                        <td>
                          <div className="prog">
                            {e.programme}{' '}
                            <span className="ref" style={{ color: 'var(--muted)' }}>
                              {e.reference}
                            </span>
                          </div>
                          <div className="org">
                            {e.organisme} · {e.periodicite || ''}
                          </div>
                        </td>
                        <td>{e.secteur}</td>
                        <td className="small">
                          {autos.length
                            ? autos.map((n, i) => (
                                <span key={i}>
                                  {n}
                                  {i < autos.length - 1 && <br />}
                                </span>
                              ))
                            : '—'}
                        </td>
                        <td className="due">{fmtDate(e.dateReceptionPrevue)}</td>
                        <td className={`due ${dueCls}`}>{fmtDate(e.echeanceRetour)}</td>
                        <td>
                          <Chip status={st} />
                          {ncRefs.length > 0 && (
                            <div
                              className="small"
                              style={{ marginTop: 4, color: 'var(--bad)', fontFamily: 'var(--mono)' }}
                            >
                              {ncRefs.join(', ')}
                            </div>
                          )}
                        </td>
                      </tr>,
                    );
                    return rows;
                  });
                })()
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <div className="em">▦</div>
                      Aucune enquête ponctuelle.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
