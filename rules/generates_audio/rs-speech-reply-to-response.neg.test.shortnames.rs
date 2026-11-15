// lexcode-expect: 0
// Speech a text-to-speech model made, kept by the team: the file imports axum's State and
// Json, and nothing else of axum's, so Message, Html and Event here are the app's own types and
// Body is reqwest's, on a request posted to the team's own webhook.
use async_openai::{config::OpenAIConfig, types::CreateSpeechRequest, Client};
use axum::extract::State;
use axum::Json;
use reqwest::Body;

pub enum Message {
    Text(String),
    Binary(Vec<u8>),
}

pub struct Html(pub String);

pub struct Event;

impl Event {
    pub fn default() -> Self {
        Event
    }
    pub fn data<T>(self, _payload: T) -> Self {
        self
    }
}

pub async fn archive(client: &Client<OpenAIConfig>, request: CreateSpeechRequest, store: &Archive) {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    store.save(Message::Text(format_out(&out)));
}

pub async fn archive_bytes(client: &Client<OpenAIConfig>, request: CreateSpeechRequest, store: &Archive) {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    store.save(Message::Binary(to_bytes(&out)));
}

pub async fn notify_team(client: &Client<OpenAIConfig>, request: CreateSpeechRequest, http: &reqwest::Client) {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    http.post("https://team.example/hook").body(Body::from(to_bytes(&out))).send().await.unwrap();
}

pub async fn audit_page(client: &Client<OpenAIConfig>, request: CreateSpeechRequest, store: &Archive) {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    store.save(Html(format_out(&out)));
}

pub async fn audit_event(client: &Client<OpenAIConfig>, request: CreateSpeechRequest, store: &Archive) {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    store.save(Event::default().data(format_out(&out)));
}
