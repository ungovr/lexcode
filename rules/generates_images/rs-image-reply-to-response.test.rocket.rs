// lexcode-expect: 8
// Sinks, Rocket and warp: a picture an image model made, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, types::CreateImageRequest, Client};
use rocket::response::content::{RawHtml, RawText};
use rocket::response::stream::Event;
use rocket::serde::json::Json;
use warp::reply;
use warp::ws::Message;

async fn rocket_json(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Json<String> {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    Json(out)
}

async fn rocket_html(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> RawHtml<String> {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    RawHtml(out)
}

async fn rocket_text(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> RawText<String> {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    RawText(out)
}

async fn rocket_event(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Event {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    Event::data(out)
}

async fn warp_json(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> reply::Json {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    reply::json(&out)
}

async fn warp_html(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> impl warp::Reply {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    reply::html(out)
}

async fn warp_socket(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Message {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    Message::text(out)
}

async fn warp_event(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> warp::sse::Event {
    let response = client.images().generate(request).await.unwrap();
    let out = response.data[0].b64_json.clone().unwrap_or_default();
    warp::sse::Event::default().data(out)
}
