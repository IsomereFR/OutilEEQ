// ============================================================================
//  Vue Planning — programme annuel des enquêtes EEQ.
//  KPIs, tableau trié par réception prévue avec séparateurs mensuels et
//  échéances colorées. Reproduit le rendu de `renderPlanning` du prototype.
// ============================================================================
import { useStore } from '../store/useStore';
import { useNav } from '../store/useNav';
import { findAutomate, fichesForEnquete } from '../store/selectors';
import { statutEnquete, daysTo } from '../logic/enqueteStatus';
import { fmtDate, monthLabel } from '../utils/format';
import { Topbar } from '../components/Topbar';
import { Chip } from '../components/Chip';
import { Kpi } from '../components/Kpi';

export function Planning() {
  const go = useNav((s) => s.go);
  const addEnquete = useStore((s) => s.addEnquete);
  const fiches = useStore((s) => s.fiches);
  const enquetes = useStore((s) => s.enquetes);
  const automates = useStore((s) => s.automates);

  // --- Tri par date de réception prévue (les sans-date en dernier) ---
  const list = enquetes
    .slice()
    .sort((a, b) =>
      (a.dateReceptionPrevue || '9999').localeCompare(b.dateReceptionPrevue || '9999'),
    );

  // --- Comptage des KPIs par statut ---
  const k = { planif: 0, avenir: 0, retard: 0, recue: 0 };
  list.forEach((e) => {
    const s = statutEnquete(e, fichesForEnquete(fiches, e.id)).key;
    if (s === 'retard') k.retard++;
    else if (s === 'avenir') k.avenir++;
    else if (s === 'planif') k.planif++;
    else k.recue++;
  });

  // --- Bouton « + Planifier une enquête » : crée puis navigue vers la fiche ---
  const onAdd = () => {
    const id = addEnquete();
    go('enquete', id);
  };

  // Mois courant pour insérer les séparateurs mensuels au fil du parcours.
  let curMonth: string | null = null;

  return (
    <>
      <Topbar
        crumb="Pilotage"
        title="Planning des enquêtes"
        actions={
          <button className="btn primary" onClick={onAdd}>
            + Planifier une enquête
          </button>
        }
      />
      <div className="page" id="page">
        <div className="kpis">
          <Kpi tone="info" label="Enquêtes planifiées" value={list.length} hint="programme annuel" />
          <Kpi tone="warn" label="À venir (≤ 30 j)" value={k.avenir} hint="à anticiper" />
          <Kpi tone="bad" label="En retard" value={k.retard} hint="à réceptionner" />
          <Kpi tone="ok" label="Reçues / clôturées" value={k.recue} hint="fiche créée" />
        </div>

        <div className="info-note" style={{ marginBottom: 16 }}>
          Le planning définit le <b>programme annuel d'EEQ</b> (ISO 15189 §7.3.7.2). Chaque enquête,
          une fois reçue, génère la fiche de suivi pour le(s) automate(s) concerné(s).
        </div>

        <div className="card">
          <h3>
            Programme des enquêtes <span className="tag">trié par réception prévue</span>
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
                list.flatMap((e) => {
                  const st = statutEnquete(e, fichesForEnquete(fiches, e.id));
                  const fs = fichesForEnquete(fiches, e.id);
                  const autos = e.automates
                    .map((id) => findAutomate(automates, id)?.nom)
                    .filter((n): n is string => Boolean(n));
                  const dRet = daysTo(e.echeanceRetour);
                  const dueCls =
                    st.key === 'retard'
                      ? 'late'
                      : dRet !== null &&
                          dRet >= 0 &&
                          dRet <= 15 &&
                          st.key !== 'clos-ok' &&
                          st.key !== 'clos-nc'
                        ? 'soon'
                        : '';
                  const ncRefs = fs
                    .filter((f) => f.verdict === 'non-conforme' && f.refFNC)
                    .map((f) => f.refFNC);

                  const rows = [];

                  // Séparateur mensuel lorsqu'on change de mois.
                  const m = monthLabel(e.dateReceptionPrevue);
                  if (m !== curMonth) {
                    curMonth = m;
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
                    <tr
                      key={e.id}
                      className="enq-row clickable"
                      onClick={() => go('enquete', e.id)}
                    >
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
                            style={{
                              marginTop: 4,
                              color: 'var(--bad)',
                              fontFamily: 'var(--mono)',
                            }}
                          >
                            {ncRefs.join(', ')}
                          </div>
                        )}
                      </td>
                    </tr>,
                  );

                  return rows;
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <div className="em">▦</div>
                      Aucune enquête planifiée.
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
