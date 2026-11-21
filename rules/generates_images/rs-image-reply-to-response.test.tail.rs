// lexcode-expect: 1
// A picture returned from a handler as bare bytes (`-> Vec<u8>`), which axum sends as the body.
use async_openai::types::CreateImageRequest;
use async_openai::{config::OpenAIConfig, Client};
use axum::extract::State;
use axum::Json;

pub async fn draw(State(client): State<Client<OpenAIConfig>>, Json(request): Json<CreateImageRequest>) -> Vec<u8> {
    let response = client.images().generate(request).await.unwrap();
    decode_first(&response)
}
