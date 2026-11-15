// lexcode-expect: 8
// Sinks, Rocket and warp: a clip a video model made, sent to the person who asked, one sink per function.
use async_openai::{config::OpenAIConfig, Client};
use rocket::response::content::{RawHtml, RawText};
use rocket::response::stream::Event;
use rocket::serde::json::Json;
use warp::reply;
use warp::ws::Message;

async fn rocket_json(client: &Client<OpenAIConfig>, video_id: String) -> Json<String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    Json(out)
}

async fn rocket_html(client: &Client<OpenAIConfig>, video_id: String) -> RawHtml<String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    RawHtml(out)
}

async fn rocket_text(client: &Client<OpenAIConfig>, video_id: String) -> RawText<String> {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    RawText(out)
}

async fn rocket_event(client: &Client<OpenAIConfig>, video_id: String) -> Event {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    Event::data(out)
}

async fn warp_json(client: &Client<OpenAIConfig>, video_id: String) -> reply::Json {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    reply::json(&out)
}

async fn warp_html(client: &Client<OpenAIConfig>, video_id: String) -> impl warp::Reply {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    reply::html(out)
}

async fn warp_socket(client: &Client<OpenAIConfig>, video_id: String) -> Message {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    Message::text(out)
}

async fn warp_event(client: &Client<OpenAIConfig>, video_id: String) -> warp::sse::Event {
    let clip = client.videos().download_content(&video_id).await.unwrap();
    let out = clip.to_vec();
    warp::sse::Event::default().data(out)
}
