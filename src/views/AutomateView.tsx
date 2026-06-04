// ============================================================================
//  Vue Automate — carte d'information + table des fiches de suivi EEQ/CNQ.
//  Les actions (création/suppression de fiche, suppression d'automate) passent
//  par le store ; la réactivité est automatique (aucun render manuel).
// ============================================================================
import { useStore } from '../store/useStore';
import { useNav } from '../store/useNav';
import { findAutomate, fichesForAutomate } from '../store/selectors';
import { stepIndex, statutFiche } from '../logic/ficheStatus';
import { fmtDate } from '../utils/format';
import { Topbar } from '../components/Topbar';
import { Chip } from '../components/Chip';

export function AutomateView({ id }: { id: string | null }) {
  const go = useNav((s) => s.go);
  const automates = useStore((s) => s.automates);
  const fiches = useStore((s) => s.fiches);
  // Actions du store (hors souscription : pas de re-render inutile).
  const addFiche = useStore((s) => s.addFiche);
  const deleteAutomate = useStore((s) => s.deleteAutomate);

  const a = findAutomate(automates, id);
  if (!a) {
    go('dashboard');
    return null;
  }

  // Fiches de l'automate, triées par date de réception décroissante.
  const fs = fichesForAutomate(fiches, a.id)
    .slice()
    .sort((x, y) => (y.dateReception || '').localeCompare(x.dateReception || ''));

  // new-fiche : crée une fiche puis ouvre son formulaire.
  const newFiche = () => go('fiche', addFiche(a.id));

  // del-auto : suppression confirmée puis retour au tableau de bord.
  const delAuto = () => {
    if (!confirm('Supprimer cet automate et toutes ses fiches ?')) return;
    deleteAutomate(a.id);
    go('dashboard');
  };

  return (
    <>
      <Topbar
        crumb={`Automate · ${a.secteur}`}
        title={a.nom}
        actions={
          <button className="btn primary" onClick={newFiche}>
            + Nouvelle fiche EEQ
          </button>
        }
      />
      <div className="page" id="page">
        {/* Carte d'information de l'automate */}
        <div className="card" style={{ marginBottom: 18 }}>
          <div
            className="card-body"
            style={{ display: 'flex', gap: 30, padding: 18, alignItems: 'center' }}
          >
            <div>
              <div className="small">Fournisseur / modèle</div>
              <div style={{ fontWeight: 600 }}>{a.modele || '—'}</div>
            </div>
            <div>
              <div className="small">Secteur technique</div>
              <div style={{ fontWeight: 600 }}>{a.secteur}</div>
            </div>
            <div>
              <div className="small">N° inventaire</div>
              <div style={{ fontWeight: 600, fontFamily: 'var(--mono)' }}>{a.inventaire || '—'}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div className="small">Campagnes</div>
              <div style={{ fontWeight: 600, fontFamily: 'var(--mono)' }}>{fs.length}</div>
            </div>
            <button className="icon-btn" title="Supprimer l'automate" onClick={delAuto}>
              🗑
            </button>
          </div>
        </div>

        {/* Table des fiches de suivi */}
        <div className="card">
          <h3>Fiches de suivi EEQ / CNQ</h3>
          {fs.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Secteur</th>
                  <th>Réception</th>
                  <th>Avancement</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {fs.map((f) => (
                  <tr
                    key={f.id}
                    className="clickable"
                    onClick={() => go('fiche', f.id)}
                  >
                    <td>
                      <span className="ref">{f.reference}</span>
                      <div className="small">{f.organisme}</div>
                    </td>
                    <td>{f.secteur}</td>
                    <td className="small">{fmtDate(f.dateReception)}</td>
                    <td>
                      <div className="small" style={{ fontFamily: 'var(--mono)' }}>
                        {stepIndex(f)}/6 étapes
                      </div>
                    </td>
                    <td>
                      <Chip status={statutFiche(f)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">
              <div className="em">🧪</div>
              Aucune fiche pour cet automate.
              <br />
              <button className="btn primary" style={{ marginTop: 14 }} onClick={newFiche}>
                + Créer la première fiche
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
