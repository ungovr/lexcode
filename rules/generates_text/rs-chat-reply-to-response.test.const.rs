// lexcode-expect: 4
// The chat endpoint and the Bedrock model id held in a `const`: in the file, in an `impl` and in
// the function.
use aws_sdk_bedrockruntime::{primitives::Blob, Client as BedrockClient};
use axum::extract::State;
use axum::Json;

const CHAT_URL: &str = "https://api.openai.com/v1/chat/completions";
const MODEL_ID: &str = "anthropic.claude-3-haiku-20240307-v1:0";

pub async fn chat(State(http): State<reqwest::Client>, body: serde_json::Value) -> Json<serde_json::Value> {
    let reply = http.post(CHAT_URL).json(&body).send().await.unwrap().json().await.unwrap();
    Json(reply)
}

pub async fn invoke(State(client): State<BedrockClient>, body: Vec<u8>) -> Json<Vec<u8>> {
    let output = client
        .invoke_model()
        .model_id(MODEL_ID)
        .body(Blob::new(body))
        .send()
        .await
        .unwrap();
    Json(output.body.into_inner())
}

pub struct Anthropic {
    http: reqwest::Client,
}

impl Anthropic {
    const MESSAGES: &'static str = "https://api.anthropic.com/v1/messages";

    pub async fn ask(&self, body: serde_json::Value) -> Json<serde_json::Value> {
        let reply = self.http.post(Self::MESSAGES).json(&body).send().await.unwrap().json().await.unwrap();
        Json(reply)
    }
}

pub async fn mistral(State(http): State<reqwest::Client>, body: serde_json::Value) -> Json<serde_json::Value> {
    const URL: &str = "https://api.mistral.ai/v1/chat/completions";
    let reply = http.post(URL).json(&body).send().await.unwrap().json().await.unwrap();
    Json(reply)
}
