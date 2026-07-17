// En-tête applicatif : logo BIOXA + titre.
// ⚠️ Logo officiel : déposer « logo_BIOXA_detoure_transparent.png » dans
//    src/theme/logo/ puis décommenter l'import ci-dessous (jamais redessiné).
//    En son absence, un libellé texte de repli est affiché.
// import logoBioxa from '../theme/logo/logo_BIOXA_detoure_transparent.png';
const logoBioxa: string | null = null;

export function EnTete({ actions }: { actions?: React.ReactNode }) {
  return (
    <header className="bg-surface border-b border-brume">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
        {logoBioxa ? (
          <img src={logoBioxa} alt="BIOXA" className="h-9 w-auto" />
        ) : (
          <div className="leading-tight">
            <div className="font-title font-extrabold text-marine text-xl tracking-tight">BIOXA</div>
          </div>
        )}
        <div className="hidden sm:block leading-tight border-l border-brume pl-4">
          <div className="font-title font-bold text-marine text-sm">Suivi du planning EEQ</div>
          <div className="text-xs text-encre/60">Évaluations externes de la qualité</div>
        </div>
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
