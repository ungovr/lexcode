// lexcode-expect: 5
// A Tauri 2 app that registers plugins that run only on Android and iOS, by path, through an
// alias and through a grouped `use`.
use tauri_plugin_biometric as biometric;
use tauri_plugin_nfc::{init as nfc_plugin};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default().plugin(tauri_plugin_opener::init());
    #[cfg(mobile)]
    {
        builder = builder
            .plugin(tauri_plugin_barcode_scanner::init())
            .plugin(tauri_plugin_haptics::init())
            .plugin(tauri_plugin_geolocation::init())
            .plugin(biometric::init())
            .plugin(nfc_plugin());
    }
    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
