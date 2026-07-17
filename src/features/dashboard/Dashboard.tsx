// ============================================================================
//  Dashboard · BIOXA — MUR D'AFFICHAGE (page unique, lecture seule).
//  But : en un coup d'œil, le laboratoire sait quoi faire et sur quel automate.
//  Aucune interaction. Les échéances dépassées disparaissent. Recalcul auto 24 h
//  (cf. useAlertes). L'intégration et l'affectation sont dans l'espace admin.
// ============================================================================
import { useStore } from '../../store/useStore';
import { comptesAlerte } from '../../domain/alerte';
import { COULEUR_ALERTE, LIBELLE_ALERTE } from '../../theme/tokens';
import { MurAutomates } from './MurAutomates';
import { useAlertes } from './useAlertes';

/** Grande pastille de synthèse (un palier d'alerte). */
function Synthese({ couleur, valeur, libelle }: { couleur: string; valeur: number; libelle: string }) {
  const actif = valeur > 0;
  return (
    <div
      className="flex items-center gap-3 rounded-xl2 px-4 py-3 border"
      style={{
        borderColor: actif ? couleur : 'var(--tw-brume, #D5DBDF)',
        background: actif ? `${couleur}14` : '#FFFFFF',
      }}
    >
      <span
        className="font-title font-extrabold text-3xl tabular-nums leading-none"
        style={{ color: actif ? couleur : '#B7C0C6' }}
      >
        {valeur}
      </span>
      <span className="text-sm leading-tight" style={{ color: actif ? couleur : '#7C8A93' }}>
        {libelle}
      </span>
    </div>
  );
}

export function Dashboard() {
  useAlertes(); // recalcul périodique (24 h) + au retour sur l'onglet
  const enquetes = useStore((s) => s.enquetes);
  const c = comptesAlerte(enquetes);

  const dateJour = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-5">
      {/* Bandeau de synthèse (au coup d'œil) */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <div className="surtitre">EEQ à réaliser</div>
          <div className="font-title font-extrabold text-marine text-xl capitalize">{dateJour}</div>
        </div>
        <div className="ml-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          <Synthese couleur={COULEUR_ALERTE.aujourdhui} valeur={c.aujourdhui} libelle={LIBELLE_ALERTE.aujourdhui} />
          <Synthese couleur={COULEUR_ALERTE.j3} valeur={c.j3} libelle={LIBELLE_ALERTE.j3} />
          <Synthese couleur={COULEUR_ALERTE.j7} valeur={c.j7} libelle={LIBELLE_ALERTE.j7} />
          <Synthese couleur={COULEUR_ALERTE.j15} valeur={c.j15} libelle={LIBELLE_ALERTE.j15} />
        </div>
      </div>

      {/* Mur des automates */}
      <MurAutomates enquetes={enquetes} />

      <p className="text-center text-[11px] text-encre/40">
        Affichage en lecture seule · mise à jour automatique toutes les 24 heures · seules les échéances des 15 prochains jours sont affichées (les échéances dépassées et lointaines sont masquées).
      </p>
    </div>
  );
}
