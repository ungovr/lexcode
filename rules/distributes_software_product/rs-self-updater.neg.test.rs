// lexcode-expect: 0
// A hosted service that only reads a version string and its own update queue, and the app's
// own Update and UpdateManager types, in a file with no updater crate. A Tauri app with no
// updater plugin. A comment naming self_update is not a use of it.
use std::collections::VecDeque;

pub struct Update {
    pub table: &'static str,
}

impl Update {
    pub fn configure() -> Self {
        Update { table: "accounts" }
    }
}

pub struct UpdateManager {
    queue: VecDeque<String>,
}

impl UpdateManager {
    pub fn new(queue: VecDeque<String>) -> Self {
        UpdateManager { queue }
    }

    pub fn updater(&self) -> usize {
        self.queue.len()
    }
}

pub async fn latest_version(client: &reqwest::Client) -> reqwest::Result<String> {
    // self_update::backends::github::Update::configure() was dropped with the CLI.
    client.get("https://api.example.com/version").send().await?.text().await
}

pub fn run() {
    let _ = Update::configure();
    let manager = UpdateManager::new(VecDeque::new());
    let _ = manager.updater();
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
