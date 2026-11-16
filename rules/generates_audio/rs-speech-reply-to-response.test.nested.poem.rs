// lexcode-expect: 4
// Speech a text-to-speech model made, sent through Poem's own web types, imported through paths
// inside a `use` group.
use async_openai::{
    config::OpenAIConfig,
    types::{CreateSpeechRequest, CreateSpeechRequestArgs},
    Client,
};
use poem::{
    handler,
    web::{sse::Event, Html, Json},
    Body, Route,
};

pub async fn poem_json(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Json<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Json(out)
}

pub async fn poem_html(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Html<String> {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Html(out)
}

pub async fn poem_body(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Body {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Body::from(out)
}

pub async fn poem_event(client: &Client<OpenAIConfig>, request: CreateSpeechRequest) -> Event {
    let speech = client.audio().speech().create(request).await.unwrap();
    let out = speech.bytes;
    Event::message(out)
}
