// lexcode-expect: 8
// Sinks, actix-web, hyper and http: a clip a video model made, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, Client};
use actix_web::{web, HttpResponse};
use http_body_util::Full;
use hyper::Response;

async fn actix_json(client: &Client<OpenAIConfig>, video_id: String) -> web::Json<String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    web::Json(out)
}

async fn actix_body(client: &Client<OpenAIConfig>, video_id: String) -> HttpResponse {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    HttpResponse::Ok()
        .content_type("text/plain")
        .body(out)
}

async fn actix_json_builder(client: &Client<OpenAIConfig>, video_id: String) -> HttpResponse {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    HttpResponse::Ok().json(out)
}

async fn actix_stream(client: &Client<OpenAIConfig>, video_id: String) -> HttpResponse {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    HttpResponse::build(actix_web::http::StatusCode::OK).streaming(out)
}

async fn hyper_new(client: &Client<OpenAIConfig>, video_id: String) -> Response<String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    Response::new(out)
}

async fn http_new(client: &Client<OpenAIConfig>, video_id: String) -> http::Response<String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    http::Response::new(out)
}

async fn hyper_full(client: &Client<OpenAIConfig>, video_id: String) -> Full<Bytes> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    Full::new(out.into())
}

async fn http_builder(client: &Client<OpenAIConfig>, video_id: String) -> http::Response<String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    http::Response::builder().status(200).body(out).unwrap()
}
