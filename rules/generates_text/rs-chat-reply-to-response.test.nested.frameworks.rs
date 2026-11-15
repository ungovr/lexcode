// lexcode-expect: 10
// Text a model wrote, sent through Rocket, poem-openapi and tokio-tungstenite, each
// imported through a path inside a `use` group.
use async_openai::{
    config::OpenAIConfig,
    types::{CreateChatCompletionRequest, CreateChatCompletionRequestArgs},
    Client,
};
use llama_cpp_2::{model::{LlamaModel, Special}, sampling::LlamaSampler};
use ollama_rs::{generation::completion::request::GenerationRequest, Ollama};
use poem_openapi::{payload::{Binary, PlainText}, OpenApi};
use rocket::{
    response::{content::{RawHtml, RawJson, RawText}, stream::Event},
    serde::json::Json,
    State,
};
use tokio_tungstenite::{connect_async, tungstenite::Message};

pub async fn rocket_json(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Json<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Json(out)
}

pub async fn rocket_html(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> RawHtml<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    RawHtml(out)
}

pub async fn rocket_text(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> RawText<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    RawText(out)
}

pub async fn rocket_raw_json(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> RawJson<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    RawJson(out)
}

pub async fn rocket_event(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Event {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Event::data(out)
}

pub async fn rocket_event_json(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Event {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Event::json(&out)
}

pub async fn openapi_text(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> PlainText<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    PlainText(out)
}

pub async fn openapi_binary(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Binary<Vec<u8>> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Binary(out.into())
}

pub async fn socket_text(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Message {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Message::Text(out.into())
}

pub async fn socket_bytes(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Message {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Message::Binary(out.into())
}
