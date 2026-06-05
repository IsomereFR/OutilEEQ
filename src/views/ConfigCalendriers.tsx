// ============================================================================
//  Configuration des calendriers EEQ — rattachement code → automate.
//  Pour chaque organisme (ProBioQual aujourd'hui ; Biologie Prospective / EQAS
//  à venir), on associe chaque code programme à un automate et on active son
//  suivi. Seuls les codes actifs et rattachés alimentent le planning.
// ============================================================================
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNav } from '../store/useNav';
import { CALENDRIERS, codesDuCalendrier } from '../data/calendriers';
import { Topbar } from '../components/Topbar';

export function ConfigCalendriers() {
  const go = useNav((s) => s.go);
  const automates = useStore((s) => s.automates);
  const codeConfigs = useStore((s) => s.codeConfigs);
  const setCodeConfig = useStore((s) => s.setCodeConfig);

  const [orgId, setOrgId] = useState(CALENDRIERS[0]?.id ?? '');
  const cal = CALENDRIERS.find((c) => c.id === orgId);

  const configOf = (code: string) =>
    codeConfigs.find((c) => c.organismeId === orgId && c.code === code);

  const actifs = cal
    ? codesDuCalendrier(cal).filter((ci) => {
        const cfg = configOf(ci.code);
        return cfg?.actif && cfg.automateId;
      }).length
    : 0;

  return (
    <>
      <Topbar
        crumb="Pilotage · Configuration"
        title="Calendriers EEQ — rattachement des codes"
        actions={
          <button className="btn ghost" onClick={() => go('planning')}>
            ← Planning
          </button>
        }
      />
      <div className="page">
        <div className="info-note" style={{ marginBottom: 16 }}>
          Rattachez chaque <b>programme</b> de l'organisme à l'automate concerné, puis activez son
          suivi. Les campagnes des programmes actifs apparaissent dans le planning et basculent
          « à traiter » 15&nbsp;jours avant leur clôture.
        </div>

        {/* Sélecteur d'organisme (extensible) */}
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="card-body" style={{ display: 'flex', gap: 24, alignItems: 'center', padding: 18 }}>
            <div className="field" style={{ maxWidth: 280 }}>
              <label>Organisme</label>
              <select value={orgId} onChange={(e) => setOrgId(e.target.value)}>
                {CALENDRIERS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.organisme} {c.annee}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="small">Codes suivis</div>
              <div style={{ fontWeight: 600, fontFamily: 'var(--mono)' }}>
                {actifs} / {cal ? codesDuCalendrier(cal).length : 0}
              </div>
            </div>
            <div className="small" style={{ marginLeft: 'auto', maxWidth: 280 }}>
              À venir : <b>EQAS</b> (chargé de la même façon).
            </div>
          </div>
        </div>

        <div className="card">
          <h3>
            Codes du calendrier <span className="tag">{cal?.organisme}</span>
          </h3>
          <table className="table">
            <thead>
              <tr>
                <th>Programme</th>
                <th>Analytes</th>
                <th>Occ.</th>
                <th>Automate rattaché</th>
                <th>Suivi</th>
              </tr>
            </thead>
            <tbody>
              {cal &&
                codesDuCalendrier(cal).map((ci) => {
                  const cfg = configOf(ci.code);
                  // Code court distinct du libellé (ProBioQual) → affiché en réf.
                  const codeCourt = ci.code !== ci.programme ? ci.code : '';
                  return (
                    <tr key={ci.code}>
                      <td style={{ maxWidth: 340 }}>
                        <div style={{ fontWeight: 500 }}>{ci.programme}</div>
                        {codeCourt && <span className="ref small">{codeCourt}</span>}
                      </td>
                      <td className="small" style={{ maxWidth: 320 }}>
                        {ci.analytes ? ci.analytes.replace(/;\s*Commentaire.*$/i, '') : '—'}
                      </td>
                      <td className="num">{ci.occurrences}</td>
                      <td>
                        <select
                          value={cfg?.automateId ?? ''}
                          onChange={(e) =>
                            setCodeConfig(orgId, ci.code, {
                              automateId: e.target.value || null,
                            })
                          }
                        >
                          <option value="">— non rattaché —</option>
                          {automates.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.nom}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={Boolean(cfg?.actif)}
                            disabled={!cfg?.automateId}
                            onChange={(e) => setCodeConfig(orgId, ci.code, { actif: e.target.checked })}
                          />
                          <span>{cfg?.actif ? 'Actif' : 'Inactif'}</span>
                        </label>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
