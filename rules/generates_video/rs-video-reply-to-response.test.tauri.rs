// lexcode-expect: 4
// Sinks, Tauri and socketioxide: a clip a video model made, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, Client};
use socketioxide::extract::SocketRef;
use tauri::{AppHandle, Emitter};

#[tauri::command]
async fn tauri_command(client: &Client<OpenAIConfig>, video_id: String) -> Result<String, String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    Ok(out)
}

#[tauri::command]
fn tauri_command_sync(client: &Client<OpenAIConfig>, video_id: String) -> Result<String, String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    Ok(out)
}

#[tauri::command]
async fn tauri_event(app: AppHandle, client: &Client<OpenAIConfig>, video_id: String) -> Result<(), String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    app.emit("reply", out).map_err(|e| e.to_string())
}

async fn socket_event(socket: SocketRef, client: &Client<OpenAIConfig>, video_id: String) {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    socket.emit("reply", &out).ok();
}
