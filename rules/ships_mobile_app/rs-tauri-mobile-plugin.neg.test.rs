// lexcode-expect: 0
// A Tauri desktop app's plugins, none of them phone-only, and a Tauri plugin crate that can
// run on phones (a library other apps add, not an app). Then the app's own biometric and
// haptics modules, with no Tauri plugin behind them.
use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("scanner")
        .setup(|_app, api| {
            #[cfg(target_os = "android")]
            api.register_android_plugin("com.example.scanner", "ScannerPlugin")?;
            #[cfg(target_os = "ios")]
            api.register_ios_plugin(init_plugin_scanner)?;
            Ok(())
        })
        .build()
}

mod biometric {
    pub fn init() -> bool {
        true
    }
}

mod haptics {
    pub fn init() -> u8 {
        0
    }
}

pub fn local() -> bool {
    haptics::init();
    biometric::init()
}
