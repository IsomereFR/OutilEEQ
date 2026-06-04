// Logique d'amorçage de l'application Tauri.
// L'application reste 100 % locale : la WebView charge le build statique
// embarqué (frontendDist = ../dist), aucune connexion réseau n'est requise.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("erreur au lancement de l'application Tauri");
}
