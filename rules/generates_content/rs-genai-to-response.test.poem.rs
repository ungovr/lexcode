// lexcode-expect: 9
// Sinks, Poem, poem-openapi, Loco and Tauri: a Gemini response, sent to the person who asked, one sink per function.
use gemini_rust::Gemini;
use loco_rs::prelude::*;
use poem::web::Html;
use poem_openapi::payload;
use poem_openapi::payload::{Binary, PlainText};
use tauri::{AppHandle, Emitter};

async fn poem_html(gemini: &Gemini, prompt: String) -> Html<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Html(out)
}

async fn poem_json(gemini: &Gemini, prompt: String) -> poem::web::Json<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    poem::web::Json(out)
}

async fn openapi_text(gemini: &Gemini, prompt: String) -> PlainText<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    PlainText(out)
}

async fn openapi_json(gemini: &Gemini, prompt: String) -> payload::Json<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    payload::Json(out)
}

async fn openapi_binary(gemini: &Gemini, prompt: String) -> Binary<Vec<u8>> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Binary(out.into())
}

async fn loco_json(gemini: &Gemini, prompt: String) -> Result<Response> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    format::json(out)
}

async fn loco_text(gemini: &Gemini, prompt: String) -> Result<Response> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    format::text(&out)
}

#[tauri::command]
async fn tauri_command(gemini: &Gemini, prompt: String) -> Result<String, String> {
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
