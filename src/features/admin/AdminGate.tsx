// ============================================================================
//  Verrou de l'espace administrateur : mot de passe unique partagé.
//  - Le mot de passe attendu est fourni par la variable d'environnement
//    VITE_ADMIN_MOT_DE_PASSE (figée au build). Si elle est absente, l'admin
//    reste ouvert (comportement d'origine, aucun verrou).
//  - Une fois déverrouillé, l'état est mémorisé pour la session de l'onglet
//    (sessionStorage) : pas besoin de retaper à chaque aller-retour.
//
//  NOTE de sécurité : l'application étant 100 % côté client, ce mot de passe est
//  un GARDE-FOU (il empêche l'accès accidentel/casuel depuis l'URL), pas une
//  sécurité cryptographique. Pour un vrai contrôle d'accès (comptes nominatifs,
//  révocation), utiliser une authentification Supabase. Voir README.
// ============================================================================
import { useState } from 'react';
import { useNav } from '../../store/useNav';

const MOT_DE_PASSE = import.meta.env.VITE_ADMIN_MOT_DE_PASSE;
const CLE_SESSION = 'eeq_admin_deverrouille';

/** L'admin est-il protégé par un mot de passe ? (variable d'env définie) */
export const adminProtege: boolean = Boolean(MOT_DE_PASSE);

function estDeverrouille(): boolean {
  if (!adminProtege) return true;
  try {
    return sessionStorage.getItem(CLE_SESSION) === '1';
  } catch {
    return false;
  }
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(estDeverrouille);
  const [saisie, setSaisie] = useState('');
  const [erreur, setErreur] = useState(false);
  const aller = useNav((s) => s.aller);

  if (ok) return <>{children}</>;

  const soumettre = (e: React.FormEvent) => {
    e.preventDefault();
    if (saisie === MOT_DE_PASSE) {
      try {
        sessionStorage.setItem(CLE_SESSION, '1');
      } catch {
        /* sessionStorage indisponible : déverrouillage le temps de la vue */
      }
      setOk(true);
    } else {
      setErreur(true);
      setSaisie('');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <form onSubmit={soumettre} className="rounded-xl2 border border-brume bg-surface p-6 shadow-carte">
        <div className="surtitre mb-1">Espace administrateur</div>
        <h2 className="font-title font-extrabold text-marine text-xl mb-4">Accès protégé</h2>
        <label htmlFor="mdp-admin" className="block text-sm text-encre/70 mb-1.5">
          Mot de passe
        </label>
        <input
          id="mdp-admin"
          type="password"
          autoFocus
          value={saisie}
          onChange={(e) => {
            setSaisie(e.target.value);
            setErreur(false);
          }}
          className="w-full rounded-lg border border-brume px-3 py-2 text-sm focus:outline-none focus:border-marine"
          placeholder="Saisir le mot de passe"
        />
        {erreur && <p className="text-terracotta text-xs mt-2">Mot de passe incorrect.</p>}
        <div className="flex items-center gap-2 mt-5">
          <button
            type="submit"
            className="rounded-lg bg-marine text-white text-sm font-medium px-4 py-2 hover:brightness-110"
          >
            Déverrouiller
          </button>
          <button
            type="button"
            onClick={() => aller('dashboard')}
            className="text-xs text-encre/50 hover:text-marine px-2 py-2"
          >
            Retour à l'affichage
          </button>
        </div>
      </form>
    </div>
  );
}
