// lexcode-expect: 1
// Speech returned from a handler as bare bytes (`-> Vec<u8>`), which axum sends as the body.
use async_openai::types::CreateSpeechRequest;
use async_openai::{config::OpenAIConfig, Client};
use axum::extract::State;

pub async fn narrate(State(client): State<Client<OpenAIConfig>>, request: CreateSpeechRequest) -> Vec<u8> {
    let speech = client.audio().speech().create(request).await.unwrap();
    speech.bytes.to_vec()
}
