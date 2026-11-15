// lexcode-expect: 0
// The app's own Body and Message, in a file without axum's or tungstenite's use lines. Generated
// speech put in them goes to the team's audit log.
use async_openai::{config::OpenAIConfig, types::CreateSpeechRequest, Client};

pub struct Body(pub Vec<u8>);

pub enum Message {
    Text(String),
    Binary(Vec<u8>),
}

pub struct AuditLog;

impl AuditLog {
    pub fn record<T>(&self, _entry: T) {}
}

pub async fn audit_narration(client: &Client<OpenAIConfig>, request: CreateSpeechRequest, log: &AuditLog) {
    let speech = client.audio().speech().create(request).await.unwrap();
    log.record(Body(speech.bytes.to_vec()));
    log.record(Message::Binary(speech.bytes.to_vec()));
}
