# CLAUDE.md — Conventions du dépôt « Suivi EEQ »

Guide pour toute contribution (humaine ou assistée). Lire le `README.md` pour
l'installation et le lancement.

## Nature du projet

Outil **local, hors-ligne**, sans backend. Suivi des EEQ d'un laboratoire de
biologie médicale (ISO 15189:2022 §7.3.7). Contraintes **non négociables** :

1. **100 % local / hors-ligne** : aucune dépendance réseau au runtime (polices
   embarquées, pas de CDN, pas d'API).
2. **Store unique** : toutes les données dans IndexedDB + export/import JSON.
   Aucun lien inter-fichiers rigide.
3. **Fidélité au prototype** pour l'UX et le design system.

## Stack

- Vite + React + TypeScript (strict) · Zustand (état) · Dexie/IndexedDB
  (persistance) · Vitest (tests).

## Architecture & responsabilités

```
src/
  types/models.ts        Modèle de données (source de vérité des types).
  logic/                 Règles métier PURES et testées :
    calculations.ts        z-score, écart %, évaluation analyte, synthèse.
    ficheStatus.ts         STEPS, stepIndex, statutFiche.
    enqueteStatus.ts       daysTo, statutEnquete.
    campagneStatus.ts      statut campagne (stand-by → à traiter à 15 j).
    __tests__/             Tests unitaires Vitest.
  data/calendriers/      Calendriers EEQ embarqués (ProBioQual…) + registre.
  store/
    db.ts                  Accès IndexedDB (load/save de l'AppData complet).
    useStore.ts            Store Zustand + auto-persistance + journal d'audit.
    useNav.ts              Navigation (vue courante).
    useToast.ts            Notifications éphémères.
    factories.ts           Fabriques d'entités vierges.
    selectors.ts           Sélecteurs purs (relations dérivées).
    seed.ts                Jeu de démonstration.
  components/            Composants UI réutilisables (Rail, Topbar, Chip,
                         Stepper, Kpi, ZBar, Field/Section, Toast).
  views/                Une vue par écran (Dashboard, Planning, EnqueteView,
                         AutomateView, FicheView, ConfigCalendriers).
  utils/                format (fr-FR), id, portability (export/import JSON).
  styles/theme.css      Design system (variables + classes).
```

### Règles d'or

- **La logique métier vit dans `src/logic/`** — pure, sans React, **testée**.
  Toute nouvelle règle de calcul ou de statut s'ajoute ici avec son test.
- **Les vues ne calculent pas** : elles consomment `logic/` et `store/`.
- **Toute mutation passe par une action du store** (`useStore`). Ne jamais
  muter l'état directement. Les actions journalisent l'audit et déclenchent la
  sauvegarde automatique.
- **Inputs contrôlés** : `value` depuis le store, `onChange` → action. La
  réactivité (statuts, z-scores) est automatique — pas de `render()` manuel.
- **Accès données isolé dans `db.ts`** : pour migrer vers SQLite/multi-poste,
  ne réécrire que ce fichier (cf. README).
- **Persistance** : IndexedDB uniquement, **jamais** `localStorage` pour les
  données critiques.

## Conventions de code

- **Commentaires et libellés UI en français.**
- TypeScript **strict** ; pas d'import/variable inutilisé (le `tsc --noEmit`
  doit passer).
- Réutiliser les **classes CSS existantes** de `theme.css` (mêmes noms que le
  prototype) plutôt que d'ajouter du style en ligne ad hoc.
- Police : IBM Plex Sans (UI), IBM Plex Mono (chiffres, dates, z-scores) via la
  classe/variable `--mono`.
- Dates stockées en ISO `AAAA-MM-JJ`, affichées en `JJ/MM/AAAA` (`fmtDate`).

## Avant de committer

```bash
npm run typecheck   # 0 erreur
npm test            # tous les tests verts
npm run build       # build OK
```

## Flux Git — envoi automatique sur `main` (demande du propriétaire)

**Règle permanente** : toute modification terminée et vérifiée (typecheck +
tests + build verts) doit être **automatiquement publiée sur `main`**, sans
demander de confirmation à chaque fois. Procédure :

1. Committer avec l'identité **`Claude <noreply@anthropic.com>`** (sinon le
   commit s'affiche « Unverified » sur GitHub) :
   `git -c user.name=Claude -c user.email=noreply@anthropic.com commit …`.
2. `git push -u origin <branche>`.
3. Ouvrir la PR si absente, puis **merger la PR sur `main`** (méthode `merge`).
   Le déploiement de production Vercel se déclenche depuis `main`.
4. **Resynchroniser la branche avec `main` puis la pousser** :
   `git fetch origin main && git merge --ff-only origin/main && git push origin <branche>`.
   Indispensable : sans ce push, le commit de merge créé par GitHub
   (committer `noreply@github.com`) reste en avance locale et le hook d'arrêt le
   signale comme « Unverified ». Après ce push, `origin/<branche>` == `main`.

Exceptions où l'on s'arrête pour demander : action destructrice/irréversible,
choix d'architecture significatif, ou ambiguïté réelle sur l'intention.

## Périmètre fonctionnel (rappel)

Planning des enquêtes ↔ fiches rattachées · Référentiel automates · Fiche EEQ
6 parties + stepper · Module d'analyse (z-score, écart, barre −3/+3, synthèse) ·
Traçabilité FNC (n° de FNC seulement ; la NC reste gérée dans **Kalilab**) ·
Tableau de bord · Export/Import JSON + sauvegarde auto + journal d'audit.
