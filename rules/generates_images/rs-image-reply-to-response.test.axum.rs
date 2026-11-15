// lexcode-expect: 11
// Sinks, axum and tungstenite: a picture an image model made, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, types::CreateImageRequest, Client};
use axum::body::Body;
use axum::extract::ws::{Message, WebSocket};
use axum::response::sse::{Event, Sse};
use axum::response::{Html, IntoResponse, Response};
use axum::{Json, Router};
use futures::stream;
use tokio_tungstenite::tungstenite::Message as TungsteniteMessage;

async fn json_reply(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Json<String> {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    Json(out)
}

async fn html_reply(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Html<String> {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    Html(out)
}

async fn body_reply(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Response {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    let body = Body::from(out);
    Response::new(body)
}

async fn event_reply(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Event {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    Event::default().data(out)
}

async fn event_json_reply(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Event {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    Event::default().json_data(out).unwrap()
}

async fn sse_reply(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> impl IntoResponse {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    let events = stream::iter(vec![out]);
    Sse::new(events)
}

async fn socket_reply(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Message {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    Message::Text(out.into())
}

async fn socket_bytes_reply(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Message {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    Message::Binary(out.into())
}

async fn into_reply(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Response {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    out.into_response()
}

async fn builder_reply(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Response {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    Response::builder()
        .header("content-type", "text/plain")
        .body(Body::new(out))
        .unwrap()
}

async fn tungstenite_reply(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> TungsteniteMessage {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    TungsteniteMessage::Text(out.into())
}
