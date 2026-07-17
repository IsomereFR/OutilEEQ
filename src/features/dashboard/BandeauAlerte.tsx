// ============================================================================
//  Bandeau d'alerte en tête de dashboard (cf. PRD F4.1).
//  Fond marine, texte clair, chiffres accentués en terracotta. Masqué lorsque
//  aucun compteur d'alerte n'est actif. Séparateur : point médian « · ».
// ============================================================================
import type { Enquete } from '../../domain/types';
import { compteursAlerte, bandeauVisible } from '../../domain/vues';

export function BandeauAlerte({
  enquetes,
  onVoirInbox,
}: {
  enquetes: Enquete[];
  onVoirInbox: () => void;
}) {
  const c = compteursAlerte(enquetes);
  if (!bandeauVisible(c)) return null;

  // Segments affichés seulement s'ils portent une valeur non nulle.
  const segments: string[] = [];
  if (c.urgent > 0) {
    segments.push(
      `${c.urgent} ${c.urgent > 1 ? 'enquêtes' : 'enquête'} à réaliser dans les 7 jours`,
    );
  }
  if (c.retard > 0) segments.push(`${c.retard} en retard`);
  if (c.nonAffectees > 0) segments.push(`${c.nonAffectees} non affectées`);

  return (
    <div
      role="alert"
      className="rounded-xl2 bg-marine text-white shadow-carte px-5 py-4 flex flex-wrap items-center gap-x-2 gap-y-2"
    >
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-terracotta" aria-hidden />
      <span className="font-title font-bold text-sm">Alerte planning</span>
      <span className="text-white/40" aria-hidden>
        ·
      </span>
      <span className="text-sm text-white/90 [&_b]:font-bold [&_b]:text-terracotta">
        {segments.map((s, i) => {
          // Isole le nombre en tête de segment pour l'accentuer en terracotta.
          const m = s.match(/^(\d+)(.*)$/);
          return (
            <span key={i}>
              {i > 0 && <span className="text-white/40"> · </span>}
              {m ? (
                <>
                  <b>{m[1]}</b>
                  {m[2]}
                </>
              ) : (
                s
              )}
            </span>
          );
        })}
      </span>
      {c.nonAffectees > 0 && (
        <button
          type="button"
          onClick={onVoirInbox}
          className="ml-auto rounded-lg bg-terracotta text-white text-sm font-medium px-3 py-1.5 hover:brightness-105"
        >
          Traiter
        </button>
      )}
    </div>
  );
}
