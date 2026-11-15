// lexcode-expect: 0
// Speech a text-to-speech model made, handed to the app's own event bus (an `emit` that is
// neither Tauri's nor socketioxide's, in a file that imports neither), and a Tauri command
// that only logs it and returns nothing to the window.
use async_openai::{config::OpenAIConfig, types::CreateSpeechRequest, Client};

pub struct Bus;

impl Bus {
    pub fn emit<T>(&self, _event: &str, _payload: T) {}
}

pub async fn audit(client: &Client<OpenAIConfig>, request: CreateSpeechRequest, bus: &Bus) {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    bus.emit("digest-ready", out);
}

#[tauri::command]
async fn refresh_digest(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Result<(), String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    tracing::info!(len = out.len(), "digest refreshed");
    Ok(())
}
