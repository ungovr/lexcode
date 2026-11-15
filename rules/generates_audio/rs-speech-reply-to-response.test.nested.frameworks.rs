// lexcode-expect: 10
// Speech a text-to-speech model made, sent through Rocket, poem-openapi and tokio-tungstenite, each
// imported through a path inside a `use` group.
use async_openai::{
    config::OpenAIConfig,
    types::{CreateSpeechRequest, CreateSpeechRequestArgs},
    Client,
};
use poem_openapi::{payload::{Binary, PlainText}, OpenApi};
use rocket::{
    response::{content::{RawHtml, RawJson, RawText}, stream::Event},
    serde::json::Json,
    State,
};
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

pub async fn rocket_text(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> RawText<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    RawText(out)
}

pub async fn rocket_raw_json(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> RawJson<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    RawJson(out)
}

pub async fn rocket_event(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Event {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Event::data(out)
}

pub async fn rocket_event_json(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Event {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Event::json(&out)
}

pub async fn openapi_text(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> PlainText<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    PlainText(out)
}

pub async fn openapi_binary(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Binary<Vec<u8>> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Binary(out.into())
}

pub async fn socket_text(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Message {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Message::Text(out.into())
}

pub async fn socket_bytes(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Message {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Message::Binary(out.into())
}
