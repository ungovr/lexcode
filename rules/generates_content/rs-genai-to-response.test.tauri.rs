// lexcode-expect: 4
// Sinks, Tauri and socketioxide: a Gemini response, sent to the person who asked, one sink per function.
use gemini_rust::Gemini;
use socketioxide::extract::SocketRef;
use tauri::{AppHandle, Emitter};

#[tauri::command]
async fn tauri_command(gemini: &Gemini, prompt: String) -> Result<String, String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Ok(out)
}

#[tauri::command]
fn tauri_command_sync(gemini: &Gemini, prompt: String) -> Result<String, String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Ok(out)
}

#[tauri::command]
async fn tauri_event(app: AppHandle, gemini: &Gemini, prompt: String) -> Result<(), String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    app.emit("reply", out).map_err(|e| e.to_string())
}

async fn socket_event(socket: SocketRef, gemini: &Gemini, prompt: String) {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    socket.emit("reply", &out).ok();
}
