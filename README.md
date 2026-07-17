# Suivi du planning EEQ · BIOXA

Application web **mono-page, 100 % client et hors-ligne** pour le suivi du
planning des enquêtes d'Évaluation Externe de la Qualité (EEQ) du laboratoire
BIOXA. Aucune brique IA dans ce socle : toute la logique fonctionne sans réseau.

Code projet : **EEQ-PLANNING** · Cadre : ISO 15189:2022 §7.3.7.3, §7.6, COFRAC.

## Objet

Voir en un coup d'œil les enquêtes EEQ à réaliser, affecter chaque enquête à un
ou plusieurs automates, et recevoir une alerte interne quand une échéance tombe
dans les 7 jours. L'outil pilote le **planning de réalisation** ; il ne saisit
ni n'évalue les résultats (qui restent sur les portails fournisseurs et Kalilab).

## Stack

- React + Vite + TypeScript + Tailwind CSS
- Persistance locale : IndexedDB via `idb-keyval`
- Parsing Excel/CSV : SheetJS (`xlsx`), 100 % côté client
- Aucun backend, aucune dépendance réseau au runtime

> Note : les polices (Manrope, Inter) sont **embarquées localement** via
> `@fontsource` plutôt que chargées depuis Google Fonts, afin de respecter la
> contrainte « aucune dépendance réseau au runtime » (PRD §9, défendabilité
> COFRAC §7.6). Le rendu typographique est identique.

## Synchronisation multi-poste (optionnelle · Supabase)

Par défaut l'application est **100 % locale** (chaque poste garde sa config dans
IndexedDB). Pour **partager la configuration entre plusieurs ordinateurs**, on
peut activer une synchronisation via **Supabase** (Postgres hébergé). Le mode
reste **hybride** : Supabase est la source partagée, IndexedDB sert de cache
hors-ligne (si Supabase est injoignable, le poste continue de fonctionner en
local et resynchronise ensuite).

**Activation (aucune modification de code) :**

1. Créer un projet sur <https://supabase.com>.
2. Dans le SQL Editor, créer la table de configuration :

   ```sql
   create table if not exists public.eeq_config (
     id text primary key default 'singleton',
     data jsonb not null,
     updated_at timestamptz not null default now()
   );

   alter table public.eeq_config enable row level security;

   -- Outil interne mono-labo : lecture/écriture autorisées avec la clé anon.
   create policy "eeq_config_read"   on public.eeq_config for select using (true);
   create policy "eeq_config_insert" on public.eeq_config for insert with check (true);
   create policy "eeq_config_update" on public.eeq_config for update using (true) with check (true);
   ```

3. Récupérer, dans *Project Settings → API* : l'**URL du projet** et la **clé
   anon (public)**.
4. Les déclarer en variables d'environnement (localement dans un fichier
   `.env`, ou sur Vercel dans *Settings → Environment Variables*) :

   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

5. Reconstruire / redéployer. Un indicateur **« Synchronisé »** apparaît en
   en-tête ; **« Hors-ligne · local »** s'affiche si Supabase est injoignable.

> **Sécurité :** la clé anon est publique (embarquée dans l'application). Avec la
> politique ci-dessus, toute personne disposant de l'URL et de la clé peut
> lire/écrire la configuration. C'est acceptable pour un outil interne sur poste
> maîtrisé ; pour restreindre l'accès, ajouter une authentification Supabase.
> Sans ces variables, l'application reste strictement locale (comportement par
> défaut, aucune donnée ne sort du poste).

## Prérequis

- Node.js ≥ 18 (testé avec Node 22) et npm.

## Lancement

```bash
npm install
npm run dev          # http://localhost:5173
```

Au premier démarrage, un jeu de démonstration est chargé (enquêtes couvrant les
quatre niveaux d'urgence + une enquête dans l'inbox « À affecter »).

## Tests et vérification

```bash
npm test             # tests unitaires (domaine : urgence, dédup, tri, dates)
npm run typecheck    # TypeScript strict, 0 erreur
```

## Build statique (déploiement local, sans hébergement)

```bash
npm run build        # génère dist/
npm run preview      # sert dist/ localement pour vérification
```

Le build utilise `base: './'` : le dossier `dist/` est autonome et peut être
copié sur le poste ou servi par n'importe quel serveur statique, sans exposition
réseau.

## Où compléter les référentiels

Tout est regroupé dans **`src/config/seed.ts`** (marqué « À COMPLÉTER ») :

- **Fournisseurs** EEQ réels (abonnements BIOXA).
- **Sites** : les 9 sites du réseau avec leurs codes.
- **Automates** et leur rattachement aux sites / disciplines.
- **Programmes** (code, libellé, paramètres, automates par défaut).

Les **seuils d'alerte** (7 j urgent, 15 j à surveiller) sont dans
**`src/domain/config/seuils.ts`** et sont modifiables.

Après modification du seed : les données déjà présentes en IndexedDB ne sont pas
écrasées. Pour repartir du seed, vider le stockage du site (outils navigateur)
ou importer un export JSON de référence.

## Sauvegarde et portabilité

- **Exporter** : bouton « Exporter » → instantané JSON complet horodaté
  (référentiels, enquêtes, profils d'import, captures encodées en base64).
- **Importer JSON** : au choix, **remplacement** total ou **fusion** non
  destructive.

## Import d'un planning (Excel / CSV)

Bouton « Importer un planning » → dépôt du fichier, détection de la ligne
d'en-tête, mapping des colonnes vers les champs d'enquête. Le mapping est
**mémorisé par fournisseur** (profil d'import) : au prochain import du même
fournisseur, il est pré-rempli automatiquement. Les candidats passent par la
**déduplication** puis l'écran de **réconciliation** (affectation aux automates)
avant d'entrer dans le planning. Une nouvelle enquête n'entre jamais directement
dans le planning : elle transite par l'inbox « À affecter ».

## Brancher le module capture (prompt 02)

Le dossier **`src/import/vision/`** est **réservé et non implémenté**. Il expose
une seule interface :

```ts
parseCaptureToEnquetes(image: Blob): Promise<CandidatEnquete[]>
```

qui lève aujourd'hui `"Module capture non installé"`. Pour l'activer (prompt 02),
implémenter cette fonction (appel de vision) et placer la clé API et le
paramétrage dans un fichier de configuration **dédié et séparé** du reste du
code. Le reste de l'application ignore comment les candidats sont produits : ils
rejoignent le même écran de réconciliation que l'import Excel, avec **contrôle
humain obligatoire** (l'IA propose, l'humain valide).

## Logo

Déposer le fichier officiel **`logo_BIOXA_detoure_transparent.png`** dans
`src/theme/logo/` puis activer l'import dans `src/ui/EnTete.tsx` (une ligne
commentée). Le logo n'est jamais redessiné. En son absence, un libellé texte de
repli « BIOXA » est affiché.

## Arborescence

```
src/
  domain/        types + règles métier pures et testées (urgence, dédup, tri, vues)
  store/         accès IndexedDB (idb-keyval) + export/import JSON + store zustand
  import/
    excel/       parsing SheetJS + mapping + profils
    vision/      RÉSERVÉ (prompt 02) : interface non implémentée
  features/
    dashboard/   page unique (bandeau, indicateurs, frise, liste priorisée)
    reconcile/   import + réconciliation + inbox d'affectation
  ui/            composants réutilisables (cartes, pastilles, KPI, filtres)
  theme/         tokens de la direction artistique BIOXA
  config/        seed (référentiels d'amorce, à compléter)
```
