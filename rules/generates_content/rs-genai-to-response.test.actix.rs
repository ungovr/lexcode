// lexcode-expect: 8
// Sinks, actix-web, hyper and http: a Gemini response, sent to the person who asked, one sink per function.
use gemini_rust::Gemini;
use actix_web::{web, HttpResponse};
use http_body_util::Full;
use hyper::Response;

async fn actix_json(gemini: &Gemini, prompt: String) -> web::Json<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    web::Json(out)
}

async fn actix_body(gemini: &Gemini, prompt: String) -> HttpResponse {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    HttpResponse::Ok()
        .content_type("text/plain")
        .body(out)
}

async fn actix_json_builder(gemini: &Gemini, prompt: String) -> HttpResponse {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    HttpResponse::Ok().json(out)
}

async fn actix_stream(gemini: &Gemini, prompt: String) -> HttpResponse {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    HttpResponse::build(actix_web::http::StatusCode::OK).streaming(out)
}

async fn hyper_new(gemini: &Gemini, prompt: String) -> Response<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Response::new(out)
}

async fn http_new(gemini: &Gemini, prompt: String) -> http::Response<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    http::Response::new(out)
}

async fn hyper_full(gemini: &Gemini, prompt: String) -> Full<Bytes> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Full::new(out.into())
}

async fn http_builder(gemini: &Gemini, prompt: String) -> http::Response<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    http::Response::builder().status(200).body(out).unwrap()
}
