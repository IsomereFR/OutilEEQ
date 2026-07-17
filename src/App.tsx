import { useEffect } from 'react';
import { useStore, initStore } from './store/useStore';
import { useNav } from './store/useNav';
import { EnTete } from './ui/EnTete';
import { Dashboard } from './features/dashboard/Dashboard';
import { AdminView } from './features/admin/AdminView';

export function App() {
  const ready = useStore((s) => s.ready);
  const error = useStore((s) => s.error);
  const syncEtat = useStore((s) => s.syncEtat);
  const vue = useNav((s) => s.vue);
  const aller = useNav((s) => s.aller);

  useEffect(() => {
    void initStore();
  }, []);

  // Indicateur de synchro (affiché seulement si la synchro est configurée).
  const badgeSync =
    syncEtat === 'synchro' ? (
      <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-sauge">
        <span className="h-2 w-2 rounded-full bg-sauge" /> Synchronisé
      </span>
    ) : syncEtat === 'hors-ligne' ? (
      <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-ambre">
        <span className="h-2 w-2 rounded-full bg-ambre" /> Hors-ligne · local
      </span>
    ) : null;

  // Accès discret à l'espace administrateur (non mis en avant sur le mur).
  const actions = (
    <>
      {badgeSync}
      {vue === 'dashboard' ? (
      <button
        type="button"
        onClick={() => aller('admin')}
        className="text-xs text-encre/45 hover:text-marine border border-brume rounded-lg px-2.5 py-1.5"
        title="Espace administrateur"
      >
        Admin
      </button>
    ) : (
      <button
        type="button"
        onClick={() => aller('dashboard')}
        className="rounded-lg bg-marine text-white text-sm font-medium px-3 py-2 hover:brightness-110"
      >
        ← Retour à l'affichage
      </button>
      )}
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
        ) : vue === 'admin' ? (
          <AdminView />
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
}
