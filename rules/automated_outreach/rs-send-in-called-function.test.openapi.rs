// lexcode-expect: 1
// A loop over subscribers that calls the app's own function, which texts through Twilio's
// OpenAPI-generated client.
use openapi::apis::api20100401_message_api::{create_message, CreateMessageParams};
use openapi::apis::configuration::Configuration;

pub async fn broadcast(config: &Configuration, subscribers: Vec<Subscriber>) {
    for s in subscribers {
        text_one(config, &s).await;
    }
}

async fn text_one(config: &Configuration, s: &Subscriber) {
    let params = CreateMessageParams { to: s.phone.clone(), body: Some("News".into()), ..Default::default() };
    create_message(config, params).await.unwrap();
}
