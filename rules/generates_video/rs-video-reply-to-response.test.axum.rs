// lexcode-expect: 11
// Sinks, axum and tungstenite: a clip a video model made, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, Client};
use axum::body::Body;
use axum::extract::ws::{Message, WebSocket};
use axum::response::sse::{Event, Sse};
use axum::response::{Html, IntoResponse, Response};
use axum::{Json, Router};
use futures::stream;
use tokio_tungstenite::tungstenite::Message as TungsteniteMessage;

async fn json_reply(client: &Client<OpenAIConfig>, video_id: String) -> Json<String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    Json(out)
}

async fn html_reply(client: &Client<OpenAIConfig>, video_id: String) -> Html<String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    Html(out)
}

async fn body_reply(client: &Client<OpenAIConfig>, video_id: String) -> Response {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    let body = Body::from(out);
    Response::new(body)
}

async fn event_reply(client: &Client<OpenAIConfig>, video_id: String) -> Event {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    Event::default().data(out)
}

async fn event_json_reply(client: &Client<OpenAIConfig>, video_id: String) -> Event {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    Event::default().json_data(out).unwrap()
}

async fn sse_reply(client: &Client<OpenAIConfig>, video_id: String) -> impl IntoResponse {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    let events = stream::iter(vec![out]);
    Sse::new(events)
}

async fn socket_reply(client: &Client<OpenAIConfig>, video_id: String) -> Message {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    Message::Text(out.into())
}

async fn socket_bytes_reply(client: &Client<OpenAIConfig>, video_id: String) -> Message {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    Message::Binary(out.into())
}

async fn into_reply(client: &Client<OpenAIConfig>, video_id: String) -> Response {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    out.into_response()
}

async fn builder_reply(client: &Client<OpenAIConfig>, video_id: String) -> Response {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    Response::builder()
        .header("content-type", "text/plain")
        .body(Body::new(out))
        .unwrap()
}

async fn tungstenite_reply(client: &Client<OpenAIConfig>, video_id: String) -> TungsteniteMessage {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    TungsteniteMessage::Text(out.into())
}
