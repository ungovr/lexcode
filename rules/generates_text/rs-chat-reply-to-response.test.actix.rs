// lexcode-expect: 7
// Sinks, actix-web, hyper and http: text a chat model wrote, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, types::CreateChatCompletionRequest, Client};
use actix_web::{web, HttpResponse};
use http_body_util::Full;
use hyper::Response;

async fn actix_json(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> web::Json<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    web::Json(out)
}

async fn actix_body(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> HttpResponse {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    HttpResponse::Ok()
        .content_type("text/plain")
        .body(out)
}

async fn actix_json_builder(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> HttpResponse {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    HttpResponse::Ok().json(out)
}

async fn actix_stream(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> HttpResponse {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    HttpResponse::build(actix_web::http::StatusCode::OK).streaming(out)
}

async fn hyper_new(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Response<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Response::new(out)
}

async fn hyper_full(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> Full<Bytes> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    Full::new(out.into())
}

async fn http_builder(client: &Client<OpenAIConfig>, request: CreateChatCompletionRequest) -> http::Response<String> {
    let response = client.chat().create(request).await.unwrap();
    let out = response.choices[0].message.content.clone().unwrap_or_default();
    http::Response::builder().status(200).body(out).unwrap()
}
