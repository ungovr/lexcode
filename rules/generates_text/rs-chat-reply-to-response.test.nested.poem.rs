// lexcode-expect: 4
// Text a model wrote, sent through Poem's own web types, imported through paths
// inside a `use` group.
use async_openai::{
    config::OpenAIConfig,
    types::{CreateChatCompletionRequest, CreateChatCompletionRequestArgs},
    Client,
};
use llama_cpp_2::{model::{LlamaModel, Special}, sampling::LlamaSampler};
use ollama_rs::{generation::completion::request::GenerationRequest, Ollama};
use poem::{
    handler,
    web::{sse::Event, Html, Json},
    Body, Route,
};

pub async fn poem_json(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Json<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Json(out)
}

pub async fn poem_html(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Html<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Html(out)
}

pub async fn poem_body(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Body {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Body::from(out)
}

pub async fn poem_event(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Event {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Event::message(out)
}
