// lexcode-expect: 4
// Sinks, Tauri and socketioxide: a picture an image model made, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, types::CreateImageRequest, Client};
use socketioxide::extract::SocketRef;
use tauri::{AppHandle, Emitter};

#[tauri::command]
async fn tauri_command(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Result<String, String> {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    Ok(out)
}

#[tauri::command]
fn tauri_command_sync(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Result<String, String> {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    Ok(out)
}

#[tauri::command]
async fn tauri_event(app: AppHandle, client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Result<(), String> {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    app.emit("reply", out).map_err(|e| e.to_string())
}

async fn socket_event(socket: SocketRef, client: &Client<OpenAIConfig>, request: CreateImageRequest) {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    socket.emit("reply", &out).ok();
}
