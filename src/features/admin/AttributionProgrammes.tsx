// ============================================================================
//  Attribution des programmes aux automates (espace admin).
//  Pour chaque programme importé (ex. ProBioQual), l'administrateur choisit
//  l'automate. L'attribution affecte automatiquement toutes les enquêtes du
//  programme, qui apparaissent alors au mur d'affichage. Étape à réaliser AVANT
//  la mise en production.
// ============================================================================
import { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Carte, CarteTitre } from '../../ui/Carte';

export function AttributionProgrammes() {
  const programmes = useStore((s) => s.programmes);
  const automates = useStore((s) => s.automates);
  const fournisseurs = useStore((s) => s.fournisseurs);
  const enquetes = useStore((s) => s.enquetes);
  const attribuerProgramme = useStore((s) => s.attribuerProgramme);

  const nomFournisseur = useMemo(() => new Map(fournisseurs.map((f) => [f.id, f.nom])), [fournisseurs]);
  const nbParProgramme = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of enquetes) m.set(e.programmeId, (m.get(e.programmeId) ?? 0) + 1);
    return m;
  }, [enquetes]);

  const attribues = programmes.filter((p) => (p.automatesParDefaut[0] ?? '') !== '').length;

  const th = 'px-3 py-2 text-left font-medium text-encre/60 whitespace-nowrap';
  const td = 'px-3 py-2 align-middle border-b border-brume/60';

  return (
    <Carte>
      <CarteTitre extra={`${attribues} / ${programmes.length} attribués`}>
        Attribution des programmes aux automates
      </CarteTitre>
      <div className="px-4 py-2">
        <p className="text-xs text-encre/60 mb-2">
          Choisissez l'automate de chaque programme. L'attribution affecte toutes les enquêtes du
          programme et les fait apparaître au mur d'affichage.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="border-b border-brume text-xs">
            <tr>
              <th className={th}>Code</th>
              <th className={th}>Programme</th>
              <th className={th}>Fournisseur</th>
              <th className={th}>Enquêtes</th>
              <th className={th}>Automate attribué</th>
            </tr>
          </thead>
          <tbody>
            {programmes.map((p) => {
              const courant = p.automatesParDefaut[0] ?? '';
              const nb = nbParProgramme.get(p.id) ?? 0;
              return (
                <tr key={p.id} className="hover:bg-creme/40">
                  <td className={td}>
                    {p.codeProgramme ? (
                      <span className="font-mono font-semibold text-marine">{p.codeProgramme}</span>
                    ) : (
                      <span className="text-encre/30">·</span>
                    )}
                  </td>
                  <td className={td}>{p.libelle}</td>
                  <td className={`${td} text-encre/70`}>{nomFournisseur.get(p.fournisseurId) ?? p.fournisseurId}</td>
                  <td className={`${td} tabular-nums text-encre/70`}>{nb}</td>
                  <td className={td}>
                    <select
                      value={courant}
                      onChange={(e) => attribuerProgramme(p.id, e.target.value ? [e.target.value] : [])}
                      className={
                        'rounded-lg border bg-surface text-sm px-2 py-1.5 focus:outline-none focus:border-marine/60 ' +
                        (courant ? 'border-brume' : 'border-terracotta/60 text-terracotta')
                      }
                    >
                      <option value="">— non attribué —</option>
                      {automates
                        .filter((a) => a.actif)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nom} · {a.disciplines.join(', ')}
                          </option>
                        ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Carte>
  );
}
