// lexcode-expect: 1
// A text to each subscriber through Twilio's OpenAPI-generated client.
use openapi::apis::api20100401_message_api::{create_message, CreateMessageParams};
use openapi::apis::configuration::Configuration;

pub async fn broadcast(config: &Configuration, subscribers: Vec<Subscriber>, sid: String, from: String) {
    for s in subscribers {
        let params = CreateMessageParams { account_sid: sid.clone(), to: s.phone, from: Some(from.clone()), body: Some("News".into()), ..Default::default() };
        create_message(config, params).await.unwrap();
    }
}
