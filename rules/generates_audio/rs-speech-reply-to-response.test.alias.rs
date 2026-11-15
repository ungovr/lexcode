// lexcode-expect: 2
// The crate items the rule names, reached through `use <crate> as <alias>`.
use async_openai::{config::OpenAIConfig, types::CreateSpeechRequest, Client};
use axum as ax;
use tokio_tungstenite as tt;

pub async fn narrate(client: Client<OpenAIConfig>, request: CreateSpeechRequest) -> ax::body::Body {
    let speech = client.audio().speech().create(request).await.unwrap();
    ax::body::Body::from(speech.bytes)
}

pub async fn narrate_socket(client: Client<OpenAIConfig>, request: CreateSpeechRequest) -> tt::tungstenite::Message {
    let speech = client.audio().speech().create(request).await.unwrap();
    tt::tungstenite::Message::Binary(speech.bytes)
}
