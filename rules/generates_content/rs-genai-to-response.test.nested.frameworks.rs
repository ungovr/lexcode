// lexcode-expect: 4
// A Gemini response, sent through Rocket, poem-openapi and tokio-tungstenite, each
// imported through a path inside a `use` group.
use gemini_rust::{Gemini, Message as GeminiMessage};
use poem_openapi::{payload::PlainText, OpenApi};
use rocket::{response::content::RawHtml, serde::json::Json, State};
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

pub async fn openapi_text(gemini: &Gemini, prompt: String) -> PlainText<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    PlainText(out)
}

pub async fn socket_text(gemini: &Gemini, prompt: String) -> Message {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Message::Text(out.into())
}
