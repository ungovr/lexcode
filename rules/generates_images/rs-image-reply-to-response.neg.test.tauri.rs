// lexcode-expect: 0
// A picture an image model made, handed to the app's own event bus (an `emit` that is
// neither Tauri's nor socketioxide's, in a file that imports neither), and a Tauri command
// that only logs it and returns nothing to the window.
use async_openai::{config::OpenAIConfig, types::CreateImageRequest, Client};

pub struct Bus;

impl Bus {
    pub fn emit<T>(&self, _event: &str, _payload: T) {}
}

pub async fn audit(client: &Client<OpenAIConfig>, request: CreateImageRequest, bus: &Bus) {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    bus.emit("digest-ready", out);
}

#[tauri::command]
async fn refresh_digest(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Result<(), String> {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    tracing::info!(len = out.len(), "digest refreshed");
    Ok(())
}
