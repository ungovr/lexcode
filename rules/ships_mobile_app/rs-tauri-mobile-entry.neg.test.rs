// lexcode-expect: 0
// A Tauri 1 desktop app: its main sets the Windows subsystem and has no mobile entry point.
// A comment that names the attribute is not one:
// #[cfg_attr(mobile, tauri::mobile_entry_point)] arrives with the Tauri 2 upgrade.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

const NOTE: &str = "#[tauri::mobile_entry_point] needs Tauri 2";

#[cfg_attr(feature = "tracing", tracing::instrument)]
fn main() {
    let _ = NOTE;
    tauri::Builder::default()
        .setup(|app| {
            let _window = app.get_window("main");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
