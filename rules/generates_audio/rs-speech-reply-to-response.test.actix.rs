// lexcode-expect: 8
// Sinks, actix-web, hyper and http: speech a text-to-speech model made, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, types::CreateSpeechRequest, Client};
use actix_web::{web, HttpResponse};
use http_body_util::Full;
use hyper::Response;

async fn actix_json(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> web::Json<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    web::Json(out)
}

async fn actix_body(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> HttpResponse {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    HttpResponse::Ok()
        .content_type("text/plain")
        .body(out)
}

async fn actix_json_builder(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> HttpResponse {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    HttpResponse::Ok().json(out)
}

async fn actix_stream(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> HttpResponse {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    HttpResponse::build(actix_web::http::StatusCode::OK).streaming(out)
}

async fn hyper_new(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Response<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Response::new(out)
}

async fn http_new(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> http::Response<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    http::Response::new(out)
}

async fn hyper_full(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Full<Bytes> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Full::new(out.into())
}

async fn http_builder(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> http::Response<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    http::Response::builder().status(200).body(out).unwrap()
}
