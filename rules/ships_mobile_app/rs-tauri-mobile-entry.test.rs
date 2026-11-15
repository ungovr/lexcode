// lexcode-expect: 3
// The Tauri 2 entry point that a phone build starts from: the template's cfg_attr form, and the
// bare attribute in an app built only for phones.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub mod phone {
    #[tauri::mobile_entry_point]
    pub fn start() {
        super::run();
    }
}

pub mod targets {
    #[cfg_attr(any(target_os = "android", target_os = "ios"), tauri::mobile_entry_point)]
    pub fn start() {
        super::run();
    }
}
