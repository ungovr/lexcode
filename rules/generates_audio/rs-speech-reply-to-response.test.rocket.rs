// lexcode-expect: 8
// Sinks, Rocket and warp: speech a text-to-speech model made, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, types::CreateSpeechRequest, Client};
use rocket::response::content::{RawHtml, RawText};
use rocket::response::stream::Event;
use rocket::serde::json::Json;
use warp::reply;
use warp::ws::Message;

async fn rocket_json(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Json<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Json(out)
}

async fn rocket_html(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> RawHtml<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    RawHtml(out)
}

async fn rocket_text(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> RawText<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    RawText(out)
}

async fn rocket_event(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Event {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Event::data(out)
}

async fn warp_json(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> reply::Json {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    reply::json(&out)
}

async fn warp_html(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> impl warp::Reply {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    reply::html(out)
}

async fn warp_socket(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Message {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Message::text(out)
}

async fn warp_event(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> warp::sse::Event {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    warp::sse::Event::default().data(out)
}
