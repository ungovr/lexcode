// lexcode-expect: 6
// A picture an image model made, sent to the person who asked, with every crate imported
// the way its own documentation does: paths inside `use` groups. The engine does not resolve
// those, so these are read by the rule's short forms, in a file whose use lines name the crate.
use async_openai::{
    config::OpenAIConfig,
    types::{CreateImageRequestArgs, ImageSize},
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
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    Json(out)
}

pub async fn axum_html(client: &Client<OpenAIConfig>, prompt: String) -> Html<String> {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    Html(out)
}

pub async fn axum_body(client: &Client<OpenAIConfig>, prompt: String) -> Body {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    Body::from(out)
}

pub async fn axum_event(client: &Client<OpenAIConfig>, prompt: String) -> Event {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    Event::default().data(out)
}

pub async fn axum_socket(client: &Client<OpenAIConfig>, prompt: String) -> Message {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    Message::Text(out.into())
}

pub async fn axum_builder(client: &Client<OpenAIConfig>, prompt: String) -> Response {
    let request = CreateImageRequestArgs::default().prompt(prompt).size(ImageSize::S1024x1024).build().unwrap();
    let response = client.images().create(request).await.unwrap();
    let out = first_url(response);
    Response::builder().status(200).body(Body::new(out)).unwrap()
}
