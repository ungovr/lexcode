// lexcode-expect: 0
// A clip a video model made, handed to the app's own event bus (an `emit` that is
// neither Tauri's nor socketioxide's, in a file that imports neither), and a Tauri command
// that only logs it and returns nothing to the window.
use async_openai::{config::OpenAIConfig, Client};

pub struct Bus;

impl Bus {
    pub fn emit<T>(&self, _event: &str, _payload: T) {}
}

pub async fn audit(client: &Client<OpenAIConfig>, video_id: String, bus: &Bus) {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    bus.emit("digest-ready", out);
}

#[tauri::command]
async fn refresh_digest(client: &Client<OpenAIConfig>, video_id: String) -> Result<(), String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    tracing::info!(len = out.len(), "digest refreshed");
    Ok(())
}
