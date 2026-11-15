// lexcode-expect: 4
// A clip a video model made, sent through Poem's own web types, imported through paths
// inside a `use` group.
use async_openai::{
    config::OpenAIConfig,
    types::{CreateVideoRequestArgs, VideoSize},
    Client,
};
use poem::{
    handler,
    web::{sse::Event, Html, Json},
    Body, Route,
};

pub async fn poem_json(client: &Client<OpenAIConfig>, prompt: String) -> Json<String> {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    Json(out)
}

pub async fn poem_html(client: &Client<OpenAIConfig>, prompt: String) -> Html<String> {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    Html(out)
}

pub async fn poem_body(client: &Client<OpenAIConfig>, prompt: String) -> Body {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    Body::from(out)
}

pub async fn poem_event(client: &Client<OpenAIConfig>, prompt: String) -> Event {
    let request = CreateVideoRequestArgs::default().prompt(prompt).size(VideoSize::S1280x720).build().unwrap();
    let video = client.videos().create(request).await.unwrap();
    let out = video.id;
    Event::message(out)
}
