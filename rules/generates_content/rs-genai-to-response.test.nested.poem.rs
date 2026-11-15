// lexcode-expect: 4
// A Gemini response, sent through Poem's own web types, imported through paths
// inside a `use` group.
use gemini_rust::{Gemini, Message as GeminiMessage};
use poem::{
    handler,
    web::{sse::Event, Html, Json},
    Body, Route,
};

pub async fn poem_json(gemini: &Gemini, prompt: String) -> Json<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Json(out)
}

pub async fn poem_html(gemini: &Gemini, prompt: String) -> Html<String> {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Html(out)
}

pub async fn poem_body(gemini: &Gemini, prompt: String) -> Body {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Body::from(out)
}

pub async fn poem_event(gemini: &Gemini, prompt: String) -> Event {
    let response = gemini.generate_content().with_user_message(prompt).execute().await.unwrap();
    let out = response.text();
    Event::message(out)
}
