// lexcode-expect: 12
// Text a model wrote, sent to the person who asked, with every crate imported
// the way its own documentation does: paths inside `use` groups. The engine does not resolve
// those, so these are read by the rule's short forms, in a file whose use lines name the crate.
use async_openai::{
    config::OpenAIConfig,
    types::{CreateChatCompletionRequest, CreateChatCompletionRequestArgs},
    Client,
};
use llama_cpp_2::{model::{LlamaModel, Special}, sampling::LlamaSampler};
use ollama_rs::{generation::completion::request::GenerationRequest, Ollama};
use axum::{
    body::Body,
    extract::{ws::Message, State},
    response::{sse::{Event, Sse}, Html, IntoResponse, Response},
    routing::get,
    Json, Router,
};
use futures::stream;

pub async fn axum_json(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Json<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Json(out)
}

pub async fn axum_html(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Html<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Html(out)
}

pub async fn axum_body(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Body {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Body::from(out)
}

pub async fn axum_event(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Event {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Event::default().data(out)
}

pub async fn axum_socket(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Message {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Message::Text(out.into())
}

pub async fn axum_builder(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Response {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Response::builder().status(200).body(Body::new(out)).unwrap()
}

pub async fn axum_event_json(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Event {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Event::default().json_data(out).unwrap()
}

pub async fn axum_sse(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> impl IntoResponse {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Sse::new(stream::iter(vec![out]))
}

pub async fn axum_socket_bytes(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Message {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Message::Binary(out.into())
}

pub async fn axum_response_new(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Response {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Response::new(out.into())
}

pub async fn ollama_generate(ollama: &Ollama, prompt: String) -> Json<String> {
    let response = ollama.generate(GenerationRequest::new("llama3.2".to_string(), prompt)).await.unwrap();
    Json(response.response)
}

pub async fn llama_local(model: &LlamaModel, ctx: &mut llama_cpp_2::context::LlamaContext<'_>, n: i32) -> Json<String> {
    let mut sampler = LlamaSampler::greedy();
    let token = sampler.sample(ctx, n - 1);
    Json(model.token_to_str(token, Special::Tokenize).unwrap())
}
