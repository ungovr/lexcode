// lexcode-expect: 11
// Sinks, axum and tungstenite: a Gemini response, sent to the person who asked, one sink per function.
use gemini_rust::Gemini;
use axum::body::Body;
use axum::extract::ws::{Message, WebSocket};
use axum::response::sse::{Event, Sse};
use axum::response::{Html, IntoResponse, Response};
use axum::{Json, Router};
use futures::stream;
use tokio_tungstenite::tungstenite::Message as TungsteniteMessage;

async fn json_reply(gemini: &Gemini, prompt: String) -> Json<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Json(out)
}

async fn html_reply(gemini: &Gemini, prompt: String) -> Html<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Html(out)
}

async fn body_reply(gemini: &Gemini, prompt: String) -> Response {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    let body = Body::from(out);
    Response::new(body)
}

async fn event_reply(gemini: &Gemini, prompt: String) -> Event {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Event::default().data(out)
}

async fn event_json_reply(gemini: &Gemini, prompt: String) -> Event {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Event::default().json_data(out).unwrap()
}

async fn sse_reply(gemini: &Gemini, prompt: String) -> impl IntoResponse {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    let events = stream::iter(vec![out]);
    Sse::new(events)
}

async fn socket_reply(gemini: &Gemini, prompt: String) -> Message {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Message::Text(out.into())
}

async fn socket_bytes_reply(gemini: &Gemini, prompt: String) -> Message {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Message::Binary(out.into())
}

async fn into_reply(gemini: &Gemini, prompt: String) -> Response {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    out.into_response()
}

async fn builder_reply(gemini: &Gemini, prompt: String) -> Response {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Response::builder()
        .header("content-type", "text/plain")
        .body(Body::new(out))
        .unwrap()
}

async fn tungstenite_reply(gemini: &Gemini, prompt: String) -> TungsteniteMessage {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    TungsteniteMessage::Text(out.into())
}
