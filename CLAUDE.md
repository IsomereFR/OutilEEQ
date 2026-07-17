# CLAUDE.md — Conventions du dépôt « EEQ-PLANNING · BIOXA »

Application web mono-page, **100 % client et hors-ligne**, de suivi du planning
des enquêtes EEQ. Lire le `README.md` pour l'installation et le lancement.

## Contraintes non négociables

1. **Hors-ligne / 100 % client** : aucune dépendance réseau au runtime, aucun
   backend (seule exception future : le module capture `import/vision`, isolé).
2. **Isolation IA** : toute la logique métier fonctionne sans IA. Le seul point
   d'appel externe est `parseCaptureToEnquetes`, encapsulé.
3. **Persistance** : IndexedDB via `idb-keyval` + export/import JSON. Pas de
   double source de vérité (les enregistrements officiels restent dans Kalilab
   et sur les portails).

## Stack

Vite + React + TypeScript (strict) · Tailwind CSS · zustand (état) ·
idb-keyval (persistance) · SheetJS/xlsx (import) · Vitest (tests).

## Architecture (responsabilités)

```
src/domain/     règles métier PURES et TESTÉES (aucun accès UI ni stockage)
src/store/      IndexedDB (idb-keyval) + backup JSON + store zustand + nav
src/import/     excel/ (SheetJS + mapping + profils) · vision/ (RÉSERVÉ, non implémenté)
src/features/   dashboard/ (page unique) · reconcile/ (import + affectation)
src/ui/         composants réutilisables (Carte, Kpi, Pastille, SelectMulti, EnTete)
src/theme/      tokens DA BIOXA
src/config/     seed (référentiels d'amorce, à compléter)
```

### Règles d'or

- **La logique métier vit dans `src/domain/`** — pure, sans React, **testée**
  (urgence, déduplication, tri, sélecteurs de vues). Toute nouvelle règle s'y
  ajoute avec son test.
- **Les vues ne recalculent pas les règles** : elles consomment `domain/` et
  `store/`.
- **Toute mutation passe par une action du store** (`useStore`). Sauvegarde
  IndexedDB automatique et confirmée.

## Direction artistique (cf. PRD §8)

- Couleurs Tailwind : `creme` fond, `surface` cartes, `brume` filets, `marine`
  titres/KPI, `encre` texte (jamais de noir pur), `terracotta` urgence J-7 et
  actions primaires, `ambre` palier à surveiller, `sauge` touches rares.
- Titres **Manrope** (`font-title`), corps **Inter** (`font-sans`).
- Pastilles pleines sobres, jamais de smiley. Logo BIOXA jamais redessiné.
- **INTERDIT : aucun tiret cadratin (—)** dans l'interface ni les libellés.
  Séparateurs : point médian « · », deux-points, virgule, tiret simple.
- Libellés d'interface en français, accentuation correcte.

## Avant de committer

```bash
npm run typecheck   # 0 erreur
npm test            # tous les tests verts
npm run build       # build OK
```

## Flux Git — envoi automatique sur `main` (règle permanente du propriétaire)

Toute modification terminée et vérifiée doit être **automatiquement publiée sur
`main`**, sans demander de confirmation à chaque fois. Procédure :

1. Committer avec l'identité **`Claude <noreply@anthropic.com>`** (sinon le
   commit s'affiche « Unverified » sur GitHub) :
   `git -c user.name=Claude -c user.email=noreply@anthropic.com commit …`.
2. `git push -u origin <branche>`.
3. Ouvrir la PR si absente, puis **merger la PR sur `main`** (méthode `merge`).
4. **Resynchroniser la branche avec `main` puis la pousser** :
   `git fetch origin main && git merge --ff-only origin/main && git push origin <branche>`
   (sinon le commit de merge GitHub, committer `noreply@github.com`, reste en
   avance locale et le hook d'arrêt le signale comme « Unverified »).

Exceptions où l'on s'arrête pour demander : action destructrice/irréversible,
choix d'architecture significatif, ou ambiguïté réelle sur l'intention.
