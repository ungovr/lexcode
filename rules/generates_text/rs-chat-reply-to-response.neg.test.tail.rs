// lexcode-expect: 0
// A helper that returns the model's text to its caller is not a handler: it takes no extractor and
// carries no route attribute. A handler that calls the model and returns a fixed text sends
// nothing the model wrote.
use async_openai::types::CreateChatCompletionRequest;
use async_openai::{config::OpenAIConfig, Client};
use axum::extract::State;

pub async fn summarize(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> String {
    let response = client.chat().create(request).await.unwrap();
    response.choices[0].message.content.clone().unwrap_or_default()
}

pub async fn file_summary(State(client): State<Client<OpenAIConfig>>, request: CreateChatCompletionRequest) -> String {
    let response = client.chat().create(request).await.unwrap();
    store_summary(&response).await;
    "Saved".to_string()
}

#[tracing::instrument(skip(client))]
pub async fn label(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> String {
    let response = client.chat().create(request).await.unwrap();
    response.choices[0].message.content.clone().unwrap_or_default()
}
