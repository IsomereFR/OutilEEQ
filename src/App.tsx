import { useEffect, useRef } from 'react';
import { useStore, initStore } from './store/useStore';
import { useNav } from './store/useNav';
import { EnTete } from './ui/EnTete';
import { exporterJSON, lireImportJSON } from './store/backup';
import { Dashboard } from './features/dashboard/Dashboard';
import { Reconcile } from './features/reconcile/Reconcile';

export function App() {
  const ready = useStore((s) => s.ready);
  const error = useStore((s) => s.error);
  const snapshot = useStore((s) => s.snapshot);
  const appliquerImportJSON = useStore((s) => s.appliquerImportJSON);
  const vue = useNav((s) => s.vue);
  const aller = useNav((s) => s.aller);
  const jsonRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void initStore();
  }, []);

  const importerJSON = (file: File) => {
    lireImportJSON(file)
      .then((data) => {
        const remplacer = window.confirm(
          'Importer en REMPLAÇANT toutes les données actuelles ?\n\n' +
            'OK = remplacement total · Annuler = fusion (ajout non destructif)',
        );
        appliquerImportJSON(data, remplacer ? 'remplacement' : 'fusion');
        aller('dashboard');
      })
      .catch((e) => alert(e.message));
  };

  const actions = (
    <>
      <button
        type="button"
        onClick={() => aller(vue === 'reconcile' ? 'dashboard' : 'reconcile')}
        className="rounded-lg bg-terracotta text-white text-sm font-medium px-3 py-2 hover:brightness-105"
      >
        {vue === 'reconcile' ? 'Retour au dashboard' : 'Importer un planning'}
      </button>
      <button
        type="button"
        onClick={() => exporterJSON(snapshot())}
        className="rounded-lg border border-brume bg-surface text-sm px-3 py-2 hover:border-marine/40"
      >
        Exporter
      </button>
      <button
        type="button"
        onClick={() => jsonRef.current?.click()}
        className="rounded-lg border border-brume bg-surface text-sm px-3 py-2 hover:border-marine/40"
      >
        Importer JSON
      </button>
      <input
        ref={jsonRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importerJSON(f);
          e.target.value = '';
        }}
      />
    </>
  );

  return (
    <div className="min-h-full">
      <EnTete actions={actions} />
      {error && (
        <div className="max-w-6xl mx-auto px-6 mt-4" role="alert">
          <div className="rounded-lg border border-terracotta bg-terracotta/10 text-terracotta text-sm px-4 py-2">
            {error}
          </div>
        </div>
      )}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {!ready ? (
          <div className="text-center text-encre/50 py-24">Chargement des données locales</div>
        ) : vue === 'reconcile' ? (
          <Reconcile />
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
}
