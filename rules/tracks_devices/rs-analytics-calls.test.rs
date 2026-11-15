// lexcode-expect: 7
use posthog_rs as ph;
use posthog_rs::{ClientOptionsBuilder, Event};
use segment as sg;
use segment::{Client, HttpClient};
use serde_json::json;

const GA_COLLECT: &str = "https://www.google-analytics.com/mp/collect";

pub async fn signed_up(write_key: String, user_id: &str) {
    let client = HttpClient::default();
    let msg = segment::message::Track {
        user: segment::message::User::UserId { user_id: user_id.to_owned() },
        event: "Signed Up".to_owned(),
        properties: json!({ "plan": "free" }),
        ..Default::default()
    };
    let _ = client.send(write_key, msg.into()).await;
}

pub fn batcher(write_key: String) -> sg::AutoBatcher {
    let http = sg::HttpClient::default();
    let batch = sg::Batcher::new(None);
    sg::AutoBatcher::new(http, batch, write_key)
}

pub async fn captured(key: &str, user_id: &str) {
    let client = ph::client(key).await;
    let mut event = Event::new("checkout", user_id);
    event.insert_prop("total", 42).unwrap();
    let _ = client.capture(event).await;
}

pub fn measurement_url(measurement_id: &str, secret: &str) -> String {
    format!("{}?measurement_id={}&api_secret={}", GA_COLLECT, measurement_id, secret)
}
