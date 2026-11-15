// lexcode-expect: 0
use twilio::{Client, OutboundMessage as TwilioMessage};

// An app's own types with the short names of library items, in a file without those crates.
pub struct OutboundMessage {
    pub to: String,
}

impl OutboundMessage {
    pub fn new(from: &str, to: &str, body: &str) -> Self {
        let _ = (from, body);
        Self { to: to.to_string() }
    }
}

pub struct DefaultNotificationBuilder;

impl DefaultNotificationBuilder {
    pub fn new() -> Self {
        Self
    }
}

pub fn lookalikes() {
    let _m = OutboundMessage::new("a", "b", "c");
    let _n = DefaultNotificationBuilder::new();
}

// The code a person asked for when signing in.
pub async fn sign_in_code(client: Client, phone: &str, code: &str) {
    client
        .send_message(TwilioMessage::new("+15550000000", phone, &format!("Your login code is {code}")))
        .await
        .unwrap();
}

// An event published to a topic is not a text to a person.
pub async fn event(sns: aws_sdk_sns::Client) {
    sns.publish().topic_arn("arn:aws:sns:us-east-1:1:orders").message("{}").send().await.unwrap();
}
