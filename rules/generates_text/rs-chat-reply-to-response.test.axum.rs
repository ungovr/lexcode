// lexcode-expect: 12
// Sinks, axum and tungstenite: text a chat model wrote, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, types::CreateChatCompletionRequest, Client};
use axum::body::Body;
use axum::extract::ws::{Message, WebSocket};
use axum::response::sse::{Event, Sse};
use axum::response::{Html, IntoResponse, Response};
use axum::{Json, Router};
use futures::stream;
use tokio_tungstenite::tungstenite::Message as TungsteniteMessage;

async fn json_reply(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Json<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Json(out)
}

async fn html_reply(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Html<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Html(out)
}

async fn body_reply(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Body {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Body::from(out)
}

async fn response_new(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Response {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Response::new(out.into())
}

async fn event_reply(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Event {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Event::default().data(out)
}

async fn event_json_reply(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Event {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Event::default().json_data(out).unwrap()
}

async fn sse_reply(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> impl IntoResponse {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    let events = stream::iter(vec![out]);
    Sse::new(events)
}

async fn socket_reply(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Message {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Message::Text(out.into())
}

async fn socket_bytes_reply(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Message {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Message::Binary(out.into())
}

async fn into_reply(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Response {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    out.into_response()
}

async fn builder_reply(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Response {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Response::builder()
        .header("content-type", "text/plain")
        .body(Body::new(out))
        .unwrap()
}

async fn tungstenite_reply(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> TungsteniteMessage {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    TungsteniteMessage::Text(out.into())
}
