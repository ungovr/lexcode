// lexcode-expect: 8
// Sinks, Rocket and warp: text a chat model wrote, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, types::CreateChatCompletionRequest, Client};
use rocket::response::content::{RawHtml, RawText};
use rocket::response::stream::Event;
use rocket::serde::json::Json;
use warp::reply;
use warp::ws::Message;

async fn rocket_json(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Json<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Json(out)
}

async fn rocket_html(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> RawHtml<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    RawHtml(out)
}

async fn rocket_text(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> RawText<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    RawText(out)
}

async fn rocket_event(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Event {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Event::data(out)
}

async fn warp_json(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> reply::Json {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    reply::json(&out)
}

async fn warp_html(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> impl warp::Reply {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    reply::html(out)
}

async fn warp_socket(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Message {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Message::text(out)
}

async fn warp_event(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> warp::sse::Event {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    warp::sse::Event::default().data(out)
}
