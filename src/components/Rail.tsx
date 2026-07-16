// Barre latérale : identité labo, navigation, liste des automates, export/import.
import { useRef } from 'react';
import { useStore } from '../store/useStore';
import { useNav } from '../store/useNav';
import { useToast } from '../store/useToast';
import { fichesForAutomate } from '../store/selectors';
import { stepIndex } from '../logic/ficheStatus';
import { statutEnquete } from '../logic/enqueteStatus';
import { fichesForEnquete } from '../store/selectors';
import { exportJSON, importJSONFile } from '../utils/portability';

export function Rail() {
  const { name, id, go } = useNav();
  const lab = useStore((s) => s.lab);
  const setLab = useStore((s) => s.setLab);
  const automates = useStore((s) => s.automates);
  const enquetes = useStore((s) => s.enquetes);
  const fiches = useStore((s) => s.fiches);
  const addAutomate = useStore((s) => s.addAutomate);
  const replaceAll = useStore((s) => s.replaceAll);
  const show = useToast((s) => s.show);
  const fileRef = useRef<HTMLInputElement>(null);

  const pending = fiches.filter((f) => stepIndex(f) >= 5 && !f.verdict).length;
  const enRetard = enquetes.filter(
    (e) => statutEnquete(e, fichesForEnquete(fiches, e.id)).key === 'retard',
  ).length;

  const handleExport = () => {
    const s = useStore.getState();
    exportJSON({
      lab,
      automates,
      enquetes,
      fiches,
      codeConfigs: s.codeConfigs,
      audit: s.audit,
    });
    show('Sauvegarde exportée ⤓');
  };
  const handleImport = (file: File) => {
    importJSONFile(file)
      .then((data) => {
        replaceAll(data);
        go('dashboard');
        show('Données importées ✓');
      })
      .catch((e) => alert(e.message));
  };

  const addAuto = () => {
    const nom = prompt('Nom de l’automate :');
    if (!nom) return;
    const secteur = prompt('Secteur technique :', 'Biochimie') || '';
    const newId = addAutomate({ nom, secteur });
    show('Automate ajouté');
    go('automate', newId);
  };

  return (
    <aside className="rail">
      <div className="brand">
        <div className="mark">
          <div>
            <h1>Suivi EEQ</h1>
            <div className="sub">Évaluations externes de la qualité</div>
          </div>
        </div>
        <div className="lab-name">
          <span>🏥</span>
          <input value={lab} onChange={(e) => setLab(e.target.value)} aria-label="Nom du laboratoire" />
        </div>
      </div>

      <nav className="rail-nav">
        <div className="rail-label">Pilotage</div>
        <button className={`nav-item ${name === 'dashboard' ? 'active' : ''}`} onClick={() => go('dashboard')}>
          <span className="ic">◆</span> Tableau de bord
          {pending > 0 && <span className="badge">{pending}</span>}
        </button>
        <button
          className={`nav-item ${name === 'planning' || name === 'enquete' ? 'active' : ''}`}
          onClick={() => go('planning')}
        >
          <span className="ic">▦</span> Planning des enquêtes
          {enRetard > 0 && (
            <span className="badge" style={{ background: 'var(--terra)' }}>
              {enRetard}
            </span>
          )}
        </button>
        <button className={`nav-item ${name === 'config' ? 'active' : ''}`} onClick={() => go('config')}>
          <span className="ic">⚙</span> Configuration EEQ
        </button>

        <div className="rail-label">Automates</div>
        {automates.map((a) => {
          const fs = fichesForAutomate(fiches, a.id);
          const open = fs.filter((f) => stepIndex(f) < 6).length;
          const nc = fs.filter((f) => f.verdict === 'non-conforme').length;
          const col = nc ? 'var(--bad)' : open ? 'var(--warn)' : 'var(--ok)';
          const active = name === 'automate' && id === a.id ? 'active' : '';
          return (
            <button key={a.id} className={`nav-item auto-item ${active}`} onClick={() => go('automate', a.id)}>
              <span className="top">
                <span className="pulse" style={{ background: col }} />
                <span style={{ flex: 1 }}>{a.nom}</span>
                <span className="badge">{fs.length}</span>
              </span>
              <span className="sect">{a.secteur}</span>
            </button>
          );
        })}
        <button className="add-btn" onClick={addAuto}>
          + Ajouter un automate
        </button>
      </nav>

      <div className="rail-foot">
        <button onClick={handleExport}>⤓ Exporter</button>
        <button onClick={() => fileRef.current?.click()}>⤒ Importer</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
            e.target.value = '';
          }}
        />
      </div>
    </aside>
  );
}
