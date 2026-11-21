// lexcode-expect: 3
// Twilio's OpenAPI-generated client, imported from its message and call modules and by full path.
use openapi::apis::api20100401_call_api::{create_call, CreateCallParams};
use openapi::apis::api20100401_message_api::{create_message, CreateMessageParams};
use openapi::apis::configuration::Configuration;

pub async fn notify(config: &Configuration, account_sid: String, to: String, from: String, body: String) {
    let params = CreateMessageParams { account_sid: account_sid.clone(), to: to.clone(), from: Some(from.clone()), body: Some(body), ..Default::default() };
    create_message(config, params).await.unwrap();
    let call = CreateCallParams { account_sid, to, from, url: Some("https://example.com/twiml".into()), ..Default::default() };
    create_call(config, call).await.unwrap();
}

pub async fn notify_by_path(config: &Configuration, params: CreateMessageParams) {
    openapi::apis::api20100401_message_api::create_message(config, params).await.unwrap();
}
