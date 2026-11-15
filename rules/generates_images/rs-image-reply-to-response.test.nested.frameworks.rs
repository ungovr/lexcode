// lexcode-expect: 10
// A picture an image model made, sent through Rocket, poem-openapi and tokio-tungstenite, each
// imported through a path inside a `use` group.
use async_openai::{
    config::OpenAIConfig,
    types::{CreateImageRequestArgs, ImageSize},
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
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    Json(out)
}

pub async fn rocket_html(client: &Client<OpenAIConfig>, prompt: String) -> RawHtml<String> {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    RawHtml(out)
}

pub async fn rocket_text(client: &Client<OpenAIConfig>, prompt: String) -> RawText<String> {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    RawText(out)
}

pub async fn rocket_raw_json(client: &Client<OpenAIConfig>, prompt: String) -> RawJson<String> {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    RawJson(out)
}

pub async fn rocket_event(client: &Client<OpenAIConfig>, prompt: String) -> Event {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    Event::data(out)
}

pub async fn rocket_event_json(client: &Client<OpenAIConfig>, prompt: String) -> Event {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    Event::json(&out)
}

pub async fn openapi_text(client: &Client<OpenAIConfig>, prompt: String) -> PlainText<String> {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    PlainText(out)
}

pub async fn openapi_binary(client: &Client<OpenAIConfig>, prompt: String) -> Binary<Vec<u8>> {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    Binary(out.into())
}

pub async fn socket_text(client: &Client<OpenAIConfig>, prompt: String) -> Message {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    Message::Text(out.into())
}

pub async fn socket_bytes(client: &Client<OpenAIConfig>, prompt: String) -> Message {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    Message::Binary(out.into())
}
