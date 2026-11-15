// lexcode-expect: 10
// A Gemini response, sent through Rocket, poem-openapi and tokio-tungstenite, each
// imported through a path inside a `use` group.
use gemini_rust::{Gemini, Message as GeminiMessage};
use poem_openapi::{payload::{Binary, PlainText}, OpenApi};
use rocket::{
    response::{content::{RawHtml, RawJson, RawText}, stream::Event},
    serde::json::Json,
    State,
};
use tokio_tungstenite::{connect_async, tungstenite::Message};

pub async fn rocket_json(gemini: &Gemini, prompt: String) -> Json<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Json(out)
}

pub async fn rocket_html(gemini: &Gemini, prompt: String) -> RawHtml<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    RawHtml(out)
}

pub async fn rocket_text(gemini: &Gemini, prompt: String) -> RawText<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    RawText(out)
}

pub async fn rocket_raw_json(gemini: &Gemini, prompt: String) -> RawJson<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    RawJson(out)
}

pub async fn rocket_event(gemini: &Gemini, prompt: String) -> Event {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Event::data(out)
}

pub async fn rocket_event_json(gemini: &Gemini, prompt: String) -> Event {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Event::json(&out)
}

pub async fn openapi_text(gemini: &Gemini, prompt: String) -> PlainText<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    PlainText(out)
}

pub async fn openapi_binary(gemini: &Gemini, prompt: String) -> Binary<Vec<u8>> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Binary(out.into())
}

pub async fn socket_text(gemini: &Gemini, prompt: String) -> Message {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Message::Text(out.into())
}

pub async fn socket_bytes(gemini: &Gemini, prompt: String) -> Message {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Message::Binary(out.into())
}
