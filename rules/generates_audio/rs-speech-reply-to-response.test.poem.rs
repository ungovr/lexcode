// lexcode-expect: 9
// Sinks, Poem, poem-openapi, Loco and Tauri: speech a text-to-speech model made, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, types::CreateSpeechRequest, Client};
use loco_rs::prelude::*;
use poem::web::Html;
use poem_openapi::payload;
use poem_openapi::payload::{Binary, PlainText};
use tauri::{AppHandle, Emitter};

async fn poem_html(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Html<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Html(out)
}

async fn poem_json(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> poem::web::Json<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    poem::web::Json(out)
}

async fn openapi_text(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> PlainText<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    PlainText(out)
}

async fn openapi_json(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> payload::Json<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    payload::Json(out)
}

async fn openapi_binary(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Binary<Vec<u8>> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Binary(out.into())
}

async fn loco_json(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Result<Response> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    format::json(out)
}

async fn loco_text(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Result<Response> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    format::text(&out)
}

#[tauri::command]
async fn tauri_command(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Result<String, String> {
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
