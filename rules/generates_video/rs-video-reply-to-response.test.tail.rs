// lexcode-expect: 1
// A clip returned from a handler as bare bytes (`-> Vec<u8>`), which axum sends as the body.
use async_openai::{config::OpenAIConfig, Client};
use axum::extract::{Path, State};

pub async fn clip(State(client): State<Client<OpenAIConfig>>, Path(id): Path<String>) -> Vec<u8> {
    let clip = client.videos().download_content(&id).await.unwrap();
    clip.to_vec()
}
