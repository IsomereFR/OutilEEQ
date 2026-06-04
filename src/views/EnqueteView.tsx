// ============================================================================
//  Vue Enquête (détail planning) — définition de l'enquête (champs contrôlés),
//  sélection des automates concernés, et fiches de suivi rattachées.
//  Tous les inputs sont contrôlés : value depuis le store, onChange => update.
//  L'enregistrement est automatique à chaque modification (aucun render manuel).
// ============================================================================
import { useStore } from '../store/useStore';
import { useNav } from '../store/useNav';
import { useToast } from '../store/useToast';
import { findEnquete, fichesForEnquete } from '../store/selectors';
import { statutEnquete } from '../logic/enqueteStatus';
import { statutFiche } from '../logic/ficheStatus';
import { fmtDate } from '../utils/format';
import { Topbar } from '../components/Topbar';
import { Chip } from '../components/Chip';
import { Field, Section } from '../components/Field';

/** Options de périodicité du programme annuel. */
const PERIODICITES = ['', 'Mensuelle', 'Trimestrielle', 'Semestrielle', 'Annuelle', '2 / an', '3 / an'];

export function EnqueteView({ id }: { id: string | null }) {
  const go = useNav((s) => s.go);
  const show = useToast((s) => s.show);
  const enquetes = useStore((s) => s.enquetes);
  const automates = useStore((s) => s.automates);
  const fiches = useStore((s) => s.fiches);
  // Actions du store.
  const updateEnquete = useStore((s) => s.updateEnquete);
  const deleteEnquete = useStore((s) => s.deleteEnquete);
  const toggleEnqueteAutomate = useStore((s) => s.toggleEnqueteAutomate);
  const createFicheFromEnquete = useStore((s) => s.createFicheFromEnquete);

  const e = findEnquete(enquetes, id);
  if (!e) {
    go('planning');
    return null;
  }

  // Fiches rattachées à cette enquête.
  const fs = fichesForEnquete(fiches, e.id);
  const st = statutEnquete(e, fs);

  // del-enquete : suppression confirmée puis retour au planning.
  const delEnquete = () => {
    if (!confirm("Supprimer cette enquête ?")) return;
    deleteEnquete(e.id);
    go('planning');
  };

  return (
    <>
      <Topbar
        crumb={
          <>
            <a
              href="#"
              style={{ color: 'inherit' }}
              onClick={(ev) => {
                ev.preventDefault();
                go('planning');
              }}
            >
              Planning
            </a>{' '}
            · Enquête
          </>
        }
        title={`${e.programme || 'Enquête'} ${e.reference || ''}`}
        actions={
          <button className="btn ghost" onClick={() => go('planning')}>
            ← Retour
          </button>
        }
      />
      <div className="page" id="page">
        {/* Bandeau statut + échéance de retour */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <Chip status={st} style={{ fontSize: 13, padding: '6px 14px' }} />
          <span className="small">
            Échéance de retour : <b>{fmtDate(e.echeanceRetour)}</b>
          </span>
        </div>

        {/* Définition de l'enquête — champs contrôlés */}
        <Section ix="▦" title="Définition de l'enquête">
          <div className="fgrid">
            <Field label="Organisme">
              <input
                type="text"
                value={e.organisme}
                placeholder="Biologie Prospective, ProBioQual…"
                onChange={(ev) => updateEnquete(e.id, { organisme: ev.target.value })}
              />
            </Field>
            <Field label="Programme">
              <input
                type="text"
                value={e.programme}
                placeholder="Biochimie, Hémostase…"
                onChange={(ev) => updateEnquete(e.id, { programme: ev.target.value })}
              />
            </Field>
            <Field label="Référence de l'enquête">
              <input
                type="text"
                value={e.reference}
                placeholder="2026-03"
                onChange={(ev) => updateEnquete(e.id, { reference: ev.target.value })}
              />
            </Field>
            <Field label="Secteur technique">
              <input
                type="text"
                value={e.secteur}
                onChange={(ev) => updateEnquete(e.id, { secteur: ev.target.value })}
              />
            </Field>
            <Field label="Périodicité">
              <select
                value={e.periodicite}
                onChange={(ev) => updateEnquete(e.id, { periodicite: ev.target.value })}
              >
                {PERIODICITES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Réception prévue">
              <input
                type="date"
                value={e.dateReceptionPrevue}
                onChange={(ev) => updateEnquete(e.id, { dateReceptionPrevue: ev.target.value })}
              />
            </Field>
            <Field label="Échéance de retour des résultats">
              <input
                type="date"
                value={e.echeanceRetour}
                onChange={(ev) => updateEnquete(e.id, { echeanceRetour: ev.target.value })}
              />
            </Field>
            <Field label="Automate(s) concerné(s)" span={3}>
              <div className="autopick">
                {automates.map((a) => {
                  const on = e.automates.includes(a.id);
                  return (
                    <label key={a.id} className={on ? 'on' : ''}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleEnqueteAutomate(e.id, a.id)}
                      />
                      {a.nom}
                    </label>
                  );
                })}
              </div>
            </Field>
            <Field label="Remarque" span={3}>
              <textarea
                value={e.remarque}
                onChange={(ev) => updateEnquete(e.id, { remarque: ev.target.value })}
              />
            </Field>
          </div>
        </Section>

        {/* Fiches de suivi rattachées */}
        <Section ix="✓" title="Fiches de suivi rattachées" req="une fiche par automate">
          {e.automates.length ? (
            e.automates.map((aid) => {
              const a = automates.find((x) => x.id === aid);
              if (!a) return null;
              const f = fs.find((x) => x.automateId === aid);
              if (f) {
                return (
                  <div className="list-row" key={aid}>
                    <div className="grow">
                      <div className="ttl">{a.nom}</div>
                      <div className="meta">{f.reference}</div>
                    </div>
                    <Chip status={statutFiche(f)} />
                    <button className="btn ghost" onClick={() => go('fiche', f.id)}>
                      Ouvrir →
                    </button>
                  </div>
                );
              }
              return (
                <div className="list-row" key={aid}>
                  <div className="grow">
                    <div className="ttl">{a.nom}</div>
                    <div className="meta" style={{ color: 'var(--terra)' }}>
                      Aucune fiche — à créer à réception
                    </div>
                  </div>
                  <button
                    className="btn primary"
                    onClick={() => go('fiche', createFicheFromEnquete(e.id, aid))}
                  >
                    + Créer la fiche
                  </button>
                </div>
              );
            })
          ) : (
            <div className="small" style={{ padding: 14 }}>
              Sélectionner au moins un automate ci-dessus.
            </div>
          )}
        </Section>

        {/* Barre d'enregistrement */}
        <div className="save-bar">
          <button className="btn primary" onClick={() => show('Enregistré ✓')}>
            💾 Enregistrer
          </button>
          <button className="btn" onClick={delEnquete}>
            Supprimer l'enquête
          </button>
          <span className="note">Enregistrement automatique à chaque modification</span>
        </div>
      </div>
    </>
  );
}
