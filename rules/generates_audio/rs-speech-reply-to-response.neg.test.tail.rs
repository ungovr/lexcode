// lexcode-expect: 0
// A helper returning the speech's bytes to its caller, with no extractor or route attribute.
use async_openai::types::CreateSpeechRequest;
use async_openai::{config::OpenAIConfig, Client};
use axum::extract::State;

pub async fn synthesize(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Vec<u8> {
    let speech = client.audio().speech().create(request).await.unwrap();
    speech.bytes.to_vec()
}
