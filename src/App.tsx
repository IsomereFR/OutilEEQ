import { useEffect } from 'react';
import { useStore, initStore } from './store/useStore';
import { useNav } from './store/useNav';
import { Rail } from './components/Rail';
import { Toast } from './components/Toast';
import { Dashboard } from './views/Dashboard';
import { Planning } from './views/Planning';
import { EnqueteView } from './views/EnqueteView';
import { AutomateView } from './views/AutomateView';
import { FicheView } from './views/FicheView';

export function App() {
  const ready = useStore((s) => s.ready);
  const error = useStore((s) => s.error);
  const view = useNav();

  useEffect(() => {
    void initStore();
  }, []);

  if (!ready) {
    return (
      <div className="app">
        <main className="main">
          <div className="empty" style={{ paddingTop: 120 }}>
            <div className="em">⏳</div>
            Chargement des données locales…
          </div>
        </main>
      </div>
    );
  }

  let content: React.ReactNode;
  switch (view.name) {
    case 'dashboard':
      content = <Dashboard />;
      break;
    case 'planning':
      content = <Planning />;
      break;
    case 'enquete':
      content = <EnqueteView id={view.id} />;
      break;
    case 'automate':
      content = <AutomateView id={view.id} />;
      break;
    case 'fiche':
      content = <FicheView id={view.id} />;
      break;
    default:
      content = <Dashboard />;
  }

  return (
    <div className="app">
      <Rail />
      <main className="main">
        {error && (
          <div className="error-banner" role="alert">
            ⚠ {error}
          </div>
        )}
        {content}
      </main>
      <Toast />
    </div>
  );
}
