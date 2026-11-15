// lexcode-expect: 0
// A Gemini response, handed to the app's own event bus (an `emit` that is
// neither Tauri's nor socketioxide's, in a file that imports neither), and a Tauri command
// that only logs it and returns nothing to the window.
use gemini_rust::Gemini;

pub struct Bus;

impl Bus {
    pub fn emit<T>(&self, _event: &str, _payload: T) {}
}

pub async fn audit(gemini: &Gemini, prompt: String, bus: &Bus) {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    bus.emit("digest-ready", out);
}

#[tauri::command]
async fn refresh_digest(gemini: &Gemini, prompt: String) -> Result<(), String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    tracing::info!(len = out.len(), "digest refreshed");
    Ok(())
}
