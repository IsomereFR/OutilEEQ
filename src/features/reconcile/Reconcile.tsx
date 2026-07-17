// ============================================================================
//  Reconcile : module de réconciliation et d'import (PRD F1 à F4).
//  Deux blocs empilés : import d'un planning Excel/CSV, puis inbox des enquêtes
//  existantes non affectées.
// ============================================================================
import { useNav } from '../../store/useNav';
import { Carte, CarteTitre } from '../../ui/Carte';
import { ImportExcel } from './ImportExcel';
import { Inbox } from './Inbox';

export function Reconcile() {
  const aller = useNav((s) => s.aller);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="font-title font-bold text-lg text-marine">Réconciliation et import</h2>
        <button
          type="button"
          onClick={() => aller('dashboard')}
          className="ml-auto rounded-lg border border-brume bg-surface text-sm px-3 py-2 hover:border-marine/40"
        >
          Retour au dashboard
        </button>
      </div>

      <Carte>
        <CarteTitre>Import d'un planning Excel ou CSV</CarteTitre>
        <div className="p-4">
          <ImportExcel />
        </div>
      </Carte>

      <Carte>
        <CarteTitre>Enquêtes en attente d'affectation</CarteTitre>
        <div className="p-4">
          <Inbox />
        </div>
      </Carte>
    </div>
  );
}
