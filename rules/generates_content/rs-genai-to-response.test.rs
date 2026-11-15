// lexcode-expect: 4
// A Gemini response, whose kind the code does not fix, sent back to the person who asked: the
// gemini-rust builder, and generateContent over HTTP on the Gemini API and on Vertex AI.
use axum::extract::State;
use axum::response::{Html, IntoResponse};
use axum::{Json, Router};
use gemini_rust::{Gemini, Message};

pub async fn answer(State(gemini): State<Gemini>, prompt: String) -> Json<String> {
    let response = gemini
        .generate_content()
        .with_system_prompt("Answer for a general reader.")
        .with_user_message(prompt)
        .execute()
        .await
        .unwrap();
    Json(response.text())
}

pub async fn page(State(gemini): State<Gemini>, messages: Vec<Message>) -> Html<String> {
    let response = gemini.generate_content().with_messages(messages).execute().await.unwrap();
    Html(render_parts(response))
}

pub async fn gemini_http(State(http): State<reqwest::Client>, model: String, key: String, body: serde_json::Value) -> Json<serde_json::Value> {
    let reply: serde_json::Value = http
        .post(format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
            model, key
        ))
        .json(&body)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    Json(reply)
}

pub async fn vertex_http(State(http): State<reqwest::Client>, body: serde_json::Value) -> Json<serde_json::Value> {
    let reply = http
        .post("https://us-central1-aiplatform.googleapis.com/v1/projects/p/locations/us-central1/publishers/google/models/gemini-2.5-flash:streamGenerateContent")
        .json(&body)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    Json(reply)
}
