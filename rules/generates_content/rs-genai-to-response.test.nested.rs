// lexcode-expect: 6
// A Gemini response, sent to the person who asked, with every crate imported
// the way its own documentation does: paths inside `use` groups. The engine does not resolve
// those, so these are read by the rule's short forms, in a file whose use lines name the crate.
use gemini_rust::{Gemini, Message as GeminiMessage};
use axum::{
    body::Body,
    extract::{ws::Message, State},
    response::{sse::Event, Html, IntoResponse, Response},
    routing::get,
    Json, Router,
};

pub async fn axum_json(gemini: &Gemini, prompt: String) -> Json<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Json(out)
}

pub async fn axum_html(gemini: &Gemini, prompt: String) -> Html<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Html(out)
}

pub async fn axum_body(gemini: &Gemini, prompt: String) -> Body {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Body::from(out)
}

pub async fn axum_event(gemini: &Gemini, prompt: String) -> Event {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Event::default().data(out)
}

pub async fn axum_socket(gemini: &Gemini, prompt: String) -> Message {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Message::Text(out.into())
}

pub async fn axum_builder(gemini: &Gemini, prompt: String) -> Response {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Response::builder().status(200).body(Body::new(out)).unwrap()
}
