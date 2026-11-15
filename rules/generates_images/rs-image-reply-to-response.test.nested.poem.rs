// lexcode-expect: 4
// A picture an image model made, sent through Poem's own web types, imported through paths
// inside a `use` group.
use async_openai::{
    config::OpenAIConfig,
    types::{CreateImageRequestArgs, ImageSize},
    Client,
};
use poem::{
    handler,
    web::{sse::Event, Html, Json},
    Body, Route,
};

pub async fn poem_json(client: &Client<OpenAIConfig>, prompt: String) -> Json<String> {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    Json(out)
}

pub async fn poem_html(client: &Client<OpenAIConfig>, prompt: String) -> Html<String> {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    Html(out)
}

pub async fn poem_body(client: &Client<OpenAIConfig>, prompt: String) -> Body {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    Body::from(out)
}

pub async fn poem_event(client: &Client<OpenAIConfig>, prompt: String) -> Event {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    Event::message(out)
}
