// lexcode-expect: 1
// A daily text from a timer through Twilio's OpenAPI-generated client, by full path.
use std::time::Duration;

use openapi::apis::configuration::Configuration;

pub async fn daily(config: Configuration, params: openapi::apis::api20100401_message_api::CreateMessageParams) {
    let mut interval = tokio::time::interval(Duration::from_secs(86400));
    loop {
        interval.tick().await;
        openapi::apis::api20100401_message_api::create_message(&config, params.clone()).await.unwrap();
    }
}
