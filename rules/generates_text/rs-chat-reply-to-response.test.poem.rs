// lexcode-expect: 7
// Sinks, Poem, poem-openapi and Loco: text a chat model wrote, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, types::CreateChatCompletionRequest, Client};
use loco_rs::prelude::*;
use poem::web::Html;
use poem_openapi::payload;
use poem_openapi::payload::{Binary, PlainText};

async fn poem_html(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Html<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Html(out)
}

async fn poem_json(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> poem::web::Json<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    poem::web::Json(out)
}

async fn openapi_text(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> PlainText<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    PlainText(out)
}

async fn openapi_json(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> payload::Json<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    payload::Json(out)
}

async fn openapi_binary(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Binary<Vec<u8>> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Binary(out.into())
}

async fn loco_json(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Result<Response> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    format::json(out)
}

async fn loco_text(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Result<Response> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    format::text(&out)
}
