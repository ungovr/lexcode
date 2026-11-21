// lexcode-expect: 0
// A helper returning the clip's bytes to its caller, with no extractor or route attribute.
use async_openai::{config::OpenAIConfig, Client};
use axum::extract::State;

pub async fn fetch_clip(client: &Client<OpenAIConfig>, id: String) -> Vec<u8> {
    let clip = client.videos().download_content(&id).await.unwrap();
    clip.to_vec()
}
