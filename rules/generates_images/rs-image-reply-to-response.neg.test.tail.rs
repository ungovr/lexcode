// lexcode-expect: 0
// A helper returning the picture's bytes to its caller, with no extractor or route attribute.
use async_openai::types::CreateImageRequest;
use async_openai::{config::OpenAIConfig, Client};
use axum::extract::State;

pub async fn render(client: &Client<OpenAIConfig>, request: CreateImageRequest) -> Vec<u8> {
    let response = client.images().generate(request).await.unwrap();
    decode_first(&response)
}
