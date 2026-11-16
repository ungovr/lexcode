// lexcode-expect: 0
// A Gemini response, kept by the team: the file imports axum's State and
// Json, and nothing else of axum's, so Message, Html and Event here are the app's own types and
// Body is reqwest's, on a request posted to the team's own webhook.
use gemini_rust::Gemini;
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

pub async fn archive(gemini: &Gemini, prompt: String, store: &Archive) {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    store.save(Message::Text(format_out(&out)));
}

pub async fn archive_bytes(gemini: &Gemini, prompt: String, store: &Archive) {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    store.save(Message::Binary(to_bytes(&out)));
}

pub async fn notify_team(gemini: &Gemini, prompt: String, http: &reqwest::Client) {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    http.post("https://team.example/hook").body(Body::from(to_bytes(&out))).send().await.unwrap();
}

pub async fn audit_page(gemini: &Gemini, prompt: String, store: &Archive) {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    store.save(Html(format_out(&out)));
}

pub async fn audit_event(gemini: &Gemini, prompt: String, store: &Archive) {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    store.save(Event::default().data(format_out(&out)));
}
