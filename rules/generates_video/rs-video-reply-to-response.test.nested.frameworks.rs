// lexcode-expect: 10
// A clip a video model made, sent through Rocket, poem-openapi and tokio-tungstenite, each
// imported through a path inside a `use` group.
use async_openai::{
    config::OpenAIConfig,
    types::{CreateVideoRequestArgs, VideoSize},
    Client,
};
use poem_openapi::{payload::{Binary, PlainText}, OpenApi};
use rocket::{
    response::{content::{RawHtml, RawJson, RawText}, stream::Event},
    serde::json::Json,
    State,
};
use tokio_tungstenite::{connect_async, tungstenite::Message};

pub async fn rocket_json(client: &Client<OpenAIConfig>, prompt: String) -> Json<String> {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    Json(out)
}

pub async fn rocket_html(client: &Client<OpenAIConfig>, prompt: String) -> RawHtml<String> {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    RawHtml(out)
}

pub async fn rocket_text(client: &Client<OpenAIConfig>, prompt: String) -> RawText<String> {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    RawText(out)
}

pub async fn rocket_raw_json(client: &Client<OpenAIConfig>, prompt: String) -> RawJson<String> {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    RawJson(out)
}

pub async fn rocket_event(client: &Client<OpenAIConfig>, prompt: String) -> Event {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    Event::data(out)
}

pub async fn rocket_event_json(client: &Client<OpenAIConfig>, prompt: String) -> Event {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    Event::json(&out)
}

pub async fn openapi_text(client: &Client<OpenAIConfig>, prompt: String) -> PlainText<String> {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    PlainText(out)
}

pub async fn openapi_binary(client: &Client<OpenAIConfig>, prompt: String) -> Binary<Vec<u8>> {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    Binary(out.into())
}

pub async fn socket_text(client: &Client<OpenAIConfig>, prompt: String) -> Message {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    Message::Text(out.into())
}

pub async fn socket_bytes(client: &Client<OpenAIConfig>, prompt: String) -> Message {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    Message::Binary(out.into())
}
