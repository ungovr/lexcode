// lexcode-expect: 4
// Sinks, Tauri and socketioxide: text a chat model wrote, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, types::CreateChatCompletionRequest, Client};
use socketioxide::extract::SocketRef;
use tauri::{AppHandle, Emitter};

#[tauri::command]
async fn tauri_command(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Result<String, String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Ok(out)
}

#[tauri::command]
fn tauri_command_sync(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Result<String, String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Ok(out)
}

#[tauri::command]
async fn tauri_event(app: AppHandle, client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Result<(), String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    app.emit("reply", out).map_err(|e| e.to_string())
}

async fn socket_event(socket: SocketRef, client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    socket.emit("reply", &out).ok();
}
