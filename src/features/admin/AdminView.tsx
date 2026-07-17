// ============================================================================
//  Espace ADMINISTRATEUR (non visible sur le mur d'affichage).
//  Regroupe l'intégration (import Excel + réconciliation), l'affectation aux
//  automates (inbox), la gestion des campagnes (liste éditable) et la
//  sauvegarde JSON (export / import).
// ============================================================================
import { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { exporterJSON, lireImportJSON } from '../../store/backup';
import { appliquerFiltres, type Filtres as FiltresValeurs } from '../../domain/vues';
import { Reconcile } from '../reconcile/Reconcile';
import { AttributionProgrammes } from './AttributionProgrammes';
import { Filtres } from '../dashboard/Filtres';
import { ListePriorisee } from '../dashboard/ListePriorisee';
import { Carte } from '../../ui/Carte';

export function AdminView() {
  const enquetes = useStore((s) => s.enquetes);
  const programmes = useStore((s) => s.programmes);
  const snapshot = useStore((s) => s.snapshot);
  const appliquerImportJSON = useStore((s) => s.appliquerImportJSON);
  const [filtres, setFiltres] = useState<FiltresValeurs>({});
  const jsonRef = useRef<HTMLInputElement>(null);

  // La liste éditable porte sur les enquêtes affectées (l'inbox gère le reste).
  const visibles = appliquerFiltres(
    enquetes.filter((e) => e.affectee),
    filtres,
    programmes,
  );

  const importerJSON = (file: File) => {
    lireImportJSON(file)
      .then((data) => {
        const remplacer = window.confirm(
          'Importer en REMPLAÇANT toutes les données actuelles ?\n\n' +
            'OK = remplacement total · Annuler = fusion (ajout non destructif)',
        );
        appliquerImportJSON(data, remplacer ? 'remplacement' : 'fusion');
      })
      .catch((e) => alert(e.message));
  };

  return (
    <div className="space-y-5">
      {/* Barre de sauvegarde */}
      <Carte className="p-4 flex flex-wrap items-center gap-3">
        <div className="text-sm">
          <div className="font-title font-bold text-marine">Espace administrateur</div>
          <div className="text-encre/60 text-xs">
            Intégration, affectation aux automates et sauvegarde. Non visible sur le mur d'affichage.
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => exporterJSON(snapshot())}
            className="rounded-lg border border-brume bg-surface text-sm px-3 py-2 hover:border-marine/40"
          >
            Exporter JSON
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
        </div>
      </Carte>

      {/* Attribution des programmes aux automates (étape clé avant production) */}
      <AttributionProgrammes />

      {/* Intégration (import Excel, réconciliation, inbox) */}
      <Reconcile />

      {/* Gestion des campagnes affectées */}
      <div className="space-y-3">
        <Filtres filtres={filtres} onChange={setFiltres} />
        <ListePriorisee enquetes={visibles} />
      </div>
    </div>
  );
}
