# Suivi EEQ

Outil **local et hors-ligne** de suivi des évaluations externes de la qualité
(EEQ) pour un laboratoire de biologie médicale, dans l'esprit de la norme
**ISO 15189:2022 (§7.3.7)**.

L'application remplace une solution Excel fragile (liens inter-fichiers qui
cassent dès qu'un fichier est déplacé). Ici, **toutes les données vivent dans un
store unique** (IndexedDB) avec **export / import JSON** pour la portabilité.
Aucun backend, aucune base cloud, aucune dépendance réseau au runtime.

## Fonctionnalités

- **Planning des enquêtes** : programme annuel organisé par enquête, vue triée
  par date avec séparateurs mensuels, KPIs (planifiées / à venir ≤ 30 j / en
  retard / reçues), statut automatique par enquête. Création d'une fiche
  pré-remplie et rattachée par automate concerné.
- **Référentiel automates** : CRUD + vue listant les campagnes de chaque
  automate.
- **Fiche EEQ** : les 6 parties (administratif → reconstitution → analytique →
  envoi → réception → exploitation), stepper de workflow et statut calculé.
- **Module d'analyse** : par analyte, calcul de l'écart %, du z-score, statut
  (`|z| < 2` conforme, `2 ≤ |z| < 3` alerte, `|z| ≥ 3` hors limites), barre de
  position sur axe −3 / +3, synthèse « n/N dans les limites ».
- **Traçabilité FNC** : la gestion de la non-conformité reste dans **Kalilab**
  (système maître). L'application stocke uniquement le **n° de FNC** (lien
  logique) et le fait remonter au tableau de bord et au planning.
- **Tableau de bord** : KPIs, campagnes à traiter par échéance, conformité par
  automate, non-conformités ouvertes.
- **Portabilité** : export / import JSON daté, **sauvegarde automatique** à
  chaque modification (IndexedDB), **journal d'audit léger** (horodatage des
  événements structurants).

## Stack technique

- **Vite + React + TypeScript** (strict)
- **Zustand** (état) + **Dexie / IndexedDB** (persistance)
- Polices **embarquées localement** (`@fontsource/ibm-plex-sans` &
  `@fontsource/ibm-plex-mono`) — aucun appel à Google Fonts au runtime.
- **Vitest** pour les tests unitaires des règles de calcul.

## Prérequis

- [Node.js](https://nodejs.org/) ≥ 18 (testé avec Node 22) et npm.

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```
Ouvre l'URL affichée (par défaut `http://localhost:5173`). Au premier lancement,
un jeu de données de démonstration est chargé automatiquement.

## Tests

```bash
npm test          # exécution unique
npm run test:watch
npm run typecheck # vérification TypeScript
```

## Build de production

```bash
npm run build     # génère le dossier dist/
npm run preview   # sert le build localement pour vérification
```

Le build utilise `base: './'` : le contenu de `dist/` est **autonome** et peut
être copié sur un poste, servi par n'importe quel serveur statique, ou intégré
dans un exécutable (voir Tauri ci-dessous). Aucune connexion réseau n'est
requise à l'exécution.

## Packaging Windows (.exe) avec Tauri — optionnel

Pour produire un exécutable Windows lançable au double-clic :

1. Installer le prérequis Rust : <https://www.rust-lang.org/tools/install> et,
   sous Windows, les *Microsoft C++ Build Tools* + WebView2 (préinstallé sur
   Windows 10/11 récents).
2. Installer la CLI Tauri (en dev) :
   ```bash
   npm install -D @tauri-apps/cli
   ```
3. Lancer en mode application native :
   ```bash
   npm run tauri dev
   ```
4. Produire l'exécutable / l'installeur :
   ```bash
   npm run tauri build
   ```
   Les artefacts sont générés dans `src-tauri/target/release/`.

La configuration de base se trouve dans `src-tauri/` (cf. `tauri.conf.json`).
> Le build `.exe` doit être réalisé **sur une machine Windows** disposant du
> toolchain Rust ; il n'est pas produit par l'environnement de CI Linux.

## Données & sauvegarde

- Les données sont stockées dans **IndexedDB** (base `suivi-eeq`), jamais dans
  `localStorage`.
- **Exportez régulièrement** un instantané JSON (bouton « Exporter » de la barre
  latérale) : c'est la sauvegarde portable, immune au déplacement de fichiers.
- L'import remplace l'intégralité de l'état courant par le contenu du fichier.
- Si IndexedDB est indisponible, l'application fonctionne en mémoire et affiche
  une bannière invitant à exporter manuellement.

## Migration future vers SQLite / multi-poste

L'accès aux données est isolé derrière `src/store/db.ts` (chargement /
sauvegarde de l'`AppData` complet). Pour un besoin multi-poste, il suffit de
réimplémenter ces fonctions au-dessus d'un backend SQLite sans toucher aux vues
ni à la logique métier.
