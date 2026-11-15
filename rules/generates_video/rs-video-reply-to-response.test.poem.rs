// lexcode-expect: 7
// Sinks, Poem, poem-openapi and Loco: a clip a video model made, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, Client};
use loco_rs::prelude::*;
use poem::web::Html;
use poem_openapi::payload;
use poem_openapi::payload::{Binary, PlainText};

async fn poem_html(client: &Client<OpenAIConfig>, video_id: String) -> Html<String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    Html(out)
}

async fn poem_json(client: &Client<OpenAIConfig>, video_id: String) -> poem::web::Json<String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    poem::web::Json(out)
}

async fn openapi_text(client: &Client<OpenAIConfig>, video_id: String) -> PlainText<String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    PlainText(out)
}

async fn openapi_json(client: &Client<OpenAIConfig>, video_id: String) -> payload::Json<String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    payload::Json(out)
}

async fn openapi_binary(client: &Client<OpenAIConfig>, video_id: String) -> Binary<Vec<u8>> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    Binary(out.into())
}

async fn loco_json(client: &Client<OpenAIConfig>, video_id: String) -> Result<Response> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    format::json(out)
}

async fn loco_text(client: &Client<OpenAIConfig>, video_id: String) -> Result<Response> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    format::text(&out)
}
