// ============================================================================
//  Dépôt d'un fichier PDF (PDF UNIQUEMENT), embarqué dans le store en base64.
//  Glisser-déposer ou sélection. Le fichier voyage avec l'export JSON et reste
//  consultable hors-ligne — aucun lien fragile vers le système de fichiers.
// ============================================================================
import { useRef, useState } from 'react';
import type { PieceJointePDF } from '../types/models';

/** Taille maximale acceptée pour rester raisonnable dans IndexedDB / l'export. */
const MAX_OCTETS = 12 * 1024 * 1024; // 12 Mo

/** Formate une taille d'octets en Ko / Mo. */
function fmtTaille(o: number): string {
  if (o >= 1024 * 1024) return (o / (1024 * 1024)).toFixed(1) + ' Mo';
  return Math.max(1, Math.round(o / 1024)) + ' Ko';
}

/** Lit un fichier PDF en data URL base64. */
function lirePdf(file: File): Promise<PieceJointePDF> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ nom: file.name, taille: file.size, data: String(r.result) });
    r.onerror = () => reject(new Error('Lecture du PDF impossible.'));
    r.readAsDataURL(file);
  });
}

/** Ouvre le PDF embarqué dans un nouvel onglet (via Blob, fiable même volumineux). */
function ouvrirPdf(pj: PieceJointePDF): void {
  const [meta, b64] = pj.data.split(',');
  const mime = /:(.*?);/.exec(meta)?.[1] || 'application/pdf';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([arr], { type: mime }));
  window.open(url, '_blank', 'noopener');
  // Révocation différée : laisse le temps à l'onglet de charger le document.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function PdfDeposit({
  value,
  onChange,
}: {
  value?: PieceJointePDF | null;
  onChange: (v: PieceJointePDF | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [survol, setSurvol] = useState(false);

  const traiter = (file: File | undefined | null) => {
    if (!file) return;
    const estPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!estPdf) {
      alert('Seuls les fichiers PDF sont acceptés.');
      return;
    }
    if (file.size > MAX_OCTETS) {
      alert(`PDF trop volumineux (${fmtTaille(file.size)}). Maximum ${fmtTaille(MAX_OCTETS)}.`);
      return;
    }
    lirePdf(file).then(onChange).catch((e) => alert(e.message));
  };

  // Fichier déjà déposé : carte de consultation.
  if (value) {
    return (
      <div className="pdf-pj">
        <span className="pdf-ic">📄</span>
        <div className="grow">
          <div className="pdf-nom">{value.nom}</div>
          <div className="small">{fmtTaille(value.taille)} · PDF embarqué</div>
        </div>
        <button type="button" className="btn ghost" onClick={() => ouvrirPdf(value)}>
          Voir
        </button>
        <button
          type="button"
          className="icon-btn"
          title="Retirer le PDF"
          onClick={() => onChange(null)}
        >
          🗑
        </button>
      </div>
    );
  }

  // Aucun fichier : zone de dépôt (clic ou glisser-déposer).
  return (
    <div
      className={`pdf-drop${survol ? ' over' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setSurvol(true);
      }}
      onDragLeave={() => setSurvol(false)}
      onDrop={(e) => {
        e.preventDefault();
        setSurvol(false);
        traiter(e.dataTransfer.files?.[0]);
      }}
    >
      <span className="pdf-ic">⬇</span>
      <span>
        Déposer un <b>PDF</b> ici ou <span className="pill-link">parcourir</span>
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          traiter(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
