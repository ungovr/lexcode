// lexcode-expect: 4
// Speech a text-to-speech model made, sent through Rocket, poem-openapi and tokio-tungstenite, each
// imported through a path inside a `use` group.
use async_openai::{
    config::OpenAIConfig,
    types::{CreateSpeechRequest, CreateSpeechRequestArgs},
    Client,
};
use poem_openapi::{payload::PlainText, OpenApi};
use rocket::{response::content::RawHtml, serde::json::Json, State};
use tokio_tungstenite::{connect_async, tungstenite::Message};

pub async fn rocket_json(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Json<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Json(out)
}

pub async fn rocket_html(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> RawHtml<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    RawHtml(out)
}

pub async fn openapi_text(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> PlainText<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    PlainText(out)
}

pub async fn socket_text(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Message {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Message::Text(out.into())
}
