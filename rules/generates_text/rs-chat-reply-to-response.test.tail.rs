// lexcode-expect: 4
// A handler that returns the model's text with no response wrapper: axum turns a String, an
// `impl IntoResponse` or a `Result<String, E>` into the response, and so do Rocket and Poem.
use async_openai::types::CreateChatCompletionRequest;
use async_openai::{config::OpenAIConfig, Client};
use axum::extract::State;
use axum::response::IntoResponse;

pub async fn ask(State(client): State<Client<OpenAIConfig>>, request: CreateChatCompletionRequest) -> String {
    let response = client.chat().create(request).await.unwrap();
    response.choices[0].message.content.clone().unwrap_or_default()
}

pub async fn ask_any(State(client): State<Client<OpenAIConfig>>, request: CreateChatCompletionRequest) -> impl IntoResponse {
    let response = client.chat().create(request).await.unwrap();
    let text = response.choices[0].message.content.clone().unwrap_or_default();
    text
}

pub async fn ask_or_fail(State(client): State<Client<OpenAIConfig>>, request: CreateChatCompletionRequest) -> Result<String, AppError> {
    let response = client.chat().create(request).await?;
    Ok(response.choices[0].message.content.clone().unwrap_or_default())
}

#[rocket::post("/ask")]
pub async fn ask_rocket(client: &rocket::State<Client<OpenAIConfig>>, request: CreateChatCompletionRequest) -> String {
    let response = client.chat().create(request).await.unwrap();
    response.choices[0].message.content.clone().unwrap_or_default()
}
