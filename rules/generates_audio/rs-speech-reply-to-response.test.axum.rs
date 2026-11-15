// lexcode-expect: 12
// Sinks, axum and tungstenite: speech a text-to-speech model made, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, types::CreateSpeechRequest, Client};
use axum::body::Body;
use axum::extract::ws::{Message, WebSocket};
use axum::response::sse::{Event, Sse};
use axum::response::{Html, IntoResponse, Response};
use axum::{Json, Router};
use futures::stream;
use tokio_tungstenite::tungstenite::Message as TungsteniteMessage;

async fn json_reply(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Json<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Json(out)
}

async fn html_reply(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Html<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Html(out)
}

async fn body_reply(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Body {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Body::from(out)
}

async fn response_new(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Response {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Response::new(out.into())
}

async fn event_reply(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Event {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Event::default().data(out)
}

async fn event_json_reply(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Event {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Event::default().json_data(out).unwrap()
}

async fn sse_reply(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> impl IntoResponse {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    let events = stream::iter(vec![out]);
    Sse::new(events)
}

async fn socket_reply(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Message {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Message::Text(out.into())
}

async fn socket_bytes_reply(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Message {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Message::Binary(out.into())
}

async fn into_reply(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Response {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    out.into_response()
}

async fn builder_reply(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Response {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Response::builder()
        .header("content-type", "text/plain")
        .body(Body::new(out))
        .unwrap()
}

async fn tungstenite_reply(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> TungsteniteMessage {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    TungsteniteMessage::Text(out.into())
}
