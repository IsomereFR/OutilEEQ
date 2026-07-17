// ============================================================================
//  Dashboard · BIOXA (page unique, cf. PRD F4).
//  Détient l'état des filtres et le recalcul périodique des alertes (useAlertes).
//  Le planning n'affiche que les enquêtes affectées ; l'inbox (non affectées)
//  est traitée dans le module de réconciliation.
//  Ordre vertical impératif : bandeau d'alerte, cartes indicateurs, filtres,
//  frise, liste priorisée, carte « À affecter ».
// ============================================================================
import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useNav } from '../../store/useNav';
import { appliquerFiltres, type Filtres as FiltresValeurs } from '../../domain/vues';
import { Carte } from '../../ui/Carte';
import { BandeauAlerte } from './BandeauAlerte';
import { CartesIndicateurs } from './CartesIndicateurs';
import { Filtres } from './Filtres';
import { Frise } from './Frise';
import { ListePriorisee } from './ListePriorisee';
import { useAlertes } from './useAlertes';

export function Dashboard() {
  useAlertes(); // recalcul périodique des statuts d'urgence
  const enquetes = useStore((s) => s.enquetes);
  const programmes = useStore((s) => s.programmes);
  const aller = useNav((s) => s.aller);

  const [filtres, setFiltres] = useState<FiltresValeurs>({});

  const planning = enquetes.filter((e) => e.affectee); // le planning ne montre que les affectées
  const visibles = appliquerFiltres(planning, filtres, programmes);
  const nonAffectees = enquetes.filter((e) => !e.affectee);

  const ouvrirInbox = () => aller('reconcile');

  return (
    <div className="space-y-5">
      {/* 1 · Bandeau d'alerte (masqué si aucun compteur actif).
             On passe TOUTES les enquêtes : compteursAlerte limite l'urgence aux
             affectées et compte séparément les non affectées (inbox). */}
      <BandeauAlerte enquetes={enquetes} onVoirInbox={ouvrirInbox} />

      {/* 2 · Cartes indicateurs (indicateurs() gère l'inbox : toutes les enquêtes) */}
      <CartesIndicateurs enquetes={enquetes} onVoirInbox={ouvrirInbox} />

      {/* 3 · Filtres transverses */}
      <Filtres filtres={filtres} onChange={setFiltres} />

      {/* 4 · Frise chronologique (90 j) sur les enquêtes visibles */}
      <Frise enquetes={visibles} />

      {/* 5 · Liste priorisée */}
      <ListePriorisee enquetes={visibles} />

      {/* 6 · Carte « À affecter » (inbox) · masquée si vide */}
      {nonAffectees.length > 0 && (
        <Carte className="p-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center justify-center h-9 min-w-9 px-2 rounded-full bg-marine text-white font-title font-bold tabular-nums">
            {nonAffectees.length}
          </span>
          <div className="text-sm">
            <div className="font-title font-bold text-marine">À affecter</div>
            <div className="text-encre/60 text-xs">
              {nonAffectees.length > 1
                ? 'enquêtes importées en attente d’affectation'
                : 'enquête importée en attente d’affectation'}
            </div>
          </div>
          <button
            type="button"
            onClick={ouvrirInbox}
            className="ml-auto rounded-lg bg-terracotta text-white text-sm font-medium px-3 py-2 hover:brightness-105"
          >
            Ouvrir l'inbox
          </button>
        </Carte>
      )}
    </div>
  );
}
