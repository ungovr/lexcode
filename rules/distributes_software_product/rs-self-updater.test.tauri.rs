// lexcode-expect: 6
// A Tauri desktop app that updates itself from its release server: the Tauri 2 updater plugin
// registered and checked (by path, through a grouped `use` with a rename and through an alias), and
// Tauri 1's built-in updater.
use tauri::AppHandle;
use tauri_plugin_updater as updater;
use tauri_plugin_updater::{Builder as UpdaterBuilder, UpdaterExt};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub async fn check(app: AppHandle) -> tauri_plugin_updater::Result<()> {
    if let Some(update) = app.updater()?.check().await? {
        update.download_and_install(|_, _| {}, || {}).await?;
    }
    let _custom = app.updater_builder().timeout(std::time::Duration::from_secs(30)).build()?;
    Ok(())
}

pub async fn check_v1(app: AppHandle) {
    let _ = tauri::updater::builder(app).check().await;
}

pub fn run_with_plugin_names() {
    let _grouped = UpdaterBuilder::new().build::<tauri::Wry>();
    let _aliased = updater::Builder::new().pubkey("key").build::<tauri::Wry>();
}
