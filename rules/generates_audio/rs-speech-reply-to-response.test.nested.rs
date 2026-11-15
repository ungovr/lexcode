// lexcode-expect: 10
// Speech a text-to-speech model made, sent to the person who asked, with every crate imported
// the way its own documentation does: paths inside `use` groups. The engine does not resolve
// those, so these are read by the rule's short forms, in a file whose use lines name the crate.
use async_openai::{
    config::OpenAIConfig,
    types::{CreateSpeechRequest, CreateSpeechRequestArgs},
    Client,
};
use axum::{
    body::Body,
    extract::{ws::Message, State},
    response::{sse::{Event, Sse}, Html, IntoResponse, Response},
    routing::get,
    Json, Router,
};
use futures::stream;

pub async fn axum_json(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Json<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Json(out)
}

pub async fn axum_html(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Html<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Html(out)
}

pub async fn axum_body(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Body {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Body::from(out)
}

pub async fn axum_event(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Event {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Event::default().data(out)
}

pub async fn axum_socket(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Message {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Message::Text(out.into())
}

pub async fn axum_builder(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Response {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Response::builder().status(200).body(Body::new(out)).unwrap()
}

pub async fn axum_event_json(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Event {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Event::default().json_data(out).unwrap()
}

pub async fn axum_sse(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> impl IntoResponse {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Sse::new(stream::iter(vec![out]))
}

pub async fn axum_socket_bytes(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Message {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Message::Binary(out.into())
}

pub async fn axum_response_new(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Response {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Response::new(out.into())
}
