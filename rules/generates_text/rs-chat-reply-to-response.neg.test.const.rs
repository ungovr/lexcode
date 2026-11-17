// lexcode-expect: 0
// A `const` holding an address or model id that writes no text (embeddings), and a chat address
// held in a `const` that a settings page only shows.
use aws_sdk_bedrockruntime::{primitives::Blob, Client as BedrockClient};
use axum::extract::State;
use axum::Json;

const EMBED_URL: &str = "https://api.openai.com/v1/embeddings";
const EMBED_MODEL: &str = "amazon.titan-embed-text-v2:0";
const CHAT_URL: &str = "https://api.openai.com/v1/chat/completions";

pub async fn embed(State(http): State<reqwest::Client>, body: serde_json::Value) -> Json<serde_json::Value> {
    let vectors = http.post(EMBED_URL).json(&body).send().await.unwrap().json().await.unwrap();
    Json(vectors)
}

pub async fn embed_bedrock(State(client): State<BedrockClient>, body: Vec<u8>) -> Json<Vec<u8>> {
    let output = client
        .invoke_model()
        .model_id(EMBED_MODEL)
        .body(Blob::new(body))
        .send()
        .await
        .unwrap();
    Json(output.body.into_inner())
}

pub async fn settings() -> Json<String> {
    Json(CHAT_URL.to_string())
}
