// lexcode-expect: 6
// A clip a video model made, sent to the person who asked, with every crate imported
// the way its own documentation does: paths inside `use` groups. The engine does not resolve
// those, so these are read by the rule's short forms, in a file whose use lines name the crate.
use async_openai::{
    config::OpenAIConfig,
    types::{CreateVideoRequestArgs, VideoSize},
    Client,
};
use axum::{
    body::Body,
    extract::{ws::Message, State},
    response::{sse::Event, Html, IntoResponse, Response},
    routing::get,
    Json, Router,
};

pub async fn axum_json(client: &Client<OpenAIConfig>, prompt: String) -> Json<String> {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    Json(out)
}

pub async fn axum_html(client: &Client<OpenAIConfig>, prompt: String) -> Html<String> {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    Html(out)
}

pub async fn axum_body(client: &Client<OpenAIConfig>, prompt: String) -> Body {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    Body::from(out)
}

pub async fn axum_event(client: &Client<OpenAIConfig>, prompt: String) -> Event {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    Event::default().data(out)
}

pub async fn axum_socket(client: &Client<OpenAIConfig>, prompt: String) -> Message {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    Message::Text(out.into())
}

pub async fn axum_builder(client: &Client<OpenAIConfig>, prompt: String) -> Response {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    Response::builder().status(200).body(Body::new(out)).unwrap()
}
