// ============================================================================
//  Vue Dashboard — pilotage : KPIs, campagnes à traiter, conformité par
//  automate (mini-barres) et non-conformités ouvertes.
//  Reproduit le rendu de `renderDashboard` du prototype.
// ============================================================================
import { useStore } from '../store/useStore';
import { useNav } from '../store/useNav';
import { findAutomate, fichesForAutomate } from '../store/selectors';
import { stepIndex, statutFiche } from '../logic/ficheStatus';
import { fmtDate } from '../utils/format';
import { Topbar } from '../components/Topbar';
import { Chip } from '../components/Chip';
import { Kpi } from '../components/Kpi';

export function Dashboard() {
  const go = useNav((s) => s.go);
  const fiches = useStore((s) => s.fiches);
  const automates = useStore((s) => s.automates);

  // --- KPIs ---
  const enCours = fiches.filter((f) => stepIndex(f) < 6).length;
  const aExploiter = fiches.filter((f) => stepIndex(f) >= 5 && !f.verdict).length;
  const clos = fiches.filter((f) => f.verdict);
  const nc = fiches.filter((f) => f.verdict === 'non-conforme');
  const tauxConf = clos.length
    ? Math.round((clos.filter((f) => f.verdict === 'conforme').length / clos.length) * 100)
    : 0;

  // --- Campagnes à traiter : étapes non terminées, triées par date de réception ---
  const todo = fiches
    .filter((f) => stepIndex(f) < 6)
    .slice()
    .sort((a, b) => (a.dateReception || '').localeCompare(b.dateReception || ''))
    .slice(0, 6);

  return (
    <>
      <Topbar crumb="Pilotage" title="Vue d'ensemble" />
      <div className="page" id="page">
        <div className="kpis">
          <Kpi
            tone="info"
            label="Campagnes en cours"
            value={enCours}
            hint={`sur ${fiches.length} fiches au total`}
          />
          <Kpi
            tone="warn"
            label="À exploiter"
            value={aExploiter}
            hint="rapport reçu, conformité à statuer"
          />
          <Kpi
            tone="ok"
            label="Taux de conformité"
            value={
              <>
                {tauxConf}
                <span style={{ fontSize: 18 }}>%</span>
              </>
            }
            hint={`${clos.length} campagne(s) clôturée(s)`}
          />
          <Kpi
            tone="bad"
            label="Non-conformités"
            value={nc.length}
            hint="FNC à suivre dans le SMQ"
          />
        </div>

        <div className="grid2">
          {/* Campagnes à traiter */}
          <div className="card">
            <h3>
              📋 Campagnes à traiter <span className="tag">échéances par réception</span>
            </h3>
            <div className="card-body">
              {todo.length ? (
                todo.map((f) => {
                  const st = statutFiche(f);
                  const a = findAutomate(automates, f.automateId);
                  return (
                    <div
                      key={f.id}
                      className="list-row clickable"
                      onClick={() => go('fiche', f.id)}
                    >
                      <div className="grow">
                        <div className="ttl">{f.reference}</div>
                        <div className="meta">
                          {(a ? a.nom : '') + ' · ' + f.organisme}
                        </div>
                      </div>
                      <div className="meta">{fmtDate(f.dateReception)}</div>
                      <Chip status={st} />
                    </div>
                  );
                })
              ) : (
                <div className="empty">
                  <div className="em">✓</div>
                  Aucune campagne en attente.
                </div>
              )}
            </div>
          </div>

          {/* Conformité par automate (mini-barres) */}
          <div className="card">
            <h3>📈 Conformité par automate</h3>
            <div className="card-body">
              <div className="minichart" style={{ height: 70 }}>
                {automates.map((a) => {
                  const fs = fichesForAutomate(fiches, a.id).filter((f) => f.verdict);
                  const t = fs.length
                    ? Math.round(
                        (fs.filter((f) => f.verdict === 'conforme').length / fs.length) * 100,
                      )
                    : null;
                  const col =
                    t === null
                      ? 'var(--line-strong)'
                      : t >= 90
                        ? 'var(--ok)'
                        : t >= 75
                          ? 'var(--warn)'
                          : 'var(--bad)';
                  return (
                    <div key={a.id} style={{ flex: 1, textAlign: 'center' }}>
                      <div
                        className="b"
                        style={{
                          height: t === null ? 6 : Math.max(8, t * 0.46),
                          background: col,
                        }}
                      />
                      <div
                        className="small"
                        style={{ marginTop: 8, fontWeight: 600, color: 'var(--ink)' }}
                      >
                        {t === null ? '—' : t + '%'}
                      </div>
                      <div
                        className="small"
                        style={{ fontSize: 10, lineHeight: 1.2, marginTop: 2 }}
                      >
                        {a.nom.split(' ')[0]}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="legend">
                <span>
                  <i style={{ background: 'var(--ok)' }} />≥ 90 %
                </span>
                <span>
                  <i style={{ background: 'var(--warn)' }} />75–89 %
                </span>
                <span>
                  <i style={{ background: 'var(--bad)' }} />&lt; 75 %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Non-conformités ouvertes */}
        <div className="card" style={{ marginTop: 18 }}>
          <h3>
            ⚠ Non-conformités ouvertes <span className="tag">lien vers FNC du SMQ</span>
          </h3>
          <div className="card-body">
            {nc.length ? (
              nc.map((f) => {
                const a = findAutomate(automates, f.automateId);
                return (
                  <div
                    key={f.id}
                    className="list-row clickable"
                    onClick={() => go('fiche', f.id)}
                  >
                    <div className="grow">
                      <div className="ttl">{f.reference}</div>
                      <div className="meta">{a ? a.nom : ''}</div>
                    </div>
                    <span className="ref small">{f.refFNC || 'FNC à créer'}</span>
                    <Chip status={{ cls: 'bad', txt: 'Non conforme' }} />
                  </div>
                );
              })
            ) : (
              <div className="empty">
                <div className="em">✓</div>
                Aucune non-conformité.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
