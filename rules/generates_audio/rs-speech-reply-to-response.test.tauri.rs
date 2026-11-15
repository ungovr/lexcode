// lexcode-expect: 4
// Sinks, Tauri and socketioxide: speech a text-to-speech model made, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, types::CreateSpeechRequest, Client};
use socketioxide::extract::SocketRef;
use tauri::{AppHandle, Emitter};

#[tauri::command]
async fn tauri_command(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Result<String, String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Ok(out)
}

#[tauri::command]
fn tauri_command_sync(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Result<String, String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Ok(out)
}

#[tauri::command]
async fn tauri_event(app: AppHandle, client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Result<(), String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    app.emit("reply", out).map_err(|e| e.to_string())
}

async fn socket_event(socket: SocketRef, client: &Client<OpenAIConfig>, request: CreateSpeechRequest) {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    socket.emit("reply", &out).ok();
}
