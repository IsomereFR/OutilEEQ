// Portabilité : export/import JSON daté (sauvegarde anti « lien cassé »).
import type { AppData } from '../types/models';

/** Déclenche le téléchargement d'un instantané JSON daté de l'état. */
export function exportJSON(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'suivi-eeq_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

/** Lit un fichier JSON et renvoie l'AppData parsé (rejette si invalide). */
export function importJSONFile(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(String(r.result));
        if (typeof data !== 'object' || !Array.isArray(data.fiches)) {
          throw new Error('format inattendu');
        }
        resolve(data as AppData);
      } catch {
        reject(new Error('Fichier invalide.'));
      }
    };
    r.onerror = () => reject(new Error('Lecture impossible.'));
    r.readAsText(file);
  });
}
