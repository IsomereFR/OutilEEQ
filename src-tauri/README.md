# Packaging Tauri (optionnel)

Ce dossier contient la configuration **Tauri 2** permettant de produire un
exécutable de bureau (`.exe` sous Windows) à partir du build web statique
(`../dist`). L'application reste **100 % locale et hors-ligne**.

## Prérequis (sur la machine de build)

- Toolchain Rust : <https://www.rust-lang.org/tools/install>
- Windows : *Microsoft C++ Build Tools* + WebView2 (préinstallé sur Win 10/11).
- CLI Tauri : `npm install -D @tauri-apps/cli`

## Icônes

Avant le premier build, générer le jeu d'icônes attendu (`icons/`) :

```bash
npx tauri icon chemin/vers/logo.png
```

## Commandes (depuis la racine du projet)

```bash
npm run tauri dev     # lance l'app native en développement
npm run tauri build   # produit l'exécutable / l'installeur (src-tauri/target/release)
```

> Le build natif n'est pas réalisé par la CI Linux : il doit être lancé sur la
> plateforme cible (Windows pour un `.exe`).
