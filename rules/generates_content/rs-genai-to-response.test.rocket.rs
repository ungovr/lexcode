// lexcode-expect: 8
// Sinks, Rocket and warp: a Gemini response, sent to the person who asked, one sink per function.
use gemini_rust::Gemini;
use rocket::response::content::{RawHtml, RawText};
use rocket::response::stream::Event;
use rocket::serde::json::Json;
use warp::reply;
use warp::ws::Message;

async fn rocket_json(gemini: &Gemini, prompt: String) -> Json<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Json(out)
}

async fn rocket_html(gemini: &Gemini, prompt: String) -> RawHtml<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    RawHtml(out)
}

async fn rocket_text(gemini: &Gemini, prompt: String) -> RawText<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    RawText(out)
}

async fn rocket_event(gemini: &Gemini, prompt: String) -> Event {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Event::data(out)
}

async fn warp_json(gemini: &Gemini, prompt: String) -> reply::Json {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    reply::json(&out)
}

async fn warp_html(gemini: &Gemini, prompt: String) -> impl warp::Reply {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    reply::html(out)
}

async fn warp_socket(gemini: &Gemini, prompt: String) -> Message {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Message::text(out)
}

async fn warp_event(gemini: &Gemini, prompt: String) -> warp::sse::Event {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    warp::sse::Event::default().data(out)
}
