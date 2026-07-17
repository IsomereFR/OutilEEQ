// ============================================================================
//  Cartes indicateurs (KPI) du dashboard (cf. PRD F4).
//  indicateurs() gère lui-même l'inbox : on lui passe TOUTES les enquêtes.
//  Grille responsive : 2 colonnes en mobile, 5 en écran large.
// ============================================================================
import type { Enquete } from '../../domain/types';
import { indicateurs } from '../../domain/vues';
import { Kpi } from '../../ui/Kpi';

export function CartesIndicateurs({
  enquetes,
  onVoirInbox,
}: {
  enquetes: Enquete[];
  onVoirInbox: () => void;
}) {
  const i = indicateurs(enquetes);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Kpi ton="terracotta" valeur={i.sous7j} libelle="À réaliser sous 7 j" />
      <Kpi ton="marine" valeur={i.enRetard} libelle="En retard" />
      <Kpi ton="ambre" valeur={i.aSurveiller} libelle="À surveiller (8 à 15 j)" />
      <Kpi ton="neutre" valeur={i.nonAffectees} libelle="Non affectées" onClick={onVoirInbox} />
      <Kpi ton="sauge" valeur={i.realiseesCeMois} libelle="Réalisées ce mois" />
    </div>
  );
}
